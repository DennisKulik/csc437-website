import { Schema, model } from "mongoose";
const eventItemSchema = new Schema({
    title: String,
    href: String
}, { _id: false });
const weekdaySchema = new Schema({
    day: String,
    oneTimeEvents: [eventItemSchema],
    recurringEvents: [eventItemSchema]
}, { _id: false });
const eventsSchema = new Schema({
    id: String,
    userid: String,
    week: Date,
    weekdays: [weekdaySchema]
}, { collection: "events" });
const EventsModel = model("Events", eventsSchema);
function index(userid) {
    return EventsModel.find({ userid });
}
function get(id, userid) {
    return EventsModel.find({ id, userid })
        .then((list) => list[0])
        .catch(() => {
        throw `${id} Not Found`;
    });
}
function create(json, userid) {
    const events = new EventsModel({
        ...json,
        userid
    });
    return events.save();
}
function update(id, events, userid) {
    return EventsModel.findOneAndUpdate({ id, userid }, {
        ...events,
        id,
        userid
    }, { new: true }).then((updated) => {
        if (!updated)
            throw `${id} not updated`;
        else
            return updated;
    });
}
function remove(id, userid) {
    return EventsModel.findOneAndDelete({ id, userid })
        .then((deleted) => {
        if (!deleted)
            throw `${id} not deleted`;
    });
}
export default { index, get, create, update, remove };
