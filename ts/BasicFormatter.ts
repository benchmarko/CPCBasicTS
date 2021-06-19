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
	value: string,
	pos: number,
	len: number,
	newLine?: number
}

type LinesType = { [k in string]: LineEntry };

type ChangesType = { [k in number]: LineEntry};

export class BasicFormatter {
	private lexer: BasicLexer;
	private parser: BasicParser;
	private sLine = ""; // current line (label) for error messages

	constructor(options: BasicFormatterOptions) {
		this.lexer = options.lexer;
		this.parser = options.parser;
	}

	private composeError(oError: Error, message: string, value: string, pos: number) {
		return Utils.composeError("BasicFormatter", oError, message, value, pos, this.sLine);
	}

	// renumber

	private fnCreateLineNumbersMap(aNodes: ParserNode[]) { // create line numbers map
		const oLines: LinesType = {}; // line numbers
		let iLastLine = -1;

		for (let i = 0; i < aNodes.length; i += 1) {
			const oNode = aNodes[i];

			if (oNode.type === "label") {
				const sLine = oNode.value,
					iLine = Number(sLine);

				this.sLine = sLine;
				if (sLine in oLines) {
					throw this.composeError(Error(), "Duplicate line number", sLine, oNode.pos);
				}
				if (iLine <= iLastLine) {
					throw this.composeError(Error(), "Line number not increasing", sLine, oNode.pos);
				}
				if (iLine < 1 || iLine > 65535) {
					throw this.composeError(Error(), "Line number overflow", sLine, oNode.pos);
				}
				oLines[sLine] = {
					value: sLine,
					pos: oNode.pos,
					len: (oNode.orig || sLine).length
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
					value: oNode.value,
					pos: oNode.pos,
					len: (oNode.orig || oNode.value).length
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
				this.sLine = oNode.value;
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
				if (oNode.type === "onErrorGoto" && oNode.args.length === 1 && oNode.args[0].value === "0") {
					// ignore "on error goto 0"
				} else {
					this.fnAddReferences(oNode.args, oLines, aRefs); // recursive
				}
			}
			if (oNode.args2) { // for "ELSE"
				this.fnAddReferences(oNode.args2, oLines, aRefs); // recursive
			}
		}
	}

	private fnRenumberLines(oLines: LinesType, aRefs: LineEntry[], iNew: number, iOld: number, iStep: number, iKeep: number) {
		const oChanges: ChangesType = {},
			aKeys = Object.keys(oLines);

		for (let i = 0; i < aKeys.length; i += 1) {
			const oLine = oLines[aKeys[i]],
				iLine = Number(oLine.value);

			if (iLine >= iOld && iLine < iKeep) {
				if (iNew > 65535) {
					throw this.composeError(Error(), "Line number overflow", oLine.value, oLine.pos);
				}
				oLine.newLine = iNew;
				oChanges[oLine.pos] = oLine;
				iNew += iStep;
			}
		}

		for (let i = 0; i < aRefs.length; i += 1) {
			const oRef = aRefs[i],
				sLine = oRef.value,
				iLine = Number(sLine);

			if (iLine >= iOld && iLine < iKeep) {
				if (iLine !== oLines[sLine].newLine) {
					oRef.newLine = oLines[sLine].newLine;
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

		this.sLine = ""; // current line (label)
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
