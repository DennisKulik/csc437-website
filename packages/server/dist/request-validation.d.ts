import type { UserProfile } from "./models/index.ts";
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function profileFromRequest(body: unknown, userid: string): UserProfile | undefined;
