import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const serverDirectory = fileURLToPath(new URL("..", import.meta.url));

test("server configuration rejects a missing required value", () => {
    const result = spawnSync(
        process.execPath,
        ["--input-type=module", "-e", "import('./dist/config.js')"],
        {
            cwd: serverDirectory,
            encoding: "utf8",
            env: {
                ...process.env,
                MONGO_USER: ""
            }
        }
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing required environment variable: MONGO_USER/);
});
