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

	// renumber

	private fnCreateLineNumbersMap(aParseTree: ParserNode[]) { // create line numbers map
		const oLines: LinesType = {}; // line numbers
		let iLastLine = 0;

		oLines[0] = { // dummy line 0 for: on error goto 0
			value: 0,
			pos: undefined,
			len: undefined
		};
		for (let i = 0; i < aParseTree.length; i += 1) {
			const oNode = aParseTree[i];

			if (oNode.type === "label") {
				const sLine = oNode.value,
					iLine = Number(oNode.value);

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

	private fnAddReferences(aNodes: ParserNode[], oLines: LinesType, aRefs: LineEntry[]) {
		const that = this;

		function addSingleReference(oNode: ParserNode) {
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
		}

		for (let i = 0; i < aNodes.length; i += 1) {
			const oNode = aNodes[i];

			addSingleReference(oNode);
			if (oNode.left) {
				addSingleReference(oNode.left);
			}
			if (oNode.right) {
				addSingleReference(oNode.right);
			}
			if (oNode.args) {
				this.fnAddReferences(oNode.args, oLines, aRefs);
			}
			if (oNode.args2) { // else
				this.fnAddReferences(oNode.args2, oLines, aRefs);
			}
		}
	}

	private fnRenumberLines(oLines: LinesType, aRefs: LineEntry[], iNew: number, iOld: number, iStep: number, iKeep: number) {
		const oChanges = {},
			aKeys = Object.keys(oLines);

		for (let i = 0; i < aKeys.length; i += 1) {
			const oLine = oLines[aKeys[i]];

			if (oLine.value >= iOld && oLine.value < iKeep) {
				if (iNew > 65535) {
					throw this.composeError(Error(), "Line number overflow", oLine.value, oLine.pos);
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

	private static fnApplyChanges(sInput: string, oChanges) {
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
