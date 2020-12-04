declare type VariableValue = string | number | object;
declare type VariableMap = {
    [k in string]: VariableValue;
};
declare type VariableTypeMap = {
    [k in string]: string;
};
export declare class Variables {
    oVariables: VariableMap;
    oVarTypes: VariableTypeMap;
    constructor();
    init(): void;
    removeAllVariables(): this;
    getAllVariables(): VariableMap;
    createNDimArray(aDims: number[], initVal: string | number): any;
    determineStaticVarType(sName: string): any;
    getVarDefault(sVarName: string, aDimensions?: number[]): VariableValue;
    initVariable(sName: string): this;
    dimVariable(sName: string, aDimensions: number[]): this;
    getAllVariableNames(): string[];
    getVariableIndex(sName: string): any;
    initAllVariables(): this;
    getVariable(sName: string): VariableValue;
    setVariable(sName: string, value: any): this;
    getVariableByIndex(iIndex: number): VariableValue;
    variableExist(sName: string): boolean;
    getVarType(sVarChar: string): string;
    setVarType(sVarChar: string, sType: string): this;
}
export {};
