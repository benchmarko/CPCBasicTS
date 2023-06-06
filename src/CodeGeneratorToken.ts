// CodeGeneratorToken.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils, CustomError } from "./Utils";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser"; // BasicParser just for keyword definitions
import { IOutput } from "./Interfaces";

interface CodeGeneratorTokenOptions {
	lexer: BasicLexer
	parser: BasicParser
	quiet?: boolean
	implicitLines?: boolean
}

export class CodeGeneratorToken {
	private readonly lexer: BasicLexer;
	private readonly parser: BasicParser;
	private implicitLines = false;
	private quiet = false;

	private label = ""; // current line (label)

	private statementSeparator: string; // cannot be static when using token2String()

	setOptions(options: Omit<CodeGeneratorTokenOptions, "lexer" | "parser">): void {
		if (options.implicitLines !== undefined) {
			this.implicitLines = options.implicitLines;
		}
		if (options.quiet !== undefined) {
			this.quiet = options.quiet;
		}
	}

	constructor(options: CodeGeneratorTokenOptions) {
		this.lexer = options.lexer;
		this.parser = options.parser;
		this.setOptions(options);

		this.statementSeparator = CodeGeneratorToken.token2String(":");
	}

	private static readonly operators: Record<string, string> = {
		"+": "+",
		"-": "-",
		"*": "*",
		"/": "/",
		"\\": "\\",
		"^": "^",
		and: "and",
		or: "or",
		xor: "xor",
		not: "not",
		mod: "mod",
		">": ">",
		"<": "<",
		">=": ">=",
		"<=": "<=",
		"=": "=",
		"<>": "<>",
		"@": "@",
		"#": "#"
	}

	private static readonly tokens: Record<string, number> = {
		_eol: 0x00, // marker for "end of tokenised line"
		":": 0x01, // ":" statement seperator
		_intVar: 0x02, // integer variable definition (defined with "%" suffix)  "(A-Z)+%"
		_stringVar: 0x03, // string variable definition (defined with "$" suffix)  "(A-Z)+\$"
		_floatVar: 0x04, // floating point variable definition (defined with "!" suffix) "(A-Z)+!"
		// "": 0x05, // "var?"
		// "": 0x06, // "var?"
		// "": 0x07, // "var?"
		// "": 0x08, // "var?"
		// "": 0x09, // "var?"
		// "": 0x0a, // "var?"
		// "": 0x0b, // integer variable definition (no suffix)
		// "": 0x0c, // string variable definition (no suffix)
		_anyVar: 0x0d, // floating point or no type (no suffix)
		0: 0x0e, // number constant "0"
		1: 0x0f, // number constant "1"
		2: 0x10, // number constant "2"
		3: 0x11, // number constant "3"
		4: 0x12, // number constant "4"
		5: 0x13, // number constant "5"
		6: 0x14, // number constant "6"
		7: 0x15, // number constant "7"
		8: 0x16, // number constant "8"
		9: 0x17, // number constant "9"
		10: 0x18, // number constant "10" (not sure when this is used)
		_dec8: 0x19, // 8-bit integer decimal value
		_dec16: 0x1a, // 16-bit integer decimal value
		_bin16: 0x1b, // 16-bit integer binary value (with "&X" prefix)
		_hex16: 0x1c, // num16Hex: 16-bit integer hexadecimal value (with "&H" or "&" prefix)
		// "": 0x1d, // 16-bit BASIC program line memory address pointer (should not occur)
		_line16: 0x1e, // 16-bit integer BASIC line number
		_float: 0x1f, // floating point value
		// 0x20-0x21 ASCII printable symbols (space, "!")
		// "": 0x22, // '"' quoted string value
		// 0x23-0x7b ASCII printable symbols
		"#": 0x23, // "#" character (stream)
		"(": 0x28, // "(" character
		")": 0x29, // ")" character
		",": 0x2c, // "," character
		"?": 0x3f, // "?" character (print)
		"@": 0x40, // "@" character (address of)
		"[": 0x5b, // "[" character
		"]": 0x5d, // "]" character
		"|": 0x7c, // "|" symbol; prefix for RSX commands
		after: 0x80,
		afterGosub: 0x80,
		auto: 0x81,
		border: 0x82,
		call: 0x83,
		cat: 0x84,
		chain: 0x85,
		chainMerge: 0x85, // 0xab85
		clear: 0x86,
		clearInput: 0x86, // 0xa386
		clg: 0x87,
		closein: 0x88,
		closeout: 0x89,
		cls: 0x8a,
		cont: 0x8b,
		data: 0x8c,
		def: 0x8d,
		defint: 0x8e,
		defreal: 0x8f,
		defstr: 0x90,
		deg: 0x91,
		"delete": 0x92,
		dim: 0x93,
		draw: 0x94,
		drawr: 0x95,
		edit: 0x96,
		"else": 0x97,
		end: 0x98,
		ent: 0x99,
		env: 0x9a,
		erase: 0x9b,
		error: 0x9c,
		every: 0x9d,
		everyGosub: 0x9d,
		"for": 0x9e,
		gosub: 0x9f,
		"goto": 0xa0,
		"if": 0xa1,
		ink: 0xa2,
		input: 0xa3,
		key: 0xa4,
		keyDef: 0xa4, // 0x8da4
		let: 0xa5,
		line: 0xa6,
		lineInput: 0xa6, // 0xa3a6
		list: 0xa7,
		load: 0xa8,
		locate: 0xa9,
		memory: 0xaa,
		merge: 0xab,
		mid$: 0xac,
		mid$Assign: 0xac,
		mode: 0xad,
		move: 0xae,
		mover: 0xaf,
		next: 0xb0,
		"new": 0xb1,
		on: 0xb2,
		_onBreak: 0xb3, // onBreakCont, onBreakGosub, onBreakStop
		_onErrorGoto0: 0xb4, // "on error goto 0" (on error goto n > 0 is decoded with separate tokens)
		onGosub: 0xb2,
		onGoto: 0xb2,
		_onSq: 0xb5, // "on sq" (onSqGosub)
		openin: 0xb6,
		openout: 0xb7,
		origin: 0xb8,
		out: 0xb9,
		paper: 0xba,
		pen: 0xbb,
		plot: 0xbc,
		plotr: 0xbd,
		poke: 0xbe,
		print: 0xbf,
		"'": 0xc0, // apostrophe "'" symbol (same function as REM keyword)
		rad: 0xc1,
		randomize: 0xc2,
		read: 0xc3,
		release: 0xc4,
		rem: 0xc5, // rem
		renum: 0xc6,
		restore: 0xc7,
		resume: 0xc8,
		resumeNext: 0xc8, // 0xb0c8
		"return": 0xc9,
		run: 0xca,
		save: 0xcb,
		sound: 0xcc,
		speedInk: 0xcd, // 0xa2cd
		speedKey: 0xcd, // 0xa4cd,
		speedWrite: 0xcd, // 0xd9cd
		stop: 0xce,
		swap: 0xe7,
		symbol: 0xcf,
		symbolAfter: 0xcf, // 0x80cf
		tag: 0xd0,
		tagoff: 0xd1,
		troff: 0xd2,
		tron: 0xd3,
		wait: 0xd4,
		wend: 0xd5,
		"while": 0xd6,
		width: 0xd7,
		window: 0xd8,
		windowSwap: 0xd8, // 0xe7d8
		write: 0xd9,
		zone: 0xda,
		di: 0xdb,
		ei: 0xdc,
		fill: 0xdd, // (v1.1)
		graphics: 0xde, // (v1.1)
		graphicsPaper: 0xde, // 0xbade
		graphicsPen: 0xde, // 0xbbde
		mask: 0xdf, // (v1.1)
		frame: 0xe0, // (v1.1)
		cursor: 0xe1, // (v1.1)
		// "<unused>":         0xe2,
		erl: 0xe3,
		fn: 0xe4,
		spc: 0xe5,
		step: 0xe6,
		// swap: 0xe7, only: windowSwap...
		// "<unused>":         0xe8,
		// "<unused>":         0xe9,
		tab: 0xea,
		then: 0xeb,
		to: 0xec,
		using: 0xed,
		">": 0xee, // (greater than)
		"=": 0xef, // (equal)
		">=": 0xf0, // (greater or equal)
		"<": 0xf1, // (less than)
		"<>": 0xf2, // (not equal)
		"<=": 0xf3, // =<, <=, < = (less than or equal)
		"+": 0xf4, // (addition)
		"-": 0xf5, // (subtraction or unary minus)
		"*": 0xf6, // (multiplication)
		"/": 0xf7, // (division)
		"^": 0xf8, // (x to the power of y)
		"\\": 0xf9, // (integer division)
		and: 0xfa,
		mod: 0xfb,
		or: 0xfc,
		xor: 0xfd,
		not: 0xfe
		// 0xff: (prefix for additional keywords)
	}

	private static readonly tokensFF: Record<string, number> = {
		// Functions with one argument
		abs: 0x00,
		asc: 0x01,
		atn: 0x02,
		chr$: 0x03,
		cint: 0x04,
		cos: 0x05,
		creal: 0x06,
		exp: 0x07,
		fix: 0x08,
		fre: 0x09,
		inkey: 0x0a,
		inp: 0x0b,
		"int": 0x0c,
		joy: 0x0d,
		len: 0x0e,
		log: 0x0f,
		log10: 0x10,
		lower$: 0x11,
		peek: 0x12,
		remain: 0x13,
		sgn: 0x14,
		sin: 0x15,
		space$: 0x16,
		sq: 0x17,
		sqr: 0x18,
		str$: 0x19,
		tan: 0x1a,
		unt: 0x1b,
		upper$: 0x1c,
		val: 0x1d,

		// Functions without arguments
		eof: 0x40,
		err: 0x41,
		himem: 0x42,
		inkey$: 0x43,
		pi: 0x44,
		rnd: 0x45,
		time: 0x46,
		xpos: 0x47,
		ypos: 0x48,
		derr: 0x49, // (v1.1)

		// Functions with more arguments
		bin$: 0x71,
		dec$: 0x72, // (v1.1)
		hex$: 0x73,
		instr: 0x74,
		left$: 0x75,
		max: 0x76,
		min: 0x77,
		pos: 0x78,
		right$: 0x79,
		round: 0x7a,
		string$: 0x7b,
		test: 0x7c,
		testr: 0x7d,
		copychr$: 0x7e, // (v1.1)
		vpos: 0x7f
	}

	private composeError(error: Error, message: string, value: string, pos: number) { // eslint-disable-line class-methods-use-this
		return Utils.composeError("CodeGeneratorToken", error, message, value, pos, undefined, this.label);
	}

	private static convUInt8ToString(n: number) {
		return String.fromCharCode(n);
	}

	private static convUInt16ToString(n: number) {
		return String.fromCharCode(n & 0xff) + String.fromCharCode(n >> 8); // eslint-disable-line no-bitwise
	}

	private static convInt32ToString(n: number) { // used for Floating Point
		return CodeGeneratorToken.convUInt16ToString(n & 0xffff) + CodeGeneratorToken.convUInt16ToString((n >> 16) & 0xffff); // eslint-disable-line no-bitwise
	}

	private static token2String(name: string) {
		let token = CodeGeneratorToken.tokens[name],
			result = "";

		if (token === undefined) {
			token = CodeGeneratorToken.tokensFF[name];

			if (token === undefined) {
				Utils.console.error("token2String: Not a token: " + name);
				return name; // return something
			}
			result = CodeGeneratorToken.convUInt8ToString(0xff); // prefix for special tokens
		}

		result += (token <= 255) ? CodeGeneratorToken.convUInt8ToString(token) : CodeGeneratorToken.convUInt16ToString(token);

		return result;
	}

	private static getBit7TerminatedString(s: string) {
		return s.substring(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) | 0x80); // eslint-disable-line no-bitwise
	}

	private static fnGetWs(node: ParserNode) {
		return node.ws || "";
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

			nodeArgs.push(value);
		}
		return nodeArgs;
	}

	private fnArgs(node: ParserNode) { // special construct to combine tokens
		const nodeArgs = this.fnParseArgs(node.args);

		return nodeArgs.join(node.value);
	}

	private static semicolon(node: ParserNode) {
		return CodeGeneratorToken.fnGetWs(node) + node.value; // ";"
	}

	private colon(node: ParserNode) { // statement separator special token ':'
		return CodeGeneratorToken.fnGetWs(node) + this.statementSeparator; // not ASCII ':'
	}

	private static letter(node: ParserNode) { // for defint, defreal, defstr
		return CodeGeneratorToken.fnGetWs(node) + node.value;
	}

	private range(node: ParserNode) { // for defint, defreal, defstr
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
		}
		const left = this.fnParseOneArg(node.left),
			right = this.fnParseOneArg(node.right);

		return left + CodeGeneratorToken.fnGetWs(node) + node.value + right;
	}

	private linerange(node: ParserNode) { // for delete, list
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
		}
		const left = this.fnParseOneArg(node.left),
			right = this.fnParseOneArg(node.right);

		return left + CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.value) + right;
	}

	private fnParenthesisOpen(node: ParserNode) { // special construct to combine tokens (only used in BasicParser keep brackets mode)
		let value = CodeGeneratorToken.fnGetWs(node) + node.value;

		if (node.args) {
			const nodeArgs = this.fnParseArgs(node.args);

			value += nodeArgs.join("");
		}

		return value;
	}

	private static string(node: ParserNode) {
		return CodeGeneratorToken.fnGetWs(node) + '"' + node.value + '"'; // TODO: how to set unterminated string?
	}
	private static unquoted(node: ParserNode) {
		return CodeGeneratorToken.fnGetWs(node) + node.value;
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
			throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
		}
		return this.fnParseOneArg(node.left) + CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.value) + this.fnParseOneArg(node.right);
	}

	private static floatToByteString(number: number) {
		let mantissa = 0,
			exponent = 0,
			sign = 0;

		if (number !== 0) {
			if (number < 0) {
				sign = 0x80000000;
				number = -number;
			}
			exponent = Math.ceil(Math.log(number) / Math.log(2));
			mantissa = Math.round(number / Math.pow(2, exponent - 32)) & ~0x80000000; // eslint-disable-line no-bitwise
			if (mantissa === 0) {
				exponent += 1;
			}
			exponent += 0x80;
		}

		return CodeGeneratorToken.convInt32ToString(sign + mantissa) + CodeGeneratorToken.convUInt8ToString(exponent);
	}

	private static number(node: ParserNode) {
		const numberString = node.value.toUpperCase(), // maybe "e" inside
			number = Number(numberString);
		let result = "";

		if (number === Math.floor(number)) { // integer?
			if (number >= 0 && number <= 9) { // integer number constant 0-9? (not sure when 10 is used)
				result = CodeGeneratorToken.token2String(numberString);
			} else if (number >= 10 && number <= 0xff) {
				result = CodeGeneratorToken.token2String("_dec8") + CodeGeneratorToken.convUInt8ToString(number);
			} else if (number >= -0x7fff && number <= 0x7fff) {
				result = (number < 0 ? CodeGeneratorToken.token2String("-") : "") + CodeGeneratorToken.token2String("_dec16") + CodeGeneratorToken.convUInt16ToString(number);
			}
		}

		if (result === "") { // no integer number yet, use float...
			result = CodeGeneratorToken.token2String("_float") + CodeGeneratorToken.floatToByteString(number);
		}

		return CodeGeneratorToken.fnGetWs(node) + result;
	}
	private static binnumber(node: ParserNode) {
		const valueString = node.value.slice(2), // remove &x
			value = (valueString.length) ? parseInt(valueString, 2) : 0; // we convert it to dec

		return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_bin16") + CodeGeneratorToken.convUInt16ToString(value);
	}
	private static hexnumber(node: ParserNode) {
		let valueString = node.value.slice(1); // remove &

		if (valueString.charAt(0).toLowerCase() === "h") { // optional h
			valueString = valueString.slice(1); // remove
		}

		const value = (valueString.length) ? parseInt(valueString, 16) : 0; // we convert it to dec

		return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_hex16") + CodeGeneratorToken.convUInt16ToString(value);
	}
	private identifier(node: ParserNode) { // identifier or identifier with array
		let name = node.value, // keep case, maybe mixed
			result;

		if (name.endsWith("!")) { // real number?
			name = name.slice(0, -1);
			result = CodeGeneratorToken.token2String("_floatVar");
		} else if (name.endsWith("%")) { // integer number?
			name = name.slice(0, -1);
			result = CodeGeneratorToken.token2String("_intVar");
		} else if (name.endsWith("$")) { // string?
			name = name.slice(0, -1);
			result = CodeGeneratorToken.token2String("_stringVar");
		} else {
			result = CodeGeneratorToken.token2String("_anyVar");
		}

		name = CodeGeneratorToken.getBit7TerminatedString(name);

		if (node.args) { // args including brackets
			const nodeArgs = this.fnParseArgs(node.args),
				bracketOpen = nodeArgs.shift(),
				bracketClose = nodeArgs.pop();

			name += bracketOpen + nodeArgs.join("") + bracketClose;
		}

		const offset = 0; // (offset to memory location of variable; not used here)

		return CodeGeneratorToken.fnGetWs(node) + result + CodeGeneratorToken.convUInt16ToString(offset) + name;
	}
	private static linenumber(node: ParserNode) {
		const number = Number(node.value);

		return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_line16") + CodeGeneratorToken.convUInt16ToString(number);
	}
	private fnLabel(node: ParserNode) {
		if (this.implicitLines) {
			if (node.value === "") { // direct
				node.value = String(Number(this.label) + 1);
			}
		}
		this.label = node.value; // set line before parsing args

		const line = Number(this.label),
			nodeArgs = this.fnParseArgs(node.args);
		let value = nodeArgs.join("");

		if (node.value !== "") { // direct
			if (value.charAt(0) === " ") { // remove one space (implicit space after label)
				value = value.substring(1);
			}
			value = CodeGeneratorToken.convUInt16ToString(line) + value + CodeGeneratorToken.token2String("_eol"); // no ws
			const len = value.length + 2;

			value = CodeGeneratorToken.convUInt16ToString(len) + value;
		}
		return value;
	}

	// special keyword functions
	private vertical(node: ParserNode) { // "|" for rsx
		const rsxName = node.value.substring(1).toUpperCase(),
			nodeArgs = this.fnParseArgs(node.args),
			offset = 0; // (offset to tokens following RSX name) TODO

		let value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + CodeGeneratorToken.convUInt8ToString(offset) + CodeGeneratorToken.getBit7TerminatedString(rsxName);

		if (nodeArgs.length) {
			value += "," + nodeArgs.join("");
		}
		return value;
	}

	private data(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < nodeArgs.length; i += 1) {
			const value2 = nodeArgs[i];

			nodeArgs[i] = value2;
		}

		let value = nodeArgs.join("");

		value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + value;
		return value;
	}
	private def(node: ParserNode) {
		if (!node.right) {
			return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type); // only def (for key def)
		}

		let name = "";

		if (node.args && node.args.length && node.args[0].type === "identifier") { // combined with fn?
			const nodeLeft = node.args[0], // or: node.left as ParserNode,
				withFn = nodeLeft.value,
				withoutFn = withFn.substring(2); // remove first 2 characters "FN" or "fn"

			nodeLeft.value = withoutFn; // fast hack: without fn

			name = CodeGeneratorToken.fnGetWs(nodeLeft) + CodeGeneratorToken.token2String("fn");

			nodeLeft.ws = ""; // already done for fn part
		}


		const nodeArgs = this.fnParseArgs(node.args),
			expression = this.fnParseOneArg(node.right),
			nodeArgsString = nodeArgs.join("");

		return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + name + nodeArgsString + expression;
	}
	private fnElse(node: ParserNode) { // similar to a comment, with (un?)checked tokens
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
		}

		let value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(":") + CodeGeneratorToken.token2String(node.type); // always prefix with ":"

		const args = node.args;

		// we do not have a parse tree here but a simple list
		for (let i = 0; i < args.length; i += 1) {
			const token = args[i];
			let value2 = token.value;

			if (value2) {
				if (token.type === "linenumber") {
					value2 = CodeGeneratorToken.linenumber(token);
				}
				value += value2;
			}
		}
		return value;
	}

	private fn(node: ParserNode) {
		if (!node.left && !node.right) {
			return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type); // only fn
		}

		const nodeArgs = this.fnParseArgs(node.args),
			nodeArgsString = nodeArgs.join("");
		let name = "";

		if (!node.args || !node.args.length || node.args[0].type !== "identifier") { //TTT fast hack
			name = this.fnParseOneArg(node.left as ParserNode).replace(/FN/i, ""); // get identifier without FN  (ts)
		}

		// We always need to store "fn" as as token and not as a string
		return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + name + nodeArgsString;
	}

	private fnThenOrElsePart(nodeBranch: ParserNode[]) {
		const nodeArgs = this.fnParseArgs(nodeBranch), // args for "then" or "else"
			thenOrElse = nodeArgs.shift();

		return thenOrElse + nodeArgs.join("");
	}

	private fnIf(node: ParserNode) {
		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
		}
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
		}

		let value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + this.fnParseOneArg(node.left);

		value += this.fnThenOrElsePart(node.args); // "then" part

		if (node.args2) {
			value += this.fnThenOrElsePart(node.args2); // "else" part
		}
		return value;
	}

	private mid$Assign(node: ParserNode) {
		if (!node.right) {
			throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur TTT
		}

		const nodeArgs = this.fnParseArgs(node.args);

		return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(node.type) + nodeArgs.join("") + this.fnParseOneArg(node.right);
	}

	private onBreakContOrGosubOrStop(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);
		let name = "";

		if (node.right && node.right.right) { // get which comes after "on break"...
			name = this.fnParseOneArg(node.right.right);
		}

		return CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String("_onBreak") + name + nodeArgs.join("");
	}

	private onErrorGoto(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);
		let value;

		if (node.args && node.args.length && node.args[0].value === "0") { // on error goto 0?
			value = CodeGeneratorToken.token2String("_onErrorGoto0");
		} else {
			value = CodeGeneratorToken.token2String("on") + CodeGeneratorToken.token2String("error") + CodeGeneratorToken.token2String("goto") + nodeArgs.join("");
		}

		return value;
	}

	private onSqGosub(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args);

		return CodeGeneratorToken.token2String("_onSq") + nodeArgs.join("");
	}

	private rem(node: ParserNode) {
		const nodeArgs = this.fnParseArgs(node.args),
			name = CodeGeneratorToken.fnGetWs(node) + (node.value === "'" ? this.statementSeparator : "") + CodeGeneratorToken.token2String(node.value.toLowerCase()), // we use value to get REM or '
			value = nodeArgs.length ? nodeArgs[0] : "";

		return name + value;
	}

	/* eslint-disable no-invalid-this */
	private readonly parseFunctions: Record<string, (node: ParserNode) => string> = { // to call methods, use parseFunctions[].call(this,...)
		args: this.fnArgs,
		"(": this.fnParenthesisOpen,
		";": CodeGeneratorToken.semicolon,
		":": this.colon,
		letter: CodeGeneratorToken.letter,
		range: this.range,
		linerange: this.linerange,
		string: CodeGeneratorToken.string,
		unquoted: CodeGeneratorToken.unquoted,
		"null": CodeGeneratorToken.fnNull,
		assign: this.assign,
		number: CodeGeneratorToken.number,
		expnumber: CodeGeneratorToken.number, // same handling as for number
		binnumber: CodeGeneratorToken.binnumber,
		hexnumber: CodeGeneratorToken.hexnumber,
		identifier: this.identifier,
		linenumber: CodeGeneratorToken.linenumber,
		label: this.fnLabel,
		"|": this.vertical,
		data: this.data,
		def: this.def,
		"else": this.fnElse,
		fn: this.fn,
		"if": this.fnIf,
		mid$Assign: this.mid$Assign,
		onBreakCont: this.onBreakContOrGosubOrStop,
		onBreakGosub: this.onBreakContOrGosubOrStop,
		onBreakStop: this.onBreakContOrGosubOrStop,
		onErrorGoto: this.onErrorGoto,
		onSqGosub: this.onSqGosub,
		rem: this.rem
	};
	/* eslint-enable no-invalid-this */


	private fnParseOther(node: ParserNode) {
		const type = node.type,
			keyType = BasicParser.keywords[type];

		let value = CodeGeneratorToken.fnGetWs(node);

		if (keyType) {
			value += CodeGeneratorToken.token2String(type);
		} else if (node.value) { // e.g. string,...
			value += node.value;
		}

		if (node.left) {
			value += this.fnParseOneArg(node.left);
		}

		if (node.right) {
			value += this.fnParseOneArg(node.right);
		}
		if (node.args) {
			value += this.fnParseArgs(node.args).join("");
		}
		if (node.args2) { // ELSE part already handled
			throw this.composeError(Error(), "Programming error: args2", node.type, node.pos); // should not occur
		}

		return value;
	}

	private parseNode(node: ParserNode) { // eslint-disable-line complexity
		if (Utils.debug > 3) {
			Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
		}

		const type = node.type,
			operators = CodeGeneratorToken.operators;
		let value: string;

		if (operators[type]) {
			if (node.left) {
				value = this.parseNode(node.left);
				const value2 = this.parseNode(node.right as ParserNode);

				value += CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(operators[type]) + value2;
			} else if (node.right) { // unary operator, e.g. 'not', '#'
				if (node.len === 0) {
					value = ""; // ignore dummy token, e.g. '#'
				} else {
					value = this.parseNode(node.right);
					value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(operators[type]) + value;
				}
			} else if (type === "=") { // no operator, "=" in 'for' or 'def fn'
				value = CodeGeneratorToken.fnGetWs(node) + CodeGeneratorToken.token2String(type);
			} else { // should not occur
				value = this.fnParseOther(node);
			}
		} else if (this.parseFunctions[type]) { // function with special handling?
			value = this.parseFunctions[type].call(this, node);
		} else { // for other functions, generate code directly
			value = this.fnParseOther(node);
		}

		if (Utils.debug > 2) {
			Utils.console.debug("parseNode: type='" + type + "', value='" + node.value + "', ws='" + node.ws + "', resultValue='" + value + "'");
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
					output += node;
				} else {
					output = ""; // cls (clear output when node is set to null)
				}
			}
		}
		if (output.length && this.label) {
			output += CodeGeneratorToken.token2String("_eol") + CodeGeneratorToken.token2String("_eol"); // 2 times eol is eof
		}
		return output;
	}

	generate(input: string): IOutput {
		const out: IOutput = {
			text: ""
		};

		this.label = "";
		try {
			const tokens = this.lexer.lex(input),
				parseTree = this.parser.parse(tokens),
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
