import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import dotenv from "dotenv";
import { MongoClient } from "mongodb";

const serverDirectory = fileURLToPath(new URL("..", import.meta.url));
dotenv.config({ path: new URL("../.env", import.meta.url), quiet: true });

const port = 3197;
const baseUrl = `http://localhost:${port}`;
const username = `integration-${Date.now()}`;
const password = "temporary-test-password";
let server;
let databaseClient;

test("registration, ownership, event persistence, and task lifecycle", async (context) => {
    context.after(async () => {
        if (databaseClient) {
            const database = databaseClient.db("WebDev437");
            const identities = [username, `${username}-other`];
            await database.collection("tasks").deleteMany({ userid: { $in: identities } });
            await database.collection("events").deleteMany({ userid: { $in: identities } });
            await database.collection("users").deleteMany({ userid: { $in: identities } });
            await database.collection("user_credentials").deleteMany({ username: { $in: identities } });
            await databaseClient.close();
        }

        if (server && !server.killed) server.kill("SIGTERM");
    });

    await startServer();
    databaseClient = await connectForCleanup();

    const registration = await request("/auth/register", {
        method: "POST",
        body: {
            username,
            password,
            displayName: "Integration Test"
        }
    });
    assert.equal(registration.status, 201);
    const { token } = await registration.json();
    const authorization = { Authorization: `Bearer ${token}` };

    const login = await request("/auth/login", {
        method: "POST",
        body: { username, password }
    });
    assert.equal(login.status, 200);

    const ownProfile = await request(`/api/users/${username}`, {
        headers: authorization
    });
    assert.equal(ownProfile.status, 200);

    const anotherProfile = await request("/api/users/someone-else", {
        headers: authorization
    });
    assert.equal(anotherProfile.status, 403);

    const weekid = "2099-12-20";
    const eventid = "integration-event";
    const invalidEvent = await request(`/api/events/${weekid}/events`, {
        method: "POST",
        headers: authorization,
        body: {
            day: "Sunday",
            recurring: false,
            event: { id: eventid, title: "Invalid", date: "not-a-date" }
        }
    });
    assert.equal(invalidEvent.status, 400);

    const created = await request(`/api/events/${weekid}/events`, {
        method: "POST",
        headers: authorization,
        body: {
            day: "Sunday",
            recurring: false,
            event: { id: eventid, title: "Integration event", date: weekid }
        }
    });
    assert.equal(created.status, 201);

    const updated = await request(`/api/events/${weekid}/events/${eventid}`, {
        method: "PUT",
        headers: authorization,
        body: {
            event: { title: "Updated integration event", date: weekid }
        }
    });
    assert.equal(updated.status, 200);

    const removed = await request(`/api/events/${weekid}/events/${eventid}`, {
        method: "DELETE",
        headers: authorization
    });
    assert.equal(removed.status, 200);

    const seriesid = "weekly-integration";
    const nextWeek = "2099-12-27";
    const createSeries = await request(`/api/events/${weekid}/events`, {
        method: "POST", headers: authorization,
        body: {
            day: "Monday", recurring: true,
            event: { id: seriesid, title: "Weekly meeting", date: "2099-12-21" }
        }
    });
    assert.equal(createSeries.status, 201);

    const getWeek = async (id, headers = authorization) => {
        const response = await request(`/api/events/${id}`, { headers });
        return response.status === 404 ? undefined : response.json();
    };
    const seriesIn = (events) => events?.weekdays.flatMap((day) => day.recurringEvents)
        .find((event) => event.id === seriesid);
    assert.equal(seriesIn(await getWeek("2099-12-13")), undefined);
    assert.equal(seriesIn(await getWeek(nextWeek)).date, "2099-12-28");
    assert.equal(await databaseClient.db("WebDev437").collection("events")
        .countDocuments({ userid: username, id: nextWeek }), 0);

    const failedDate = await request(`/api/events/${weekid}/events`, {
        method: "POST", headers: authorization,
        body: { day: "Monday", recurring: true, event: { id: "bad-start", title: "Bad date", date: weekid } }
    });
    assert.equal(failedDate.status, 400);

    const otherRegistration = await request("/auth/register", {
        method: "POST", body: { username: `${username}-other`, password, displayName: "Other Test" }
    });
    assert.equal(otherRegistration.status, 201);
    const { token: otherToken } = await otherRegistration.json();
    const otherAuthorization = { Authorization: `Bearer ${otherToken}` };
    assert.equal(seriesIn(await getWeek(nextWeek, otherAuthorization)), undefined);
    const forbiddenUpdate = await request(`/api/events/${nextWeek}/events/${seriesid}`, {
        method: "PUT", headers: otherAuthorization,
        body: { event: { title: "Unauthorized change" } }
    });
    assert.equal(forbiddenUpdate.status, 404);

    const editSeries = await request(`/api/events/${nextWeek}/events/${seriesid}`, {
        method: "PUT", headers: authorization,
        body: { event: { title: "Updated weekly meeting", date: "2099-12-21", notes: "Series notes" } }
    });
    assert.equal(editSeries.status, 200);
    assert.equal(seriesIn(await editSeries.json()).date, "2099-12-28");
    assert.equal(seriesIn(await getWeek(weekid)).title, "Updated weekly meeting");
    assert.equal(seriesIn(await getWeek(weekid)).date, "2099-12-21");

    const moveSeries = await request(`/api/events/${nextWeek}/events/${seriesid}`, {
        method: "PUT", headers: authorization,
        body: { event: { title: "Moved weekly meeting", date: "2099-12-30", notes: "Series notes" } }
    });
    assert.equal(moveSeries.status, 200);
    const movedSeries = await moveSeries.json();
    assert.equal(movedSeries.id, nextWeek);
    assert.equal(movedSeries.weekdays.find((day) => day.day === "Wednesday").recurringEvents[0].id, seriesid);
    assert.equal(seriesIn(movedSeries).recurrenceStart, "2099-12-30");
    assert.equal(seriesIn(await getWeek(weekid)), undefined);
    assert.equal(seriesIn(await getWeek("2100-01-03")).date, "2100-01-06");

    const deleteSeries = await request(`/api/events/${nextWeek}/events/${seriesid}`, {
        method: "DELETE", headers: authorization
    });
    assert.equal(deleteSeries.status, 200);
    assert.equal(seriesIn(await getWeek(weekid)), undefined);
    assert.equal(seriesIn(await getWeek(nextWeek)), undefined);

    const moveid = "move-integration";
    const movable = await request(`/api/events/${weekid}/events`, {
        method: "POST", headers: authorization,
        body: { day: "Sunday", recurring: false, event: {
            id: moveid, title: "Movable event", date: weekid,
            category: "Work", categoryColor: "#268bd2"
        } }
    });
    assert.equal(movable.status, 201);
    const moveToMonday = await request(`/api/events/${weekid}/events/${moveid}`, {
        method: "PUT", headers: authorization,
        body: { event: { title: "Movable event", date: "2099-12-21", category: "Work", categoryColor: "#268bd2" } }
    });
    assert.equal(moveToMonday.status, 200);
    const movedInWeek = await moveToMonday.json();
    assert.equal(movedInWeek.weekdays.find((day) => day.day === "Monday").oneTimeEvents[0].id, moveid);
    assert.equal(movedInWeek.weekdays.find((day) => day.day === "Sunday").oneTimeEvents.length, 0);

    const deniedMove = await request(`/api/events/${weekid}/events/${moveid}`, {
        method: "PUT", headers: otherAuthorization,
        body: { event: { title: "Unauthorized move", date: "2099-12-30" } }
    });
    assert.equal(deniedMove.status, 404);

    const crossWeekMove = await request(`/api/events/${weekid}/events/${moveid}`, {
        method: "PUT", headers: authorization,
        body: { event: { title: "Moved across weeks", date: "2099-12-30", category: "School", categoryColor: "#6c71c4" } }
    });
    assert.equal(crossWeekMove.status, 200);
    const destination = await crossWeekMove.json();
    assert.equal(destination.id, nextWeek);
    const movedEvent = destination.weekdays.find((day) => day.day === "Wednesday").oneTimeEvents[0];
    assert.equal(movedEvent.id, moveid);
    assert.equal(movedEvent.category, "School");
    assert.equal(movedEvent.categoryColor, "#6c71c4");
    assert.equal((await getWeek(weekid)).weekdays.flatMap((day) => day.oneTimeEvents).some((event) => event.id === moveid), false);
    const invalidColor = await request(`/api/events/${nextWeek}/events/${moveid}`, {
        method: "PUT", headers: authorization,
        body: { event: { title: "Invalid color", categoryColor: "url(bad)" } }
    });
    assert.equal(invalidColor.status, 400);

    assert.equal((await request("/api/tasks")).status, 401);
    const getTasks = async (headers = authorization) => (await request("/api/tasks", { headers })).json();
    assert.deepEqual(await getTasks(), { tasks: [] });
    const createTask = (id, extra = {}) => request("/api/tasks", {
        method: "POST", headers: authorization,
        body: { task: { id, title: `Task ${id}`, ...extra } }
    });
    assert.equal((await createTask("task-one", {
        dueDate: "2100-01-07", category: "Work", categoryColor: "#268bd2",
        userid: `${username}-other`, completed: true
    })).status, 201);
    assert.equal((await createTask("task-two")).status, 201);
    assert.equal((await createTask("task-one")).status, 409);
    assert.equal((await createTask("bad-task", { dueDate: "2100-02-29" })).status, 400);
    const firstTasks = (await getTasks()).tasks;
    assert.equal(firstTasks.length, 2);
    assert.equal(firstTasks.find((task) => task.id === "task-one").userid, username);
    assert.equal(firstTasks.every((task) => !task.completed), true);
    assert.equal((await getTasks(otherAuthorization)).tasks.length, 0);
    for (const [method, suffix, body] of [
        ["PUT", "", { task: { title: "Unauthorized" } }],
        ["PATCH", "/completion", { completed: true }],
        ["DELETE", "", undefined]
    ]) {
        assert.equal((await request(`/api/tasks/task-one${suffix}`, {
            method, headers: otherAuthorization, body
        })).status, 404);
    }
    const completeTask = (id, completed) => request(`/api/tasks/${id}/completion`, {
        method: "PATCH", headers: authorization, body: { completed }
    });
    assert.equal((await completeTask("task-two", true)).status, 200);
    assert.equal((await completeTask("task-one", true)).status, 200);
    const completedTasks = (await getTasks()).tasks;
    assert.deepEqual(completedTasks.map((task) => task.id), ["task-one", "task-two"]);
    assert.equal(completedTasks.every((task) => Boolean(task.completedAt)), true);
    assert.equal((await completeTask("task-two", true)).status, 200);
    assert.deepEqual((await getTasks()).tasks, completedTasks);
    assert.equal((await completeTask("task-one", false)).status, 200);
    const reopened = (await getTasks()).tasks;
    assert.equal(reopened[0].id, "task-one");
    assert.equal(reopened[0].completed, false);
    assert.equal(reopened[0].completedAt, undefined);
    assert.equal((await completeTask("task-one", "yes")).status, 400);
    const taskUpdate = await request("/api/tasks/task-one", {
        method: "PUT", headers: authorization,
        body: { task: { title: "Updated task", description: "Saved description", notes: "Saved notes", dueDate: "", category: "Personal", categoryColor: "#859900" } }
    });
    assert.equal(taskUpdate.status, 200);
    const updatedTask = (await taskUpdate.json()).tasks.find((task) => task.id === "task-one");
    assert.equal(updatedTask.title, "Updated task");
    assert.equal(updatedTask.dueDate, undefined);
    assert.equal(updatedTask.notes, "Saved notes");
    assert.equal(updatedTask.categoryColor, "#859900");
    assert.equal(updatedTask.id, "task-one");
    assert.equal(updatedTask.createdAt, firstTasks.find((task) => task.id === "task-one").createdAt);
    const editCompleted = await request("/api/tasks/task-two", {
        method: "PUT", headers: authorization, body: { task: { title: "Edited completed task" } }
    });
    assert.equal(editCompleted.status, 200);
    const stillCompleted = (await editCompleted.json()).tasks.find((task) => task.id === "task-two");
    assert.equal(stillCompleted.completed, true);
    assert.equal(stillCompleted.completedAt, completedTasks.find((task) => task.id === "task-two").completedAt);
    const taskDocuments = await databaseClient.db("WebDev437").collection("tasks").find({ userid: username }).toArray();
    assert.equal(taskDocuments.length, 2);
    assert.equal(taskDocuments.every((task) => !Object.hasOwn(task, "week")), true);
    for (const id of ["task-one", "task-two"]) {
        assert.equal((await request(`/api/tasks/${id}`, { method: "DELETE", headers: authorization })).status, 200);
    }
    assert.deepEqual(await getTasks(), { tasks: [] });
    assert.equal((await request("/api/tasks/task-one", { method: "DELETE", headers: authorization })).status, 404);
});

async function startServer() {
    server = spawn(process.execPath, ["dist/index.js"], {
        cwd: serverDirectory,
        env: { ...process.env, PORT: String(port) },
        stdio: ["ignore", "pipe", "pipe"]
    });

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(
            () => reject(new Error("Server did not become ready in time")),
            60000
        );
        let errors = "";

        server.stderr.on("data", (chunk) => {
            errors += chunk.toString();
        });
        server.stdout.on("data", (chunk) => {
            if (chunk.toString().includes("Server running")) {
                clearTimeout(timeout);
                resolve();
            }
        });
        server.on("exit", (code) => {
            clearTimeout(timeout);
            reject(new Error(`Server exited with ${code}: ${errors}`));
        });
    });
}

async function connectForCleanup() {
    const { MONGO_USER, MONGO_PWD, MONGO_CLUSTER } = process.env;
    const uri = `mongodb+srv://${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(MONGO_PWD)}@${MONGO_CLUSTER}/WebDev437?retryWrites=true&w=majority`;
    const client = new MongoClient(uri);
    await client.connect();
    return client;
}

function request(path, options = {}) {
    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
    };

    return fetch(`${baseUrl}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
}
