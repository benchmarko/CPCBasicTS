// Variables.ts - Variables
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/

export type VariableValue = string | number | Function | [] | VariableValue[]; // eslint-disable-line @typescript-eslint/ban-types

export type VariableMap = { [k in string]: VariableValue };

type VariableTypeMap = { [k in string]: string };


export class Variables {
	private variables: VariableMap;
	private varTypes: VariableTypeMap; // default variable types for variables starting with letters a-z

	constructor() {
		this.variables = {};
		this.varTypes = {}; // default variable types for variables starting with letters a-z
	}

	removeAllVariables(): void {
		const variables = this.variables;

		for (const name in variables) { // eslint-disable-line guard-for-in
			delete variables[name];
		}
	}

	getAllVariables(): VariableMap {
		return this.variables;
	}

	private createNDimArray(dims: number[], initVal: string | number) { // eslint-disable-line class-methods-use-this
		const fnCreateRec = function (index: number) {
				const len = dims[index],
					arr: VariableValue[] = new Array(len);

				index += 1;
				if (index < dims.length) { // more dimensions?
					for (let i = 0; i < len; i += 1) {
						arr[i] = fnCreateRec(index); // recursive call
					}
				} else { // one dimension
					for (let i = 0; i < len; i += 1) {
						arr[i] = initVal;
					}
				}
				return arr;
			},
			ret = fnCreateRec(0);

		return ret;
	}

	// determine static varType (first letter + optional fixed vartype) from a variable name
	// format: (v.)<sname>(I|R|$)([...]([...])) with optional parts in ()
	determineStaticVarType(name: string): string { // eslint-disable-line class-methods-use-this
		if (name.indexOf("v.") === 0) { // preceding variable object?
			name = name.substr(2); // remove preceding "v."
		}

		let nameType = name.charAt(0); // take first character to determine variable type later

		if (nameType === "_") { // ignore underscore (do not clash with keywords)
			nameType = name.charAt(1);
		}

		// explicit type specified?
		if (name.indexOf("I") >= 0) {
			nameType += "I";
		} else if (name.indexOf("R") >= 0) {
			nameType += "R";
		} else if (name.indexOf("$") >= 0) {
			nameType += "$";
		}
		return nameType;
	}

	private getVarDefault(varName: string, dimensions?: number[]) { // optional dimensions
		let isString = varName.includes("$");

		if (!isString) { // check dynamic varType...
			let first = varName.charAt(0);

			if (first === "_") { // ignore underscore (do not clash with keywords)
				first = first.charAt(1);
			}
			isString = (this.getVarType(first) === "$");
		}

		let value: VariableValue = isString ? "" : 0,
			arrayIndices = varName.split("A").length - 1;

		if (arrayIndices) {
			if (!dimensions) {
				dimensions = [];
				if (arrayIndices > 3) { // on CPC up to 3 dimensions 0..10 without dim
					arrayIndices = 3;
				}
				for (let i = 0; i < arrayIndices; i += 1) {
					dimensions.push(11);
				}
			}
			const valueArray = this.createNDimArray(dimensions, value);

			value = valueArray;
		}
		return value;
	}

	initVariable(name: string): void {
		this.variables[name] = this.getVarDefault(name);
	}

	dimVariable(name: string, dimensions: number[]): void {
		this.variables[name] = this.getVarDefault(name, dimensions);
	}

	getAllVariableNames(): string[] {
		return Object.keys(this.variables);
	}

	getVariableIndex(name: string): number {
		const varNames = this.getAllVariableNames(),
			pos = varNames.indexOf(name);

		return pos;
	}

	initAllVariables(): void {
		const variables = this.getAllVariableNames();

		for (let i = 0; i < variables.length; i += 1) {
			this.initVariable(variables[i]);
		}
	}

	getVariable(name: string): VariableValue {
		return this.variables[name];
	}

	setVariable(name: string, value: VariableValue): void {
		this.variables[name] = value;
	}

	getVariableByIndex(index: number): VariableValue { // needed for RSX: @var
		const variables = this.getAllVariableNames(),
			name = variables[index];

		return this.variables[name];
	}

	variableExist(name: string): boolean {
		return name in this.variables;
	}


	getVarType(varChar: string): string {
		return this.varTypes[varChar];
	}

	setVarType(varChar: string, type: string): void {
		this.varTypes[varChar] = type;
	}
}