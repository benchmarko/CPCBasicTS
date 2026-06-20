import { CommonEventHandler } from "./CommonEventHandler";
export class UiController {
    constructor(core, view, controller, onUserAction) {
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
    onVarSelectChange() {
        this.commonEventHandler.onVarSelectChange();
    }
    setPopoversHiddenExcept(exceptId) {
        this.commonEventHandler.setPopoversHiddenExcept(exceptId);
    }
    toggleAreaHiddenById(type, id) {
        return this.commonEventHandler.toggleAreaHiddenById(type, id);
    }
}
//# sourceMappingURL=UiController.js.map