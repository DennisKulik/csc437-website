import { css, html, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";
import { BrowserHistory, fromHistory } from "@unbndl/switch";
import type { Task, TaskDetails } from "server/models";
import type { Model } from "../model.ts";
import { categories, categoryColor } from "../categories.ts";
import reset from "../styles/reset.css.ts";
import page from "../styles/page.css.ts";
import card from "../styles/card.css.ts";
import button from "../styles/button.css.ts";

type TaskViewModel = Model & { location?: Location };

export class TaskViewElement extends HTMLElement {
    viewModel = createViewModel<TaskViewModel>({
        tasksStatus: "idle", eventsStatus: "idle", userStatus: "idle"
    }).with(fromStore<Model>(this), "tasks", "tasksStatus", "tasksError")
        .with(fromHistory(this), "location");

    view: Template<[TaskViewModel]> = html`
        <main class="page">${($) => this.renderView($)}</main>
    `;

    constructor() {
        super();
        shadow(this).styles(reset.styles, page.styles, card.styles, button.styles, TaskViewElement.styles)
            .replace(this.viewModel.render(this.view))
            .listen({
                submit: (event: Event) => this.submitForm(event),
                change: (event: Event) => {
                    const input = event.target as HTMLInputElement;
                    if (input.name === "category" && input.form) {
                        input.form.querySelector<HTMLInputElement>('input[name="categoryColor"]')!.value = categoryColor(input.value);
                    }
                }
            })
            .delegate(".retry-tasks", { click: () => Store.dispatch(this, ["tasks/request", {}]) })
            .delegate(".complete-task", { click: () => this.completeTask() })
            .delegate(".delete-task", { click: () => this.deleteTask() });
    }

    connectedCallback() {
        const model = this.viewModel.toObject();
        if (!model.tasks && model.tasksStatus !== "loading") Store.dispatch(this, ["tasks/request", {}]);
    }

    query(model = this.viewModel.toObject()) {
        return new URLSearchParams(model.location?.search || window.location.search);
    }

    selectedTask(model = this.viewModel.toObject()) {
        return model.tasks?.tasks.find((task) => task.id === this.query(model).get("task"));
    }

    renderView(model: TaskViewModel) {
        if (model.tasksStatus === "idle" || model.tasksStatus === "loading") {
            return html`<div class="task-layout"><article class="task-detail card border-small" role="status"><h1>Loading tasks...</h1></article></div>`;
        }
        if (model.tasksStatus === "error") {
            return html`<div class="task-layout"><article class="task-detail card border-small" role="alert">
                <h1>Tasks unavailable</h1><p>${model.tasksError || "Tasks could not be loaded."}</p>
                <button type="button" class="button retry-tasks">Try Again</button>
            </article></div>`;
        }
        const query = this.query(model);
        const creating = query.get("new") === "true";
        const selected = this.selectedTask(model);
        return html`<div class="task-layout">${[
            this.renderList(model, selected),
            creating || (selected && query.get("edit") === "true")
                ? this.renderForm(creating ? undefined : selected)
                : selected ? this.renderDetail(selected) : html`<article class="task-detail card border-small">
                    <h1>Task not found</h1><p>This task may have been deleted.</p>
                    <a class="button" href="/app/task?new=true">Add Task</a>
                </article>`
        ]}</div>`;
    }

    renderList(model: TaskViewModel, selected?: Task) {
        const tasks = model.tasks?.tasks || [];
        return html`<aside class="task-list-panel card border-small" aria-label="Tasks">
            <div class="panel-header"><h2>Tasks</h2><a class="button" href="/app/task?new=true">Add Task</a></div>
            <ul class="task-links">${tasks.length ? tasks.map((task) => html`
                <li><a class=${`task-list-item ${task.id === selected?.id ? "selected" : ""} ${task.completed ? "completed" : ""}`}
                    href=${`/app/task?task=${encodeURIComponent(task.id)}`}>
                    <span>${task.title}</span><small>${task.completed ? "Completed" : task.dueDate ? `Due ${task.dueDate}` : "No due date"}</small>
                </a></li>`)
                : html`<li>No tasks yet.</li>`}</ul>
        </aside>`;
    }

    renderForm(task?: Task) {
        const form = html`<article class="task-detail card border-small">
            <div class="panel-header"><h1>${task ? "Edit Task" : "New Task"}</h1></div>
            <form class="task-form">
                <input name="taskid" type="hidden" value=${task?.id || ""} />
                <label>Title<input name="title" required maxlength="100" value=${task?.title || ""} autofocus /></label>
                <div class="form-row">
                    <label>Due date (optional)<input name="dueDate" type="date" value=${task?.dueDate || ""} /></label>
                    <label>Category<input name="category" list="task-categories" maxlength="50" value=${task?.category || ""} placeholder="Choose or enter a category" />
                        <datalist id="task-categories">${categories.map((category) => html`<option value=${category.name}></option>`)}</datalist>
                    </label>
                    <label>Category color<input name="categoryColor" type="color" value=${categoryColor(task?.category, task?.categoryColor)} /></label>
                </div>
                <label>Description<textarea name="description" rows="4" maxlength="1000"></textarea></label>
                <label>Notes<textarea name="notes" rows="3" maxlength="1000"></textarea></label>
                <p class="task-error" role="alert" aria-live="polite"></p>
                <div class="form-controls">
                    <button type="submit" class="button hover-lift">${task ? "Save Changes" : "Save Task"}</button>
                    <a class="button hover-lift" href=${task ? `/app/task?task=${encodeURIComponent(task.id)}` : "/app"}>Cancel</a>
                </div>
            </form>
        </article>`;
        form.querySelector<HTMLTextAreaElement>('textarea[name="description"]')!.value = task?.description || "";
        form.querySelector<HTMLTextAreaElement>('textarea[name="notes"]')!.value = task?.notes || "";
        return form;
    }

    renderDetail(task: Task) {
        return html`<article class=${`task-detail card border-small ${task.completed ? "completed-detail" : ""}`}>
            <div class="panel-header"><div>
                <p class="eyebrow">${task.completed ? "Completed task" : "Active task"}</p>
                <h1>${task.title}</h1>
            </div></div>
            <dl class="detail-meta">
                <div><dt>Due date</dt><dd>${task.dueDate || "No due date"}</dd></div>
                <div><dt>Category</dt><dd>${task.category || "Not specified"}</dd></div>
            </dl>
            <section><h2>Description</h2><p class="task-text">${task.description || "No description added."}</p></section>
            <section><h2>Notes</h2><p class="task-text">${task.notes || "No notes added."}</p></section>
            <p class="task-error" role="alert" aria-live="polite"></p>
            <div class="form-controls">
                <button type="button" class="button hover-lift complete-task">${task.completed ? "Reopen Task" : "Mark Complete"}</button>
                <a class="button hover-lift" href=${`/app/task?edit=true&task=${encodeURIComponent(task.id)}`}>Edit Task</a>
                <button type="button" class="button hover-lift delete-task">Delete Task</button>
            </div>
        </article>`;
    }

    submitForm(event: Event) {
        const form = event.target as HTMLFormElement;
        if (!form.classList.contains("task-form")) return;
        event.preventDefault();
        const data = new FormData(form);
        const taskid = String(data.get("taskid") || "");
        const id = taskid || crypto.randomUUID();
        const task: TaskDetails & { id: string } = {
            id, title: String(data.get("title") || "").trim(),
            dueDate: String(data.get("dueDate") || ""),
            category: String(data.get("category") || "").trim(),
            categoryColor: String(data.get("categoryColor") || ""),
            description: String(data.get("description") || "").trim(),
            notes: String(data.get("notes") || "").trim()
        };
        const callbacks = this.writeCallbacks("button[type='submit']", () => {
            BrowserHistory.dispatch(this, "history/navigate", { href: `/app/task?task=${encodeURIComponent(id)}` });
        });
        if (taskid) Store.dispatch(this, ["tasks/update", { taskid, task }, callbacks]);
        else Store.dispatch(this, ["tasks/create", { task }, callbacks]);
    }

    completeTask() {
        const task = this.selectedTask();
        if (!task) return;
        Store.dispatch(this, ["tasks/complete", { taskid: task.id, completed: !task.completed }, this.writeCallbacks(".complete-task")]);
    }

    deleteTask() {
        const task = this.selectedTask();
        if (!task || !window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
        Store.dispatch(this, ["tasks/delete", { taskid: task.id }, this.writeCallbacks(".delete-task", () => {
            BrowserHistory.dispatch(this, "history/navigate", { href: "/app" });
        })]);
    }

    writeCallbacks(selector: string, onSuccess?: () => void) {
        const button = this.shadowRoot!.querySelector<HTMLButtonElement>(selector)!;
        const error = this.shadowRoot!.querySelector<HTMLElement>(".task-error")!;
        button.disabled = true;
        error.textContent = "";
        return {
            onSuccess,
            onFailure: () => {
                button.disabled = false;
                error.textContent = "The task could not be saved. Please try again.";
            }
        };
    }

    static styles = css`
        .task-layout {
            display: grid;
            grid-template-areas: "list detail";
            grid-template-columns: minmax(220px, 2fr) minmax(0, 5fr);
            gap: var(--padding-standard);
            margin: var(--padding-standard);
            align-items: start;
        }
        .task-list-panel {
            grid-area: list;
        }
        .task-detail {
            grid-area: detail;
        }
        .task-list-panel, .task-detail {
            min-width: 0;
            padding: var(--padding-standard);
            background-color: var(--color-secondary);
            color: var(--text-primary);
        }
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: var(--padding-mini);
            border-bottom: 2px solid var(--color-accent-dark);
            padding-bottom: var(--padding-small);
        }
        h1, h2, p {
            margin-top: 0;
        }
        h1 {
            margin-bottom: 0;
            font-size: clamp(32px, 4vw, 48px);
            overflow-wrap: anywhere;
        }
        h2 {
            font-size: 26px;
        }
        .panel-header h2 {
            margin: 0;
        }
        .eyebrow {
            margin-bottom: var(--padding-tiny);
            text-transform: uppercase;
            font-size: 15px;
        }
        .task-links {
            display: flex;
            flex-direction: column;
            gap: var(--padding-mini);
            list-style: none;
            padding: 0;
            margin-bottom: 0;
        }
        .task-list-item {
            display: block;
            padding: var(--padding-small);
            border: 2px solid transparent;
            border-radius: var(--padding-mini);
            color: var(--text-primary);
            text-decoration: none;
            overflow-wrap: anywhere;
        }
        .task-list-item:hover, .task-list-item.selected {
            background: var(--color-primary);
        }
        .task-list-item.selected {
            border-color: var(--color-accent-dark);
        }
        .task-list-item:visited {
            color: var(--text-primary);
        }
        .task-list-item span, .task-list-item small {
            display: block;
        }
        .task-list-item small {
            margin-top: var(--padding-tiny);
        }
        .completed span, .completed-detail h1 {
            text-decoration: line-through;
            opacity: 0.6;
        }
        .detail-meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: var(--padding-standard);
            margin: var(--padding-standard) 0;
        }
        .detail-meta div {
            padding: var(--padding-small);
            border-radius: var(--padding-mini);
            background: var(--color-background);
        }
        dt {
            font-weight: 700;
        }
        dd {
            margin: var(--padding-tiny) 0 0;
        }
        .task-text {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            line-height: 1.4;
        }
        .task-form {
            display: flex;
            flex-direction: column;
            gap: var(--padding-standard);
            margin-top: var(--padding-standard);
        }
        label {
            display: flex;
            flex-direction: column;
            gap: var(--padding-tiny);
            font-weight: 700;
        }
        input, textarea {
            width: 100%;
            padding: var(--padding-mini);
            border: 2px solid var(--color-accent-dark);
            border-radius: var(--padding-mini);
            background: var(--color-background);
            color: var(--text-primary);
            font: inherit;
            font-weight: 400;
            min-width: 0;
        }
        input[type="color"] {
            height: 3rem;
            cursor: pointer;
        }
        textarea {
            resize: vertical;
        }
        .form-row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--padding-mini);
        }
        .form-controls {
            display: flex;
            flex-wrap: wrap;
            gap: var(--padding-mini);
            margin-top: var(--padding-small);
        }
        a.button {
            text-decoration: none;
            color: var(--text-secondary);
        }
        a.button:visited {
            color: var(--text-secondary);
        }
        .task-error:empty {
            display: none;
        }
        button:disabled {
            opacity: 0.6;
            cursor: default;
        }
        @media (max-width: 900px) {
            .task-layout {
                grid-template-areas: "list" "detail";
                grid-template-columns: minmax(0, 1fr);
            }
            .form-row {
                grid-template-columns: minmax(0, 1fr);
            }
        }
    `;
}
