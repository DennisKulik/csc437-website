import { define } from "@unbndl/html";
import { Auth } from "@unbndl/auth";

import { LoginFormElement } from "./components/login-form.ts";
import { MomentumHeader } from "./components/header-element.ts";
import { prepareStoredSession } from "./session.ts";

if (prepareStoredSession()) {
    window.location.replace("/app");
} else {
    define({
        "auth-provider": Auth.Provider,
        "login-form": LoginFormElement,
        "momentum-header": MomentumHeader
    });
}
