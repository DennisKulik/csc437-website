import express, { Request, Response } from "express";
import { Events } from "../models";

import EventsSvc from "../services/events-svc.ts";
import { userInfo } from "node:os";

const router = express.Router();

router.get("/", (_, res: Response) => {
    EventsSvc.index()
        .then((list: Events[]) => res.send(list))
        .catch((err) => res.status(500).send(err));
});

router.get("/:id", (req: Request, res: Response) => {
    const { id } = req.params;

    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }

    EventsSvc.get(id)
        .then((event: Events | undefined) => {
            if (!event) res.status(404).send();
            else res.send(event)
        })
        .catch((err) => res.status(404).send(err));
});

router.post("/", (req: Request, res: Response) => {
    const newEvents = req.body;

    EventsSvc.create(newEvents)
        .then((events: Events) => res.status(201).json(events))
        .catch((err) => res.status(500).send(err));
});

router.put("/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const newEvents = req.body;

    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }

    EventsSvc.update(id, newEvents)
        .then((events: Events | undefined) => {
            if (!events) res.status(404).end();
            else res.json(events);
        })
        .catch((err) => res.status(404).end());
});

router.delete("/:id", (req: Request, res: Response) => {
    const { id } = req.params;

    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }

    EventsSvc.remove(id)
        .then(() => res.status(204).end())
        .catch((err) => res.status(404).send(err));
});

export default router;