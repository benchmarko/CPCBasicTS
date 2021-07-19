// CodeGeneratorToken.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils } from "./Utils";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser"; // BasicParser just for keyword definitions
import { IOutput } from "./Interfaces";

interface CodeGeneratorTokenOptions {
	lexer: BasicLexer
	parser: BasicParser
}

export class CodeGeneratorToken {
	private lexer: BasicLexer;
	private parser: BasicParser;
	private iLine = 0; // current line (label)

	private sStatementSeparator: string; // cannot be static when using token2String()

	constructor(options: CodeGeneratorTokenOptions) {
		this.lexer = options.lexer;
		this.parser = options.parser;

		this.sStatementSeparator = CodeGeneratorToken.token2String(":");
	}

	private static mOperators: { [k: string]: string } = {
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

	private static mOperatorPrecedence: { [k: string]: number } = {
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

	private static mTokens: { [k: string]: number } = {
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
		auto: 0x81,
		border: 0x82,
		call: 0x83,
		cat: 0x84,
		chain: 0x85,
		chainMerge: 0xab85,
		clear: 0x86,
		clearInput: 0xa386,
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
		"for": 0x9e,
		gosub: 0x9f,
		"goto": 0xa0,
		"if": 0xa1,
		ink: 0xa2,
		input: 0xa3,
		key: 0xa4,
		keyDef: 0x8da4,
		let: 0xa5,
		line: 0xa6,
		lineInput: 0xa3a6,
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
		onBreakCont: 0x8bb3, // "on break": 0xb3,
		onBreakGosub: 0x9fb3,
		onBreakStop: 0xceb3,
		_onErrorGoto0: 0xb4, // "on error goto 0" (on error goto n > 0 is decoded with separate tokens)
		_onSq: 0xb5, // "on sq" // onSqGosub
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
		resumeNext: 0xb0c8,
		"return": 0xc9,
		run: 0xca,
		save: 0xcb,
		sound: 0xcc,
		speedInk: 0xa2cd, // "speed": 0xcd
		speedKey: 0xa4cd,
		speedWrite: 0xd9cd,
		stop: 0xce,
		symbol: 0xcf,
		symbolAfter: 0x80cf,
		tag: 0xd0,
		tagoff: 0xd1,
		troff: 0xd2,
		tron: 0xd3,
		wait: 0xd4,
		wend: 0xd5,
		"while": 0xd6,
		width: 0xd7,
		window: 0xd8,
		windowSwap: 0xe7d8,
		write: 0xd9,
		zone: 0xda,
		di: 0xdb,
		ei: 0xdc,
		fill: 0xdd, // (v1.1)
		graphics: 0xde, // (v1.1)
		graphicsPaper: 0xbade,
		graphicsPen: 0xbbde,
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

	private static mTokensFF: { [k: string]: number } = {
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

	private composeError(oError: Error, message: string, value: string, pos: number) { // eslint-disable-line class-methods-use-this
		return Utils.composeError("CodeGeneratorToken", oError, message, value, pos, this.iLine);
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

	private static token2String(sName: string) {
		let iToken = CodeGeneratorToken.mTokens[sName],
			sResult = "";

		if (iToken === undefined) {
			iToken = CodeGeneratorToken.mTokensFF[sName];

			if (iToken === undefined) {
				Utils.console.warn("token2String: Not a token: " + sName);
				return sName; // return something
			}
			sResult = CodeGeneratorToken.convUInt8ToString(0xff); // prefix for special tokens
		}

		sResult += (iToken <= 255) ? CodeGeneratorToken.convUInt8ToString(iToken) : CodeGeneratorToken.convUInt16ToString(iToken);

		return sResult;
	}

	private static getBit7TerminatedString(s: string) {
		return s.substr(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) | 0x80); // eslint-disable-line no-bitwise
	}

	private combineArgsWithSeparator(aNodeArgs: string[]) {
		let sSeparator = "";

		if (aNodeArgs.length > 1 && aNodeArgs[1].charAt(0) !== this.sStatementSeparator) { // no separator for multiple items?
			// (use charAt(0) because of apostrophe with separator prefix)
			sSeparator = this.sStatementSeparator;
		}
		const sValue = aNodeArgs.join(sSeparator);

		return sValue;
	}


	private fnParseOneArg(oArg: ParserNode) {
		let sValue = this.parseNode(oArg);

		if (oArg.ws && oArg.ws !== " ") {
			sValue = oArg.ws + sValue;
		}

		return sValue;
	}

	private fnParseArgs(aArgs: ParserNode[] | undefined) {
		const aNodeArgs: string[] = []; // do not modify node.args here (could be a parameter of defined function)

		if (!aArgs) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
		}

		for (let i = 0; i < aArgs.length; i += 1) {
			const sValue = this.fnParseOneArg(aArgs[i]);

			if (!(i === 0 && sValue === "#" && aArgs[i].type === "#")) { // ignore empty stream as first argument (hmm, not for e.g. data!)
				aNodeArgs.push(sValue);
			}
		}
		return aNodeArgs;
	}

	private fnArgs(node: ParserNode) { // special construct to combine tokens
		const aNodeArgs = this.fnParseArgs(node.args);

		return aNodeArgs.join(node.value);
	}

	private static semicolon(node: ParserNode) {
		return node.value; // ";"
	}

	private colon() { // only used in BasicParser mode which emits colons
		return this.sStatementSeparator;
	}

	private static letter(node: ParserNode) { // for defint, defreal, defstr
		return node.value;
	}

	private range(node: ParserNode) { // for defint, defreal, defstr
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}
		const sLeft = this.fnParseOneArg(node.left),
			sRight = this.fnParseOneArg(node.right);

		return sLeft + "-" + sRight;
	}

	private linerange(node: ParserNode) { // for delete, list
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}
		const sLeft = this.fnParseOneArg(node.left),
			sRight = this.fnParseOneArg(node.right);

		return sLeft + CodeGeneratorToken.token2String("-") + sRight;
	}

	/*
	private static fnDecodeEscapeSequence(str: string) {
		return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
			return String.fromCharCode(parseInt(arguments[1], 16));
		});
	}
	*/

	private fnParenthesisOpen(node: ParserNode) { // special construct to combine tokens (only used in BasicParser keep brackets mode)
		let oValue = node.value;

		if (node.args) {
			const aNodeArgs = this.fnParseArgs(node.args);

			oValue += aNodeArgs.join("");
		}

		return oValue;
	}

	private static string(node: ParserNode) {
		//let sValue = Utils.hexUnescape(node.value);

		//sValue = sValue.replace(/\\\\/g, "\\"); // unescape backslashes
		return '"' + node.value + '"'; //TTT how to set unterminated string?
	}
	private static unquoted(node: ParserNode) {
		//let sValue = Utils.hexUnescape(node.value);

		//sValue = sValue.replace(/\\\\/g, "\\"); // unescape backslashes
		return node.value;
	}
	private static fnNull() { // "null" means: no parameter specified
		return "";
	}
	private assign(node: ParserNode) {
		// see also "let"
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}
		if (node.left.type !== "identifier") {
			throw this.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
		}
		const sValue = this.fnParseOneArg(node.left) + CodeGeneratorToken.token2String("=") + this.fnParseOneArg(node.right);

		return sValue;
	}

	private static floatToByteString(iNumber: number) {
		let iMantissa = 0,
			iExponent = 0,
			iSign = 0;

		if (iNumber !== 0) {
			if (iNumber < 0) {
				iSign = 0x80000000;
				iNumber = -iNumber;
			}
			iExponent = Math.ceil(Math.log(iNumber) / Math.log(2));
			iMantissa = Math.round(iNumber / Math.pow(2, iExponent - 32)) & ~0x80000000; // eslint-disable-line no-bitwise
			iExponent += 0x80;
		}

		const sBytes = CodeGeneratorToken.convInt32ToString(iSign + iMantissa) + CodeGeneratorToken.convUInt8ToString(iExponent);

		return sBytes;
	}

	private static number(node: ParserNode) {
		const sNumber = node.value.toUpperCase(), // maybe "e" inside
			iNumber = Number(sNumber);
		let sResult = "";

		if (iNumber === Math.floor(iNumber)) { // integer?
			if (iNumber >= 0 && iNumber <= 9) { // integer number constant 0-9? (not sure when 10 is used)
				sResult = CodeGeneratorToken.token2String(sNumber);
			} else if (iNumber >= 10 && iNumber <= 0xff) {
				sResult = CodeGeneratorToken.token2String("_dec8") + CodeGeneratorToken.convUInt8ToString(iNumber);
			} else if (iNumber >= -0x7fff && iNumber <= 0x7fff) {
				sResult = (iNumber < 0 ? CodeGeneratorToken.token2String("-") : "") + CodeGeneratorToken.token2String("_dec16") + CodeGeneratorToken.convUInt16ToString(iNumber);
			}
		}

		if (sResult === "") { // no integer number yet, use float...
			sResult = CodeGeneratorToken.token2String("_float") + CodeGeneratorToken.floatToByteString(iNumber);
		}

		return sResult;
	}
	private static binnumber(node: ParserNode) {
		const sValue = node.value.slice(2), // remove &x
			iValue = (sValue.length) ? parseInt(sValue, 2) : 0; // we convert it to dec

		return CodeGeneratorToken.token2String("_bin16") + CodeGeneratorToken.convUInt16ToString(iValue);
	}
	private static hexnumber(node: ParserNode) {
		let sValue = node.value.slice(1); // remove &

		if (sValue.charAt(0).toLowerCase() === "h") { // optional h
			sValue = sValue.slice(1); // remove
		}

		const iValue = (sValue.length) ? parseInt(sValue, 16) : 0; // we convert it to dec

		return CodeGeneratorToken.token2String("_hex16") + CodeGeneratorToken.convUInt16ToString(iValue);
	}
	private identifier(node: ParserNode) { // identifier or identifier with array
		let sName = node.value, // keep case, maybe mixed
			sResult;

		if (sName.endsWith("!")) { // real number?
			sName = sName.slice(0, -1);
			sResult = CodeGeneratorToken.token2String("_floatVar");
		} else if (sName.endsWith("%")) { // integer number?
			sName = sName.slice(0, -1);
			sResult = CodeGeneratorToken.token2String("_intVar");
		} else if (sName.endsWith("$")) { // string?
			sName = sName.slice(0, -1);
			sResult = CodeGeneratorToken.token2String("_stringVar");
		} else {
			sResult = CodeGeneratorToken.token2String("_anyVar");
		}

		sName = CodeGeneratorToken.getBit7TerminatedString(sName);

		if (node.args) { // args including brackets
			const aNodeArgs = this.fnParseArgs(node.args),
				sBracketOpen = aNodeArgs.shift(),
				sBracketClose = aNodeArgs.pop();

			sName += sBracketOpen + aNodeArgs.join(",") + sBracketClose;
		}

		const iOffset = 0; // (offset to memory location of variable; not used here)

		return sResult + CodeGeneratorToken.convUInt16ToString(iOffset) + sName;
	}
	private static linenumber(node: ParserNode) {
		const iNumber = Number(node.value);

		return CodeGeneratorToken.token2String("_line16") + CodeGeneratorToken.convUInt16ToString(iNumber);
	}
	private label(node: ParserNode) {
		this.iLine = Number(node.value); // set line before parsing args

		const iLine = this.iLine,
			aNodeArgs = this.fnParseArgs(node.args);
		let sValue = this.combineArgsWithSeparator(aNodeArgs);

		if (node.value !== "direct") {
			sValue = CodeGeneratorToken.convUInt16ToString(iLine) + sValue + CodeGeneratorToken.token2String("_eol");
			const iLen = sValue.length + 2;

			sValue = CodeGeneratorToken.convUInt16ToString(iLen) + sValue;
		}
		return sValue;
	}

	// special keyword functions
	private vertical(node: ParserNode) { // "|" for rsx
		const sRsxName = node.value.substr(1).toUpperCase(),
			aNodeArgs = this.fnParseArgs(node.args),
			iOffset = 0; // (offset to tokens following RSX name) TODO

		let sValue = CodeGeneratorToken.token2String(node.type) + CodeGeneratorToken.convUInt8ToString(iOffset) + CodeGeneratorToken.getBit7TerminatedString(sRsxName);

		if (aNodeArgs.length) {
			sValue += "," + aNodeArgs.join(",");
		}
		return sValue;
	}
	private afterGosub(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue = CodeGeneratorToken.token2String("after") + aNodeArgs[0];

		if (aNodeArgs[1]) {
			sValue += "," + aNodeArgs[1];
		}
		sValue += CodeGeneratorToken.token2String("gosub") + aNodeArgs[2];
		return sValue;
	}
	private chainMerge(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let	sValue = CodeGeneratorToken.token2String(node.type);

		if (aNodeArgs.length === 3) {
			aNodeArgs[2] = CodeGeneratorToken.token2String("delete") + aNodeArgs[2];
		}

		sValue += aNodeArgs.join(",");

		return sValue;
	}
	private data(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < aNodeArgs.length; i += 1) {
			const sValue2 = aNodeArgs[i];

			aNodeArgs[i] = sValue2;
		}

		let sValue = aNodeArgs.join("");

		if (sValue !== "" && sValue !== "," && sValue !== '"') { // argument?
			sValue = " " + sValue;
		}

		sValue = CodeGeneratorToken.token2String(node.type) + sValue;

		return sValue;
	}
	private def(node: ParserNode) {
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}

		const sWithFn = node.left.value,
			sWithoutFn = sWithFn.substr(2); // remove first 2 characters "FN" or "fn"

		node.left.value = sWithoutFn; // fast hack: without fn

		const sName = this.fnParseOneArg(node.left);

		(node.left as ParserNode).value = sWithFn; // fast hack: restore

		const sSpace = node.left.bSpace ? " " : "", // fast hack
			aNodeArgs = this.fnParseArgs(node.args),
			sExpression = this.fnParseOneArg(node.right);
		let sNodeArgs = aNodeArgs.join(",");

		if (sNodeArgs !== "") { // not empty?
			sNodeArgs = "(" + sNodeArgs + ")";
		}

		const sValue = CodeGeneratorToken.token2String(node.type) + " " + CodeGeneratorToken.token2String("fn") + sSpace + sName + sNodeArgs + CodeGeneratorToken.token2String("=") + sExpression;

		return sValue;
	}
	private "else"(node: ParserNode) { // similar to a comment, with (un?)checked tokens
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
		}

		let sValue = CodeGeneratorToken.token2String(":") + CodeGeneratorToken.token2String(node.type); // always prefix with ":"

		const aArgs = node.args;

		// we do not have a parse tree here but a simple list
		for (let i = 0; i < aArgs.length; i += 1) {
			const oToken = aArgs[i];
			let sValue2 = oToken.value;

			if (sValue2) {
				if (oToken.type === "linenumber") {
					sValue2 = CodeGeneratorToken.linenumber(oToken);
				}
				sValue += sValue2;
			}
		}
		return sValue;
	}
	private entEnv(node: ParserNode) { // "ent" or "env"
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
		}

		const aArgs = node.args,
			aNodeArgs = [];
		let bEqual = false;

		for (let i = 0; i < aArgs.length; i += 1) {
			if (aArgs[i].type !== "null") {
				let sArg = this.fnParseOneArg(aArgs[i]);

				if (bEqual) {
					sArg = "=" + sArg;
					bEqual = false;
				}
				aNodeArgs.push(sArg);
			} else {
				bEqual = true;
			}
		}
		const sValue = CodeGeneratorToken.token2String(node.type) + " " + aNodeArgs.join(",");

		return sValue;
	}

	private everyGosub(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue = CodeGeneratorToken.token2String("every") + aNodeArgs[0];

		if (aNodeArgs[1]) {
			sValue += "," + aNodeArgs[1];
		}
		sValue += CodeGeneratorToken.token2String("gosub") + aNodeArgs[2];
		return sValue;
	}
	private fn(node: ParserNode) {
		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
		}

		const aNodeArgs = this.fnParseArgs(node.args),
			sName = this.fnParseOneArg(node.left).replace(/FN/i, ""), // get identifier without FN
			sSpace = node.value.indexOf(" ") >= 0 ? " " : "";
		let sNodeArgs = aNodeArgs.join(",");

		if (sNodeArgs !== "") { // not empty?
			sNodeArgs = "(" + sNodeArgs + ")";
		}

		const sName2 = CodeGeneratorToken.token2String(node.type) + sSpace + sName,
			sValue = sName2 + sNodeArgs;

		return sValue;
	}
	private "for"(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sVarName = aNodeArgs[0],
			startValue = aNodeArgs[1],
			endValue = aNodeArgs[2],
			stepValue = aNodeArgs[3];
		let sValue = CodeGeneratorToken.token2String(node.type) + sVarName + CodeGeneratorToken.token2String("=") + startValue + CodeGeneratorToken.token2String("to") + endValue;

		if (stepValue !== "") { // "null" is ""
			sValue += CodeGeneratorToken.token2String("step") + stepValue;
		}
		return sValue;
	}

	private fnThenOrElsePart(oNodeBranch: ParserNode[]) {
		const aNodeArgs = this.fnParseArgs(oNodeBranch); // args for "then" oe "else"

		if (oNodeBranch.length && oNodeBranch[0].type === "goto" && oNodeBranch[0].len === 0) { // inserted goto?
			aNodeArgs[0] = this.fnParseOneArg(oNodeBranch[0].args![0]); // take just line number
		}
		return this.combineArgsWithSeparator(aNodeArgs);
	}

	private "if"(node: ParserNode) {
		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
		}
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}

		let sValue = CodeGeneratorToken.token2String(node.type) + this.fnParseOneArg(node.left) + CodeGeneratorToken.token2String("then");

		/*
		const oNodeBranch = node.args,
			aNodeArgs = this.fnParseArgs(oNodeBranch); // args for "then"

		if (oNodeBranch.length && oNodeBranch[0].type === "goto" && oNodeBranch[0].len === 0) { // inserted goto?
			aNodeArgs[0] = this.fnParseOneArg(oNodeBranch[0].args![0]); // take just line number
		}
		sValue += this.combineArgsWithSeparator(aNodeArgs);
		*/

		sValue += this.fnThenOrElsePart(node.args); // "then" part

		if (node.args2) {
			if (!sValue.endsWith(this.sStatementSeparator)) {
				sValue += this.sStatementSeparator; // ":" before "else"!
			}

			sValue += CodeGeneratorToken.token2String("else") + this.fnThenOrElsePart(node.args2); // "else" part
			/*
			const oNodeBranch2 = node.args2,
				aNodeArgs2 = this.fnParseArgs(oNodeBranch2); // args for "else"

			if (oNodeBranch2.length && oNodeBranch2[0].type === "goto" && oNodeBranch2[0].len === 0) { // inserted goto?
				aNodeArgs2[0] = this.fnParseOneArg(oNodeBranch2[0].args![0]); // take just line number
			}
			sValue += this.combineArgsWithSeparator(aNodeArgs2);
			*/
		}
		return sValue;
	}


	private static fnHasStream(node: ParserNode) {
		const bHasStream = node.args && node.args.length && (node.args[0].type === "#") && node.args[0].right && (node.args[0].right.type !== "null");

		return bHasStream;
	}

	private inputLineInput(node: ParserNode) { // input or line input
		const aNodeArgs = this.fnParseArgs(node.args),
			bHasStream = CodeGeneratorToken.fnHasStream(node);
		let sValue = CodeGeneratorToken.token2String(node.type),
			i = 0;

		if (bHasStream) { // stream?
			i += 1;
		}

		if (aNodeArgs.length && !bHasStream && String(aNodeArgs[0]).charAt(0) !== '"') {
			// TODO: empty CRLF marker
			sValue += " ";
		}

		aNodeArgs.splice(i, 4, aNodeArgs[i] + aNodeArgs[i + 1] + aNodeArgs[i + 2] + aNodeArgs[i + 3]); // combine 4 elements into one
		sValue += aNodeArgs.join(",");
		return sValue;
	}
	private list(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		if (aNodeArgs.length && aNodeArgs[0] === "") { // empty range?
			aNodeArgs.shift(); // remove
		}

		if (aNodeArgs.length && aNodeArgs[aNodeArgs.length - 1] === "#") { // dummy stream?
			aNodeArgs.pop(); // remove
		}

		let sValue = aNodeArgs.join(",");
		const sName = CodeGeneratorToken.token2String(node.type);

		sValue = sName + sValue;
		return sValue;
	}
	private mid$Assign(node: ParserNode) {
		if (!node.right) {
			throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure TTT
		}

		const aNodeArgs = this.fnParseArgs(node.args),
			sValue = CodeGeneratorToken.token2String(node.type) + "(" + aNodeArgs.join(",") + ")" + CodeGeneratorToken.token2String("=") + this.fnParseOneArg(node.right);

		return sValue;
	}
	private onErrorGoto(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue;

		if (node.args && node.args.length && node.args[0].value === "0") { // on error goto 0?
			sValue = CodeGeneratorToken.token2String("_onErrorGoto0");
		} else {
			sValue = CodeGeneratorToken.token2String("on") + CodeGeneratorToken.token2String("error") + CodeGeneratorToken.token2String("goto") + aNodeArgs.join(",");
		}

		return sValue;
	}

	private onGotoGosub(node: ParserNode) {
		const sLeft = this.fnParseOneArg(node.left as ParserNode),
			aNodeArgs = this.fnParseArgs(node.args),
			sType2 = node.type === "onGoto" ? "goto" : "gosub";

		return CodeGeneratorToken.token2String("on") + sLeft + CodeGeneratorToken.token2String(sType2) + aNodeArgs.join(",");
	}

	private onSqGosub(node: ParserNode) {
		const sLeft = this.fnParseOneArg(node.left as ParserNode),
			aNodeArgs = this.fnParseArgs(node.args),
			sValue = CodeGeneratorToken.token2String("_onSq") + "(" + sLeft + ")" + CodeGeneratorToken.token2String("gosub") + aNodeArgs.join(",");

		return sValue;
	}
	private print(node: ParserNode) {
		const regExp = new RegExp("[a-zA-Z0-9.]"),
			aNodeArgs = this.fnParseArgs(node.args),
			bHasStream = CodeGeneratorToken.fnHasStream(node),
			sToken = node.value.toLowerCase(); // we use value to get PRINT or ?
		let	sValue = CodeGeneratorToken.token2String(node.type); // print and ? are tokenized as print, or use sToken here to keep it different

		if (sToken === "print" && aNodeArgs.length && !bHasStream) { // PRINT with args and not stream?
			sValue += " ";
		}
		if (bHasStream && aNodeArgs.length > 1) { // more args after stream?
			aNodeArgs[0] = String(aNodeArgs[0]) + ",";
		}

		for (let i = 0; i < aNodeArgs.length; i += 1) {
			const sArg = String(aNodeArgs[i]);

			if (regExp.test(sValue.charAt(sValue.length - 1)) && regExp.test(sArg.charAt(0))) { // last character and first character of next arg: char, number, dot? (not for token "FN"??)
				sValue += " "; // additional space
			}
			sValue += aNodeArgs[i];
		}
		return sValue;
	}
	private rem(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue = aNodeArgs.length ? aNodeArgs[0] : "",
			sName = CodeGeneratorToken.token2String(node.value.toLowerCase()); // we use value to get REM or '

		if (node.value !== "'") { // for "rem"
			if (sValue !== "") {
				sValue = " " + sValue; // add removed space
			}
		} else { // apostrophe
			sName = this.sStatementSeparator + sName; // always prefix apostrophe with ":"
		}

		return sName + sValue;
	}
	private using(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		let sTemplate = aNodeArgs.shift();

		if (sTemplate && sTemplate.charAt(0) !== '"') { // not a string => space required
			sTemplate = " " + sTemplate;
		}
		const sValue = CodeGeneratorToken.token2String(node.type) + sTemplate + ";" + aNodeArgs.join(","); // separator between args could be "," or ";", we use ","

		return sValue;
	}

	/* eslint-disable no-invalid-this */
	mParseFunctions: { [k: string]: (node: ParserNode) => string } = { // to call methods, use mParseFunctions[].call(this,...)
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
		binnumber: CodeGeneratorToken.binnumber,
		hexnumber: CodeGeneratorToken.hexnumber,
		identifier: this.identifier,
		linenumber: CodeGeneratorToken.linenumber,
		label: this.label,
		"|": this.vertical,
		afterGosub: this.afterGosub,
		chainMerge: this.chainMerge,
		data: this.data,
		def: this.def,
		"else": this.else,
		ent: this.entEnv,
		env: this.entEnv,
		everyGosub: this.everyGosub,
		fn: this.fn,
		"for": this.for,
		"if": this.if,
		input: this.inputLineInput,
		lineInput: this.inputLineInput,
		list: this.list,
		mid$Assign: this.mid$Assign,
		onErrorGoto: this.onErrorGoto,
		onGosub: this.onGotoGosub,
		onGoto: this.onGotoGosub,
		onSqGosub: this.onSqGosub,
		print: this.print,
		rem: this.rem,
		using: this.using
	};
	/* eslint-enable no-invalid-this */


	private fnParseOther(node: ParserNode) {
		const sType = node.type,
			sKeyType = BasicParser.mKeywords[sType];
		let sValue = CodeGeneratorToken.token2String(sType),
			sArgs = "";

		if (node.left) {
			sArgs += this.fnParseOneArg(node.left);
		}

		if (!sKeyType) {
			if (node.value) { // e.g. string,...
				sArgs += node.value;
			}
		}

		if (node.right) {
			sArgs += this.fnParseOneArg(node.right);
		}
		if (node.args) {
			sArgs += this.fnParseArgs(node.args).join(",");
		}
		if (node.args2) { // ELSE part already handled
			throw this.composeError(Error(), "Programming error: args2", node.type, node.pos); // should not occur
		}

		// for e.g. tab, spc...
		if (sKeyType) {
			if (sArgs.length) {
				if (sKeyType.charAt(0) === "f") { // function with parameters?
					sValue += "(" + sArgs + ")";
				} else {
					if (sArgs.charAt(0) !== "#") { // only if not a stream
						sValue += " ";
					}
					sValue += sArgs;
				}
			}
		} else {
			sValue = sArgs; // for e.g. string
		}

		return sValue;
	}

	private parseNode(node: ParserNode) { // eslint-disable-line complexity
		if (Utils.debug > 3) {
			Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
		}

		const sType = node.type,
			mPrecedence = CodeGeneratorToken.mOperatorPrecedence,
			mOperators = CodeGeneratorToken.mOperators;
		let value: string;

		if (mOperators[sType]) {
			if (node.left) {
				value = this.parseNode(node.left);
				if (mOperators[node.left.type] && (node.left.left || node.left.right)) { // binary operator (or unary operator, e.g. not)
					const p = mPrecedence[node.type];
					let pl: number;

					if (node.left.left) { // left is binary
						pl = mPrecedence[node.left.type] || 0;
					} else { // left is unary
						pl = mPrecedence["p" + node.left.type] || mPrecedence[node.left.type] || 0;
					}

					if (pl < p) {
						value = "(" + value + ")";
					}
				}

				const oRight = node.right as ParserNode;
				let value2 = this.parseNode(oRight);

				if (mOperators[oRight.type] && (oRight.left || oRight.right)) { // binary operator (or unary operator, e.g. not)
					const p = mPrecedence[node.type];
					let pr: number;

					if (oRight.left) { // right is binary
						pr = mPrecedence[oRight.type] || 0;
					} else {
						pr = mPrecedence["p" + oRight.type] || mPrecedence[oRight.type] || 0;
					}

					if ((pr < p) || ((pr === p) && node.type === "-")) { // "-" is special
						value2 = "(" + value2 + ")";
					}
				}
				value += CodeGeneratorToken.token2String(mOperators[sType]) + value2;
			} else { // unary operator
				const oRight = node.right as ParserNode;

				value = this.parseNode(oRight);
				let pr: number;

				if (oRight.left) { // was binary op?
					pr = mPrecedence[oRight.type] || 0; // no special prio
				} else {
					pr = mPrecedence["p" + oRight.type] || mPrecedence[oRight.type] || 0; // check unary operator first
				}

				const p = mPrecedence["p" + node.type] || mPrecedence[node.type] || 0; // check unary operator first

				if (p && pr && (pr < p)) {
					value = "(" + value + ")";
				}

				value = CodeGeneratorToken.token2String(mOperators[sType]) + value;
			}
		} else if (this.mParseFunctions[sType]) { // function with special handling?
			value = this.mParseFunctions[sType].call(this, node);
		} else { // for other functions, generate code directly
			value = this.fnParseOther(node);
		}

		return value;
	}

	private evaluate(parseTree: ParserNode[]) {
		let sOutput = "";

		for (let i = 0; i < parseTree.length; i += 1) {
			if (Utils.debug > 2) {
				Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
			}
			const sNode = this.parseNode(parseTree[i]);

			if ((sNode !== undefined) && (sNode !== "")) {
				if (sNode !== null) {
					sOutput += sNode;
				} else {
					sOutput = ""; // cls (clear output when sNode is set to null)
				}
			}
		}
		if (sOutput.length && this.iLine) {
			sOutput += CodeGeneratorToken.token2String("_eol") + CodeGeneratorToken.token2String("_eol"); // 2 times eol is eof
		}
		return sOutput;
	}

	generate(sInput: string, bAllowDirect?: boolean): IOutput {
		const oOut: IOutput = {
			text: ""
		};

		this.iLine = 0;
		try {
			const aTokens = this.lexer.lex(sInput),
				aParseTree = this.parser.parse(aTokens, bAllowDirect),
				sOutput = this.evaluate(aParseTree);

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
