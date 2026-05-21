import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import credentials from "../services/credential-svc.js";
const router = express.Router();
dotenv.config();
const TOKEN_SECRET = process.env.TOKEN_SECRET || "NOT_A_SECRET";
router.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== "string" || typeof password !== "string") {
        res.status(400).send("Bad Request: Invalid input data.");
    }
    else {
        credentials
            .create(username, password)
            .then((creds) => generateAccessToken(creds.username))
            .then((token) => {
            res.status(201).send({ token: token });
        })
            .catch((err) => {
            res.status(400).send({ error: err.message });
        });
    }
});
router.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send("Bad Request: Invalid input data.");
    }
    else {
        credentials
            .verify(username, password)
            .then((goodUser) => generateAccessToken(goodUser))
            .then((token) => res.status(200).send({ token: token }))
            .catch((err) => res.status(401).send("Unauthorized"));
    }
});
function generateAccessToken(username) {
    return new Promise((resolve, reject) => {
        jwt.sign({ username: username }, TOKEN_SECRET, { expiresIn: "1d" }, (error, token) => {
            if (error)
                reject(error);
            else
                resolve(token);
        });
    });
}
export default router;
