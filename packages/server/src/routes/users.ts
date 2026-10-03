import express, { Request, Response } from "express";
import { UserProfile } from "../models";

import UsersSvc from "../services/user-svc.ts";
import { profileFromRequest } from "../request-validation.ts";

const router = express.Router();

function getAuthenticatedUserid(req: Request, res: Response): string | undefined {
    const userid = req.user?.username;

    if (!userid) {
        res.status(401).end();
        return undefined;
    }

    return userid;
}

function ownsProfile(req: Request, res: Response, requestedUserid: string): boolean {
    const authenticatedUserid = getAuthenticatedUserid(req, res);

    if (!authenticatedUserid) return false;

    if (requestedUserid !== authenticatedUserid) {
        res.status(403).send({ error: "You can only access your own profile." });
        return false;
    }

    return true;
}

router.get("/:id", (req: Request, res: Response) => {
    const { id } = req.params;

    if (Array.isArray(id) || !ownsProfile(req, res, id)) {
        if (Array.isArray(id)) res.status(400).send();
        return;
    }

    UsersSvc.get(id)
        .then((profile: UserProfile | undefined) => {
            if (!profile) res.status(404).send();
            else res.send(profile);
        })
        .catch(() => res.status(500).send({ error: "Unable to load profile." }));
});

router.put("/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    if (Array.isArray(id) || !ownsProfile(req, res, id)) {
        if (Array.isArray(id)) res.status(400).send();
        return;
    }

    const newProfile = profileFromRequest(req.body, id);

    if (!newProfile) {
        res.status(400).send();
        return;
    }

    UsersSvc.update(id, newProfile)
        .then((profile: UserProfile | undefined) => {
            if (!profile) res.status(404).end();
            else res.json(profile);
        })
        .catch(() => res.status(500).send({ error: "Unable to update profile." }));
});

export default router;
