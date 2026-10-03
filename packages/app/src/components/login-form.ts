import { css, html, shadow, type Template } from "@unbndl/html";
import { createViewModel, fromInputs } from "@unbndl/view";
import reset from "../styles/reset.css.ts";
import button from "../styles/button.css.ts";
import { getPostLoginRedirect } from "../session.ts";


type LoginFormViewModel = {
    username: string;
    password: string;
    errorMessage: string;
    submitting: boolean;
};

type LoginFormInputs = {
    username?: string;
    password?: string;
};

export class LoginFormElement extends HTMLElement {
    viewModel = createViewModel<LoginFormViewModel>({
        username: "",
        password: "",
        errorMessage: "",
        submitting: false
    }).with(fromInputs<LoginFormInputs>(this), "username", "password");

    view: Template<[LoginFormViewModel]> = html`
        <form>
            <slot></slot>
            <p class="form-error" role="alert" aria-live="polite">
                ${($) => $.errorMessage}
            </p>
            <button type="submit" class="button hover-lift">
                ${($) => $.submitting ? "Signing in..." : html`<slot name="submit-label">Login</slot>`}
            </button>
        </form>
    `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, button.styles, LoginFormElement.styles)
            .replace(this.viewModel.render(this.view))
            .listen({
                submit: (ev: Event) => 
                    this.submitLogin(ev, this.getAttribute("api") || "#")
            });
    }

    submitLogin(event: Event, endpoint: string) {
        event.preventDefault();
        const current = this.viewModel.toObject();
        if (current.submitting) return;

        this.viewModel.update({ errorMessage: "", submitting: true });
        const data = this.viewModel.toObject();
        const method = "POST";
        const headers: HeadersInit = {
            "Content-Type": "application/json"
        };
        const body = JSON.stringify(data);
        fetch(endpoint, { method, headers, body })
            .then((res) => {
                if (res.status !== 200)
                    throw `Form submission failed: Status ${res.status}`;
                return res.json();
            })
            .then((json: { token: string}) => {
                const { token } = json;
                const customEvent = new CustomEvent("auth:message", {
                    bubbles: true,
                    composed: true,
                    detail: ["auth/signin", { token, redirect: getPostLoginRedirect() }]
                });
                this.dispatchEvent(customEvent);
            })
            .catch(() => {
                this.viewModel.update({
                    errorMessage: "The username or password was not accepted.",
                    submitting: false
                });
            });
    }

    static styles = css`
        :host {
            display: block;
        }
        form {
            display: flex;
            flex-direction: column;
            gap: var(--padding-small);
        }
        button {
            align-self: flex-start;
        }

        .form-error {
            min-height: 1.5em;
            margin: 0;
            color: var(--text-primary);
            text-align: center;
        }

    `;
}
