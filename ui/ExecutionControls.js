export class ExecutionControls {
    constructor(view) {
        this.view = view;
    }
    update(state) {
        if (state.reason === "direct") {
            return;
        }
        const reason = state.reason;
        this.view.setDisabled("runButton" /* ViewID.runButton */, state.isRunning || reason === "reset");
        this.view.setDisabled("stopButton" /* ViewID.stopButton */, !state.isRunning && reason !== "fileLoad" && reason !== "fileSave");
        this.view.setDisabled("continueButton" /* ViewID.continueButton */, state.isRunning || reason === "end" || reason === "fileLoad" || reason === "fileSave" || reason === "parse" || reason === "renumLines" || reason === "reset");
    }
    programEdited() {
        this.view.setDisabled("continueButton" /* ViewID.continueButton */, true);
    }
}
//# sourceMappingURL=ExecutionControls.js.map