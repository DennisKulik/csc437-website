import { connect } from "./services/mongo.js";
import express from "express";
import EventsRouter from "./routes/events.js";
import auth from "./routes/auth.js";
const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "public";
app.use(express.static(staticDir));
app.use(express.json());
app.use("/api/events", EventsRouter);
app.use("/auth", auth);
app.get("/hello", (req, res) => {
    res.send("Hello, World");
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
connect("WebDev437");
