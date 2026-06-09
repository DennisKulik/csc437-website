import { UserProfile } from "../models";
declare function index(): Promise<UserProfile[]>;
declare function get(userid: string): Promise<UserProfile | undefined>;
declare function create(json: UserProfile): Promise<UserProfile>;
declare function update(userid: string, profile: UserProfile): Promise<UserProfile | undefined>;
declare function remove(userid: string): Promise<void>;
declare const _default: {
    index: typeof index;
    get: typeof get;
    create: typeof create;
    update: typeof update;
    remove: typeof remove;
};
export default _default;
