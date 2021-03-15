export declare type VariableValue = string | number | object;
export declare type VariableMap = {
    [k in string]: VariableValue;
};
export declare class Variables {
    private oVariables;
    private oVarTypes;
    constructor();
    removeAllVariables(): void;
    getAllVariables(): VariableMap;
    private createNDimArray;
    determineStaticVarType(sName: string): string;
    private getVarDefault;
    initVariable(sName: string): void;
    dimVariable(sName: string, aDimensions: number[]): void;
    getAllVariableNames(): string[];
    getVariableIndex(sName: string): number;
    initAllVariables(): void;
    getVariable(sName: string): VariableValue;
    setVariable(sName: string, value: VariableValue): void;
    getVariableByIndex(iIndex: number): VariableValue;
    variableExist(sName: string): boolean;
    getVarType(sVarChar: string): string;
    setVarType(sVarChar: string, sType: string): void;
}
