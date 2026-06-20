import type { ICore, INodeUtils, LoadScriptFn } from "../Interfaces";
export declare class NodeUtils implements INodeUtils {
    private static currentScriptKey;
    private static nodeReadUrl;
    private static nodeReadFile;
    private static isUrl;
    static readonly loadScript: LoadScriptFn;
    private static writeResultDelta;
    nodeMain(core: ICore): void;
}
//# sourceMappingURL=NodeUtils.d.ts.map