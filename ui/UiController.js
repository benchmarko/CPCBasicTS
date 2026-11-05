import { CommonEventHandler } from "./CommonEventHandler";
import { ExecutionControls } from "./ExecutionControls";
export class UiController {
    constructor(core, view, controller, onUserAction) {
        this.view = view;
        this.controller = controller;
        this.executionControls = new ExecutionControls(view);
        this.commonEventHandler = new CommonEventHandler({
            model: core.getModel(),
            view,
            controller
        });
        view.addEventListener("click", this.commonEventHandler);
        view.addEventListener("change", this.commonEventHandler);
        this.commonEventHandler.initToggles();
        this.commonEventHandler.onKbdLayoutSelectChange(this.commonEventHandler.getEventDefById("change", "kbdLayoutSelect" /* ViewID.kbdLayoutSelect */));
        this.commonEventHandler.fnSetUserAction(onUserAction);
    }
    deactivateUserAction() {
        this.commonEventHandler.fnSetUserAction(undefined);
    }
    onExecutionState(state) {
        this.executionControls.update(state);
    }
    onDiagnostic(diagnostic) {
        if (diagnostic.selectSource && diagnostic.pos !== undefined) {
            const length = diagnostic.len || (diagnostic.value !== undefined ? String(diagnostic.value).length : 0);
            this.view.setAreaSelection("inputText" /* ViewID.inputText */, diagnostic.pos, diagnostic.pos + length);
        }
    }
    onProgramEdited() {
        this.executionControls.programEdited();
    }
    getRenumOptions() {
        return {
            newLine: Number(this.view.getInputValue("renumNewInput" /* ViewID.renumNewInput */)),
            oldLine: Number(this.view.getInputValue("renumStartInput" /* ViewID.renumStartInput */)),
            step: Number(this.view.getInputValue("renumStepInput" /* ViewID.renumStepInput */)),
            keep: Number(this.view.getInputValue("renumKeepInput" /* ViewID.renumKeepInput */))
        };
    }
    onVarSelectChange() {
        this.commonEventHandler.onVarSelectChange();
    }
    refreshVariables() {
        const items = this.controller.getVariableNames().map((name) => {
            const title = name + "=" + this.controller.getVariable(name), label = title.length > 35 ? title.substring(0, 35) + " ..." : title;
            return { value: name, text: label, title: label, selected: false };
        });
        items.sort((first, second) => first.value < second.value ? -1 : first.value > second.value ? 1 : 0);
        this.view.setSelectOptions("varSelect" /* ViewID.varSelect */, items);
    }
    setPopoversHiddenExcept(exceptId) {
        this.commonEventHandler.setPopoversHiddenExcept(exceptId);
    }
    toggleAreaHiddenById(type, id) {
        return this.commonEventHandler.toggleAreaHiddenById(type, id);
    }
}
//# sourceMappingURL=UiController.js.map