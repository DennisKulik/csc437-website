import { css, html, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";

import type { Event, Events } from "server/models";
import type { Model } from "../model.ts";
import reset from "../styles/reset.css.ts";
import page from "../styles/page.css.ts";
import card from "../styles/card.css.ts";
import button from "../styles/button.css.ts";

type EventSummary = {
    event: Event;
    day: string;
    recurring: boolean;
};

export class EventViewElement extends HTMLElement {
    static weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    viewModel = createViewModel<Model>({})
        .with(fromStore<Model>(this), "events", "currentWeekId");

    view: Template<[Model]> = html`
        <main class="page">
            <div class="event-layout">
                ${($) => this.renderEventList($)}
                ${($) => this.isCreating() || this.isEditing() ? this.renderEventForm($) : this.renderEventDetail($)}
            </div>
        </main>
    `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, page.styles, card.styles, button.styles, EventViewElement.styles)
            .replace(this.viewModel.render(this.view))
            .listen({
                submit: (event: globalThis.Event) => this.submitEventForm(event)
            })
            .delegate(".delete-event-button", {
                click: () => this.deleteSelectedEvent()
            });
    }

    connectedCallback() {
        if (this.isCreating()) return;

        const $ = this.viewModel.toObject();
        const weekid = this.getRequestedWeekId() || $.currentWeekId || EventViewElement.getCurrentWeekId();

        if ($.events?.id !== weekid) {
            Store.dispatch(this, ["events/request", { weekid }]);
        }
    }

    renderEventList(model: Model) {
        const events = this.getEventList(model.events);
        const selected = this.getSelectedEvent(events);
        const weekid = model.currentWeekId || model.events?.id || this.getRequestedWeekId() || EventViewElement.getCurrentWeekId();

        return html`
            <aside class="event-list card border-small" aria-label="Events">
                <div class="list-header">
                    <p class="eyebrow">Week of ${this.formatWeek(weekid)}</p>
                    <h2>Events</h2>
                </div>

                <ul class="event-groups">
                    ${events.length
                        ? this.groupEventsByDay(events).map((group) =>
                            this.renderEventGroup(group.day, group.events, selected, weekid)
                        )
                        : html`<li class="empty-list">No events this week.</li>`}
                </ul>
            </aside>
        `;
    }

    renderEventForm(model: Model) {
        const selected = this.getSelectedEvent(this.getEventList(model.events));
        const editing = this.isEditing() && Boolean(selected?.event.id);

        if (this.isEditing() && model.events && !editing) {
            return html`
                <article class="event-detail card border-small empty-detail">
                    <p class="eyebrow">Event</p>
                    <h1>Event not found</h1>
                    <p>This event cannot be edited because it does not exist or does not have a stable ID.</p>
                </article>
            `;
        }

        const existingEvent = editing ? selected?.event : undefined;
        const weekid = this.getRequestedWeekId() || model.currentWeekId || EventViewElement.getCurrentWeekId();
        const day = selected?.day || this.getRequestedDay();
        const eventKey = existingEvent?.id || existingEvent?.title;
        const cancelHref = editing && eventKey
            ? `/app/event?week=${encodeURIComponent(weekid)}&event=${encodeURIComponent(eventKey)}`
            : `/app?week=${encodeURIComponent(weekid)}`;

        return html`
            <article class="event-detail card border-small">
                <header class="detail-header">
                    <div>
                        <p class="eyebrow">${day}, week of ${weekid}</p>
                        <h1>${editing ? "Edit Event" : "New Event"}</h1>
                    </div>
                </header>

                <form class="event-form">
                    <input type="hidden" name="weekid" value=${weekid} />
                    <input type="hidden" name="eventid" value=${existingEvent?.id || ""} />

                    <label>
                        Title
                        <input name="title" type="text" required maxlength="100" value=${existingEvent?.title || ""} autofocus />
                    </label>

                    <div class="form-row">
                        <label>
                            Day
                            <input name="day" type="hidden" value=${day} />
                            <span class="readonly-input">${day}</span>
                        </label>

                        <label>
                            Date
                            <input name="date" type="date" value=${existingEvent?.date || this.getDateForDay(weekid, day)} />
                        </label>

                        <label>
                            Time
                            <input name="time" type="time" value=${existingEvent?.time || ""} />
                        </label>
                    </div>

                    ${editing
                        ? html`
                            <input name="recurring" type="hidden" value=${selected?.recurring ? "on" : "off"} />
                            <p class="event-type">${selected?.recurring ? "Recurring event" : "One-time event"}</p>
                        `
                        : html`
                            <label class="checkbox-label">
                                <input name="recurring" type="checkbox" />
                                Recurring event
                            </label>
                        `}

                    <div class="form-row">
                        <label>
                            Category
                            <input name="category" type="text" maxlength="50" value=${existingEvent?.category || ""} />
                        </label>

                        <label>
                            Location
                            <input name="location" type="text" maxlength="120" value=${existingEvent?.location || ""} />
                        </label>
                    </div>

                    <label>
                        Description
                        <textarea name="description" rows="4" maxlength="1000">${existingEvent?.description || ""}</textarea>
                    </label>

                    <label>
                        Notes
                        <textarea name="notes" rows="3" maxlength="1000">${existingEvent?.notes || ""}</textarea>
                    </label>

                    <p class="form-error" role="alert" aria-live="polite"></p>

                    <div class="form-controls">
                        <button type="submit" class="button hover-lift">${editing ? "Save Changes" : "Save Event"}</button>
                        <a class="button hover-lift cancel-link" href=${cancelHref}>Cancel</a>
                    </div>
                </form>
            </article>
        `;
    }

    renderEventDetail(model: Model) {
        const selected = this.getSelectedEvent(this.getEventList(model.events));

        if (!selected) {
            return html`
                <article class="event-detail card border-small empty-detail">
                    <p class="eyebrow">Event</p>
                    <h1>No event selected</h1>
                    <p>Choose an event from a populated week or add a new one from the weekly planner.</p>
                </article>
            `;
        }

        const event = selected.event;
        const weekid = this.getRequestedWeekId() || model.currentWeekId || model.events?.id || EventViewElement.getCurrentWeekId();
        const editHref = event.id
            ? `/app/event?edit=true&week=${encodeURIComponent(weekid)}&event=${encodeURIComponent(event.id)}`
            : "";

        return html`
            <article class="event-detail card border-small">
                <header class="detail-header">
                    <div>
                        <p class="eyebrow">${selected.recurring ? "Recurring event" : "One-time event"}</p>
                        <h1>${event.title}</h1>
                    </div>
                    <p class="status">${selected.day}</p>
                </header>

                <dl class="detail-meta">
                    <div><dt>Category</dt><dd>${event.category || "Not specified"}</dd></div>
                    <div><dt>Date</dt><dd>${event.date || "Not specified"}</dd></div>
                    <div><dt>Time</dt><dd>${event.time || "Not specified"}</dd></div>
                    <div><dt>Location</dt><dd>${event.location || "Not specified"}</dd></div>
                </dl>

                <section>
                    <h2>Description</h2>
                    <p>${event.description || "No description provided."}</p>
                </section>

                <section>
                    <h2>Notes</h2>
                    <p>${event.notes || "No notes provided."}</p>
                </section>

                ${event.id ? html`
                    <div class="detail-controls">
                        <a class="button hover-lift edit-link" href=${editHref}>Edit Event</a>
                        <button type="button" class="button hover-lift delete-event-button">Delete Event</button>
                    </div>
                    <p class="detail-error" role="alert" aria-live="polite"></p>
                ` : html`
                    <p class="legacy-note">This older event can be viewed, but it needs an ID before it can be edited.</p>
                `}
            </article>
        `;
    }

    submitEventForm(domEvent: globalThis.Event) {
        domEvent.preventDefault();

        const form = domEvent.target as HTMLFormElement;
        if (!form.classList.contains("event-form")) return;

        const data = new FormData(form);
        const weekid = String(data.get("weekid") || "");
        const day = String(data.get("day") || "");
        const existingEventId = String(data.get("eventid") || "");
        const event: Event = {
            id: existingEventId || crypto.randomUUID(),
            title: String(data.get("title") || "").trim(),
            category: String(data.get("category") || "").trim(),
            date: String(data.get("date") || ""),
            time: String(data.get("time") || ""),
            location: String(data.get("location") || "").trim(),
            description: String(data.get("description") || "").trim(),
            notes: String(data.get("notes") || "").trim()
        };
        const recurring = data.get("recurring") === "on";
        const submitButton = form.querySelector("button[type='submit']") as HTMLButtonElement;
        const errorMessage = form.querySelector(".form-error") as HTMLParagraphElement;

        submitButton.disabled = true;
        errorMessage.textContent = "";

        const callbacks = {
            onSuccess: () => {
                window.location.href = `/app/event?week=${encodeURIComponent(weekid)}&event=${encodeURIComponent(event.id || event.title)}`;
            },
            onFailure: () => {
                submitButton.disabled = false;
                errorMessage.textContent = "The event could not be saved. Please try again.";
            }
        };

        if (existingEventId) {
            Store.dispatch(this, [
                "events/update",
                { weekid, eventid: existingEventId, event },
                callbacks
            ]);
        } else {
            Store.dispatch(this, [
                "events/create",
                { weekid, day, recurring, event },
                callbacks
            ]);
        }
    }

    deleteSelectedEvent() {
        const model = this.viewModel.toObject();
        const selected = this.getSelectedEvent(this.getEventList(model.events));
        const eventid = selected?.event.id;
        const weekid = this.getRequestedWeekId() || model.currentWeekId || model.events?.id;

        if (!eventid || !weekid || !window.confirm(`Delete "${selected.event.title}"?`)) return;

        const deleteButton = this.shadowRoot?.querySelector(".delete-event-button") as HTMLButtonElement | null;
        const errorMessage = this.shadowRoot?.querySelector(".detail-error") as HTMLParagraphElement | null;
        if (deleteButton) deleteButton.disabled = true;

        Store.dispatch(this, [
            "events/delete",
            { weekid, eventid },
            {
                onSuccess: () => {
                    window.location.href = `/app?week=${encodeURIComponent(weekid)}`;
                },
                onFailure: () => {
                    if (deleteButton) deleteButton.disabled = false;
                    if (errorMessage) errorMessage.textContent = "The event could not be deleted. Please try again.";
                }
            }
        ]);
    }

    getEventList(events: Events | undefined): EventSummary[] {
        return (events?.weekdays || []).flatMap((weekday) => [
            ...(weekday.oneTimeEvents || []).map((event) => ({ event, day: weekday.day, recurring: false })),
            ...(weekday.recurringEvents || []).map((event) => ({ event, day: weekday.day, recurring: true }))
        ]);
    }

    getSelectedEvent(events: EventSummary[]): EventSummary | undefined {
        const requestedEvent = new URLSearchParams(window.location.search).get("event");

        return events.find(({ event }) => event.id === requestedEvent || event.title === requestedEvent) || events[0];
    }

    getRequestedWeekId(): string | null {
        return new URLSearchParams(window.location.search).get("week");
    }

    getRequestedDay(): string {
        const requestedDay = new URLSearchParams(window.location.search).get("day");
        return EventViewElement.weekdays.includes(requestedDay || "") ? requestedDay! : "Sunday";
    }

    isCreating(): boolean {
        return new URLSearchParams(window.location.search).get("new") === "true";
    }

    isEditing(): boolean {
        return new URLSearchParams(window.location.search).get("edit") === "true";
    }

    getDateForDay(weekid: string, day: string): string {
        const date = new Date(`${weekid}T00:00:00`);
        const dayIndex = EventViewElement.weekdays.indexOf(day);
        date.setDate(date.getDate() + Math.max(dayIndex, 0));
        return EventViewElement.toDateId(date);
    }

    formatWeek(weekid: string): string {
        return weekid;
    }

    groupEventsByDay(events: EventSummary[]): Array<{ day: string; events: EventSummary[] }> {
        const groups = new Map<string, EventSummary[]>();

        events.forEach((event) => {
            const eventsForDay = groups.get(event.day) || [];
            eventsForDay.push(event);
            groups.set(event.day, eventsForDay);
        });

        return Array.from(groups, ([day, groupedEvents]) => ({ day, events: groupedEvents }));
    }

    renderEventGroup(day: string, events: EventSummary[], selected: EventSummary | undefined, weekid: string) {
        return html`
            <li class="day-group">
                <h3>${day}</h3>
                <ul class="day-events">
                    ${events.map((event) => this.renderEventListItem(event, selected, weekid))}
                </ul>
            </li>
        `;
    }

    renderEventListItem(event: EventSummary, selected: EventSummary | undefined, weekid: string) {
        const eventKey = event.event.id || event.event.title;
        const selectedKey = selected?.event.id || selected?.event.title;
        const eventHref = `/app/event?event=${encodeURIComponent(eventKey)}&week=${encodeURIComponent(weekid)}`;
        const selectedClass = eventKey === selectedKey ? " selected" : "";

        return html`
            <li>
                <a class=${`event-list-item${selectedClass}`} href=${eventHref}>
                    <span>${event.event.title}</span>
                    <small>${event.recurring ? "Recurring" : "One time"}</small>
                </a>
            </li>
        `;
    }

    static getCurrentWeekId(): string {
        const today = new Date();
        today.setDate(today.getDate() - today.getDay());
        return this.toDateId(today);
    }

    static toDateId(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    static styles = css`
        .page {
            display: grid;
            grid-template-columns: repeat(8, minmax(0, 1fr));
        }

        .event-layout {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: minmax(220px, 2fr) minmax(0, 5fr);
            gap: var(--padding-standard);
            margin: var(--padding-standard);
        }

        .event-list,
        .event-detail {
            padding: var(--padding-standard);
            background-color: var(--color-secondary);
            color: var(--text-primary);
        }

        .list-header,
        .detail-header {
            border-bottom: 2px solid var(--color-accent-dark);
            padding-bottom: var(--padding-small);
        }

        .detail-header {
            display: flex;
            justify-content: space-between;
            gap: var(--padding-small);
            align-items: flex-start;
        }

        .eyebrow {
            margin: 0 0 var(--padding-tiny);
            color: var(--text-primary);
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
            margin-top: 0;
        }

        h1,
        h2,
        h3 {
            color: var(--text-primary);
        }

        h1 {
            margin-bottom: 0;
            font-size: clamp(32px, 4vw, 48px);
        }

        .event-list h2 {
            margin-bottom: 0;
            font-size: 32px;
        }

        .event-groups,
        .day-events {
            display: flex;
            flex-direction: column;
            gap: var(--padding-mini);
            padding: 0;
            list-style: none;
        }

        .event-groups {
            margin: var(--padding-standard) 0 0;
        }

        .day-group + .day-group {
            padding-top: var(--padding-standard);
            border-top: 1px solid var(--color-accent-dark);
        }

        .day-group h3 {
            margin: 0 0 var(--padding-mini);
            font-size: 20px;
        }

        .event-list-item {
            display: block;
            width: 100%;
            padding: var(--padding-small);
            border: 2px solid transparent;
            border-radius: var(--padding-mini);
            color: var(--text-primary);
            background: transparent;
            font: inherit;
            text-align: left;
            text-decoration: none;
        }

        .event-list-item:hover,
        .event-list-item.selected {
            background-color: var(--color-primary);
        }

        .event-list-item.selected {
            border-color: var(--color-accent-dark);
            font-weight: 700;
        }

        .event-list-item span,
        .event-list-item small {
            display: block;
        }

        .event-list-item small {
            margin-top: var(--padding-tiny);
            font-weight: 400;
        }

        .empty-list,
        .empty-detail p {
            color: var(--text-primary);
        }

        .status {
            margin: 0;
            padding: var(--padding-mini) var(--padding-small);
            border-radius: var(--padding-small);
            background-color: var(--color-primary);
            font-weight: 600;
        }

        .detail-meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: var(--padding-standard);
            margin: var(--padding-standard) 0;
        }

        .detail-meta div {
            padding: var(--padding-small);
            border-radius: var(--padding-mini);
            background-color: var(--color-background);
        }

        dt {
            font-weight: 700;
        }

        dd {
            margin: var(--padding-tiny) 0 0;
        }

        section + section {
            margin-top: var(--padding-standard);
        }

        section h2 {
            margin-bottom: var(--padding-mini);
            font-size: 26px;
        }

        section p {
            margin-bottom: 0;
            line-height: 1.4;
        }

        .event-form {
            display: flex;
            flex-direction: column;
            gap: var(--padding-standard);
            margin-top: var(--padding-standard);
        }

        .event-form label {
            display: flex;
            flex-direction: column;
            gap: var(--padding-tiny);
            font-weight: 700;
        }

        .event-form input,
        .event-form select,
        .event-form textarea {
            width: 100%;
            padding: var(--padding-mini);
            border: 2px solid var(--color-primary);
            border-radius: var(--padding-mini);
            color: var(--text-primary);
            background-color: var(--color-background);
            font: inherit;
            font-weight: 400;
        }

        .readonly-input {
            padding: var(--padding-mini);
            border: 2px solid var(--color-primary);
            border-radius: var(--padding-mini);
            background-color: var(--color-background);
            font-weight: 400;
        }

        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: var(--padding-small);
        }

        .checkbox-label {
            flex-direction: row !important;
            align-items: center;
        }

        .checkbox-label input {
            width: auto;
        }

        .form-controls {
            display: flex;
            align-items: center;
            gap: var(--padding-small);
        }

        .detail-controls {
            display: flex;
            gap: var(--padding-small);
            margin-top: var(--padding-standard);
        }

        .edit-link {
            display: inline-block;
            text-decoration: none;
        }

        .delete-event-button {
            background-color: var(--solarized-red);
        }

        .detail-error,
        .legacy-note {
            margin: var(--padding-small) 0 0;
        }

        .detail-error {
            color: var(--solarized-red);
        }

        .event-type {
            margin: 0;
            font-weight: 700;
        }

        .cancel-link {
            display: inline-block;
            text-decoration: none;
        }

        .form-error {
            min-height: 1.5em;
            margin: 0;
            color: var(--solarized-red);
        }

        @media (max-width: 700px) {
            .event-layout {
                grid-template-columns: 1fr;
                gap: var(--padding-small);
                margin: var(--padding-small);
            }

            .event-list,
            .event-detail {
                padding: var(--padding-small);
            }

            .detail-meta,
            .form-row {
                grid-template-columns: 1fr;
            }
        }
    `;
}
