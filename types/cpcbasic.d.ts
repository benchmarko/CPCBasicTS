import type { ConfigType, INodeUtils, IUI } from "./Interfaces";
export interface CpcBasicStartupAdapter {
    getConfigOverrides: () => Partial<ConfigType>;
    getArgs: () => string[];
    isNodeRuntime: () => boolean;
    getUI: () => IUI | undefined;
    getNodeUtils: () => INodeUtils | undefined;
}
export declare class cpcBasic {
    static start(startupAdapter: CpcBasicStartupAdapter): void;
}
//# sourceMappingURL=cpcbasic.d.ts.map