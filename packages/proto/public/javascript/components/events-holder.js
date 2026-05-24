import { html, css, shadow } from "@unbndl/html";
import { createViewModel, fromAttributes } from "@unbndl/view";
import { fromAuth } from "@unbndl/auth";
import reset from "/styles/reset.css.js";

export class MomentumEventsHolder extends HTMLElement {

    viewModel = createViewModel({
        authenticated: false,
        token: undefined,
        currentWeekId: MomentumEventsHolder.getCurrentWeekId(),
        week: "",
        weekdays: []
    })
    .with(fromAttributes(this), "src")
    .with(fromAuth(this), "authenticated", "token");

    view = html`
        <div class="events-holder">
            <div class="section-header">
                <h2>Events</h2>
                <div class="week-controls">
                    <button type="button" class="button hover-lift prev-week-button">Prev</button>
                    <span class="section-meta">
                        ${($) => MomentumEventsHolder.formatWeek($.week || $.currentWeekId)}
                    </span>
                    <button type="button" class="button hover-lift next-week-button">Next</button>
                </div>
            </div>

            <div class="weekday-list">
                ${($) => ($.weekdays || []).map((weekday) => MomentumEventsHolder.renderWeekday(weekday))}
            </div>
        </div>
        `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, MomentumEventsHolder.styles)
            .replace(this.viewModel.render(this.view))
            .delegate(".prev-week-button", {
                click: () => this.shiftWeek(-7)
            })
            .delegate(".next-week-button", {
                click: () => this.shiftWeek(7)
            });

        this.viewModel.createEffect(($) => {
            if ($.authenticated && $.currentWeekId) {
                this.hydrate(`/api/events/${$.currentWeekId}`).then((data) => {
                    this.viewModel.set("week", data?.week || $.currentWeekId);
                    this.viewModel.set("weekdays", data?.weekdays || []);
                });
            }
        });
    }

    get authorization() {
        const $ = this.viewModel.toObject();
        if ($.authenticated) {
            return { Authorization: `Bearer ${$.token}` };
        } else {
            return {};
        }
    }

    shiftWeek(days) {
        const $ = this.viewModel.toObject();
        const current = new Date(`${$.currentWeekId}T00:00:00`);
        current.setDate(current.getDate() + days);
        this.viewModel.set("currentWeekId", MomentumEventsHolder.toWeekId(current));
    }

    static getCurrentWeekId() {
        const today = new Date();
        const day = today.getDay();
        today.setDate(today.getDate() - day);
        return this.toWeekId(today);
    }

    static toWeekId(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    static formatWeek(week) {
        return String(week).slice(0, 10);
    }

    static renderEvent(event, slotName) {
        const { title, href, disabled } = event;

        if (disabled) {
            return html`
                <li slot=${slotName}>
                    <momentum-event-card disabled>
                        ${title}
                    </momentum-event-card>
                </li>
            `;
        }

        return html`
            <li slot=${slotName}>
                <momentum-event-card href=${href}>
                    ${title}
                </momentum-event-card>
            </li>
        `;
    }
    
    static renderWeekday(weekday) {
        const day = weekday.day;
        const oneTimeEvents = weekday?.oneTimeEvents || [];
        const recurringEvents = weekday?.recurringEvents || [];

        return html`
            <momentum-weekday-section>
                <span slot="day">${day}</span>

                ${oneTimeEvents.map((event) => this.renderEvent(event, "one-time-events"))}
                ${recurringEvents.map((event) => this.renderEvent(event, "recurring-events"))}
            </momentum-weekday-section>
        `;
    }
    

    hydrate(src) {
        return fetch(src, { headers: this.authorization })
        .then((response) => {
            if (response.status !== 200) 
                throw `HTTP Status ${response.status}`;
            else {
                return response.json();
            }
        })
        .catch((error) => {
            console.log(`Could not fetch ${src}:`, error);
        });
    }

    static styles = css`
        :host {
            grid-column: 4 / end;
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

        .section-meta {
            color: var(--text-primary);
        }

        .weekday-list {
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            
            gap: var(--padding-small);
        }
    `;
}