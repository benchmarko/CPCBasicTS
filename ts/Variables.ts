// Variables.ts - Variables
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasic/

type VariableValue = string | number | object; //TTT any?  string | number | function | array

export type VariableMap = { [k in string]: VariableValue };

type VariableTypeMap = { [k in string]: string };


export class Variables {
	oVariables: VariableMap;
	oVarTypes: VariableTypeMap; // default variable types for variables starting with letters a-z

	constructor() {
		this.init();
	}

	init(): void {
		this.oVariables = {};
		this.oVarTypes = {}; // default variable types for variables starting with letters a-z
	}

	removeAllVariables(): void {
		const oVariables = this.oVariables;

		for (const sName in oVariables) { // eslint-disable-line guard-for-in
			delete oVariables[sName];
		}
	}

	getAllVariables() {
		return this.oVariables;
	}

	private createNDimArray(aDims: number[], initVal: string | number) { // eslint-disable-line class-methods-use-this
		const fnCreateRec = function (iIndex: number) {
				const iLen = aDims[iIndex],
					aArr: VariableValue[] = new Array(iLen);

				iIndex += 1;
				if (iIndex < aDims.length) { // more dimensions?
					for (let i = 0; i < iLen; i += 1) {
						aArr[i] = fnCreateRec(iIndex); // recursive call
					}
				} else { // one dimension
					for (let i = 0; i < iLen; i += 1) {
						aArr[i] = initVal;
					}
				}
				return aArr;
			},
			aRet = fnCreateRec(0);

		return aRet;
	}

	// determine static varType (first letter + optional fixed vartype) from a variable name
	// format: (v.)<sname>(I|R|$)([...]([...])) with optional parts in ()
	determineStaticVarType(sName: string): string { // eslint-disable-line class-methods-use-this
		if (sName.indexOf("v.") === 0) { // preceding variable object?
			sName = sName.substr(2); // remove preceding "v."
		}

		let sNameType = sName.charAt(0); // take first character to determine variable type later

		if (sNameType === "_") { // ignore underscore (do not clash with keywords)
			sNameType = sName.charAt(1);
		}

		// explicit type specified?
		if (sName.indexOf("I") >= 0) {
			sNameType += "I";
		} else if (sName.indexOf("R") >= 0) {
			sNameType += "R";
		} else if (sName.indexOf("$") >= 0) {
			sNameType += "$";
		}
		return sNameType;
	}

	private getVarDefault(sVarName: string, aDimensions?: number[]) { // optional aDimensions
		let bIsString = sVarName.includes("$");

		if (!bIsString) { // check dynamic varType...
			let sFirst = sVarName.charAt(0);

			if (sFirst === "_") { // ignore underscore (do not clash with keywords)
				sFirst = sFirst.charAt(1);
			}
			bIsString = (this.getVarType(sFirst) === "$");
		}

		let value: VariableValue = bIsString ? "" : 0,
			iArrayIndices = sVarName.split("A").length - 1;

		if (iArrayIndices) {
			if (!aDimensions) {
				aDimensions = [];
				if (iArrayIndices > 3) { // on CPC up to 3 dimensions 0..10 without dim
					iArrayIndices = 3;
				}
				for (let i = 0; i < iArrayIndices; i += 1) {
					aDimensions.push(11);
				}
			}
			const aValue = this.createNDimArray(aDimensions, value);

			value = aValue;
		}
		return value;
	}

	initVariable(sName: string): void {
		this.oVariables[sName] = this.getVarDefault(sName, undefined);
	}

	dimVariable(sName: string, aDimensions: number[]): void {
		this.oVariables[sName] = this.getVarDefault(sName, aDimensions);
	}

	getAllVariableNames(): string[] {
		return Object.keys(this.oVariables);
	}

	getVariableIndex(sName: string): number {
		const aVarNames = this.getAllVariableNames(),
			iPos = aVarNames.indexOf(sName);

		return iPos;
	}

	initAllVariables(): void {
		const aVariables = this.getAllVariableNames();

		for (let i = 0; i < aVariables.length; i += 1) {
			this.initVariable(aVariables[i]);
		}
	}

	getVariable(sName: string): VariableValue {
		return this.oVariables[sName];
	}

	setVariable(sName: string, value: VariableValue): void {
		this.oVariables[sName] = value;
	}

	getVariableByIndex(iIndex: number): VariableValue { // needed for RSX: @var
		const aVariables = this.getAllVariableNames(),
			sName = aVariables[iIndex];

		return this.oVariables[sName];
	}

	variableExist(sName: string): boolean {
		return sName in this.oVariables;
	}


	getVarType(sVarChar: string): string {
		return this.oVarTypes[sVarChar];
	}

	setVarType(sVarChar: string, sType: string): void {
		this.oVarTypes[sVarChar] = sType;
	}
}
