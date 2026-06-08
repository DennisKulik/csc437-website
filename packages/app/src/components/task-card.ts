import { html, css, shadow } from "@unbndl/html";
import reset from "../styles/reset.css.js";
import button from "../styles/button.css.ts";
import card from "../styles/card.css.ts";

export class MomentumTaskCard extends HTMLElement {

    static template = html`
        <template>
            <a class="card task-tile hover-lift card-layout">
                Untitled Task
            </a>
        </template>
    `;

    static observedAttributes = ["href", "title"];

    constructor() {
        super();
        shadow(this)
            .template(MomentumTaskCard.template)
            .styles(reset.styles, button.styles, card.styles, MomentumTaskCard.styles);
    }

    attributeChangedCallback(name: string, _: string | null, newValue: string | null) {
        const link = this.shadowRoot?.querySelector("a") as HTMLAnchorElement | null;

        if (!link) return;

        if (name === "href") {
            link.href = newValue || "";
        }

        if (name === "title") {
            link.textContent = newValue || "Untitled Task";
        }
    }

    static styles = css`
        .task-tile {
            background-color: var(--color-secondary);
        }

        a {
            color: var(--text-primary);
            text-decoration: none;
        }

        :host([disabled]) a {
            pointer-events: none;
            cursor: default;
            opacity: 0.9;
        }
    `;
}
