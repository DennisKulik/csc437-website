import { Events } from "../models";
declare function index(): Promise<Events[]>;
declare function get(id: string): Promise<Events | undefined>;
declare function create(json: Events): Promise<Events>;
declare function update(id: string, events: Events): Promise<Events | undefined>;
declare function remove(id: string): Promise<void>;
declare const _default: {
    index: typeof index;
    get: typeof get;
    create: typeof create;
    update: typeof update;
    remove: typeof remove;
};
export default _default;
