import type { ExecutionState } from "../ExecutionState";
import { ViewID } from "./UiConstants";
export declare class ExecutionControls {
    private readonly view;
    constructor(view: {
        setDisabled(id: ViewID, disabled: boolean): void;
    });
    update(state: ExecutionState): void;
    programEdited(): void;
}
//# sourceMappingURL=ExecutionControls.d.ts.map