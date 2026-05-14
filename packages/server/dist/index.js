import express from "express";
import Events from "./services/events-svc.js";
const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "public";
app.use(express.static(staticDir));
app.use(express.json());
app.get("/hello", (req, res) => {
    res.send("Hello, World");
});
app.get("/api/events/:id", (req, res) => {
    const { id } = req.params;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    const data = Events.get(id);
    if (data)
        res.send(data);
    else
        res.status(404).send();
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
