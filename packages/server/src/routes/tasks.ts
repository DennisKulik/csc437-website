import express, { Request, Response } from "express";
import TasksSvc from "../services/tasks-svc.ts";
import { isRecord, taskFromRequest } from "../request-validation.ts";

const router = express.Router();

function identity(req: Request, res: Response): string | undefined {
    if (!req.user?.username) {
        res.status(401).send({ error: "Unauthorized" });
        return undefined;
    }
    return req.user.username;
}

function validId(id: unknown): id is string {
    return typeof id === "string" && Boolean(id.trim()) && id.length <= 100;
}

router.get("/", async (req, res) => {
    const userid = identity(req, res);
    if (!userid) return;
    try { res.json(await TasksSvc.get(userid)); }
    catch { res.status(500).send({ error: "Unable to load tasks." }); }
});

router.post("/", async (req, res) => {
    const userid = identity(req, res);
    if (!userid) return;
    const task = isRecord(req.body) ? req.body.task : undefined;
    const details = taskFromRequest(task);
    if (!details || !isRecord(task) || !validId(task.id)) {
        res.status(400).send({ error: "Invalid task data." });
        return;
    }
    try { res.status(201).json(await TasksSvc.create(userid, task.id.trim(), details)); }
    catch (error) {
        if (isRecord(error) && error.code === 11000) res.status(409).send({ error: "Task already exists." });
        else res.status(500).send({ error: "Unable to create task." });
    }
});

router.put("/:taskid", async (req, res) => {
    const userid = identity(req, res);
    if (!userid) return;
    const details = taskFromRequest(isRecord(req.body) ? req.body.task : undefined);
    if (!details || !validId(req.params.taskid)) {
        res.status(400).send({ error: "Invalid task data." });
        return;
    }
    try {
        const tasks = await TasksSvc.update(userid, req.params.taskid, details);
        if (!tasks) res.status(404).send({ error: "Task not found." });
        else res.json(tasks);
    } catch { res.status(500).send({ error: "Unable to update task." }); }
});

router.patch("/:taskid/completion", async (req, res) => {
    const userid = identity(req, res);
    if (!userid) return;
    if (!validId(req.params.taskid) || !isRecord(req.body) || typeof req.body.completed !== "boolean") {
        res.status(400).send({ error: "Invalid completion status." });
        return;
    }
    try {
        const tasks = await TasksSvc.complete(userid, req.params.taskid, req.body.completed);
        if (!tasks) res.status(404).send({ error: "Task not found." });
        else res.json(tasks);
    } catch { res.status(500).send({ error: "Unable to change task completion." }); }
});

router.delete("/:taskid", async (req, res) => {
    const userid = identity(req, res);
    if (!userid) return;
    if (!validId(req.params.taskid)) {
        res.status(400).send({ error: "Invalid task identifier." });
        return;
    }
    try {
        const tasks = await TasksSvc.remove(userid, req.params.taskid);
        if (!tasks) res.status(404).send({ error: "Task not found." });
        else res.json(tasks);
    } catch { res.status(500).send({ error: "Unable to delete task." }); }
});

export default router;
