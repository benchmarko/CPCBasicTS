// BasicFormatter.ts - Format BASIC source
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils } from "./Utils";
import { BasicLexer } from "./BasicLexer";
import { BasicParser } from "./BasicParser";
import { IOutput } from "./Interfaces";

interface BasicFormatterOptions {
	lexer: BasicLexer
	parser: BasicParser
}

export class BasicFormatter {
	lexer: BasicLexer
	parser: BasicParser
	iLine = 0;

	constructor(options: BasicFormatterOptions) {
		this.lexer = options.lexer;
		this.parser = options.parser;
		this.reset();
	}

	reset(): void {
		this.iLine = 0; // current line (label)
	}

	private composeError(...aArgs) { // eslint-disable-line class-methods-use-this
		aArgs.unshift("BasicFormatter");
		return Utils.composeError.apply(null, aArgs);
	}

	private fnRenumber(sInput: string, aParseTree, iNew: number, iOld: number, iStep: number, iKeep: number) {
		const that = this,
			oLines = {}, // line numbers
			aRefs = [], // references
			oChanges = {},

			fnCreateLineNumbersMap = function () { // create line numbers map
				let iLastLine = 0;

				oLines[0] = { // dummy line 0 for: on error goto 0
					value: 0
				};
				for (let i = 0; i < aParseTree.length; i += 1) {
					const oNode = aParseTree[i];

					if (oNode.type === "label") {
						const sLine = oNode.value,
							iLine = Number(oNode.value);

						if (sLine in oLines) {
							throw that.composeError(Error(), "Duplicate line number", sLine, oNode.pos);
						}
						if (iLine <= iLastLine) {
							throw that.composeError(Error(), "Line number not increasing", sLine, oNode.pos);
						}
						if (iLine < 1 || iLine > 65535) {
							throw that.composeError(Error(), "Line number overflow", sLine, oNode.pos);
						}
						oLines[oNode.value] = {
							value: iLine,
							pos: oNode.pos,
							len: String(oNode.orig || oNode.value).length
						};
						iLastLine = iLine;
					}
				}
			},
			fnAddReferences = function (aNodes) {
				for (let i = 0; i < aNodes.length; i += 1) {
					const oNode = aNodes[i];

					if (oNode.type === "linenumber") {
						if (oNode.value in oLines) {
							aRefs.push({
								value: Number(oNode.value),
								pos: oNode.pos,
								len: String(oNode.orig || oNode.value).length
							});
						} else {
							throw that.composeError(Error(), "Line does not exist", oNode.value, oNode.pos);
						}
					}
					if (oNode.left) {
						fnAddReferences(oNode.left);
					}
					if (oNode.right) {
						fnAddReferences(oNode.right);
					}
					if (oNode.third) {
						fnAddReferences(oNode.third);
					}
					if (oNode.args) {
						fnAddReferences(oNode.args);
					}
				}
			},
			fnRenumberLines = function () {
				const aKeys = Object.keys(oLines);

				for (let i = 0; i < aKeys.length; i += 1) {
					const oLine = oLines[aKeys[i]];

					if (oLine.value >= iOld && oLine.value < iKeep) {
						if (iNew > 65535) {
							throw that.composeError(Error(), "Line number overflow", oLine.value, oLine.pos);
						}
						oLine.newLine = iNew;
						oChanges[oLine.pos] = oLine;
						iNew += iStep;
					}
				}

				for (let i = 0; i < aRefs.length; i += 1) {
					const oRef = aRefs[i];

					if (oRef.value >= iOld && oRef.value < iKeep) {
						if (oRef.value !== oLines[oRef.value].newLine) {
							oRef.newLine = oLines[oRef.value].newLine;
							oChanges[oRef.pos] = oRef;
						}
					}
				}
			},
			fnSortNumbers = function (a: number, b: number) {
				return a - b;
			},
			fnApplyChanges = function () {
				const aKeys = Object.keys(oChanges).map(Number);

				aKeys.sort(fnSortNumbers);

				// apply changes to input in reverse order
				for (let i = aKeys.length - 1; i >= 0; i -= 1) {
					const oLine = oChanges[aKeys[i]];

					sInput = sInput.substring(0, oLine.pos) + oLine.newLine + sInput.substr(oLine.pos + oLine.len);
				}
			};

		fnCreateLineNumbersMap();

		fnAddReferences(aParseTree); // create reference list

		fnRenumberLines();

		fnApplyChanges();

		return sInput;
	}

	renumber(sInput: string, iNew: number, iOld: number, iStep: number, iKeep: number): IOutput {
		const oOut: IOutput = {
			text: "",
			error: undefined
		};

		try {
			const aTokens = this.lexer.lex(sInput),
				aParseTree = this.parser.parse(aTokens),
				sOutput = this.fnRenumber(sInput, aParseTree, iNew, iOld, iStep, iKeep || 65535);

			oOut.text = sOutput;
		} catch (e) {
			oOut.error = e;
		}
		return oOut;
	}
}
