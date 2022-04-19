export declare type VariableValue = string | number | Function | [] | VariableValue[];
export declare type VariableMap = {
    [k in string]: VariableValue;
};
export declare class Variables {
    private variables;
    private varTypes;
    constructor();
    removeAllVariables(): void;
    getAllVariables(): VariableMap;
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
    getVarType(varChar: string): string;
    setVarType(varChar: string, type: string): void;
}
