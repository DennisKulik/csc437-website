import { Events } from "../models";
declare function index(): Promise<Events[]>;
declare function get(id: string): Promise<Events | undefined>;
declare const _default: {
    index: typeof index;
    get: typeof get;
};
export default _default;
