import express from "express";
import UsersSvc from "../services/user-svc.js";
const router = express.Router();
router.get("/", (_, res) => {
    UsersSvc.index()
        .then((list) => res.send(list))
        .catch((err) => res.status(500).send(err));
});
router.get("/:id", (req, res) => {
    const { id } = req.params;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    UsersSvc.get(id)
        .then((profile) => {
        if (!profile)
            res.status(404).send();
        else
            res.send(profile);
    })
        .catch((err) => res.status(404).send(err));
});
router.post("/", (req, res) => {
    const newProfile = req.body;
    UsersSvc.create(newProfile)
        .then((profile) => res.status(201).json(profile))
        .catch((err) => res.status(500).send(err));
});
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const newProfile = req.body;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    UsersSvc.update(id, newProfile)
        .then((profile) => {
        if (!profile)
            res.status(404).end();
        else
            res.json(profile);
    })
        .catch((err) => res.status(404).send(err));
});
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    if (Array.isArray(id)) {
        res.status(400).send();
        return;
    }
    UsersSvc.remove(id)
        .then(() => res.status(204).end())
        .catch((err) => res.status(404).send(err));
});
export default router;
