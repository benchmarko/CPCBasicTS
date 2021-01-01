// CodeGeneratorBasic.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils, CustomError } from "./Utils";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser"; // BasicParser just for keyword definitions

interface CodeGeneratorBasicOptions {
	lexer: BasicLexer
	parser: BasicParser
}

export class CodeGeneratorBasic {
	static mCombinedKeywords = {
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
	};

	lexer: BasicLexer;
	parser: BasicParser;


	constructor(options: CodeGeneratorBasicOptions) {
		this.init(options);
	}

	init(options: CodeGeneratorBasicOptions): void {
		this.lexer = options.lexer;
		this.parser = options.parser;

		this.reset();
	}

	reset(): void {
		this.lexer.reset();
		this.parser.reset();
	}

	private composeError(...aArgs) { // eslint-disable-line class-methods-use-this
		aArgs.unshift("CodeGeneratorBasic");
		// check, correct:
		//TTT aArgs.push(this.iLine);
		return Utils.composeError.apply(null, aArgs) as CustomError;
	}

	//
	// evaluate
	//
	private evaluate(parseTree: ParserNode[]) {
		const that = this,

			fnParseOneArg = function (oArg: ParserNode) {
				const sValue = parseNode(oArg); // eslint-disable-line no-use-before-define

				return sValue;
			},

			fnParseArgs = function (aArgs: ParserNode[]) {
				const aNodeArgs = []; // do not modify node.args here (could be a parameter of defined function)

				for (let i = 0; i < aArgs.length; i += 1) {
					const sValue = fnParseOneArg(aArgs[i]);

					if (!(i === 0 && sValue === "#" && aArgs[i].type === "#")) { // ignore empty stream as first argument (hmm, not for e.g. data!)
						aNodeArgs.push(sValue);
					}
				}
				return aNodeArgs;
			},

			mOperators = {
				"+": "+",
				"-": "-",
				"*": "*",
				"/": "/",
				"\\": "\\",
				"^": "^",
				and: " AND ",
				or: " OR ",
				xor: " XOR ",
				not: "NOT ",
				mod: " MOD ",
				">": ">",
				"<": "<",
				">=": ">=",
				"<=": "<=",
				"=": "=",
				"<>": "<>",
				"@": "@",
				"#": "#"
			},

			mOperatorPrecedence = {
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
			},

			fnDecodeEscapeSequence = function (str: string) {
				return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
					return String.fromCharCode(parseInt(arguments[1], 16));
				});
			},


			mParseFunctions = {
				string(node: ParserNode) {
					let sValue = fnDecodeEscapeSequence(node.value);

					sValue = sValue.replace(/\\\\/g, "\\"); // unescape backslashes
					return '"' + sValue + '"';
				},
				"null"() { // means: no parameter specified
					return "";
				},
				assign(node: ParserNode) {
					// see also "let"
					if (node.left.type !== "identifier") {
						throw that.composeError(Error(), "Unexpected assing type", node.type, node.pos); // should not occur
					}
					const sValue = fnParseOneArg(node.left) + node.value + fnParseOneArg(node.right);

					return sValue;
				},
				number(node: ParserNode) {
					return node.value.toUpperCase(); // maybe "e" inside
				},
				binnumber(node: ParserNode) {
					return node.value.toUpperCase(); // maybe "&x"
				},
				hexnumber(node: ParserNode) {
					return node.value.toUpperCase();
				},
				identifier(node: ParserNode) { // identifier or identifier with array
					let sValue = node.value; // keep case, maybe mixed

					if (node.args) { // args including brackets
						const aNodeArgs = fnParseArgs(node.args),
							sBracketOpen = aNodeArgs.shift(),
							sBracketClose = aNodeArgs.pop();

						sValue += sBracketOpen + aNodeArgs.join(",") + sBracketClose;
					}

					return sValue;
				},
				linenumber(node: ParserNode) {
					return node.value;
				},
				label(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args);
					let sValue = aNodeArgs.join(":");

					if (node.value !== "direct") {
						sValue = node.value + " " + sValue;
					}
					return sValue;
				},

				// special keyword functions
				"|"(node: ParserNode) { // rsx
					const aNodeArgs = fnParseArgs(node.args);
					let	sValue = node.value.toUpperCase(); // use value!

					if (aNodeArgs.length) {
						sValue += "," + aNodeArgs.join(",");
					}
					return sValue;
				},
				afterGosub(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args);
					let sValue = "AFTER " + aNodeArgs[0];

					if (aNodeArgs[1]) {
						sValue += "," + aNodeArgs[1];
					}
					sValue += " GOSUB " + aNodeArgs[2];
					return sValue;
				},
				chainMerge(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args),
						sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type] || node.type.toUpperCase();

					if (aNodeArgs.length === 3) {
						aNodeArgs[2] = "DELETE " + aNodeArgs[2];
					}

					const sValue = sTypeUc + " " + aNodeArgs.join(",");

					return sValue;
				},
				data(node: ParserNode) {
					const aNodeArgs = [],
						regExp = new RegExp(",|^ +| +$");

					for (let i = 0; i < node.args.length; i += 1) {
						let sValue2 = fnParseOneArg(node.args[i]);

						if (sValue2) {
							sValue2 = sValue2.substr(1, sValue2.length - 2); // remove surrounding quotes
							sValue2 = sValue2.replace(/\\"/g, "\""); // unescape "

							if (sValue2) {
								if (regExp.test(sValue2)) {
									sValue2 = '"' + sValue2 + '"';
								}
							}
						}
						aNodeArgs.push(sValue2);
					}

					let sName = node.type.toUpperCase(),
						sValue = aNodeArgs.join(",");

					if (sValue !== "") { // argument?
						sName += " ";
					}

					sValue = sName + sValue;
					return sValue;
				},
				def(node: ParserNode) {
					const sName = fnParseOneArg(node.left),
						sSpace = node.left.bSpace ? " " : "", // fast hack
						aNodeArgs = fnParseArgs(node.args),
						sExpression = fnParseOneArg(node.right);
					let	sNodeArgs = aNodeArgs.join(",");

					if (sNodeArgs !== "") { // not empty?
						sNodeArgs = "(" + sNodeArgs + ")";
					}

					const sName2 = sName.substr(0, 2).toUpperCase() + sSpace + sName.substr(2),
						sValue = node.type.toUpperCase() + " " + sName2 + sNodeArgs + "=" + sExpression;

					return sValue;
				},
				"else"(node: ParserNode) { // similar to a comment, with unchecked tokens
					const aArgs = node.args;
					let	sValue = "";

					for (let i = 0; i < aArgs.length; i += 1) {
						const oToken = aArgs[i];

						if (oToken.value) {
							sValue += " " + oToken.value;
						}
					}
					// TODO: whitespaces?
					sValue = node.type.toUpperCase() + sValue;
					return sValue;
				},
				ent(node: ParserNode) {
					const aArgs = node.args,
						aNodeArgs = [];
					let	bEqual = false;

					for (let i = 0; i < aArgs.length; i += 1) {
						if (aArgs[i].type !== "null") {
							let sArg = fnParseOneArg(aArgs[i]);

							if (bEqual) {
								sArg = "=" + sArg;
								bEqual = false;
							}
							aNodeArgs.push(sArg);
						} else {
							bEqual = true;
						}
					}
					const sValue = node.type.toUpperCase() + " " + aNodeArgs.join(",");

					return sValue;
				},
				env(node: ParserNode) {
					return this.ent(node);
				},
				everyGosub(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args);
					let sValue = "EVERY " + aNodeArgs[0];

					if (aNodeArgs[1]) {
						sValue += "," + aNodeArgs[1];
					}
					sValue += " GOSUB " + aNodeArgs[2];
					return sValue;
				},
				fn(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args),
						sName = fnParseOneArg(node.left),
						sSpace = node.left.bSpace ? " " : ""; // fast hack
					let	sNodeArgs = aNodeArgs.join(",");

					if (sNodeArgs !== "") { // not empty?
						sNodeArgs = "(" + sNodeArgs + ")";
					}

					const sName2 = sName.substr(0, 2).toUpperCase() + sSpace + sName.substr(2),
						sValue = sName2 + sNodeArgs;

					return sValue;
				},
				"for"(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args),
						sVarName = aNodeArgs[0],
						startValue = aNodeArgs[1],
						endValue = aNodeArgs[2],
						stepValue = aNodeArgs[3];
					let sValue = node.type.toUpperCase() + " " + sVarName + "=" + startValue + " TO " + endValue;

					if (stepValue !== "") { // "null" is ""
						sValue += " STEP " + stepValue;
					}
					return sValue;
				},
				"if"(node: ParserNode) {
					let sValue = node.type.toUpperCase() + " " + fnParseOneArg(node.left) + " THEN ";

					const oNodeBranch = node.args,
						aNodeArgs = fnParseArgs(oNodeBranch); // args for "then"

					if (oNodeBranch.length && oNodeBranch[0].type === "goto" && oNodeBranch[0].len === 0) { // inserted goto?
						aNodeArgs[0] = fnParseOneArg(oNodeBranch[0].args[0]); // take just line number
					}
					sValue += aNodeArgs.join(":");

					if (node.args2) {
						sValue += " ELSE ";
						const oNodeBranch2 = node.args2,
							aNodeArgs2 = fnParseArgs(oNodeBranch2); // args for "else"

						if (oNodeBranch2.length && oNodeBranch2[0].type === "goto" && oNodeBranch2[0].len === 0) { // inserted goto?
							aNodeArgs2[0] = fnParseOneArg(oNodeBranch2[0].args[0]); // take just line number
						}
						sValue += aNodeArgs2.join(":");
					}
					return sValue;
				},
				input(node: ParserNode) { // input or line input
					const aNodeArgs = fnParseArgs(node.args),
						sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type] || node.type.toUpperCase(),
						bHasStream = aNodeArgs.length && (String(aNodeArgs[0]).charAt(0) === "#");
					let	i = 0;

					if (bHasStream) { // stream?
						i += 1;
					}

					let sValue = sTypeUc;

					if (aNodeArgs.length && !bHasStream && String(aNodeArgs[0]).charAt(0) !== '"') {
						// TODO: empty CRLF marker
						sValue += " ";
					}

					aNodeArgs.splice(i, 4, aNodeArgs[i] + aNodeArgs[i + 1] + aNodeArgs[i + 2] + aNodeArgs[i + 3]); // combine 4 elements into one
					sValue += aNodeArgs.join(",");
					return sValue;
				},
				lineInput(node: ParserNode) {
					return this.input(node);
				},
				list(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args);

					if (aNodeArgs.length && aNodeArgs[0] === "") { // empty range?
						aNodeArgs.shift(); // remove
					}

					if (aNodeArgs.length && aNodeArgs[aNodeArgs.length - 1] === "#") { // dummy stream?
						aNodeArgs.pop(); // remove
					}

					let sValue = aNodeArgs.join(","),
						sName = node.type.toUpperCase();

					if (sValue !== "") { // argument?
						sName += " ";
					}

					sValue = sName + sValue;
					return sValue;
				},
				mid$Assign(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args),
						sTypeUc = CodeGeneratorBasic.mCombinedKeywords[node.type],
						sValue = sTypeUc + "(" + aNodeArgs.join(",") + ")=" + fnParseOneArg(node.right);

					return sValue;
				},
				onGosub(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args);
					let sValue = aNodeArgs.shift();

					sValue = "ON " + sValue + " GOSUB " + aNodeArgs.join(",");
					return sValue;
				},
				onGoto(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args);
					let	sValue = aNodeArgs.shift();

					sValue = "ON " + sValue + " GOTO " + aNodeArgs.join(",");
					return sValue;
				},
				onSqGosub(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args),
						sValue = "ON SQ(" + aNodeArgs[0] + ") GOSUB " + aNodeArgs[1];

					return sValue;
				},
				print(node: ParserNode) {
					const regExp = new RegExp("[a-zA-Z0-9.]"),
						aNodeArgs = fnParseArgs(node.args),
						bHasStream = aNodeArgs.length && (String(aNodeArgs[0]).charAt(0) === "#");
					let sValue = node.value.toUpperCase(); // we use value to get PRINT or ?

					if (sValue === "PRINT" && aNodeArgs.length && !bHasStream) { // PRINT with args and not stream?
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
				},
				rem(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args);
					let	sValue = aNodeArgs[0];

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
					return sValue;
				},
				using(node: ParserNode) {
					const aNodeArgs = fnParseArgs(node.args);

					let sTemplate = aNodeArgs.shift();

					if (sTemplate.charAt(0) !== '"') { // not a string => space required
						sTemplate = " " + sTemplate;
					}
					const sValue = node.type.toUpperCase() + sTemplate + ";" + aNodeArgs.join(","); // separator between args could be "," or ";", we use ","

					return sValue;
				}
			},

			fnParseOther = function (node: ParserNode) {
				const sType = node.type,
					sTypeUc = CodeGeneratorBasic.mCombinedKeywords[sType] || sType.toUpperCase(),
					sKeyType = BasicParser.mKeywords[sType];
				let	sArgs = "";

				if (node.left) {
					sArgs += fnParseOneArg(node.left);
				}

				if (!sKeyType) {
					if (node.value) { // e.g. string,...
						sArgs += node.value;
					}
				}

				if (node.right) {
					sArgs += fnParseOneArg(node.right);
				}
				/*
				if (node.third) {
					sArgs += fnParseOneArg(node.third);
				}
				*/
				if (node.args) {
					sArgs += fnParseArgs(node.args).join(",");
				}

				let sValue: string;

				if (sKeyType) {
					sValue = sTypeUc;
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
			},

			parseNode = function (node: ParserNode) { // eslint-disable-line complexity
				if (Utils.debug > 3) {
					Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
				}

				const sType = node.type,
					mPrecedence = mOperatorPrecedence;
				let	value: string;

				if (mOperators[sType]) {
					if (node.left) {
						value = parseNode(node.left);
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

						let value2 = parseNode(node.right);

						if (mOperators[node.right.type] && (node.right.left || node.right.right)) { // binary operator (or unary operator, e.g. not)
							const p = mPrecedence[node.type];
							let pr: number;

							if (node.right.left) { // right is binary
								pr = mPrecedence[node.right.type] || 0;
							} else {
								pr = mPrecedence["p" + node.right.type] || mPrecedence[node.right.type] || 0;
							}

							if ((pr < p) || ((pr === p) && node.type === "-")) { // "-" is special
								value2 = "(" + value2 + ")";
							}
						}
						value += mOperators[sType].toUpperCase() + value2;
					} else { // unary operator
						value = parseNode(node.right);
						const p = mPrecedence["p" + node.type] || mPrecedence[node.type] || 0; // check unary operator first
						let pr: number;

						if (node.right.left) { // was binary op?
							pr = mPrecedence[node.right.type] || 0; // no special prio
						} else {
							pr = mPrecedence["p" + node.right.type] || mPrecedence[node.right.type] || 0; // check unary operator first
						}
						if (p && pr && (pr < p)) {
							value = "(" + value + ")";
						}
						value = mOperators[sType].toUpperCase() + value;
					}
				} else if (mParseFunctions[sType]) { // function with special handling?
					value = mParseFunctions[sType](node);
				} else { // for other functions, generate code directly
					value = fnParseOther(node);
				}

				return value;
			},

			fnEvaluate = function () {
				let sOutput = "";

				for (let i = 0; i < parseTree.length; i += 1) {
					if (Utils.debug > 2) {
						Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
					}
					const sNode = parseNode(parseTree[i]);

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
			};

		return fnEvaluate();
	}

	generate(sInput: string, bAllowDirect?: boolean) {
		const oOut = {
			text: "",
			error: undefined
		};

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
