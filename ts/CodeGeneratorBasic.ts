// CodeGeneratorBasic.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils } from "./Utils";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser"; // BasicParser just for keyword definitions
import { IOutput } from "./Interfaces";

interface CodeGeneratorBasicOptions {
	lexer: BasicLexer
	parser: BasicParser
}

export class CodeGeneratorBasic {
	private lexer: BasicLexer;
	private parser: BasicParser;
	private iLine = 0; // current line (label)

	constructor(options: CodeGeneratorBasicOptions) {
		this.lexer = options.lexer;
		this.parser = options.parser;
	}

	getLexer(): BasicLexer {
		return this.lexer;
	}

	getParser(): BasicParser {
		return this.parser;
	}

	private static mCombinedKeywords: { [k: string]: string } = {
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

	private static mOperators: { [k: string]: string } = {
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

	private composeError(oError: Error, message: string, value: string, pos: number) { // eslint-disable-line class-methods-use-this
		return Utils.composeError("CodeGeneratorBasic", oError, message, value, pos, this.iLine);
	}

	private static fnWs(node: ParserNode) {
		return node.ws || "";
	}

	private static fnSpace1(sValue: string) {
		return (!sValue.length || sValue.startsWith(" ") ? "" : " ") + sValue;
	}

	private fnParseOneArg(oArg: ParserNode) {
		const sValue = this.parseNode(oArg);

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

	private static fnColonsAvailable(aArgs: string[]) {
		//const bColonsAvailable = aArgs.indexOf(":") > -1;
		let bColonsAvailable = false;

		for (let i = 0; i < aArgs.length; i += 1) {
			if (aArgs[i].trim() === ":") {
				bColonsAvailable = true;
				break;
			}
		}
		return bColonsAvailable;
	}

	private static combineArgsWithColon(aArgs: string[]) {
		const sSeparator = CodeGeneratorBasic.fnColonsAvailable(aArgs) ? "" : ":",
			sValue = aArgs.join(sSeparator);

		return sValue;
	}

	private static fnDecodeEscapeSequence(str: string) {
		return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
			return String.fromCharCode(parseInt(arguments[1], 16));
		});
	}

	private fnParenthesisOpen(node: ParserNode) { // special construct to combine tokens
		let oValue = node.value;

		if (node.args) {
			const aNodeArgs = this.fnParseArgs(node.args);

			oValue += aNodeArgs.join("");
		}

		return CodeGeneratorBasic.fnWs(node) + oValue;
	}

	private static string(node: ParserNode) {
		let sValue = CodeGeneratorBasic.fnDecodeEscapeSequence(node.value);

		sValue = sValue.replace(/\\\\/g, "\\"); // unescape backslashes
		return CodeGeneratorBasic.fnWs(node) + '"' + sValue + '"';
	}
	private static unquoted(node: ParserNode) {
		let sValue = CodeGeneratorBasic.fnDecodeEscapeSequence(node.value);

		sValue = sValue.replace(/\\\\/g, "\\"); // unescape backslashes
		return CodeGeneratorBasic.fnWs(node) + sValue;
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
		const sValue = this.fnParseOneArg(node.left) + CodeGeneratorBasic.fnWs(node) + node.value + this.fnParseOneArg(node.right);

		return sValue;
	}
	private static number(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // maybe "e" inside
	}
	private static binnumber(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // maybe "&x"
	}
	private static hexnumber(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase();
	}
	private identifier(node: ParserNode) { // identifier or identifier with array
		let sValue = CodeGeneratorBasic.fnWs(node) + node.value; // keep case, maybe mixed

		if (node.args) { // args including brackets
			const aNodeArgs = this.fnParseArgs(node.args),
				sBracketOpen = aNodeArgs.shift(),
				sBracketClose = aNodeArgs.pop();

			sValue += sBracketOpen + aNodeArgs.join(",") + sBracketClose;
		}

		return sValue;
	}
	private static linenumber(node: ParserNode) {
		return CodeGeneratorBasic.fnWs(node) + node.value;
	}
	private label(node: ParserNode) {
		this.iLine = Number(node.value); // set line before parsing args

		const aNodeArgs = this.fnParseArgs(node.args);

		let sValue = CodeGeneratorBasic.combineArgsWithColon(aNodeArgs);

		if (node.value !== "direct") {
			sValue = node.value + CodeGeneratorBasic.fnSpace1(sValue);
		}
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}

	// special keyword functions
	private vertical(node: ParserNode) { // "|" rsx
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue = node.value.toUpperCase(); // use value!

		if (aNodeArgs.length) {
			sValue += "," + aNodeArgs.join(",");
		}
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private afterGosub(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue = "AFTER" + CodeGeneratorBasic.fnSpace1(aNodeArgs[0]);

		if (aNodeArgs[1]) {
			sValue += "," + aNodeArgs[1];
		}
		sValue += " GOSUB" + CodeGeneratorBasic.fnSpace1(aNodeArgs[2]);
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private chainMerge(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type] || node.type.toUpperCase();

		if (aNodeArgs.length === 3) {
			aNodeArgs[2] = "DELETE" + CodeGeneratorBasic.fnSpace1(aNodeArgs[2]);
		}

		const sValue = sTypeUc + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));

		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private data(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		for (let i = 0; i < aNodeArgs.length; i += 1) {
			const sValue2 = aNodeArgs[i];

			aNodeArgs[i] = sValue2;
		}

		let sArgs = aNodeArgs.join("");

		sArgs = Utils.stringTrimEnd(sArgs); // remove trailing spaces

		const sValue = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(sArgs);

		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private def(node: ParserNode) {
		if (!node.left || !node.right) {
			throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occure
		}

		const sName = this.fnParseOneArg(node.left),
			sSpace = node.left.bSpace ? " " : "", // fast hack
			aNodeArgs = this.fnParseArgs(node.args),
			sExpression = this.fnParseOneArg(node.right);
		let sNodeArgs = aNodeArgs.join(",");

		if (sNodeArgs !== "") { // not empty?
			sNodeArgs = "(" + sNodeArgs + ")";
		}

		const sName2 = sName.replace(/FN/i, "FN" + sSpace),
			sValue = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(sName2) + sNodeArgs + "=" + sExpression;

		return sValue;
	}
	private "else"(node: ParserNode) { // similar to a comment, with unchecked tokens
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occure
		}

		const aArgs = node.args;
		let sValue = "";

		for (let i = 0; i < aArgs.length; i += 1) {
			const oToken = aArgs[i];

			if (oToken.value) {
				sValue += " " + oToken.value;
			}
		}
		// TODO: whitespaces?
		sValue = node.type.toUpperCase() + sValue;
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private ent(node: ParserNode) { // "ent" or "env"
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
		const sValue = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));

		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private env(node: ParserNode) {
		return this.ent(node);
	}
	private everyGosub(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue = "EVERY" + aNodeArgs[0];

		if (aNodeArgs[1]) {
			sValue += "," + aNodeArgs[1];
		}
		sValue += " GOSUB" + CodeGeneratorBasic.fnSpace1(aNodeArgs[2]);
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private fn(node: ParserNode) {
		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
		}

		const aNodeArgs = this.fnParseArgs(node.args);
		let sNodeArgs = aNodeArgs.join(",");

		if (sNodeArgs !== "") { // not empty?
			sNodeArgs = "(" + sNodeArgs + ")";
		}

		const sName2 = node.value.replace(/FN/i, "FN"), // + sSpace),
			sValue = sName2 + sNodeArgs;

		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private "for"(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sVarName = aNodeArgs[0],
			startValue = aNodeArgs[1],
			endValue = aNodeArgs[2],
			stepValue = aNodeArgs[3];
		let sValue = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(sVarName) + "=" + startValue + " TO" + CodeGeneratorBasic.fnSpace1(endValue);

		if (stepValue !== "") { // "null" is ""
			sValue += " STEP" + CodeGeneratorBasic.fnSpace1(stepValue);
		}
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}

	private fnThenOrElsePart(oNodeBranch: ParserNode[]) {
		const aNodeArgs = this.fnParseArgs(oNodeBranch); // args for "then" or "else"

		if (oNodeBranch.length && oNodeBranch[0].type === "goto" && oNodeBranch[0].len === 0) { // inserted goto?
			aNodeArgs[0] = this.fnParseOneArg(oNodeBranch[0].args![0]); // take just line number
		}
		const sValue = CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.combineArgsWithColon(aNodeArgs));

		return sValue;
	}

	private "if"(node: ParserNode) {
		if (!node.left) {
			throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occure
		}
		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occure
		}

		let sValue = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.fnParseOneArg(node.left)) + " THEN";

		sValue += this.fnThenOrElsePart(node.args); // "then" part

		if (node.args2) {
			sValue += " ELSE" + this.fnThenOrElsePart(node.args2); // "else" part
		}

		/*
		const oNodeBranch = node.args,
			aNodeArgs = this.fnParseArgs(oNodeBranch); // args for "then"

		if (oNodeBranch.length && oNodeBranch[0].type === "goto" && oNodeBranch[0].len === 0) { // inserted goto?
			aNodeArgs[0] = this.fnParseOneArg(oNodeBranch[0].args![0]); // take just line number
		}
		sValue += CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.combineArgsWithColon(aNodeArgs));

		if (node.args2) {
			sValue += " ELSE";
			const oNodeBranch2 = node.args2,
				aNodeArgs2 = this.fnParseArgs(oNodeBranch2); // args for "else"

			if (oNodeBranch2.length && oNodeBranch2[0].type === "goto" && oNodeBranch2[0].len === 0) { // inserted goto?
				aNodeArgs2[0] = this.fnParseOneArg(oNodeBranch2[0].args![0]); // take just line number
			}
			sValue += CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.combineArgsWithColon(aNodeArgs2));
		}
		*/
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}


	private static fnHasStream(node: ParserNode) {
		const bHasStream = node.args && node.args.length && (node.args[0].type === "#") && node.args[0].right && (node.args[0].right.type !== "null");

		return bHasStream;
	}

	private input(node: ParserNode) { // input or line input
		const aNodeArgs = this.fnParseArgs(node.args),
			sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type] || node.type.toUpperCase(),
			bHasStream = CodeGeneratorBasic.fnHasStream(node);
		let i = 0;

		if (bHasStream) { // stream?
			i += 1;
		}

		aNodeArgs.splice(i, 4, aNodeArgs[i] + aNodeArgs[i + 1] + aNodeArgs[i + 2] + aNodeArgs[i + 3]); // combine 4 elements into one
		const sValue = aNodeArgs.join(",");

		return CodeGeneratorBasic.fnWs(node) + sTypeUc + CodeGeneratorBasic.fnSpace1(sValue);
	}
	private lineInput(node: ParserNode) {
		return this.input(node);
	}
	private list(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		if (aNodeArgs.length && aNodeArgs[0] === "") { // empty range?
			aNodeArgs.shift(); // remove
		}

		if (aNodeArgs.length && aNodeArgs[aNodeArgs.length - 1] === "#") { // dummy stream?
			aNodeArgs.pop(); // remove
		}

		const sValue = node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));

		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private mid$Assign(node: ParserNode) {
		if (!node.right) {
			throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occure
		}

		const aNodeArgs = this.fnParseArgs(node.args),
			sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type],
			sValue = sTypeUc + "(" + aNodeArgs.join(",") + ")=" + this.fnParseOneArg(node.right);

		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private onGosub(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue = aNodeArgs.shift();

		if (!sValue) {
			throw this.composeError(Error(), "Programming error: Undefined value", "", -1); // should not occure
		}

		sValue = "ON" + CodeGeneratorBasic.fnSpace1(sValue) + " GOSUB" + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private onGoto(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue = aNodeArgs.shift();

		if (!sValue) {
			throw this.composeError(Error(), "Programming error: Undefined value", "", -1); // should not occure
		}

		sValue = "ON" + CodeGeneratorBasic.fnSpace1(sValue) + " GOTO" + CodeGeneratorBasic.fnSpace1(aNodeArgs.join(","));
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private onSqGosub(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			sValue = "ON SQ(" + aNodeArgs[0] + ") GOSUB" + CodeGeneratorBasic.fnSpace1(aNodeArgs[1]);

		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private print(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args),
			bHasStream = CodeGeneratorBasic.fnHasStream(node);
		let sValue = "";

		if (bHasStream && aNodeArgs.length > 1) { // more args after stream?
			aNodeArgs[0] = String(aNodeArgs[0]) + ",";
		}

		for (let i = 0; i < aNodeArgs.length; i += 1) {
			sValue += aNodeArgs[i];
		}

		if (node.value !== "?") { // for "print"
			sValue = CodeGeneratorBasic.fnSpace1(sValue);
		}

		return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + sValue; // we use value to get PRINT or ?
	}
	private rem(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);
		let sValue = aNodeArgs[0];

		if (sValue !== undefined) {
			sValue = sValue.substr(1, sValue.length - 2); // remove surrounding quotes
		} else {
			sValue = "";
		}
		let sName = node.value;

		if (sName !== "'") { // not simple rem?
			sName = sName.toUpperCase();
			if (sValue !== "") { // argument?
				sName += " ";
			}
		}
		sValue = sName + sValue;
		return CodeGeneratorBasic.fnWs(node) + sValue;
	}
	private using(node: ParserNode) {
		const aNodeArgs = this.fnParseArgs(node.args);

		let sTemplate = aNodeArgs.shift();

		if (sTemplate && sTemplate.charAt(0) !== '"') { // not a string => space required
			sTemplate = " " + sTemplate;
		}
		const sValue = node.type.toUpperCase() + sTemplate + ";" + aNodeArgs.join(","); // separator between args could be "," or ";", we use ","

		return CodeGeneratorBasic.fnWs(node) + sValue;
	}

	/* eslint-disable no-invalid-this */
	mParseFunctions: { [k: string]: (node: ParserNode) => string } = { // to call methods, use mParseFunctions[].call(this,...)
		"(": this.fnParenthesisOpen,
		string: CodeGeneratorBasic.string,
		unquoted: CodeGeneratorBasic.unquoted,
		"null": CodeGeneratorBasic.fnNull,
		assign: this.assign,
		number: CodeGeneratorBasic.number,
		binnumber: CodeGeneratorBasic.binnumber,
		hexnumber: CodeGeneratorBasic.hexnumber,
		identifier: this.identifier,
		linenumber: CodeGeneratorBasic.linenumber,
		label: this.label,
		"|": this.vertical,
		afterGosub: this.afterGosub,
		chainMerge: this.chainMerge,
		data: this.data,
		def: this.def,
		"else": this.else,
		ent: this.ent,
		env: this.env,
		everyGosub: this.everyGosub,
		fn: this.fn,
		"for": this.for,
		"if": this.if,
		input: this.input,
		lineInput: this.lineInput,
		list: this.list,
		mid$Assign: this.mid$Assign,
		onGosub: this.onGosub,
		onGoto: this.onGoto,
		onSqGosub: this.onSqGosub,
		print: this.print,
		rem: this.rem,
		using: this.using
	};
	/* eslint-enable no-invalid-this */


	private fnParseOther(node: ParserNode) {
		const sType = node.type,
			sTypeUc = CodeGeneratorBasic.mCombinedKeywords[sType] || sType.toUpperCase(),
			sKeyType = BasicParser.mKeywords[sType];
		let sArgs = "";

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

		let sValue: string;

		if (sKeyType) {
			sValue = sTypeUc;
			if (sArgs.length) {
				if (sKeyType.charAt(0) === "f") { // function with parameters?
					sValue += "(" + sArgs + ")";
				} else {
					/*
					else if (sArgs.charAt(0) !== "#") { // only if not a stream
					sValue += CodeGeneratorBasic.fnSpace1(sArgs);
					} else {
					sValue += sArgs;
					*/
					sValue += CodeGeneratorBasic.fnSpace1(sArgs);
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
			mPrecedence = CodeGeneratorBasic.mOperatorPrecedence,
			mOperators = CodeGeneratorBasic.mOperators;
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

				const sWhiteBefore = CodeGeneratorBasic.fnWs(node);
				let sOperator = sWhiteBefore + mOperators[sType].toUpperCase();

				if (sWhiteBefore === "" && (/^(and|or|xor|not|mod)$/).test(sType)) {
					sOperator = " " + sOperator + " ";
				}

				value += sOperator + value2;
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
				value = CodeGeneratorBasic.fnWs(node) + mOperators[sType].toUpperCase() + value;
			}
		} else if (this.mParseFunctions[sType]) { // function with special handling?
			value = this.mParseFunctions[sType].call(this, node);
		} else { // for other functions, generate code directly
			value = CodeGeneratorBasic.fnWs(node) + this.fnParseOther(node);
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
					if (sOutput.length === 0) {
						sOutput = sNode;
					} else {
						sOutput += "\n" + sNode;
					}
				} else {
					sOutput = ""; // cls (clear output when sNode is set to null)
				}
			}
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
