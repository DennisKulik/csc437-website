import assert from "node:assert/strict";
import test from "node:test";
import { dateForDay, expandWeeklyEvents } from "../dist/recurrence.js";

function week(id, userid = "test-user") {
    return {
        id, userid, week: new Date(`${id}T00:00:00Z`),
        weekdays: [{
            day: "Monday", oneTimeEvents: [],
            recurringEvents: [{ id: "weekly", title: "Weekly meeting", date: "2026-12-28", recurrenceStart: "2026-12-28" }]
        }]
    };
}

test("weekly dates cross year and leap-day boundaries", () => {
    assert.equal(dateForDay("2026-12-27", "Saturday"), "2027-01-02");
    assert.equal(dateForDay("2028-02-27", "Tuesday"), "2028-02-29");
});

test("a series appears once in its start week and in future weeks, never before its start", () => {
    const source = week("2026-12-27");
    const original = structuredClone(source);
    assert.equal(expandWeeklyEvents("2026-12-20", "test-user", undefined, [source]), undefined);
    const start = expandWeeklyEvents(source.id, source.userid, source, [source]);
    assert.equal(start.weekdays[0].recurringEvents.length, 1);
    const future = expandWeeklyEvents("2027-01-03", "test-user", undefined, [source]);
    assert.equal(future.weekdays[0].recurringEvents[0].date, "2027-01-04");
    assert.equal(future.weekdays[0].recurringEvents[0].id, "weekly");
    assert.deepEqual(source, original);
});

test("expansion preserves local events, excludes other users, and leaves old recurring labels local", () => {
    const local = week("2027-01-03");
    local.weekdays[0].recurringEvents = [{ id: "legacy", title: "Old label" }];
    local.weekdays[0].oneTimeEvents = [{ id: "one-time", title: "Appointment" }];
    const expanded = expandWeeklyEvents(local.id, local.userid, local, [
        week("2026-12-27"), week("2026-12-27", "other-user")
    ]);
    assert.equal(expanded.weekdays[0].oneTimeEvents.length, 1);
    assert.deepEqual(expanded.weekdays[0].recurringEvents.map((event) => event.id), ["legacy", "weekly"]);
    assert.equal(expandWeeklyEvents("2027-01-10", local.userid, undefined, [local]), undefined);
});
