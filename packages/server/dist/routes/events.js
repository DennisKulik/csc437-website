import express from "express";
import EventsSvc from "../services/events-svc.js";
const router = express.Router();
const weekdays = new Set([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
]);
function optionalString(value) {
    return value === undefined || typeof value === "string";
}
function getUserid(req, res) {
    const userid = req.user?.username;
    if (!userid) {
        res.status(401).end();
        return undefined;
    }
    return userid;
}
router.get("/", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    EventsSvc.index(userid)
        .then((list) => res.send(list))
        .catch((err) => res.status(500).send(err));
});
router.get("/:id", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const { id } = req.params;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    EventsSvc.get(id, userid)
        .then((event) => {
        if (!event)
            res.status(404).send();
        else
            res.send(event);
    })
        .catch((err) => res.status(404).send(err));
});
router.post("/", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const newEvents = req.body;
    EventsSvc.create(newEvents, userid)
        .then((events) => res.status(201).json(events))
        .catch((err) => res.status(500).send(err));
});
router.post("/:id/events", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const { id } = req.params;
    const { day, recurring, event } = req.body;
    if (Array.isArray(id) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(id) ||
        typeof day !== "string" ||
        !weekdays.has(day) ||
        typeof recurring !== "boolean" ||
        !event ||
        typeof event.id !== "string" ||
        !event.id ||
        typeof event.title !== "string" ||
        !event.title.trim() ||
        !optionalString(event.category) ||
        !optionalString(event.date) ||
        !optionalString(event.time) ||
        !optionalString(event.location) ||
        !optionalString(event.description) ||
        !optionalString(event.notes)) {
        res.status(400).send({ error: "Invalid event data." });
        return;
    }
    const newEvent = {
        id: event.id,
        title: event.title.trim(),
        category: event.category?.trim(),
        date: event.date,
        time: event.time,
        location: event.location?.trim(),
        description: event.description?.trim(),
        notes: event.notes?.trim()
    };
    EventsSvc.addEvent(id, day, recurring, newEvent, userid)
        .then((events) => res.status(201).json(events))
        .catch(() => res.status(500).send({ error: "Unable to create event." }));
});
router.put("/:id/events/:eventid", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const { id, eventid } = req.params;
    const { event } = req.body;
    if (Array.isArray(id) ||
        Array.isArray(eventid) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(id) ||
        !eventid ||
        !event ||
        typeof event.title !== "string" ||
        !event.title.trim() ||
        !optionalString(event.category) ||
        !optionalString(event.date) ||
        !optionalString(event.time) ||
        !optionalString(event.location) ||
        !optionalString(event.description) ||
        !optionalString(event.notes)) {
        res.status(400).send({ error: "Invalid event data." });
        return;
    }
    const updatedEvent = {
        id: eventid,
        title: event.title.trim(),
        category: event.category?.trim(),
        date: event.date,
        time: event.time,
        location: event.location?.trim(),
        description: event.description?.trim(),
        notes: event.notes?.trim()
    };
    EventsSvc.updateEvent(id, eventid, updatedEvent, userid)
        .then((events) => {
        if (!events)
            res.status(404).send({ error: "Event not found." });
        else
            res.json(events);
    })
        .catch(() => res.status(500).send({ error: "Unable to update event." }));
});
router.delete("/:id/events/:eventid", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const { id, eventid } = req.params;
    if (Array.isArray(id) ||
        Array.isArray(eventid) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(id) ||
        !eventid) {
        res.status(400).send({ error: "Invalid event identifier." });
        return;
    }
    EventsSvc.removeEvent(id, eventid, userid)
        .then((events) => {
        if (!events)
            res.status(404).send({ error: "Event not found." });
        else
            res.json(events);
    })
        .catch(() => res.status(500).send({ error: "Unable to delete event." }));
});
router.put("/:id", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const { id } = req.params;
    const newEvents = req.body;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    EventsSvc.update(id, newEvents, userid)
        .then((events) => {
        if (!events)
            res.status(404).end();
        else
            res.json(events);
    })
        .catch(() => res.status(404).end());
});
router.delete("/:id", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const { id } = req.params;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    EventsSvc.remove(id, userid)
        .then(() => res.status(204).end())
        .catch((err) => res.status(404).send(err));
});
export default router;
