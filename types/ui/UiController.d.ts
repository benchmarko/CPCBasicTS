import { ViewID } from "./Constants";
import type { ICore } from "../Interfaces";
import type { IController } from "./UiInterfaces";
import { View } from "./View";
export declare class UiController {
    private readonly commonEventHandler;
    constructor(core: ICore, view: View, controller: IController, onUserAction: () => void);
    deactivateUserAction(): void;
    onVarSelectChange(): void;
    setPopoversHiddenExcept(exceptId?: ViewID): void;
    toggleAreaHiddenById(type: string, id: ViewID): boolean;
}
//# sourceMappingURL=UiController.d.ts.map