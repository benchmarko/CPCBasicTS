// CodeGeneratorJs.ts - Code Generator for JavaScript
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils, CustomError } from "./Utils";
import { IOutput, ICpcVmRsx } from "./Interfaces";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser";
import { Variables } from "./Variables";

interface CodeGeneratorJsOptions {
	lexer: BasicLexer
	parser: BasicParser
	rsx: ICpcVmRsx
	tron: boolean
	quiet?: boolean
	noCodeFrame?: boolean
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
	private quiet: boolean;
	private noCodeFrame: boolean

	private line = 0; // current line (label)
	private reJsKeywords: RegExp;

	private stack = {
		forLabel: [] as StringArray,
		forVarName: [] as StringArray,
		whileLabel: [] as StringArray
	};

	private dataList: StringArray = []; // collected data from data lines

	private labels: LabelsType = {}; // labels or line numbers

	private mergeFound = false; // if we find chain or chain merge, the program is not complete and we cannot check for existing line numbers during compile time (or do a renumber)

	private gosubCount = 0;
	private ifCount = 0;
	private stopCount = 0;
	private forCount = 0; // stack needed
	private whileCount = 0; // stack needed

	// for evaluate:
	private variables: Variables = {} as Variables; // will be set later
	private defScopeArgs?: { [k: string]: boolean };

	constructor(options: CodeGeneratorJsOptions) {
		this.lexer = options.lexer;
		this.parser = options.parser;
		this.tron = options.tron;
		this.rsx = options.rsx;
		this.quiet = options.quiet || false;
		this.noCodeFrame = options.noCodeFrame || false;

		this.reJsKeywords = CodeGeneratorJs.createJsKeywordRegex();
	}

	// ECMA 3 JS Keywords which must be avoided in dot notation for properties when using IE8
	private static jsKeywords = [
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
		const stack = this.stack;

		stack.forLabel.length = 0;
		stack.forVarName.length = 0;
		stack.whileLabel.length = 0;

		this.line = 0; // current line (label)

		this.resetCountsPerLine();

		this.dataList.length = 0;

		this.labels = {}; // labels or line numbers
		this.mergeFound = false; // if we find chain or chain merge, the program is not complete and we cannot check for existing line numbers during compile time (or do a renumber)
	}

	private resetCountsPerLine() {
		this.gosubCount = 0;
		this.ifCount = 0;
		this.stopCount = 0;
		this.forCount = 0; // stack needed
		this.whileCount = 0; // stack needed
	}

	private composeError(error: Error, message: string, value: string, pos: number) {
		return Utils.composeError("CodeGeneratorJs", error, message, value, pos, undefined, this.line);
	}

	private static createJsKeywordRegex() {
		return new RegExp("^(" + CodeGeneratorJs.jsKeywords.join("|") + ")$");
	}


	private fnDeclareVariable(name: string) {
		if (!this.variables.variableExist(name)) { // variable not yet defined?
			this.variables.initVariable(name);
		}
	}

	private fnAdaptVariableName(name: string, arrayIndices: number) {
		const defScopeArgs = this.defScopeArgs;

		name = name.toLowerCase();
		name = name.replace(/\./g, "_");

		if (defScopeArgs || !Utils.supportReservedNames) { // avoid keywords as def fn parameters; and for IE8 avoid keywords in dot notation
			if (this.reJsKeywords.test(name)) { // IE8: avoid keywords in dot notation
				name = "_" + name; // prepend underscore
			}
		}

		if (name.endsWith("!")) { // real number?
			name = name.slice(0, -1) + "R"; // "!" => "R"
		} else if (name.endsWith("%")) { // integer number?
			name = name.slice(0, -1) + "I";
		}
		if (arrayIndices) {
			name += "A".repeat(arrayIndices);
		}
		if (defScopeArgs) {
			if (name === "o") { // we must not use format parameter "o" since this is our vm object
				name = "no"; // change variable name to something we cannot set in BASIC
			}
			if (!defScopeArgs.collectDone) { // in collection mode?
				defScopeArgs[name] = true; // declare DEF scope variable
			} else if (!(name in defScopeArgs)) {
				// variable
				this.fnDeclareVariable(name);
				name = "v." + name; // access with "v."
			}
		} else {
			this.fnDeclareVariable(name);
			name = "v." + name; // access with "v."
		}
		return name;
	}

	private fnParseOneArg(arg: ParserNode) {
		return this.parseNode(arg as CodeNode); // eslint-disable-line no-use-before-define
	}

	private fnParseArgRange(args: ParserNode[], start: number, stop: number) {
		const nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)

		for (let i = start; i <= stop; i += 1) {
			nodeArgs.push(this.fnParseOneArg(args[i]));
		}
		return nodeArgs;
	}

	private fnParseArgs(args: ParserNode[] | undefined) {
		const nodeArgs: string[] = []; // do not modify node.args here (could be a parameter of defined function)

		if (!args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
		}

		for (let i = 0; i < args.length; i += 1) {
			nodeArgs[i] = this.fnParseOneArg(args[i]);
		}
		return nodeArgs;
	}

	private fnDetermineStaticVarType(name: string) {
		return this.variables.determineStaticVarType(name);
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

	private static fnIsInString(string: string, find: string) {
		return find && string.indexOf(find) >= 0;
	}

	private fnPropagateStaticTypes(node: CodeNode, left: CodeNode, right: CodeNode, types: string) {
		if (left.pt && right.pt) {
			if (CodeGeneratorJs.fnIsInString(types, left.pt + right.pt)) {
				node.pt = left.pt === right.pt ? left.pt : "R";
			} else {
				throw this.composeError(Error(), "Type error", node.value, node.pos);
			}
		} else if (left.pt && !CodeGeneratorJs.fnIsInString(types, left.pt) || right.pt && !CodeGeneratorJs.fnIsInString(types, right.pt)) {
			throw this.composeError(Error(), "Type error", node.value, node.pos);
		}
	}

	// operators

	private plus(node: CodeNode, left: CodeNode, right: CodeNode) { // "+" (binary or unary)
		if (left === undefined) { // unary plus? => skip it
			node.pv = right.pv;
			const type = right.pt;

			if (CodeGeneratorJs.fnIsInString("IR$", type)) { // I, R or $?
				node.pt = type;
			} else if (type) {
				throw this.composeError(Error(), "Type error", node.value, node.pos);
			}
		} else {
			node.pv = left.pv + " + " + right.pv;
			this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
		}
		return node.pv;
	}

	private minus(node: CodeNode, left: CodeNode, right: CodeNode) { // "-" (binary or unary)
		if (left === undefined) { // unary minus?
			const value = right.pv,
				type = right.pt;

			// when optimizing, beware of "--" operator in JavaScript!
			if (CodeGeneratorJs.fnIsIntConst(value) || right.type === "number") { // int const or number const (also fp)
				if (value.charAt(0) === "-") { // starting already with "-"?
					node.pv = value.substr(1); // remove "-"
				} else {
					node.pv = "-" + value;
				}
			} else {
				node.pv = "-(" + value + ")"; // can be an expression
			}

			if (CodeGeneratorJs.fnIsInString("IR", type)) { // I or R?
				node.pt = type;
			} else if (type) {
				throw this.composeError(Error(), "Type error", node.value, node.pos);
			}
		} else {
			node.pv = left.pv + " - " + right.pv;
			this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
		}
		return node.pv;
	}

	private mult(node: CodeNode, left: CodeNode, right: CodeNode) { // "*"
		node.pv = left.pv + " * " + right.pv;
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
		return node.pv;
	}

	private div(node: CodeNode, left: CodeNode, right: CodeNode) { // "/"
		node.pv = left.pv + " / " + right.pv;
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
		node.pt = "R"; // event II can get a fraction
		return node.pv;
	}

	private intDiv(node: CodeNode, left: CodeNode, right: CodeNode) { // "\\"
		node.pv = "(" + left.pv + " / " + right.pv + ") | 0"; // integer division
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private exponent(node: CodeNode, left: CodeNode, right: CodeNode) { // "^"
		node.pv = "Math.pow(" + left.pv + ", " + right.pv + ")";
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
		return node.pv;
	}

	private and(node: CodeNode, left: CodeNode, right: CodeNode) {
		node.pv = CodeGeneratorJs.fnGetRoundString(left) + " & " + CodeGeneratorJs.fnGetRoundString(right);
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private or(node: CodeNode, left: CodeNode, right: CodeNode) {
		node.pv = CodeGeneratorJs.fnGetRoundString(left) + " | " + CodeGeneratorJs.fnGetRoundString(right);
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private xor(node: CodeNode, left: CodeNode, right: CodeNode) {
		node.pv = CodeGeneratorJs.fnGetRoundString(left) + " ^ " + CodeGeneratorJs.fnGetRoundString(right);
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private static not(node: CodeNode, _oLeft: CodeNode, right: CodeNode) { // (unary operator)
		node.pv = "~(" + CodeGeneratorJs.fnGetRoundString(right) + ")"; // a can be an expression
		node.pt = "I";
		return node.pv;
	}

	private mod(node: CodeNode, left: CodeNode, right: CodeNode) {
		node.pv = CodeGeneratorJs.fnGetRoundString(left) + " % " + CodeGeneratorJs.fnGetRoundString(right);
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
		node.pt = "I";
		return node.pv;
	}

	private greater(node: CodeNode, left: CodeNode, right: CodeNode) { // ">"
		node.pv = left.pv + " > " + right.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private less(node: CodeNode, left: CodeNode, right: CodeNode) { // "<"
		node.pv = left.pv + " < " + right.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private greaterEqual(node: CodeNode, left: CodeNode, right: CodeNode) { // ">="
		node.pv = left.pv + " >= " + right.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private lessEqual(node: CodeNode, left: CodeNode, right: CodeNode) { // "<="
		node.pv = left.pv + " <= " + right.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private equal(node: CodeNode, left: CodeNode, right: CodeNode) { // "="
		node.pv = left.pv + " === " + right.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private notEqual(node: CodeNode, left: CodeNode, right: CodeNode) { // "<>"
		node.pv = left.pv + " !== " + right.pv + " ? -1 : 0";
		this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
		node.pt = "I";
		return node.pv;
	}

	private addressOf(node: CodeNode, _oLeft: CodeNode, right: CodeNode) { // "@" (unary operator)
		node.pv = 'o.addressOf("' + right.pv + '")'; // address of
		if (right.type !== "identifier") {
			throw this.composeError(Error(), "Expected variable", node.value, node.pos);
		}
		node.pt = "I";
		return node.pv;
	}

	private static stream(node: CodeNode, _oLeft: CodeNode, right: CodeNode) { // (unary operator)
		// "#" stream as prefix operator
		node.pv = right.pv;
		node.pt = "I";
		return node.pv;
	}


	/* eslint-disable no-invalid-this */
	private operators: { [k in string]: (node: CodeNode, left: CodeNode, right: CodeNode) => string } = { // to call methods, use operators[].call(this,...)
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
		const nodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < nodeArgs.length; i += 1) {
			const arg = nodeArgs[i];

			nodeArgs[i] = "o." + node.type + '("' + arg + '")';
		}
		node.pv = nodeArgs.join("; ");
		return node.pv;
	}

	private fnParseErase(node: CodeNode) {
		this.defScopeArgs = {}; // collect DEF scope args
		const nodeArgs = this.fnParseArgs(node.args);

		this.defScopeArgs = undefined;

		for (let i = 0; i < nodeArgs.length; i += 1) {
			nodeArgs[i] = '"' + nodeArgs[i] + '"'; // put in quotes
		}
		node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
		return node.pv;
	}

	private fnAddReferenceLabel(label: string, node: ParserNode) {
		if (label in this.labels) {
			this.labels[label] += 1;
		} else {
			if (Utils.debug > 1) {
				Utils.console.debug("fnAddReferenceLabel: line does not (yet) exist:", label);
			}
			if (!this.mergeFound) {
				throw this.composeError(Error(), "Line does not exist", label, node.pos);
			}
		}
	}

	private fnCommandWithGoto(node: CodeNode, nodeArgs?: string[]) { // optional nodeArgs
		nodeArgs = nodeArgs || this.fnParseArgs(node.args);
		const command = node.type,
			label = this.line + "s" + this.stopCount; // we use stopCount

		this.stopCount += 1;
		node.pv = "o." + command + "(" + nodeArgs.join(", ") + "); o.goto(\"" + label + "\"); break;\ncase \"" + label + "\":";
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
		let rsxName = node.value.substr(1).toLowerCase().replace(/\./g, "_");
		const rsxAvailable = this.rsx && this.rsx.rsxIsAvailable(rsxName),
			nodeArgs = this.fnParseArgs(node.args),
			label = this.line + "s" + this.stopCount; // we use stopCount

		this.stopCount += 1;

		if (!rsxAvailable) { // if RSX not available, we delay the error until it is executed (or catched by on error goto)
			if (!this.quiet) {
				const error = this.composeError(Error(), "Unknown RSX command", node.value, node.pos);

				Utils.console.warn(error);
			}
			nodeArgs.unshift('"' + rsxName + '"'); // put as first arg
			rsxName = "rsxExec"; // and call special handler which triggers error if not available
		}

		node.pv = "o.rsx." + rsxName + "(" + nodeArgs.join(", ") + "); o.goto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // most RSX commands need goto (era, ren,...)
		return node.pv;
	}
	private static number(node: CodeNode) {
		node.pt = (/^[0-9]+$/).test(node.value) ? "I" : "R";
		node.pv = node.value; // keep string
		return node.pv;
	}
	private static binnumber(node: CodeNode) {
		let value = node.value.slice(2); // remove &x

		if (Utils.supportsBinaryLiterals) {
			value = "0b" + ((value.length) ? value : "0"); // &x->0b; 0b is ES6
		} else {
			value = "0x" + ((value.length) ? parseInt(value, 2).toString(16) : "0"); // we convert it to hex
		}
		node.pt = "I";
		node.pv = value;
		return node.pv;
	}
	private static hexnumber(node: CodeNode) {
		let value = node.value.slice(1); // remove &

		if (value.charAt(0).toLowerCase() === "h") { // optional h
			value = value.slice(1); // remove
		}

		value = "0x" + ((value.length) ? value : "0"); // &->0x
		node.pt = "I";
		node.pv = value;
		return node.pv;
	}
	private static linenumber(node: CodeNode) {
		node.pv = node.value;
		return node.pv;
	}
	private identifier(node: CodeNode) { // identifier or identifier with array
		const nodeArgs = node.args ? this.fnParseArgRange(node.args, 1, node.args.length - 2) : [], // array: we skip open and close bracket
			name = this.fnAdaptVariableName(node.value, nodeArgs.length), // here we use node.value
			value = name + nodeArgs.map(function (val) {
				return "[" + val + "]";
			}).join("");

		let varType = this.fnDetermineStaticVarType(name);

		if (varType.length > 1) {
			varType = varType.charAt(1);
			node.pt = varType;
		}
		node.pv = value;
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
		const left = this.fnParseOneArg(node.left),
			right = this.fnParseOneArg(node.right);

		if (left > right) {
			throw this.composeError(Error(), "Decreasing range", node.value, node.pos);
		}
		node.pv = left + " - " + right;
		return node.pv;
	}
	private linerange(node: CodeNode) { // for delete, list
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}
		const left = this.fnParseOneArg(node.left),
			right = this.fnParseOneArg(node.right),
			leftNumber = Number(left), // "undefined" gets NaN (should we check node.left.type for null?)
			rightNumber = Number(right);

		if (leftNumber > rightNumber) { // comparison with NaN and number is always false
			throw this.composeError(Error(), "Decreasing line range", node.value, node.pos);
		}

		const rightSpecified = (right === "undefined") ? "65535" : right; // make sure we set a missing right range parameter

		node.pv = !right ? left : left + ", " + rightSpecified;
		return node.pv;
	}

	private static string(node: CodeNode) {
		let value = node.value;

		value = value.replace(/\\/g, "\\\\"); // escape backslashes
		value = Utils.hexEscape(value);

		node.pt = "$";
		node.pv = '"' + value + '"';
		return node.pv;
	}
	private static unquoted(node: CodeNode) { // comment or data line item, which can be interpreted as string or number
		node.pt = "$";
		node.pv = node.value;
		return node.pv;
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
		let name: string;

		if (node.left.type === "identifier") {
			name = this.fnParseOneArg(node.left);
		} else {
			throw this.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
		}

		const assingValue = this.fnParseOneArg(node.right);

		this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
		const varType = this.fnDetermineStaticVarType(name);

		let value: string;

		if (node.pt) {
			if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
				value = "o.vmRound(" + assingValue + ")";
				node.pt = "I"; // "R" => "I"
			} else {
				value = assingValue;
			}
		} else {
			value = "o.vmAssign(\"" + varType + "\", " + assingValue + ")";
		}
		value = name + " = " + value;
		node.pv = value;
		return node.pv;
	}
	private label(node: CodeNode) {
		let label = node.value;

		this.line = Number(label); // set line before parsing args
		this.resetCountsPerLine(); // we want to have "stable" counts, even if other lines change, e.g. direct

		let value = "",
			direct = false;

		if (isNaN(Number(label))) {
			if (label === "direct") { // special handling
				direct = true;
				value = "o.goto(\"directEnd\"); break;\n";
			}
			label = '"' + label + '"'; // for "direct"
		}

		if (!this.noCodeFrame) {
			value += "case " + label + ":";
		} else {
			value = "";
		}

		const nodeArgs = this.fnParseArgs(node.args);

		if (this.tron) {
			value += " o.vmTrace(\"" + this.line + "\");";
		}
		for (let i = 0; i < nodeArgs.length; i += 1) {
			let value2 = nodeArgs[i];

			if (value2 !== "") {
				if (!(/[}:;\n]$/).test(value2)) { // does not end with } : ; \n
					value2 += ";";
				} else if (value2.substr(-1) === "\n") {
					value2 = value2.substr(0, value2.length - 1);
				}
				value += " " + value2;
			}
		}

		if (direct && !this.noCodeFrame) {
			value += "\n o.goto(\"end\"); break;\ncase \"directEnd\":"; // put in next line because of possible "rem"
		}

		node.pv = value;
		return node.pv;
	}

	// special keyword functions

	private afterGosub(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		this.fnAddReferenceLabel(nodeArgs[2], node.args[2]); // argument 2 = line number
		node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
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
		this.mergeFound = true;
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
		const nodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < node.args.length; i += 1) {
			if (node.args[i].type === "unquoted") {
				nodeArgs[i] = '"' + nodeArgs[i].replace(/"/g, "\\\"") + '"'; // escape quotes, put in quotes
			}
		}

		nodeArgs.unshift(String(this.line)); // prepend line number
		this.dataList.push("o.data(" + nodeArgs.join(", ") + ")"); // will be set at the beginning of the script
		node.pv = "/* data */";
		return node.pv;
	}
	private def(node: CodeNode) { // somehow special because we need to get plain variables
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}

		const name = this.fnParseOneArg(node.left);

		this.defScopeArgs = {}; // collect DEF scope args
		const nodeArgs = this.fnParseArgs(node.args);

		this.defScopeArgs.collectDone = true; // collection done => now use them

		const expression = this.fnParseOneArg(node.right);

		this.defScopeArgs = undefined;
		this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");

		let value: string;

		if (node.pt) {
			if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
				value = "o.vmRound(" + expression + ")";
				node.pt = "I"; // "R" => "I"
			} else {
				value = expression;
			}
		} else {
			const varType = this.fnDetermineStaticVarType(name);

			value = "o.vmAssign(\"" + varType + "\", " + expression + ")";
		}
		value = name + " = function (" + nodeArgs.join(", ") + ") { return " + value + "; };";
		node.pv = value;
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
		const args: string[] = [];

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}

		for (let i = 0; i < node.args.length; i += 1) {
			const nodeArg = node.args[i];

			if (nodeArg.type !== "identifier") {
				throw this.composeError(Error(), "Expected variable in DIM", node.type, node.pos);
			}
			if (!nodeArg.args) {
				throw this.composeError(Error(), "Programming error: Undefined args", nodeArg.type, nodeArg.pos); // should not occure
			}
			const nodeArgs = this.fnParseArgRange(nodeArg.args, 1, nodeArg.args.length - 2), // we skip open and close bracket
				fullExpression = this.fnParseOneArg(nodeArg);
			let name = fullExpression;

			name = name.substr(2); // remove preceding "v."
			const index = name.indexOf("["); // we should always have it

			name = name.substr(0, index);
			args.push("/* " + fullExpression + " = */ o.dim(\"" + name + "\", " + nodeArgs.join(", ") + ")");
		}

		node.pv = args.join("; ");
		return node.pv;
	}
	private "delete"(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			name = Utils.supportReservedNames ? "o.delete" : 'o["delete"]';

		if (!nodeArgs.length) { // no arguments? => complete range
			nodeArgs.push("1");
			nodeArgs.push("65535");
		}
		node.pv = name + "(" + nodeArgs.join(", ") + "); break;";
		return node.pv;
	}
	private edit(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		node.pv = "o.edit(" + nodeArgs.join(", ") + "); break;";
		return node.pv;
	}
	private "else"(node: CodeNode) { // similar to a comment, with unchecked tokens
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
		}
		let	value = node.type;

		for (let i = 0; i < node.args.length; i += 1) {
			const token = node.args[i];

			if (token.value) {
				value += " " + token.value;
			}
		}
		node.pv = "// " + value + "\n";
		return node.pv;
	}
	private end(node: CodeNode) {
		const name = this.line + "s" + this.stopCount; // same as stop, use also stopCount

		this.stopCount += 1;
		node.pv = "o.end(\"" + name + "\"); break;\ncase \"" + name + "\":";
		return node.pv;
	}
	private erase(node: CodeNode) { // somehow special because we need to get plain variables
		const value = this.fnParseErase(node);

		node.pv = value;
		return node.pv;
	}
	private error(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		node.pv = "o.error(" + nodeArgs[0] + "); break";
		return node.pv;
	}
	private everyGosub(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}

		this.fnAddReferenceLabel(nodeArgs[2], node.args[2]); // argument 2 = line number
		node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
		return node.pv;
	}
	private fn(node: CodeNode) {
		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
		}

		const nodeArgs = this.fnParseArgs(node.args),
			name = this.fnParseOneArg(node.left);

		if (node.left.pt) {
			node.pt = node.left.pt;
		}
		node.pv = name + "(" + nodeArgs.join(", ") + ")";
		return node.pv;
	}

	private "for"(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			varName = nodeArgs[0],
			label = this.line + "f" + this.forCount;

		this.stack.forLabel.push(label);
		this.stack.forVarName.push(varName);
		this.forCount += 1;

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}

		const startNode = node.args[1],
			endNode = node.args[2],
			stepNode = node.args[3]; // optional

		let startValue = nodeArgs[1],
			endValue = nodeArgs[2],
			stepValue = stepNode ? nodeArgs[3] : "1"; // default step

		// optimization for integer constants (check value and not type, because we also want to accept e.g. -<number>):
		const startIsIntConst = CodeGeneratorJs.fnIsIntConst(startValue),
			endIsIntConst = CodeGeneratorJs.fnIsIntConst(endValue),
			stepIsIntConst = CodeGeneratorJs.fnIsIntConst(stepValue),
			varType = this.fnDetermineStaticVarType(varName),
			type = (varType.length > 1) ? varType.charAt(1) : "";

		if (type === "$") {
			throw this.composeError(Error(), "String type in FOR at", node.type, node.pos);
		}

		if (!startIsIntConst) {
			if (startNode.pt !== "I") {
				startValue = "o.vmAssign(\"" + varType + "\", " + startValue + ")"; // assign checks and rounds, if needed
			}
		}

		let	endName: string | undefined;

		if (!endIsIntConst) {
			if (endNode.pt !== "I") {
				endValue = "o.vmAssign(\"" + varType + "\", " + endValue + ")";
			}
			endName = varName + "End";
			const value2 = endName.substr(2); // remove preceding "v."

			this.fnDeclareVariable(value2); // declare also end variable
		}

		let stepName: string | undefined;

		if (!stepIsIntConst) {
			if (stepNode && stepNode.pt !== "I") {
				stepValue = "o.vmAssign(\"" + varType + "\", " + stepValue + ")";
			}
			stepName = varName + "Step";
			const value2 = stepName.substr(2); // remove preceding "v."

			this.fnDeclareVariable(value2); // declare also step variable
		}

		let value = "/* for() */";

		if (type !== "I") {
			value += " o.vmAssertNumberType(\"" + varType + "\");"; // do a type check: assert number type
		}

		value += " " + varName + " = " + startValue + ";";

		if (!endIsIntConst) {
			value += " " + endName + " = " + endValue + ";";
		}
		if (!stepIsIntConst) {
			value += " " + stepName + " = " + stepValue + ";";
		}
		value += " o.goto(\"" + label + "b\"); break;";
		value += "\ncase \"" + label + "\": ";

		value += varName + " += " + (stepIsIntConst ? stepValue : stepName) + ";";

		value += "\ncase \"" + label + "b\": ";

		const endNameOrValue = endIsIntConst ? endValue : endName;

		if (stepIsIntConst) {
			if (Number(stepValue) > 0) {
				value += "if (" + varName + " > " + endNameOrValue + ") { o.goto(\"" + label + "e\"); break; }";
			} else if (Number(stepValue) < 0) {
				value += "if (" + varName + " < " + endNameOrValue + ") { o.goto(\"" + label + "e\"); break; }";
			} else { // stepValue === 0 => endless loop, if starting with variable < end
				value += "if (" + varName + " < " + endNameOrValue + ") { o.goto(\"" + label + "e\"); break; }";
			}
		} else {
			value += "if (" + stepName + " > 0 && " + varName + " > " + endNameOrValue + " || " + stepName + " < 0 && " + varName + " < " + endNameOrValue + ") { o.goto(\"" + label + "e\"); break; }";
		}
		node.pv = value;
		return node.pv;
	}

	private frame(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private gosub(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			line = nodeArgs[0],
			name = this.line + "g" + this.gosubCount;

		this.gosubCount += 1;
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		this.fnAddReferenceLabel(line, node.args[0]);
		node.pv = 'o.gosub("' + name + '", ' + line + '); break; \ncase "' + name + '":';
		return node.pv;
	}

	private "goto"(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			line = nodeArgs[0];

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		this.fnAddReferenceLabel(line, node.args[0]);
		node.pv = "o.goto(" + line + "); break";
		return node.pv;
	}

	private fnThenOrElsePart(args: ParserNode[]) {
		const nodeArgs = this.fnParseArgs(args);

		if (args[0].type === "linenumber") {
			const line = nodeArgs[0];

			this.fnAddReferenceLabel(line, args[0]);
			nodeArgs[0] = "o.goto(" + line + "); break"; // convert to "goto"
		}
		return nodeArgs.join("; ");
	}

	private static fnIsSimplePart(part: string) {
		const partNoTrailingBreak = part.replace(/; break$/, ""),
			simplePart = !(/case|break/).test(partNoTrailingBreak);

		return simplePart;
	}

	private "if"(node: CodeNode) {
		const label = this.line + "i" + this.ifCount;

		this.ifCount += 1;

		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
		}
		let expression = this.fnParseOneArg(node.left);

		if (expression.endsWith(" ? -1 : 0")) { // optimize simple expression
			expression = expression.replace(/ \? -1 : 0$/, "");
		}

		const thenPart = this.fnThenOrElsePart(node.args), // "then" statements
			simpleThen = CodeGeneratorJs.fnIsSimplePart(thenPart),
			elsePart = node.args2 ? this.fnThenOrElsePart(node.args2) : "", // "else" statements
			simpleElse = node.args2 ? CodeGeneratorJs.fnIsSimplePart(elsePart) : true;
		let value = "if (" + expression + ") { ";

		if (simpleThen && simpleElse) {
			value += thenPart + "; }";
			if (elsePart) {
				value += " else { " + elsePart + "; }";
			}
		} else {
			value += 'o.goto("' + label + '"); break; } ';

			if (elsePart !== "") { // "else" statements?
				value += "/* else */ " + elsePart + "; ";
			}
			value += 'o.goto("' + label + 'e"); break;';
			value += '\ncase "' + label + '": ' + thenPart + ";";
			value += '\ncase "' + label + 'e": ';
		}

		node.pv = value;
		return node.pv;
	}

	private input(node: CodeNode) { // input or lineInput
		const nodeArgs = this.fnParseArgs(node.args),
			varTypes = [];
		let label = this.line + "s" + this.stopCount;

		this.stopCount += 1;

		if (nodeArgs.length < 4) {
			throw this.composeError(Error(), "Programming error: Not enough parameters", node.type, node.pos); // should not occure
		}

		const stream = nodeArgs[0];
		let noCRLF = nodeArgs[1];

		if (noCRLF === ";") { // ; or null
			noCRLF = '"' + noCRLF + '"';
		}
		let msg = nodeArgs[2];

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		if (node.args[2].type === "null") { // message type
			msg = '""';
		}
		const prompt = nodeArgs[3];

		if (prompt === ";" || node.args[3].type === "null") { // ";" => insert prompt "? " in quoted string
			msg = msg.substr(0, msg.length - 1) + "? " + msg.substr(-1, 1);
		}

		for (let i = 4; i < nodeArgs.length; i += 1) {
			varTypes[i - 4] = this.fnDetermineStaticVarType(nodeArgs[i]);
		}

		let value = "o.goto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // also before input

		label = this.line + "s" + this.stopCount;
		this.stopCount += 1;

		value += "o." + node.type + "(" + stream + ", " + noCRLF + ", " + msg + ", \"" + varTypes.join('", "') + "\"); o.goto(\"" + label + "\"); break;\ncase \"" + label + "\":";
		for (let i = 4; i < nodeArgs.length; i += 1) {
			value += "; " + nodeArgs[i] + " = o.vmGetNextInput()";
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
		const nodeArgs = this.fnParseArgs(node.args); // or: fnCommandWithGoto

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}
		if (!node.args.length || node.args[node.args.length - 1].type === "#") { // last parameter stream? or no parameters?
			const stream = nodeArgs.pop() || "0";

			nodeArgs.unshift(stream); // put it first
		}

		node.pv = "o.list(" + nodeArgs.join(", ") + "); break;";
		return node.pv;
	}
	private load(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private merge(node: CodeNode) {
		this.mergeFound = true;
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private mid$Assign(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		if (nodeArgs.length < 3) {
			nodeArgs.push("undefined"); // empty length
		}

		if (!node.right) {
			throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure
		}
		const right = this.fnParseOneArg(node.right);

		nodeArgs.push(right);

		const name = nodeArgs[0],
			varType = this.fnDetermineStaticVarType(name),
			value = name + " = o.vmAssign(\"" + varType + "\", o.mid$Assign(" + nodeArgs.join(", ") + "))";

		node.pv = value;
		return node.pv;
	}
	private static "new"(node: CodeNode) {
		const name = Utils.supportReservedNames ? "o.new" : 'o["new"]';

		node.pv = name + "();";
		return node.pv;
	}
	private next(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		if (!nodeArgs.length) {
			nodeArgs.push(""); // we have no variable, so use empty argument
		}
		for (let i = 0; i < nodeArgs.length; i += 1) {
			const label = this.stack.forLabel.pop(),
				varName = this.stack.forVarName.pop();

			let errorNode: ParserNode;

			if (label === undefined) {
				if (nodeArgs[i] === "") { // inserted node?
					errorNode = node;
				} else { // identifier arg
					errorNode = node.args[i];
				}
				throw this.composeError(Error(), "Unexpected NEXT", errorNode.type, errorNode.pos);
			}
			if (nodeArgs[i] !== "" && nodeArgs[i] !== varName) {
				errorNode = node.args[i];
				throw this.composeError(Error(), "Unexpected NEXT variable", errorNode.value, errorNode.pos);
			}
			nodeArgs[i] = "/* next(\"" + nodeArgs[i] + "\") */ o.goto(\"" + label + "\"); break;\ncase \"" + label + "e\":";
		}
		node.pv = nodeArgs.join("; ");
		return node.pv;
	}
	private onBreakGosub(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			line = nodeArgs[0];

		this.fnAddReferenceLabel(line, node.args[0]);
		node.pv = "o." + node.type + "(" + line + ")";
		return node.pv;
	}
	private onErrorGoto(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			line = nodeArgs[0];

		if (Number(line)) { // only for lines > 0
			this.fnAddReferenceLabel(line, node.args[0]);
		}
		node.pv = "o." + node.type + "(" + line + ")";
		return node.pv;
	}
	private onGosub(node: CodeNode) {
		const left = this.fnParseOneArg(node.left as CodeNode),
			nodeArgs = this.fnParseArgs(node.args),
			name = node.type,
			label = this.line + "g" + this.gosubCount;

		this.gosubCount += 1;
		for (let i = 0; i < nodeArgs.length; i += 1) {
			this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
		}
		nodeArgs.unshift('"' + label + '"', left);
		node.pv = "o." + name + "(" + nodeArgs.join(", ") + '); break; \ncase "' + label + '":';
		return node.pv;
	}
	private onGoto(node: CodeNode) {
		const left = this.fnParseOneArg(node.left as CodeNode),
			nodeArgs = this.fnParseArgs(node.args),
			name = node.type,
			label = this.line + "s" + this.stopCount;

		this.stopCount += 1;
		for (let i = 0; i < nodeArgs.length; i += 1) {
			this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
		}
		nodeArgs.unshift('"' + label + '"', left);
		node.pv = "o." + name + "(" + nodeArgs.join(", ") + "); break\ncase \"" + label + "\":";
		return node.pv;
	}
	private onSqGosub(node: CodeNode) {
		const left = this.fnParseOneArg(node.left as CodeNode),
			nodeArgs = this.fnParseArgs(node.args);

		this.fnAddReferenceLabel(nodeArgs[0], node.args[0]); // line number
		nodeArgs.unshift(left);
		node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
		return node.pv;
	}
	private openin(node: CodeNode) {
		return this.fnCommandWithGoto(node);
	}

	private print(node: CodeNode) {
		const args = node.args,
			nodeArgs = [];
		let	newLine = true;

		for (let i = 0; i < args.length; i += 1) {
			const arg = args[i];
			let argString = this.fnParseOneArg(arg);

			if (i === args.length - 1) {
				if (arg.type === ";" || arg.type === "," || arg.type === "spc" || arg.type === "tab") {
					newLine = false;
				}
			}

			if (arg.type === ",") { // comma tab
				argString = "{type: \"commaTab\", args: []}"; // we must delay the commaTab() call until print() is called
				nodeArgs.push(argString);
			} else if (arg.type !== ";") { // ignore ";" separators
				nodeArgs.push(argString);
			}
		}

		if (newLine) {
			const arg2 = '"\\r\\n"';

			nodeArgs.push(arg2);
		}

		node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
		return node.pv;
	}

	private randomize(node: CodeNode) {
		let value: string;

		if (node.args.length) {
			const nodeArgs = this.fnParseArgs(node.args);

			value = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
		} else {
			const label = this.line + "s" + this.stopCount;

			this.stopCount += 1;
			value = "o.goto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // also before input

			value += this.fnCommandWithGoto(node) + " o.randomize(o.vmGetNextInput())";
		}
		node.pv = value;
		return node.pv;
	}
	private read(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < nodeArgs.length; i += 1) {
			const name = nodeArgs[i],
				varType = this.fnDetermineStaticVarType(name);

			nodeArgs[i] = name + " = o.read(\"" + varType + "\")";
		}
		node.pv = nodeArgs.join("; ");
		return node.pv;
	}
	private rem(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			value = nodeArgs.length ? " " + nodeArgs[0] : "";

		node.pv = "//" + value + "\n";
		return node.pv;
	}
	private renum(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node);
		return node.pv;
	}
	private restore(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		if (nodeArgs.length) {
			this.fnAddReferenceLabel(nodeArgs[0], node.args[0]); // optional line number
		}
		node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
		return node.pv;
	}
	private resume(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		if (nodeArgs.length) {
			this.fnAddReferenceLabel(nodeArgs[0], node.args[0]); // optional line number
		}
		node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break"; // append break
		return node.pv;
	}
	private static "return"(node: CodeNode) {
		const name = Utils.supportReservedNames ? "o.return" : 'o["return"]';

		node.pv = name + "(); break;";
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
		let nodeArgs: string[] = [];

		if (node.args.length) {
			const fileName = this.fnParseOneArg(node.args[0]);

			nodeArgs.push(fileName);
			if (node.args.length > 1) {
				this.defScopeArgs = {}; // collect DEF scope args
				const type = '"' + this.fnParseOneArg(node.args[1]) + '"';

				this.defScopeArgs = undefined;
				nodeArgs.push(type);

				const nodeArgs2 = node.args.slice(2), // get remaining args
					nodeArgs3 = this.fnParseArgs(nodeArgs2);

				nodeArgs = nodeArgs.concat(nodeArgs3);
			}
		}
		node.pv = this.fnCommandWithGoto(node, nodeArgs);
		return node.pv;
	}
	private sound(node: CodeNode) {
		node.pv = this.fnCommandWithGoto(node); // maybe queue is full, so insert break
		return node.pv;
	}
	private spc(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		node.pv = "{type: \"spc\", args: [" + nodeArgs.join(", ") + "]}"; // we must delay the spc() call until print() is called because we need stream
		return node.pv;
	}
	private stop(node: CodeNode) {
		const name = this.line + "s" + this.stopCount;

		this.stopCount += 1;
		node.pv = "o.stop(\"" + name + "\"); break;\ncase \"" + name + "\":";
		return node.pv;
	}
	private tab(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		node.pv = "{type: \"tab\", args: [" + nodeArgs.join(", ") + "]}"; // we must delay the tab() call until print() is called
		return node.pv;
	}
	private wend(node: CodeNode) {
		const label = this.stack.whileLabel.pop();

		if (label === undefined) {
			throw this.composeError(Error(), "Unexpected WEND", node.type, node.pos);
		}
		node.pv = "/* o.wend() */ o.goto(\"" + label + "\"); break;\ncase \"" + label + "e\":";
		return node.pv;
	}
	private "while"(node: CodeNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			label = this.line + "w" + this.whileCount;

		this.stack.whileLabel.push(label);
		this.whileCount += 1;
		node.pv = "\ncase \"" + label + "\": if (!(" + nodeArgs + ")) { o.goto(\"" + label + "e\"); break; }";
		return node.pv;
	}

	/* eslint-disable no-invalid-this */
	parseFunctions: { [k in string]: (node: CodeNode) => string } = { // to call methods, use parseFunctions[].call(this,...)
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
		const nodeArgs = this.fnParseArgs(node.args),
			typeWithSpaces = " " + node.type + " ";

		node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";

		if (CodeGeneratorJs.fnIsInString(" asc cint derr eof erl err fix fre inkey inp instr int joy len memory peek pos remain sgn sq test testr unt vpos xpos ypos ", typeWithSpaces)) {
			node.pt = "I";
		} else if (CodeGeneratorJs.fnIsInString(" abs atn cos creal exp log log10 max min pi rnd round sin sqr tan time val ", typeWithSpaces)) {
			node.pt = "R";
		} else if (CodeGeneratorJs.fnIsInString(" bin$ chr$ copychr$ dec$ hex$ inkey$ left$ lower$ mid$ right$ space$ str$ string$ upper$ ", typeWithSpaces)) {
			node.pt = "$";
		}

		return node.pv;
	}


	private parseNode(node: CodeNode) {
		if (Utils.debug > 3) {
			Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
		}

		const operators = this.operators;

		let value: string;

		if (operators[node.type]) {
			if (node.left) {
				value = this.parseNode(node.left);
				if (operators[node.left.type] && node.left.left) { // binary operator?
					value = "(" + value + ")";
					node.left.pv = value;
				}

				if (!node.right) {
					throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure
				}
				let value2 = this.parseNode(node.right);

				if (operators[node.right.type] && node.right.left) { // binary operator?
					value2 = "(" + value2 + ")";
					node.right.pv = value2;
				}
				value = operators[node.type].call(this, node, node.left, node.right);
			} else {
				if (!node.right) {
					throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure
				}
				value = this.parseNode(node.right);
				value = operators[node.type].call(this, node, node.left! as CodeNode, node.right); // unary operator: we just use node.right
			}
		} else if (this.parseFunctions[node.type]) { // function with special handling?
			value = this.parseFunctions[node.type].call(this, node);
		} else { // for other functions, generate code directly
			value = this.fnParseOther(node);
		}

		return value;
	}

	private static fnCommentUnusedCases(output2: string, labels: LabelsType) {
		output2 = output2.replace(/^case (\d+):/gm, function (all: string, line: string) {
			return (labels[line]) ? all : "/* " + all + " */";
		});
		return output2;
	}

	private fnCreateLabelsMap(parseTree: ParserNode[], labels: LabelsType) {
		let lastLine = -1;

		for (let i = 0; i < parseTree.length; i += 1) {
			const node = parseTree[i];

			if (node.type === "label") {
				const lineString = node.value;

				if (lineString in labels) {
					throw this.composeError(Error(), "Duplicate line number", lineString, node.pos);
				}
				const lineNumber = Number(lineString);

				if (!isNaN(lineNumber)) { // not for "direct"
					if (lineNumber <= lastLine) {
						throw this.composeError(Error(), "Line number not increasing", lineString, node.pos);
					}
					if (lineNumber < 1 || lineNumber > 65535) {
						throw this.composeError(Error(), "Line number overflow", lineString, node.pos);
					}
					lastLine = lineNumber;
				}
				labels[lineString] = 0; // init call count
			}
		}
	}

	//
	// evaluate
	//
	private evaluate(parseTree: ParserNode[], variables: Variables) {
		this.variables = variables;

		this.defScopeArgs = undefined;

		// create labels map
		this.fnCreateLabelsMap(parseTree, this.labels);

		let output = "";

		for (let i = 0; i < parseTree.length; i += 1) {
			if (Utils.debug > 2) {
				Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
			}
			const node = this.fnParseOneArg(parseTree[i]);

			if ((node !== undefined) && (node !== "")) {
				if (node !== null) {
					if (output.length === 0) {
						output = node;
					} else {
						output += "\n" + node;
					}
				} else {
					output = ""; // cls (clear output when node is set to null)
				}
			}
		}

		// optimize: comment lines which are not referenced
		if (!this.mergeFound) {
			output = CodeGeneratorJs.fnCommentUnusedCases(output, this.labels);
		}
		return output;
	}

	private static combineData(data: string[]) {
		let dataString = data.join(";\n");

		if (dataString.length) {
			dataString += ";\n";
		}
		return dataString;
	}

	debugGetLabelsCount(): number {
		return Object.keys(this.labels).length;
	}

	generate(input: string, variables: Variables, allowDirect?: boolean): IOutput {
		const out: IOutput = {
			text: ""
		};

		this.reset();
		try {
			const tokens = this.lexer.lex(input),
				parseTree = this.parser.parse(tokens, allowDirect);
			let	output = this.evaluate(parseTree, variables);

			if (!this.noCodeFrame) {
				output = '"use strict"\n'
					+ "var v=o.vmGetAllVariables();\n"
					+ "while (o.vmLoopCondition()) {\nswitch (o.line) {\ncase 0:\n"
					+ CodeGeneratorJs.combineData(this.dataList)
					+ " o.goto(o.startLine ? o.startLine : \"start\"); break;\ncase \"start\":\n"
					+ output
					+ "\ncase \"end\": o.vmStop(\"end\", 90); break;\ndefault: o.error(8); o.goto(\"end\"); break;\n}}\n";
			} else {
				output = CodeGeneratorJs.combineData(this.dataList) + output;
			}
			out.text = output;
		} catch (e) {
			if (Utils.isCustomError(e)) {
				out.error = e;
				if (!this.quiet) {
					Utils.console.warn(e); // show our customError as warning
				}
			} else { // other errors
				out.error = e as CustomError; // force set other error
				Utils.console.error(e);
			}
		}
		return out;
	}
}