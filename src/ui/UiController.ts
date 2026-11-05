import { CommonEventHandler } from "./CommonEventHandler";
import { ViewID } from "./UiConstants";
import type { Diagnostic, ICore, RenumOptions } from "../Interfaces";
import type { IController } from "./UiInterfaces";
import { View, type SelectOptionElement } from "./View";
import type { ExecutionState } from "../ExecutionState";
import { ExecutionControls } from "./ExecutionControls";

export class UiController {
	private readonly commonEventHandler: CommonEventHandler;
	private readonly executionControls: ExecutionControls;

	constructor(core: ICore, private readonly view: View, private readonly controller: IController, onUserAction: () => void) {
		this.executionControls = new ExecutionControls(view);
		this.commonEventHandler = new CommonEventHandler({
			model: core.getModel(),
			view,
			controller
		});

		view.addEventListener("click", this.commonEventHandler);
		view.addEventListener("change", this.commonEventHandler);

		this.commonEventHandler.initToggles();
		this.commonEventHandler.onKbdLayoutSelectChange(this.commonEventHandler.getEventDefById("change", ViewID.kbdLayoutSelect));
		this.commonEventHandler.fnSetUserAction(onUserAction);
	}

	deactivateUserAction() {
		this.commonEventHandler.fnSetUserAction(undefined);
	}

	onExecutionState(state: ExecutionState): void {
		this.executionControls.update(state);
	}

	onDiagnostic(diagnostic: Diagnostic): void {
		if (diagnostic.selectSource && diagnostic.pos !== undefined) {
			const length = diagnostic.len || (diagnostic.value !== undefined ? String(diagnostic.value).length : 0);
			this.view.setAreaSelection(ViewID.inputText, diagnostic.pos, diagnostic.pos + length);
		}
	}

	onProgramEdited(): void {
		this.executionControls.programEdited();
	}

	getRenumOptions(): RenumOptions {
		return {
			newLine: Number(this.view.getInputValue(ViewID.renumNewInput)),
			oldLine: Number(this.view.getInputValue(ViewID.renumStartInput)),
			step: Number(this.view.getInputValue(ViewID.renumStepInput)),
			keep: Number(this.view.getInputValue(ViewID.renumKeepInput))
		};
	}

	onVarSelectChange() {
		this.commonEventHandler.onVarSelectChange();
	}

	refreshVariables(): void {
		const items: SelectOptionElement[] = this.controller.getVariableNames().map((name) => {
			const title = name + "=" + this.controller.getVariable(name),
				label = title.length > 35 ? title.substring(0, 35) + " ..." : title;
			return { value: name, text: label, title: label, selected: false };
		});
		items.sort((first, second) => first.value < second.value ? -1 : first.value > second.value ? 1 : 0);
		this.view.setSelectOptions(ViewID.varSelect, items);
	}

	setPopoversHiddenExcept(exceptId?: ViewID): void {
		this.commonEventHandler.setPopoversHiddenExcept(exceptId);
	}

	toggleAreaHiddenById(type: string, id: ViewID): boolean {
		return this.commonEventHandler.toggleAreaHiddenById(type, id);
	}
}
