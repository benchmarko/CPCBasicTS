import type { CodeGeneratorJs } from "./CodeGeneratorJs";
import type { CpcVm } from "./CpcVm";
import type { IOutput } from "./Interfaces";
import type { Variables } from "./Variables";
interface ProgramCompilerOptions {
    generator: Pick<CodeGeneratorJs, "generateProgram" | "getSourceMap">;
    vm: Pick<CpcVm, "vmSetSourceMap" | "vmPutProgramInMem">;
    encodeTokens: (input: string) => string;
    onTokenized?: (sourceLength: number, tokenLength: number) => void;
    onMemoryError: (error: unknown) => void;
}
export declare class ProgramCompiler {
    private readonly options;
    constructor(options: ProgramCompilerOptions);
    compile(input: string, variables: Variables): IOutput;
}
export {};
//# sourceMappingURL=ProgramCompiler.d.ts.map