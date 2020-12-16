// BasicLexer.ts - BASIC Lexer
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
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
	sLine = "0"
	bTakeNumberAsLine = true

	constructor(options?: BasicLexerOptions) {
		this.bQuiet = options?.bQuiet || false;
		this.reset();
	}

	reset(): void {
		this.sLine = "0"; // for error messages
		this.bTakeNumberAsLine = true;
	}

	private composeError(...aArgs) {
		aArgs.unshift("BasicLexer");
		aArgs.push(this.sLine);
		return Utils.composeError.apply(null, aArgs);
	}

	lex(input: string): LexerToken[] { // eslint-disable-line complexity
		let iIndex = 0,
			sToken: string, sChar: string, iStartPos: number;

		const that = this,
			aTokens: LexerToken[] = [],

			isComment = function (c: string) { // isApostrophe
				return (/[']/).test(c);
			},
			isOperator = function (c: string) {
				return (/[+\-*/^=()[\],;:?\\]/).test(c);
			},
			isComparison = function (c: string) {
				return (/[<>]/).test(c);
			},
			isComparison2 = function (c: string) {
				return (/[<>=]/).test(c);
			},
			isDigit = function (c: string) {
				return (/[0-9]/).test(c);
			},
			isDot = function (c: string) {
				return (/[.]/).test(c);
			},
			isSign = function (c: string) {
				return (/[+-]/).test(c);
			},
			isHexOrBin = function (c: string) { // bin: &X, hex: & or &H
				return (/[&]/).test(c);
			},
			isBin2 = function (c: string) {
				return (/[01]/).test(c);
			},
			isHex2 = function (c: string) {
				return (/[0-9A-Fa-f]/).test(c);
			},
			isWhiteSpace = function (c: string) {
				return (/[ \r]/).test(c);
			},
			isNewLine = function (c: string) {
				return (/[\n]/).test(c);
			},
			isQuotes = function (c: string) {
				return (/["]/).test(c);
			},
			isNotQuotes = function (c: string) {
				return c !== "" && !isQuotes(c) && !isNewLine(c); // quoted string must be in one line!
			},
			isIdentifierStart = function (c: string) {
				return c !== "" && (/[A-Za-z]/).test(c); // cannot use complete [A-Za-z]+[\w]*[$%!]?
			},
			isIdentifierMiddle = function (c: string) {
				return c !== "" && (/[A-Za-z0-9.]/).test(c);
			},
			isIdentifierEnd = function (c: string) {
				return c !== "" && (/[$%!]/).test(c);
			},
			isStream = function (c: string) {
				return (/[#]/).test(c);
			},
			isAddress = function (c: string) {
				return (/[@]/).test(c);
			},
			isRsx = function (c: string) {
				return (/[|]/).test(c);
			},
			isNotNewLine = function (c: string) {
				return c !== "" && c !== "\n";
			},
			isUnquotedData = function (c: string) {
				return c !== "" && (/[^:,\r\n]/).test(c);
			},

			testChar = function (iAdd: number) {
				return input.charAt(iIndex + iAdd);
			},

			advance = function () {
				iIndex += 1;
				return input.charAt(iIndex);
			},
			advanceWhile = function (fn: (arg0: string) => boolean) {
				let sToken2 = "";

				do {
					sToken2 += sChar;
					sChar = advance();
				} while (fn(sChar));
				return sToken2;
			},
			addToken = function (type: string, value: string, iPos: number, sOrig?: string) { // optional original value
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
				aTokens.push(oNode);
			},
			hexEscape = function (str: string) {
				return str.replace(/[\x00-\x1f]/g, function (sChar2) { // eslint-disable-line no-control-regex
					return "\\x" + ("00" + sChar2.charCodeAt(0).toString(16)).slice(-2);
				});
			},
			fnParseNumber = function (bStartsWithDot: boolean) { // special handling for number
				sToken = "";
				if (bStartsWithDot) {
					sToken += sChar;
					sChar = advance();
				}
				sToken += advanceWhile(isDigit); // TODO: isDigitOrSpace: numbers may contain spaces!
				if (sChar === "." && !bStartsWithDot) {
					sToken += sChar;
					sChar = advance();
					if (isDigit(sChar)) { // digits after dot?
						sToken += advanceWhile(isDigit);
					}
				}
				if (sChar === "e" || sChar === "E") { // we also try to check: [eE][+-]?\d+; because "E" could be ERR, ELSE,...
					const sChar1 = testChar(1),
						sChar2 = testChar(2);

					if (isDigit(sChar1) || (isSign(sChar1) && isDigit(sChar2))) { // so it is a number
						sToken += sChar; // take "E"
						sChar = advance();
						if (isSign(sChar)) {
							sToken += sChar; // take sign "+" or "-"
							sChar = advance();
						}
						if (isDigit(sChar)) {
							sToken += advanceWhile(isDigit);
						}
					}
				}
				sToken = sToken.trim(); // remove trailing spaces
				if (!isFinite(Number(sToken))) { // Infnity?
					throw that.composeError(Error(), "Number is too large or too small", sToken, iStartPos); // for a 64-bit double
				}
				const iNumber = parseFloat(sToken);

				addToken("number", String(iNumber), iStartPos, sToken); // store number as string
				if (that.bTakeNumberAsLine) {
					that.bTakeNumberAsLine = false;
					that.sLine = String(iNumber); // save just for error message
				}
			},
			fnParseCompleteLineForRem = function () { // special handling for line comment
				if (sChar === " ") {
					sChar = advance();
				}
				if (isNotNewLine(sChar)) {
					sToken = advanceWhile(isNotNewLine);
					addToken("string", sToken, iStartPos + 1);
				}
			},
			fnParseCompleteLineForData = function () { // special handling because strings in data lines need not be quoted
				while (isNotNewLine(sChar)) {
					if (isWhiteSpace(sChar)) {
						advanceWhile(isWhiteSpace);
					}
					if (isNewLine(sChar)) { // now newline?
						break;
					}

					if (isQuotes(sChar)) {
						sChar = "";
						sToken = advanceWhile(isNotQuotes);
						if (!isQuotes(sChar)) {
							if (!that.bQuiet) {
								Utils.console.log(that.composeError({}, "Unterminated string", sToken, iStartPos + 1).message);
							}
						}
						sToken = sToken.replace(/\\/g, "\\\\"); // escape backslashes
						sToken = hexEscape(sToken);
						addToken("string", sToken, iStartPos + 1); // this is a quoted string (but we cannot detect it during runtime)
						if (sChar === '"') { // not for newline
							sChar = advance();
						}
					} else if (sChar === ",") { // empty argument?
						// parser can insert dummy token
					} else {
						sToken = advanceWhile(isUnquotedData);
						sToken = sToken.trim(); // remove whitespace before and after
						sToken = sToken.replace(/\\/g, "\\\\"); // escape backslashes
						sToken = sToken.replace(/"/g, "\\\""); // escape "
						addToken("string", sToken, iStartPos); // could be interpreted as string or number during runtime
					}

					if (isWhiteSpace(sChar)) {
						advanceWhile(isWhiteSpace);
					}

					if (sChar !== ",") {
						break;
					}
					addToken(sChar, sChar, iStartPos); // ","
					sChar = advance();

					if (sChar === "\r") { // IE8 has "/r/n" newlines
						sChar = advance();
					}
				}
			},
			fnTryContinueString = function () { // There could be a LF in a string but no CR. In CPCBasic we use LF only as EOL, so we cannot detect the difference.
				let sOut = "";

				while (isNewLine(sChar)) {
					const sChar1 = testChar(1);

					if (sChar1 !== "" && (sChar1 < "0" || sChar1 > "9")) { // heuristic: next char not a digit => continue with the string
						sOut += advanceWhile(isNotQuotes);
					} else {
						break;
					}
				}
				return sOut;
			};

		while (iIndex < input.length) {
			iStartPos = iIndex;
			sChar = input.charAt(iIndex);
			if (isWhiteSpace(sChar)) {
				sChar = advance();
			} else if (isNewLine(sChar)) {
				addToken("(eol)", "", iStartPos);
				sChar = advance();
				this.bTakeNumberAsLine = true;
			} else if (isComment(sChar)) {
				addToken(sChar, sChar, iStartPos);
				sChar = advance();
				if (isNotNewLine(sChar)) {
					sToken = advanceWhile(isNotNewLine);
					addToken("string", sToken, iStartPos);
				}
			} else if (isOperator(sChar)) {
				addToken(sChar, sChar, iStartPos);
				sChar = advance();
			} else if (isDigit(sChar)) {
				fnParseNumber(false);
			} else if (isDot(sChar)) { // number starting with dot
				fnParseNumber(true);
			} else if (isHexOrBin(sChar)) {
				sToken = sChar;
				sChar = advance();
				if (sChar.toLowerCase() === "x") { // binary?
					sToken += advanceWhile(isBin2);
					addToken("binnumber", sToken, iStartPos);
				} else { // hex
					if (sChar.toLowerCase() === "h") { // optional h
						sToken += sChar;
						sChar = advance();
					}
					if (isHex2(sChar)) {
						sToken += advanceWhile(isHex2);
						addToken("hexnumber", sToken, iStartPos);
					} else {
						throw this.composeError(Error(), "Expected number", sToken, iStartPos);
					}
				}
			} else if (isQuotes(sChar)) {
				sChar = "";

				sToken = advanceWhile(isNotQuotes);
				if (!isQuotes(sChar)) {
					if (!that.bQuiet) {
						Utils.console.log(this.composeError({}, "Unterminated string", sToken, iStartPos + 1).message);
					}
					sToken += fnTryContinueString(); // heuristic to detect an LF in the string
				}
				sToken = sToken.replace(/\\/g, "\\\\"); // escape backslashes
				sToken = hexEscape(sToken);
				addToken("string", sToken, iStartPos + 1);
				if (sChar === '"') { // not for newline
					sChar = advance();
				}
			} else if (isIdentifierStart(sChar)) {
				sToken = sChar;
				sChar = advance();
				if (isIdentifierMiddle(sChar)) {
					sToken += advanceWhile(isIdentifierMiddle);
				}
				if (isIdentifierEnd(sChar)) {
					sToken += sChar;
					sChar = advance();
				}
				addToken("identifier", sToken, iStartPos);
				sToken = sToken.toLowerCase();
				if (sToken === "rem") { // special handling for line comment
					fnParseCompleteLineForRem();
				} else if (sToken === "data") { // special handling because strings in data lines need not be quoted
					fnParseCompleteLineForData();
				}
			} else if (isAddress(sChar)) {
				addToken(sChar, sChar, iStartPos);
				sChar = advance();
			} else if (isRsx(sChar)) {
				sToken = sChar;
				sChar = advance();
				if (isIdentifierMiddle(sChar)) {
					sToken += advanceWhile(isIdentifierMiddle);
					addToken("|", sToken, iStartPos);
				}
			} else if (isStream(sChar)) { // stream can be an expression
				addToken(sChar, sChar, iStartPos);
				sChar = advance();
			} else if (isComparison(sChar)) {
				sToken = advanceWhile(isComparison2);
				addToken(sToken, sToken, iStartPos); // like operator
			} else {
				throw this.composeError(Error(), "Unrecognized token", sChar, iStartPos);
			}
		}
		addToken("(end)", "", iIndex);
		return aTokens;
	}
}
