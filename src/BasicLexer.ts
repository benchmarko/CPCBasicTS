// BasicLexer.ts - BASIC Lexer
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC lexer for Locomotive BASIC 1.1 for Amstrad CPC 6128
//

// based on an idea of: https://www.codeproject.com/Articles/345888/How-to-write-a-simple-interpreter-in-JavaScript

import { Utils } from "./Utils";

interface BasicLexerOptions {
	keywords: Record<string, string>
	keepWhiteSpace?: boolean,
	quiet?: boolean
}

export interface LexerToken {
	type: string
	value: string
	pos: number
	orig?: string
	ws?: string
}

export class BasicLexer {
	private readonly options: BasicLexerOptions;

	private label = ""; // for error messages
	private takeNumberAsLabel = true; // first number in a line is assumed to be a label (line number)

	private input = ""; // input to analyze
	private index = 0; // position in input
	private readonly tokens: LexerToken[] = [];
	private whiteSpace = ""; // collected whitespace

	constructor(options: BasicLexerOptions) {
		this.options = {
			keepWhiteSpace: false,
			quiet: false
		} as BasicLexerOptions;
		this.setOptions(options);
	}

	getOptions(): BasicLexerOptions {
		return this.options;
	}

	setOptions(options: Partial<BasicLexerOptions>): void {
		Object.assign(this.options, options);
	}

	private composeError(error: Error, message: string, value: string, pos: number, len?: number) {
		return Utils.composeError("BasicLexer", error, message, value, pos, len, this.label || undefined);
	}

	private static isOperatorOrStreamOrAddress(c: string) {
		return (/[+\-*/^=()[\],;:?\\@#]/).test(c);
	}
	private static isComparison(c: string) {
		return (/[<>]/).test(c);
	}
	private static isComparison2(c: string) {
		return (/[<>=]/).test(c);
	}
	private static isDigit(c: string) {
		return (/\d/).test(c);
	}
	private static isSign(c: string) {
		return (/[+-]/).test(c);
	}
	private static isBin(c: string) {
		return (/[01]/).test(c);
	}
	private static isHex(c: string) {
		return (/[0-9A-Fa-f]/).test(c);
	}
	private static isWhiteSpace(c: string) {
		return (/[ \r]/).test(c);
	}
	private static isNotQuotes(c: string) {
		return c !== "" && c !== '"' && c !== "\n"; // quoted string must be in one line!
	}
	private static isIdentifierStart(c: string) {
		return c !== "" && (/[A-Za-z]/).test(c); // cannot use complete [A-Za-z]+[\w]*[$%!]?
	}
	private static isIdentifierMiddle(c: string) {
		return c !== "" && (/[A-Za-z0-9.]/).test(c);
	}
	private static isIdentifierEnd(c: string) {
		return c !== "" && (/[$%!]/).test(c);
	}
	private static isNotNewLine(c: string) {
		return c !== "" && c !== "\n";
	}
	private static isUnquotedData(c: string) {
		return c !== "" && (/[^:,\r\n]/).test(c);
	}

	private testChar(add: number) {
		return this.input.charAt(this.index + add);
	}

	private getChar() {
		return this.input.charAt(this.index);
	}

	private advance() {
		this.index += 1;
		return this.getChar();
	}
	private advanceWhile(char: string, fn: (arg0: string) => boolean) {
		let token = "";

		do {
			token += char;
			char = this.advance();
		} while (fn(char));
		return token;
	}

	private debugCheckValue(type: string, value: string, pos: number, orig?: string) {
		const origValue = orig || value,
			part = this.input.substring(pos, pos + origValue.length);

		if (part !== origValue) {
			Utils.console.debug("BasicLexer:debugCheckValue:", type, part, "<>", origValue, "at pos", pos);
		}
	}

	private addToken(type: string, value: string, pos: number, orig?: string) { // optional original value
		const node: LexerToken = {
			type: type,
			value: value,
			pos: pos
		};

		if (orig !== undefined) {
			if (orig !== value) {
				node.orig = orig;
			}
		}
		if (this.whiteSpace !== "") {
			node.ws = this.whiteSpace;
			this.whiteSpace = "";
		}

		if (Utils.debug > 1) {
			this.debugCheckValue(type, value, pos, node.orig); // check position of added value
		}

		this.tokens.push(node);
	}

	private fnParseExponentialNumber(char: string) {
		// we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
		let token = "",
			index = 1;

		while (BasicLexer.isWhiteSpace(this.testChar(index))) { // whitespace between e and rest?
			index += 1;
		}

		const char1 = this.testChar(index),
			char2 = this.testChar(index + 1);

		if (BasicLexer.isDigit(char1) || (BasicLexer.isSign(char1) && BasicLexer.isDigit(char2))) { // so it is a number
			token += char; // take "E"
			char = this.advance();

			while (BasicLexer.isWhiteSpace(char)) {
				token += char;
				char = this.advance();
			}

			if (BasicLexer.isSign(char)) {
				token += char; // take sign "+" or "-"
				char = this.advance();
			}
			if (BasicLexer.isDigit(char)) {
				token += this.advanceWhile(char, BasicLexer.isDigit);
			}
		}
		return token;
	}

	private fnParseNumber(char: string, startPos: number, startsWithDot: boolean) { // special handling for number
		let token = "";

		if (startsWithDot) {
			token = char;
			char = this.advance();
		}
		token += this.advanceWhile(char, BasicLexer.isDigit); // TODO: isDigitOrSpace: numbers may contain spaces!
		char = this.getChar();
		if (char === "." && !startsWithDot) {
			token += char;
			char = this.advance();
			if (BasicLexer.isDigit(char)) { // digits after dot?
				token += this.advanceWhile(char, BasicLexer.isDigit);
				char = this.getChar();
			}
		}
		let expNumberPart = "";

		if (char === "e" || char === "E") { // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
			expNumberPart = this.fnParseExponentialNumber(char);
			token += expNumberPart;
			if (expNumberPart[1] === " " && !this.options.quiet) {
				Utils.console.warn(this.composeError({} as Error, "Whitespace in exponential number", token, startPos).message);
				// do we really want to allow this?
			}
		}

		const orig = token;

		token = token.replace(/ /g, ""); // remove spaces
		if (!isFinite(Number(token))) { // Infnity?
			throw this.composeError(Error(), "Number is too large or too small", token, startPos); // for a 64-bit double
		}

		const number = expNumberPart ? token : parseFloat(token);

		this.addToken(expNumberPart ? "expnumber" : "number", String(number), startPos, orig); // store number as string
		if (this.takeNumberAsLabel) {
			this.takeNumberAsLabel = false;
			this.label = String(number); // save just for error message
		}
	}
	private fnParseCompleteLineForRemOrApostrophe(char: string, startPos: number) { // special handling for line comment
		if (BasicLexer.isNotNewLine(char)) {
			const token = this.advanceWhile(char, BasicLexer.isNotNewLine);

			char = this.getChar();
			this.addToken("unquoted", token, startPos);
		}
		return char;
	}

	private fnParseWhiteSpace(char: string) {
		const token = this.advanceWhile(char, BasicLexer.isWhiteSpace);

		if (this.options.keepWhiteSpace) {
			this.whiteSpace = token;
		}
	}

	private fnParseUnquoted(char: string, pos: number) {
		const reSpacesAtEnd = new RegExp(/\s+$/);
		let token = this.advanceWhile(char, BasicLexer.isUnquotedData);
		const match = reSpacesAtEnd.exec(token),
			endingSpaces = (match && match[0]) || "";

		token = token.trim(); // remove whitespace before and after; do we need this?
		this.addToken("unquoted", token, pos); // could be interpreted as string or number during runtime
		if (this.options.keepWhiteSpace) {
			this.whiteSpace = endingSpaces;
		}
	}

	private fnParseCompleteLineForData(char: string) { // special handling because strings in data lines need not be quoted
		let pos: number;

		while (BasicLexer.isNotNewLine(char)) {
			if (BasicLexer.isWhiteSpace(char)) {
				this.fnParseWhiteSpace(char);
				char = this.getChar();
			}
			if (char === "\n") { // now newline?
				break;
			}

			pos = this.index;
			if (char === '"') {
				this.fnParseString(pos);
				char = this.getChar();
			} else if (char === ",") { // empty argument?
				// parser can insert dummy token
			} else {
				this.fnParseUnquoted(char, pos);
				char = this.getChar();
			}

			if (BasicLexer.isWhiteSpace(char)) {
				this.fnParseWhiteSpace(char);
				char = this.getChar();
			}

			if (char !== ",") {
				break;
			}
			pos = this.index;
			this.addToken(char, char, pos); // ","
			char = this.advance();

			if (char === "\r") { // IE8 has "/r/n" newlines
				char = this.advance();
			}
		}
	}
	private fnParseIdentifier(char: string, startPos: number) {
		let token = char;

		char = this.advance();
		let lcToken = (token + char).toLowerCase(); // combine first 2 letters

		if (lcToken === "fn" && this.options.keywords[lcToken]) {
			this.addToken(lcToken, token + char, startPos); // create "fn" token
			this.advance();
			return;
		}

		if (BasicLexer.isIdentifierMiddle(char)) {
			token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
			char = this.getChar();
		}
		if (BasicLexer.isIdentifierEnd(char)) {
			token += char;
			char = this.advance();
		}

		lcToken = token.toLowerCase();

		if (this.options.keywords[lcToken]) {
			this.addToken(lcToken, token, startPos);

			if (lcToken === "rem") { // special handling for line comment
				startPos += lcToken.length;
				this.fnParseCompleteLineForRemOrApostrophe(char, startPos);
			} else if (lcToken === "data") { // special handling because strings in data lines need not to be quoted
				this.fnParseCompleteLineForData(char);
			}
		} else {
			this.addToken("identifier", token, startPos);
		}
	}

	private fnParseHexOrBin(char: string, startPos: number) {
		let token = char;

		char = this.advance();
		if (char.toLowerCase() === "x") { // binary?
			token += char;
			char = this.advance();
			if (BasicLexer.isBin(char)) {
				token += this.advanceWhile(char, BasicLexer.isBin);
				this.addToken("binnumber", token, startPos);
			} else {
				throw this.composeError(Error(), "Expected binary number", token, startPos);
			}
		} else { // hex
			if (char.toLowerCase() === "h") { // optional h
				token += char;
				char = this.advance();
			}
			if (BasicLexer.isHex(char)) {
				token += this.advanceWhile(char, BasicLexer.isHex);
				this.addToken("hexnumber", token, startPos);
			} else {
				throw this.composeError(Error(), "Expected hex number", token, startPos);
			}
		}
	}

	private fnTryContinueString(char: string) { // There could be a LF in a string but no CR. In CPCBasic we use LF only as EOL, so we cannot detect the difference.
		let out = "";

		while (char === "\n") {
			const char1 = this.testChar(1);

			if (char1 !== "" && (char1 < "0" || char1 > "9")) { // heuristic: next char not a digit => continue with the (multiline) string
				out += this.advanceWhile(char, BasicLexer.isNotQuotes);
				char = this.getChar();
			} else {
				break;
			}
		}
		return out;
	}

	private fnParseString(startPos: number) {
		let char = "",
			token = this.advanceWhile(char, BasicLexer.isNotQuotes),
			type = "string";

		char = this.getChar();
		if (char !== '"') {
			const contString = this.fnTryContinueString(char); // heuristic to detect an LF in the string

			if (contString) {
				if (Utils.debug) {
					Utils.console.debug(this.composeError({} as Error, "Continued string", token, startPos + 1).message);
				}
				token += contString;
				char = this.getChar();
			}
		}
		if (char === '"') { // not for newline
			this.advance();
		} else {
			if (Utils.debug) {
				Utils.console.debug(this.composeError({} as Error, "Unterminated string", token, startPos + 1).message);
			}
			type = "ustring"; // unterminated string
		}

		this.addToken(type, token, startPos + 1);
	}

	private fnParseRsx(char: string, startPos: number) {
		let token = char;

		char = this.advance();
		if (BasicLexer.isIdentifierMiddle(char)) {
			token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
		}
		this.addToken("|", token, startPos);
	}

	private processNextCharacter(startPos: number) {
		let char = this.getChar(),
			token: string;

		if (BasicLexer.isWhiteSpace(char)) {
			this.fnParseWhiteSpace(char);
		} else if (char === "\n") {
			this.addToken("(eol)", char, startPos);
			this.advance();
			this.takeNumberAsLabel = true;
		} else if (char === "'") { // apostrophe (comment)
			this.addToken(char, char, startPos);
			char = this.advance();
			this.fnParseCompleteLineForRemOrApostrophe(char, startPos + 1);
		} else if (BasicLexer.isOperatorOrStreamOrAddress(char)) {
			this.addToken(char, char, startPos);
			this.advance();
		} else if (BasicLexer.isDigit(char)) { // number starting with a digit?
			this.fnParseNumber(char, startPos, false);
		} else if (char === ".") { // number starting with a dot?
			this.fnParseNumber(char, startPos, true);
		} else if (char === "&") { // isHexOrBin: bin: &X, hex: & or &H
			this.fnParseHexOrBin(char, startPos);
		} else if (char === '"') {
			this.fnParseString(startPos);
		} else if (BasicLexer.isIdentifierStart(char)) {
			this.fnParseIdentifier(char, startPos);
		} else if (char === "|") { // isRsx
			this.fnParseRsx(char, startPos);
		} else if (BasicLexer.isComparison(char)) {
			token = this.advanceWhile(char, BasicLexer.isComparison2);
			this.addToken(token, token, startPos); // like operator
		} else {
			throw this.composeError(Error(), "Unrecognized token", char, startPos);
		}
	}

	lex(input: string): LexerToken[] {
		let startPos: number;

		this.input = input;
		this.index = 0;

		this.label = ""; // for error messages
		this.takeNumberAsLabel = true;
		this.whiteSpace = "";

		this.tokens.length = 0;

		while (this.index < input.length) {
			startPos = this.index;
			this.processNextCharacter(startPos);
		}
		this.addToken("(end)", "", this.index);
		return this.tokens;
	}
}
