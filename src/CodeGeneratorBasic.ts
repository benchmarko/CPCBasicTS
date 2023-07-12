// CodeGeneratorBasic.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils, CustomError } from "./Utils";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser"; // BasicParser just for keyword definitions
import { IOutput } from "./Interfaces";

interface CodeGeneratorBasicOptions {
	lexer: BasicLexer
	parser: BasicParser
	quiet?: boolean
}

export class CodeGeneratorBasic {
	private readonly options: CodeGeneratorBasicOptions;
	private hasColons = false;
	private keepWhiteSpace = false;

	private line = 0; // current line (label)

	setOptions(options: Omit<CodeGeneratorBasicOptions, "lexer" | "parser">): void {
		if (options.quiet !== undefined) {
			this.options.quiet = options.quiet;
		}
	}

	getOptions(): CodeGeneratorBasicOptions {
		return this.options;
	}

	constructor(options: CodeGeneratorBasicOptions) {
		this.options = {
			lexer: options.lexer,
			parser: options.parser,
			quiet: false
		};
		this.setOptions(options);
	}

	private static readonly combinedKeywords: Record<string, string> = {
		chainMerge: "CHAIN", // "CHAIN MERGE"
		clearInput: "CLEAR", // "CLEAR INPUT"
		graphicsPaper: "GRAPHICS", // "GRAPHICS PAPER"
		graphicsPen: "GRAPHICS", // "GRAPHICS PEN"
		keyDef: "KEY", // "KEY DEF"
		lineInput: "LINE", // "LINE INPUT"
		mid$Assign: "MID$",
		onBreakCont: "ON", // ""ON BREAK CONT"
		onBreakGosub: "ON", // ""ON BREAK GOSUB"
		onBreakStop: "ON", // ""ON BREAK STOP"
		onErrorGoto: "ON", // "ON ERROR GOTO"
		resumeNext: "RESUME", // "RESUME NEXT"
		speedInk: "SPEED", // "SPEED INK"
		speedKey: "SPEED", // "SPEED KEY"
		speedWrite: "SPEED", // "SPEED WRITE"
		symbolAfter: "SYMBOL", // "SYMBOL AFTER"
		windowSwap: "WINDOW" // "WINDOW SWAP"
	}

	private static readonly operators: Record<string, string> = {
		"+": "+",
		"-": "-",
		"*": "*",
		"/": "/",
		"\\": "\\",
		"^": "^",
		and: "AND",
		or: "OR",
		xor: "XOR",
		not: "NOT",
		mod: "MOD",
		">": ">",
		"<": "<",
		">=": ">=",
		"<=": "<=",
		"=": "=",
		"<>": "<>",
		"@": "@",
		"#": "#"
	}

	private static readonly operatorPrecedence: Record<string, number> = {
		"@": 95, // prefix
		"^": 90,

		"p-": 80, // prefix - (fast hack)
		"p+": 80, // prefix + (fast hack)

		"*": 70,
		"/": 70,
		"\\": 60,

		mod: 50,

		"+": 40,
		"-": 40,

		"=": 30,
		"<>": 30,
		"<": 30,
		"<=": 30,
		">": 30,
		">=": 30,

		not: 23, // prefix
		and: 22,
		or: 21,
		xor: 20,
		"#": 10 // priority?
	}

	private composeError(error: Error, message: string, value: string, pos: number) { // eslint-disable-line class-methods-use-this
		return Utils.composeError("CodeGeneratorBasic", error, message, value, pos, undefined, this.line);
	}

	private static fnWs(node: ParserNode) {
		return node.ws || "";
	}

	private static fnSpace1(value: string) {
		return (!value.length || value.startsWith(" ") ? "" : " ") + value;
	}

	private static getUcKeyword(node: ParserNode) {
		const type = node.type;

		return CodeGeneratorBasic.combinedKeywords[type] || type.toUpperCase();
	}


	private fnParseArgs(args: ParserNode[] | undefined) {
		const nodeArgs: string[] = []; // do not modify node.args here (could be a parameter of defined function)

		if (!args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
		}

		for (let i = 0; i < args.length; i += 1) {
			let value = this.parseNode(args[i]);

			if (args[i].type === "'" || args[i].type === "else" || args[i].type === "elseComment") { // fast hack to put a space before "'", "else" or "elseComment", if there is no space previously
				if (i > 0 && !nodeArgs[i - 1].endsWith(" ") && !nodeArgs[i - 1].endsWith(":")) {
					value = CodeGeneratorBasic.fnSpace1(value);
				}
			}

			nodeArgs.push(value);
		}
		return nodeArgs;
	}

	private combineArgsWithColon(args: string[]) {
		if (!this.hasColons) {
			for (let i = 1; i < args.length; i += 1) { // start with 1
				const arg = args[i].trim();

				if (!arg.startsWith("ELSE") && !arg.startsWith("'") && arg !== "") { //TTT arg !== "\n"
					args[i] = ":" + args[i];
				}
			}
		}

		return args.join("");
	}

	private fnParenthesisOpen(node: ParserNode) { // special construct to combine tokens
		return CodeGeneratorBasic.fnWs(node) + node.value + (node.args ? this.fnParseArgs(node.args).join("") : "");
	}

	private static string(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + '"' + node.value + '"';
	}
	private static ustring(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + '"' + node.value;
	}

	private assign(node: ParserNode) {
		// see also "let"
		if ((node.left as ParserNode).type !== "identifier") {
			throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
		}
		// no spaces needed around "="
		return this.parseNode(node.left as ParserNode) + CodeGeneratorBasic.fnWs(node) + node.value + this.parseNode(node.right as ParserNode);
	}

	private static expnumber(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + Number(node.value).toExponential().toUpperCase().replace(/(\d+)$/, function (x) {
			return x.length >= 2 ? x : x.padStart(2, "0"); // format with 2 exponential digits
		});
	}
	private static binHexNumber(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // binnumber: maybe "&x", hexnumber: mayby "&h"
	}

	private label(node: ParserNode) {
		this.line = Number(node.value); // set line before parsing args
		const value = this.combineArgsWithColon(this.fnParseArgs(node.args));

		return CodeGeneratorBasic.fnWs(node) + node.value + (node.value !== "" ? CodeGeneratorBasic.fnSpace1(value) : value);
	}

	// special keyword functions
	private vertical(node: ParserNode) { // "|" rsx
		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + this.fnParseArgs(node.args).join("");
	}
	private afterEveryGosub(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		nodeArgs[0] = CodeGeneratorBasic.fnSpace1(nodeArgs[0]); // first argument
		nodeArgs[nodeArgs.length - 2] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]); // "gosub"
		nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]); // line number

		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + nodeArgs.join("");
	}
	private chainOrChainMerge(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		if (nodeArgs.length > 2) { // with delete?
			if (nodeArgs[nodeArgs.length - 2] === "DELETE") {
				nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]);
			}
		}

		return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + (node.right ? CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) : "") + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
	}
	private data(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < nodeArgs.length; i += 1) {
			const value2 = nodeArgs[i];

			nodeArgs[i] = value2;
		}

		let args = nodeArgs.join("");

		if (!this.keepWhiteSpace) {
			args = Utils.stringTrimEnd(args); // remove trailing spaces
		}

		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(args);
	}

	private def(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.right ? CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + this.fnParseArgs(node.args).join("") : "");
	}

	private elseComment(node: ParserNode) { // similar to a comment, with unchecked tokens
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
		}

		const args = node.args;
		let value = "";

		for (let i = 0; i < args.length; i += 1) {
			const token = args[i];

			if (token.value) {
				if (this.keepWhiteSpace) {
					value += CodeGeneratorBasic.fnWs(token) + token.value;
				} else {
					value += CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.fnWs(token) + token.value); //TTT
				}
			}
		}
		return CodeGeneratorBasic.fnWs(node) + "else".toUpperCase() + value;
	}

	private fn(node: ParserNode) {
		if (!node.right) {
			return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase(); // only fn
		}

		const nodeArgs = node.args ? this.fnParseArgs(node.args) : [];
		let right = this.parseNode(node.right);

		if ((node.right.pos - node.pos) > 2) { // space between fn and identifier?
			right = CodeGeneratorBasic.fnSpace1(right); // keep it
		}

		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + right + nodeArgs.join("");
	}

	private fnFor(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < nodeArgs.length; i += 1) {
			if (i !== 1 && i !== 2) { // not for "=" and startValue
				nodeArgs[i] = CodeGeneratorBasic.fnSpace1(nodeArgs[i]); // set minimal spaces in case we do not keep whitespace
			}
		}
		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + nodeArgs.join("");
	}

	private fnElse(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(this.fnParseArgs(node.args)));
	}

	private fnIf(node: ParserNode) {
		/*
		const elseNode = node.args && node.args.length && node.args[node.args.length - 1].type === "else" ? (node.args.pop() as ParserNode);
		elseArgs = node.args && node.args.length && node.args[node.args.length - 1].type === "else" ? (node.args.pop() as ParserNode).args : undefined,
		*/
		const nodeArgs = this.fnParseArgs(node.args),
			partName = nodeArgs.shift() as string; // "then"/"goto"

		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right as ParserNode))
			+ CodeGeneratorBasic.fnSpace1(partName) + CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(nodeArgs));
			//+ elseArgs ? CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase()
	}

	private inputLineInput(node: ParserNode) { // input or line input
		const nodeArgs = node.args ? this.fnParseArgs(node.args) : [], // also for clear input, which has no args
			name = node.right ? this.parseNode(node.right) : ""; // line input?

		return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + CodeGeneratorBasic.fnSpace1(name) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
	}
	private list(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		if (nodeArgs.length && nodeArgs[0] === "") { // empty range?
			nodeArgs.shift(); // remove
		}

		if (nodeArgs.length && nodeArgs[nodeArgs.length - 1] === "#") { // dummy stream?
			nodeArgs.pop(); // remove
		}

		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
	}
	private mid$Assign(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + this.fnParseArgs(node.args).join("");
	}

	private onBreakOrError(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right as ParserNode)) + CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join(""));
	}

	private onGotoGosub(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			expression = nodeArgs.shift() as string,
			instruction = nodeArgs.shift() as string; // "goto" or "gosub"

		return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(expression) + CodeGeneratorBasic.fnSpace1(instruction) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
	}

	private onSqGosub(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		nodeArgs[nodeArgs.length - 2] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]); // "gosub" with space (optional)
		nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]); // line number with space

		return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right as ParserNode)) + nodeArgs.join("");
	}

	private print(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);
		let value = "";

		for (let i = 0; i < nodeArgs.length; i += 1) {
			value += nodeArgs[i];
		}

		if (node.value !== "?") { // for "print"
			value = CodeGeneratorBasic.fnSpace1(value);
		}

		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + value; // we use value to get PRINT or ?
	}
	private rem(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join(""));
	}
	private using(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			template = nodeArgs.length ? nodeArgs.shift() || "" : "";

		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(template) + nodeArgs.join("");
	}

	private write(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.args ? CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join("")) : ""); // separators already there
	}

	/* eslint-disable no-invalid-this */
	private readonly parseFunctions: Record<string, (node: ParserNode) => string> = { // to call methods, use parseFunctions[].call(this,...)
		"(": this.fnParenthesisOpen,
		string: CodeGeneratorBasic.string,
		ustring: CodeGeneratorBasic.ustring,
		assign: this.assign,
		expnumber: CodeGeneratorBasic.expnumber,
		binnumber: CodeGeneratorBasic.binHexNumber,
		hexnumber: CodeGeneratorBasic.binHexNumber,
		label: this.label,
		"|": this.vertical,
		afterGosub: this.afterEveryGosub,
		chain: this.chainOrChainMerge,
		chainMerge: this.chainOrChainMerge,
		data: this.data,
		def: this.def,
		"else": this.fnElse,
		elseComment: this.elseComment,
		everyGosub: this.afterEveryGosub,
		fn: this.fn,
		"for": this.fnFor,
		"if": this.fnIf,
		input: this.inputLineInput,
		lineInput: this.inputLineInput,
		list: this.list,
		mid$Assign: this.mid$Assign,
		onBreakCont: this.onBreakOrError, // 3 parts
		onBreakGosub: this.onBreakOrError,
		onBreakStop: this.onBreakOrError,
		onErrorGoto: this.onBreakOrError,
		onGosub: this.onGotoGosub,
		onGoto: this.onGotoGosub,
		onSqGosub: this.onSqGosub,
		print: this.print,
		rem: this.rem,
		using: this.using,
		write: this.write
	};
	/* eslint-enable no-invalid-this */

	private fnParseOther(node: ParserNode) {
		const type = node.type;
		let value = ""; // CodeGeneratorBasic.fnGetWs(node);

		if (node.left) {
			value += this.parseNode(node.left);
		}

		value += CodeGeneratorBasic.fnWs(node);

		const keyType = BasicParser.keywords[type];

		if (keyType) {
			value += CodeGeneratorBasic.getUcKeyword(node);
		} else if (node.value) { // e.g. string,...
			value += node.value;
		}

		let right = "";

		if (node.right) {
			right = this.parseNode(node.right);
			const needSpace1 = BasicParser.keywords[right.toLowerCase()] || keyType;

			value += needSpace1 ? CodeGeneratorBasic.fnSpace1(right) : right;
		}
		if (node.args) {
			const nodeArgs = this.fnParseArgs(node.args).join(""),
				needSpace2 = keyType && keyType.charAt(0) !== "f" && node.type !== "'";

			// special handling for combined keywords with 2 tokens (for 3 tokens, we need a specific function)
			value += needSpace2 ? CodeGeneratorBasic.fnSpace1(nodeArgs) : nodeArgs;
		}
		return value;
	}

	private static getLeftOrRightOperatorPrecedence(node: ParserNode) {
		const precedence = CodeGeneratorBasic.operatorPrecedence,
			operators = CodeGeneratorBasic.operators;
		let pr: number | undefined;

		if (operators[node.type] && (node.left || node.right)) { // binary operator (or unary operator, e.g. not)
			if (node.left) { // right is binary
				pr = precedence[node.type] || 0;
			} else {
				pr = precedence["p" + node.type] || precedence[node.type] || 0;
			}
		}
		return pr;
	}

	private parseOperator(node: ParserNode) { // eslint-disable-line complexity
		const precedence = CodeGeneratorBasic.operatorPrecedence,
			operators = CodeGeneratorBasic.operators;
		let value: string;

		if (node.left) {
			value = this.parseNode(node.left);
			const p = precedence[node.type],
				pl = CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(node.left);

			if (pl !== undefined && pl < p) {
				value = "(" + value + ")";
			}

			const right = node.right as ParserNode;
			let value2 = this.parseNode(right);
			const pr = CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(right);

			if (pr !== undefined) {
				if ((pr < p) || ((pr === p) && node.type === "-")) { // "-" is special
					value2 = "(" + value2 + ")";
				}
			}

			const operator = CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase();

			if ((/^(and|or|xor|mod)$/).test(node.type)) {
				value += CodeGeneratorBasic.fnSpace1(operator) + CodeGeneratorBasic.fnSpace1(value2);
			} else {
				value += operator + value2;
			}
		} else if (node.right) { // unary operator, e.g. not, '#'
			if (node.len === 0) {
				value = ""; // ignore dummy token, e.g. '#'
			} else {
				const right = node.right;

				value = this.parseNode(right);
				let pr: number;

				if (right.left) { // was binary op?
					pr = precedence[right.type] || 0; // no special prio
				} else {
					pr = precedence["p" + right.type] || precedence[right.type] || 0; // check unary operator first
				}

				const p = precedence["p" + node.type] || precedence[node.type] || 0; // check unary operator first

				if (p && pr && (pr < p)) {
					value = "(" + value + ")";
				}
				value = CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase() + (node.type === "not" ? CodeGeneratorBasic.fnSpace1(value) : value);
			}
		} else { // no operator, e.g. "=" in "for"
			value = this.fnParseOther(node);
		}
		return value;
	}

	private parseNode(node: ParserNode) {
		const type = node.type;

		if (Utils.debug > 3) {
			Utils.console.debug("evaluate: parseNode node=%o type=" + type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
		}

		let value: string;

		if (CodeGeneratorBasic.operators[type]) {
			value = this.parseOperator(node);
		} else if (this.parseFunctions[type]) { // function with special handling?
			value = this.parseFunctions[type].call(this, node);
		} else { // for other functions, generate code directly
			value = this.fnParseOther(node);
		}

		return value;
	}

	private evaluate(parseTree: ParserNode[]) {
		let output = "";

		for (let i = 0; i < parseTree.length; i += 1) {
			if (Utils.debug > 2) {
				Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
			}
			const line = this.parseNode(parseTree[i]);

			if ((line !== undefined) && (line !== "")) {
				if (line !== null) {
					if (output.length === 0) {
						output = line;
					} else {
						output += line;
					}
				} else {
					output = ""; // cls (clear output when node is set to null)
				}
			}
		}
		return output;
	}

	generate(input: string): IOutput {
		const out: IOutput = {
			text: ""
		};

		this.hasColons = Boolean(this.options.parser.getOptions().keepColons);
		this.keepWhiteSpace = Boolean(this.options.lexer.getOptions().keepWhiteSpace);

		this.line = 0;
		try {
			const tokens = this.options.lexer.lex(input),
				parseTree = this.options.parser.parse(tokens),
				output = this.evaluate(parseTree);

			out.text = output;
		} catch (e) {
			if (Utils.isCustomError(e)) {
				out.error = e;
				if (!this.options.quiet) {
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
