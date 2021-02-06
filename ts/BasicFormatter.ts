// BasicFormatter.ts - Format BASIC source
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils } from "./Utils";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser";
import { IOutput } from "./Interfaces";

interface BasicFormatterOptions {
	lexer: BasicLexer
	parser: BasicParser
}

interface LineEntry {
	value: number,
	pos: number,
	len: number,
	newLine?: number
}

type LinesType = { [k in string]: LineEntry };

type ChangesType = { [k in number]: LineEntry};

export class BasicFormatter {
	lexer: BasicLexer
	parser: BasicParser
	iLine = 0; // current line (label)

	constructor(options: BasicFormatterOptions) {
		this.lexer = options.lexer;
		this.parser = options.parser;
	}

	private composeError(oError: Error, message: string, value: string, pos: number) {
		return Utils.composeError("BasicFormatter", oError, message, value, pos, this.iLine);
	}

	// renumber

	private fnCreateLineNumbersMap(aNodes: ParserNode[]) { // create line numbers map
		const oLines: LinesType = {}; // line numbers
		let iLastLine = 0;

		oLines[0] = { // dummy line 0 for: on error goto 0
			value: 0,
			pos: 0,
			len: 0
		};
		for (let i = 0; i < aNodes.length; i += 1) {
			const oNode = aNodes[i];

			if (oNode.type === "label") {
				const sLine = oNode.value,
					iLine = Number(oNode.value);

				this.iLine = iLine;
				if (sLine in oLines) {
					throw this.composeError(Error(), "Duplicate line number", sLine, oNode.pos);
				}
				if (iLine <= iLastLine) {
					throw this.composeError(Error(), "Line number not increasing", sLine, oNode.pos);
				}
				if (iLine < 1 || iLine > 65535) {
					throw this.composeError(Error(), "Line number overflow", sLine, oNode.pos);
				}
				oLines[oNode.value] = {
					value: iLine,
					pos: oNode.pos,
					len: String(oNode.orig || oNode.value).length
				};
				iLastLine = iLine;
			}
		}
		return oLines;
	}

	private fnAddSingleReference(oNode: ParserNode, oLines: LinesType, aRefs: LineEntry[]) {
		if (oNode.type === "linenumber") {
			if (oNode.value in oLines) {
				aRefs.push({
					value: Number(oNode.value),
					pos: oNode.pos,
					len: String(oNode.orig || oNode.value).length
				});
			} else {
				throw this.composeError(Error(), "Line does not exist", oNode.value, oNode.pos);
			}
		}
	}

	private fnAddReferences(aNodes: ParserNode[], oLines: LinesType, aRefs: LineEntry[]) {
		for (let i = 0; i < aNodes.length; i += 1) {
			const oNode = aNodes[i];

			if (oNode.type === "label") {
				this.iLine = Number(oNode.value); // for error messages
			} else {
				this.fnAddSingleReference(oNode, oLines, aRefs);
			}

			if (oNode.left) {
				this.fnAddSingleReference(oNode.left, oLines, aRefs);
			}
			if (oNode.right) {
				this.fnAddSingleReference(oNode.right, oLines, aRefs);
			}
			if (oNode.args) {
				this.fnAddReferences(oNode.args, oLines, aRefs); // revursive
			}
			if (oNode.args2) { // for "ELSE"
				this.fnAddReferences(oNode.args2, oLines, aRefs); // revursive
			}
		}
	}

	private fnRenumberLines(oLines: LinesType, aRefs: LineEntry[], iNew: number, iOld: number, iStep: number, iKeep: number) {
		const oChanges: ChangesType = {},
			aKeys = Object.keys(oLines);

		for (let i = 0; i < aKeys.length; i += 1) {
			const oLine = oLines[aKeys[i]];

			if (oLine.value >= iOld && oLine.value < iKeep) {
				if (iNew > 65535) {
					throw this.composeError(Error(), "Line number overflow", String(oLine.value), oLine.pos);
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
		return oChanges;
	}

	private static fnSortNumbers(a: number, b: number) {
		return a - b;
	}

	private static fnApplyChanges(sInput: string, oChanges: ChangesType) {
		const aKeys = Object.keys(oChanges).map(Number);

		aKeys.sort(BasicFormatter.fnSortNumbers);

		// apply changes to input in reverse order
		for (let i = aKeys.length - 1; i >= 0; i -= 1) {
			const oLine = oChanges[aKeys[i]];

			sInput = sInput.substring(0, oLine.pos) + oLine.newLine + sInput.substr(oLine.pos + oLine.len);
		}
		return sInput;
	}

	private fnRenumber(sInput: string, aParseTree: ParserNode[], iNew: number, iOld: number, iStep: number, iKeep: number) {
		const aRefs: LineEntry[] = [], // references
			oLines = this.fnCreateLineNumbersMap(aParseTree);

		this.fnAddReferences(aParseTree, oLines, aRefs); // create reference list

		const oChanges = this.fnRenumberLines(oLines, aRefs, iNew, iOld, iStep, iKeep),
			sOutput = BasicFormatter.fnApplyChanges(sInput, oChanges);

		return sOutput;
	}

	renumber(sInput: string, iNew: number, iOld: number, iStep: number, iKeep: number): IOutput {
		const oOut: IOutput = {
			text: ""
		};

		this.iLine = 0; // current line (label)

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
