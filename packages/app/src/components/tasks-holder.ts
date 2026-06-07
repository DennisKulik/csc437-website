import { html, css, shadow, type Template} from "@unbndl/html";
import reset from "../styles/reset.css.js";
import button from "../styles/button.css.ts";

type TaskCard = {
    title: string;
    href: string;
};

type TaskList = {
    tasks: TaskCard[];
};

export class MomentumTasksHolder extends HTMLElement {

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, button.styles, MomentumTasksHolder.styles);
    }

    static observedAttributes = ["src"];

    attributeChangedCallback(name: string, _: string | null, newValue: string | null) {
        if (name === "src" && newValue) {
            // hydrate and render into shadow DOM
            this.hydrate(newValue).then((data) => {
                const view = MomentumTasksHolder.render(data)
                shadow(this).replace(view);
            });
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

    static render(data: TaskList = { tasks: [] }) {
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

    hydrate(src: string): Promise<TaskList | undefined> {
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
    `;
}