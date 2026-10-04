import { Schema, model, startSession } from "mongoose";
import { Event, Events } from "../models";
import { dateForDay, expandWeeklyEvents } from "../recurrence.ts";

const eventItemSchema = new Schema(
    {
        id: { type: String, maxlength: 100 },
        title: { type: String, required: true, trim: true, maxlength: 100 },
        href: String,
        category: { type: String, maxlength: 50 },
        categoryColor: { type: String, match: /^#[0-9a-f]{6}$/i },
        date: String,
        time: String,
        location: { type: String, maxlength: 120 },
        description: { type: String, maxlength: 1000 },
        notes: { type: String, maxlength: 1000 },
        recurrenceStart: String
    },
    { _id: false }
);

const weekdaySchema = new Schema(
    {
        day: { type: String, required: true, enum: [
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ] },
        oneTimeEvents: { type: [eventItemSchema], default: [] },
        recurringEvents: { type: [eventItemSchema], default: [] }
    },
    { _id: false }
);

const eventsSchema = new Schema(
    {
        id: { type: String, required: true },
        userid: { type: String, required: true },
        week: { type: Date, required: true },
        weekdays: { type: [weekdaySchema], default: [] }
    },
    { collection: "events" }
);

eventsSchema.index({ userid: 1, id: 1 }, { unique: true });

const EventsModel = model<Events>(
    "Events", 
    eventsSchema
);

async function get(id: string, userid: string): Promise<Events | undefined> {
    const [storedWeek, sourceWeeks] = await Promise.all([
        EventsModel.findOne({ id, userid }).lean(),
        EventsModel.find({
            userid,
            id: { $lte: id },
            "weekdays.recurringEvents.recurrenceStart": { $exists: true }
        }).lean()
    ]);
    return expandWeeklyEvents(id, userid, storedWeek ?? undefined, sourceWeeks);
}

async function addEvent(
    id: string,
    day: string,
    recurring: boolean,
    event: Event,
    userid: string
): Promise<Events> {
    const duplicate = await EventsModel.exists({
        userid,
        $or: [
            { "weekdays.oneTimeEvents.id": event.id },
            { "weekdays.recurringEvents.id": event.id }
        ]
    });
    if (duplicate) throw new Error("EVENT_ID_EXISTS");
    let events = await EventsModel.findOne({ id, userid });

    if (!events) {
        events = new EventsModel({
            id,
            userid,
            week: new Date(`${id}T00:00:00`),
            weekdays: []
        });
    }

    let weekday = events.weekdays.find((candidate) => candidate.day === day);

    if (!weekday) {
        events.weekdays.push({
            day,
            oneTimeEvents: [],
            recurringEvents: []
        });
        weekday = events.weekdays[events.weekdays.length - 1];
    }

    const eventList = recurring
        ? weekday.recurringEvents
        : weekday.oneTimeEvents;

    const startDate = dateForDay(id, day);
    eventList.push(recurring
        ? { ...event, date: startDate, recurrenceStart: startDate }
        : event);
    await events.save();
    return (await get(id, userid))!;
}

async function findEventOwner(id: string, eventid: string, userid: string) {
    const visibleWeek = await get(id, userid);
    const visibleEvent = visibleWeek?.weekdays.flatMap((day) =>
        [...day.oneTimeEvents, ...day.recurringEvents]
    ).find((event) => event.id === eventid);
    if (!visibleEvent) return undefined;

    if (visibleEvent.recurrenceStart) {
        return EventsModel.findOne({
            userid,
            "weekdays.recurringEvents": {
                $elemMatch: { id: eventid, recurrenceStart: visibleEvent.recurrenceStart }
            }
        });
    }
    return EventsModel.findOne({ id, userid });
}

async function updateEvent(
    id: string,
    eventid: string,
    replacement: Event,
    userid: string
): Promise<Events | undefined> {
    const events = await findEventOwner(id, eventid, userid);
    if (!events) return undefined;

    const movingEvent = events.weekdays.flatMap((day) => day.oneTimeEvents)
        .find((event) => event.id === eventid);
    if (movingEvent && replacement.date) {
        return moveEvent(id, eventid, replacement, userid);
    }
    const movingSeries = events.weekdays.flatMap((day) => day.recurringEvents)
        .find((event) => event.id === eventid && event.recurrenceStart);
    if (movingSeries && replacement.date && replacement.date !== movingSeries.recurrenceStart) {
        return moveEvent(events.id, eventid, replacement, userid, true);
    }

    for (const weekday of events.weekdays) {
        const event = [...weekday.oneTimeEvents, ...weekday.recurringEvents]
            .find((candidate) => candidate.id === eventid);

        if (event) {
            Object.assign(event, replacement, {
                id: eventid,
                ...(event.recurrenceStart ? { date: event.recurrenceStart } : {})
            });
            events.markModified("weekdays");
            await events.save();
            return get(id, userid);
        }
    }

    return undefined;
}

async function moveEvent(id: string, eventid: string, replacement: Event, userid: string, recurring = false) {
    const date = new Date(`${replacement.date}T00:00:00Z`);
    const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getUTCDay()];
    date.setUTCDate(date.getUTCDate() - date.getUTCDay());
    const destinationId = date.toISOString().slice(0, 10);
    const session = await startSession();
    let moved = false;
    try {
        await session.withTransaction(async () => {
            moved = false;
            const source = await EventsModel.findOne({ id, userid }).session(session);
            if (!source) return;
            const listName = recurring ? "recurringEvents" : "oneTimeEvents";
            const sourceDay = source.weekdays.find((weekday) =>
                weekday[listName].some((event) => event.id === eventid));
            if (!sourceDay) return;
            const index = sourceDay[listName].findIndex((event) => event.id === eventid);
            const original = source.toObject().weekdays.find((weekday) => weekday.day === sourceDay.day)![listName][index];
            const destination = destinationId === id ? source
                : await EventsModel.findOne({ id: destinationId, userid }).session(session)
                    || new EventsModel({ id: destinationId, userid, week: date, weekdays: [] });
            sourceDay[listName].splice(index, 1);
            let destinationDay = destination.weekdays.find((weekday) => weekday.day === day);
            if (!destinationDay) {
                destination.weekdays.push({ day, oneTimeEvents: [], recurringEvents: [] });
                destinationDay = destination.weekdays[destination.weekdays.length - 1];
            }
            destinationDay[listName].push({
                ...original, ...replacement, id: eventid,
                ...(recurring ? { recurrenceStart: replacement.date } : {})
            });
            source.markModified("weekdays");
            destination.markModified("weekdays");
            await source.save({ session });
            if (destination !== source) await destination.save({ session });
            moved = true;
        });
    } finally {
        await session.endSession();
    }
    return moved ? get(destinationId, userid) : undefined;
}

async function removeEvent(
    id: string,
    eventid: string,
    userid: string
): Promise<Events | undefined> {
    const events = await findEventOwner(id, eventid, userid);
    if (!events) return undefined;

    for (const weekday of events.weekdays) {
        for (const eventList of [weekday.oneTimeEvents, weekday.recurringEvents]) {
            const eventIndex = eventList.findIndex((event) => event.id === eventid);

            if (eventIndex >= 0) {
                eventList.splice(eventIndex, 1);
                events.markModified("weekdays");
                await events.save();
                return (await get(id, userid)) || {
                    id, userid, week: new Date(`${id}T00:00:00Z`), weekdays: []
                };
            }
        }
    }

    return undefined;
}

export default { get, addEvent, updateEvent, removeEvent };
