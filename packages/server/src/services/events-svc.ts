import { Schema, model } from "mongoose";
import { Events } from "../models";
import { title } from "node:process";
import { userInfo } from "node:os";

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
        week: Date,
        weekdays: [weekdaySchema]
    },
    { collection: "events" }
);

const EventsModel = model<Events>(
    "Events", 
    eventsSchema
);

function index(): Promise<Events[]> {
    return EventsModel.find();
}

function get(id: string): Promise<Events | undefined> {
    return EventsModel.find({ id })
        .then((list) => list[0])
        .catch((err) => {
            throw `${id} Not Found`;
        });
}

export default { index, get };
