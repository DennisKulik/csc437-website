import { Events } from "../models";
declare function index(): Promise<Events[]>;
declare function get(id: string): Promise<Events | undefined>;
declare function create(json: Events): Promise<Events>;
declare const _default: {
    index: typeof index;
    get: typeof get;
    create: typeof create;
};
export default _default;
