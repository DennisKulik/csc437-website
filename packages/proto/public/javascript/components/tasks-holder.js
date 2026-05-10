import { html, css, shadow } from "@unbndl/html";
import reset from "/styles/reset.css.js";

export class MomentumTasksHolder extends HTMLElement {

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, MomentumTasksHolder.styles);
    }

    static observedAttributes = ["src"];

    attributeChangedCallback(name, _, newValue) {
        if (name === "src") {
            // hydrate and render into shadow DOM
            this.hydrate(newValue).then((data) => {
                const view = MomentumTasksHolder.render(data)
                shadow(this).replace(view);
            });
        }
    }

    static renderTask(task) {
        const { title, href } = task;

        return html`
            <momentum-task-card 
                href=${href} 
                title=${title}>
            </momentum-task-card>
        `;
    }

    static render(data = {}) {
        // render the data
        const tasks = data?.tasks || [];

        return html`
            <div class="task-box">
                <div class="section-header">
                    <h2>Tasks</h2>
                    <button type="button" class="button hover-lift">Add Task</button>
                </div>

                <ul class="task-list">
                    ${tasks.map((task) => this.renderTask(task))}
                </ul>
            </div>
        `;

    }
    hydrate(src) {
        // return a promise that fetches the data
        return fetch(src).then((response) => {
            if (response.status !== 200) 
                throw `HTTP Status:${response.status}`;
            else return response.json();
        })
        .catch((error) => {
            console.log(`Could not fetch ${src}:`, error);
        });
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

        .button {
            padding: var(--padding-mini);
            margin: 0 var(--padding-tiny) var(--padding-mini);
            border-radius: var(--padding-standard);
            background-color: var(--color-accent-dark);
            color: var(--text-secondary);
            font-family: var(--font-primary);
            font-size: 16px;
            font-weight: 600;
        }

        .hover-lift {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
    `;
}