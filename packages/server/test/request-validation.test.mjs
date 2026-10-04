import assert from "node:assert/strict";
import test from "node:test";

import {
    loginFromRequest,
    profileFromRequest,
    registrationFromRequest,
    taskFromRequest
} from "../dist/request-validation.js";

test("registration validation normalizes a valid account", () => {
    const registration = registrationFromRequest({
        username: "  dennis.test  ",
        password: "a-secure-password",
        displayName: "  Dennis  ",
        bio: "  Planner user  ",
        profilePicture: ""
    });

    assert.deepEqual(registration, {
        username: "dennis.test",
        password: "a-secure-password",
        profile: {
            userid: "dennis.test",
            username: "dennis.test",
            displayName: "Dennis",
            bio: "Planner user",
            profilePicture: ""
        }
    });
});

test("task validation normalizes editable fields and ignores ownership and completion metadata", () => {
    assert.deepEqual(taskFromRequest({
        title: "  Write notes  ", description: "  Description  ", notes: "",
        dueDate: "2028-02-29", category: " School ", categoryColor: "#6c71c4",
        userid: "another-user", completed: true, completedAt: "forged"
    }), {
        title: "Write notes", description: "Description", notes: undefined,
        dueDate: "2028-02-29", category: "School", categoryColor: "#6c71c4"
    });
    assert.equal(taskFromRequest({ title: "No deadline" }).dueDate, undefined);
});

test("task validation rejects invalid titles, dates, colors, and oversized text", () => {
    for (const invalid of [null, [], { title: " " }, { title: "x".repeat(101) },
        { title: "Task", dueDate: "2026-02-29" }, { title: "Task", dueDate: "not-a-date" },
        { title: "Task", categoryColor: "url(bad)" }, { title: "Task", notes: "x".repeat(1001) },
        { title: "Task", description: 42 }]) {
        assert.equal(taskFromRequest(invalid), undefined);
    }
});

test("registration rejects invalid usernames, short passwords, and missing profiles", () => {
    assert.equal(registrationFromRequest({
        username: "bad username",
        password: "a-secure-password",
        displayName: "Dennis"
    }), undefined);

    assert.equal(registrationFromRequest({
        username: "dennis",
        password: "short",
        displayName: "Dennis"
    }), undefined);

    assert.equal(registrationFromRequest({
        username: "dennis",
        password: "a-secure-password"
    }), undefined);
});

test("profile validation enforces required and maximum-length fields", () => {
    assert.equal(profileFromRequest({ displayName: "" }, "dennis"), undefined);
    assert.equal(profileFromRequest({
        displayName: "Dennis",
        bio: "x".repeat(1001)
    }, "dennis"), undefined);

    assert.equal(
        profileFromRequest({ displayName: "Dennis" }, "dennis")?.userid,
        "dennis"
    );
});

test("login validation preserves passwords while trimming usernames", () => {
    assert.deepEqual(loginFromRequest({
        username: "  dennis  ",
        password: " password with spaces "
    }), {
        username: "dennis",
        password: " password with spaces "
    });

    assert.equal(loginFromRequest(null), undefined);
    assert.equal(loginFromRequest({ username: "dennis", password: "" }), undefined);
});
