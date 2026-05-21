import express, { Request, Response } from "express";
import { Events } from "../models";

import EventsSvc from "../services/events-svc.ts";

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

export default router;