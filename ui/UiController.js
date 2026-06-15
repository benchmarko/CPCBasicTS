import { CommonEventHandler } from "./CommonEventHandler";
var UiController = /** @class */ (function () {
    function UiController(core, view, controller, onUserAction) {
        this.commonEventHandler = new CommonEventHandler({
            model: core.getModel(),
            view: view,
            controller: controller
        });
        view.addEventListener("click", this.commonEventHandler);
        view.addEventListener("change", this.commonEventHandler);
        this.commonEventHandler.initToggles();
        this.commonEventHandler.onKbdLayoutSelectChange(this.commonEventHandler.getEventDefById("change", "kbdLayoutSelect" /* ViewID.kbdLayoutSelect */));
        this.commonEventHandler.fnSetUserAction(onUserAction);
    }
    UiController.prototype.deactivateUserAction = function () {
        this.commonEventHandler.fnSetUserAction(undefined);
    };
    UiController.prototype.onVarSelectChange = function () {
        this.commonEventHandler.onVarSelectChange();
    };
    UiController.prototype.setPopoversHiddenExcept = function (exceptId) {
        this.commonEventHandler.setPopoversHiddenExcept(exceptId);
    };
    UiController.prototype.toggleAreaHiddenById = function (type, id) {
        return this.commonEventHandler.toggleAreaHiddenById(type, id);
    };
    return UiController;
}());
export { UiController };
//# sourceMappingURL=UiController.js.map