import { html, css, shadow } from "@unbndl/html";
import reset from "/styles/reset.css.js";

export class MomentumEventsHolder extends HTMLElement {

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, MomentumEventsHolder.styles);
    }

    static observedAttributes = ["src"];

    attributeChangedCallback(name, _, newValue) {
        if (name === "src") {
            // hydrate and render into shadow DOM
            this.hydrate(newValue).then((data) => {
                const view = MomentumEventsHolder.render(data)
                shadow(this).replace(view);
            });
        }
    }
    
    static renderEvent(event, slotName) {
        const { title, href, disabled } = event;

        if (disabled) {
            return html`
                <li slot=${slotName}>
                    <momentum-event-card disabled}>
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

    static render(data = {}) {
        // render the data
        const week = data.week || "This Week";
        const weekdays = data.weekdays || [];

        return html`
            <div class="events-holder">
                <div class="section-header">
                    <h2>Events</h2>
                    <span class="section-meta">${week}</span>
                </div>

                <div class="weekday-list">
                    ${weekdays.map((weekday) => this.renderWeekday(weekday))}
                </div>
            </div>
        `;
    }

    hydrate(src) {
        // return a promise that fetches the data
        return fetch(src).then((response) => {
            if (response.status !== 200) 
                throw `HTTP Status ${response.status}`;
            else return response.json();
        })
        .catch((error) => {
            console.log(`Could not fetch ${src}:`, error);
        });
    }

    static styles = css`
        :host {
            grid-column: 4 / end;
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

        @media (max-width: 1100px) {
            :host {
                grid-column: start / end;
            }
        }

    `;
}