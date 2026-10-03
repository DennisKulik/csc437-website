import { Schema, model } from "mongoose";
const eventItemSchema = new Schema({
    id: { type: String, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    href: String,
    category: { type: String, maxlength: 50 },
    date: String,
    time: String,
    location: { type: String, maxlength: 120 },
    description: { type: String, maxlength: 1000 },
    notes: { type: String, maxlength: 1000 }
}, { _id: false });
const weekdaySchema = new Schema({
    day: { type: String, required: true, enum: [
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ] },
    oneTimeEvents: { type: [eventItemSchema], default: [] },
    recurringEvents: { type: [eventItemSchema], default: [] }
}, { _id: false });
const eventsSchema = new Schema({
    id: { type: String, required: true },
    userid: { type: String, required: true },
    week: { type: Date, required: true },
    weekdays: { type: [weekdaySchema], default: [] }
}, { collection: "events" });
eventsSchema.index({ userid: 1, id: 1 }, { unique: true });
const EventsModel = model("Events", eventsSchema);
function get(id, userid) {
    return EventsModel.findOne({ id, userid })
        .then((events) => events ?? undefined);
}
async function addEvent(id, day, recurring, event, userid) {
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
    const duplicate = events.weekdays.some((candidate) => [...candidate.oneTimeEvents, ...candidate.recurringEvents]
        .some((existing) => existing.id === event.id));
    if (duplicate)
        throw new Error("EVENT_ID_EXISTS");
    eventList.push(event);
    return events.save();
}
async function updateEvent(id, eventid, replacement, userid) {
    const events = await EventsModel.findOne({ id, userid });
    if (!events)
        return undefined;
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
async function removeEvent(id, eventid, userid) {
    const events = await EventsModel.findOne({ id, userid });
    if (!events)
        return undefined;
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
export default { get, addEvent, updateEvent, removeEvent };
