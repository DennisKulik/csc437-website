import { connect } from "./services/mongo.ts";
import express, { Request, Response } from "express";

import EventsRouter from "./routes/events.ts";
import UsersRouter from "./routes/users.ts";

import auth from "./routes/auth.ts";
import { authenticateUser } from "./routes/auth.ts";
import fs from "node:fs/promises";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "public";

app.use(express.static(staticDir));
app.use(express.json());

app.use("/api/events", authenticateUser, EventsRouter);
app.use("/api/users", authenticateUser, UsersRouter);
app.use("/auth", auth);

app.get("/hello", (req: Request, res: Response) => {
    res.send("Hello, World");
});

app.use("/app", (req: Request, res: Response) => {
    const indexHtml = path.resolve(staticDir, "index.html");
    fs.readFile(indexHtml, { encoding: "utf8" }).then((html) =>
        res.send(html)
    );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

connect("WebDev437")
