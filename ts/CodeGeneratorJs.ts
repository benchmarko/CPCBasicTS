// CodeGeneratorJs.ts - Code Generator for JavaScript
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils } from "./Utils";
import { IOutput, ICpcVmRsx } from "./Interfaces";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser";
import { Variables } from "./Variables";

interface CodeGeneratorJsOptions {
	lexer: BasicLexer
	parser: BasicParser
	rsx: ICpcVmRsx
	tron: boolean
	bQuiet?: boolean
	bNoCodeFrame?: boolean
}

interface CodeNode extends ParserNode {
	left?: CodeNode
	right?: CodeNode
	args: CodeNode[]
	pt: string
	pv: string
}

type StringArray = string[];

type LabelsType = { [k in string]: number };

export class CodeGeneratorJs {
	private lexer: BasicLexer;
	private parser: BasicParser;
	private tron: boolean;
	private rsx: ICpcVmRsx;
	private bQuiet: boolean;
	private bNoCodeFrame: boolean

	private iLine = 0; // current line (label)
	private reJsKeywords: RegExp;

	private oStack = {
		forLabel: [] as StringArray,
		forVarName: [] as StringArray,
		whileLabel: [] as StringArray
	};

	private aData: StringArray = []; // collected data from data lines

	private oLabels: LabelsType = {}; // labels or line numbers

	private bMergeFound = false; // if we find chain or chain merge, the program is not complete and we cannot check for existing line numbers during compile time (or do a renumber)

	private iGosubCount = 0;
	private iIfCount = 0;
	private iStopCount = 0;
	private iForCount = 0; // stack needed
	private iWhileCount = 0; // stack needed

	// for evaluate:
	private oVariables: Variables = {} as Variables; // will be set later
	private oDefScopeArgs?: { [k: string]: boolean };

	constructor(options: CodeGeneratorJsOptions) {
		this.lexer = options.lexer;
		this.parser = options.parser;
		this.tron = options.tron;
		this.rsx = options.rsx;
		this.bQuiet = options.bQuiet || false;
		this.bNoCodeFrame = options.bNoCodeFrame || false;

		this.reJsKeywords = CodeGeneratorJs.createJsKeywordRegex();
	}

	// ECMA 3 JS Keywords which must be avoided in dot notation for properties when using IE8
	private static aJsKeywords = [
		"do",
		"if",
		"in",
		"for",
		"int",
		"new",
		"try",
		"var",
		"byte",
		"case",
		"char",
		"else",
		"enum",
		"goto",
		"long",
		"null",
		"this",
		"true",
		"void",
		"with",
		"break",
		"catch",
		"class",
		"const",
		"false",
		"final",
		"float",
		"short",
		"super",
		"throw",
		"while",
		"delete",
		"double",
		"export",
		"import",
		"native",
		"public",
		"return",
		"static",
		"switch",
		"throws",
		"typeof",
		"boolean",
		"default",
		"extends",
		"finally",
		"package",
		"private",
		"abstract",
		"continue",
		"debugger",
		"function",
		"volatile",
		"interface",
		"protected",
		"transient",
		"implements",
		"instanceof",
		"synchronized"
	];

	private reset() {
		const oStack = this.oStack;

		oStack.forLabel.length = 0;
		oStack.forVarName.length = 0;
		oStack.whileLabel.length = 0;

		this.iLine = 0; // current line (label)

		this.resetCountsPerLine();

		this.aData.length = 0;

		this.oLabels = {}; // labels or line numbers
		this.bMergeFound = false; // if we find chain or chain merge, the program is not complete and we cannot check for existing line numbers during compile time (or do a renumber)
	}

	private resetCountsPerLine() {
		this.iGosubCount = 0;
		this.iIfCount = 0;
		this.iStopCount = 0;
		this.iForCount = 0; // stack needed
		this.iWhileCount = 0; // stack needed
	}

	private composeError(oError: Error, message: string, value: string, pos: number) {
		return Utils.composeError("CodeGeneratorJs", oError, message, value, pos, this.iLine);
	}

	private static createJsKeywordRegex() {
		return new RegExp("^(" + CodeGeneratorJs.aJsKeywords.join("|") + ")$");
	}


	private fnDeclareVariable(sName: string) {
		if (!this.oVariables.variableExist(sName)) { // variable not yet defined?
			this.oVariables.initVariable(sName);
		}
	}

	private fnAdaptVariableName(sName: string, iArrayIndices: number) {
		const oDefScopeArgs = this.oDefScopeArgs;

		sName = sName.toLowerCase();
		sName = sName.replace(/\./g, "_");

		if (oDefScopeArgs || !Utils.bSupportReservedNames) { // avoid keywords as def fn parameters; and for IE8 avoid keywords in dot notation
			if (this.reJsKeywords.test(sName)) { // IE8: avoid keywords in dot notation
				sName = "_" + sName; // prepend underscore
			}
		}

		if (sName.endsWith("!")) { // real number?
			sName = sName.slice(0, -1) + "R"; // "!" => "R"
		} else if (sName.endsWith("%")) { // integer number?
			sName = sName.slice(0, -1) + "I";
		}
		if (iArrayIndices) {
			sName += "A".repeat(iArrayIndices);
		}
		if (oDefScopeArgs) {
			if (sName === "o") { // we must not use format parameter "o" since this is our vm object
				sName = "oNo"; // change variable name to something we cannot set in BASIC
			}
			if (!oDefScopeArgs.bCollectDone) { // in collection mode?
				oDefScopeArgs[sName] = true; // declare DEF scope variable
			} else if (!(sName in oDefScopeArgs)) {
				// variable
				this.fnDeclareVariable(sName);
				sName = "v." + sName; // access with "v."
			}
		} else {
			this.fnDeclareVariable(sName);
			sName = "v." + sName; // access with "v."
		}
		return sName;
	}

	private fnParseOneArg(oArg: ParserNode) {
		return this.parseNode(oArg as CodeNode); // eslint-disable-line no-use-before-define
	}

	private fnParseArgRange(aArgs: ParserNode[], iStart: number, iStop: number) {
		const aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)

		for (let i = iStart; i <= iStop; i += 1) {
			aNodeArgs.push(this.fnParseOneArg(aArgs[i]));
		}
		return aNodeArgs;
	}

	private fnParseArgs(aArgs: ParserNode[] | undefined) {
		const aNodeArgs: string[] = []; // do not modify node.args here (could be a parameter of defined function)

		if (!aArgs) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
		}

		for (let i = 0; i < aArgs.length; i += 1) {
			aNodeArgs[i] = this.fnParseOneArg(aArgs[i]);
		}
		return aNodeArgs;
	}

	private fnDetermineStaticVarType(sName: string) {
		return this.oVariables.determineStaticVarType(sName);
	}

	private static fnIsIntConst(a: string) {
		const reIntConst = /^[+-]?([0-9]+|0x[0-9a-f]+|0b[0-1]+)$/; // regex for integer, hex, binary constant

		return reIntConst.test(a);
	}

	private static fnGetRoundString(node: CodeNode) {
		if (node.pt !== "I") { // no rounding needed for integer, hex, binary constants, integer variables, functions returning integer (optimization)
			node.pv = "o.vmRound(" + node.pv + ")";
		}
		return node.pv;
	}

	private static fnIsInString(sString: string, sFind: string) {
		return sFind && sString.indexOf(sFind) >= 0;
	}

	private fnPropagateStaticTypes(node: CodeNode, oLeft: CodeNode, oRight: CodeNode, sTypes: string) {
		if (oLeft.pt && oRight.pt) {
			if (CodeGeneratorJs.fnIsInString(sTypes, oLeft.pt + oRight.pt)) {
				node.pt = oLeft.pt === oRight.pt ? oLeft.pt : "R";
			} else {
				throw this.composeError(Error(), "Type error", node.value, node.pos);
			}
		} else if (oLeft.pt && !CodeGeneratorJs.fnIsInString(sTypes, oLeft.pt) || oRight.pt && !CodeGeneratorJs.fnIsInString(sTypes, oRight.pt)) {
			throw this.composeError(Error(), "Type error", node.value, node.pos);
		}
	}

	// mOperators

	private plus(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "+" (binary or unary)
		if (oLeft === undefined) { // unary plus? => skip it
			node.pv = oRight.pv;
			const sType = oRight.pt;

			if (CodeGeneratorJs.fnIsInString("IR$", sType)) { // I, R or $?
				node.pt = sType;
			} else if (sType) {
				throw this.composeError(Error(), "Type error", node.value, node.pos);
			}
		} else {
			node.pv = oLeft.pv + " + " + oRight.pv;
			this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
		}
		return node.pv;
	}

	private minus(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "-" (binary or unary)
		if (oLeft === undefined) { // unary minus?
			const sValue = oRight.pv,
				sType = oRight.pt;

			// when optimizing, beware of "--" operator in JavaScript!
			if (CodeGeneratorJs.fnIsIntConst(sValue) || oRight.type === "number") { // int const or number const (also fp)
				if (sValue.charAt(0) === "-") { // starting already with "-"?
					node.pv = sValue.substr(1); // remove "-"
				} else {
					node.pv = "-" + sValue;
				}
			} else {
				node.pv = "-(" + sValue + ")"; // can be an expression
			}

			if (CodeGeneratorJs.fnIsInString("IR", sType)) { // I or R?
				node.pt = sType;
			} else if (sType) {
				throw this.composeError(Error(), "Type error", node.value, node.pos);
			}
		} else {
			node.pv = oLeft.pv + " - " + oRight.pv;
			this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
		}
		return node.pv;
	}

	private mult(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "*"
		node.pv = oLeft.pv + " * " + oRight.pv;
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
		return node.pv;
	}

	private div(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "/"
		node.pv = oLeft.pv + " / " + oRight.pv;
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
		node.pt = "R"; // event II can get a fraction
		return node.pv;
	}

	private intDiv(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "\\"
		node.pv = "(" + oLeft.pv + " / " + oRight.pv + ") | 0"; // integer division
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private exponent(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "^"
		node.pv = "Math.pow(" + oLeft.pv + ", " + oRight.pv + ")";
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
		return node.pv;
	}

	private and(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) {
		node.pv = CodeGeneratorJs.fnGetRoundString(oLeft) + " & " + CodeGeneratorJs.fnGetRoundString(oRight);
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private or(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) {
		node.pv = CodeGeneratorJs.fnGetRoundString(oLeft) + " | " + CodeGeneratorJs.fnGetRoundString(oRight);
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private xor(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) {
		node.pv = CodeGeneratorJs.fnGetRoundString(oLeft) + " ^ " + CodeGeneratorJs.fnGetRoundString(oRight);
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private static not(node: CodeNode, _oLeft: CodeNode, oRight: CodeNode) { // (unary operator)
		node.pv = "~(" + CodeGeneratorJs.fnGetRoundString(oRight) + ")"; // a can be an expression
		node.pt = "I";
		return node.pv;
	}

	private mod(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) {
		node.pv = CodeGeneratorJs.fnGetRoundString(oLeft) + " % " + CodeGeneratorJs.fnGetRoundString(oRight);
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private greater(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // ">"
		node.pv = oLeft.pv + " > " + oRight.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private less(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "<"
		node.pv = oLeft.pv + " < " + oRight.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private greaterEqual(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // ">="
		node.pv = oLeft.pv + " >= " + oRight.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private lessEqual(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "<="
		node.pv = oLeft.pv + " <= " + oRight.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private equal(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "="
		node.pv = oLeft.pv + " === " + oRight.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private notEqual(node: CodeNode, oLeft: CodeNode, oRight: CodeNode) { // "<>"
		node.pv = oLeft.pv + " !== " + oRight.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, oLeft, oRight, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private addressOf(node: CodeNode, _oLeft: CodeNode, oRight: CodeNode) { // "@" (unary operator)
		node.pv = 'o.addressOf("' + oRight.pv + '")'; // address of
		if (oRight.type !== "identifier") {
			throw this.composeError(Error(), "Expected identifier", node.value, node.pos);
		}
		node.pt = "I";
		return node.pv;
	}

	private static stream(node: CodeNode, _oLeft: CodeNode, oRight: CodeNode) { // (unary operator)
		// "#" stream as prefix operator
		node.pv = oRight.pv;
		node.pt = "I";
		return node.pv;
	}


	/* eslint-disable no-invalid-this */
	private mOperators: { [k in string]: (node: CodeNode, oLeft: CodeNode, oRight: CodeNode) => string } = { // to call methods, use mOperators[].call(this,...)
		"+": this.plus,
		"-": this.minus,
		"*": this.mult,
		"/": this.div,
		"\\": this.intDiv,
		"^": this.exponent,
		and: this.and,
		or: this.or,
		xor: this.xor,
		not: CodeGeneratorJs.not,
		mod: this.mod,
		">": this.greater,
		"<": this.less,
		">=": this.greaterEqual,
		"<=": this.lessEqual,
		"=": this.equal,
		"<>": this.notEqual,
		"@": this.addressOf,
		"#": CodeGeneratorJs.stream
	};
	/* eslint-enable no-invalid-this */


	private fnParseDefIntRealStr(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < aNodeArgs.length; i += 1) {
			const sArg = aNodeArgs[i];

			aNodeArgs[i] = "o." + node.type + '("' + sArg + '")';
		}
		node.pv = aNodeArgs.join("; ");
		return node.pv;
	}

	private fnParseErase(node: CodeNode) {
		this.oDefScopeArgs = {}; // collect DEF scope args
		const aNodeArgs = this.fnParseArgs(node.args);

		this.oDefScopeArgs = undefined;

		for (let i = 0; i < aNodeArgs.length; i += 1) {
			aNodeArgs[i] = '"' + aNodeArgs[i] + '"'; // put in quotes
		}
		node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
		return node.pv;
	}

	private fnAddReferenceLabel(sLabel: string, node: ParserNode) {
		if (sLabel in this.oLabels) {
			this.oLabels[sLabel] += 1;
		} else {
			if (Utils.debug > 1) {
				Utils.console.debug("fnAddReferenceLabel: line does not (yet) exist:", sLabel);
			}
			if (!this.bMergeFound) {
				throw this.composeError(Error(), "Line does not exist", sLabel, node.pos);
			}
		}
	}

	private fnCommandWithGoto(node: CodeNode, aNodeArgs?: string[]) { // optional aNodeArgs
		aNodeArgs = aNodeArgs || this.fnParseArgs(node.args);
		const sCommand = node.type,
			sLabel = this.iLine + "s" + this.iStopCount; // we use stopCount

		this.iStopCount += 1;
		node.pv = "o." + sCommand + "(" + aNodeArgs.join(", ") + "); o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":";
		return node.pv;
	}

	private static semicolon(node: CodeNode) {
		// ";" input, line input
		node.pv = ";";
		return node.pv;
	}

	private static comma(node: CodeNode) {
		// "," input, line input
		node.pv = ",";
		return node.pv;
	}

	private vertical(node: CodeNode) { // "|" rsx
		let sRsxName = node.value.substr(1).toLowerCase().replace(/\./g, "_");
		const bRsxAvailable = this.rsx && this.rsx.rsxIsAvailable(sRsxName),
			aNodeArgs = this.fnParseArgs(node.args),
			sLabel = this.iLine + "s" + this.iStopCount; // we use stopCount

		this.iStopCount += 1;

		if (!bRsxAvailable) { // if RSX not available, we delay the error until it is executed (or catched by on error goto)
			if (!this.bQuiet) {
				const oError = this.composeError(Error(), "Unknown RSX command", node.value, node.pos);

				Utils.console.warn(oError);
			}
			aNodeArgs.unshift('"' + sRsxName + '"'); // put as first arg
			sRsxName = "rsxExec"; // and call special handler which triggers error if not available
		}

		node.pv = "o.rsx." + sRsxName + "(" + aNodeArgs.join(", ") + "); o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":"; // most RSX commands need goto (era, ren,...)
		return node.pv;
	}
	private static number(node: CodeNode) {
		node.pt = (/^[0-9]+$/).test(node.value) ? "I" : "R";
		node.pv = node.value; // keep string
		return node.pv;
	}
	private static binnumber(node: CodeNode) {
		let sValue = node.value.slice(2); // remove &x

		if (Utils.bSupportsBinaryLiterals) {
			sValue = "0b" + ((sValue.length) ? sValue : "0"); // &x->0b; 0b is ES6
		} else {
			sValue = "0x" + ((sValue.length) ? parseInt(sValue, 2).toString(16) : "0"); // we convert it to hex
		}
		node.pt = "I";
		node.pv = sValue;
		return node.pv;
	}
	private static hexnumber(node: CodeNode) {
		let sValue = node.value.slice(1); // remove &

		if (sValue.charAt(0).toLowerCase() === "h") { // optional h
			sValue = sValue.slice(1); // remove
		}

		sValue = "0x" + ((sValue.length) ? sValue : "0"); // &->0x
		node.pt = "I";
		node.pv = sValue;
		return node.pv;
	}
	private static linenumber(node: CodeNode) {
		node.pv = node.value;
		return node.pv;
	}
	private identifier(node: CodeNode) { // identifier or identifier with array
		const aNodeArgs = node.args ? this.fnParseArgRange(node.args, 1, node.args.length - 2) : [], // array: we skip open and close bracket
			sName = this.fnAdaptVariableName(node.value, aNodeArgs.length), // here we use node.value
			sValue = sName + aNodeArgs.map(function (val) {
				return "[" + val + "]";
			}).join("");

		let sVarType = this.fnDetermineStaticVarType(sName);

		if (sVarType.length > 1) {
			sVarType = sVarType.charAt(1);
			node.pt = sVarType;
		}
		node.pv = sValue;
		return node.pv;
	}
	private static letter(node: CodeNode) { // for defint, defreal, defstr
		node.pv = node.value;
		return node.pv;
	}
	private range(node: CodeNode) { // for defint, defreal, defstr
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}
		const sLeft = this.fnParseOneArg(node.left),
			sRight = this.fnParseOneArg(node.right);

		if (sLeft > sRight) {
			throw this.composeError(Error(), "Decreasing range", node.value, node.pos);
		}
		node.pv = sLeft + " - " + sRight;
		return node.pv;
	}
	private linerange(node: CodeNode) { // for delete, list
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}
		const sLeft = this.fnParseOneArg(node.left),
			sRight = this.fnParseOneArg(node.right),
			iLeft = Number(sLeft), // "undefined" gets NaN (should we check node.left.type for null?)
			iRight = Number(sRight);

		if (iLeft > iRight) { // comparison with NaN and number is always false
			throw this.composeError(Error(), "Decreasing line range", node.value, node.pos);
		}

		const sRightSpecified = (sRight === "undefined") ? "65535" : sRight; // make sure we set a missing right range parameter

		node.pv = !sRight ? sLeft : sLeft + ", " + sRightSpecified;
		return node.pv;
	}
	private static string(node: CodeNode) {
		node.pt = "$";
		node.pv = '"' + node.value + '"';
		return node.pv;
	}
	private static unquoted(node: CodeNode) { // data line item, can be interpreted as string or number
		const sValue = node.value.replace(/"/g, "\\\""); // escape "

		node.pt = "$";
		node.pv = '"' + sValue + '"';
		return node.pv;
		//return CodeGeneratorJs.string(node); // for JS we quote it as well
	}
	private static fnNull(node: CodeNode) { // "null": means: no parameter specified
		node.pv = node.value !== "null" ? node.value : "undefined"; // use explicit value or convert "null" to "undefined"
		return node.pv;
	}
	private assign(node: CodeNode) {
		// see also "let"

		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}
		let sName: string;

		if (node.left.type === "identifier") {
			sName = this.fnParseOneArg(node.left);
		} else {
			throw this.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
		}

		const value = this.fnParseOneArg(node.right);

		this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
		const sVarType = this.fnDetermineStaticVarType(sName);

		let sValue: string;

		if (node.pt) {
			if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
				sValue = "o.vmRound(" + value + ")";
				node.pt = "I"; // "R" => "I"
			} else {
				sValue = value;
			}
		} else {
			sValue = "o.vmAssign(\"" + sVarType + "\", " + value + ")";
		}
		sValue = sName + " = " + sValue;
		node.pv = sValue;
		return node.pv;
	}
	private label(node: CodeNode) {
		let label = node.value;

		this.iLine = Number(label); // set line before parsing args
		this.resetCountsPerLine(); // we want to have "stable" counts, even if other lines change, e.g. direct

		let value = "",
			bDirect = false;

		if (isNaN(Number(label))) {
			if (label === "direct") { // special handling
				bDirect = true;
				value = "o.goto(\"directEnd\"); break;\n";
			}
			label = '"' + label + '"'; // for "direct"
		}

		if (!this.bNoCodeFrame) {
			value += "case " + label + ":";
		} else {
			value = "";
		}

		const aNodeArgs = this.fnParseArgs(node.args);

		if (this.tron) {
			value += " o.vmTrace(\"" + this.iLine + "\");";
		}
		for (let i = 0; i < aNodeArgs.length; i += 1) {
			let value2 = aNodeArgs[i];

			if (value2 !== "") {
				if (!(/[}:;\n]$/).test(value2)) { // does not end with } : ; \n
					value2 += ";";
				} else if (value2.substr(-1) === "\n") {
					value2 = value2.substr(0, value2.length - 1);
				}
				value += " " + value2;
			}
		}

		if (bDirect && !this.bNoCodeFrame) {
			value += "\n o.goto(\"end\"); break;\ncase \"directEnd\":"; // put in next line because of possible "rem"
		}

		node.pv = value;
		return node.pv;
	}

	// special keyword functions

	private afterGosub(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		this.fnAddReferenceLabel(aNodeArgs[2], node.args[2]); // argument 2 = line number
		node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
		return node.pv;
	}
	private call(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private chain(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private chainMerge(node: CodeNode) {
		this.bMergeFound = true;
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private clear(node: CodeNode) { // will also do e.g. closeout
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private closeout(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private static cont(node: CodeNode) {
		node.pv = "o." + node.type + "(); break;"; // append break
		return node.pv;
	}
	private data(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		aNodeArgs.unshift(String(this.iLine)); // prepend line number
		this.aData.push("o.data(" + aNodeArgs.join(", ") + ")"); // will be set at the beginning of the script
		node.pv = "/* data */";
		return node.pv;
	}
	private def(node: CodeNode) { // somehow special because we need to get plain variables
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}

		const sName = this.fnParseOneArg(node.left);

		this.oDefScopeArgs = {}; // collect DEF scope args
		const aNodeArgs = this.fnParseArgs(node.args);

		this.oDefScopeArgs.bCollectDone = true; // collection done => now use them

		const sExpression = this.fnParseOneArg(node.right);

		this.oDefScopeArgs = undefined;
		this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");

		let sValue: string;

		if (node.pt) {
			if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
				sValue = "o.vmRound(" + sExpression + ")";
				node.pt = "I"; // "R" => "I"
			} else {
				sValue = sExpression;
			}
		} else {
			const sVarType = this.fnDetermineStaticVarType(sName);

			sValue = "o.vmAssign(\"" + sVarType + "\", " + sExpression + ")";
		}
		sValue = sName + " = function (" + aNodeArgs.join(", ") + ") { return " + sValue + "; };";
		node.pv = sValue;
		return node.pv;
	}
	private defint(node: CodeNode) { // somehow special
		node.pv = this.fnParseDefIntRealStr(node);
		return node.pv;
	}
	private defreal(node: CodeNode) { // somehow special
		node.pv = this.fnParseDefIntRealStr(node);
		return node.pv;
	}
	private defstr(node: CodeNode) { // somehow special
		node.pv = this.fnParseDefIntRealStr(node);
		return node.pv;
	}
	private dim(node: CodeNode) {
		const aArgs: string[] = [];

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}

		for (let i = 0; i < node.args.length; i += 1) {
			const oNodeArg = node.args[i];

			if (oNodeArg.type !== "identifier") {
				throw this.composeError(Error(), "Expected identifier in DIM", node.type, node.pos);
			}
			if (!oNodeArg.args) {
				throw this.composeError(Error(), "Programming error: Undefined args", oNodeArg.type, oNodeArg.pos); // should not occure
			}
			const aNodeArgs = this.fnParseArgRange(oNodeArg.args, 1, oNodeArg.args.length - 2), // we skip open and close bracket
				sFullExpression = this.fnParseOneArg(oNodeArg);
			let sName = sFullExpression;

			sName = sName.substr(2); // remove preceding "v."
			const iIndex = sName.indexOf("["); // we should always have it

			sName = sName.substr(0, iIndex);
			aArgs.push("/* " + sFullExpression + " = */ o.dim(\"" + sName + "\", " + aNodeArgs.join(", ") + ")");
		}

		node.pv = aArgs.join("; ");
		return node.pv;
	}
	private "delete"(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sName = Utils.bSupportReservedNames ? "o.delete" : 'o["delete"]';

		if (!aNodeArgs.length) { // no arguments? => complete range
			aNodeArgs.push("1");
			aNodeArgs.push("65535");
		}
		node.pv = sName + "(" + aNodeArgs.join(", ") + "); break;";
		return node.pv;
	}
	private edit(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		node.pv = "o.edit(" + aNodeArgs.join(", ") + "); break;";
		return node.pv;
	}
	private "else"(node: CodeNode) { // similar to a comment, with unchecked tokens
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
		}
		let	sValue = node.type;

		for (let i = 0; i < node.args.length; i += 1) {
			const oToken = node.args[i];

			if (oToken.value) {
				sValue += " " + oToken.value;
			}
		}
		node.pv = "// " + sValue + "\n";
		return node.pv;
	}
	private end(node: CodeNode) {
		const sName = this.iLine + "s" + this.iStopCount; // same as stop, use also stopCount

		this.iStopCount += 1;
		node.pv = "o.end(\"" + sName + "\"); break;\ncase \"" + sName + "\":";
		return node.pv;
	}
	private erase(node: CodeNode) { // somehow special because we need to get plain variables
		const value = this.fnParseErase(node);

		node.pv = value;
		return node.pv;
	}
	private error(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		node.pv = "o.error(" + aNodeArgs[0] + "); break";
		return node.pv;
	}
	private everyGosub(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}

		this.fnAddReferenceLabel(aNodeArgs[2], node.args[2]); // argument 2 = line number
		node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
		return node.pv;
	}
	private fn(node: CodeNode) {
		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
		}

		const aNodeArgs = this.fnParseArgs(node.args),
			sName = this.fnParseOneArg(node.left);

		if (node.left.pt) {
			node.pt = node.left.pt;
		}
		node.pv = sName + "(" + aNodeArgs.join(", ") + ")";
		return node.pv;
	}

	private "for"(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sVarName = aNodeArgs[0],
			sLabel = this.iLine + "f" + this.iForCount;

		this.oStack.forLabel.push(sLabel);
		this.oStack.forVarName.push(sVarName);
		this.iForCount += 1;

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}

		const startNode = node.args[1],
			endNode = node.args[2],
			stepNode = node.args[3];

		let startValue = aNodeArgs[1],
			endValue = aNodeArgs[2],
			stepValue = aNodeArgs[3];

		if (stepNode.type === "null") { // value not available?
			stepValue = "1";
		}

		// optimization for integer constants (check value and not type, because we also want to accept e.g. -<number>):
		const bStartIsIntConst = CodeGeneratorJs.fnIsIntConst(startValue),
			bEndIsIntConst = CodeGeneratorJs.fnIsIntConst(endValue),
			bStepIsIntConst = CodeGeneratorJs.fnIsIntConst(stepValue),
			sVarType = this.fnDetermineStaticVarType(sVarName),
			sType = (sVarType.length > 1) ? sVarType.charAt(1) : "";

		if (sType === "$") {
			throw this.composeError(Error(), "String type in FOR at", node.type, node.pos);
		}

		if (!bStartIsIntConst) {
			if (startNode.pt !== "I") {
				startValue = "o.vmAssign(\"" + sVarType + "\", " + startValue + ")"; // assign checks and rounds, if needed
			}
		}

		let	sEndName: string | undefined;

		if (!bEndIsIntConst) {
			if (endNode.pt !== "I") {
				endValue = "o.vmAssign(\"" + sVarType + "\", " + endValue + ")";
			}
			sEndName = sVarName + "End";
			const value2 = sEndName.substr(2); // remove preceding "v."

			this.fnDeclareVariable(value2); // declare also end variable
		}

		let sStepName: string | undefined;

		if (!bStepIsIntConst) {
			if (stepNode.pt !== "I") {
				stepValue = "o.vmAssign(\"" + sVarType + "\", " + stepValue + ")";
			}
			sStepName = sVarName + "Step";
			const value2 = sStepName.substr(2); // remove preceding "v."

			this.fnDeclareVariable(value2); // declare also step variable
		}

		let value = "/* for() */";

		if (sType !== "I") {
			value += " o.vmAssertNumberType(\"" + sVarType + "\");"; // do a type check: assert number type
		}

		value += " " + sVarName + " = " + startValue + ";";

		if (!bEndIsIntConst) {
			value += " " + sEndName + " = " + endValue + ";";
		}
		if (!bStepIsIntConst) {
			value += " " + sStepName + " = " + stepValue + ";";
		}
		value += " o.goto(\"" + sLabel + "b\"); break;";
		value += "\ncase \"" + sLabel + "\": ";

		value += sVarName + " += " + (bStepIsIntConst ? stepValue : sStepName) + ";";

		value += "\ncase \"" + sLabel + "b\": ";

		const sEndNameOrValue = bEndIsIntConst ? endValue : sEndName;

		if (bStepIsIntConst) {
			if (Number(stepValue) > 0) {
				value += "if (" + sVarName + " > " + sEndNameOrValue + ") { o.goto(\"" + sLabel + "e\"); break; }";
			} else if (Number(stepValue) < 0) {
				value += "if (" + sVarName + " < " + sEndNameOrValue + ") { o.goto(\"" + sLabel + "e\"); break; }";
			} else { // stepValue === 0 => endless loop, if starting with variable < end
				value += "if (" + sVarName + " < " + sEndNameOrValue + ") { o.goto(\"" + sLabel + "e\"); break; }";
			}
		} else {
			value += "if (" + sStepName + " > 0 && " + sVarName + " > " + sEndNameOrValue + " || " + sStepName + " < 0 && " + sVarName + " < " + sEndNameOrValue + ") { o.goto(\"" + sLabel + "e\"); break; }";
		}
		node.pv = value;
		return node.pv;
	}

	private frame(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private gosub(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sLine = aNodeArgs[0],
			sName = this.iLine + "g" + this.iGosubCount;

		this.iGosubCount += 1;
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		this.fnAddReferenceLabel(sLine, node.args[0]);
		node.pv = 'o.gosub("' + sName + '", ' + sLine + '); break; \ncase "' + sName + '":';
		return node.pv;
	}
	private "goto"(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sLine = aNodeArgs[0];

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		this.fnAddReferenceLabel(sLine, node.args[0]);
		node.pv = "o.goto(" + sLine + "); break";
		return node.pv;
	}
	private "if"(node: CodeNode) {
		const sLabel = this.iLine + "i" + this.iIfCount;

		this.iIfCount += 1;

		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
		}
		let value = "if (" + this.fnParseOneArg(node.left) + ') { o.goto("' + sLabel + '"); break; } ';

		if (node.args2) { // "else" statements?
			const aNodeArgs2 = this.fnParseArgs(node.args2),
				sPart2 = aNodeArgs2.join("; ");

			value += "/* else */ " + sPart2 + "; ";
		}
		value += 'o.goto("' + sLabel + 'e"); break;';
		const aNodeArgs = this.fnParseArgs(node.args), // "then" statements
			sPart = aNodeArgs.join("; ");

		value += '\ncase "' + sLabel + '": ' + sPart + ";";
		value += '\ncase "' + sLabel + 'e": ';
		node.pv = value;
		return node.pv;
	}
	private input(node: CodeNode) { // input or lineInput
		const aNodeArgs = this.fnParseArgs(node.args),
			aVarTypes = [];
		let sLabel = this.iLine + "s" + this.iStopCount;

		this.iStopCount += 1;

		if (aNodeArgs.length < 4) {
			throw this.composeError(Error(), "Programming error: Not enough parameters", node.type, node.pos); // should not occure
		}

		const sStream = aNodeArgs[0];
		let sNoCRLF = aNodeArgs[1];

		if (sNoCRLF === ";") { // ; or null
			sNoCRLF = '"' + sNoCRLF + '"';
		}
		let sMsg = aNodeArgs[2];

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		if (node.args[2].type === "null") { // message type
			sMsg = '""';
		}
		const sPrompt = aNodeArgs[3];

		if (sPrompt === ";" || node.args[3].type === "null") { // ";" => insert prompt "? " in quoted string
			sMsg = sMsg.substr(0, sMsg.length - 1) + "? " + sMsg.substr(-1, 1);
		}

		for (let i = 4; i < aNodeArgs.length; i += 1) {
			aVarTypes[i - 4] = this.fnDetermineStaticVarType(aNodeArgs[i]);
		}

		let value = "o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":"; // also before input

		sLabel = this.iLine + "s" + this.iStopCount;
		this.iStopCount += 1;

		value += "o." + node.type + "(" + sStream + ", " + sNoCRLF + ", " + sMsg + ", \"" + aVarTypes.join('", "') + "\"); o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":";
		for (let i = 4; i < aNodeArgs.length; i += 1) {
			value += "; " + aNodeArgs[i] + " = o.vmGetNextInput()";
		}

		node.pv = value;
		return node.pv;
	}
	private let(node: CodeNode) {
		if (!node.right) {
			throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos); // should not occure
		}
		node.pv = this.assign(node.right);
		return node.pv;
	}
	private lineInput(node: CodeNode) {
		return this.input(node); // similar to input but with one arg of type string only
	}
	private list(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args); // or: fnCommandWithGoto

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		if (!node.args.length || node.args[node.args.length - 1].type === "#") { // last parameter stream? or no parameters?
			const sStream = aNodeArgs.pop() || "0";

			aNodeArgs.unshift(sStream); // put it first
		}

		node.pv = "o.list(" + aNodeArgs.join(", ") + "); break;";
		return node.pv;
	}
	private load(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private merge(node: CodeNode) {
		this.bMergeFound = true;
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private mid$Assign(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		if (aNodeArgs.length < 3) {
			aNodeArgs.push("undefined"); // empty length
		}

		if (!node.right) {
			throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure
		}
		const sRight = this.fnParseOneArg(node.right);

		aNodeArgs.push(sRight);

		const sName = aNodeArgs[0],
			sVarType = this.fnDetermineStaticVarType(sName),
			sValue = sName + " = o.vmAssign(\"" + sVarType + "\", o.mid$Assign(" + aNodeArgs.join(", ") + "))";

		node.pv = sValue;
		return node.pv;
	}
	private static "new"(node: CodeNode) {
		const sName = Utils.bSupportReservedNames ? "o.new" : 'o["new"]';

		node.pv = sName + "();";
		return node.pv;
	}
	private next(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		if (!aNodeArgs.length) {
			aNodeArgs.push(""); // we have no variable, so use empty argument
		}
		for (let i = 0; i < aNodeArgs.length; i += 1) {
			const sLabel = this.oStack.forLabel.pop(),
				sVarName = this.oStack.forVarName.pop();

			let oErrorNode: ParserNode;

			if (sLabel === undefined) {
				if (aNodeArgs[i] === "") { // inserted node?
					oErrorNode = node;
				} else { // identifier arg
					oErrorNode = node.args[i];
				}
				throw this.composeError(Error(), "Unexpected NEXT", oErrorNode.type, oErrorNode.pos);
			}
			if (aNodeArgs[i] !== "" && aNodeArgs[i] !== sVarName) {
				oErrorNode = node.args[i];
				throw this.composeError(Error(), "Unexpected NEXT variable", oErrorNode.value, oErrorNode.pos);
			}
			aNodeArgs[i] = "/* next(\"" + aNodeArgs[i] + "\") */ o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "e\":";
		}
		node.pv = aNodeArgs.join("; ");
		return node.pv;
	}
	private onBreakGosub(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sLine = aNodeArgs[0];

		this.fnAddReferenceLabel(sLine, node.args[0]);
		node.pv = "o." + node.type + "(" + sLine + ")";
		return node.pv;
	}
	private onErrorGoto(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sLine = aNodeArgs[0];

		if (Number(sLine)) { // only for lines > 0
			this.fnAddReferenceLabel(sLine, node.args[0]);
		}
		node.pv = "o." + node.type + "(" + sLine + ")";
		return node.pv;
	}
	private onGosub(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sName = node.type,
			sLabel = this.iLine + "g" + this.iGosubCount;

		this.iGosubCount += 1;
		for (let i = 1; i < aNodeArgs.length; i += 1) { // start with argument 1
			this.fnAddReferenceLabel(aNodeArgs[i], node.args[i]);
		}
		aNodeArgs.unshift('"' + sLabel + '"');
		node.pv = "o." + sName + "(" + aNodeArgs.join(", ") + '); break; \ncase "' + sLabel + '":';
		return node.pv;
	}
	private onGoto(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sName = node.type,
			sLabel = this.iLine + "s" + this.iStopCount;

		this.iStopCount += 1;
		for (let i = 1; i < aNodeArgs.length; i += 1) { // start with argument 1
			this.fnAddReferenceLabel(aNodeArgs[i], node.args[i]);
		}
		aNodeArgs.unshift('"' + sLabel + '"');
		node.pv = "o." + sName + "(" + aNodeArgs.join(", ") + "); break\ncase \"" + sLabel + "\":";
		return node.pv;
	}
	private onSqGosub(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		this.fnAddReferenceLabel(aNodeArgs[1], node.args[1]); // argument 1: line number
		node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
		return node.pv;
	}
	private openin(node: CodeNode) {
		return this.fnCommandWithGoto(node);
	}

	private print(node: CodeNode) {
		const aArgs = node.args,
			aNodeArgs = [];
		let	bNewLine = true;

		for (let i = 0; i < aArgs.length; i += 1) {
			const oArg = aArgs[i];
			let sArg = this.fnParseOneArg(oArg);

			if (i === aArgs.length - 1) {
				if (oArg.type === ";" || oArg.type === "," || oArg.type === "spc" || oArg.type === "tab") {
					bNewLine = false;
				}
			}

			if (oArg.type === ",") { // comma tab
				sArg = "{type: \"commaTab\", args: []}"; // we must delay the commaTab() call until print() is called
				aNodeArgs.push(sArg);
			} else if (oArg.type !== ";") { // ignore ";" separators
				aNodeArgs.push(sArg);
			}
		}

		if (bNewLine) {
			const sArg2 = '"\\r\\n"';

			aNodeArgs.push(sArg2);
		}

		node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
		return node.pv;
	}

	private randomize(node: CodeNode) {
		let value: string;

		if (node.args.length) {
			const aNodeArgs = this.fnParseArgs(node.args);

			value = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
		} else {
			const sLabel = this.iLine + "s" + this.iStopCount;

			this.iStopCount += 1;
			value = "o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "\":"; // also before input

			value += this.fnCommandWithGoto(node) + " o.randomize(o.vmGetNextInput())";
		}
		node.pv = value;
		return node.pv;
	}
	private read(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < aNodeArgs.length; i += 1) {
			const sName = aNodeArgs[i],
				sVarType = this.fnDetermineStaticVarType(sName);

			aNodeArgs[i] = sName + " = o.read(\"" + sVarType + "\")";
		}
		node.pv = aNodeArgs.join("; ");
		return node.pv;
	}
	private rem(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let	sValue = aNodeArgs[0];

		if (sValue !== undefined) {
			sValue = " " + sValue.substr(1, sValue.length - 2); // remove surrounding quotes
		} else {
			sValue = "";
		}
		node.pv = "//" + sValue + "\n";
		return node.pv;
	}
	private renum(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private restore(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		if (aNodeArgs.length) {
			this.fnAddReferenceLabel(aNodeArgs[0], node.args[0]); // optional line number
		}
		node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";
		return node.pv;
	}
	private resume(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		if (aNodeArgs.length) {
			this.fnAddReferenceLabel(aNodeArgs[0], node.args[0]); // optional line number
		}
		node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + "); break"; // append break
		return node.pv;
	}
	private static "return"(node: CodeNode) {
		const sName = Utils.bSupportReservedNames ? "o.return" : 'o["return"]';

		node.pv = sName + "(); break;";
		return node.pv;
	}
	private run(node: CodeNode) { // optional arg can be number or string
		if (node.args.length) {
			if (node.args[0].type === "linenumber" || node.args[0].type === "number") { // optional line number, should be linenumber only
				this.fnAddReferenceLabel(this.fnParseOneArg(node.args[0]), node.args[0]); // parse only one arg, args are parsed later
			}
		}

		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private save(node: CodeNode) {
		let aNodeArgs: string[] = [];

		if (node.args.length) {
			const sFileName = this.fnParseOneArg(node.args[0]);

			aNodeArgs.push(sFileName);
			if (node.args.length > 1) {
				this.oDefScopeArgs = {}; // collect DEF scope args
				const sType = '"' + this.fnParseOneArg(node.args[1]) + '"';

				this.oDefScopeArgs = undefined;
				aNodeArgs.push(sType);

				const aNodeArgs2 = node.args.slice(2), // get remaining args
					aNodeArgs3 = this.fnParseArgs(aNodeArgs2);

				aNodeArgs = aNodeArgs.concat(aNodeArgs3);
			}
		}
		node.pv = this.fnCommandWithGoto(node, aNodeArgs);
		return node.pv;
	}
	private sound(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node); // maybe queue is full, so insert break
		return node.pv;
	}
	private spc(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		node.pv = "{type: \"spc\", args: [" + aNodeArgs.join(", ") + "]}"; // we must delay the spc() call until print() is called because we need stream
		return node.pv;
	}
	private stop(node: CodeNode) {
		const sName = this.iLine + "s" + this.iStopCount;

		this.iStopCount += 1;
		node.pv = "o.stop(\"" + sName + "\"); break;\ncase \"" + sName + "\":";
		return node.pv;
	}
	private tab(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		node.pv = "{type: \"tab\", args: [" + aNodeArgs.join(", ") + "]}"; // we must delay the tab() call until print() is called
		return node.pv;
	}
	private wend(node: CodeNode) {
		const sLabel = this.oStack.whileLabel.pop();

		if (sLabel === undefined) {
			throw this.composeError(Error(), "Unexpected WEND", node.type, node.pos);
		}
		node.pv = "/* o.wend() */ o.goto(\"" + sLabel + "\"); break;\ncase \"" + sLabel + "e\":";
		return node.pv;
	}
	private "while"(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sLabel = this.iLine + "w" + this.iWhileCount;

		this.oStack.whileLabel.push(sLabel);
		this.iWhileCount += 1;
		node.pv = "\ncase \"" + sLabel + "\": if (!(" + aNodeArgs + ")) { o.goto(\"" + sLabel + "e\"); break; }";
		return node.pv;
	}

	/* eslint-disable no-invalid-this */
	mParseFunctions: { [k in string]: (node: CodeNode) => string } = { // to call methods, use mParseFunctions[].call(this,...)
		";": CodeGeneratorJs.semicolon,
		",": CodeGeneratorJs.comma,
		"|": this.vertical,
		number: CodeGeneratorJs.number,
		binnumber: CodeGeneratorJs.binnumber,
		hexnumber: CodeGeneratorJs.hexnumber,
		linenumber: CodeGeneratorJs.linenumber,
		identifier: this.identifier,
		letter: CodeGeneratorJs.letter,
		range: this.range,
		linerange: this.linerange,
		string: CodeGeneratorJs.string,
		unquoted: CodeGeneratorJs.unquoted,
		"null": CodeGeneratorJs.fnNull,
		assign: this.assign,
		label: this.label,
		// special keyword functions
		afterGosub: this.afterGosub,
		call: this.call,
		chain: this.chain,
		chainMerge: this.chainMerge,
		clear: this.clear,
		closeout: this.closeout,
		cont: CodeGeneratorJs.cont,
		data: this.data,
		def: this.def,
		defint: this.defint,
		defreal: this.defreal,
		defstr: this.defstr,
		dim: this.dim,
		"delete": this.delete,
		edit: this.edit,
		"else": this.else,
		end: this.end,
		erase: this.erase,
		error: this.error,
		everyGosub: this.everyGosub,
		fn: this.fn,
		"for": this.for,
		frame: this.frame,
		gosub: this.gosub,
		"goto": this.goto,
		"if": this.if,
		input: this.input,
		let: this.let,
		lineInput: this.lineInput,
		list: this.list,
		load: this.load,
		merge: this.merge,
		mid$Assign: this.mid$Assign,
		"new": CodeGeneratorJs.new,
		next: this.next,
		onBreakGosub: this.onBreakGosub,
		onErrorGoto: this.onErrorGoto,
		onGosub: this.onGosub,
		onGoto: this.onGoto,
		onSqGosub: this.onSqGosub,
		openin: this.openin,
		print: this.print,
		randomize: this.randomize,
		read: this.read,
		rem: this.rem,
		renum: this.renum,
		restore: this.restore,
		resume: this.resume,
		"return": CodeGeneratorJs.return,
		run: this.run,
		save: this.save,
		sound: this.sound,
		spc: this.spc,
		stop: this.stop,
		tab: this.tab,
		wend: this.wend,
		"while": this.while
	}
	/* eslint-enable no-invalid-this */


	private fnParseOther(node: CodeNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sTypeWithSpaces = " " + node.type + " ";

		node.pv = "o." + node.type + "(" + aNodeArgs.join(", ") + ")";

		if (CodeGeneratorJs.fnIsInString(" asc cint derr eof erl err fix fre inkey inp instr int joy len memory peek pos remain sgn sq test testr unt vpos xpos ypos ", sTypeWithSpaces)) {
			node.pt = "I";
		} else if (CodeGeneratorJs.fnIsInString(" abs atn cos creal exp log log10 max min pi rnd round sin sqr tan time val ", sTypeWithSpaces)) {
			node.pt = "R";
		} else if (CodeGeneratorJs.fnIsInString(" bin$ chr$ copychr$ dec$ hex$ inkey$ left$ lower$ mid$ right$ space$ str$ string$ upper$ ", sTypeWithSpaces)) {
			node.pt = "$";
		}

		return node.pv;
	}


	private parseNode(node: CodeNode) {
		if (Utils.debug > 3) {
			Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
		}

		const mOperators = this.mOperators;

		let value: string;

		if (mOperators[node.type]) {
			if (node.left) {
				value = this.parseNode(node.left);
				if (mOperators[node.left.type] && node.left.left) { // binary operator?
					value = "(" + value + ")";
					node.left.pv = value;
				}

				if (!node.right) {
					throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure
				}
				let value2 = this.parseNode(node.right);

				if (mOperators[node.right.type] && node.right.left) { // binary operator?
					value2 = "(" + value2 + ")";
					node.right.pv = value2;
				}
				value = mOperators[node.type].call(this, node, node.left, node.right);
			} else {
				if (!node.right) {
					throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure
				}
				value = this.parseNode(node.right);
				value = mOperators[node.type].call(this, node, node.left! as CodeNode, node.right); // unary operator: we just use node.right
			}
		} else if (this.mParseFunctions[node.type]) { // function with special handling?
			value = this.mParseFunctions[node.type].call(this, node);
		} else { // for other functions, generate code directly
			value = this.fnParseOther(node);
		}

		return value;
	}

	private static fnCommentUnusedCases(sOutput2: string, oLabels: LabelsType) {
		sOutput2 = sOutput2.replace(/^case (\d+):/gm, function (sAll: string, sLine: string) {
			return (oLabels[sLine]) ? sAll : "/* " + sAll + " */";
		});
		return sOutput2;
	}

	private fnCreateLabelsMap(parseTree: ParserNode[], oLabels: LabelsType) {
		let iLastLine = -1;

		for (let i = 0; i < parseTree.length; i += 1) {
			const oNode = parseTree[i];

			if (oNode.type === "label") {
				const sLine = oNode.value;

				if (sLine in oLabels) {
					throw this.composeError(Error(), "Duplicate line number", sLine, oNode.pos);
				}
				const iLine = Number(sLine);

				if (!isNaN(iLine)) { // not for "direct"
					if (iLine <= iLastLine) {
						throw this.composeError(Error(), "Line number not increasing", sLine, oNode.pos);
					}
					if (iLine < 1 || iLine > 65535) {
						throw this.composeError(Error(), "Line number overflow", sLine, oNode.pos);
					}
					iLastLine = iLine;
				}
				oLabels[sLine] = 0; // init call count
			}
		}
	}

	//
	// evaluate
	//
	private evaluate(parseTree: ParserNode[], oVariables: Variables) {
		this.oVariables = oVariables;

		this.oDefScopeArgs = undefined;

		// create labels map
		this.fnCreateLabelsMap(parseTree, this.oLabels);

		let sOutput = "";

		for (let i = 0; i < parseTree.length; i += 1) {
			if (Utils.debug > 2) {
				Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
			}
			const sNode = this.fnParseOneArg(parseTree[i]);

			if ((sNode !== undefined) && (sNode !== "")) {
				if (sNode !== null) {
					if (sOutput.length === 0) {
						sOutput = sNode;
					} else {
						sOutput += "\n" + sNode;
					}
				} else {
					sOutput = ""; // cls (clear output when sNode is set to null)
				}
			}
		}

		// optimize: comment lines which are not referenced
		if (!this.bMergeFound) {
			sOutput = CodeGeneratorJs.fnCommentUnusedCases(sOutput, this.oLabels);
		}
		return sOutput;
	}

	private static combineData(aData: string[]) {
		let sData = "";

		sData = aData.join(";\n");
		if (sData.length) {
			sData += ";\n";
		}
		return sData;
	}

	debugGetLabelsCount(): number {
		return Object.keys(this.oLabels).length;
	}

	generate(sInput: string, oVariables: Variables, bAllowDirect?: boolean): IOutput {
		const oOut: IOutput = {
			text: ""
		};

		this.reset();
		try {
			const aTokens = this.lexer.lex(sInput),
				aParseTree = this.parser.parse(aTokens, bAllowDirect);
			let	sOutput = this.evaluate(aParseTree, oVariables);

			if (!this.bNoCodeFrame) {
				sOutput = '"use strict"\n'
					+ "var v=o.vmGetAllVariables();\n"
					+ "while (o.vmLoopCondition()) {\nswitch (o.iLine) {\ncase 0:\n"
					+ CodeGeneratorJs.combineData(this.aData)
					+ " o.goto(o.iStartLine ? o.iStartLine : \"start\"); break;\ncase \"start\":\n"
					+ sOutput
					+ "\ncase \"end\": o.vmStop(\"end\", 90); break;\ndefault: o.error(8); o.goto(\"end\"); break;\n}}\n";
			} else {
				sOutput = CodeGeneratorJs.combineData(this.aData) + sOutput;
			}
			oOut.text = sOutput;
		} catch (e) {
			oOut.error = e;
			if ("pos" in e) {
				Utils.console.warn(e); // our errors have "pos" defined => show as warning
			} else { // other errors
				Utils.console.error(e);
			}
		}
		return oOut;
	}
}
