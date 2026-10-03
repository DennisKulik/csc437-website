import { connect } from "./services/mongo.js";
import express from "express";
import EventsRouter from "./routes/events.js";
import UsersRouter from "./routes/users.js";
import auth from "./routes/auth.js";
import { authenticateUser } from "./routes/auth.js";
import fs from "node:fs/promises";
import path from "path";
import { config } from "./config.js";
const app = express();
app.use(express.static(config.staticDir));
app.use(express.json({ limit: "100kb" }));
app.use("/api/events", authenticateUser, EventsRouter);
app.use("/api/users", authenticateUser, UsersRouter);
app.use("/auth", auth);
app.use("/app", (req, res) => {
    const indexHtml = path.resolve(config.staticDir, "index.html");
    fs.readFile(indexHtml, { encoding: "utf8" }).then((html) => res.send(html)).catch(() => res.status(500).send("Application files are unavailable."));
});
app.use((error, _req, res, _next) => {
    if (error instanceof SyntaxError) {
        res.status(400).send({ error: "Request body must contain valid JSON." });
        return;
    }
    console.error("Unhandled request error");
    res.status(500).send({ error: "Unexpected server error." });
});
async function start() {
    await connect("WebDev437");
    app.listen(config.port, () => {
        console.log(`Server running at http://localhost:${config.port}`);
    });
}
start().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown startup error";
    console.error(`Server failed to start: ${message}`);
    process.exitCode = 1;
});
