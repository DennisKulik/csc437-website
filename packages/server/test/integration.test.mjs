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
            await database.collection("events").deleteMany({ userid: username });
            await database.collection("users").deleteMany({ userid: username });
            await database.collection("user_credentials").deleteMany({ username });
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
