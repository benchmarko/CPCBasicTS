// BasicLexer.ts - BASIC Lexer
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC lexer for Locomotive BASIC 1.1 for Amstrad CPC 6128
//

// based on an idea of: https://www.codeproject.com/Articles/345888/How-to-write-a-simple-interpreter-in-JavaScript

import { Utils } from "./Utils";

interface BasicLexerOptions {
	bQuiet?: boolean
}

export interface LexerToken {
	type: string
	value: string
	pos: number
	orig?: string
}

export class BasicLexer {
	bQuiet = false
	sLine = "0" // for error messages
	bTakeNumberAsLine = true

	sInput = "";
	iIndex = 0
	aTokens: LexerToken[] = []

	constructor(options?: BasicLexerOptions) {
		this.bQuiet = options?.bQuiet || false;
	}

	private composeError(oError: Error, message: string, value: string, pos: number) {
		return Utils.composeError("BasicLexer", oError, message, value, pos, this.sLine);
	}


	private static isComment(c: string) { // isApostrophe
		return (/[']/).test(c);
	}
	private static isOperator(c: string) {
		return (/[+\-*/^=()[\],;:?\\]/).test(c);
	}
	private static isComparison(c: string) {
		return (/[<>]/).test(c);
	}
	private static isComparison2(c: string) {
		return (/[<>=]/).test(c);
	}
	private static isDigit(c: string) {
		return (/[0-9]/).test(c);
	}
	private static isDot(c: string) {
		return (/[.]/).test(c);
	}
	private static isSign(c: string) {
		return (/[+-]/).test(c);
	}
	private static isHexOrBin(c: string) { // bin: &X, hex: & or &H
		return (/[&]/).test(c);
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
	private static isNewLine(c: string) {
		return (/[\n]/).test(c);
	}
	private static isQuotes(c: string) {
		return (/["]/).test(c);
	}
	private static isNotQuotes(c: string) {
		return c !== "" && !BasicLexer.isQuotes(c) && !BasicLexer.isNewLine(c); // quoted string must be in one line!
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
	private static isStream(c: string) {
		return (/[#]/).test(c);
	}
	private static isAddress(c: string) {
		return (/[@]/).test(c);
	}
	private static isRsx(c: string) {
		return (/[|]/).test(c);
	}
	private static isNotNewLine(c: string) {
		return c !== "" && c !== "\n";
	}
	private static isUnquotedData(c: string) {
		return c !== "" && (/[^:,\r\n]/).test(c);
	}

	private testChar(iAdd: number) {
		return this.sInput.charAt(this.iIndex + iAdd);
	}

	private getChar() {
		return this.sInput.charAt(this.iIndex);
	}

	private advance() {
		this.iIndex += 1;
		return this.getChar();
	}
	private advanceWhile(sChar: string, fn: (arg0: string) => boolean) {
		let sToken2 = "";

		do {
			sToken2 += sChar;
			sChar = this.advance();
		} while (fn(sChar));
		return sToken2;
	}
	private addToken(type: string, value: string, iPos: number, sOrig?: string) { // optional original value
		const oNode: LexerToken = {
			type: type,
			value: value,
			pos: iPos
		};

		if (sOrig !== undefined) {
			if (sOrig !== value) {
				oNode.orig = sOrig;
			}
		}
		this.aTokens.push(oNode);
	}
	private static hexEscape(str: string) {
		return str.replace(/[\x00-\x1f]/g, function (sChar2) { // eslint-disable-line no-control-regex
			return "\\x" + ("00" + sChar2.charCodeAt(0).toString(16)).slice(-2);
		});
	}
	private fnParseNumber(sChar: string, iStartPos: number, bStartsWithDot: boolean) { // special handling for number
		let sToken = "";

		if (bStartsWithDot) {
			sToken += sChar;
			sChar = this.advance();
		}
		sToken += this.advanceWhile(sChar, BasicLexer.isDigit); // TODO: isDigitOrSpace: numbers may contain spaces!
		sChar = this.getChar();
		if (sChar === "." && !bStartsWithDot) {
			sToken += sChar;
			sChar = this.advance();
			if (BasicLexer.isDigit(sChar)) { // digits after dot?
				sToken += this.advanceWhile(sChar, BasicLexer.isDigit);
				sChar = this.getChar();
			}
		}
		if (sChar === "e" || sChar === "E") { // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
			const sChar1 = this.testChar(1),
				sChar2 = this.testChar(2);

			if (BasicLexer.isDigit(sChar1) || (BasicLexer.isSign(sChar1) && BasicLexer.isDigit(sChar2))) { // so it is a number
				sToken += sChar; // take "E"
				sChar = this.advance();
				if (BasicLexer.isSign(sChar)) {
					sToken += sChar; // take sign "+" or "-"
					sChar = this.advance();
				}
				if (BasicLexer.isDigit(sChar)) {
					sToken += this.advanceWhile(sChar, BasicLexer.isDigit);
					sChar = this.getChar();
				}
			}
		}
		sToken = sToken.trim(); // remove trailing spaces
		if (!isFinite(Number(sToken))) { // Infnity?
			throw this.composeError(Error(), "Number is too large or too small", sToken, iStartPos); // for a 64-bit double
		}
		const iNumber = parseFloat(sToken);

		this.addToken("number", String(iNumber), iStartPos, sToken); // store number as string
		if (this.bTakeNumberAsLine) {
			this.bTakeNumberAsLine = false;
			this.sLine = String(iNumber); // save just for error message
		}
	}
	private fnParseCompleteLineForRem(sChar: string, iStartPos: number) { // special handling for line comment
		if (sChar === " ") {
			sChar = this.advance();
		}
		if (BasicLexer.isNotNewLine(sChar)) {
			const sToken = this.advanceWhile(sChar, BasicLexer.isNotNewLine);

			sChar = this.getChar();
			this.addToken("string", sToken, iStartPos + 1);
		}
	}
	private fnParseCompleteLineForData(sChar: string, iStartPos: number) { // special handling because strings in data lines need not be quoted
		while (BasicLexer.isNotNewLine(sChar)) {
			if (BasicLexer.isWhiteSpace(sChar)) {
				this.advanceWhile(sChar, BasicLexer.isWhiteSpace);
				sChar = this.getChar();
			}
			if (BasicLexer.isNewLine(sChar)) { // now newline?
				break;
			}

			if (BasicLexer.isQuotes(sChar)) {
				sChar = "";
				let sToken = this.advanceWhile(sChar, BasicLexer.isNotQuotes);

				sChar = this.getChar();
				if (!BasicLexer.isQuotes(sChar)) {
					if (!this.bQuiet) {
						Utils.console.log(this.composeError({} as Error, "Unterminated string", sToken, iStartPos + 1).message);
					}
				}
				sToken = sToken.replace(/\\/g, "\\\\"); // escape backslashes
				sToken = BasicLexer.hexEscape(sToken);
				this.addToken("string", sToken, iStartPos + 1); // this is a quoted string (but we cannot detect it during runtime)
				if (sChar === '"') { // not for newline
					sChar = this.advance();
				}
			} else if (sChar === ",") { // empty argument?
				// parser can insert dummy token
			} else {
				let sToken = this.advanceWhile(sChar, BasicLexer.isUnquotedData);

				sChar = this.getChar();
				sToken = sToken.trim(); // remove whitespace before and after
				sToken = sToken.replace(/\\/g, "\\\\"); // escape backslashes
				sToken = sToken.replace(/"/g, "\\\""); // escape "
				this.addToken("string", sToken, iStartPos); // could be interpreted as string or number during runtime
			}

			if (BasicLexer.isWhiteSpace(sChar)) {
				this.advanceWhile(sChar, BasicLexer.isWhiteSpace);
				sChar = this.getChar();
			}

			if (sChar !== ",") {
				break;
			}
			this.addToken(sChar, sChar, iStartPos); // ","
			sChar = this.advance();

			if (sChar === "\r") { // IE8 has "/r/n" newlines
				sChar = this.advance();
			}
		}
	}
	private fnTryContinueString(sChar: string) { // There could be a LF in a string but no CR. In CPCBasic we use LF only as EOL, so we cannot detect the difference.
		let sOut = "";

		while (BasicLexer.isNewLine(sChar)) {
			const sChar1 = this.testChar(1);

			if (sChar1 !== "" && (sChar1 < "0" || sChar1 > "9")) { // heuristic: next char not a digit => continue with the string
				sOut += this.advanceWhile(sChar, BasicLexer.isNotQuotes);
				sChar = this.getChar();
			} else {
				break;
			}
		}
		return sOut;
	}


	lex(sInput: string): LexerToken[] { // eslint-disable-line complexity
		let iStartPos: number,
			sChar: string,
			sToken: string;

		this.sInput = sInput;
		this.iIndex = 0;

		this.sLine = "0"; // for error messages
		this.bTakeNumberAsLine = true;

		this.aTokens = []; //this.aTokens.length = 0;

		while (this.iIndex < sInput.length) {
			iStartPos = this.iIndex;
			sChar = this.getChar();
			if (BasicLexer.isWhiteSpace(sChar)) {
				sChar = this.advance();
			} else if (BasicLexer.isNewLine(sChar)) {
				this.addToken("(eol)", "", iStartPos);
				sChar = this.advance();
				this.bTakeNumberAsLine = true;
			} else if (BasicLexer.isComment(sChar)) {
				this.addToken(sChar, sChar, iStartPos);
				sChar = this.advance();
				if (BasicLexer.isNotNewLine(sChar)) {
					sToken = this.advanceWhile(sChar, BasicLexer.isNotNewLine);
					sChar = this.getChar();
					this.addToken("string", sToken, iStartPos);
				}
			} else if (BasicLexer.isOperator(sChar)) {
				this.addToken(sChar, sChar, iStartPos);
				sChar = this.advance();
			} else if (BasicLexer.isDigit(sChar)) {
				this.fnParseNumber(sChar, iStartPos, false);
			} else if (BasicLexer.isDot(sChar)) { // number starting with dot
				this.fnParseNumber(sChar, iStartPos, true);
			} else if (BasicLexer.isHexOrBin(sChar)) {
				sToken = sChar;
				sChar = this.advance();
				if (sChar.toLowerCase() === "x") { // binary?
					sToken += this.advanceWhile(sChar, BasicLexer.isBin2);
					sChar = this.getChar();
					this.addToken("binnumber", sToken, iStartPos);
				} else { // hex
					if (sChar.toLowerCase() === "h") { // optional h
						sToken += sChar;
						sChar = this.advance();
					}
					if (BasicLexer.isHex2(sChar)) {
						sToken += this.advanceWhile(sChar, BasicLexer.isHex2);
						sChar = this.getChar();
						this.addToken("hexnumber", sToken, iStartPos);
					} else {
						throw this.composeError(Error(), "Expected number", sToken, iStartPos);
					}
				}
			} else if (BasicLexer.isQuotes(sChar)) {
				sChar = "";

				sToken = this.advanceWhile(sChar, BasicLexer.isNotQuotes);
				sChar = this.getChar();
				if (!BasicLexer.isQuotes(sChar)) {
					if (!this.bQuiet) {
						Utils.console.log(this.composeError({} as Error, "Unterminated string", sToken, iStartPos + 1).message);
					}
					sToken += this.fnTryContinueString(sChar); // heuristic to detect an LF in the string
					sChar = this.getChar();
				}
				sToken = sToken.replace(/\\/g, "\\\\"); // escape backslashes
				sToken = BasicLexer.hexEscape(sToken);
				this.addToken("string", sToken, iStartPos + 1);
				if (sChar === '"') { // not for newline
					sChar = this.advance();
				}
			} else if (BasicLexer.isIdentifierStart(sChar)) {
				sToken = sChar;
				sChar = this.advance();
				if (BasicLexer.isIdentifierMiddle(sChar)) {
					sToken += this.advanceWhile(sChar, BasicLexer.isIdentifierMiddle);
					sChar = this.getChar();
				}
				if (BasicLexer.isIdentifierEnd(sChar)) {
					sToken += sChar;
					sChar = this.advance();
				}
				this.addToken("identifier", sToken, iStartPos);
				sToken = sToken.toLowerCase();
				if (sToken === "rem") { // special handling for line comment
					this.fnParseCompleteLineForRem(sChar, iStartPos);
					sChar = this.getChar();
				} else if (sToken === "data") { // special handling because strings in data lines need not be quoted
					this.fnParseCompleteLineForData(sChar, iStartPos);
					sChar = this.getChar();
				}
			} else if (BasicLexer.isAddress(sChar)) {
				this.addToken(sChar, sChar, iStartPos);
				sChar = this.advance();
			} else if (BasicLexer.isRsx(sChar)) {
				sToken = sChar;
				sChar = this.advance();
				if (BasicLexer.isIdentifierMiddle(sChar)) {
					sToken += this.advanceWhile(sChar, BasicLexer.isIdentifierMiddle);
					sChar = this.getChar();
					this.addToken("|", sToken, iStartPos);
				}
			} else if (BasicLexer.isStream(sChar)) { // stream can be an expression
				this.addToken(sChar, sChar, iStartPos);
				sChar = this.advance();
			} else if (BasicLexer.isComparison(sChar)) {
				sToken = this.advanceWhile(sChar, BasicLexer.isComparison2);
				this.addToken(sToken, sToken, iStartPos); // like operator
				sChar = this.getChar();
			} else {
				throw this.composeError(Error(), "Unrecognized token", sChar, iStartPos);
			}
		}
		this.addToken("(end)", "", this.iIndex);
		return this.aTokens;
	}
}
