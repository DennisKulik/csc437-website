import { html, css, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";

import type { Model } from "../model.ts";
import reset from "../styles/reset.css.js";
import button from "../styles/button.css.ts";

type TaskCard = {
    title: string;
    href: string;
};

export class MomentumTasksHolder extends HTMLElement {

    viewModel = createViewModel<Model>({})
        .with(fromStore<Model>(this), "tasks");

    view: Template<[Model]> = html`
        <div class="task-box">
            <div class="section-header">
                <h2>Tasks</h2>
                <button type="button" class="button hover-lift">Add Task</button>
            </div>

            <ul class="task-list">
                ${($) => ($.tasks?.tasks || []).map((task) => MomentumTasksHolder.renderTask(task as TaskCard))}            
            </ul>
        </div>
    `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, button.styles, MomentumTasksHolder.styles)
            .replace(this.viewModel.render(this.view));
    }

    connectedCallback() {
        const $ = this.viewModel.toObject();

        if (!$.tasks) {
            Store.dispatch(this, ["tasks/request", {}]);
        }
    }

    static renderTask(task: TaskCard) {
        const { title, href } = task;

        return html`
            <momentum-task-card 
                href=${href} 
                title=${title}>
            </momentum-task-card>
        `;
    }

    static styles = css`
        :host {
            grid-column: start / span 3;
        }

        @media (max-width: 1100px) {
            :host {
                grid-column: start / end;
            }
        }

        .task-box {
            width: auto;

            display: flex;
            flex-direction: column;

            margin: var(--padding-standard); /* Space around the task-box */
            padding: var(--padding-standard); /* Space inside the task-box */
            border-radius: var(--padding-small); /* This rounds the corners */ 

            background-color: var(--color-primary);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .task-list {
            list-style-type: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            
            gap: var(--padding-small);
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
    `;
}
