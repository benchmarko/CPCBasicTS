"use strict";
// BasicTokenizer.ts - Tokenize BASIC programs
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasic/
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicTokenizer = void 0;
var Utils_1 = require("./Utils");
var BasicTokenizer = /** @class */ (function () {
    function BasicTokenizer() {
        this.init();
    }
    BasicTokenizer.prototype.init = function () {
        this.reset();
    };
    BasicTokenizer.prototype.reset = function () {
        this.sData = "";
        this.iPos = 0;
        this.iLine = 0;
    };
    BasicTokenizer.prototype.decode = function (sProgram) {
        // based on lbas2ascii.pl, 28.06.2006
        var that = this, // eslint-disable-line @typescript-eslint/no-this-alias
        fnNum8Dec = function () {
            var iNum = that.sInput.charCodeAt(that.iPos);
            that.iPos += 1;
            return iNum;
        }, fnNum16Dec = function () {
            return fnNum8Dec() + fnNum8Dec() * 256;
        }, fnNum16Hex = function () {
            return "&" + fnNum16Dec().toString(16).toUpperCase();
        }, fnNum16Bin = function () {
            return "&X" + fnNum16Dec().toString(2);
        }, fnNum32Dec = function () {
            return fnNum16Dec() + fnNum16Dec() * 65536;
        }, 
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
        fnNumFp = function () {
            var value = fnNum32Dec(); // signed integer
            var exponent = fnNum8Dec(), sOut;
            if (!exponent) { // exponent zero? => 0
                sOut = "0";
            }
            else { // beware: JavaScript has no unsigned int except for ">>> 0"
                var mantissa = value >= 0 ? value + 0x80000000 : value;
                exponent -= 0x81; // 2-complement: 2^-127 .. 2^128
                var iNum = mantissa * Math.pow(2, exponent - 31);
                sOut = iNum.toPrecision(9); // some rounding, formatting
                if (sOut.indexOf("e") >= 0) {
                    sOut = sOut.replace(/\.?0*e/, "E"); // exponential uppercase, no zeros
                    sOut = sOut.replace(/(E[+-])(\d)$/, "$10$2"); // exponent 1 digit to 2 digits
                }
                else if (sOut.indexOf(".") >= 0) { // decimal number?
                    sOut = sOut.replace(/\.?0*$/, ""); // remove trailing dot and/or zeros
                }
            }
            return sOut;
        }, fnGetBit7TerminatedString = function () {
            var sData = that.sInput;
            var iPos = that.iPos;
            while (sData.charCodeAt(iPos) <= 0x7f) { // last character b7=1 (>= 0x80)
                iPos += 1;
            }
            var sOut = sData.substring(that.iPos, iPos) + String.fromCharCode(sData.charCodeAt(iPos) & 0x7f); // eslint-disable-line no-bitwise
            that.iPos = iPos + 1;
            return sOut;
        }, fnVar = function () {
            fnNum16Dec(); // ignore offset
            var sOut = fnGetBit7TerminatedString();
            return sOut;
        }, fnRsx = function () {
            fnNum8Dec(); // ignore length
            var sOut = fnGetBit7TerminatedString();
            return "|" + sOut;
        }, fnStringUntilEol = function () {
            var sOut = that.sInput.substring(that.iPos, that.iLineEnd - 1); // take remaining line
            that.iPos = that.iLineEnd;
            return sOut;
        }, fnQuotedString = function () {
            var iClosingQuotes = that.sInput.indexOf('"', that.iPos);
            var sOut = "";
            if (iClosingQuotes < 0 || iClosingQuotes >= that.iLineEnd) { // unclosed quoted string (quotes not found or not in this line)
                sOut = fnStringUntilEol(); // take remaining line
            }
            else {
                sOut = that.sInput.substring(that.iPos, iClosingQuotes + 1);
                that.iPos = iClosingQuotes + 1; // after quotes
            }
            sOut = '"' + sOut;
            if (sOut.indexOf("\r") >= 0) {
                Utils_1.Utils.console.log("BasicTokenizer line", that.iLine, ": string contains CR, replaced by CHR$(13)");
                sOut = sOut.replace(/\r/g, '"+chr$(13)+"');
            }
            if ((/\n\d/).test(sOut)) {
                Utils_1.Utils.console.log("BasicTokenizer line", that.iLine, ": string contains LF<digit>, replaced by CHR$(10)<digit>");
                sOut = sOut.replace(/\n(\d)/g, '"+chr$(10)+"$1');
            }
            return sOut;
        }, mTokens = {
            0x00: "",
            0x01: ":",
            0x02: function () {
                return fnVar() + "%";
            },
            0x03: function () {
                return fnVar() + "$";
            },
            0x04: function () {
                return fnVar() + "!";
            },
            0x05: "var?",
            0x06: "var?",
            0x07: "var?",
            0x08: "var?",
            0x09: "var?",
            0x0a: "var?",
            0x0b: fnVar,
            0x0c: fnVar,
            0x0d: fnVar,
            0x0e: "0",
            0x0f: "1",
            0x10: "2",
            0x11: "3",
            0x12: "4",
            0x13: "5",
            0x14: "6",
            0x15: "7",
            0x16: "8",
            0x17: "9",
            0x18: "10",
            0x19: fnNum8Dec,
            0x1a: fnNum16Dec,
            0x1b: fnNum16Bin,
            0x1c: fnNum16Hex,
            0x1d: fnNum16Dec,
            0x1e: fnNum16Dec,
            0x1f: fnNumFp,
            // 0x20-0x21 ASCII printable symbols
            0x22: fnQuotedString,
            // 0x23-0x7b ASCII printable symbols
            0x7c: fnRsx,
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
            0x97: "ELSE",
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
            0xb4: "ON ERROR GOTO 0",
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
            0xc0: function () {
                return "'" + fnStringUntilEol();
            },
            0xc1: "RAD",
            0xc2: "RANDOMIZE",
            0xc3: "READ",
            0xc4: "RELEASE",
            0xc5: function () {
                return "REM" + fnStringUntilEol();
            },
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
            0xdd: "FILL",
            0xde: "GRAPHICS",
            0xdf: "MASK",
            0xe0: "FRAME",
            0xe1: "CURSOR",
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
            0xee: ">",
            0xef: "=",
            0xf0: ">=",
            0xf1: "<",
            0xf2: "<>",
            0xf3: "<=",
            0xf4: "+",
            0xf5: "-",
            0xf6: "*",
            0xf7: "/",
            0xf8: "^",
            0xf9: "\\",
            0xfa: "AND",
            0xfb: "MOD",
            0xfc: "OR",
            0xfd: "XOR",
            0xfe: "NOT"
            // 0xff: (prefix for additional keywords)
        }, mTokensFF = {
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
            0x49: "DERR",
            // Functions with more arguments
            0x71: "BIN$",
            0x72: "DEC$",
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
            0x7e: "COPYCHR$",
            0x7f: "VPOS"
        }, fnParseNextLine = function () {
            var sInput = that.sInput, iLineLength = fnNum16Dec();
            if (!iLineLength) {
                return null; // nothing more
            }
            that.iLineEnd = that.iPos + iLineLength - 2;
            that.iLine = fnNum16Dec();
            var sOut = "", bSpace = false;
            while (that.iPos < that.iLineEnd) {
                var bOldSpace = bSpace;
                var iToken = fnNum8Dec();
                if (iToken === 0x01) { // statement seperator ":"?
                    if (that.iPos < sInput.length) {
                        var iNextToken = sInput.charCodeAt(that.iPos); // test next token
                        if (iNextToken === 0x97 || iNextToken === 0xc0) { // ELSE or rem '?
                            iToken = iNextToken; // ignore ':'
                            that.iPos += 1;
                        }
                    }
                }
                bSpace = ((iToken >= 0x02 && iToken <= 0x1f) || (iToken === 0x7c)); // constant 0..9; variable, or RSX?
                var token = void 0;
                if (iToken === 0xff) { // extended token?
                    iToken = fnNum8Dec(); // get it
                    token = mTokensFF[iToken];
                }
                else {
                    token = mTokens[iToken];
                }
                var tstr = void 0;
                if (token !== undefined) {
                    if (typeof token === "function") {
                        tstr = token();
                    }
                    else { // string
                        tstr = token;
                    }
                    if ((/[a-zA-Z0-9.]$/).test(tstr) && iToken !== 0xe4) { // last character char, number, dot? (not for token "FN")
                        bSpace = true; // maybe need space next time...
                    }
                }
                else { // normal ASCII
                    tstr = String.fromCharCode(iToken);
                }
                if (bOldSpace) {
                    if ((/^[a-zA-Z0-9$%!]+$/).test(tstr) || (iToken >= 0x02 && iToken <= 0x1f)) {
                        tstr = " " + tstr;
                    }
                }
                sOut += tstr;
            }
            return that.iLine + " " + sOut;
        }, fnParseProgram = function () {
            var sOut = "", sLine;
            that.iPos = 0;
            while ((sLine = fnParseNextLine()) !== null) {
                sOut += sLine + "\n";
                // CPC uses "\r\n" line breaks, JavaScript uses "\n", textArea cannot contain "\r"
            }
            return sOut;
        };
        this.sInput = sProgram;
        return fnParseProgram();
    };
    return BasicTokenizer;
}());
exports.BasicTokenizer = BasicTokenizer;
//# sourceMappingURL=BasicTokenizer.js.map