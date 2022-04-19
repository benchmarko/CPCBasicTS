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
	quiet?: boolean
	keepTokens?: boolean
	keepBrackets?: boolean
	keepColons?: boolean
	keepDataComma?: boolean
}

export interface ParserNode extends LexerToken {
	left?: ParserNode
	right?: ParserNode
	args?: ParserNode[]
	args2?: ParserNode[] // only used for if: "else" statements
	len?: number
	space?: boolean
	parenthesis?: boolean
}

type ParseExpressionFunction = (arg0: ParserNode) => ParserNode;

type ParseStatmentFunction = () => ParserNode;

interface SymbolType {
	nud?: ParseExpressionFunction // null denotative function
	lbp?: number // left binding power
	led?: ParseExpressionFunction // left denotative function
	std?: ParseStatmentFunction // statement function
}

export class BasicParser {
	private line = "0"; // for error messages
	private quiet = false;
	private keepTokens = false;
	private keepBrackets = false;
	private keepColons = false;
	private keepDataComma = false;

	private symbols: { [k in string]: SymbolType } = {};

	// set also during parse
	private tokens: LexerToken[] = [];
	private allowDirect = false;

	private index = 0;
	private previousToken: ParserNode;
	private token: ParserNode; // current token
	private parseTree: ParserNode[] = [];

	private statementList: ParserNode[] = []; // just to check last statement when generating error message

	setOptions(options: BasicParserOptions): void {
		this.quiet = options.quiet || false;
		this.keepTokens = options.keepTokens || false;
		this.keepBrackets = options.keepBrackets || false;
		this.keepColons = options.keepColons || false;
		this.keepDataComma = options.keepDataComma || false;
	}

	constructor(options?: BasicParserOptions) {
		if (options) {
			this.setOptions(options);
		}

		this.fnGenerateSymbols();

		this.previousToken = {} as ParserNode; // to avoid warnings
		this.token = this.previousToken;
	}

	private static parameterTypes: { [k in string]: string } = {
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
	static keywords: { [k in string]: string } = {
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
		fn: "x", // see DEF FN / (FN can also be separate from <function name>)
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
		zone: "c n", // ZONE <integer expression>  / integer expression=1..255
		_rsx1: "c a a*" // |<rsxName>[, <argument list>] dummy with at least one parameter
	}

	/* eslint-disable no-invalid-this */
	private specialStatements: { [k: string]: () => ParserNode } = { // to call methods, use specialStatements[].call(this,...)
		"'": this.fnApostrophe,
		"|": this.fnRsx, // rsx
		after: this.fnAfterOrEvery,
		chain: this.fnChain,
		clear: this.fnClear,
		data: this.fnData,
		def: this.fnDef,
		"else": this.fnElse, // simular to a comment, normally not used
		ent: this.fnEntOrEnv,
		env: this.fnEntOrEnv,
		every: this.fnAfterOrEvery,
		"for": this.fnFor,
		graphics: this.fnGraphics,
		"if": this.fnIf,
		input: this.fnInput,
		key: this.fnKey,
		let: this.fnLet,
		line: this.fnLine,
		mid$: this.fnMid$, // mid$Assign
		on: this.fnOn,
		print: this.fnPrint,
		"?": this.fnQuestion, // ? is same as print
		resume: this.fnResume,
		speed: this.fnSpeed,
		symbol: this.fnSymbol,
		window: this.fnWindow
	};
	/* eslint-enable no-invalid-this */

	private static closeTokens: { [k in string]: number } = {
		":": 1,
		"(eol)": 1,
		"(end)": 1,
		"else": 1,
		rem: 1,
		"'": 1
	}

	private composeError(error: Error, message: string, value: string, pos: number, len?: number) {
		len = value === "(end)" ? 0 : len;

		return Utils.composeError("BasicParser", error, message, value, pos, len, this.line);
	}


	// http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
	// http://crockford.com/javascript/tdop/parse.js
	// Operator precedence parsing
	//
	// Operator: With left binding power (lbp) and operational function.
	// Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
	// identifiers, numbers: also nud.
	private getToken() {
		return this.token;
	}

	private symbol(id: string, nud?: ParseExpressionFunction) {
		if (!this.symbols[id]) {
			this.symbols[id] = {};
		}
		const symbol = this.symbols[id];

		if (nud) {
			symbol.nud = nud;
		}
		return symbol;
	}

	private advance(id?: string) {
		let token = this.token;

		this.previousToken = this.token;
		if (id && token.type !== id) {
			throw this.composeError(Error(), "Expected " + id, (token.value === "") ? token.type : token.value, token.pos);
		}
		// additional check...
		if (this.index >= this.tokens.length) {
			if (!this.quiet) {
				Utils.console.warn(this.composeError({} as Error, "advance: End of file", token.value, token.pos).message);
			}
			if (this.tokens.length && this.tokens[this.tokens.length - 1].type === "(end)") {
				token = this.tokens[this.tokens.length - 1];
			} else {
				if (!this.quiet) {
					Utils.console.warn(this.composeError({} as Error, "advance: Expected (end) token", token.value, token.pos).message);
				}
				token = BasicParser.fnCreateDummyArg("(end)");
				token.value = ""; // null
			}
			return token;
		}
		token = this.tokens[this.index] as ParserNode; // we get a lex token and reuse it as parseTree token
		this.index += 1;
		if (token.type === "identifier" && BasicParser.keywords[token.value.toLowerCase()]) {
			token.type = token.value.toLowerCase(); // modify type identifier => keyword xy
		}
		const sym = this.symbols[token.type];

		if (!sym) {
			throw this.composeError(Error(), "Unknown token", token.type, token.pos);
		}

		this.token = token;
		return token;
	}

	private expression(rbp: number) {
		let t = this.token,
			s = this.symbols[t.type];

		if (Utils.debug > 3) {
			Utils.console.debug("parse: expression rbp=" + rbp + " type=" + t.type + " t=%o", t);
		}
		this.advance(t.type);
		if (!s.nud) {
			if (t.type === "(end)") {
				throw this.composeError(Error(), "Unexpected end of file", "", t.pos);
			} else {
				throw this.composeError(Error(), "Unexpected token", t.value, t.pos);
			}
		}

		let left = s.nud.call(this, t); // process literals, variables, and prefix operators

		t = this.token;
		s = this.symbols[t.type];
		while (rbp < (s.lbp || 0)) { // as long as the right binding power is less than the left binding power of the next token...
			this.advance(t.type);
			if (!s.led) {
				throw this.composeError(Error(), "Unexpected token", t.type, t.pos); //TTT how to get this error?
			}
			left = s.led.call(this, left); // ...the led method is invoked on the following token (infix and suffix operators), can be recursive
			t = this.token;
			s = this.symbols[t.type];
		}
		return left;
	}

	private assignment() { // "=" as assignment, similar to let
		if (this.token.type !== "identifier") {
			const typeFirstChar = "v";

			throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], this.token.value, this.token.pos); // variable
		}

		const left = this.expression(90), // take it (can also be an array) and stop
			value = this.token;

		this.advance("="); // equal as assignment
		value.left = left;
		value.right = this.expression(0);
		value.type = "assign"; // replace "="
		return value;
	}

	private statement() {
		const t = this.token,
			s = this.symbols[t.type];

		if (s.std) { // statement?
			this.advance();
			return s.std.call(this);
		}

		let value: ParserNode;

		if (t.type === "identifier") {
			value = this.assignment();
		} else {
			value = this.expression(0);
		}

		if (value.type !== "assign" && value.type !== "fcall" && value.type !== "def" && value.type !== "(" && value.type !== "[") {
			throw this.composeError(Error(), "Bad expression statement", t.value, t.pos);
		}
		return value;
	}

	private statements(stopType: string) {
		const statements: ParserNode[] = [];

		this.statementList = statements; // fast hack to access last statement for error messages
		let colonExpected = false;

		while (this.token.type !== "(end)" && this.token.type !== "(eol)") {
			if (stopType && this.token.type === stopType) {
				break;
			}
			if (colonExpected || this.token.type === ":") {
				if (this.token.type !== "'" && this.token.type !== "else") { // no colon required for line comment or ELSE
					this.advance(":");
					if (this.keepColons) {
						statements.push(this.previousToken);
					}
				}
				colonExpected = false;
			} else {
				const statement = this.statement();

				statements.push(statement);
				colonExpected = true;
			}
		}
		return statements;
	}

	private basicLine() {
		let value: ParserNode;

		if (this.token.type !== "number" && this.allowDirect) {
			this.allowDirect = false; // allow only once
			value = BasicParser.fnCreateDummyArg("label");
			value.value = "direct"; // insert "direct" label
		} else {
			this.advance("number");
			value = this.previousToken; // number token
			value.type = "label"; // number => label
		}
		this.line = value.value; // set line number for error messages
		value.args = this.statements("");

		if (this.token.type === "(eol)") {
			this.advance("(eol)");
		}
		return value;
	}

	private generateLed(rbp: number) {
		return (left: ParserNode) => {
			const value = this.previousToken;

			value.left = left;
			value.right = this.expression(rbp);
			return value;
		};
	}

	private generateNud(rbp: number) {
		return () => {
			const value = this.previousToken;

			value.right = this.expression(rbp);
			return value;
		};
	}

	private infix(id: string, lbp: number, rbp?: number, led?: ParseExpressionFunction) {
		rbp = rbp || lbp;
		const symbol = this.symbol(id);

		symbol.lbp = lbp;
		symbol.led = led || this.generateLed(rbp);
	}

	private infixr(id: string, lbp: number) {
		const symbol = this.symbol(id);

		symbol.lbp = lbp;
		symbol.led = this.generateLed(lbp - 1);
	}

	private prefix(id: string, rbp: number) {
		this.symbol(id, this.generateNud(rbp));
	}

	private stmt(id: string, fn: ParseStatmentFunction) {
		const symbol = this.symbol(id);

		symbol.std = fn;
		return symbol;
	}


	private static fnCreateDummyArg(type: string, value?: string) {
		const node: ParserNode = {
			type: type, // e.g. "null"
			value: value !== undefined ? value : type, // e.g. "null"
			pos: 0,
			len: 0
		};

		return node;
	}

	private fnCombineTwoTokensNoArgs(token2: string) {
		const previousToken = this.previousToken,
			name = previousToken.type + Utils.stringCapitalize(this.token.type); // e.g ."speedInk"

		previousToken.value += (this.token.ws || " ") + this.token.value; // combine values of both

		this.token = this.advance(token2); // for "speed" e.g. "ink", "key", "write" (this.token.type)

		this.previousToken = previousToken; // fast hack to get e.g. "speed" token

		return name;
	}

	private fnCombineTwoTokens(token2: string) {
		const name = this.fnCombineTwoTokensNoArgs(token2),
			value = this.fnCreateCmdCallForType(name);

		return value;
	}

	private fnGetOptionalStream() {
		let value: ParserNode;

		if (this.token.type === "#") { // stream?
			value = this.expression(0);
		} else { // create dummy
			value = BasicParser.fnCreateDummyArg("#"); // dummy stream
			value.right = BasicParser.fnCreateDummyArg("null", "0"); // ...with dummy parameter
		}
		return value;
	}

	private fnChangeNumber2LineNumber(node: ParserNode) {
		if (node.type === "number") {
			node.type = "linenumber"; // change type: number => linenumber
		} else { // should not occure...
			const typeFirstChar = "l";

			throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], node.type, node.pos);
		}
	}

	private fnGetLineRange() { // l1 or l1-l2 or l1- or -l2 or nothing
		let left: ParserNode | undefined;

		if (this.token.type === "number") {
			left = this.token;
			this.advance("number");
			this.fnChangeNumber2LineNumber(left);
		}

		let range: ParserNode | undefined;

		if (this.token.type === "-") {
			range = this.token;
			this.advance("-");
		}

		if (range) {
			let right: ParserNode | undefined;

			if (this.token.type === "number") {
				right = this.token;
				this.advance("number");
				this.fnChangeNumber2LineNumber(right);
			}
			// accept also "-" as full range

			range.type = "linerange"; // change "-" => "linerange"
			range.left = left || BasicParser.fnCreateDummyArg("null"); // insert dummy for left
			range.right = right || BasicParser.fnCreateDummyArg("null"); // insert dummy for right (do not skip it)
		} else if (left) {
			range = left; // single line number
		} else {
			throw this.composeError(Error(), "Undefined range", this.token.value, this.token.pos);
		}

		return range;
	}

	private static fnIsSingleLetterIdentifier(value: ParserNode) {
		return value.type === "identifier" && !value.args && value.value.length === 1;
	}

	private fnGetLetterRange(typeFirstChar: string) { // l1 or l1-l2 or l1- or -l2 or nothing
		if (this.token.type !== "identifier") {
			throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], this.token.value, this.token.pos);
		}
		const expression = this.expression(0); // n or n-n

		if (BasicParser.fnIsSingleLetterIdentifier(expression)) { // ok
			expression.type = "letter"; // change type: identifier -> letter
		} else if (expression.type === "-" && expression.left && expression.right && BasicParser.fnIsSingleLetterIdentifier(expression.left) && BasicParser.fnIsSingleLetterIdentifier(expression.right)) { // also ok
			expression.type = "range"; // change type: "-" => range
			expression.left.type = "letter"; // change type: identifier -> letter
			expression.right.type = "letter"; // change type: identifier -> letter
		} else {
			throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
		}
		return expression;
	}

	private fnCheckRemainingTypes(types: string[]) {
		for (let i = 0; i < types.length; i += 1) { // some more parameters expected?
			const type = types[i];

			if (!type.endsWith("?") && !type.endsWith("*")) { // mandatory?
				const text = BasicParser.parameterTypes[type] || ("parameter " + type);

				throw this.composeError(Error(), "Expected " + text + " for " + this.previousToken.type, this.token.value, this.token.pos);
			}
		}
	}

	private fnLastStatemetIsOnErrorGotoX() {
		const statements = this.statementList;
		let isOnErrorGoto = false;

		for (let i = statements.length - 1; i >= 0; i -= 1) {
			const lastStatement = statements[i];

			if (lastStatement.type !== ":") { // ignore colons (separator when keepTokens=true)
				if (lastStatement.type === "onErrorGoto" && lastStatement.args && Number(lastStatement.args[0].value) > 0) {
					isOnErrorGoto = true;
				}
				break;
			}
		}
		return isOnErrorGoto;
	}

	private fnGetArgs(keyword?: string) { // eslint-disable-line complexity
		let types: string[] | undefined;

		if (keyword) {
			const keyOpts = BasicParser.keywords[keyword];

			if (keyOpts) {
				types = keyOpts.split(" ");
				types.shift(); // remove keyword type
			} else { // programming error, should not occure
				Utils.console.warn(this.composeError({} as Error, "fnGetArgs: No options for keyword", keyword, this.token.pos).message);
			}
		}

		const args: ParserNode[] = [],
			separator = ",",
			closeTokens = BasicParser.closeTokens;
		let needMore = false,
			type = "xxx";

		while (needMore || (type && !closeTokens[this.token.type])) {
			needMore = false;
			if (types && type.slice(-1) !== "*") { // "*"= any number of parameters
				type = types.shift() || "";
				if (!type) {
					throw this.composeError(Error(), "Expected end of arguments", this.previousToken.type, this.previousToken.pos);
				}
			}
			const typeFirstChar = type.charAt(0);
			let expression: ParserNode;

			if (type === "#0?") { // optional stream?
				if (this.token.type === "#") { // stream?
					expression = this.fnGetOptionalStream();
					if (this.getToken().type === ",") { // token.type
						this.advance(",");
						needMore = true;
					}
				} else {
					expression = this.fnGetOptionalStream();
				}
			} else {
				if (typeFirstChar === "#") { // stream expected? (for functions)
					expression = this.expression(0);
					if (expression.type !== "#") { // maybe a number
						throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
					}
				} else if (this.token.type === separator && type.substr(0, 2) === "n0") { // n0 or n0?: if parameter not specified, insert default value null?
					expression = BasicParser.fnCreateDummyArg("null");
				} else if (typeFirstChar === "l") {
					expression = this.expression(0);
					if (expression.type !== "number") { // maybe an expression and no plain number
						throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
					}
					this.fnChangeNumber2LineNumber(expression);
				} else if (typeFirstChar === "v") { // variable (identifier)
					expression = this.expression(0);
					if (expression.type !== "identifier") {
						throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
					}
				} else if (typeFirstChar === "r") { // letter or range of letters (defint, defreal, defstr)
					expression = this.fnGetLetterRange(typeFirstChar);
				} else if (typeFirstChar === "q") { // line number range
					if (type === "q0?") { // optional line number range
						if (this.token.type === "number" || this.token.type === "-") { // eslint-disable-line max-depth
							expression = this.fnGetLineRange();
						} else {
							expression = BasicParser.fnCreateDummyArg("null");
							if (types && types.length) { // eslint-disable-line max-depth
								needMore = true; // maybe take it as next parameter
							}
						}
					} else {
						expression = this.fnGetLineRange();
					}
				} else if (typeFirstChar === "n") { // number
					expression = this.expression(0);
					if (expression.type === "string" || expression.type === "#") { // got a string or stream? (statical check)
						if (!this.fnLastStatemetIsOnErrorGotoX()) { // eslint-disable-line max-depth
							throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
						} else if (!this.quiet) {
							Utils.console.warn(this.composeError({} as Error, "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos).message);
						}
					}
				} else if (typeFirstChar === "s") { // string
					expression = this.expression(0);
					if (expression.type === "number") { // got e.g. number? (statical check)
						if (!this.fnLastStatemetIsOnErrorGotoX()) { // eslint-disable-line max-depth
							throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
						} else if (!this.quiet) {
							Utils.console.warn(this.composeError({} as Error, "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos).message);
						}
					}
				} else {
					expression = this.expression(0);
					if (expression.type === "#") { // got stream?
						throw this.composeError(Error(), "Unexpected stream", expression.value, expression.pos); // do we still need this?
					}
				}

				if (this.token.type === separator) {
					this.advance(separator);
					needMore = true;
				} else if (!needMore) {
					type = ""; // stop
				}
			}
			args.push(expression);
		}
		if (types && types.length) { // some more parameters expected?
			this.fnCheckRemainingTypes(types); // error if remaining mandatory args
			type = types[0];
			if (type === "#0?") { // null stream to add?
				const expression = BasicParser.fnCreateDummyArg("#"); // dummy stream with dummy arg

				expression.right = BasicParser.fnCreateDummyArg("null", "0");
				args.push(expression);
			}
		}
		return args;
	}

	private fnGetArgsSepByCommaSemi() {
		const closeTokens = BasicParser.closeTokens,
			args: ParserNode[] = [];

		while (!closeTokens[this.token.type]) {
			args.push(this.expression(0));
			if (this.token.type === "," || this.token.type === ";") {
				this.advance(this.token.type);
			} else {
				break;
			}
		}
		return args;
	}

	private fnGetArgsInParenthesis() {
		this.advance("(");
		const args = this.fnGetArgs(undefined); // until ")"

		this.advance(")");
		return args;
	}

	private static brackets: { [k in string]: string } = {
		"(": ")",
		"[": "]"
	};

	private fnGetArgsInParenthesesOrBrackets() {
		const brackets = BasicParser.brackets;
		let bracketOpen: ParserNode | undefined;

		if (this.token.type === "(" || this.token.type === "[") {
			bracketOpen = this.token;
		}

		this.advance(bracketOpen ? bracketOpen.type : "(");
		if (!bracketOpen) {
			throw this.composeError(Error(), "Programming error: Undefined bracketOpen", this.token.type, this.token.pos); // should not occure
		}

		const args = this.fnGetArgs(undefined); // (until "]" or ")")

		args.unshift(bracketOpen);

		let bracketClose: ParserNode | undefined;

		if (this.token.type === ")" || this.token.type === "]") {
			bracketClose = this.token;
		}
		this.advance(bracketClose ? bracketClose.type : ")");
		if (!bracketClose) {
			throw this.composeError(Error(), "Programming error: Undefined bracketClose", this.token.type, this.token.pos); // should not occure
		}

		args.push(bracketClose);
		if (brackets[bracketOpen.type] !== bracketClose.type) {
			if (!this.quiet) {
				Utils.console.warn(this.composeError({} as Error, "Inconsistent bracket style", this.previousToken.value, this.previousToken.pos).message);
			}
		}
		return args;
	}

	private fnCreateCmdCall() {
		const value = this.previousToken;

		value.args = this.fnGetArgs(value.type);
		return value;
	}

	private fnCreateCmdCallForType(type: string) {
		if (type) {
			this.previousToken.type = type; // override
		}
		return this.fnCreateCmdCall();
	}

	private fnCreateFuncCall() {
		const value = this.previousToken;

		if (this.token.type === "(") { // args in parenthesis?
			this.advance("(");
			value.args = this.fnGetArgs(value.type);
			this.advance(")");
		} else { // no parenthesis?
			value.args = [];

			// if we have a check, make sure there are no non-optional parameters left
			const keyOpts = BasicParser.keywords[value.type];

			if (keyOpts) {
				const types = keyOpts.split(" ");

				types.shift(); // remove key
				this.fnCheckRemainingTypes(types);
			}
		}

		return value;
	}

	private fnGenerateKeywordSymbols() {
		for (const key in BasicParser.keywords) {
			if (BasicParser.keywords.hasOwnProperty(key)) {
				const keywordType = BasicParser.keywords[key].charAt(0);

				if (keywordType === "f") {
					this.symbol(key, this.fnCreateFuncCall);
				} else if (keywordType === "c") {
					this.stmt(key, this.specialStatements[key] || this.fnCreateCmdCall);
				}
			}
		}
	}

	// ...

	private fnIdentifier(nameNode: ParserNode) {
		const nameValue = nameNode.value,
			startsWithFn = nameValue.toLowerCase().startsWith("fn");

		if (startsWithFn) {
			if (this.token.type !== "(") { // Fnxxx name without ()
				const value: ParserNode = { // new node!
					type: "fn",
					value: nameValue, // complete name
					args: [],
					left: nameNode, // identifier
					pos: nameNode.pos // same pos as identifier?
				};

				if (nameNode.ws) {
					value.ws = nameNode.ws;
					nameNode.ws = "";
				}

				return value;
			}
		}

		let value = nameNode;

		if (this.token.type === "(" || this.token.type === "[") {
			value = this.previousToken;

			if (startsWithFn) {
				value.args = this.fnGetArgsInParenthesis();
				value.type = "fn"; // FNxxx in e.g. print
				value.left = {
					type: "identifier",
					value: value.value,
					pos: value.pos
				};
			} else {
				value.args = this.fnGetArgsInParenthesesOrBrackets();
			}
		}
		return value;
	}

	private fnParenthesis() { // "("
		let value: ParserNode;

		if (this.keepBrackets) {
			value = this.previousToken; // "("
			value.args = [
				this.expression(0),
				this.token // ")" (hopefully)
			];
		} else {
			value = this.expression(0);
		}

		this.advance(")");
		return value;
	}

	private fnFn() { // separate fn
		const value = this.previousToken, // "fn"
			value2 = this.token; // identifier

		this.fnCombineTwoTokensNoArgs("identifier");

		value2.value = "fn" + value2.value; // combine "fn" + identifier (maybe simplify by separating in lexer)
		if (value2.ws) {
			value2.ws = "";
		}
		value.left = value2;

		if (this.token.type !== "(") { // FN xxx name without ()?
			value.args = [];
		} else {
			value.args = this.fnGetArgsInParenthesis();
		}
		return value;
	}

	private fnApostrophe() { // "'" apostrophe comment => rem
		return this.fnCreateCmdCallForType("rem");
	}

	private fnRsx() { // rsx: "|"
		const value = this.previousToken;
		let type: string | undefined;

		if (this.token.type === ",") { // arguments starting with comma
			this.advance(",");
			type = "_rsx1"; // dummy token: expect at least 1 argument
		}
		value.args = this.fnGetArgs(type); // get arguments
		return value;
	}

	private fnAfterOrEvery() {
		const type = this.previousToken.type + "Gosub", // "afterGosub" or "everyGosub"
			value = this.fnCreateCmdCallForType(type); // interval and optional timer

		if (!value.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occure
		}
		if (value.args.length < 2) { // add default timer 0
			value.args.push(BasicParser.fnCreateDummyArg("null"));
		}
		this.advance("gosub");
		const line = this.fnGetArgs("gosub"); // line number

		value.args.push(line[0]);
		return value;
	}

	private fnChain() {
		let value: ParserNode;

		if (this.token.type !== "merge") { // not chain merge?
			value = this.fnCreateCmdCall(); // chain
		} else { // chain merge with optional DELETE
			const name = this.fnCombineTwoTokensNoArgs(this.token.type); // chainMerge

			value = this.previousToken;
			value.type = name;
			value.args = [];
			let value2 = this.expression(0); // filename

			value.args.push(value2);

			this.token = this.getToken();
			if (this.token.type === ",") {
				this.token = this.advance(",");

				let numberExpression = false; // line number (expression) found

				if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(eof)") {
					value2 = this.expression(0); // line number or expression
					value.args.push(value2);
					numberExpression = true;
				}

				if (this.token.type === ",") {
					this.advance(",");

					if (!numberExpression) {
						value2 = BasicParser.fnCreateDummyArg("null"); // insert dummy arg for line
						value.args.push(value2);
					}

					this.advance("delete");
					const args = this.fnGetArgs(this.previousToken.type); // args for "delete"

					for (let i = 0; i < args.length; i += 1) {
						value.args.push(args[i]); // copy arg
					}
				}
			}
		}
		return value;
	}

	private fnClear() {
		const tokenType = this.token.type;
		let value: ParserNode;

		if (tokenType === "input") {
			value = this.fnCombineTwoTokens(tokenType);
		} else {
			value = this.fnCreateCmdCall(); // "clear"
		}
		return value;
	}

	private fnData() {
		const value = this.previousToken;
		let parameterFound = false;

		value.args = [];

		// data is special: it can have empty parameters, also the last parameter, and also if no parameters
		if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(end)") {
			value.args.push(this.expression(0)); // take first argument
			parameterFound = true;
		}

		while (this.token.type === ",") {
			if (!parameterFound) {
				value.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
			}
			this.token = this.advance(",");
			if (this.keepDataComma) {
				value.args.push(this.previousToken); // ","
			}

			parameterFound = false;
			if (this.token.type === "(eol)" || this.token.type === "(end)") {
				break;
			} else if (this.token.type !== ",") {
				value.args.push(this.expression(0));
				parameterFound = true;
			}
		}

		if (!parameterFound) {
			value.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
		}

		return value;
	}

	private fnDef() { // somehow special
		const value = this.previousToken; // def
		let	value2 = this.token, // fn or fn<identifier>
			fn: ParserNode | undefined;

		if (value2.type === "fn") { // fn and <identifier> separate?
			fn = value2;
			value2 = this.advance("fn");
		}

		this.token = this.advance("identifier");

		if (fn) { // separate fn?
			value2.value = fn.value + value2.value; // combine "fn" + identifier (maybe simplify by separating in lexer)
			value2.space = true; // fast hack: set space for CodeGeneratorBasic
		} else if (!value2.value.toLowerCase().startsWith("fn")) { // not fn<identifier>
			throw this.composeError(Error(), "Invalid DEF", this.token.type, this.token.pos);
		}

		value.left = value2;

		value.args = (this.token.type === "(") ? this.fnGetArgsInParenthesis() : [];
		this.advance("=");

		value.right = this.expression(0);
		return value;
	}

	private fnElse() { // similar to a comment, normally not used
		const value = this.previousToken;

		value.args = [];

		if (!this.quiet) {
			Utils.console.warn(this.composeError({} as Error, "ELSE: Weird use of ELSE", this.previousToken.type, this.previousToken.pos).message);
		}

		if (this.token.type === "number") { // first token number?
			this.fnChangeNumber2LineNumber(this.token);
		}

		// TODO: data line as separate statement is taken
		while (this.token.type !== "(eol)" && this.token.type !== "(end)") {
			value.args.push(this.token); // collect tokens unchecked, may contain syntax error
			this.advance(this.token.type);
		}

		return value;
	}

	private fnEntOrEnv() {
		const value = this.previousToken;

		value.args = [];

		value.args.push(this.expression(0)); // should be number or variable

		while (this.token.type === ",") {
			this.token = this.advance(",");
			if (this.token.type === "=" && (value.args.length - 1) % 3 === 0) { // special handling for parameter "number of steps"
				this.advance("=");
				const expression = BasicParser.fnCreateDummyArg("null"); // insert null parameter

				value.args.push(expression);
			}
			const expression = this.expression(0);

			value.args.push(expression);
		}

		return value;
	}

	private fnFor() {
		const value = this.previousToken;

		if (this.token.type !== "identifier") {
			const typeFirstChar = "v";

			throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], this.token.type, this.token.pos);
		}

		const name = this.expression(90); // take simple identifier, nothing more

		if (name.type !== "identifier") {
			const typeFirstChar = "v";

			throw this.composeError(Error(), "Expected simple " + BasicParser.parameterTypes[typeFirstChar], this.token.type, this.token.pos);
		}
		value.args = [name];

		this.advance("=");
		if (this.keepTokens) {
			value.args.push(this.previousToken);
		}
		value.args.push(this.expression(0));

		this.token = this.advance("to");
		if (this.keepTokens) {
			value.args.push(this.previousToken);
		}
		value.args.push(this.expression(0));

		if (this.token.type === "step") {
			this.advance("step");
			if (this.keepTokens) {
				value.args.push(this.previousToken);
			}
			value.args.push(this.expression(0));
		}
		return value;
	}

	private fnGraphics() {
		const tokenType = this.token.type;

		if (tokenType !== "pen" && tokenType !== "paper") {
			throw this.composeError(Error(), "Expected PEN or PAPER", tokenType, this.token.pos);
		}

		const value = this.fnCombineTwoTokens(tokenType);

		return value;
	}

	private fnCheckForUnreachableCode(args: ParserNode[]) {
		for (let i = 0; i < args.length; i += 1) {
			const token = args[i];

			if ((i === 0 && token.type === "linenumber") || token.type === "goto" || token.type === "stop") {
				const index = i + 1;

				if (index < args.length && args[index].type !== "rem") {
					if (!this.quiet) {
						Utils.console.warn(this.composeError({} as Error, "IF: Unreachable code after THEN or ELSE", token.type, token.pos).message);
					}
					break;
				}
			}
		}
	}

	private fnIf() {
		const value = this.previousToken;
		let numberToken: ParserNode[] | undefined;

		value.left = this.expression(0);

		if (this.token.type !== "goto") { // no "goto", expect "then" token...
			this.advance("then");
			if (this.keepTokens) {
				value.right = this.previousToken;
			}

			if (this.token.type === "number") {
				numberToken = this.fnGetArgs("goto"); // take number parameter as line number
			}
		}
		value.args = this.statements("else"); // get "then" statements until "else" or eol
		if (numberToken) {
			value.args.unshift(numberToken[0]);
			numberToken = undefined;
		}
		this.fnCheckForUnreachableCode(value.args);

		if (this.token.type === "else") {
			this.token = this.advance("else");
			if (this.keepTokens) {
				//TODO HOWTO?
			}

			if (this.token.type === "number") {
				numberToken = this.fnGetArgs("goto"); // take number parameter as line number
			}

			value.args2 = this.token.type === "if" ? [this.statement()] : this.statements("else");
			if (numberToken) {
				value.args2.unshift(numberToken[0]);
			}
			this.fnCheckForUnreachableCode(value.args2);
		}
		return value;
	}

	private fnInput() { // input or line input
		const value = this.previousToken;

		value.args = [];

		const stream = this.fnGetOptionalStream();

		value.args.push(stream);
		if (stream.len !== 0) { // not an inserted stream?
			this.advance(",");
		}

		if (this.token.type === ";") { // no newline after input?
			value.args.push(this.token);
			this.advance(";");
		} else {
			value.args.push(BasicParser.fnCreateDummyArg("null"));
		}

		if (this.token.type === "string") { // message
			value.args.push(this.token);
			this.token = this.advance("string");
			if (this.token.type === ";" || this.token.type === ",") { // ";" => need to append prompt "? " , "," = no prompt
				value.args.push(this.token);
				this.advance(this.token.type);
			} else {
				throw this.composeError(Error(), "Expected ; or ,", this.token.type, this.token.pos);
			}
		} else {
			value.args.push(BasicParser.fnCreateDummyArg("null")); // dummy message
			value.args.push(BasicParser.fnCreateDummyArg("null")); // dummy prompt
		}

		do { // we need loop for input
			const value2 = this.expression(90); // we expect "identifier", no fnxx

			if (value2.type !== "identifier") {
				const typeFirstChar = "v";

				throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], this.previousToken.type, this.previousToken.pos);
			}

			value.args.push(value2);
			if (value.type === "lineInput") {
				break; // no loop for lineInput (only one arg)
			}
		} while ((this.token.type === ",") && this.advance(","));
		return value;
	}

	private fnKey() {
		const tokenType = this.token.type;
		let value: ParserNode;

		if (tokenType === "def") {
			value = this.fnCombineTwoTokens(tokenType);
		} else {
			value = this.fnCreateCmdCall(); // "key"
		}
		return value;
	}

	private fnLet() {
		const value = this.previousToken;

		value.right = this.assignment();
		return value;
	}

	private fnLine() {
		const name = this.fnCombineTwoTokensNoArgs("input"); // line => lineInput

		this.previousToken.type = name; // combined type
		return this.fnInput(); // continue with input
	}

	private fnMid$() { // mid$Assign
		this.previousToken.type = "mid$Assign"; // change type mid$ => mid$Assign
		const value = this.fnCreateFuncCall();

		if (!value.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occure
		}
		if (value.args[0].type !== "identifier") {
			const typeFirstChar = "v";

			throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], value.args[0].value, value.args[0].pos);
		}

		this.advance("="); // equal as assignment
		const right = this.expression(0);

		value.right = right;

		return value;
	}

	private fnOn() {
		const value = this.previousToken;
		let name: string;

		value.args = [];

		if (this.token.type === "break") {
			name = this.fnCombineTwoTokensNoArgs("break"); // onBreak
			this.previousToken.type = name;
			this.token = this.getToken();
			if (this.token.type === "gosub" || this.token.type === "cont" || this.token.type === "stop") {
				this.fnCombineTwoTokens(this.token.type); // onBreakGosub, onBreakCont, onBreakStop
			} else {
				throw this.composeError(Error(), "Expected GOSUB, CONT or STOP", this.token.type, this.token.pos);
			}
		} else if (this.token.type === "error") { // on error goto
			name = this.fnCombineTwoTokensNoArgs("error"); // onError...
			this.previousToken.type = name;
			this.fnCombineTwoTokens("goto"); // onErrorGoto
		} else if (this.token.type === "sq") { // on sq(n) gosub
			let left = this.expression(0);

			if (!left.args) {
				throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occure
			}
			left = left.args[0];
			this.token = this.getToken();
			this.advance("gosub");
			value.type = "onSqGosub";
			value.args = this.fnGetArgs(value.type);
			value.left = left;
		} else { // on <expr>
			const left = this.expression(0);

			if (this.token.type === "gosub" || this.token.type === "goto") {
				this.advance(this.token.type);
				if (this.keepTokens) {
					value.right = this.previousToken;
				}

				value.type = "on" + Utils.stringCapitalize(this.previousToken.type); // onGoto, onGosub
				value.args = this.fnGetArgs(value.type);
				value.left = left;
			} else {
				throw this.composeError(Error(), "Expected GOTO or GOSUB", this.token.type, this.token.pos);
			}
		}
		return value;
	}

	private fnPrint() {
		const value = this.previousToken,
			closeTokens = BasicParser.closeTokens,
			stream = this.fnGetOptionalStream();

		value.args = [];
		value.args.push(stream);

		let commaAfterStream = false;

		if (stream.len !== 0) { // not an inserted stream?
			commaAfterStream = true;
		}

		while (!closeTokens[this.token.type]) {
			if (commaAfterStream) {
				this.advance(",");
				commaAfterStream = false;
			}

			let value2;

			if (this.token.type === "spc" || this.token.type === "tab") {
				this.advance(this.token.type);
				value2 = this.fnCreateFuncCall();
			} else if (this.token.type === "using") {
				value2 = this.token;
				this.advance("using");
				const t = this.expression(0); // format

				this.advance(";"); // after the format there must be a ";"

				value2.args = this.fnGetArgsSepByCommaSemi();
				value2.args.unshift(t);
				if (this.previousToken.type === ";") { // using closed by ";"?
					value.args.push(value2);
					value2 = this.previousToken; // keep it for print
				}
			} else if (BasicParser.keywords[this.token.type] && (BasicParser.keywords[this.token.type].charAt(0) === "c" || BasicParser.keywords[this.token.type].charAt(0) === "x")) { // stop also at keyword which is c=command or x=command addition
				break;
				//TTT: value2 not set?
			} else if (this.token.type === ";" || this.token.type === ",") { // separator ";" or comma tab separator ","
				value2 = this.token;
				this.advance(this.token.type);
			} else {
				value2 = this.expression(0);
			}
			value.args.push(value2);
		}
		return value;
	}

	private fnQuestion() { // "?"
		const value = this.fnPrint();

		value.type = "print";
		return value;
	}

	private fnResume() {
		const tokenType = this.token.type;
		let value: ParserNode;

		if (tokenType === "next") {
			value = this.fnCombineTwoTokens(tokenType);
		} else {
			value = this.fnCreateCmdCall();
		}
		return value;
	}

	private fnSpeed() {
		const tokenType = this.token.type;

		if (tokenType !== "ink" && tokenType !== "key" && tokenType !== "write") {
			throw this.composeError(Error(), "Expected INK, KEY or WRITE", tokenType, this.token.pos);
		}

		const value = this.fnCombineTwoTokens(tokenType);

		return value;
	}

	private fnSymbol() {
		const tokenType = this.token.type;
		let value: ParserNode;

		if (tokenType === "after") { // symbol after?
			value = this.fnCombineTwoTokens(tokenType);
		} else {
			value = this.fnCreateCmdCall(); // "symbol"
		}
		return value;
	}

	private fnWindow() {
		const tokenType = this.token.type;
		let value: ParserNode;

		if (tokenType === "swap") {
			value = this.fnCombineTwoTokens(tokenType);
		} else {
			value = this.fnCreateCmdCall();
		}
		return value;
	}


	private fnGenerateSymbols() {
		this.fnGenerateKeywordSymbols();

		// special statements ...
		this.stmt("'", this.specialStatements["'"]);
		this.stmt("|", this.specialStatements["|"]); // rsx
		this.stmt("mid$", this.specialStatements.mid$); // mid$Assign (statement), combine with function
		this.stmt("?", this.specialStatements["?"]); // "?" is same as print


		this.symbol(":");
		this.symbol(";");
		this.symbol(",");
		this.symbol(")");
		this.symbol("[");
		this.symbol("]");

		// define additional statement parts
		this.symbol("break");
		this.symbol("step");
		this.symbol("swap");
		this.symbol("then");
		this.symbol("to");
		this.symbol("using");

		this.symbol("(eol)");
		this.symbol("(end)");

		this.symbol("number", function (node) {
			return node;
		});

		this.symbol("binnumber", function (node) {
			return node;
		});

		this.symbol("hexnumber", function (node) {
			return node;
		});

		this.symbol("linenumber", function (node) {
			return node;
		});

		this.symbol("string", function (node) {
			return node;
		});

		this.symbol("unquoted", function (node) {
			return node;
		});

		this.symbol("ws", function (node) { // optional whitespace
			return node;
		});

		this.symbol("identifier", this.fnIdentifier);

		this.symbol("(", this.fnParenthesis);

		this.prefix("@", 95); // address of

		this.infix("^", 90, 80);

		this.prefix("+", 80); // + can be uses as prefix or infix
		this.prefix("-", 80); // - can be uses as prefix or infix

		this.infix("*", 70);
		this.infix("/", 70);

		this.infix("\\", 60); // integer division

		this.infix("mod", 50);

		this.infix("+", 40); // + can be uses as prefix or infix, so combine with prefix function
		this.infix("-", 40); // - can be uses as prefix or infix, so combine with prefix function

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
	}


	// http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
	// http://crockford.com/javascript/tdop/parse.js
	// Operator precedence parsing
	//
	// Operator: With left binding power (lbp) and operational function.
	// Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
	// identifiers, numbers: also nud.
	parse(tokens: LexerToken[], allowDirect?: boolean): ParserNode[] {
		this.tokens = tokens;
		this.allowDirect = allowDirect || false;

		// line
		this.line = "0"; // for error messages
		this.index = 0;

		this.token = {} as ParserNode;
		this.previousToken = this.token; // just to avoid warning

		const parseTree = this.parseTree;

		parseTree.length = 0;
		this.advance();
		while (this.token.type !== "(end)") {
			parseTree.push(this.basicLine());
		}
		return parseTree;
	}
}
