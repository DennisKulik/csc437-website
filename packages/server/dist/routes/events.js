import express from "express";
import EventsSvc from "../services/events-svc.js";
const router = express.Router();
function getUserid(req, res) {
    const userid = req.user?.username;
    if (!userid) {
        res.status(401).end();
        return undefined;
    }
    return userid;
}
router.get("/", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    EventsSvc.index(userid)
        .then((list) => res.send(list))
        .catch((err) => res.status(500).send(err));
});
router.get("/:id", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const { id } = req.params;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    EventsSvc.get(id, userid)
        .then((event) => {
        if (!event)
            res.status(404).send();
        else
            res.send(event);
    })
        .catch((err) => res.status(404).send(err));
});
router.post("/", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const newEvents = req.body;
    EventsSvc.create(newEvents, userid)
        .then((events) => res.status(201).json(events))
        .catch((err) => res.status(500).send(err));
});
router.put("/:id", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const { id } = req.params;
    const newEvents = req.body;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    EventsSvc.update(id, newEvents, userid)
        .then((events) => {
        if (!events)
            res.status(404).end();
        else
            res.json(events);
    })
        .catch(() => res.status(404).end());
});
router.delete("/:id", (req, res) => {
    const userid = getUserid(req, res);
    if (!userid)
        return;
    const { id } = req.params;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    EventsSvc.remove(id, userid)
        .then(() => res.status(204).end())
        .catch((err) => res.status(404).send(err));
});
export default router;
