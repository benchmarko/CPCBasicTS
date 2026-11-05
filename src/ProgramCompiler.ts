import type { CodeGeneratorJs } from "./CodeGeneratorJs";
import type { CpcVm } from "./CpcVm";
import type { IOutput } from "./Interfaces";
import type { Variables } from "./Variables";

interface ProgramCompilerOptions {
	generator: Pick<CodeGeneratorJs, "generateProgram" | "getSourceMap">
	vm: Pick<CpcVm, "vmSetSourceMap" | "vmPutProgramInMem">
	encodeTokens: (input: string) => string
	onTokenized?: (sourceLength: number, tokenLength: number) => void
	onMemoryError: (error: unknown) => void
}

export class ProgramCompiler {
	constructor(private readonly options: ProgramCompilerOptions) {}

	compile(input: string, variables: Variables): IOutput {
		const options = this.options,
			output = options.generator.generateProgram(input, variables);
		if (output.error) {
			return output;
		}
		options.vm.vmSetSourceMap(options.generator.getSourceMap());
		const tokens = options.encodeTokens(input);
		options.onTokenized?.(input.length, tokens.length);
		try {
			options.vm.vmPutProgramInMem(tokens);
		} catch (error) {
			options.onMemoryError(error);
		}
		return output;
	}
}