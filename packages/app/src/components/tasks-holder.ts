import { html, css, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import type { Task } from "server/models";
import type { Model } from "../model.ts";
import { categoryColor } from "../categories.ts";
import reset from "../styles/reset.css.js";
import button from "../styles/button.css.ts";

type TasksViewModel = Model & { showCompleted: boolean; showAllCompleted: boolean };

export class MomentumTasksHolder extends HTMLElement {
    viewModel = createViewModel<TasksViewModel>({
        eventsStatus: "idle", userStatus: "idle", tasksStatus: "idle",
        showCompleted: true, showAllCompleted: false
    }).with(fromStore<Model>(this), "tasks", "tasksStatus", "tasksError");

    view: Template<[TasksViewModel]> = html`
        <div class="task-box">
            <div class="section-header">
                <h2>Tasks</h2>
                <a href="/app/task?new=true" class="button hover-lift">Add Task</a>
            </div>
            <p class="task-error" role="alert" aria-live="polite"></p>
            ${($) => this.renderTasks($)}
        </div>
    `;

    constructor() {
        super();
        shadow(this).styles(reset.styles, button.styles, MomentumTasksHolder.styles)
            .replace(this.viewModel.render(this.view))
            .delegate(".retry-tasks", { click: () => Store.dispatch(this, ["tasks/request", {}]) })
            .delegate(".toggle-completed", { click: () => {
                this.viewModel.update({ showCompleted: !this.viewModel.toObject().showCompleted });
            } })
            .delegate(".toggle-all", { click: () => {
                this.viewModel.update({ showAllCompleted: !this.viewModel.toObject().showAllCompleted });
            } })
            .listen({ "task/complete": (event: Event) => this.completeTask(event as CustomEvent) });
    }

    connectedCallback() {
        const model = this.viewModel.toObject();
        if (!model.tasks && model.tasksStatus !== "loading") Store.dispatch(this, ["tasks/request", {}]);
    }

    renderTasks(model: TasksViewModel) {
        if (model.tasksStatus === "idle" || model.tasksStatus === "loading") {
            return html`<p role="status">Loading tasks...</p>`;
        }
        if (model.tasksStatus === "error") {
            return html`<div role="alert"><p>${model.tasksError || "Tasks could not be loaded."}</p>
                <button type="button" class="button retry-tasks">Try Again</button></div>`;
        }
        const active = (model.tasks?.tasks || []).filter((task) => !task.completed);
        const completed = (model.tasks?.tasks || []).filter((task) => task.completed);
        return html`
            ${[
                active.length ? html`<ul class="task-list">${active.map((task) => this.renderTask(task))}</ul>`
                    : html`<p class="empty-tasks">${completed.length ? "All tasks completed." : "No tasks yet. Add one to get started."}</p>`,
                completed.length ? html`
                    <section class="completed-tasks">
                        <div class="completed-header">
                            <h3>Completed (${completed.length})</h3>
                            <button type="button" class="text-button toggle-completed" aria-expanded=${String(model.showCompleted)}>
                                ${model.showCompleted ? "Hide" : "Show"}
                            </button>
                        </div>
                        ${model.showCompleted ? html`
                            ${[
                                html`<ul class="task-list">${(model.showAllCompleted ? completed : completed.slice(0, 3)).map((task) => this.renderTask(task))}</ul>`,
                                completed.length > 3 ? html`<button type="button" class="text-button toggle-all">
                                    ${model.showAllCompleted ? "Show fewer" : `Show all ${completed.length} completed tasks`}
                                </button>` : ""
                            ]}
                        ` : ""}
                    </section>` : ""
            ]}
        `;
    }

    renderTask(task: Task) {
        return html`
            <li>
                <momentum-task-card href=${`/app/task?task=${encodeURIComponent(task.id)}`}
                    title=${task.title} task-id=${task.id} completed=${String(task.completed)}
                    category-color=${categoryColor(task.category, task.categoryColor)}>
                    ${[task.category || "", task.dueDate ? `Due ${task.dueDate}` : "No due date"].filter(Boolean).join(" · ")}
                </momentum-task-card>
            </li>
        `;
    }

    completeTask(event: CustomEvent<{ taskid: string; completed: boolean }>) {
        const card = event.target as HTMLElement;
        const error = this.shadowRoot!.querySelector<HTMLElement>(".task-error")!;
        error.textContent = "";
        card.setAttribute("pending", "");
        Store.dispatch(this, ["tasks/complete", event.detail, {
            onSuccess: () => this.viewModel.update({ showCompleted: true }),
            onFailure: () => {
                card.removeAttribute("pending");
                error.textContent = "The task could not be updated. Please try again.";
            }
        }]);
    }

    static styles = css`
        :host {
            grid-column: start / span 3;
            min-width: 0;
        }
        @media (max-width: 1100px) {
            :host {
                grid-column: start / end;
            }
        }
        .task-box {
            display: flex;
            flex-direction: column;
            margin: var(--padding-standard);
            padding: var(--padding-standard);
            border-radius: var(--padding-small);
            background-color: var(--color-primary);
            color: var(--text-primary);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .task-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: var(--padding-small);
        }
        .section-header, .completed-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: var(--padding-mini);
        }
        .section-header {
            border-bottom: 5px solid var(--color-accent-dark);
            margin-bottom: var(--padding-small);
        }
        .section-header h2 {
            color: var(--text-primary);
        }
        .section-header a {
            text-decoration: none;
        }
        .completed-tasks {
            margin-top: var(--padding-standard);
            border-top: 2px solid var(--color-accent-dark);
            padding-top: var(--padding-small);
        }
        .completed-header {
            margin-bottom: var(--padding-small);
        }
        .completed-header h3 {
            margin: 0;
            font-size: 20px;
        }
        .text-button {
            background: none;
            border: none;
            color: var(--text-primary);
            font: inherit;
            text-decoration: underline;
            cursor: pointer;
            padding: var(--padding-tiny);
        }
        .toggle-all {
            margin-top: var(--padding-mini);
        }
        .task-error:empty {
            display: none;
        }
        .task-error {
            margin: 0 0 var(--padding-small);
        }
        .empty-tasks {
            margin: 0;
            line-height: 1.4;
        }
    `;
}
