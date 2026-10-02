import { Schema, model } from "mongoose";
import { Event, Events } from "../models";

const eventItemSchema = new Schema(
    {
        id: String,
        title: { type: String, required: true, trim: true },
        href: String,
        category: String,
        date: String,
        time: String,
        location: String,
        description: String,
        notes: String
    },
    { _id: false }
);

const weekdaySchema = new Schema(
    {
        day: String,
        oneTimeEvents: [eventItemSchema],
        recurringEvents: [eventItemSchema]
    },
    { _id: false }
);

const eventsSchema = new Schema(
    {
        id: String,
        userid: String,
        week: Date,
        weekdays: [weekdaySchema]
    },
    { collection: "events" }
);

const EventsModel = model<Events>(
    "Events", 
    eventsSchema
);

function index(userid: string): Promise<Events[]> {
    return EventsModel.find({ userid });
}

function get(id: string, userid: string): Promise<Events | undefined> {
    return EventsModel.find({ id, userid })
        .then((list) => list[0])
        .catch(() => {
            throw `${id} Not Found`;
        });
}

function create(json: Events, userid: string): Promise<Events> {
    const events = new EventsModel({
        ...json,
        userid
    });

    return events.save();
}

async function addEvent(
    id: string,
    day: string,
    recurring: boolean,
    event: Event,
    userid: string
): Promise<Events> {
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

    eventList.push(event);
    return events.save();
}

async function updateEvent(
    id: string,
    eventid: string,
    replacement: Event,
    userid: string
): Promise<Events | undefined> {
    const events = await EventsModel.findOne({ id, userid });
    if (!events) return undefined;

    for (const weekday of events.weekdays) {
        const event = [...weekday.oneTimeEvents, ...weekday.recurringEvents]
            .find((candidate) => candidate.id === eventid);

        if (event) {
            Object.assign(event, replacement, { id: eventid });
            events.markModified("weekdays");
            return events.save();
        }
    }

    return undefined;
}

async function removeEvent(
    id: string,
    eventid: string,
    userid: string
): Promise<Events | undefined> {
    const events = await EventsModel.findOne({ id, userid });
    if (!events) return undefined;

    for (const weekday of events.weekdays) {
        for (const eventList of [weekday.oneTimeEvents, weekday.recurringEvents]) {
            const eventIndex = eventList.findIndex((event) => event.id === eventid);

            if (eventIndex >= 0) {
                eventList.splice(eventIndex, 1);
                events.markModified("weekdays");
                return events.save();
            }
        }
    }

    return undefined;
}

function update(id: string, events: Events, userid: string): Promise<Events | undefined> {
    return EventsModel.findOneAndUpdate(
        { id, userid },
        {
            ...events,
            id,
            userid
        },
        { new: true }
    ).then((updated) => {
        if (!updated) throw `${id} not updated`;
        else return updated as Events;
    });
}

function remove(id: string, userid: string): Promise<void> {
    return EventsModel.findOneAndDelete({ id, userid })
        .then((deleted) => {
            if (!deleted) throw `${id} not deleted`;
        });
}

export default { index, get, create, addEvent, updateEvent, removeEvent, update, remove };
