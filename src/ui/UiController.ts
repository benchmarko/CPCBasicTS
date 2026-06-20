import { CommonEventHandler } from "./CommonEventHandler";
import { ViewID } from "./UiConstants";
import type { ICore } from "../Interfaces";
import type { IController } from "./UiInterfaces";
import { View } from "./View";

export class UiController {
	private readonly commonEventHandler: CommonEventHandler;

	constructor(core: ICore, view: View, controller: IController, onUserAction: () => void) {
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
