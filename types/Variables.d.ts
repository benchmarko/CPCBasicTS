export declare type VariableValue = string | number | Function | [] | VariableValue[];
export declare type VariableMap = Record<string, VariableValue>;
export declare type VarTypes = "I" | "R" | "$";
export declare type VariableTypeMap = Record<string, VarTypes>;
export declare class Variables {
    private variables;
    private varTypes;
    constructor();
    removeAllVariables(): void;
    removeAllVarTypes(): void;
    getAllVariables(): VariableMap;
    getAllVarTypes(): VariableTypeMap;
    private createNDimArray;
    determineStaticVarType(name: string): string;
    private getVarDefault;
    initVariable(name: string): void;
    dimVariable(name: string, dimensions: number[]): void;
    getAllVariableNames(): string[];
    getVariableIndex(name: string): number;
    initAllVariables(): void;
    getVariable(name: string): VariableValue;
    setVariable(name: string, value: VariableValue): void;
    getVariableByIndex(index: number): VariableValue;
    variableExist(name: string): boolean;
    getVarType(varChar: string): VarTypes;
    setVarType(varChar: string, type: VarTypes): void;
}
//# sourceMappingURL=Variables.d.ts.map