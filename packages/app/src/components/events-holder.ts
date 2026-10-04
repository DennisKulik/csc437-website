import { html, css, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";

import type { Model } from "../model.ts";
import reset from "../styles/reset.css.js";
import button from "../styles/button.css.ts";
import { categoryColor } from "../categories.ts";

type EventCard = {
    id?: string;
    title: string;
    href: string;
    category?: string;
    categoryColor?: string;
};

type Weekday = {
    day: string;
    oneTimeEvents: EventCard[];
    recurringEvents: EventCard[];
};

type EventsViewModel = Model & { categoryFilter: string };

export class MomentumEventsHolder extends HTMLElement {
    static weekdays = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    viewModel = createViewModel<EventsViewModel>({
        categoryFilter: "",
        eventsStatus: "idle",
        userStatus: "idle"
    })
        .with(
            fromStore<Model>(this),
            "events",
            "eventsStatus",
            "eventsError",
            "currentWeekId"
        );

    view: Template<[EventsViewModel]> = html`
        <div class="events-holder">
            <div class="section-header">
                <h2>Events</h2>
                <div class="week-controls">
                    <button type="button" class="button hover-lift prev-week-button">Prev</button>
                    <span class="section-meta">
                        ${($) =>
                            MomentumEventsHolder.formatWeek(
                                $.currentWeekId || $.events?.id || MomentumEventsHolder.getCurrentWeekId()
                            )}
                    </span>
                    <button type="button" class="button hover-lift next-week-button">Next</button>
                    <button type="button" class="button hover-lift current-week-button">This Week</button>
                </div>
            </div>

            <div class="category-controls">
                ${($) => this.renderCategoryFilter($)}
            </div>

            <div class="weekday-list">
                ${($) => this.renderWeekState($)}
            </div>
        </div>
    `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, button.styles, MomentumEventsHolder.styles)
            .replace(this.viewModel.render(this.view))
            .delegate(".prev-week-button", {
                click: () => Store.dispatch(this, ["events/week-prev", {}])
            })
            .delegate(".next-week-button", {
                click: () => Store.dispatch(this, ["events/week-next", {}])
            })
            .delegate(".current-week-button", {
                click: () => Store.dispatch(this, ["events/week-current", {}])
            })
            .listen({
                change: (event: Event) => {
                    const select = event.target as HTMLSelectElement;
                    if (select.name === "categoryFilter") {
                        this.viewModel.update({ categoryFilter: select.value });
                    }
                }
            })
            .delegate(".retry-events-button", {
                click: () => this.requestCurrentWeek()
            });
    }

    connectedCallback() {
        const $ = this.viewModel.toObject();
        const requestedWeekId = new URLSearchParams(window.location.search).get("week");
        const weekid = requestedWeekId || $.currentWeekId || $.events?.id || MomentumEventsHolder.getCurrentWeekId();
        if ($.events?.id !== weekid) {
            Store.dispatch(this, ["events/request", { weekid }]);
        }
    }

    requestCurrentWeek() {
        const $ = this.viewModel.toObject();
        const weekid = $.currentWeekId || $.events?.id || MomentumEventsHolder.getCurrentWeekId();
        Store.dispatch(this, ["events/request", { weekid }]);
    }

    renderCategoryFilter(model: EventsViewModel) {
        const names = new Set<string>();
        for (const day of model.events?.weekdays || []) {
            for (const event of [...day.oneTimeEvents, ...day.recurringEvents]) {
                names.add(event.category || "Uncategorized");
            }
        }
        if (model.categoryFilter) names.add(model.categoryFilter);
        const control = html`
            <label>Category
                <select name="categoryFilter">
                    <option value="">All categories</option>
                    ${Array.from(names).sort().map((name) => html`<option value=${name}>${name}</option>`)}
                </select>
            </label>
        `;
        control.querySelector<HTMLSelectElement>("select")!.value = model.categoryFilter;
        return control;
    }

    renderWeekState(model: EventsViewModel) {
        if (model.eventsStatus === "idle" || model.eventsStatus === "loading") {
            return html`
                <div class="week-state" role="status" aria-live="polite">
                    Loading this week...
                </div>
            `;
        }

        if (model.eventsStatus === "error") {
            return html`
                <div class="week-state week-error" role="alert">
                    <p>${model.eventsError || "This week could not be loaded."}</p>
                    <button type="button" class="button hover-lift retry-events-button">
                        Try Again
                    </button>
                </div>
            `;
        }

        const weekid = model.currentWeekId || model.events?.id || MomentumEventsHolder.getCurrentWeekId();
        const weekdays = MomentumEventsHolder.getWeekdays(model.events?.weekdays as Weekday[] | undefined)
            .map((day) => ({
                ...day,
                oneTimeEvents: day.oneTimeEvents.filter((event) => !model.categoryFilter || (event.category || "Uncategorized") === model.categoryFilter),
                recurringEvents: day.recurringEvents.filter((event) => !model.categoryFilter || (event.category || "Uncategorized") === model.categoryFilter)
            }));
        const eventCount = weekdays.reduce(
            (total, weekday) => total + weekday.oneTimeEvents.length + weekday.recurringEvents.length,
            0
        );

        return html`
            ${eventCount === 0 ? html`
                <p class="empty-week" role="status">
                    ${model.categoryFilter
                        ? "No events in this week match the selected category."
                        : "Nothing is scheduled for this week yet. Add an event to any day below."}
                </p>
            ` : ""}
            ${weekdays.map((weekday) => MomentumEventsHolder.renderWeekday(weekday, weekid))}
        `;
    }

    static getCurrentWeekId(): string {
        const today = new Date();
        const day = today.getDay();
        today.setDate(today.getDate() - day);
        return this.toWeekId(today);
    }

    static toWeekId(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    static formatWeek(week: string): string {
        return week.slice(0, 10);
    }

    static renderEvent(event: EventCard, slotName: string, weekid: string) {
        const { title } = event;
        const eventKey = event.id || title;
        const eventHref = `/app/event?event=${encodeURIComponent(eventKey)}&week=${encodeURIComponent(weekid)}`;

        return html`
            <li slot=${slotName}>
                <momentum-event-card href=${eventHref} category=${event.category || ""} category-color=${categoryColor(event.category, event.categoryColor)}>
                    ${title}
                </momentum-event-card>
            </li>
        `;
    }
    
    static getWeekdays(weekdays: Weekday[] | undefined): Weekday[] {
        const weekdaysByName = new Map(
            (weekdays || []).map((weekday: Weekday) => [weekday.day, weekday])
        );

        return this.weekdays.map((day) => {
            const weekday = weekdaysByName.get(day);

            return {
                day,
                oneTimeEvents: weekday?.oneTimeEvents || [],
                recurringEvents: weekday?.recurringEvents || []
            };
        });
    }

    static renderWeekday(weekday: Weekday, weekid: string) {
        const day = weekday.day;
        const oneTimeEvents = weekday.oneTimeEvents || [];
        const recurringEvents = weekday.recurringEvents || [];

        return html`
            <momentum-weekday-section day=${day} week=${weekid}>
                <span slot="day">${day}</span>

                ${[
                    ...oneTimeEvents.map((event) => this.renderEvent(event, "one-time-events", weekid)),
                    ...recurringEvents.map((event) => this.renderEvent(event, "recurring-events", weekid))
                ]}
            </momentum-weekday-section>
        `;
    }
    
    static styles = css`
        :host {
            grid-column: 4 / end;
            min-width: 0;
        }
        
        @media (max-width: 1100px) {
            :host {
                grid-column: start / end;
            }
        }
        
        .events-holder {
            background-color: var(--color-primary);
            padding: var(--padding-standard);
            margin: var(--padding-standard);
            border-radius: var(--padding-small);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            display: flex;
            flex-direction: column;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            border-bottom: 5px solid var(--color-accent-dark);
            margin-bottom: var(--padding-small);
        }

        .section-header h2 {
            color: var(--text-primary);
        }

        .section-header,
        .week-controls {
            flex-wrap: wrap;
            gap: var(--padding-mini);
        }

        .week-controls {
            display: flex;
            align-items: center;
        }

        .section-meta {
            color: var(--text-primary);
        }

        .category-controls {
            margin-bottom: var(--padding-small);
            color: var(--text-primary);
        }

        .category-controls label {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: var(--padding-mini);
        }

        select {
            padding: var(--padding-mini);
            border: 2px solid var(--color-accent-dark);
            border-radius: var(--padding-mini);
            color: var(--text-primary);
            background: var(--color-secondary);
            font: inherit;
        }

        .weekday-list {
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            
            gap: var(--padding-small);
        }

        .week-state,
        .empty-week {
            padding: var(--padding-standard);
            border-radius: var(--padding-mini);
            color: var(--text-primary);
            background-color: var(--color-secondary);
            text-align: center;
        }

        .week-state p,
        .empty-week {
            margin: 0;
        }

        .week-error .button {
            margin-top: var(--padding-small);
        }
    `;
}
