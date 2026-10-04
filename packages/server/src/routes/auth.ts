import express, {
    NextFunction,
    Request,
    Response
} from "express";
import jwt from "jsonwebtoken";

import credentials from "../services/credential-svc.ts";
import UsersSvc from "../services/user-svc.ts";
import { config } from "../config.ts";
import {
    isRecord,
    loginFromRequest,
    registrationFromRequest
} from "../request-validation.ts";

type AuthTokenPayload = {
    username: string;
};

declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}

const router = express.Router();

function isDuplicateKey(error: unknown): boolean {
    return isRecord(error) && error.code === 11000;
}

router.post("/register", async (req: Request, res: Response) => {
    const registration = registrationFromRequest(req.body);

    if (!registration) {
        res.status(400).send({ error: "Invalid registration data." });
        return;
    }

    const { username, password, profile } = registration;
    let credentialCreated = false;

    try {
        const token = await generateAccessToken(username);
        await credentials.create(username, password);
        credentialCreated = true;
        await UsersSvc.create(profile);
        res.status(201).send({ token });
    } catch (error: unknown) {
        if (credentialCreated) await credentials.remove(username).catch(() => false);

        if (isDuplicateKey(error)) {
            res.status(409).send({ error: "That username is already in use." });
        } else {
            res.status(500).send({ error: "Unable to create account." });
        }
    }
});

router.post("/login", (req: Request, res: Response) => {
    const login = loginFromRequest(req.body);

    if (!login) {
        res.status(400).send({ error: "Invalid login data." });
    } else {
        const { username, password } = login;
        credentials
            .verify(username, password)
            .then((goodUser: string) => generateAccessToken(goodUser))
            .then((token) => res.status(200).send({ token: token }))
            .catch(() => res.status(401).send({ error: "Unauthorized" }));
    }
});

function generateAccessToken(username: string): Promise<string> {
    return new Promise((resolve, reject) => {
        jwt.sign(
            { username: username },
            config.tokenSecret,
            { expiresIn: "1d" },
            (error, token) => {
                if (error) reject(error);
                else resolve(token as string);
            }
        );
    });
}

export function authenticateUser(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        res.status(401).end();
    } else {
        jwt.verify(token, config.tokenSecret, (error, decoded) => {
            if (error || !decoded || typeof decoded === "string") {
                res.status(401).end();
                return;
            }

            const { username } = decoded as AuthTokenPayload;

            if (!username) {
                res.status(401).end();
                return;
            }

            req.user = { username };
            next();
        });
    }
}

export default router;
