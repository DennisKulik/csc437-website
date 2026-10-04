import { css, html, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { BrowserHistory, fromHistory } from "@unbndl/switch";
import { categories, categoryColor } from "../categories.ts";

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

type EventViewModel = Model & { location?: Location };

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

    viewModel = createViewModel<EventViewModel>({
        eventsStatus: "idle",
        userStatus: "idle"
    })
        .with(
            fromStore<EventViewModel>(this),
            "events",
            "eventsStatus",
            "eventsError",
            "currentWeekId"
        )
        .with(fromHistory(this), "location");

    view: Template<[EventViewModel]> = html`
        <main class="page">
            ${($) => this.renderView($)}
        </main>
    `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, page.styles, card.styles, button.styles, EventViewElement.styles)
            .replace(this.viewModel.render(this.view))
            .listen({
                submit: (event: globalThis.Event) => this.submitEventForm(event),
                change: (event: globalThis.Event) => this.changeEventFields(event)
            })
            .delegate(".delete-event-button", {
                click: () => this.deleteSelectedEvent()
            })
            .delegate(".retry-events-button", {
                click: () => this.requestWeek()
            });
        this.viewModel.createEffect(($) => {
            const location = $.location;
            if (!location || location.pathname !== "/app/event") return;
            const query = new URLSearchParams(location.search);
            const weekid = query.get("week");
            if (!weekid || query.get("new") === "true") return;
            const current = this.viewModel.toObject();
            if (current.currentWeekId !== weekid) {
                Store.dispatch(this, ["events/request", { weekid }]);
            }
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

    requestWeek() {
        const $ = this.viewModel.toObject();
        const weekid = this.getRequestedWeekId() || $.currentWeekId || EventViewElement.getCurrentWeekId();
        Store.dispatch(this, ["events/request", { weekid }]);
    }

    renderView(model: EventViewModel) {
        // Query-only navigation reuses this component, so rendering must observe history.
        const query = new URLSearchParams(model.location?.search || window.location.search);
        const creating = query.get("new") === "true";
        const editing = query.get("edit") === "true";
        if (!creating && (model.eventsStatus === "idle" || model.eventsStatus === "loading")) {
            return html`
                <div class="event-layout">
                    ${this.renderEventListPlaceholder(model, "Loading this week...")}
                    <article class="event-detail load-state card border-small" role="status" aria-live="polite">
                        <h1>Loading events...</h1>
                    </article>
                </div>
            `;
        }

        if (!creating && model.eventsStatus === "error") {
            return html`
                <div class="event-layout">
                    ${this.renderEventListPlaceholder(model, "Event list unavailable.")}
                    <article class="event-detail load-state card border-small" role="alert">
                        <h1>Events unavailable</h1>
                        <p>${model.eventsError || "This week could not be loaded."}</p>
                        <button type="button" class="button hover-lift retry-events-button">
                            Try Again
                        </button>
                    </article>
                </div>
            `;
        }

        return html`
            <div class="event-layout">
                ${[
                    this.renderEventList(model),
                    creating || editing
                    ? this.renderEventForm(model)
                    : this.renderEventDetail(model)
                ]}
            </div>
        `;
    }

    renderEventListPlaceholder(model: Model, message: string) {
        const weekid = model.currentWeekId || this.getRequestedWeekId() || EventViewElement.getCurrentWeekId();

        return html`
            <aside class="event-list card border-small" aria-label="Events">
                <div class="list-header">
                    <p class="eyebrow">Week of ${this.formatWeek(weekid)}</p>
                    <h2>Events</h2>
                </div>
                <p class="empty-list">${message}</p>
            </aside>
        `;
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
        const day = editing ? selected!.day : this.getRequestedDay();
        const eventKey = existingEvent?.id || existingEvent?.title;
        const cancelHref = editing && eventKey
            ? `/app/event?week=${encodeURIComponent(weekid)}&event=${encodeURIComponent(eventKey)}`
            : `/app?week=${encodeURIComponent(weekid)}`;

        const formView = html`
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
                            ${existingEvent?.recurrenceStart ? "Series start date" : "Date"}
                            <input name="date" type="date" value=${existingEvent?.recurrenceStart || existingEvent?.date || this.getDateForDay(weekid, day)} />
                        </label>

                        <label>
                            Time
                            <input name="time" type="time" value=${existingEvent?.time || ""} />
                        </label>
                    </div>

                    ${editing
                        ? html`
                            <input name="recurring" type="hidden" value=${selected?.recurring ? "on" : "off"} />
                            <p class="event-type">${existingEvent?.recurrenceStart
                                ? "Repeats weekly. Changing the start date moves the entire series to that weekday; all edits apply to the series."
                                : selected?.recurring
                                    ? "Older recurring label: this event appears only in its saved week."
                                    : "One-time event"}</p>
                        `
                        : html`
                            <label class="checkbox-label">
                                <input name="recurring" type="checkbox" />
                                Repeat weekly on ${day}
                            </label>
                            <p class="recurrence-help">Weekly events start on the selected day and repeat every week. Editing or deleting applies to the entire series.</p>
                        `}

                    <div class="form-row">
                        <label>
                            Category
                            <input name="category" type="text" list="event-categories" maxlength="50" value=${existingEvent?.category || ""} placeholder="Choose or enter a category" />
                            <datalist id="event-categories">
                                ${categories.map((category) => html`<option value=${category.name}></option>`)}
                            </datalist>
                        </label>

                        <label>
                            Category color
                            <input name="categoryColor" type="color" value=${categoryColor(existingEvent?.category, existingEvent?.categoryColor)} />
                        </label>

                        <label>
                            Location
                            <input name="location" type="text" maxlength="120" value=${existingEvent?.location || ""} />
                        </label>
                    </div>

                    <label>
                        Description
                        <textarea name="description" rows="4" maxlength="1000"></textarea>
                    </label>

                    <label>
                        Notes
                        <textarea name="notes" rows="3" maxlength="1000"></textarea>
                    </label>

                    <p class="form-error" role="alert" aria-live="polite"></p>

                    <div class="form-controls">
                        <button type="submit" class="button hover-lift">${editing ? "Save Changes" : "Save Event"}</button>
                        <a class="button hover-lift cancel-link" href=${cancelHref}>Cancel</a>
                    </div>
                </form>
            </article>
        `;

        const description = formView.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
        const notes = formView.querySelector<HTMLTextAreaElement>('textarea[name="notes"]');
        if (description) description.value = existingEvent?.description || "";
        if (notes) notes.value = existingEvent?.notes || "";
        return formView;
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
                        <p class="eyebrow">${event.recurrenceStart ? "Weekly event" : selected.recurring ? "Recurring label" : "One-time event"}</p>
                        <h1>${event.title}</h1>
                    </div>
                    <p class="status">${selected.day}</p>
                </header>

                ${event.recurrenceStart ? html`
                    <p class="recurrence-help">Repeats every ${selected.day} from ${event.recurrenceStart}. Editing or deleting applies to the entire series.</p>
                ` : ""}

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
                        <a class="button hover-lift edit-link" href=${editHref}>${event.recurrenceStart ? "Edit Series" : "Edit Event"}</a>
                        <button type="button" class="button hover-lift delete-event-button">${event.recurrenceStart ? "Delete Series" : "Delete Event"}</button>
                    </div>
                    <p class="detail-error" role="alert" aria-live="polite"></p>
                ` : html`
                    <p class="legacy-note">This older event can be viewed, but it needs an ID before it can be edited.</p>
                `}
            </article>
        `;
    }

    changeEventFields(domEvent: globalThis.Event) {
        const checkbox = domEvent.target as HTMLInputElement;
        const form = checkbox.form;
        if (!form) return;
        if (checkbox.name === "category") {
            const color = form.querySelector<HTMLInputElement>('input[name="categoryColor"]');
            if (color) color.value = categoryColor(checkbox.value);
            return;
        }
        if (checkbox.name === "date" && checkbox.value && !checkbox.readOnly) {
            const chosenDate = new Date(`${checkbox.value}T00:00:00`);
            const day = EventViewElement.weekdays[chosenDate.getDay()];
            const dayInput = form.querySelector<HTMLInputElement>('input[name="day"]');
            const dayLabel = form.querySelector(".readonly-input");
            if (dayInput) dayInput.value = day;
            if (dayLabel) dayLabel.textContent = day;
            const recurring = form.querySelector<HTMLInputElement>('input[type="checkbox"][name="recurring"]');
            if (recurring?.parentElement) recurring.parentElement.lastChild!.textContent = ` Repeat weekly on ${day}`;
            return;
        }
        if (checkbox.name !== "recurring" || checkbox.type !== "checkbox") return;
        const data = new FormData(form);
        const date = form.querySelector<HTMLInputElement>('input[name="date"]');
        if (date) {
            date.readOnly = checkbox.checked;
            if (checkbox.checked) {
                // The date determines the weekday and week when a new event is saved.
                if (!date.value) date.value = this.getDateForDay(String(data.get("weekid")), String(data.get("day")));
            }
        }
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
            categoryColor: String(data.get("categoryColor") || ""),
            date: String(data.get("date") || ""),
            time: String(data.get("time") || ""),
            location: String(data.get("location") || "").trim(),
            description: String(data.get("description") || "").trim(),
            notes: String(data.get("notes") || "").trim()
        };
        const recurring = data.get("recurring") === "on";
        const selected = this.getSelectedEvent(this.getEventList(this.viewModel.toObject().events));
        const movingDate = event.date && !(existingEventId && selected?.event.recurrenceStart === event.date)
            ? new Date(`${event.date}T00:00:00`) : undefined;
        const destinationDay = movingDate ? EventViewElement.weekdays[movingDate.getDay()] : day;
        if (movingDate) movingDate.setDate(movingDate.getDate() - movingDate.getDay());
        const destinationWeek = movingDate ? EventViewElement.toDateId(movingDate) : weekid;
        const submitButton = form.querySelector("button[type='submit']") as HTMLButtonElement;
        const errorMessage = form.querySelector(".form-error") as HTMLParagraphElement;

        submitButton.disabled = true;
        errorMessage.textContent = "";

        const callbacks = {
            onSuccess: () => {
                BrowserHistory.dispatch(this, "history/navigate", {
                    href: `/app/event?week=${encodeURIComponent(destinationWeek)}&event=${encodeURIComponent(event.id || event.title)}`
                });
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
                { weekid: destinationWeek, day: destinationDay, recurring, event },
                callbacks
            ]);
        }
    }

    deleteSelectedEvent() {
        const model = this.viewModel.toObject();
        const selected = this.getSelectedEvent(this.getEventList(model.events));
        const eventid = selected?.event.id;
        const weekid = this.getRequestedWeekId() || model.currentWeekId || model.events?.id;

        const deletePrompt = selected?.event.recurrenceStart
            ? `Delete all weekly occurrences of "${selected.event.title}"?`
            : `Delete "${selected?.event.title}"?`;
        if (!eventid || !weekid || !window.confirm(deletePrompt)) return;

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
                    <small>${event.event.recurrenceStart ? "Weekly" : event.recurring ? "Recurring label" : "One time"}</small>
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
            grid-template-areas: "list detail";
            grid-template-columns: minmax(220px, 2fr) minmax(0, 5fr);
            gap: var(--padding-standard);
            margin: var(--padding-standard);
        }

        .event-list {
            grid-area: list;
            min-width: 0;
        }

        .event-detail {
            grid-area: detail;
            min-width: 0;
        }

        .event-list,
        .event-detail {
            padding: var(--padding-standard);
            background-color: var(--color-secondary);
            color: var(--text-primary);
        }

        .load-state {
            text-align: center;
        }

        .load-state p {
            margin: var(--padding-small) 0;
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

        .event-form input[type="color"] {
            height: 3rem;
            cursor: pointer;
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
                grid-template-areas:
                    "list"
                    "detail";
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
