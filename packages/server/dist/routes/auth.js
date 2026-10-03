import express from "express";
import jwt from "jsonwebtoken";
import credentials from "../services/credential-svc.js";
import UsersSvc from "../services/user-svc.js";
import { config } from "../config.js";
import { isRecord, profileFromRequest } from "../request-validation.js";
const router = express.Router();
function registrationUsername(value) {
    if (typeof value !== "string")
        return undefined;
    const username = value.trim();
    if (username.length < 3 ||
        username.length > 50 ||
        !/^[A-Za-z0-9._-]+$/.test(username)) {
        return undefined;
    }
    return username;
}
function isDuplicateKey(error) {
    return isRecord(error) && error.code === 11000;
}
router.post("/register", async (req, res) => {
    if (!isRecord(req.body)) {
        res.status(400).send({ error: "Invalid registration data." });
        return;
    }
    const username = registrationUsername(req.body.username);
    const password = req.body.password;
    const profile = username ? profileFromRequest(req.body, username) : undefined;
    if (!username ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 128 ||
        !profile) {
        res.status(400).send({ error: "Invalid registration data." });
        return;
    }
    let credentialCreated = false;
    try {
        const token = await generateAccessToken(username);
        await credentials.create(username, password);
        credentialCreated = true;
        await UsersSvc.create(profile);
        res.status(201).send({ token });
    }
    catch (error) {
        if (credentialCreated)
            await credentials.remove(username).catch(() => false);
        if (isDuplicateKey(error)) {
            res.status(409).send({ error: "That username is already in use." });
        }
        else {
            res.status(500).send({ error: "Unable to create account." });
        }
    }
});
router.post("/login", (req, res) => {
    if (!isRecord(req.body)) {
        res.status(400).send({ error: "Invalid login data." });
        return;
    }
    const username = typeof req.body.username === "string"
        ? req.body.username.trim()
        : undefined;
    const password = req.body.password;
    if (!username || typeof password !== "string" || !password) {
        res.status(400).send({ error: "Invalid login data." });
    }
    else {
        credentials
            .verify(username, password)
            .then((goodUser) => generateAccessToken(goodUser))
            .then((token) => res.status(200).send({ token: token }))
            .catch(() => res.status(401).send({ error: "Unauthorized" }));
    }
});
function generateAccessToken(username) {
    return new Promise((resolve, reject) => {
        jwt.sign({ username: username }, config.tokenSecret, { expiresIn: "1d" }, (error, token) => {
            if (error)
                reject(error);
            else
                resolve(token);
        });
    });
}
export function authenticateUser(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        res.status(401).end();
    }
    else {
        jwt.verify(token, config.tokenSecret, (error, decoded) => {
            if (error || !decoded || typeof decoded === "string") {
                res.status(401).end();
                return;
            }
            const { username } = decoded;
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
