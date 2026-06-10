import { Schema, model } from "mongoose";
import { Events } from "../models";

const eventItemSchema = new Schema(
    {
        title: String,
        href: String
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

export default { index, get, create, update, remove };