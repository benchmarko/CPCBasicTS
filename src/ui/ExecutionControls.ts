import type { ExecutionState } from "../ExecutionState";
import { ViewID } from "./UiConstants";

export class ExecutionControls {
	constructor(private readonly view: { setDisabled(id: ViewID, disabled: boolean): void }) {}

	update(state: ExecutionState): void {
		if (state.reason === "direct") {
			return;
		}
		const reason = state.reason;
		this.view.setDisabled(ViewID.runButton, state.isRunning || reason === "reset");
		this.view.setDisabled(ViewID.stopButton, !state.isRunning && reason !== "fileLoad" && reason !== "fileSave");
		this.view.setDisabled(ViewID.continueButton, state.isRunning || reason === "end" || reason === "fileLoad" || reason === "fileSave" || reason === "parse" || reason === "renumLines" || reason === "reset");
	}

	programEdited(): void {
		this.view.setDisabled(ViewID.continueButton, true);
	}
}