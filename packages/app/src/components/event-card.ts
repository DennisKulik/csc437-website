import { html, css, shadow } from "@unbndl/html";
import reset from "../styles/reset.css.js";
import button from "../styles/button.css.ts";
import card from "../styles/card.css.ts";


export class MomentumEventCard extends HTMLElement {

    static template = html`
        <template>
            <a class="card event-card hover-lift card-layout">
                <slot>Event Name</slot>
                <small class="category-name"></small>
            </a>
        </template>
    `;

    static observedAttributes = ["href", "category", "category-color"];

    constructor() {
        super();
        shadow(this)
            .template(MomentumEventCard.template)
            .styles(reset.styles, button.styles, card.styles, MomentumEventCard.styles);
    }

    attributeChangedCallback(name: string, _: string | null, newValue: string | null) {
        if (name === "href") {
            const link = this.shadowRoot?.querySelector("a") as HTMLAnchorElement | null;

            if (link && newValue !== null) {
                link.href = newValue;
            }
        }
        if (name === "category") {
            const label = this.shadowRoot?.querySelector(".category-name");
            if (label) label.textContent = newValue || "";
        }
        if (name === "category-color" && newValue && /^#[0-9a-f]{6}$/i.test(newValue)) {
            this.style.setProperty("--event-category-color", newValue);
        }
    }

    static styles = css`
        .event-card {
            background-color: var(--color-tertiary);
            border-left: 4px solid var(--event-category-color, var(--solarized-cyan));
            grid-template-columns: minmax(0, 1fr) auto;
        }

        .category-name {
            font-size: 0.8em;
        }

        .category-name:empty {
            display: none;
        }

        a {
            color: var(--text-secondary);
            text-decoration: none;
            font-weight: 500;
        }

        :host([disabled]) a {
            pointer-events: none;
            cursor: default;
            opacity: 0.9;
        }
    `;
}
