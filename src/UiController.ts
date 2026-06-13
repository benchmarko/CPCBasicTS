import { CommonEventHandler } from "./CommonEventHandler";
import { ViewID } from "./Constants";
import { IController } from "./Interfaces";
import { Model } from "./Model";
import { View } from "./View";

export class UiController {
	private readonly commonEventHandler: CommonEventHandler;

	constructor(model: Model, view: View, controller: IController, onUserAction: () => void) {
		this.commonEventHandler = new CommonEventHandler({
			model,
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

	onVarSelectChange() {
		this.commonEventHandler.onVarSelectChange();
	}

	setPopoversHiddenExcept(exceptId?: ViewID): void {
		this.commonEventHandler.setPopoversHiddenExcept(exceptId);
	}

	toggleAreaHiddenById(type: string, id: ViewID): boolean {
		return this.commonEventHandler.toggleAreaHiddenById(type, id);
	}
}