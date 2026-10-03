import { UserProfile } from "../models";
declare function get(userid: string): Promise<UserProfile | undefined>;
declare function create(json: UserProfile): Promise<UserProfile>;
declare function update(userid: string, profile: UserProfile): Promise<UserProfile | undefined>;
declare const _default: {
    get: typeof get;
    create: typeof create;
    update: typeof update;
};
export default _default;
