import { define, html } from "@unbndl/html";
import { Auth } from "@unbndl/auth";
import { Store } from "@unbndl/store";
import { BrowserHistory, Switch } from "@unbndl/switch";

import { Msg } from "./messages.ts";
import { Model, init } from "./model.ts";
import update, { Cmd } from "./update.ts";

import { MomentumHeader } from "./components/header-element.ts";
import { MomentumTaskCard } from "./components/task-card.ts";
import { MomentumEventCard } from "./components/event-card.ts";
import { MomentumWeekdaySection } from "./components/weekday-section.ts";
import { MomentumEventsHolder } from "./components/events-holder.ts";
import { MomentumTasksHolder } from "./components/tasks-holder.ts";

import { HomeViewElement } from "./views/home-view.ts";
import { UserViewElement } from "./views/user-view.ts";

const routes: Switch.Route[] = [
        {
            path: "/app/user",
            view: html`<user-view></user-view>`
        },
        {
            path: "/app",
            view: html`<home-view></home-view>`
        },
        {
            path: "/",
            redirect: "/app"
        }
    ]

define ({
    "auth-provider": Auth.Provider,
    "history-provider": BrowserHistory.Provider,
    "router-switch": class AppSwitch extends Switch.Element {
        constructor() {
            super(routes);
        }
    },
    "store-provider": class AppStore extends Store.Provider<Model, Msg, Cmd> {
        constructor() {
            super(update, init);
        }
    },

    "momentum-header": MomentumHeader,
    "momentum-task-card": MomentumTaskCard,
    "momentum-event-card": MomentumEventCard,
    "momentum-weekday-section": MomentumWeekdaySection,
    "momentum-events-holder": MomentumEventsHolder,
    "momentum-tasks-holder": MomentumTasksHolder,

    "home-view": HomeViewElement,
    "user-view": UserViewElement
});

const savedDarkMode = localStorage.getItem("dark-mode");
if (savedDarkMode === "true") {
    document.body.classList.add("dark-mode");
}

document.body.addEventListener("darkmode:toggle", (ev: Event) => {
    const custom = ev as CustomEvent<{ checked: boolean }>;
    const checked = custom.detail.checked;

    document.body.classList.toggle("dark-mode", checked);
    localStorage.setItem("dark-mode", String(checked));
});
