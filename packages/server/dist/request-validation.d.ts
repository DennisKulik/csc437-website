import type { UserProfile } from "./models/index.ts";
export type RegistrationData = {
    username: string;
    password: string;
    profile: UserProfile;
};
export type LoginData = {
    username: string;
    password: string;
};
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function profileFromRequest(body: unknown, userid: string): UserProfile | undefined;
export declare function registrationFromRequest(body: unknown): RegistrationData | undefined;
export declare function loginFromRequest(body: unknown): LoginData | undefined;
