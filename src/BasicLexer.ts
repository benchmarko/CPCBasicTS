// BasicLexer.ts - BASIC Lexer
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC lexer for Locomotive BASIC 1.1 for Amstrad CPC 6128
//

// based on an idea of: https://www.codeproject.com/Articles/345888/How-to-write-a-simple-interpreter-in-JavaScript

import { Utils } from "./Utils";

interface BasicLexerOptions {
	quiet?: boolean
	keepWhiteSpace?: boolean
}

export interface LexerToken {
	type: string
	value: string
	pos: number
	orig?: string
	ws?: string
}

export class BasicLexer {
	private quiet = false;
	private keepWhiteSpace = false;

	private line = "0"; // for error messages
	private takeNumberAsLinenumber = true; // first number in a line is assumed to be a line number

	private input = ""; // input to analyze
	private index = 0; // position in input
	private readonly tokens: LexerToken[] = [];
	private whiteSpace = ""; // collected whitespace

	setOptions(options: BasicLexerOptions): void {
		this.quiet = options.quiet || false;
		this.keepWhiteSpace = options.keepWhiteSpace || false;
	}

	constructor(options?: BasicLexerOptions) {
		if (options) {
			this.setOptions(options);
		}
	}

	private composeError(error: Error, message: string, value: string, pos: number) {
		return Utils.composeError("BasicLexer", error, message, value, pos, undefined, this.line);
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
	private static isBin2(c: string) {
		return (/[01]/).test(c);
	}
	private static isHex2(c: string) {
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
			part = this.input.substr(pos, origValue.length);

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

	private fnParseNumber(char: string, startPos: number, startsWithDot: boolean) { // special handling for number
		let token = "";

		if (startsWithDot) {
			token += char;
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
		if (char === "e" || char === "E") { // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
			const char1 = this.testChar(1),
				char2 = this.testChar(2);

			if (BasicLexer.isDigit(char1) || (BasicLexer.isSign(char1) && BasicLexer.isDigit(char2))) { // so it is a number
				token += char; // take "E"
				char = this.advance();
				if (BasicLexer.isSign(char)) {
					token += char; // take sign "+" or "-"
					char = this.advance();
				}
				if (BasicLexer.isDigit(char)) {
					token += this.advanceWhile(char, BasicLexer.isDigit);
				}
			}
		}
		token = token.trim(); // remove trailing spaces
		if (!isFinite(Number(token))) { // Infnity?
			throw this.composeError(Error(), "Number is too large or too small", token, startPos); // for a 64-bit double
		}
		const number = parseFloat(token);

		this.addToken("number", String(number), startPos, token); // store number as string
		if (this.takeNumberAsLinenumber) {
			this.takeNumberAsLinenumber = false;
			this.line = String(number); // save just for error message
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
	private fnParseCompleteLineForData(char: string, startPos: number) { // special handling because strings in data lines need not be quoted
		const reSpacesAtEnd = new RegExp(/\s+$/);
		let pos: number,
			token: string;

		while (BasicLexer.isNotNewLine(char)) {
			if (BasicLexer.isWhiteSpace(char)) {
				token = this.advanceWhile(char, BasicLexer.isWhiteSpace);

				char = this.getChar();
				if (this.keepWhiteSpace) {
					this.whiteSpace = token;
				}
			}
			if (char === "\n") { // now newline?
				break;
			}

			pos = this.index;
			if (char === '"') {
				char = "";
				token = this.advanceWhile(char, BasicLexer.isNotQuotes);

				char = this.getChar();
				if (char !== '"') {
					if (!this.quiet) {
						Utils.console.log(this.composeError({} as Error, "Unterminated string", token, startPos + 1).message);
					}
				}
				this.addToken("string", token, pos + 1); // this is a quoted string (but we cannot detect it during runtime)
				if (char === '"') { // not for newline
					char = this.advance();
				}
			} else if (char === ",") { // empty argument?
				// parser can insert dummy token
			} else {
				token = this.advanceWhile(char, BasicLexer.isUnquotedData);

				char = this.getChar();

				const match = reSpacesAtEnd.exec(token),
					endingSpaces = (match && match[0]) || "";

				token = token.trim(); // remove whitespace before and after; do we need this?
				this.addToken("unquoted", token, pos); // could be interpreted as string or number during runtime
				if (this.keepWhiteSpace) {
					this.whiteSpace = endingSpaces;
				}
			}

			if (BasicLexer.isWhiteSpace(char)) {
				token = this.advanceWhile(char, BasicLexer.isWhiteSpace);

				char = this.getChar();
				if (this.keepWhiteSpace) {
					this.whiteSpace = token;
				}
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
		if (BasicLexer.isIdentifierMiddle(char)) {
			token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
			char = this.getChar();
		}
		if (BasicLexer.isIdentifierEnd(char)) {
			token += char;
			char = this.advance();
		}
		this.addToken("identifier", token, startPos);
		token = token.toLowerCase();

		if (token === "rem") { // special handling for line comment
			startPos += token.length;
			if (char === " ") { // ignore first space
				if (this.keepWhiteSpace) {
					this.whiteSpace = char;
				}
				char = this.advance();
				startPos += 1;
			}
			this.fnParseCompleteLineForRemOrApostrophe(char, startPos);
			this.getChar();
		} else if (token === "data") { // special handling because strings in data lines need not to be quoted
			this.fnParseCompleteLineForData(char, startPos);
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

	private processNextCharacter(startPos: number) {
		let char = this.getChar(),
			token: string;

		if (BasicLexer.isWhiteSpace(char)) {
			token = this.advanceWhile(char, BasicLexer.isWhiteSpace);
			char = this.getChar();
			if (this.keepWhiteSpace) {
				this.whiteSpace = token;
			}
		} else if (char === "\n") {
			this.addToken("(eol)", "", startPos);
			char = this.advance();
			this.takeNumberAsLinenumber = true;
		} else if (char === "'") { // apostrophe, comment
			this.addToken(char, char, startPos);
			char = this.advance();
			this.fnParseCompleteLineForRemOrApostrophe(char, startPos + 1);
		} else if (BasicLexer.isOperatorOrStreamOrAddress(char)) {
			this.addToken(char, char, startPos);
			char = this.advance();
		} else if (BasicLexer.isDigit(char)) {
			this.fnParseNumber(char, startPos, false);
		} else if (char === ".") { // number starting with dot?
			this.fnParseNumber(char, startPos, true);
		} else if (char === "&") { // isHexOrBin: bin: &X, hex: & or &H
			token = char;
			char = this.advance();
			if (char.toLowerCase() === "x") { // binary?
				token += this.advanceWhile(char, BasicLexer.isBin2);
				char = this.getChar();
				this.addToken("binnumber", token, startPos);
			} else { // hex
				if (char.toLowerCase() === "h") { // optional h
					token += char;
					char = this.advance();
				}
				if (BasicLexer.isHex2(char)) {
					token += this.advanceWhile(char, BasicLexer.isHex2);
					char = this.getChar();
					this.addToken("hexnumber", token, startPos);
				} else {
					throw this.composeError(Error(), "Expected number", token, startPos);
				}
			}
		} else if (char === '"') {
			char = "";

			token = this.advanceWhile(char, BasicLexer.isNotQuotes);
			char = this.getChar();
			if (char !== '"') {
				if (!this.quiet) {
					Utils.console.log(this.composeError({} as Error, "Unterminated string", token, startPos + 1).message);
				}
				token += this.fnTryContinueString(char); // heuristic to detect an LF in the string
				char = this.getChar();
			}
			this.addToken("string", token, startPos + 1);
			if (char === '"') { // not for newline
				char = this.advance();
			}
		} else if (BasicLexer.isIdentifierStart(char)) {
			this.fnParseIdentifier(char, startPos);
		} else if (char === "|") { // isRsx
			token = char;
			char = this.advance();
			if (BasicLexer.isIdentifierMiddle(char)) {
				token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
				char = this.getChar();
				this.addToken("|", token, startPos);
			}
		} else if (BasicLexer.isComparison(char)) {
			token = this.advanceWhile(char, BasicLexer.isComparison2);
			this.addToken(token, token, startPos); // like operator
			char = this.getChar();
		} else {
			throw this.composeError(Error(), "Unrecognized token", char, startPos);
		}
	}

	lex(input: string): LexerToken[] {
		let startPos: number;

		this.input = input;
		this.index = 0;

		this.line = "0"; // for error messages
		this.takeNumberAsLinenumber = true;
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
