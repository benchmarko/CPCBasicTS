// Variables.ts - Variables
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasic/

"use strict";

type VariableValue = string | number | object; //TTT any?  string | number | function | array

type VariableMap = { [k in string]: VariableValue }; //TTT

type VariableTypeMap = { [k in string]: string };


export class Variables {
	oVariables!: VariableMap;
	oVarTypes!: VariableTypeMap; // default variable types for variables starting with letters a-z

	constructor() {
		this.init();
	}

	init() {
		this.oVariables = {};
		this.oVarTypes = {}; // default variable types for variables starting with letters a-z
	}

	removeAllVariables() {
		const oVariables = this.oVariables;

		for (let sName in oVariables) { // eslint-disable-line guard-for-in
			delete oVariables[sName];
		}
		return this;
	}

	getAllVariables() {
		return this.oVariables;
	}

	createNDimArray(aDims: number[], initVal: string | number) {
		var aRet,
			fnCreateRec = function (iIndex: number) {
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
			};

		aRet = fnCreateRec(0);
		return aRet;
	}

	// determine static varType (first letter + optional fixed vartype) from a variable name
	// format: (v.)<sname>(I|R|$)([...]([...])) with optional parts in ()
	determineStaticVarType(sName: string) {
		var sNameType;

		if (sName.indexOf("v.") === 0) { // preceding variable object?
			sName = sName.substr(2); // remove preceding "v."
		}

		sNameType = sName.charAt(0); // take first character to determine var type later
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

	getVarDefault(sVarName: string, aDimensions?: number[]) { // optional aDimensions
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

	initVariable(sName: string) {
		this.oVariables[sName] = this.getVarDefault(sName, undefined);
		return this;
	}

	dimVariable(sName: string, aDimensions: number[]) {
		this.oVariables[sName] = this.getVarDefault(sName, aDimensions);
		return this;
	}

	getAllVariableNames() {
		return Object.keys(this.oVariables);
	}

	getVariableIndex(sName: string) {
		var aVarNames = this.getAllVariableNames(),
			iPos;

		iPos = aVarNames.indexOf(sName);
		return iPos;
	}

	initAllVariables() {
		var aVariables = this.getAllVariableNames(),
			i;

		for (i = 0; i < aVariables.length; i += 1) {
			this.initVariable(aVariables[i]);
		}
		return this;
	}

	getVariable(sName: string) {
		return this.oVariables[sName];
	}

	setVariable(sName: string, value: any) { //TTT value can be string, number, function, array
		this.oVariables[sName] = value;
		return this;
	}

	getVariableByIndex(iIndex: number) { // needed for RSX: @var
		var aVariables = this.getAllVariableNames(),
			sName = aVariables[iIndex];

		return this.oVariables[sName];
	}

	variableExist(sName: string) {
		return sName in this.oVariables;
	}


	getVarType(sVarChar: string) {
		return this.oVarTypes[sVarChar];
	}

	setVarType(sVarChar: string, sType: string) {
		this.oVarTypes[sVarChar] = sType;
		return this;
	}
};
