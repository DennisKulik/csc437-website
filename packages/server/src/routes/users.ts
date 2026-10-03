import express, { Request, Response } from "express";
import { UserProfile } from "../models";

import UsersSvc from "../services/user-svc.ts";

const router = express.Router();

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

function profileFromRequest(
    body: unknown,
    userid: string
): UserProfile | undefined {
    if (!isRecord(body)) return undefined;

    const { displayName, bio, profilePicture } = body;

    if (
        typeof displayName !== "string" ||
        !displayName.trim() ||
        (bio !== undefined && typeof bio !== "string") ||
        (profilePicture !== undefined && typeof profilePicture !== "string")
    ) {
        return undefined;
    }

    return {
        userid,
        username: userid,
        displayName: displayName.trim(),
        bio: typeof bio === "string" ? bio.trim() : undefined,
        profilePicture: typeof profilePicture === "string"
            ? profilePicture.trim()
            : undefined
    };
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

router.post("/", (req: Request, res: Response) => {
    const userid = getAuthenticatedUserid(req, res);
    if (!userid) return;

    if (!isRecord(req.body)) {
        res.status(400).send();
        return;
    }

    if (
        (req.body.userid !== undefined && req.body.userid !== userid) ||
        (req.body.username !== undefined && req.body.username !== userid)
    ) {
        res.status(403).send({ error: "Profile identity must match the signed-in user." });
        return;
    }

    const newProfile = profileFromRequest(req.body, userid);

    if (!newProfile) {
        res.status(400).send();
        return;
    }

    UsersSvc.create(newProfile)
        .then((profile: UserProfile) => res.status(201).json(profile))
        .catch(() => res.status(500).send({ error: "Unable to create profile." }));
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

router.delete("/:id", (req: Request, res: Response) => {
    const { id } = req.params;

    if (Array.isArray(id) || !ownsProfile(req, res, id)) {
        if (Array.isArray(id)) res.status(400).send();
        return;
    }

    UsersSvc.remove(id)
        .then((deleted) => {
            if (!deleted) res.status(404).end();
            else res.status(204).end();
        })
        .catch(() => res.status(500).send({ error: "Unable to delete profile." }));
});

export default router;
