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

test("registration, profile ownership, and event persistence", async (context) => {
    context.after(async () => {
        if (databaseClient) {
            const database = databaseClient.db("WebDev437");
            const identities = [username, `${username}-other`];
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
