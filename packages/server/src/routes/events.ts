import express, { Request, Response } from "express";
import { Event as PlanningEvent, Events } from "../models";

import EventsSvc from "../services/events-svc.ts";
import { isRecord } from "../request-validation.ts";

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

function optionalString(value: unknown, maxLength: number): value is string | undefined {
    return value === undefined || (
        typeof value === "string" && value.length <= maxLength
    );
}

function isDateId(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isOptionalDate(value: unknown): boolean {
    return value === undefined || value === "" || (
        typeof value === "string" && isDateId(value)
    );
}

function isOptionalTime(value: unknown): boolean {
    return value === undefined || value === "" || (
        typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    );
}

function cleanOptional(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    return value.trim() || undefined;
}

function getUserid(req: Request, res: Response): string | undefined {
    const userid = req.user?.username;

    if (!userid) {
        res.status(401).end();
        return undefined;
    }

    return userid;
}

router.get("/:id", (req: Request, res: Response) => {
    const userid = getUserid(req, res);
    if (!userid) return;

    const { id } = req.params;

    if (Array.isArray(id) || !isDateId(id)) {
        res.status(400).send({ error: "Invalid week identifier." });
        return;
    }

    EventsSvc.get(id, userid)
        .then((event: Events | undefined) => {
            if (!event) res.status(404).send();
            else res.send(event);
        })
        .catch(() => res.status(500).send({ error: "Unable to load events." }));
});

router.post("/:id/events", (req: Request, res: Response) => {
    const userid = getUserid(req, res);
    if (!userid) return;

    const { id } = req.params;

    if (!isRecord(req.body)) {
        res.status(400).send({ error: "Invalid event data." });
        return;
    }

    const { day, recurring, event } = req.body;

    if (
        Array.isArray(id) ||
        !isDateId(id) ||
        typeof day !== "string" ||
        !weekdays.has(day) ||
        typeof recurring !== "boolean" ||
        !isRecord(event) ||
        typeof event.id !== "string" ||
        !event.id.trim() ||
        event.id.length > 100 ||
        typeof event.title !== "string" ||
        !event.title.trim() ||
        event.title.length > 100 ||
        !optionalString(event.category, 50) ||
        !isOptionalDate(event.date) ||
        !isOptionalTime(event.time) ||
        !optionalString(event.location, 120) ||
        !optionalString(event.description, 1000) ||
        !optionalString(event.notes, 1000)
    ) {
        res.status(400).send({ error: "Invalid event data." });
        return;
    }

    const newEvent: PlanningEvent = {
        id: event.id.trim(),
        title: event.title.trim(),
        category: cleanOptional(event.category),
        date: cleanOptional(event.date),
        time: cleanOptional(event.time),
        location: cleanOptional(event.location),
        description: cleanOptional(event.description),
        notes: cleanOptional(event.notes)
    };

    EventsSvc.addEvent(id, day, recurring, newEvent, userid)
        .then((events: Events) => res.status(201).json(events))
        .catch((error: unknown) => {
            if (error instanceof Error && error.message === "EVENT_ID_EXISTS") {
                res.status(409).send({ error: "Event already exists." });
            } else {
                res.status(500).send({ error: "Unable to create event." });
            }
        });
});

router.put("/:id/events/:eventid", (req: Request, res: Response) => {
    const userid = getUserid(req, res);
    if (!userid) return;

    const { id, eventid } = req.params;

    if (!isRecord(req.body)) {
        res.status(400).send({ error: "Invalid event data." });
        return;
    }

    const { event } = req.body;

    if (
        Array.isArray(id) ||
        Array.isArray(eventid) ||
        !isDateId(id) ||
        !eventid ||
        eventid.length > 100 ||
        !isRecord(event) ||
        typeof event.title !== "string" ||
        !event.title.trim() ||
        event.title.length > 100 ||
        !optionalString(event.category, 50) ||
        !isOptionalDate(event.date) ||
        !isOptionalTime(event.time) ||
        !optionalString(event.location, 120) ||
        !optionalString(event.description, 1000) ||
        !optionalString(event.notes, 1000)
    ) {
        res.status(400).send({ error: "Invalid event data." });
        return;
    }

    const updatedEvent: PlanningEvent = {
        id: eventid,
        title: event.title.trim(),
        category: cleanOptional(event.category),
        date: cleanOptional(event.date),
        time: cleanOptional(event.time),
        location: cleanOptional(event.location),
        description: cleanOptional(event.description),
        notes: cleanOptional(event.notes)
    };

    EventsSvc.updateEvent(id, eventid, updatedEvent, userid)
        .then((events) => {
            if (!events) res.status(404).send({ error: "Event not found." });
            else res.json(events);
        })
        .catch(() => res.status(500).send({ error: "Unable to update event." }));
});

router.delete("/:id/events/:eventid", (req: Request, res: Response) => {
    const userid = getUserid(req, res);
    if (!userid) return;

    const { id, eventid } = req.params;

    if (
        Array.isArray(id) ||
        Array.isArray(eventid) ||
        !isDateId(id) ||
        !eventid ||
        eventid.length > 100
    ) {
        res.status(400).send({ error: "Invalid event identifier." });
        return;
    }

    EventsSvc.removeEvent(id, eventid, userid)
        .then((events) => {
            if (!events) res.status(404).send({ error: "Event not found." });
            else res.json(events);
        })
        .catch(() => res.status(500).send({ error: "Unable to delete event." }));
});

export default router;
