import { Credential } from "../models";
declare function create(username: string, password: string): Promise<Credential>;
declare function verify(username: string, password: string): Promise<string>;
declare const _default: {
    create: typeof create;
    verify: typeof verify;
};
export default _default;
