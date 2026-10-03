import { html, css, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";

import type { UserProfile } from "server/models";
import type { LoadStatus } from "../model.ts";

import reset from "../styles/reset.css.ts";
import page from "../styles/page.css.ts";
// import user from "../styles/user.css.ts";
import card from "../styles/card.css.ts";
import button from "../styles/button.css.ts";

type UserMode = "view" | "edit";

interface UserViewModel {
    mode: UserMode;
    user?: UserProfile;
    userStatus: LoadStatus;
    userError?: string;
    saveError: string;
}


export class UserViewElement extends HTMLElement {
    viewModel = createViewModel<UserViewModel>({
        mode: "view",
        userStatus: "idle",
        saveError: ""
    })
        .with(fromStore<UserViewModel>(this), "user", "userStatus", "userError");
            
    view: Template<[UserViewModel]> = html`
        <div class="page">
            <div class="profile-layout">
                ${($) =>
                    $.userStatus === "error"
                        ? this.renderErrorView($.userError)
                        : $.user
                        ? $.mode === "edit"
                            ? this.renderEditView($.user, $.saveError)
                            : this.renderMainView($.user)
                        : this.renderLoadingView()
                }
            </div>
        </div>
    `;

    constructor() {
        super();
        shadow(this)
            .styles(reset.styles, page.styles, card.styles, button.styles, UserViewElement.styles)
            .replace(this.viewModel.render(this.view))
            .delegate(".edit-profile-button", {
                click: () => this.setMode("edit")
            })
            .delegate(".cancel-edit-button", {
                click: () => this.setMode("view")
            })
            .delegate(".retry-profile-button", {
                click: () => this.requestProfile()
            })
            .listen({
                submit: (ev: Event) => this.submitForm(ev)
            });
    }

    connectedCallback() {
        const $ = this.viewModel.toObject();

        if (!$.user && $.userStatus === "idle") this.requestProfile();
    }

    requestProfile() {
        Store.dispatch(this, ["user/request", {}]);
    }

    setMode(mode: UserMode) {
        this.viewModel.update({ mode, saveError: "" });
    }

    renderLoadingView() {
        return html`
            <div class="profile-state card border-small" role="status" aria-live="polite">
                <h2>User Info</h2>
                <p>Loading profile...</p>
            </div>
        `;
    }

    renderErrorView(error?: string) {
        return html`
            <div class="profile-state card border-small" role="alert">
                <h2>Profile unavailable</h2>
                <p>${error || "Your profile could not be loaded."}</p>
                <button type="button" class="button hover-lift retry-profile-button">
                    Try Again
                </button>
            </div>
        `;
    }

    renderMainView(profile: UserProfile) {
        return html`
            <section class="profile-card card border-small">
                <h2>Profile</h2>

                <div class="readonly-field">
                    <span class="readonly-label">Display Name</span>
                    <span class="readonly-value">${profile.displayName}</span>
                </div>

                <div class="readonly-field">
                    <span class="readonly-label">Username</span>
                    <span class="readonly-value">${profile.username}</span>
                </div>

                <div class="readonly-field">
                    <span class="readonly-label">Bio</span>
                    <div class="readonly-value readonly-bio">
                        ${profile.bio || "No bio yet."}
                    </div>
                </div>

                <button type="button" class="button hover-lift edit-profile-button">
                    Edit Profile
                </button>
            </section>

            <aside class="profile-picture-holder card border-small">
                <img
                    src=${profile.profilePicture || "/images/default-profile.jpg"}
                    alt="Profile picture"
                />
            </aside>
        `;
    }

    renderEditView(profile: UserProfile, saveError: string) {
        return html`
            <section class="profile-card card border-small">
                <h2>Edit Profile</h2>

                <form>
                    <label>
                        Display Name
                        <input
                            type="text"
                            name="displayName"
                            value=${profile.displayName}
                            maxlength="80"
                            required
                        />
                    </label>

                    <label>
                        Username
                        <input
                            type="text"
                            name="username"
                            value=${profile.username}
                            disabled
                        />
                    </label>

                    <label>
                        Bio
                        <textarea
                            name="bio"
                            value=${profile.bio || ""}
                            maxlength="1000"
                        ></textarea>
                    </label>

                    <label>
                        Profile Picture URL
                        <input
                            type="url"
                            name="profilePicture"
                            value=${profile.profilePicture || ""}
                            maxlength="2048"
                        />
                    </label>

                    <p class="save-error" role="alert" aria-live="polite">${saveError}</p>

                    <div class="form-controls">
                        <button type="submit" class="button hover-lift">
                            Save
                        </button>

                        <button type="button" class="button hover-lift cancel-edit-button">
                            Cancel
                        </button>
                    </div>
                </form>
            </section>

            <aside class="profile-picture-holder card border-small">
                <img
                    src=${profile.profilePicture || "/images/default-profile.jpg"}
                    alt="Profile picture"
                />
            </aside>
        `;
    }

    submitForm(ev: Event) {
        ev.preventDefault();

        const form = ev.target as HTMLFormElement;
        const formData = this.formDataToJSON(form);
        const $ = this.viewModel.toObject();

        if (!$.user) return;

        this.viewModel.update({ saveError: "" });

        const updatedUser: UserProfile = {
            ...$.user,
            ...formData
        };

        Store.dispatch(this, [
            "user/save",
            {
                userid: $.user.userid,
                user: updatedUser
            },
            {
                onSuccess: () => this.setMode("view"),
                onFailure: () => this.viewModel.update({
                    saveError: "Your changes could not be saved. Please try again."
                })
            }
        ]);
    }

    formDataToJSON(form: HTMLFormElement): Partial<UserProfile> {
        const inputs = Array.from(form.elements).filter(
            (el) => "name" in el && (el as HTMLInputElement).name
        ) as Array<HTMLInputElement | HTMLTextAreaElement>;

        const entries = inputs.map((el) => [el.name, el.value]);
        return Object.fromEntries(entries) as Partial<UserProfile>;
    }

    static styles = css`
        .page {
            display: grid;
            grid-template-columns: [start] repeat(8, 1fr) [end];
        }

        .profile-layout {
            grid-column: 3 / span 4;
            display: grid;
            grid-template-columns: minmax(0, 1fr) 240px;
            gap: var(--padding-standard);
            margin: var(--padding-small);
        }

        .profile-card {
            padding: var(--padding-standard);
            background-color: var(--color-secondary);
        }

        .profile-state {
            grid-column: 1 / -1;
            padding: var(--padding-standard);
            color: var(--text-primary);
            background-color: var(--color-secondary);
            text-align: center;
        }

        .profile-picture-holder {
            overflow: hidden;
            aspect-ratio: 1 / 1;
        }

        .profile-picture-holder img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        h2 {
            margin: 0 0 var(--padding-standard);
            border-bottom: 2px solid var(--color-primary);

            color: var(--text-primary);
            font-family: var(--font-primary);
            font-weight: 700;
            font-size: 40px;
        }

        form,
        .readonly-field,
        label {
            display: flex;
            flex-direction: column;
        }

        .readonly-field,
        label {
            gap: var(--padding-mini);
            margin-bottom: var(--padding-small);

            color: var(--text-primary);
            font-family: var(--font-secondary);
            font-size: 20px;
        }

        .readonly-label,
        label {
            font-weight: 700;
        }

        .readonly-value,
        input,
        textarea {
            display: block;
            padding: var(--padding-mini);
            border: 2px solid var(--color-primary);
            border-radius: var(--padding-mini);

            color: var(--text-primary);
            background-color: var(--color-background);
            font: inherit;
            font-weight: 400;
        }
            
        .readonly-bio,
        textarea {
            min-height: 7rem;
            line-height: 1.4;
        }

        .readonly-bio {
            white-space: pre-wrap;
            display: flex;
            align-items: flex-start;
        }

        textarea {
            resize: vertical;
        }

        input:disabled {
            opacity: 0.7;
        }

        .form-controls {
            display: flex;
            gap: var(--padding-small);
            align-items: center;
            flex-wrap: wrap;
        }

        .save-error {
            min-height: 1.5em;
            margin: 0 0 var(--padding-small);
            color: var(--solarized-red);
        }

        @media (max-width: 1100px) {
            .profile-layout {
                grid-column: 2 / span 2;
                grid-template-columns: minmax(0, 1fr);
            }

            .profile-picture-holder {
                width: 220px;
                justify-self: center;
            }
        }

        @media (max-width: 700px) {
            .profile-layout {
                grid-column: start / end;
                margin-left: var(--padding-small);
                margin-right: var(--padding-small);
            }

            .profile-card {
                padding: var(--padding-small);
            }

            .profile-picture-holder {
                width: min(300px, 100%);
            }

            h2 {
                text-align: center;
            }
        }
    `;
}
