import { html, css, shadow, type Template } from "@unbndl/html";
import { createViewModel } from "@unbndl/view";
import { Store, fromStore } from "@unbndl/store";

import type { UserProfile } from "server/models";

import reset from "../styles/reset.css.ts";
import page from "../styles/page.css.ts";
// import user from "../styles/user.css.ts";
import card from "../styles/card.css.ts";
import button from "../styles/button.css.ts";

type UserMode = "view" | "edit";

interface UserViewModel {
    mode: UserMode;
    user?: UserProfile;
}


export class UserViewElement extends HTMLElement {
    viewModel = createViewModel<UserViewModel>({
        mode: "view"
    })
        .with(fromStore<UserViewModel>(this), "user");
            
    view: Template<[UserViewModel]> = html`
        <div class="page">
            <div class="profile-layout">
                ${($) =>
                    $.user
                        ? $.mode === "edit"
                            ? this.renderEditView($.user)
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
            .listen({
                submit: (ev: Event) => this.submitForm(ev)
            });
    }

    connectedCallback() {
        const $ = this.viewModel.toObject();

        if (!$.user) {
            Store.dispatch(this, ["user/request", {}]);
        }
    }

    setMode(mode: UserMode) {
        this.viewModel.update({ mode });
    }

    renderLoadingView() {
        return html`
            <div class="user-info border-small">
                <h2>User Info</h2>
                <p>Loading profile...</p>
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

    renderEditView(profile: UserProfile) {
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
                        ></textarea>
                    </label>

                    <label>
                        Profile Picture URL
                        <input
                            type="text"
                            name="profilePicture"
                            value=${profile.profilePicture || ""}
                        />
                    </label>

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
                onFailure: (error: Error) => console.log("ERROR:", error)
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