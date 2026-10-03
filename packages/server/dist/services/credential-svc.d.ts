import { Credential } from "../models";
declare function create(username: string, password: string): Promise<Credential>;
declare function verify(username: string, password: string): Promise<string>;
declare function remove(username: string): Promise<boolean>;
declare const _default: {
    create: typeof create;
    verify: typeof verify;
    remove: typeof remove;
};
export default _default;
