// BasicParser.ts - BASIC Parser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
// BASIC parser for Locomotive BASIC 1.1 for Amstrad CPC 6128
//

// [ https://www.codeproject.com/Articles/345888/How-to-write-a-simple-interpreter-in-JavaScript ; test online: http://jsfiddle.net/h3xwj/embedded/result/ ]
//
// http://crockford.com/javascript/tdop/tdop.html
// Top Down Operator Precedence
// http://crockford.com/javascript/tdop/parse.js
// http://crockford.com/javascript/tdop/index.html
//
// http://stevehanov.ca/blog/?id=92
// http://stevehanov.ca/qb.js/qbasic.js
//
// http://www.csidata.com/custserv/onlinehelp/vbsdocs/vbs232.htm  (operator precedence) ?
// How to write a simple interpreter in JavaScript
// Peter_Olson, 30 Oct 2014

import { Utils } from "./Utils";
import { LexerToken } from "./BasicLexer";

interface BasicParserOptions {
	bQuiet?: boolean
	bKeepBrackets?: boolean
}

export interface ParserNode extends LexerToken {
	left?: ParserNode
	right?: ParserNode
	args?: ParserNode[]
	args2?: ParserNode[] // only used for if: "else" statements
	len?: number
	bSpace?: boolean
	bParenthesis?: boolean
}

type ParseExpressionFunction = (arg0: ParserNode) => ParserNode;

type ParseStatmentFunction = () => ParserNode;

interface SymbolType {
	id: string
	nud?: ParseExpressionFunction
	lbp?: number
	led?: ParseExpressionFunction
	std?: ParseStatmentFunction
}

export class BasicParser {
	private sLine = "0"; // for error messages
	private bQuiet = false;
	private bKeepBrackets = false;

	private oSymbols: { [k in string]: SymbolType } = {};

	// set also during parse
	private aTokens: LexerToken[] = [];
	private bAllowDirect = false;

	private iIndex = 0;
	private oPreviousToken: ParserNode;
	private oToken: ParserNode; // current token
	private aParseTree: ParserNode[] = [];

	constructor(options?: BasicParserOptions) {
		this.bQuiet = options?.bQuiet || false;
		this.bKeepBrackets = options?.bKeepBrackets || false;
		this.fnGenerateSymbols();

		this.oPreviousToken = {} as ParserNode; // to avoid warnings
		this.oToken = this.oPreviousToken;
	}

	private static mParameterTypes: { [k in string]: string } = {
		c: "command",
		f: "function",
		o: "operator",

		n: "number",
		s: "string",
		l: "line number", // checked
		q: "line number range",
		v: "variable", // checked,
		r: "letter or range",
		a: "any parameter",
		"n0?": "optional parameter with default null",
		"#": "stream"
	}

	// first letter: c=command, f=function, o=operator, x=additional keyword for command
	// following are arguments: n=number, s=string, l=line number (checked), v=variable (checked), r=letter or range, a=any, n0?=optional parameter with default null, #=stream, #0?=optional stream with default 0; suffix ?=optional (optionals must be last); last *=any number of arguments may follow
	static mKeywords: { [k in string]: string } = {
		abs: "f n", // ABS(<numeric expression>)
		after: "c", // => afterGosub
		afterGosub: "c n n?", // AFTER <timer delay>[,<timer number>] GOSUB <line number> / (special, cannot check optional first n, and line number)
		and: "o", // <argument> AND <argument>
		asc: "f s", // ASC(<string expression>)
		atn: "f n", // ATN(<numeric expression>)
		auto: "c n0? n0?", // AUTO [<line number>][,<increment>]
		bin$: "f n n?", // BIN$(<unsigned integer expression>[,<integer expression>])
		border: "c n n?", // BORDER <color>[,<color>]
		"break": "x", // see: ON BREAK...
		call: "c n *", // CALL <address expression>[,<list of: parameter>]
		cat: "c", // CAT
		chain: "c s n?", // CHAIN <filename>[,<line number expression>]  or: => chainMerge
		chainMerge: "c s n? *", // CHAIN MERGE <filename>[,<line number expression>][,DELETE <line number range>] / (special)
		chr$: "f n", // CHR$(<integer expression>)
		cint: "f n", // CINT(<numeric expression>)
		clear: "c", // CLEAR  or: => clearInput
		clearInput: "c", // CLEAR INPUT
		clg: "c n?", // CLG[<ink>]
		closein: "c", // CLOSEIN
		closeout: "c", // CLOSEOUT
		cls: "c #0?", // CLS[#<stream expression>]
		cont: "c", // CONT
		copychr$: "f #", // COPYCHR$(#<stream expression>)
		cos: "f n", // COS(<numeric expression>)
		creal: "f n", // CREAL(<numeric expression>)
		cursor: "c #0? n0? n?", // CURSOR [<system switch>][,<user switch>] (either parameter can be omitted but not both)
		data: "c n0*", // DATA <list of: constant> (rather 0*, insert dummy null, if necessary)
		dec$: "f n s", // DEC$(<numeric expression>,<format template>)
		def: "c s *", // DEF FN[<space>]<function name>[(<formal parameters>)]=<expression> / (not checked from this)
		defint: "c r r*", // DEFINT <list of: letter range>
		defreal: "c r r*", // DEFREAL <list of: letter range>
		defstr: "c r r*", // DEFSTR <list of: letter range>
		deg: "c", // DEG
		"delete": "c q?", // DELETE [<line number range>] / (not checked from this)
		derr: "f", // DERR
		di: "c", // DI
		dim: "c v *", // DIM <list of: subscripted variable>
		draw: "c n n n0? n?", // DRAW <x coordinate>,<y coordinate>[,[<ink>][,<ink mode>]]
		drawr: "c n n n0? n?", // DRAWR <x offset>,<y offset>[,[<ink>][,<ink mode>]]
		edit: "c l", // EDIT <line number>
		ei: "c", // EI
		"else": "c", // see: IF (else belongs to "if", but can also be used as command)
		end: "c", // END
		ent: "c n *", // ENT <envelope number>[,<envelope section][,<envelope section>]... (up to 5) / section: <number of steps>,<step size>,<pause time>  or: =<tone period>,<pause time>
		env: "c n *", // ENV <envelope number>[,<envelope section][,<envelope section>]... (up to 5) / section: <number of steps>,<step size>,<pause time>  or: =<hardware envelope>,<envelope period>
		eof: "f", // EOF
		erase: "c v *", // ERASE <list of: variable name>  (array names without indices or dimensions)
		erl: "f", // ERL
		err: "f", // ERR
		error: "c n", // ERROR <integer expression>
		every: "c", // => everyGosub
		everyGosub: "c n n?", // EVERY <timer delay>[,<timer number>] GOSUB <line number>  / (special, cannot check optional first n, and line number)
		exp: "f n", // EXP(<numeric expression>)
		fill: "c n", // FILL <ink>
		fix: "f n", // FIX(<numeric expression>)
		fn: "f", // see DEF FN / (FN can also be separate from <function name>)
		"for": "c", // FOR <simple variable>=<start> TO <end> [STEP <size>]
		frame: "c", // FRAME
		fre: "f a", // FRE(<numeric expression>)  or: FRE(<string expression>)
		gosub: "c l", // GOSUB <line number>
		"goto": "c l", // GOTO <line number>
		graphics: "c", // => graphicsPaper or graphicsPen
		graphicsPaper: "x n", // GRAPHICS PAPER <ink>  / (special)
		graphicsPen: "x n0? n?", // GRAPHICS PEN [<ink>][,<background mode>]  / (either of the parameters may be omitted, but not both)
		hex$: "f n n?", // HEX$(<unsigned integer expression>[,<field width>])
		himem: "f", // HIMEM
		"if": "c", // IF <logical expression> THEN <option part> [ELSE <option part>]
		ink: "c n n n?", // INK <ink>,<color>[,<color>]
		inkey: "f n", // INKEY(<integer expression>)
		inkey$: "f", // INKEY$
		inp: "f n", // INP(<port number>)
		input: "c #0? *", // INPUT[#<stream expression>,][;][<quoted string><separator>]<list of: variable>  / (special: not checked from this)
		instr: "f a a a?", // INSTR([<start position>,]<searched string>,<searched for string>)  / (cannot check "f n? s s")
		"int": "f n", // INT(<numeric expression>)
		joy: "f n", // JOY(<integer expression>)
		key: "c n s", // KEY <expansion token number>,<string expression>  / or: => keyDef
		keyDef: "c n n n? n? n?", // KEY DEF <key number>,<repeat>[,<normal>[,<shifted>[,<control>]]]
		left$: "f s n", // LEFT$(<string expression>,<required length>)
		len: "f s", // LEN(<string expression>)
		let: "c", // LET <variable>=<expression>
		line: "c", // => lineInput / (not checked from this)
		lineInput: "c #0? *", // INPUT INPUT[#<stream expression>,][;][<quoted string><separator>]<string variable> (not checked from this)
		list: "c q0? #0?", // LIST [<line number range>][,#<stream expression>] (not checked from this, we cannot check multiple optional args; here we have stream as last parameter)
		load: "c s n?", // LOAD <filename>[,<address expression>]
		locate: "c #0? n n", // LOCATE [#<stream expression>,]<x coordinate>,<y coordinate>
		log: "f n", // LOG(<numeric expression>)
		log10: "f n", // LOG10(<numeric expression>)
		lower$: "f s", // LOWER$(<string expression>)
		mask: "c n0? n?", // MASK [<integer expression>][,<first point setting>]  / (either of the parameters may be omitted, but not both)
		max: "f n *", // MAX(<list of: numeric expression>)
		memory: "c n", // MEMORY <address expression>
		merge: "c s", // MERGE <filename>
		mid$: "f s n n?", // MID$(<string expression>,<start position>[,<sub-string length>])  / (start position=1..255, sub-string length=0..255)
		mid$Assign: "f s n n?", // MID$(<string variable>,<insertion point>[,<new string length>])=<new string expression>  / (mid$ as assign)
		min: "f n *", // MIN(<list of: numeric expression>)
		mod: "o", // <argument> MOD <argument>
		mode: "c n", // MODE <integer expression>
		move: "c n n n0? n?", // MOVE <x coordinate>,<y coordinate>[,[<ink>][,<ink mode>]]
		mover: "c n n n0? n?", // MOVER <x offset>,<y offset>[,[<ink>][,<ink mode>]]
		"new": "c", // NEW
		next: "c v*", // NEXT [<list of: variable>]
		not: "o", // NOT <argument>
		on: "c", // => onBreakCont, on break gosub, on break stop, on error goto, on <ex> gosub, on <ex> goto, on sq(n) gosub
		onBreakCont: "c", // ON BREAK CONT  / (special)
		onBreakGosub: "c l", // ON BREAK GOSUB <line number>  / (special)
		onBreakStop: "c", // ON BREAK STOP  / (special)
		onErrorGoto: "c l", // ON ERROR GOTO <line number>  / (special)
		onGosub: "c l l*", // ON <selector> GOSUB <list of: line number>  / (special; n not checked from this)
		onGoto: "c l l*", // ON <selector> GOTO <list of: line number>  / (special; n not checked from this)
		onSqGosub: "c l", // ON SQ(<channel>) GOSUB <line number>  / (special)
		openin: "c s", // OPENIN <filename>
		openout: "c s", // OPENOUT <filename>
		or: "o", // <argument> OR <argument>
		origin: "c n n n? n? n? n?", // ORIGIN <x>,<y>[,<left>,<right>,<top>,<bottom>]
		out: "c n n", // OUT <port number>,<integer expression>
		paper: "c #0? n", // PAPER[#<stream expression>,]<ink>
		peek: "f n", // PEEK(<address expression>)
		pen: "c #0? n0 n?", // PEN[#<stream expression>,][<ink>][,<background mode>]  / ink=0..15; background mode=0..1
		pi: "f", // PI
		plot: "c n n n0? n?", // PLOT <x coordinate>,<y coordinate>[,[<ink>][,<ink mode>]]
		plotr: "c n n n0? n?", // PLOTR <x offset>,<y offset>[,[<ink>][,<ink mode>]]
		poke: "c n n", // POKE <address expression>,<integer expression>
		pos: "f #", // POS(#<stream expression>)
		print: "c #0? *", // PRINT[#<stream expression>,][<list of: print items>] ... [;][SPC(<integer expression>)] ... [;][TAB(<integer expression>)] ... [;][USING <format template>][<separator expression>]
		rad: "c", // RAD
		randomize: "c n?", // RANDOMIZE [<numeric expression>]
		read: "c v v*", // READ <list of: variable>
		release: "c n", // RELEASE <sound channels>  / (sound channels=1..7)
		rem: "c s?", // REM <rest of line>
		remain: "f n", // REMAIN(<timer number>)  / (timer number=0..3)
		renum: "c n0? n0? n?", // RENUM [<new line number>][,<old line number>][,<increment>]
		restore: "c l?", // RESTORE [<line number>]
		resume: "c l?", // RESUME [<line number>]  or: => resumeNext
		resumeNext: "c", // RESUME NEXT
		"return": "c", // RETURN
		right$: "f s n", // RIGHT$(<string expression>,<required length>)
		rnd: "f n?", // RND[(<numeric expression>)]
		round: "f n n?", // ROUND(<numeric expression>[,<decimals>])
		run: "c a?", // RUN <string expression>  or: RUN [<line number>]  / (cannot check "c s | l?")
		save: "c s a? n? n? n?", // SAVE <filename>[,<file type>][,<binary parameters>]  // <binary parameters>=<start address>,<file tength>[,<entry point>]
		sgn: "f n", // SGN(<numeric expression>)
		sin: "f n", // SIN(<numeric expression>)
		sound: "c n n n? n0? n0? n0? n?", // SOUND <channel status>,<tone period>[,<duration>[,<volume>[,<valume envelope>[,<tone envelope>[,<noise period>]]]]]
		space$: "f n", // SPACE$(<integer expression>)
		spc: "f n", // SPC(<integer expression)  / see: PRINT SPC
		speed: "c", // => speedInk, speedKey, speedWrite
		speedInk: "c n n", // SPEED INK <period1>,<period2>  / (special)
		speedKey: "c n n", // SPEED KEY <start delay>,<repeat period>  / (special)
		speedWrite: "c n", // SPEED WRITE <integer expression>  / (integer expression=0..1)
		sq: "f n", // SQ(<channel>)  / (channel=1,2 or 4)
		sqr: "f n", // SQR(<numeric expression>)
		step: "x", // STEP <size> / see: FOR
		stop: "c", // STOP
		str$: "f n", // STR$(<numeric expression>)
		string$: "f n a", // STRING$(<length>,<character specificier>) / character specificier=string character or number 0..255
		swap: "x n n?", // => windowSwap
		symbol: "c n n *", // SYMBOL <character number>,<list of: rows>   or => symbolAfter  / character number=0..255, list of 1..8 rows=0..255
		symbolAfter: "c n", // SYMBOL AFTER <integer expression>  / integer expression=0..256 (special)
		tab: "f n", // TAB(<integer expression)  / see: PRINT TAB
		tag: "c #0?", // TAG[#<stream expression>]
		tagoff: "c #0?", // TAGOFF[#<stream expression>]
		tan: "f n", // TAN(<numeric expression>)
		test: "f n n", // TEST(<x coordinate>,<y coordinate>)
		testr: "f n n", // TESTR(<x offset>,<y offset>)
		then: "x", // THEN <option part>  / see: IF
		time: "f", // TIME
		to: "x", // TO <end>  / see: FOR
		troff: "c", // TROFF
		tron: "c", // TRON
		unt: "f n", // UNT(<address expression>)
		upper$: "f s", // UPPER$(<string expression>)
		using: "x", // USING <format template>[<separator expression>]  / see: PRINT
		val: "f s", // VAL (<string expression>)
		vpos: "f #", // VPOS(#<stream expression>)
		wait: "c n n n?", // WAIT <port number>,<mask>[,<inversion>]
		wend: "c", // WEND
		"while": "c n", // WHILE <logical expression>
		width: "c n", // WIDTH <integer expression>
		window: "c #0? n n n n", // WINDOW[#<stream expression>,]<left>,<right>,<top>,<bottom>  / or: => windowSwap
		windowSwap: "c n n?", // WINDOW SWAP <stream expression>[,<stream expression>]  / (special: with numbers, not streams)
		write: "c #0? *", // WRITE [#<stream expression>,][<write list>]  / (not checked from this)
		xor: "o", // <argument> XOR <argument>
		xpos: "f", // XPOS
		ypos: "f", // YPOS
		zone: "c n" // ZONE <integer expression>  / integer expression=1..255
	}

	private static mCloseTokens: { [k in string]: number } = {
		":": 1,
		"(eol)": 1,
		"(end)": 1,
		"else": 1,
		rem: 1,
		"'": 1
	}

	private composeError(oError: Error, message: string, value: string, pos: number) {
		return Utils.composeError("BasicParser", oError, message, value, pos, this.sLine);
	}


	// http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
	// http://crockford.com/javascript/tdop/parse.js
	// Operator precedence parsing
	//
	// Operator: With left binding power (lbp) and operational function.
	// Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
	// identifiers, numbers: also nud.
	private getToken() {
		return this.oToken;
	}

	private symbol(id: string, nud?: ParseExpressionFunction, lbp?: number, led?: ParseExpressionFunction) {
		let oSymbol = this.oSymbols[id];

		if (!oSymbol) {
			this.oSymbols[id] = {} as SymbolType;
			oSymbol = this.oSymbols[id];
		}
		if (nud) {
			oSymbol.nud = nud;
		}
		if (lbp) {
			oSymbol.lbp = lbp;
		}
		if (led) {
			oSymbol.led = led;
		}
		return oSymbol;
	}

	private advance(id?: string) {
		let oToken = this.oToken;

		this.oPreviousToken = this.oToken;
		if (id && oToken.type !== id) {
			throw this.composeError(Error(), "Expected " + id, (oToken.value === "") ? oToken.type : oToken.value, oToken.pos);
		}
		if (this.iIndex >= this.aTokens.length) {
			Utils.console.warn("advance: end of file");
			if (this.aTokens.length && this.aTokens[this.aTokens.length - 1].type === "(end)") {
				oToken = this.aTokens[this.aTokens.length - 1];
			} else {
				Utils.console.warn("advance: No (end) token!");
				oToken = BasicParser.fnCreateDummyArg("(end)");
				oToken.value = ""; // null
			}
			return oToken;
		}
		oToken = this.aTokens[this.iIndex] as ParserNode; // we get a lex token and reuse it as parseTree token
		this.iIndex += 1;
		if (oToken.type === "identifier" && BasicParser.mKeywords[oToken.value.toLowerCase()]) {
			oToken.type = oToken.value.toLowerCase(); // modify type identifier => keyword xy
		}
		const oSym = this.oSymbols[oToken.type];

		if (!oSym) {
			throw this.composeError(Error(), "Unknown token", oToken.type, oToken.pos);
		}

		this.oToken = oToken;
		return oToken;
	}

	private expression(rbp: number) {
		let t = this.oToken,
			s = this.oSymbols[t.type];

		if (Utils.debug > 3) {
			Utils.console.debug("parse: expression rbp=" + rbp + " type=" + t.type + " t=%o", t);
		}
		this.advance(t.type);
		if (!s.nud) {
			if (t.type === "(end)") {
				throw this.composeError(Error(), "Unexpected end of file", "", t.pos);
			} else {
				throw this.composeError(Error(), "Unexpected token", t.type, t.pos);
			}
		}

		let left = s.nud.call(this, t); // process literals, variables, and prefix operators

		t = this.oToken;
		s = this.oSymbols[t.type];
		while (rbp < (s.lbp || 0)) { // as long as the right binding power is less than the left binding power of the next token...
			this.advance(t.type);
			if (!s.led) {
				throw this.composeError(Error(), "Unexpected token", t.type, t.pos); //TTT how to get this error?
			}
			left = s.led.call(this, left); // ...the led method is invoked on the following token (infix and suffix operators), can be recursive
			t = this.oToken;
			s = this.oSymbols[t.type];
		}
		return left;
	}

	private assignment() { // "=" as assignment, similar to let
		if (this.oToken.type !== "identifier") {
			throw this.composeError(Error(), "Expected identifier", this.oToken.type, this.oToken.pos);
		}

		const oLeft = this.expression(90), // take it (can also be an array) and stop
			oValue = this.oToken;

		this.advance("="); // equal as assignment
		oValue.left = oLeft;
		oValue.right = this.expression(0);
		oValue.type = "assign"; // replace "="
		return oValue;
	}

	private statement() {
		const t = this.oToken,
			s = this.oSymbols[t.type];

		if (s.std) { // statement?
			this.advance();
			return s.std.call(this);
		}

		let oValue: ParserNode;

		if (t.type === "identifier") {
			oValue = this.assignment();
		} else {
			oValue = this.expression(0);
		}

		if (oValue.type !== "assign" && oValue.type !== "fcall" && oValue.type !== "def" && oValue.type !== "(" && oValue.type !== "[") {
			throw this.composeError(Error(), "Bad expression statement", t.value, t.pos);
		}
		return oValue;
	}

	private statements(sStopType: string) {
		const aStatements: ParserNode[] = [];

		let bColonExpected = false;

		while (this.oToken.type !== "(end)" && this.oToken.type !== "(eol)") {
			if (sStopType && this.oToken.type === sStopType) {
				break;
			}
			if (bColonExpected || this.oToken.type === ":") {
				if (this.oToken.type !== "'" && this.oToken.type !== "else") { // no colon required for line comment or ELSE
					this.advance(":");
					if (this.bKeepBrackets) { // TTT reuse
						aStatements.push(this.oPreviousToken);
					}
				}
				bColonExpected = false;
			} else {
				const oStatement = this.statement();

				aStatements.push(oStatement);
				bColonExpected = true;
			}
		}
		return aStatements;
	}

	private line() {
		let oValue: ParserNode;

		if (this.oToken.type !== "number" && this.bAllowDirect) {
			this.bAllowDirect = false; // allow only once
			oValue = BasicParser.fnCreateDummyArg("label");
			oValue.value = "direct"; // insert "direct" label
		} else {
			this.advance("number");
			oValue = this.oPreviousToken; // number token
			oValue.type = "label"; // number => label
		}
		this.sLine = oValue.value; // set line number for error messages
		oValue.args = this.statements("");

		if (this.oToken.type === "(eol)") {
			this.advance("(eol)");
		}
		return oValue;
	}

	private infix(id: string, lbp: number, rbp?: number, led?: ParseExpressionFunction) {
		rbp = rbp || lbp;
		const fnLed = led || ((left: ParserNode) => {
			const oValue = this.oPreviousToken;

			oValue.left = left;
			oValue.right = this.expression(rbp as number);
			return oValue;
		});

		this.symbol(id, undefined, lbp, fnLed);
	}

	private infixr(id: string, lbp: number) {
		const fnLed = ((left: ParserNode) => {
			const oValue = this.oPreviousToken;

			oValue.left = left;
			oValue.right = this.expression(lbp - 1);
			return oValue;
		});

		this.symbol(id, undefined, lbp, fnLed);
	}

	private prefix(id: string, rbp: number) {
		const fnNud = () => {
			const oValue = this.oPreviousToken;

			oValue.right = this.expression(rbp);
			return oValue;
		};

		this.symbol(id, fnNud);
	}

	private stmt(s: string, f: ParseStatmentFunction) {
		const x = this.symbol(s);

		x.std = f;
		return x;
	}


	private static fnCreateDummyArg(sType: string, sValue?: string) {
		const oValue: ParserNode = {
			type: sType, // e.g. "null"
			value: sValue !== undefined ? sValue : sType, // e.g. "null"
			pos: 0,
			len: 0
		};

		return oValue;
	}

	private fnCombineTwoTokensNoArgs(sToken2: string) {
		const oPreviousToken = this.oPreviousToken,
			sName = oPreviousToken.type + Utils.stringCapitalize(this.oToken.type); // e.g ."speedInk"

		oPreviousToken.value += (this.oToken.ws || " ") + this.oToken.value; // combine values of both

		this.oToken = this.advance(sToken2); // for "speed" e.g. "ink", "key", "write" (this.oToken.type)

		this.oPreviousToken = oPreviousToken; // fast hack to get e.g. "speed" token

		return sName;
	}

	private fnCombineTwoTokens(sToken2: string) {
		const sName = this.fnCombineTwoTokensNoArgs(sToken2),
			oValue = this.fnCreateCmdCall(sName);

		return oValue;
	}

	private fnGetOptionalStream() {
		let oValue: ParserNode;

		if (this.oToken.type === "#") { // stream?
			oValue = this.expression(0);
		} else { // create dummy
			oValue = BasicParser.fnCreateDummyArg("#"); // dummy stream
			oValue.right = BasicParser.fnCreateDummyArg("null", "0"); // ...with dummy parameter
		}
		return oValue;
	}

	private fnChangeNumber2LineNumber(oNode: ParserNode) {
		if (oNode.type === "number") {
			oNode.type = "linenumber"; // change type: number => linenumber
		} else {
			throw this.composeError(Error(), "Expected number type", oNode.type, oNode.pos);
		}
	}

	private fnGetLineRange(sTypeFirstChar: string) { // l1 or l1-l2 or l1- or -l2 or nothing
		let oLeft: ParserNode | undefined;

		if (this.oToken.type === "number") {
			oLeft = this.oToken;
			this.advance("number");
			this.fnChangeNumber2LineNumber(oLeft);
		}

		let oRange: ParserNode | undefined;

		if (this.oToken.type === "-") {
			oRange = this.oToken;
			this.advance("-");
		}

		if (oRange) {
			let oRight: ParserNode | undefined;

			if (this.oToken.type === "number") {
				oRight = this.oToken;
				this.advance("number");
				this.fnChangeNumber2LineNumber(oRight);
			}
			if (!oLeft && !oRight) {
				throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], this.oPreviousToken.value, this.oPreviousToken.pos);
			}
			oRange.type = "linerange"; // change "-" => "linerange"
			oRange.left = oLeft || BasicParser.fnCreateDummyArg("null"); // insert dummy for left
			oRange.right = oRight || BasicParser.fnCreateDummyArg("null"); // insert dummy for right (do not skip it)
		} else if (oLeft) {
			oRange = oLeft; // single line number
			oRange.type = "linenumber"; // change type: number => linenumber
		} else {
			throw this.composeError(Error(), "Undefined range", this.oToken.type, this.oToken.pos);
		}

		return oRange;
	}

	private static fnIsSingleLetterIdentifier(oValue: ParserNode) {
		return oValue.type === "identifier" && !oValue.args && oValue.value.length === 1;
	}

	private fnGetLetterRange(sTypeFirstChar: string) { // l1 or l1-l2 or l1- or -l2 or nothing
		if (this.oToken.type !== "identifier") {
			throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], this.oToken.value, this.oToken.pos);
		}
		const oExpression = this.expression(0); // n or n-n

		if (BasicParser.fnIsSingleLetterIdentifier(oExpression)) { // ok
			oExpression.type = "letter"; // change type: identifier -> letter
		} else if (oExpression.type === "-" && oExpression.left && oExpression.right && BasicParser.fnIsSingleLetterIdentifier(oExpression.left) && BasicParser.fnIsSingleLetterIdentifier(oExpression.right)) { // also ok
			oExpression.type = "range"; // change type: "-" => range
			oExpression.left.type = "letter"; // change type: identifier -> letter
			oExpression.right.type = "letter"; // change type: identifier -> letter
		} else {
			throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
		}
		return oExpression;
	}

	private fnCheckRemainingTypes(aTypes: string[]) {
		for (let i = 0; i < aTypes.length; i += 1) { // some more parameters expected?
			const sType = aTypes[i];

			if (!sType.endsWith("?") && !sType.endsWith("*")) { // mandatory?
				const sText = BasicParser.mParameterTypes[sType] || ("parameter " + sType);

				throw this.composeError(Error(), "Expected " + sText + " for " + this.oPreviousToken.type, this.oToken.value, this.oToken.pos);
			}
		}
	}

	private fnGetArgs(sKeyword?: string) { // eslint-disable-line complexity
		let aTypes: string[] | undefined;

		if (sKeyword) {
			const sKeyOpts = BasicParser.mKeywords[sKeyword];

			if (sKeyOpts) {
				aTypes = sKeyOpts.split(" ");
				aTypes.shift(); // remove keyword type
			} else {
				Utils.console.warn("fnGetArgs: No options for keyword", sKeyword);
			}
		}

		const aArgs: ParserNode[] = [],
			sSeparator = ",",
			mCloseTokens = BasicParser.mCloseTokens;
		let bNeedMore = false,
			sType = "xxx";

		while (bNeedMore || (sType && !mCloseTokens[this.oToken.type])) {
			bNeedMore = false;
			if (aTypes && sType.slice(-1) !== "*") { // "*"= any number of parameters
				sType = aTypes.shift() || "";
				if (!sType) {
					throw this.composeError(Error(), "Expected end of arguments", this.oPreviousToken.type, this.oPreviousToken.pos);
				}
			}
			const sTypeFirstChar = sType.charAt(0);
			let oExpression: ParserNode;

			if (sType === "#0?") { // optional stream?
				if (this.oToken.type === "#") { // stream?
					oExpression = this.fnGetOptionalStream();
					if (this.getToken().type === ",") { // oToken.type
						this.advance(",");
						bNeedMore = true;
					}
				} else {
					oExpression = this.fnGetOptionalStream();
				}
			} else {
				if (sTypeFirstChar === "#") { // stream expected? (for functions)
					oExpression = this.expression(0);
					if (oExpression.type !== "#") { // maybe a number
						throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
					}
				} else if (this.oToken.type === sSeparator && sType.substr(0, 2) === "n0") { // n0 or n0?: if parameter not specified, insert default value null?
					oExpression = BasicParser.fnCreateDummyArg("null");
				} else if (sTypeFirstChar === "l") {
					oExpression = this.expression(0);
					if (oExpression.type !== "number") { // maybe an expression and no plain number
						throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
					}
					this.fnChangeNumber2LineNumber(oExpression);
				} else if (sTypeFirstChar === "v") { // variable (identifier)
					oExpression = this.expression(0);
					if (oExpression.type !== "identifier") {
						throw this.composeError(Error(), "Expected " + BasicParser.mParameterTypes[sTypeFirstChar], oExpression.value, oExpression.pos);
					}
				} else if (sTypeFirstChar === "r") { // letter or range of letters (defint, defreal, defstr)
					oExpression = this.fnGetLetterRange(sTypeFirstChar);
				} else if (sTypeFirstChar === "q") { // line number range
					if (sType === "q0?") { // optional line number range
						if (this.oToken.type === "number" || this.oToken.type === "-") { // eslint-disable-line max-depth
							oExpression = this.fnGetLineRange(sTypeFirstChar);
						} else {
							oExpression = BasicParser.fnCreateDummyArg("null");
							if (aTypes && aTypes.length) { // eslint-disable-line max-depth
								bNeedMore = true; // maybe take it as next parameter
							}
						}
					} else {
						oExpression = this.fnGetLineRange(sTypeFirstChar);
					}
				} else {
					oExpression = this.expression(0);
					if (oExpression.type === "#") { // got stream?
						throw this.composeError(Error(), "Unexpected stream", oExpression.value, oExpression.pos);
					}
				}
				if (this.oToken.type === sSeparator) {
					this.advance(sSeparator);
					bNeedMore = true;
				} else if (!bNeedMore) {
					sType = ""; // stop
				}
			}
			aArgs.push(oExpression);
		}
		if (aTypes && aTypes.length) { // some more parameters expected?
			this.fnCheckRemainingTypes(aTypes); // error if remaining mandatory args
			sType = aTypes[0];
			if (sType === "#0?") { // null stream to add?
				const oExpression = BasicParser.fnCreateDummyArg("#"); // dummy stream with dummy arg

				oExpression.right = BasicParser.fnCreateDummyArg("null", "0");
				aArgs.push(oExpression);
			}
		}
		return aArgs;
	}

	private fnGetArgsSepByCommaSemi() {
		const mCloseTokens = BasicParser.mCloseTokens,
			aArgs: ParserNode[] = [];

		while (!mCloseTokens[this.oToken.type]) {
			aArgs.push(this.expression(0));
			if (this.oToken.type === "," || this.oToken.type === ";") {
				this.advance(this.oToken.type);
			} else {
				break;
			}
		}
		return aArgs;
	}

	private fnGetArgsInParenthesis() {
		this.advance("(");
		const aArgs = this.fnGetArgs(undefined); // until ")"

		this.advance(")");
		return aArgs;
	}

	private static mBrackets: { [k in string]: string } = {
		"(": ")",
		"[": "]"
	};

	private fnGetArgsInParenthesesOrBrackets() {
		const mBrackets = BasicParser.mBrackets;
		let oBracketOpen: ParserNode | undefined;

		if (this.oToken.type === "(" || this.oToken.type === "[") {
			oBracketOpen = this.oToken;
		}

		this.advance(oBracketOpen ? oBracketOpen.type : "(");
		if (!oBracketOpen) {
			throw this.composeError(Error(), "Programming error: Undefined oBracketOpen", this.oToken.type, this.oToken.pos); // should not occure
		}

		const aArgs = this.fnGetArgs(undefined); // (until "]" or ")")

		aArgs.unshift(oBracketOpen);

		let oBracketClose: ParserNode | undefined;

		if (this.oToken.type === ")" || this.oToken.type === "]") {
			oBracketClose = this.oToken;
		}
		this.advance(oBracketClose ? oBracketClose.type : ")");
		if (!oBracketClose) {
			throw this.composeError(Error(), "Programming error: Undefined oBracketClose", this.oToken.type, this.oToken.pos); // should not occure
		}

		aArgs.push(oBracketClose);
		if (mBrackets[oBracketOpen.type] !== oBracketClose.type) {
			if (!this.bQuiet) {
				Utils.console.warn(this.composeError({} as Error, "Inconsistent bracket style", this.oPreviousToken.value, this.oPreviousToken.pos).message);
			}
		}
		return aArgs;
	}

	private fnCreateCmdCall(sType?: string) {
		const oValue = this.oPreviousToken;

		if (sType) {
			oValue.type = sType; // override
		}

		oValue.args = this.fnGetArgs(oValue.type);
		return oValue;
	}

	private fnCreateFuncCall() {
		const oValue = this.oPreviousToken;

		if (this.oToken.type === "(") { // args in parenthesis?
			this.advance("(");
			oValue.args = this.fnGetArgs(oValue.type);
			this.advance(")");
		} else { // no parenthesis?
			oValue.args = [];

			// if we have a check, make sure there are no non-optional parameters left
			const sKeyOpts = BasicParser.mKeywords[oValue.type];

			if (sKeyOpts) {
				const aTypes = sKeyOpts.split(" ");

				aTypes.shift(); // remove key
				this.fnCheckRemainingTypes(aTypes);
			}
		}

		return oValue;
	}

	private fnGenerateKeywordSymbols() {
		for (const sKey in BasicParser.mKeywords) {
			if (BasicParser.mKeywords.hasOwnProperty(sKey)) {
				const sValue = BasicParser.mKeywords[sKey];

				if (sValue.charAt(0) === "f") {
					this.symbol(sKey, this.fnCreateFuncCall);
				} else if (sValue.charAt(0) === "c") {
					this.stmt(sKey, this.fnCreateCmdCall);
				}
			}
		}
	}

	// ...

	private fnIdentifier(oName: ParserNode) {
		const sName = oName.value,
			bStartsWithFn = sName.toLowerCase().startsWith("fn");

		if (bStartsWithFn) {
			if (this.oToken.type !== "(") { // Fnxxx name without ()
				const oValue: ParserNode = { // TTT new node!
					type: "fn",
					value: sName, // complete name
					args: [],
					left: oName, // identifier
					pos: oName.pos // same pos as identifier?
				};

				if (oName.ws) {
					oValue.ws = oName.ws;
					oName.ws = "";
				}

				return oValue;
			}
		}

		let oValue = oName;

		if (this.oToken.type === "(" || this.oToken.type === "[") {
			oValue = this.oPreviousToken;

			if (bStartsWithFn) {
				oValue.args = this.fnGetArgsInParenthesis();
				oValue.type = "fn"; // FNxxx in e.g. print
				oValue.left = {
					type: "identifier",
					value: oValue.value,
					pos: oValue.pos
				};
			} else {
				oValue.args = this.fnGetArgsInParenthesesOrBrackets();
			}
		}
		return oValue;
	}

	private fnParenthesis() { // "("
		let oValue: ParserNode;

		if (this.bKeepBrackets) {
			oValue = this.oPreviousToken; // "("
			oValue.args = [
				this.expression(0),
				this.oToken // ")" (hopefully)
			];
		} else {
			oValue = this.expression(0);
		}

		this.advance(")");
		return oValue;
	}

	private fnFn() { // separate fn
		const oValue = this.oPreviousToken, // "fn"
			oValue2 = this.oToken; // identifier

		this.fnCombineTwoTokensNoArgs("identifier");

		oValue2.value = "fn" + oValue2.value; // combine "fn" + identifier (maybe simplify by separating in lexer)
		if (oValue2.ws) {
			oValue2.ws = "";
		}
		oValue.left = oValue2;

		if (this.oToken.type !== "(") { // FN xxx name without ()?
			oValue.args = [];
		} else {
			oValue.args = this.fnGetArgsInParenthesis();
		}
		return oValue;
	}

	private fnApostrophe() { // "'" apostrophe comment => rem
		return this.fnCreateCmdCall("rem");
	}

	private fnRsx() { // rsx: "|"
		const oValue = this.oPreviousToken;

		if (this.oToken.type === ",") { // arguments starting with comma
			this.advance(",");
		}
		oValue.args = this.fnGetArgs(undefined);
		return oValue;
	}

	private fnAfterOrEvery() {
		const sType = this.oPreviousToken.type + "Gosub", // "afterGosub" or "everyGosub"
			oValue = this.fnCreateCmdCall(sType); // interval and optional timer

		if (!oValue.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", this.oToken.type, this.oToken.pos); // should not occure
		}
		if (oValue.args.length < 2) { // add default timer 0
			oValue.args.push(BasicParser.fnCreateDummyArg("null"));
		}
		this.advance("gosub");
		const aLine = this.fnGetArgs("gosub"); // line number

		oValue.args.push(aLine[0]);
		return oValue;
	}

	private fnChain() {
		let oValue: ParserNode;

		if (this.oToken.type !== "merge") { // not chain merge?
			oValue = this.fnCreateCmdCall(this.oPreviousToken.type); // chain
		} else { // chain merge with optional DELETE
			const sName = this.fnCombineTwoTokensNoArgs(this.oToken.type); // chainMerge

			oValue = this.oPreviousToken;
			oValue.type = sName;
			oValue.args = [];
			let oValue2 = this.expression(0); // filename

			oValue.args.push(oValue2);

			this.oToken = this.getToken();
			if (this.oToken.type === ",") {
				this.oToken = this.advance(",");

				let bNumberExpression = false; // line number (expression) found

				if (this.oToken.type !== "," && this.oToken.type !== "(eol)" && this.oToken.type !== "(eof)") {
					oValue2 = this.expression(0); // line number or expression
					oValue.args.push(oValue2);
					bNumberExpression = true;
				}

				if (this.oToken.type === ",") {
					this.advance(",");
					this.advance("delete");

					if (!bNumberExpression) {
						oValue2 = BasicParser.fnCreateDummyArg("null"); // insert dummy arg for line
						oValue.args.push(oValue2);
					}

					oValue2 = this.fnGetLineRange("q");
					oValue.args.push(oValue2);
				}
			}
		}
		return oValue;
	}

	private fnClear() {
		const sTokenType = this.oToken.type;
		let oValue: ParserNode;

		if (sTokenType === "input") {
			oValue = this.fnCombineTwoTokens(sTokenType);
		} else {
			oValue = this.fnCreateCmdCall(this.oPreviousToken.type); // "symbol"
		}
		return oValue;
	}

	private fnData() {
		const oValue = this.oPreviousToken;
		let bParameterFound = false;

		oValue.args = [];

		// data is special: it can have empty parameters, also the last parameter, and also if no parameters
		if (this.oToken.type !== "," && this.oToken.type !== "(eol)" && this.oToken.type !== "(end)") {
			oValue.args.push(this.expression(0)); // take first argument
			bParameterFound = true;
		}

		while (this.oToken.type === ",") {
			if (!bParameterFound) {
				oValue.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
			}
			this.oToken = this.advance(",");
			if (this.bKeepBrackets) { //TTT reuse
				oValue.args.push(this.oPreviousToken); // ","
			}

			bParameterFound = false;
			if (this.oToken.type === "(eol)" || this.oToken.type === "(end)") {
				break;
			} else if (this.oToken.type !== ",") {
				oValue.args.push(this.expression(0));
				bParameterFound = true;
			}
		}

		if (!bParameterFound) {
			oValue.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
		}

		return oValue;
	}

	private fnDef() { // somehow special
		const oValue = this.oPreviousToken; // def
		let	oValue2 = this.oToken, // fn or fn<identifier>
			oFn: ParserNode | undefined;

		if (oValue2.type === "fn") { // fn and <identifier> separate?
			oFn = oValue2;
			oValue2 = this.advance("fn");
		}

		this.oToken = this.advance("identifier");

		if (oFn) { // separate fn?
			oValue2.value = oFn.value + oValue2.value; // combine "fn" + identifier (maybe simplify by separating in lexer)
			oValue2.bSpace = true; // fast hack: set space for CodeGeneratorBasic
		} else if (!oValue2.value.toLowerCase().startsWith("fn")) { // not fn<identifier>
			throw this.composeError(Error(), "Invalid DEF", this.oToken.type, this.oToken.pos);
		}

		oValue.left = oValue2;

		oValue.args = (this.oToken.type === "(") ? this.fnGetArgsInParenthesis() : [];
		this.advance("=");

		oValue.right = this.expression(0);
		return oValue;
	}

	private fnElse() { // similar to a comment, normally not used
		const oValue = this.oPreviousToken;

		oValue.args = [];

		if (!this.bQuiet) {
			Utils.console.warn(this.composeError({} as Error, "ELSE: Weird use of ELSE", this.oPreviousToken.type, this.oPreviousToken.pos).message);
		}

		if (this.oToken.type === "number") { // first token number?
			this.fnChangeNumber2LineNumber(this.oToken);
		}

		// TODO: data line as separate statement is taken
		while (this.oToken.type !== "(eol)" && this.oToken.type !== "(end)") {
			oValue.args.push(this.oToken); // collect tokens unchecked, may contain syntax error
			this.advance(this.oToken.type);
		}

		return oValue;
	}

	private fnEntOrEnv() {
		const oValue = this.oPreviousToken;

		oValue.args = [];

		oValue.args.push(this.expression(0)); // should be number or variable

		let iCount = 0;

		while (this.oToken.type === ",") {
			this.oToken = this.advance(",");
			if (this.oToken.type === "=" && iCount % 3 === 0) { // special handling for parameter "number of steps"
				this.advance("=");
				const oExpression = BasicParser.fnCreateDummyArg("null"); // insert null parameter

				oValue.args.push(oExpression);
				iCount += 1;
			}
			const oExpression = this.expression(0);

			oValue.args.push(oExpression);
			iCount += 1;
		}

		return oValue;
	}

	private fnFor() {
		const oValue = this.oPreviousToken;

		if (this.oToken.type !== "identifier") {
			throw this.composeError(Error(), "Expected identifier", this.oToken.type, this.oToken.pos);
		}

		const oName = this.expression(90); // take simple identifier, nothing more

		if (oName.type !== "identifier") {
			throw this.composeError(Error(), "Expected simple identifier", this.oToken.type, this.oToken.pos);
		}
		oValue.args = [oName];
		this.advance("=");
		oValue.args.push(this.expression(0));

		this.oToken = this.advance("to");
		oValue.args.push(this.expression(0));

		if (this.oToken.type === "step") {
			this.advance("step");
			oValue.args.push(this.expression(0));
		} else {
			oValue.args.push(BasicParser.fnCreateDummyArg("null"));
		}
		return oValue;
	}

	private fnGraphics() {
		const sTokenType = this.oToken.type;

		if (sTokenType !== "pen" && sTokenType !== "paper") {
			throw this.composeError(Error(), "Expected PEN or PAPER", sTokenType, this.oToken.pos);
		}

		const oValue = this.fnCombineTwoTokens(sTokenType);

		return oValue;
	}

	private fnIf() {
		const oValue = this.oPreviousToken;

		oValue.left = this.expression(0);

		let aArgs: ParserNode[] | undefined;

		if (this.oToken.type === "goto") {
			// skip "then"
			aArgs = this.statements("else");
		} else {
			this.advance("then");
			if (this.oToken.type === "number") {
				const oValue2 = this.fnCreateCmdCall("goto"); // take "then" as "goto", checks also for line number

				oValue2.len = 0; // mark it as inserted
				const oToken2 = this.oToken;

				aArgs = this.statements("else");
				if (aArgs.length && aArgs[0].type !== "rem") {
					if (!this.bQuiet) {
						Utils.console.warn(this.composeError({} as Error, "IF: Unreachable code after THEN", oToken2.type, oToken2.pos).message);
					}
				}
				aArgs.unshift(oValue2);
			} else {
				aArgs = this.statements("else");
			}
		}
		oValue.args = aArgs; // then statements

		aArgs = undefined;
		if (this.oToken.type === "else") {
			this.oToken = this.advance("else");
			if (this.oToken.type === "number") {
				const oValue2 = this.fnCreateCmdCall("goto"); // take "then" as "goto", checks also for line number

				oValue2.len = 0; // mark it as inserted
				const oToken2 = this.oToken;

				aArgs = this.statements("else");
				if (aArgs.length) {
					if (!this.bQuiet) {
						Utils.console.warn(this.composeError({} as Error, "IF: Unreachable code after ELSE", oToken2.type, oToken2.pos).message);
					}
				}
				aArgs.unshift(oValue2);
			} else if (this.oToken.type === "if") {
				aArgs = [this.statement()];
			} else {
				aArgs = this.statements("else");
			}
		}
		if (aArgs !== undefined) {
			oValue.args2 = aArgs; // else statements
		}
		return oValue;
	}

	private fnInput() { // input or line input
		const oValue = this.oPreviousToken;

		oValue.args = [];

		const oStream = this.fnGetOptionalStream();

		oValue.args.push(oStream);
		if (oStream.len !== 0) { // not an inserted stream?
			this.advance(",");
		}

		if (this.oToken.type === ";") { // no newline after input?
			oValue.args.push(this.oToken);
			this.advance(";");
		} else {
			oValue.args.push(BasicParser.fnCreateDummyArg("null"));
		}

		if (this.oToken.type === "string") { // message
			oValue.args.push(this.oToken);
			this.oToken = this.advance("string");
			if (this.oToken.type === ";" || this.oToken.type === ",") { // ";" => need to append prompt "? " , "," = no prompt
				oValue.args.push(this.oToken);
				this.advance(this.oToken.type);
			} else {
				throw this.composeError(Error(), "Expected ; or ,", this.oToken.type, this.oToken.pos);
			}
		} else {
			oValue.args.push(BasicParser.fnCreateDummyArg("null")); // dummy message
			oValue.args.push(BasicParser.fnCreateDummyArg("null")); // dummy prompt
		}

		do { // we need loop for input
			const oValue2 = this.expression(90); // we expect "identifier", no fnxx

			if (oValue2.type !== "identifier") {
				throw this.composeError(Error(), "Expected identifier", this.oPreviousToken.type, this.oPreviousToken.pos);
			}

			oValue.args.push(oValue2);
			if (oValue.type === "lineInput") {
				break; // no loop for lineInput (only one arg)
			}
		} while ((this.oToken.type === ",") && this.advance(","));
		return oValue;
	}

	private fnKey() {
		const sTokenType = this.oToken.type;
		let oValue: ParserNode;

		if (sTokenType === "def") {
			oValue = this.fnCombineTwoTokens(sTokenType);
		} else {
			oValue = this.fnCreateCmdCall(this.oPreviousToken.type); // "symbol"
		}
		return oValue;
	}

	private fnLet() {
		const oValue = this.oPreviousToken;

		oValue.right = this.assignment();
		return oValue;
	}

	private fnLine() {
		const oValue = this.oPreviousToken;

		oValue.type = "lineInput"; // change type line => lineInput
		this.advance("input"); // ignore this token
		this.oPreviousToken = oValue; // set to token "lineInput"

		return this.fnInput(); // continue with input
	}

	private fnMid$() { // mid$Assign
		this.oPreviousToken.type = "mid$Assign"; // change type mid$ => mid$Assign
		const oValue = this.fnCreateFuncCall();

		if (!oValue.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", this.oToken.type, this.oToken.pos); // should not occure
		}
		if (oValue.args[0].type !== "identifier") {
			throw this.composeError(Error(), "Expected identifier", oValue.args[0].value, oValue.args[0].pos);
		}

		this.advance("="); // equal as assignment
		const oRight = this.expression(0);

		oValue.right = oRight;

		return oValue;
	}

	private fnOn() {
		const oValue = this.oPreviousToken;

		oValue.args = [];

		if (this.oToken.type === "break") {
			this.oToken = this.advance("break");
			if (this.oToken.type === "gosub") {
				this.advance("gosub");
				oValue.type = "onBreakGosub";
				oValue.args = this.fnGetArgs(oValue.type);
			} else if (this.oToken.type === "cont") {
				this.advance("cont");
				oValue.type = "onBreakCont";
			} else if (this.oToken.type === "stop") {
				this.advance("stop");
				oValue.type = "onBreakStop";
			} else {
				throw this.composeError(Error(), "Expected GOSUB, CONT or STOP", this.oToken.type, this.oToken.pos);
			}
		} else if (this.oToken.type === "error") { // on error goto
			this.oToken = this.advance("error");
			this.advance("goto");
			oValue.type = "onErrorGoto";
			oValue.args = this.fnGetArgs(oValue.type);
		} else if (this.oToken.type === "sq") { // on sq(n) gosub
			let oLeft = this.expression(0);

			if (!oLeft.args) {
				throw this.composeError(Error(), "Programming error: Undefined args", this.oToken.type, this.oToken.pos); // should not occure
			}
			oLeft = oLeft.args[0];
			this.oToken = this.getToken();
			this.advance("gosub");
			oValue.type = "onSqGosub";
			oValue.args = this.fnGetArgs(oValue.type);
			oValue.args.unshift(oLeft);
		} else {
			const oLeft = this.expression(0);

			if (this.oToken.type === "gosub") {
				this.advance("gosub");
				oValue.type = "onGosub";
				oValue.args = this.fnGetArgs(oValue.type);
				oValue.args.unshift(oLeft);
			} else if (this.oToken.type === "goto") {
				this.advance("goto");
				oValue.type = "onGoto";
				oValue.args = this.fnGetArgs(oValue.type);
				oValue.args.unshift(oLeft);
			} else {
				throw this.composeError(Error(), "Expected GOTO or GOSUB", this.oToken.type, this.oToken.pos);
			}
		}
		return oValue;
	}

	private fnPrint() {
		const oValue = this.oPreviousToken,
			mCloseTokens = BasicParser.mCloseTokens,
			oStream = this.fnGetOptionalStream();

		oValue.args = [];
		oValue.args.push(oStream);

		let bCommaAfterStream = false;

		if (oStream.len !== 0) { // not an inserted stream?
			bCommaAfterStream = true;
		}

		while (!mCloseTokens[this.oToken.type]) {
			if (bCommaAfterStream) {
				this.advance(",");
				bCommaAfterStream = false;
			}

			let oValue2;

			if (this.oToken.type === "spc" || this.oToken.type === "tab") {
				this.advance(this.oToken.type);
				oValue2 = this.fnCreateFuncCall();
			} else if (this.oToken.type === "using") {
				oValue2 = this.oToken;
				this.advance("using");
				const t = this.expression(0); // format

				this.advance(";"); // after the format there must be a ";"

				oValue2.args = this.fnGetArgsSepByCommaSemi();
				oValue2.args.unshift(t);
				if (this.oPreviousToken.type === ";") { // using closed by ";"?
					oValue.args.push(oValue2);
					oValue2 = this.oPreviousToken; // keep it for print
				}
			} else if (BasicParser.mKeywords[this.oToken.type] && (BasicParser.mKeywords[this.oToken.type].charAt(0) === "c" || BasicParser.mKeywords[this.oToken.type].charAt(0) === "x")) { // stop also at keyword which is c=command or x=command addition
				break;
				//TTT: oValue2 not set?
			} else if (this.oToken.type === ";" || this.oToken.type === ",") { // separator ";" or comma tab separator ","
				oValue2 = this.oToken;
				this.advance(this.oToken.type);
			} else {
				oValue2 = this.expression(0);
			}
			oValue.args.push(oValue2);
		}
		return oValue;
	}

	private fnQuestion() { // "?"
		const oValue = this.fnPrint();

		oValue.type = "print";
		return oValue;
	}

	private fnResume() {
		const sTokenType = this.oToken.type;
		let oValue: ParserNode;

		if (sTokenType === "next") {
			oValue = this.fnCombineTwoTokens(sTokenType);
		} else {
			oValue = this.fnCreateCmdCall(this.oPreviousToken.type);
		}
		return oValue;
	}

	private fnSpeed() {
		const sTokenType = this.oToken.type;

		if (sTokenType !== "ink" && sTokenType !== "key" && sTokenType !== "write") {
			throw this.composeError(Error(), "Expected INK, KEY or WRITE", sTokenType, this.oToken.pos);
		}

		const oValue = this.fnCombineTwoTokens(sTokenType);

		return oValue;
	}

	private fnSymbol() {
		const sTokenType = this.oToken.type;
		let oValue: ParserNode;

		if (sTokenType === "after") { // symbol after?
			oValue = this.fnCombineTwoTokens(sTokenType);
		} else {
			oValue = this.fnCreateCmdCall(this.oPreviousToken.type); // "symbol"
		}
		return oValue;
	}

	private fnWindow() {
		const sTokenType = this.oToken.type;
		let oValue: ParserNode;

		if (sTokenType === "swap") {
			oValue = this.fnCombineTwoTokens(sTokenType);
		} else {
			oValue = this.fnCreateCmdCall(this.oPreviousToken.type);
		}
		return oValue;
	}


	private fnGenerateSymbols() {
		this.fnGenerateKeywordSymbols();

		this.symbol(":");
		this.symbol(";");
		this.symbol(",");
		this.symbol(")");
		this.symbol("[");
		this.symbol("]");

		// define additional statement parts
		this.symbol("break");
		this.symbol("spc");
		this.symbol("step");
		this.symbol("swap");
		this.symbol("then");
		this.symbol("tab");
		this.symbol("to");
		this.symbol("using");

		this.symbol("(eol)");
		this.symbol("(end)");

		this.symbol("number", function (oNode) {
			return oNode;
		});

		this.symbol("binnumber", function (oNode) {
			return oNode;
		});

		this.symbol("hexnumber", function (oNode) {
			return oNode;
		});

		this.symbol("linenumber", function (oNode) {
			return oNode;
		});

		this.symbol("string", function (oNode) {
			return oNode;
		});

		this.symbol("unquoted", function (oNode) {
			return oNode;
		});

		this.symbol("ws", function (oNode) { // optional whitespace
			return oNode;
		});

		this.symbol("identifier", this.fnIdentifier);

		this.symbol("(", this.fnParenthesis);

		this.prefix("@", 95); // address of

		this.infix("^", 90, 80);

		this.prefix("+", 80);
		this.prefix("-", 80);

		this.infix("*", 70);
		this.infix("/", 70);

		this.infix("\\", 60); // integer division

		this.infix("mod", 50);

		this.infix("+", 40);
		this.infix("-", 40);

		this.infixr("=", 30); // equal for comparison
		this.infixr("<>", 30);
		this.infixr("<", 30);
		this.infixr("<=", 30);
		this.infixr(">", 30);
		this.infixr(">=", 30);

		this.prefix("not", 23);
		this.infixr("and", 22);
		this.infixr("or", 21);
		this.infixr("xor", 20);

		this.prefix("#", 10); // priority ok?

		this.symbol("fn", this.fnFn); // separate fn

		// statements ...

		this.stmt("'", this.fnApostrophe);

		this.stmt("|", this.fnRsx); // rsx

		this.stmt("after", this.fnAfterOrEvery);

		this.stmt("chain", this.fnChain);

		this.stmt("clear", this.fnClear);

		this.stmt("data", this.fnData);

		this.stmt("def", this.fnDef);

		this.stmt("else", this.fnElse); // simular to a comment, normally not used

		this.stmt("ent", this.fnEntOrEnv);

		this.stmt("env", this.fnEntOrEnv);

		this.stmt("every", this.fnAfterOrEvery);

		this.stmt("for", this.fnFor);

		this.stmt("graphics", this.fnGraphics);

		this.stmt("if", this.fnIf);

		this.stmt("input", this.fnInput);

		this.stmt("key", this.fnKey);

		this.stmt("let", this.fnLet);

		this.stmt("line", this.fnLine);

		this.stmt("mid$", this.fnMid$); // mid$Assign

		this.stmt("on", this.fnOn);

		this.stmt("print", this.fnPrint);

		this.stmt("?", this.fnQuestion); // "?" is same as print

		this.stmt("resume", this.fnResume);

		this.stmt("speed", this.fnSpeed);

		this.stmt("symbol", this.fnSymbol);

		this.stmt("window", this.fnWindow);
	}


	// http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
	// http://crockford.com/javascript/tdop/parse.js
	// Operator precedence parsing
	//
	// Operator: With left binding power (lbp) and operational function.
	// Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
	// identifiers, numbers: also nud.
	parse(aTokens: LexerToken[], bAllowDirect?: boolean): ParserNode[] {
		this.aTokens = aTokens;
		this.bAllowDirect = bAllowDirect || false;

		// line
		this.sLine = "0"; // for error messages
		this.iIndex = 0;

		this.oToken = {} as ParserNode;
		this.oPreviousToken = this.oToken; // just to avoid warning

		const aParseTree = this.aParseTree;

		aParseTree.length = 0;
		this.advance();
		while (this.oToken.type !== "(end)") {
			aParseTree.push(this.line());
		}
		return aParseTree;
	}
}
