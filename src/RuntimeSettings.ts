import type { CpcVm } from "./CpcVm";
import type { CodeGeneratorBasic } from "./CodeGeneratorBasic";
import type { CodeGeneratorJs } from "./CodeGeneratorJs";
import type { CodeGeneratorToken } from "./CodeGeneratorToken";
import type { Variables } from "./Variables";

export interface RuntimeSettingsOptions {
	codeGeneratorJs: CodeGeneratorJs
	variables: Variables
	vm: Pick<CpcVm, "vmGoto" | "vmStop">
	getCodeGeneratorBasic: () => CodeGeneratorBasic
	getCodeGeneratorToken: () => CodeGeneratorToken | undefined
	onVariablesCleared?: () => void
}

export class RuntimeSettings {
	constructor(private readonly options: RuntimeSettingsOptions) {}

	setImplicitLines(value: boolean): void {
		this.options.codeGeneratorJs.setOptions({ implicitLines: value });
		this.options.getCodeGeneratorToken()?.setOptions({ implicitLines: value });
	}

	setIntegerOverflow(value: boolean): void {
		this.options.codeGeneratorJs.setOptions({ integerOverflow: value });
	}

	setTrace(value: boolean): void {
		this.options.codeGeneratorJs.setOptions({ trace: value });
	}

	setPrettyLowercaseVars(value: boolean): void {
		this.options.getCodeGeneratorBasic().setOptions({ lowercaseVars: value });
	}

	setArrayBounds(value: boolean): void {
		const variables = this.options.variables;
		variables.setOptions({ arrayBounds: value });
		this.options.vm.vmGoto(0);
		this.options.vm.vmStop("end", 0, true);
		if (Object.keys(variables.getAllVariables()).length) {
			variables.removeAllVariables();
			this.options.onVariablesCleared?.();
		}
	}

	static getLoopDelay(speed: number): number {
		return 1000 - speed * 10;
	}
}