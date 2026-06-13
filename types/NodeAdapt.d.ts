import { Utils } from "./Utils";
import { View } from "./View";
import { Controller } from "./Controller";
interface NodeAdaptDeps {
    View: typeof View;
    Controller: typeof Controller;
    Utils: typeof Utils;
}
export declare class NodeAdapt {
    static doAdapt(deps?: NodeAdaptDeps): void;
}
export {};
//# sourceMappingURL=NodeAdapt.d.ts.map