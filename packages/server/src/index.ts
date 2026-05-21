import { connect } from "./services/mongo.ts";
import express, { Request, Response } from "express";
import EventsSvc from "./services/events-svc.ts";
import type { Events } from "./models";
import EventsRouter from "./routes/events.ts";

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "public";

app.use(express.static(staticDir));
app.use(express.json());

app.use("/api/events", EventsRouter)

app.get("/hello", (req: Request, res: Response) => {
    res.send("Hello, World");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

connect("WebDev437")
