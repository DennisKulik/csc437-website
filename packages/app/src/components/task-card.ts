import { html, css, shadow } from "@unbndl/html";
import reset from "../styles/reset.css.js";
import card from "../styles/card.css.ts";

export class MomentumTaskCard extends HTMLElement {
    static template = html`
        <template>
            <div class="card task-tile card-layout">
                <a class="task-link">
                    <span class="task-title">Untitled Task</span>
                    <small class="task-description"><slot></slot></small>
                </a>
                <button type="button" class="complete-button">Done</button>
            </div>
        </template>
    `;
    static observedAttributes = ["href", "title", "completed", "category-color", "pending"];

    constructor() {
        super();
        shadow(this).template(MomentumTaskCard.template)
            .styles(reset.styles, card.styles, MomentumTaskCard.styles)
            .delegate(".complete-button", { click: () => {
                this.dispatchEvent(new CustomEvent("task/complete", {
                    bubbles: true, composed: true,
                    detail: { taskid: this.getAttribute("task-id"), completed: this.getAttribute("completed") !== "true" }
                }));
            } });
    }

    attributeChangedCallback(name: string, _: string | null, value: string | null) {
        const link = this.shadowRoot!.querySelector<HTMLAnchorElement>("a")!;
        const button = this.shadowRoot!.querySelector<HTMLButtonElement>("button")!;
        if (name === "href") {
            if (value) link.href = value;
            else link.removeAttribute("href");
        }
        if (name === "title") this.shadowRoot!.querySelector(".task-title")!.textContent = value || "Untitled Task";
        if (name === "completed" || name === "title") {
            const completed = this.getAttribute("completed") === "true";
            button.textContent = completed ? "Undo" : "Done";
            button.setAttribute("aria-label", `${completed ? "Reopen" : "Complete"} task: ${this.getAttribute("title") || "Untitled Task"}`);
        }
        if (name === "category-color" && value && /^#[0-9a-f]{6}$/i.test(value)) {
            this.style.setProperty("--task-category-color", value);
        }
        if (name === "pending") button.disabled = value !== null;
    }

    static styles = css`
        .task-tile {
            background-color: var(--color-secondary);
            grid-template-columns: minmax(0, 1fr) auto;
            border-left: 4px solid var(--task-category-color, var(--solarized-cyan));
        }
        .task-link {
            display: flex;
            flex-direction: column;
            gap: var(--padding-mini);
            color: var(--text-primary);
            text-decoration: none;
            min-width: 0;
            overflow-wrap: anywhere;
        }
        .task-link:hover .task-title {
            text-decoration: underline;
        }
        .task-title {
            font-weight: 600;
        }
        .task-description {
            line-height: 1.4;
        }
        .complete-button {
            border: 2px solid var(--color-accent-dark);
            border-radius: var(--padding-mini);
            padding: var(--padding-tiny) var(--padding-mini);
            background: transparent;
            color: var(--text-primary);
            font: inherit;
            font-size: 0.8em;
            cursor: pointer;
        }
        .complete-button:disabled {
            opacity: 0.6;
            cursor: default;
        }
        :host([completed="true"]) .task-title {
            text-decoration: line-through;
        }
        :host([completed="true"]) .task-link {
            opacity: 0.6;
        }
    `;
}
