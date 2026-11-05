import { ViewID } from "./UiConstants";
import type { Diagnostic, ICore, RenumOptions } from "../Interfaces";
import type { IController } from "./UiInterfaces";
import { View } from "./View";
import type { ExecutionState } from "../ExecutionState";
export declare class UiController {
    private readonly view;
    private readonly controller;
    private readonly commonEventHandler;
    private readonly executionControls;
    constructor(core: ICore, view: View, controller: IController, onUserAction: () => void);
    deactivateUserAction(): void;
    onExecutionState(state: ExecutionState): void;
    onDiagnostic(diagnostic: Diagnostic): void;
    onProgramEdited(): void;
    getRenumOptions(): RenumOptions;
    onVarSelectChange(): void;
    refreshVariables(): void;
    setPopoversHiddenExcept(exceptId?: ViewID): void;
    toggleAreaHiddenById(type: string, id: ViewID): boolean;
}
//# sourceMappingURL=UiController.d.ts.map