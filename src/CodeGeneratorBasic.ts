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
	quiet?: boolean
	lexer: BasicLexer
	parser: BasicParser
}

export class CodeGeneratorBasic {
	private quiet = false;
	private lexer: BasicLexer;
	private parser: BasicParser;
	private line = 0; // current line (label)

	constructor(options: CodeGeneratorBasicOptions) {
		this.quiet = options.quiet || false;
		this.lexer = options.lexer;
		this.parser = options.parser;
	}

	getLexer(): BasicLexer {
		return this.lexer;
	}

	getParser(): BasicParser {
		return this.parser;
	}

	private static combinedKeywords: { [k: string]: string } = {
		chainMerge: "CHAIN MERGE",
		clearInput: "CLEAR INPUT",
		graphicsPaper: "GRAPHICS PAPER",
		graphicsPen: "GRAPHICS PEN",
		keyDef: "KEY DEF",
		lineInput: "LINE INPUT",
		mid$Assign: "MID$",
		onBreakCont: "ON BREAK CONT",
		onBreakGosub: "ON BREAK GOSUB",
		onBreakStop: "ON BREAK STOP",
		onErrorGoto: "ON ERROR GOTO",
		resumeNext: "RESUME NEXT",
		speedInk: "SPEED INK",
		speedKey: "SPEED KEY",
		speedWrite: "SPEED WRITE",
		symbolAfter: "SYMBOL AFTER",
		windowSwap: "WINDOW SWAP"
	}

	private static operators: { [k: string]: string } = {
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

	private static operatorPrecedence: { [k: string]: number } = {
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
		let typeUc = CodeGeneratorBasic.combinedKeywords[type] || type.toUpperCase();

		if (typeUc !== node.value.toUpperCase()) { // some (extra) whitespace between combined keyword?
			typeUc = node.value.toUpperCase(); // we could always take this
		}
		return typeUc;
	}

	private fnParseOneArg(arg: ParserNode) {
		const value = this.parseNode(arg);

		return value;
	}

	private fnParseArgs(args: ParserNode[] | undefined) {
		const nodeArgs: string[] = []; // do not modify node.args here (could be a parameter of defined function)

		if (!args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
		}

		for (let i = 0; i < args.length; i += 1) {
			const value = this.fnParseOneArg(args[i]);

			if (!(i === 0 && value === "#" && args[i].type === "#")) { // ignore empty stream as first argument (hmm, not for e.g. data!)
				nodeArgs.push(value);
			}
		}
		return nodeArgs;
	}

	private static fnColonsAvailable(args: string[]) {
		let colonsAvailable = false;

		for (let i = 0; i < args.length; i += 1) {
			if (args[i].trim() === ":") {
				colonsAvailable = true;
				break;
			}
		}
		return colonsAvailable;
	}

	private static combineArgsWithColon(args: string[]) {
		const separator = CodeGeneratorBasic.fnColonsAvailable(args) ? "" : ":",
			value = args.join(separator);

		return value;
	}

	private fnParenthesisOpen(node: ParserNode) { // special construct to combine tokens
		let value = node.value;

		if (node.args) {
			const nodeArgs = this.fnParseArgs(node.args);

			value += nodeArgs.join("");
		}

		return CodeGeneratorBasic.fnWs(node) + value;
	}

	private static string(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + '"' + node.value + '"';
	}
	private static unquoted(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.value;
	}
	private static fnNull() { // "null" means: no parameter specified
		return "";
	}
	private assign(node: ParserNode) {
		// see also "let"
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
		}
		if (node.left.type !== "identifier") {
			throw this.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
		}
		const value = this.fnParseOneArg(node.left) + CodeGeneratorBasic.fnWs(node) + node.value + this.fnParseOneArg(node.right);

		return value;
	}
	private static decBinHexNumber(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // number: maybe "e" inside; binnumber: maybe "&x"
	}
	private identifier(node: ParserNode) { // identifier or identifier with array
		let value = CodeGeneratorBasic.fnWs(node) + node.value; // keep case, maybe mixed

		if (node.args) { // args including brackets
			const nodeArgs = this.fnParseArgs(node.args),
				bracketOpen = nodeArgs.shift(),
				bracketClose = nodeArgs.pop();

			value += bracketOpen + nodeArgs.join(",") + bracketClose;
		}

		return value;
	}
	private static linenumber(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.value;
	}
	private label(node: ParserNode) {
		this.line = Number(node.value); // set line before parsing args

		const nodeArgs = this.fnParseArgs(node.args);

		let value = CodeGeneratorBasic.combineArgsWithColon(nodeArgs);

		if (node.value !== "direct") {
			value = node.value + CodeGeneratorBasic.fnSpace1(value);
		}
		return CodeGeneratorBasic.fnWs(node) + value;
	}

	// special keyword functions
	private vertical(node: ParserNode) { // "|" rsx
		const nodeArgs = this.fnParseArgs(node.args);
		let value = node.value.toUpperCase(); // use value!

		if (nodeArgs.length) {
			value += "," + nodeArgs.join(",");
		}
		return CodeGeneratorBasic.fnWs(node) + value;
	}
	private afterEveryGosub(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);
		let value = node.value.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs[0]);

		if (nodeArgs[1]) {
			value += "," + nodeArgs[1];
		}
		value += " GOSUB" + CodeGeneratorBasic.fnSpace1(nodeArgs[2]);
		return CodeGeneratorBasic.fnWs(node) + value;
	}
	private chainMerge(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			typeUc = CodeGeneratorBasic.getUcKeyword(node);

		if (nodeArgs.length === 3) {
			nodeArgs[2] = "DELETE" + CodeGeneratorBasic.fnSpace1(nodeArgs[2]);
		}

		return CodeGeneratorBasic.fnWs(node) + typeUc + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
	}
	private data(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < nodeArgs.length; i += 1) {
			const value2 = nodeArgs[i];

			nodeArgs[i] = value2;
		}

		let args = nodeArgs.join("");

		args = Utils.stringTrimEnd(args); // remove trailing spaces

		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(args);
	}
	private def(node: ParserNode) {
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
		}

		const name = this.fnParseOneArg(node.left),
			space = node.left.space ? " " : "", // fast hack
			nodeArgs = this.fnParseArgs(node.args),
			expression = this.fnParseOneArg(node.right);
		let nodeArgsString = nodeArgs.join(",");

		if (nodeArgsString !== "") { // not empty?
			nodeArgsString = "(" + nodeArgsString + ")";
		}

		const name2 = name.replace(/FN/i, "FN" + space);

		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(name2) + nodeArgsString + "=" + expression; //TTT how to get space before "="?
	}
	private "else"(node: ParserNode) { // similar to a comment, with unchecked tokens
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
		}

		const args = node.args;
		let value = "";

		for (let i = 0; i < args.length; i += 1) {
			const token = args[i];

			if (token.value) {
				value += " " + token.value;
			}
		}
		// TODO: whitespaces?
		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + value;
	}
	private entOrEnv(node: ParserNode) { // "ent" or "env"
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
		}

		const args = node.args,
			nodeArgs = [];
		let equal = false;

		for (let i = 0; i < args.length; i += 1) {
			if (args[i].type !== "null") {
				let arg = this.fnParseOneArg(args[i]);

				if (equal) {
					arg = "=" + arg;
					equal = false;
				}
				nodeArgs.push(arg);
			} else {
				equal = true;
			}
		}
		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
	}

	private fn(node: ParserNode) {
		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
		}

		const nodeArgs = this.fnParseArgs(node.args);
		let nodeArgsString = nodeArgs.join(",");

		if (nodeArgsString !== "") { // not empty?
			nodeArgsString = "(" + nodeArgsString + ")";
		}

		const name2 = node.value.replace(/FN/i, "FN"); // + space),

		return CodeGeneratorBasic.fnWs(node) + name2 + nodeArgsString;
	}
	private "for"(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < nodeArgs.length; i += 1) {
			if (i !== 1 && i !== 2) { // not for "=" and startValue
				nodeArgs[i] = CodeGeneratorBasic.fnSpace1(nodeArgs[i]); // set minimal spaces in case we do not keep whitespace
			}
		}
		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + nodeArgs.join("");
	}

	private fnThenOrElsePart(nodeBranch: ParserNode[]) {
		const nodeArgs = this.fnParseArgs(nodeBranch); // args for "then" or "else"

		return CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.combineArgsWithColon(nodeArgs));
	}

	private "if"(node: ParserNode) {
		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
		}
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
		}

		let value = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.fnParseOneArg(node.left));

		if (node.right) { // "THEN"
			value += CodeGeneratorBasic.fnSpace1(this.fnParseOneArg(node.right));
		}
		value += this.fnThenOrElsePart(node.args); // "then" part

		if (node.args2) {
			value += " ELSE" + this.fnThenOrElsePart(node.args2); // "else" part
		}
		return CodeGeneratorBasic.fnWs(node) + value;
	}


	private static fnHasStream(node: ParserNode) {
		return node.args && node.args.length && (node.args[0].type === "#") && node.args[0].right && (node.args[0].right.type !== "null");
	}

	private inputLineInput(node: ParserNode) { // input or line input
		const nodeArgs = this.fnParseArgs(node.args),
			typeUc = CodeGeneratorBasic.getUcKeyword(node),
			hasStream = CodeGeneratorBasic.fnHasStream(node);
		let i = 0;

		if (hasStream) { // stream?
			i += 1;
		}

		nodeArgs.splice(i, 4, nodeArgs[i] + nodeArgs[i + 1] + nodeArgs[i + 2] + nodeArgs[i + 3]); // combine 4 elements into one

		return CodeGeneratorBasic.fnWs(node) + typeUc + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
	}
	private list(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		if (nodeArgs.length && nodeArgs[0] === "") { // empty range?
			nodeArgs.shift(); // remove
		}

		if (nodeArgs.length && nodeArgs[nodeArgs.length - 1] === "#") { // dummy stream?
			nodeArgs.pop(); // remove
		}

		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
	}
	private mid$Assign(node: ParserNode) {
		if (!node.right) {
			throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
		}

		const nodeArgs = this.fnParseArgs(node.args),
			typeUc = CodeGeneratorBasic.getUcKeyword(node);

		return CodeGeneratorBasic.fnWs(node) + typeUc + "(" + nodeArgs.join(",") + ")=" + this.fnParseOneArg(node.right);
	}
	private onGotoGosub(node: ParserNode) {
		const left = this.fnParseOneArg(node.left as ParserNode),
			nodeArgs = this.fnParseArgs(node.args),
			right = this.fnParseOneArg(node.right as ParserNode); // "goto" or "gosub"

		return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(left) + CodeGeneratorBasic.fnSpace1(right) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
	}
	private onSqGosub(node: ParserNode) {
		const left = this.fnParseOneArg(node.left as ParserNode),
			nodeArgs = this.fnParseArgs(node.args);

		return CodeGeneratorBasic.fnWs(node) + "ON SQ(" + left + ") GOSUB" + CodeGeneratorBasic.fnSpace1(nodeArgs.join(","));
	}
	private print(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			hasStream = CodeGeneratorBasic.fnHasStream(node);
		let value = "";

		if (hasStream && nodeArgs.length > 1) { // more args after stream?
			nodeArgs[0] = String(nodeArgs[0]) + ",";
		}

		for (let i = 0; i < nodeArgs.length; i += 1) {
			value += nodeArgs[i];
		}

		if (node.value !== "?") { // for "print"
			value = CodeGeneratorBasic.fnSpace1(value);
		}

		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + value; // we use value to get PRINT or ?
	}
	private rem(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);
		let value = nodeArgs.length ? nodeArgs[0] : "";

		if (node.value !== "'" && value !== "") { // for "rem"
			const arg0 = node.args && node.args[0];

			if (arg0 && !arg0.ws) {
				value = " " + value; // add removed space
			}
		}

		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + value; // we use value to get rem or '
	}
	private using(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			template = nodeArgs.length ? nodeArgs.shift() || "" : "";

		return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(template) + ";" + nodeArgs.join(","); // separator between args could be "," or ";", we use ","
	}

	/* eslint-disable no-invalid-this */
	parseFunctions: { [k: string]: (node: ParserNode) => string } = { // to call methods, use parseFunctions[].call(this,...)
		"(": this.fnParenthesisOpen,
		string: CodeGeneratorBasic.string,
		unquoted: CodeGeneratorBasic.unquoted,
		"null": CodeGeneratorBasic.fnNull,
		assign: this.assign,
		number: CodeGeneratorBasic.decBinHexNumber,
		binnumber: CodeGeneratorBasic.decBinHexNumber,
		hexnumber: CodeGeneratorBasic.decBinHexNumber,
		identifier: this.identifier,
		linenumber: CodeGeneratorBasic.linenumber,
		label: this.label,
		"|": this.vertical,
		afterGosub: this.afterEveryGosub,
		chainMerge: this.chainMerge,
		data: this.data,
		def: this.def,
		"else": this.else,
		ent: this.entOrEnv,
		env: this.entOrEnv,
		everyGosub: this.afterEveryGosub,
		fn: this.fn,
		"for": this.for,
		"if": this.if,
		input: this.inputLineInput,
		lineInput: this.inputLineInput,
		list: this.list,
		mid$Assign: this.mid$Assign,
		onGosub: this.onGotoGosub,
		onGoto: this.onGotoGosub,
		onSqGosub: this.onSqGosub,
		print: this.print,
		rem: this.rem,
		using: this.using
	};
	/* eslint-enable no-invalid-this */


	private fnParseOther(node: ParserNode) {
		const type = node.type,
			typeUc = CodeGeneratorBasic.getUcKeyword(node),
			keyType = BasicParser.keywords[type];
		let args = "";

		if (node.left) {
			args += this.fnParseOneArg(node.left);
		}

		if (!keyType) {
			if (node.value) { // e.g. string,...
				args += node.value;
			}
		}

		if (node.right) {
			args += this.fnParseOneArg(node.right);
		}
		if (node.args) {
			args += this.fnParseArgs(node.args).join(",");
		}
		if (node.args2) { // ELSE part already handled
			throw this.composeError(Error(), "Programming error: args2", node.type, node.pos); // should not occur
		}

		let value: string;

		if (keyType) {
			value = typeUc;
			if (args.length) {
				if (keyType.charAt(0) === "f") { // function with parameters?
					value += "(" + args + ")";
				} else {
					value += CodeGeneratorBasic.fnSpace1(args);
				}
			}
		} else {
			value = args; // for e.g. string
		}
		return CodeGeneratorBasic.fnWs(node) + value;
	}

	private parseNode(node: ParserNode) { // eslint-disable-line complexity
		if (Utils.debug > 3) {
			Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
		}

		const type = node.type,
			precedence = CodeGeneratorBasic.operatorPrecedence,
			operators = CodeGeneratorBasic.operators;
		let value: string;

		if (operators[type]) {
			if (node.left) {
				value = this.parseNode(node.left);
				if (operators[node.left.type] && (node.left.left || node.left.right)) { // binary operator (or unary operator, e.g. not)
					const p = precedence[node.type];
					let pl: number;

					if (node.left.left) { // left is binary
						pl = precedence[node.left.type] || 0;
					} else { // left is unary
						pl = precedence["p" + node.left.type] || precedence[node.left.type] || 0;
					}

					if (pl < p) {
						value = "(" + value + ")";
					}
				}

				const right = node.right as ParserNode;
				let value2 = this.parseNode(right);

				if (operators[right.type] && (right.left || right.right)) { // binary operator (or unary operator, e.g. not)
					const p = precedence[node.type];
					let pr: number;

					if (right.left) { // right is binary
						pr = precedence[right.type] || 0;
					} else {
						pr = precedence["p" + right.type] || precedence[right.type] || 0;
					}

					if ((pr < p) || ((pr === p) && node.type === "-")) { // "-" is special
						value2 = "(" + value2 + ")";
					}
				}

				const whiteBefore = CodeGeneratorBasic.fnWs(node);
				let operator = whiteBefore + operators[type].toUpperCase();

				if (whiteBefore === "" && (/^(and|or|xor|mod)$/).test(type)) {
					operator = " " + operator + " ";
				}

				value += operator + value2;
			} else if (node.right) { // unary operator, e.g. not
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

				const whiteBefore = CodeGeneratorBasic.fnWs(node),
					operator = whiteBefore + operators[type].toUpperCase(),
					whiteAfter = value.startsWith(" ");

				if (!whiteAfter && type === "not") {
					value = " " + value;
				}
				value = operator + value;
			} else { // no operator, e.g. "=" in "for"
				value = this.fnParseOther(node);
			}
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
			const node = this.parseNode(parseTree[i]);

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
		return output;
	}

	generate(input: string, allowDirect?: boolean): IOutput {
		const out: IOutput = {
			text: ""
		};

		this.line = 0;
		try {
			const tokens = this.lexer.lex(input),
				parseTree = this.parser.parse(tokens, allowDirect),
				output = this.evaluate(parseTree);

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
