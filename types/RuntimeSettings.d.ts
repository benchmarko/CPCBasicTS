import type { CpcVm } from "./CpcVm";
import type { CodeGeneratorBasic } from "./CodeGeneratorBasic";
import type { CodeGeneratorJs } from "./CodeGeneratorJs";
import type { CodeGeneratorToken } from "./CodeGeneratorToken";
import type { Variables } from "./Variables";
export interface RuntimeSettingsOptions {
    codeGeneratorJs: CodeGeneratorJs;
    variables: Variables;
    vm: Pick<CpcVm, "vmGoto" | "vmStop">;
    getCodeGeneratorBasic: () => CodeGeneratorBasic;
    getCodeGeneratorToken: () => CodeGeneratorToken | undefined;
    onVariablesCleared?: () => void;
}
export declare class RuntimeSettings {
    private readonly options;
    constructor(options: RuntimeSettingsOptions);
    setImplicitLines(value: boolean): void;
    setIntegerOverflow(value: boolean): void;
    setTrace(value: boolean): void;
    setPrettyLowercaseVars(value: boolean): void;
    setArrayBounds(value: boolean): void;
    static getLoopDelay(speed: number): number;
}
//# sourceMappingURL=RuntimeSettings.d.ts.map