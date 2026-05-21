import express from "express";
import EventsSvc from "../services/events-svc.js";
const router = express.Router();
router.get("/", (_, res) => {
    EventsSvc.index()
        .then((list) => res.send(list))
        .catch((err) => res.status(500).send(err));
});
router.get("/:id", (req, res) => {
    const { id } = req.params;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    EventsSvc.get(id)
        .then((event) => {
        if (!event)
            res.status(404).send();
        else
            res.send(event);
    })
        .catch((err) => res.status(404).send(err));
});
router.post("/", (req, res) => {
    const newEvents = req.body;
    EventsSvc.create(newEvents)
        .then((events) => res.status(201).json(events))
        .catch((err) => res.status(500).send(err));
});
export default router;
