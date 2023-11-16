// BasicTokenizer.ts - Tokenize BASIC programs
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
// decode based on lbas2ascii.pl, 28.06.2006
// http://cpctech.cpc-live.com/docs/bastech.html
// https://www.cpcwiki.eu/index.php/Technical_information_about_Locomotive_BASIC#BASIC_tokens
//

import { Utils } from "./Utils";

export class BasicTokenizer {
	private pos = 0;
	private line = 0;

	// will also be set in decode
	private lineEnd = 0;
	private input = "";

	private needSpace = false; // hmm

	private readonly debug = {
		startPos: 0,
		line: 0,
		info: ""
	};

	private fnNum8Dec() {
		const num = this.input.charCodeAt(this.pos);

		this.pos += 1;
		return num;
	}

	private fnNum16Dec() {
		return this.fnNum8Dec() + this.fnNum8Dec() * 256;
	}

	private fnNum32Dec() { // used for Floating Point
		return this.fnNum16Dec() + this.fnNum16Dec() * 65536;
	}

	private fnNum8DecAsStr() {
		return String(this.fnNum8Dec());
	}

	private fnNum16DecAsStr() {
		return String(this.fnNum16Dec());
	}

	// line number pointer (can occur when loading snapshots)
	private fnNum16LineAddrAsStr() {
		const prgStart = 0x170, // assuming this as program start
			lineAddr = this.fnNum16Dec() - prgStart, // address of (byte 0 before line)
			addr = lineAddr + 3, // address of line number
			line = this.input.charCodeAt(addr) + this.input.charCodeAt(addr + 1) * 256;

		return String(line);
	}

	private fnNum16Bin() {
		return "&X" + this.fnNum16Dec().toString(2);
	}

	private fnNum16Hex() {
		return "&" + this.fnNum16Dec().toString(16).toUpperCase();
	}

	// floating point numbers (little endian byte order)
	// byte 0: mantissa (bits 7-0)
	// byte 1: mantissa (bits 15-8)
	// byte 2: mantissa (bits 23-16)
	// byte 3: sign, mantissa (bits 30-24)
	// byte 4: exponent
	//
	//
	// examples:
	// 0xa2,0xda,0x0f,0x49,0x82 (PI)
	// 0x00,0x00,0x00,0x00,0x81 (1)
	//
	// 0x00,0x00,0x00,0x00,0x84      ; 10 (10^1)
	// 0x00,0x00,0x00,0x48,0x87      ; 100 (10^2)
	// 0x00,0x00,0x00,0x7A,0x8A      ; 1000 (10^3)
	// 0x00,0x00,0x40,0x1c,0x8e      ; 10000 (10^4) (1E+4)
	// 0x00,0x00,0x50,0x43,0x91      ; 100000 (10^5) (1E+5)
	// 0x00,0x00,0x24,0x74,0x94      ; 1000000 (10^6) (1E+6)
	// 0x00,0x80,0x96,0x18,0x98      ; 10000000 (10^7) (1E+7)
	// 0x00,0x20,0xbc,0x3e,0x9b      ; 100000000 (10^8) (1E+8)
	// 0x00,0x28,0x6b,0x6e,0x9e      ; 1000000000 (10^9) (1E+9)
	// 0x00,0xf9,0x02,0x15,0xa2      ; 10000000000 (10^10) (1E+10)
	// 0x40,0xb7,0x43,0x3a,0xa5      ; 100000000000 (10^11) (1E+11)
	// 0x10,0xa5,0xd4,0x68,0xa8      ; 1000000000000 (10^12) (1E+12)
	// 0x2a,0xe7,0x84,0x11,0xac      ; 10000000000000 (10^13) (1E+13)

	// Check also: https://mfukar.github.io/2015/10/29/amstrad-fp.html
	// Example PI: b=[0xa2,0xda,0x0f,0x49,0x82]; e=b[4]-128; m=(b[3] >= 128 ? -1 : +1) * (0x80000000 + ((b[3] & 0x7f) <<24) + (b[2] << 16) + (b[1] <<8) + b[0]); z=m*Math.pow(2,e-32);console.log(m,e,z)

	private fnNumFp() {
		const value = this.fnNum32Dec(); // signed integer
		let exponent = this.fnNum8Dec(),
			out: string;

		if (!exponent) { // exponent zero? => 0
			out = "0";
		} else { // beware: JavaScript has no unsigned int except for ">>> 0"
			const mantissa = value >= 0 ? value + 0x80000000 : value;

			exponent -= 0x81; // 2-complement: 2^-127 .. 2^128
			const num = mantissa * Math.pow(2, exponent - 31);

			out = Utils.toPrecision9(num);
		}
		return out;
	}

	private fnGetBit7TerminatedString() {
		const data = this.input;
		let pos = this.pos;

		while (data.charCodeAt(pos) <= 0x7f && pos < this.lineEnd) { // last character b7=1 (>= 0x80)
			pos += 1;
		}

		const out = data.substring(this.pos, pos) + String.fromCharCode(data.charCodeAt(pos) & 0x7f); // eslint-disable-line no-bitwise

		if (pos < this.lineEnd) { // maybe corrupted if used in DATA line
			this.pos = pos + 1;
		}
		return out;
	}

	private fnVar() {
		this.fnNum16Dec(); // ignore offset (offset to memory location of variable)
		return this.fnGetBit7TerminatedString();
	}

	private fnIntVar() { // integer variable definition (defined with "%" suffix)
		return this.fnVar() + "%";
	}

	private fnStringVar() { // string variable definition (defined with "$" suffix)
		return this.fnVar() + "$";
	}

	private fnFpVar() { // floating point variable definition (defined with "!" suffix)
		return this.fnVar() + "!";
	}

	private fnRsx() {
		let name = this.fnGetBit7TerminatedString();

		name = name.substring(1); // ignore length (offset to tokens following RSX name)
		return "|" + name;
	}

	private fnStringUntilEol() {
		const out = this.input.substring(this.pos, this.lineEnd - 1); // take remaining line

		this.pos = this.lineEnd;
		return out;
	}

	private fnApostrophe() { // "'" symbol (same function as REM keyword)
		return "'" + this.fnStringUntilEol();
	}

	private fnRem() { // REM
		return "REM" + this.fnStringUntilEol();
	}

	private fnQuotedString() {
		const closingQuotes = this.input.indexOf('"', this.pos);
		let out = "";

		if (closingQuotes < 0 || closingQuotes >= this.lineEnd) { // unclosed quoted string (quotes not found or not in this line)
			out = this.fnStringUntilEol(); // take remaining line
		} else {
			out = this.input.substring(this.pos, closingQuotes + 1);
			this.pos = closingQuotes + 1; // after quotes
		}
		out = '"' + out;
		if (out.indexOf("\r") >= 0) {
			Utils.console.log("BasicTokenizer line", this.line, ": string contains CR, replaced by CHR$(13)");
			out = out.replace(/\r/g, '"+chr$(13)+"');
		}
		if ((/\n\d/).test(out)) {
			Utils.console.log("BasicTokenizer line", this.line, ": string contains LF<digit>, replaced by CHR$(10)<digit>");
			out = out.replace(/\n(\d)/g, '"+chr$(10)+"$1');
		}
		return out;
	}

	// on sq?

	/* eslint-disable no-invalid-this */
	private readonly tokens: Record<string, string | (() => string)> = {
		0x00: "", // marker for "end of tokenised line"
		0x01: ":", // ":" statement seperator
		0x02: this.fnIntVar, // integer variable definition (defined with "%" suffix)
		0x03: this.fnStringVar, // string variable definition (defined with "$" suffix)
		0x04: this.fnFpVar, // floating point variable definition (defined with "!" suffix)
		0x05: "var?",
		0x06: "var?",
		0x07: "var?", // ??
		0x08: "var?", // ??
		0x09: "var?", // ??
		0x0a: "var?", // ??
		0x0b: this.fnVar, // integer variable definition (no suffix)
		0x0c: this.fnVar, // string variable definition (no suffix)
		0x0d: this.fnVar, // floating point or no type (no suffix)
		0x0e: "0", // number constant "0"
		0x0f: "1", // number constant "1"
		0x10: "2", // number constant "2"
		0x11: "3", // number constant "3"
		0x12: "4", // number constant "4"
		0x13: "5", // number constant "5"
		0x14: "6", // number constant "6"
		0x15: "7", // number constant "7"
		0x16: "8", // number constant "8"
		0x17: "9", // number constant "9"
		0x18: "10", // number constant "10"
		0x19: this.fnNum8DecAsStr, // 8-bit integer decimal value
		0x1a: this.fnNum16DecAsStr, // 16-bit integer decimal value
		0x1b: this.fnNum16Bin, // 16-bit integer binary value (with "&X" prefix)
		0x1c: this.fnNum16Hex, // num16Hex: 16-bit integer hexadecimal value (with "&H" or "&" prefix)
		0x1d: this.fnNum16LineAddrAsStr, // 16-bit BASIC program line memory address pointer
		0x1e: this.fnNum16DecAsStr, // 16-bit integer BASIC line number
		0x1f: this.fnNumFp, // floating point value
		// 0x20-0x21 ASCII printable symbols
		0x22: this.fnQuotedString, // '"' quoted string value
		// 0x23-0x7b ASCII printable symbols
		0x7c: this.fnRsx, // "|" symbol; prefix for RSX commands
		0x80: "AFTER",
		0x81: "AUTO",
		0x82: "BORDER",
		0x83: "CALL",
		0x84: "CAT",
		0x85: "CHAIN",
		0x86: "CLEAR",
		0x87: "CLG",
		0x88: "CLOSEIN",
		0x89: "CLOSEOUT",
		0x8a: "CLS",
		0x8b: "CONT",
		0x8c: "DATA",
		0x8d: "DEF",
		0x8e: "DEFINT",
		0x8f: "DEFREAL",
		0x90: "DEFSTR",
		0x91: "DEG",
		0x92: "DELETE",
		0x93: "DIM",
		0x94: "DRAW",
		0x95: "DRAWR",
		0x96: "EDIT",
		0x97: "ELSE", // always with 0x01 0x97
		0x98: "END",
		0x99: "ENT",
		0x9a: "ENV",
		0x9b: "ERASE",
		0x9c: "ERROR",
		0x9d: "EVERY",
		0x9e: "FOR",
		0x9f: "GOSUB",
		0xa0: "GOTO",
		0xa1: "IF",
		0xa2: "INK",
		0xa3: "INPUT",
		0xa4: "KEY",
		0xa5: "LET",
		0xa6: "LINE",
		0xa7: "LIST",
		0xa8: "LOAD",
		0xa9: "LOCATE",
		0xaa: "MEMORY",
		0xab: "MERGE",
		0xac: "MID$",
		0xad: "MODE",
		0xae: "MOVE",
		0xaf: "MOVER",
		0xb0: "NEXT",
		0xb1: "NEW",
		0xb2: "ON",
		0xb3: "ON BREAK",
		0xb4: "ON ERROR GOTO 0", // (on error goto n > 0 is decoded with separate tokens)
		0xb5: "ON SQ",
		0xb6: "OPENIN",
		0xb7: "OPENOUT",
		0xb8: "ORIGIN",
		0xb9: "OUT",
		0xba: "PAPER",
		0xbb: "PEN",
		0xbc: "PLOT",
		0xbd: "PLOTR",
		0xbe: "POKE",
		0xbf: "PRINT",
		0xc0: this.fnApostrophe, // "'" symbol (same function as REM keyword); always with 0x01 0xC0
		0xc1: "RAD",
		0xc2: "RANDOMIZE",
		0xc3: "READ",
		0xc4: "RELEASE",
		0xc5: this.fnRem, // REM
		0xc6: "RENUM",
		0xc7: "RESTORE",
		0xc8: "RESUME",
		0xc9: "RETURN",
		0xca: "RUN",
		0xcb: "SAVE",
		0xcc: "SOUND",
		0xcd: "SPEED",
		0xce: "STOP",
		0xcf: "SYMBOL",
		0xd0: "TAG",
		0xd1: "TAGOFF",
		0xd2: "TROFF",
		0xd3: "TRON",
		0xd4: "WAIT",
		0xd5: "WEND",
		0xd6: "WHILE",
		0xd7: "WIDTH",
		0xd8: "WINDOW",
		0xd9: "WRITE",
		0xda: "ZONE",
		0xdb: "DI",
		0xdc: "EI",
		0xdd: "FILL", // (v1.1)
		0xde: "GRAPHICS", // (v1.1)
		0xdf: "MASK", // (v1.1)
		0xe0: "FRAME", // (v1.1)
		0xe1: "CURSOR", // (v1.1)
		0xe2: "<unused>",
		0xe3: "ERL",
		0xe4: "FN",
		0xe5: "SPC",
		0xe6: "STEP",
		0xe7: "SWAP",
		0xe8: "<unused>",
		0xe9: "<unused>",
		0xea: "TAB",
		0xeb: "THEN",
		0xec: "TO",
		0xed: "USING",
		0xee: ">", // (greater than)
		0xef: "=", // (equal)
		0xf0: ">=", // (greater or equal)
		0xf1: "<", // (less than)
		0xf2: "<>", // (not equal)
		0xf3: "<=", // =<, <=, < = (less than or equal)
		0xf4: "+", // (addition)
		0xf5: "-", // (subtraction or unary minus)
		0xf6: "*", // (multiplication)
		0xf7: "/", // (division)
		0xf8: "^", // (x to the power of y)
		0xf9: "\\", // (integer division)
		0xfa: "AND",
		0xfb: "MOD",
		0xfc: "OR",
		0xfd: "XOR",
		0xfe: "NOT"
		// 0xff: (prefix for additional keywords)
	};
	/* eslint-enable no-invalid-this */

	private readonly tokensFF: Record<number, string> = {
		// Functions with one argument
		0x00: "ABS",
		0x01: "ASC",
		0x02: "ATN",
		0x03: "CHR$",
		0x04: "CINT",
		0x05: "COS",
		0x06: "CREAL",
		0x07: "EXP",
		0x08: "FIX",
		0x09: "FRE",
		0x0a: "INKEY",
		0x0b: "INP",
		0x0c: "INT",
		0x0d: "JOY",
		0x0e: "LEN",
		0x0f: "LOG",
		0x10: "LOG10",
		0x11: "LOWER$",
		0x12: "PEEK",
		0x13: "REMAIN",
		0x14: "SGN",
		0x15: "SIN",
		0x16: "SPACE$",
		0x17: "SQ",
		0x18: "SQR",
		0x19: "STR$",
		0x1a: "TAN",
		0x1b: "UNT",
		0x1c: "UPPER$",
		0x1d: "VAL",

		// Functions without arguments
		0x40: "EOF",
		0x41: "ERR",
		0x42: "HIMEM",
		0x43: "INKEY$",
		0x44: "PI",
		0x45: "RND",
		0x46: "TIME",
		0x47: "XPOS",
		0x48: "YPOS",
		0x49: "DERR", // (v1.1)

		// Functions with more arguments
		0x71: "BIN$",
		0x72: "DEC$", // (v1.1)
		0x73: "HEX$",
		0x74: "INSTR",
		0x75: "LEFT$",
		0x76: "MAX",
		0x77: "MIN",
		0x78: "POS",
		0x79: "RIGHT$",
		0x7a: "ROUND",
		0x7b: "STRING$",
		0x7c: "TEST",
		0x7d: "TESTR",
		0x7e: "COPYCHR$", // (v1.1)
		0x7f: "VPOS"
	}

	private debugPrintInfo() {
		const debug = this.debug;

		Utils.console.debug("BasicTokenizer Details:\n", debug.info);
		debug.line = 0;
		debug.info = "";
	}

	private debugCollectInfo(tokenLine: string) {
		const debug = this.debug,
			hex = this.input.substring(debug.startPos, this.pos).split("").map(function (s) {
				return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
			}).join(",");

		if (this.line !== debug.line) {
			if (debug.info) {
				debug.info += "\n";
			}
			debug.line = this.line;
			debug.info += debug.line + ": ";
		}

		debug.info += " [" + hex + "] " + tokenLine;
	}

	private fnParseNextToken(input: string) {
		const oldNeedSpace = this.needSpace;
		let token = this.fnNum8Dec();

		if (token === 0x01) { // statement seperator ":"?
			if (this.pos < input.length) {
				const nextToken = input.charCodeAt(this.pos); // test next token

				if (nextToken === 0x97 || nextToken === 0xc0) { // ELSE or rem '?
					token = nextToken; // ignore ':'
					this.pos += 1;
				}
			}
		}

		this.needSpace = ((token >= 0x02 && token <= 0x1f) || (token === 0x7c)); // constant 0..9; variable, or RSX?

		let tokenValue: string | (() => string);

		if (token === 0xff) { // extended token?
			token = this.fnNum8Dec(); // get it
			tokenValue = this.tokensFF[token];
		} else {
			tokenValue = this.tokens[token];
		}

		let tstr: string;

		if (tokenValue !== undefined) {
			tstr = typeof tokenValue === "function" ? tokenValue.call(this) : tokenValue;

			if ((/[a-zA-Z0-9.]$/).test(tstr) && token !== 0xe4) { // last character char, number, dot? (not for token "FN")
				this.needSpace = true; // maybe need space next time...
			}
		} else { // normal ASCII
			tstr = String.fromCharCode(token);
		}

		if (oldNeedSpace) {
			if ((/^[a-zA-Z0-9$%!]/).test(tstr) || (token >= 0x02 && token <= 0x1f)) {
				tstr = " " + tstr;
			}
		}
		if (Utils.debug > 2) {
			this.debugCollectInfo(tstr);
		}
		return tstr;
	}

	private fnParseLineFragment() {
		const input = this.input;
		let out = "";

		this.needSpace = false; // only needed in fnParseNextToken
		while (this.pos < this.lineEnd) {
			this.debug.startPos = this.pos;

			const tstr = this.fnParseNextToken(input);

			out += tstr;
		}
		return out;
	}

	private fnParseNextLine() {
		const lineLength = this.fnNum16Dec();

		if (!lineLength) {
			return undefined; // nothing more
		}
		this.line = this.fnNum16Dec();
		this.lineEnd = this.pos - 4 + lineLength;

		if (this.lineEnd > this.input.length) {
			this.lineEnd = this.input.length;
			Utils.console.warn("fnParseNextLine: pos=" + this.pos + ": EOF met!");
		}

		return this.line + " " + this.fnParseLineFragment();
	}

	private fnParseProgram() {
		let out = "",
			line: string | undefined;

		while ((line = this.fnParseNextLine()) !== undefined) {
			out += line + "\n";
			// CPC uses "\r\n" line breaks, JavaScript uses "\n", textArea cannot contain "\r"
		}
		return out;
	}

	decodeLineFragment(program: string, offset: number, length: number): string { // decode tokenized BASIC line fragment to ASCII
		this.input = program;
		this.pos = offset;
		this.line = 0;
		this.lineEnd = this.pos + length;

		const out = this.fnParseLineFragment();

		if (Utils.debug > 2) {
			this.debugPrintInfo();
		}
		return out;
	}

	decode(program: string): string { // decode tokenized BASIC to ASCII
		this.input = program;
		this.pos = 0;
		this.line = 0;

		const out = this.fnParseProgram();

		if (Utils.debug > 2) {
			this.debugPrintInfo();
		}
		return out;
	}
}
