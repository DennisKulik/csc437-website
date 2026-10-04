import { Schema, model } from "mongoose";
import type { Task, TaskDetails, Tasks } from "../models/index.ts";

const taskSchema = new Schema({
    id: { type: String, required: true, maxlength: 100 },
    userid: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 1000 },
    notes: { type: String, maxlength: 1000 },
    dueDate: String,
    category: { type: String, maxlength: 50 },
    categoryColor: { type: String, match: /^#[0-9a-f]{6}$/i },
    completed: { type: Boolean, required: true, default: false },
    completedAt: String,
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
}, { collection: "tasks" });

taskSchema.index({ userid: 1, id: 1 }, { unique: true });
taskSchema.index({ userid: 1, completed: 1, completedAt: -1, createdAt: -1 });
const TaskModel = model<Task>("Task", taskSchema);

async function get(userid: string): Promise<Tasks> {
    const tasks = await TaskModel.find({ userid })
        .sort({ completed: 1, completedAt: -1, createdAt: -1, id: 1 }).lean();
    return { tasks };
}

async function create(userid: string, id: string, details: TaskDetails): Promise<Tasks> {
    const now = new Date().toISOString();
    await TaskModel.create({ ...details, userid, id, completed: false, createdAt: now, updatedAt: now });
    return get(userid);
}

async function update(userid: string, id: string, details: TaskDetails): Promise<Tasks | undefined> {
    const task = await TaskModel.findOne({ userid, id });
    if (!task) return undefined;
    Object.assign(task, details, { updatedAt: new Date().toISOString() });
    await task.save();
    return get(userid);
}

async function complete(userid: string, id: string, completed: boolean): Promise<Tasks | undefined> {
    const now = new Date().toISOString();
    const task = await TaskModel.findOneAndUpdate(
        { userid, id, completed: { $ne: completed } },
        completed
            ? { $set: { completed: true, completedAt: now, updatedAt: now } }
            : { $set: { completed: false, updatedAt: now }, $unset: { completedAt: "" } },
        { returnDocument: "after", runValidators: true }
    );
    if (!task && !await TaskModel.exists({ userid, id })) return undefined;
    return get(userid);
}

async function remove(userid: string, id: string): Promise<Tasks | undefined> {
    const removed = await TaskModel.findOneAndDelete({ userid, id });
    return removed ? get(userid) : undefined;
}

export default { get, create, update, complete, remove };
