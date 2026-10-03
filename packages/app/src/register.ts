import { define } from "@unbndl/html";
import { Auth } from "@unbndl/auth";

import { RegisterFormElement } from "./components/register-form.ts";
import { MomentumHeader } from "./components/header-element.ts";
import { prepareStoredSession } from "./session.ts";
import { initializeTheme } from "./theme.ts";

initializeTheme();

if (prepareStoredSession()) {
    window.location.replace("/app");
} else {
    define({
        "auth-provider": Auth.Provider,
        "register-form": RegisterFormElement,
        "momentum-header": MomentumHeader
    });
}
