import express, { Request, Response } from "express";
import { UserProfile } from "../models";

import UsersSvc from "../services/user-svc.ts";

const router = express.Router();

router.get("/", (_: Request, res: Response) => {
    UsersSvc.index()
        .then((list: UserProfile[]) => res.send(list))
        .catch((err) => res.status(500).send(err));
});

router.get("/:id", (req: Request, res: Response) => {
    const { id } = req.params;

    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }

    UsersSvc.get(id)
        .then((profile: UserProfile | undefined) => {
            if (!profile) res.status(404).send();
            else res.send(profile);
        })
        .catch((err) => res.status(404).send(err));
});

router.post("/", (req: Request, res: Response) => {
    const newProfile = req.body;

    UsersSvc.create(newProfile)
        .then((profile: UserProfile) => res.status(201).json(profile))
        .catch((err) => res.status(500).send(err));
});

router.put("/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const newProfile = req.body;

    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }

    UsersSvc.update(id, newProfile)
        .then((profile: UserProfile | undefined) => {
            if (!profile) res.status(404).end();
            else res.json(profile);
        })
        .catch((err) => res.status(404).send(err));
});

router.delete("/:id", (req: Request, res: Response) => {
    const { id } = req.params;

    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }

    UsersSvc.remove(id)
        .then(() => res.status(204).end())
        .catch((err) => res.status(404).send(err));
});

export default router;