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
	private label = "0"; // for error messages
	private quiet = false;
	private keepTokens = false;
	private keepBrackets = false;
	private keepColons = false;
	private keepDataComma = false;

	private readonly symbols: Record<string, SymbolType> = {};

	// set also during parse
	private tokens: LexerToken[] = [];

	private index = 0;
	private previousToken: ParserNode;
	private token: ParserNode; // current token
	private readonly parseTree: ParserNode[] = [];

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

	private static readonly parameterTypes: Record<string, string> = {
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

	// first letter: c=command, f=function, p=part of command, o=operator, x=misc
	// following are arguments: n=number, s=string, l=line number (checked), v=variable (checked), q=line number range, r=letter or range, a=any, n0?=optional parameter with default null, #=stream, #0?=optional stream with default 0; suffix ?=optional (optionals must be last); last *=any number of arguments may follow
	static readonly keywords: Record<string, string> = {
		abs: "f n", // ABS(<numeric expression>)
		after: "c", // => afterGosub
		afterGosub: "c n n?", // AFTER <timer delay>[,<timer number>] GOSUB <line number> / (special, cannot check optional first n, and line number)
		and: "o", // <argument> AND <argument>
		asc: "f s", // ASC(<string expression>)
		atn: "f n", // ATN(<numeric expression>)
		auto: "c n0? n0?", // AUTO [<line number>][,<increment>]
		bin$: "f n n?", // BIN$(<unsigned integer expression>[,<integer expression>])
		border: "c n n?", // BORDER <color>[,<color>]
		"break": "p", // see: ON BREAK...
		call: "c n *", // CALL <address expression>[,<list of: parameter>]
		cat: "c", // CAT
		chain: "c s n?", // CHAIN <filename>[,<line number expression>]  or: => chainMerge
		chainMerge: "c s n? *", // CHAIN MERGE <filename>[,<line number expression>][,DELETE <line number range>] / (special)
		chr$: "f n", // CHR$(<integer expression>)
		cint: "f n", // CINT(<numeric expression>)
		clear: "c", // CLEAR  or: => clearInput
		clearInput: "c", // CLEAR INPUT
		clg: "c n?", // CLG [<ink>]
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
		"delete": "c q0?", // DELETE [<line number range>]
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
		max: "f a *", // MAX(<list of: numeric expression> | <one number of string>)
		memory: "c n", // MEMORY <address expression>
		merge: "c s", // MERGE <filename>
		mid$: "f s n n?", // MID$(<string expression>,<start position>[,<sub-string length>])  / (start position=1..255, sub-string length=0..255)
		mid$Assign: "f s n n?", // MID$(<string variable>,<insertion point>[,<new string length>])=<new string expression>  / (mid$ as assign)
		min: "f a *", // MIN(<list of: numeric expression> | <one number of string>)
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
		step: "p", // STEP <size> / see: FOR
		stop: "c", // STOP
		str$: "f n", // STR$(<numeric expression>)
		string$: "f n a", // STRING$(<length>,<character specificier>) / character specificier=string character or number 0..255
		swap: "p n n?", // => windowSwap
		symbol: "c n n *", // SYMBOL <character number>,<list of: rows>   or => symbolAfter  / character number=0..255, list of 1..8 rows=0..255
		symbolAfter: "c n", // SYMBOL AFTER <integer expression>  / integer expression=0..256 (special)
		tab: "f n", // TAB(<integer expression)  / see: PRINT TAB
		tag: "c #0?", // TAG[#<stream expression>]
		tagoff: "c #0?", // TAGOFF[#<stream expression>]
		tan: "f n", // TAN(<numeric expression>)
		test: "f n n", // TEST(<x coordinate>,<y coordinate>)
		testr: "f n n", // TESTR(<x offset>,<y offset>)
		then: "p", // THEN <option part>  / see: IF
		time: "f", // TIME
		to: "p", // TO <end>  / see: FOR
		troff: "c", // TROFF
		tron: "c", // TRON
		unt: "f n", // UNT(<address expression>)
		upper$: "f s", // UPPER$(<string expression>)
		using: "p", // USING <format template>[<separator expression>]  / see: PRINT
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
		_rsx1: "c a a*", // |<rsxName>[, <argument list>] dummy with at least one parameter
		_any1: "x *" // dummy: any number of args
	}

	/* eslint-disable no-invalid-this */
	private readonly specialStatements: Record<string, () => ParserNode> = { // to call methods, use specialStatements[].call(this,...)
		"'": this.apostrophe,
		"|": this.rsx, // rsx
		after: this.afterEveryGosub,
		chain: this.chain,
		clear: this.clear,
		data: this.data,
		def: this.def,
		"else": this.else, // simular to a comment, normally not used
		ent: this.entOrEnv,
		env: this.entOrEnv,
		every: this.afterEveryGosub,
		"for": this.for,
		graphics: this.graphics,
		"if": this.if,
		input: this.input,
		key: this.key,
		let: this.let,
		line: this.line,
		mid$: this.mid$Assign, // mid$Assign
		on: this.on,
		print: this.print,
		"?": this.question, // ? is same as print
		resume: this.resume,
		run: this.run,
		speed: this.speed,
		symbol: this.symbol,
		window: this.window
	};
	/* eslint-enable no-invalid-this */


	private static readonly closeTokensForLine: Record<string, number> = {
		"(eol)": 1,
		"(end)": 1
	}

	private static readonly closeTokensForLineAndElse: Record<string, number> = {
		"(eol)": 1,
		"(end)": 1,
		"else": 1
	}


	private static readonly closeTokensForArgs: Record<string, number> = {
		":": 1,
		"(eol)": 1,
		"(end)": 1,
		"else": 1,
		rem: 1,
		"'": 1
	}

	private composeError(error: Error, message: string, value: string, pos: number, len?: number) {
		len = value === "(end)" ? 0 : len;

		return Utils.composeError("BasicParser", error, message, value, pos, len, this.label);
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

	private advance(id: string) {
		let token = this.token;

		this.previousToken = this.token;
		if (token.type !== id) {
			throw this.composeError(Error(), "Expected " + id, (token.value === "") ? token.type : token.value, token.pos);
		}

		token = this.tokens[this.index] as ParserNode; // we get a lex token and reuse it as parseTree token

		if (!token) { // should not occur
			Utils.console.error(this.composeError({} as Error, "advance: End of file", "", this.token && this.token.pos).message);
			return this.token; // old token
		}

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

		if (t.type === "(end)") {
			throw this.composeError(Error(), "Unexpected end of file", "", t.pos);
		}

		this.advance(t.type);
		if (!s.nud) {
			throw this.composeError(Error(), "Unexpected token", t.value, t.pos);
		}

		let left = s.nud(t); // process literals, variables, and prefix operators

		t = this.token;
		s = this.symbols[t.type];
		while (rbp < (s.lbp || 0)) { // as long as the right binding power is less than the left binding power of the next token...
			this.advance(t.type);
			if (!s.led) {
				throw this.composeError(Error(), "Unexpected token", t.type, t.pos);
				// TODO: How to get this error?
			}
			left = s.led(left); // ...the led method is invoked on the following token (infix and suffix operators), can be recursive
			t = this.token;
			s = this.symbols[t.type];
		}
		return left;
	}

	private fnCheckExpressionType(expression: ParserNode, expectedType: string, typeFirstChar: string) {
		if (expression.type !== expectedType) {
			throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
		}
	}

	private assignment() { // "=" as assignment, similar to let
		this.fnCheckExpressionType(this.token, "identifier", "v");

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
			this.advance(t.type);
			return s.std();
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

	private statements(closeTokens: Record<string, number>) {
		const statementList: ParserNode[] = [];

		this.statementList = statementList; // fast hack to access last statement for error messages
		let colonExpected = false;

		while (!closeTokens[this.token.type]) {
			if (colonExpected || this.token.type === ":") {
				if (this.token.type !== "'" && this.token.type !== "else") { // no colon required for line comment or ELSE
					this.advance(":");
					if (this.keepColons) {
						statementList.push(this.previousToken);
					}
				}
				colonExpected = false;
			} else {
				statementList.push(this.statement());
				colonExpected = true;
			}
		}
		return statementList;
	}

	private basicLine() {
		let node: ParserNode;

		if (this.token.type !== "number") {
			node = BasicParser.fnCreateDummyArg("label", "");
			node.pos = this.token.pos;
		} else {
			this.advance("number");
			node = this.previousToken; // number token
			node.type = "label"; // number => label
		}
		this.label = node.value; // set line number for error messages
		node.args = this.statements(BasicParser.closeTokensForLine);

		if (this.token.type === "(eol)") {
			this.advance("(eol)");
		}
		return node;
	}

	private static fnCreateDummyArg(type: string, value?: string): ParserNode {
		return {
			type: type, // e.g. "null"
			value: value !== undefined ? value : type, // e.g. "null"
			pos: 0,
			len: 0
		};
	}

	private fnCombineTwoTokensNoArgs(token2: string) {
		const node = this.previousToken,
			name = node.type + Utils.stringCapitalize(this.token.type); // e.g ."speedInk"

		node.value += (this.token.ws || " ") + this.token.value; // combine values of both

		this.token = this.advance(token2); // for "speed" e.g. "ink", "key", "write" (this.token.type)

		this.previousToken = node; // fast hack to get e.g. "speed" token

		return name;
	}

	private fnCombineTwoTokens(token2: string) {
		return this.fnCreateCmdCallForType(this.fnCombineTwoTokensNoArgs(token2));
	}

	private fnGetOptionalStream() {
		let node: ParserNode;

		if (this.token.type === "#") { // stream?
			node = this.expression(0);
		} else { // create dummy
			node = BasicParser.fnCreateDummyArg("#"); // dummy stream
			node.right = BasicParser.fnCreateDummyArg("null", "0"); // ...with dummy parameter
		}
		return node;
	}

	private fnChangeNumber2LineNumber(node: ParserNode) {
		this.fnCheckExpressionType(node, "number", "l");
		node.type = "linenumber"; // change type: number => linenumber
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

	private static fnIsSingleLetterIdentifier(node: ParserNode) {
		return node.type === "identifier" && !node.args && node.value.length === 1;
	}

	private fnGetLetterRange(typeFirstChar: string) { // l1 or l1-l2 or l1- or -l2 or nothing
		this.fnCheckExpressionType(this.token, "identifier", typeFirstChar);
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

	private fnMaskedExpressionError(expression: ParserNode, typeFirstChar: string) {
		if (!this.fnLastStatemetIsOnErrorGotoX()) {
			throw this.composeError(Error(), "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos);
		} else if (!this.quiet) {
			Utils.console.warn(this.composeError({} as Error, "Expected " + BasicParser.parameterTypes[typeFirstChar], expression.value, expression.pos).message);
		}
	}

	private fnCheckStaticTypeNotNumber(expression: ParserNode, typeFirstChar: string) {
		const type = expression.type,
			isStringFunction = (BasicParser.keywords[type] || "").startsWith("f") && type.endsWith("$"),
			isStringIdentifier = type === "identifier" && expression.value.endsWith("$");

		if (type === "string" || type === "#" || isStringFunction || isStringIdentifier) { // got a string or a stream? (statical check)
			this.fnMaskedExpressionError(expression, typeFirstChar);
		}
	}

	private fnCheckStaticTypeNotString(expression: ParserNode, typeFirstChar: string) {
		const type = expression.type,
			isNumericFunction = (BasicParser.keywords[type] || "").startsWith("f") && !type.endsWith("$"),
			isNumericIdentifier = type === "identifier" && (expression.value.endsWith("%") || expression.value.endsWith("!")),
			isComparison = type === "=" || type.startsWith("<") || type.startsWith(">"); // =, <, >, <=, >=

		if (type === "number" || type === "#" || isNumericFunction || isNumericIdentifier || isComparison) { // got e.g. number or a stream? (statical check)
			this.fnMaskedExpressionError(expression, typeFirstChar);
		}
	}

	private fnGetExpressionForType(args: ParserNode[], type: string, types: string[]) { // eslint-disable-line complexity
		const typeFirstChar = type.charAt(0),
			separator = ",";
		let expression: ParserNode,
			suppressAdvance = false;

		switch (typeFirstChar) {
		case "#": // stream expected? (for functions)
			if (type === "#0?") { // optional stream?
				if (this.token.type !== "#") { // no stream?
					suppressAdvance = true;
					type = ","; // needMore = true;
				}
				expression = this.fnGetOptionalStream();
			} else {
				expression = this.expression(0);
				this.fnCheckExpressionType(expression, "#", typeFirstChar); // check that it is a stream and not a number
			}
			break;
		case "l":
			expression = this.expression(0);
			this.fnCheckExpressionType(expression, "number", typeFirstChar);
			this.fnChangeNumber2LineNumber(expression);
			break;
		case "v": // variable (identifier)
			expression = this.expression(0);
			this.fnCheckExpressionType(expression, "identifier", typeFirstChar);
			break;
		case "r": // letter or range of letters (defint, defreal, defstr)
			expression = this.fnGetLetterRange(typeFirstChar);
			break;
		case "q": // line number range
			if (type === "q0?") { // optional line number range
				if (this.token.type === "number" || this.token.type === "-") {
					expression = this.fnGetLineRange();
				} else {
					expression = BasicParser.fnCreateDummyArg("null");
					if (types.length) {
						type = ","; // needMore=true, maybe take it as next parameter
					}
				}
			} else {
				expression = this.fnGetLineRange();
			}
			break;
		case "n": // number"
			if (type.substr(0, 2) === "n0" && this.token.type === separator) { // n0 or n0?: if parameter not specified, insert default value null?
				expression = BasicParser.fnCreateDummyArg("null");
			} else {
				expression = this.expression(0);
				this.fnCheckStaticTypeNotNumber(expression, typeFirstChar);
			}
			break;
		case "s": // string
			expression = this.expression(0);
			this.fnCheckStaticTypeNotString(expression, typeFirstChar);
			break;
		default:
			expression = this.expression(0);
			if (expression.type === "#") { // got stream?
				throw this.composeError(Error(), "Unexpected stream", expression.value, expression.pos); // do we still need this?
			}
			break;
		}

		if (this.token.type === separator) {
			if (!suppressAdvance) {
				this.advance(separator);
			}
			if (type.slice(-1) !== "*") {
				type = "xxx"; // initial needMore
			}
		} else if (type !== ",") { // !needMore
			type = ""; // stop
		}
		args.push(expression);
		return type;
	}

	private fnGetArgs(keyword: string) {
		const keyOpts = BasicParser.keywords[keyword],
			types = keyOpts.split(" "),
			args: ParserNode[] = [],
			closeTokens = BasicParser.closeTokensForArgs;
		let type = "xxx"; // initial needMore

		types.shift(); // remove keyword type

		while (type && !closeTokens[this.token.type]) {
			if (types && type.slice(-1) !== "*") { // "*"= any number of parameters
				type = types.shift() || "";
				if (!type) {
					throw this.composeError(Error(), "Expected end of arguments", this.previousToken.type, this.previousToken.pos);
				}
			}
			type = this.fnGetExpressionForType(args, type, types);
		}

		if (types.length) { // some more parameters expected?
			this.fnCheckRemainingTypes(types); // error if remaining mandatory args
			type = types[0];
			if (type === "#0?") { // null stream to add?
				const expression = BasicParser.fnCreateDummyArg("#"); // dummy stream with dummy arg

				expression.right = BasicParser.fnCreateDummyArg("null", "0");
				args.push(expression);
			}
		}

		if (this.previousToken.type === "," && keyword !== "delete" && keyword !== "list") { // for line numbe range in delete, list it is ok
			if (!this.fnLastStatemetIsOnErrorGotoX()) {
				throw this.composeError(Error(), "Operand missing", this.previousToken.type, this.previousToken.pos);
			} else if (!this.quiet) {
				Utils.console.warn(this.composeError({} as Error, "Operand missing", this.previousToken.type, this.previousToken.pos));
			}
		}

		return args;
	}

	private fnGetArgsSepByCommaSemi() {
		const closeTokens = BasicParser.closeTokensForArgs,
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
		const args = this.fnGetArgs("_any1"); // until ")"

		this.advance(")");
		return args;
	}

	private static brackets: Record<string, string> = {
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
			throw this.composeError(Error(), "Programming error: Undefined bracketOpen", this.token.type, this.token.pos); // should not occur
		}

		const args = this.fnGetArgs("_any1"); // (until "]" or ")")

		args.unshift(bracketOpen);

		let bracketClose: ParserNode | undefined;

		if (this.token.type === ")" || this.token.type === "]") {
			bracketClose = this.token;
		}
		this.advance(bracketClose ? bracketClose.type : ")");
		if (!bracketClose) {
			throw this.composeError(Error(), "Programming error: Undefined bracketClose", this.token.type, this.token.pos); // should not occur
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
		const node = this.previousToken;

		node.args = this.fnGetArgs(node.type);
		return node;
	}

	private fnCreateCmdCallForType(type: string) {
		if (type) {
			this.previousToken.type = type; // override
		}
		return this.fnCreateCmdCall();
	}

	private fnCreateFuncCall() {
		const node = this.previousToken;

		if (this.token.type === "(") { // args in parenthesis?
			this.advance("(");
			node.args = this.fnGetArgs(node.type);
			this.advance(")");
		} else { // no parenthesis?
			node.args = [];

			// if we have a check, make sure there are no non-optional parameters left
			const keyOpts = BasicParser.keywords[node.type];

			if (keyOpts) {
				const types = keyOpts.split(" ");

				types.shift(); // remove key
				this.fnCheckRemainingTypes(types);
			}
		}

		return node;
	}

	// ...

	private fnIdentifier() {
		const node = this.previousToken,
			nameValue = node.value,
			startsWithFn = nameValue.toLowerCase().startsWith("fn");

		if (startsWithFn) {
			if (this.token.type !== "(") { // Fnxxx name without ()
				const fnNode: ParserNode = { // new node!
					type: "fn",
					value: nameValue, // complete name
					args: [],
					left: node, // identifier
					pos: node.pos // same pos as identifier?
				};

				if (node.ws) {
					fnNode.ws = node.ws;
					node.ws = "";
				}

				return fnNode;
			}
		}

		if (this.token.type === "(" || this.token.type === "[") {
			if (startsWithFn) {
				node.args = this.fnGetArgsInParenthesis();
				node.type = "fn"; // FNxxx in e.g. print
				node.left = {
					type: "identifier",
					value: node.value,
					pos: node.pos
				};
			} else {
				node.args = this.fnGetArgsInParenthesesOrBrackets();
			}
		}
		return node;
	}

	private fnParenthesis() { // "("
		let node: ParserNode;

		if (this.keepBrackets) {
			node = this.previousToken; // "("
			node.args = [
				this.expression(0),
				this.token // ")" (hopefully)
			];
		} else {
			node = this.expression(0);
		}

		this.advance(")");
		return node;
	}

	private fnFn() { // separate fn
		const node = this.previousToken, // "fn"
			value2 = this.token; // identifier

		this.fnCombineTwoTokensNoArgs("identifier");

		value2.value = "fn" + value2.value; // combine "fn" + identifier (maybe simplify by separating in lexer)
		if (value2.ws) {
			value2.ws = "";
		}
		node.left = value2;
		node.args = this.token.type === "(" ? this.fnGetArgsInParenthesis() : []; // FN xxx name with ()?
		return node;
	}

	private apostrophe() { // "'" apostrophe comment => rem
		return this.fnCreateCmdCallForType("rem");
	}

	private rsx() { // rsx: "|"
		const node = this.previousToken;
		let type = "_any1"; // expect any number of arguments

		if (this.token.type === ",") { // arguments starting with comma
			this.advance(",");
			type = "_rsx1"; // dummy token: expect at least 1 argument
		}
		node.args = this.fnGetArgs(type); // get arguments
		return node;
	}

	private afterEveryGosub() {
		const node = this.fnCreateCmdCallForType(this.previousToken.type + "Gosub"); // "afterGosub" or "everyGosub", interval and optional timer

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
		}
		if (node.args.length < 2) { // add default timer 0
			node.args.push(BasicParser.fnCreateDummyArg("null"));
		}
		this.advance("gosub");
		const line = this.fnGetArgs("gosub"); // line number

		node.args.push(line[0]);
		return node;
	}

	private chain() {
		let node: ParserNode;

		if (this.token.type !== "merge") { // not chain merge?
			node = this.fnCreateCmdCall(); // chain
		} else { // chain merge with optional DELETE
			const name = this.fnCombineTwoTokensNoArgs(this.token.type); // chainMerge

			node = this.previousToken;
			node.type = name;
			node.args = [];
			let value2 = this.expression(0); // filename

			node.args.push(value2);

			this.token = this.getToken();
			if (this.token.type === ",") {
				this.token = this.advance(",");

				let numberExpression = false; // line number (expression) found

				if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(eof)") {
					value2 = this.expression(0); // line number or expression
					node.args.push(value2);
					numberExpression = true;
				}

				if (this.token.type === ",") {
					this.advance(",");

					if (!numberExpression) {
						value2 = BasicParser.fnCreateDummyArg("null"); // insert dummy arg for line
						node.args.push(value2);
					}

					this.advance("delete");
					const args = this.fnGetArgs(this.previousToken.type); // args for "delete"

					for (let i = 0; i < args.length; i += 1) {
						node.args.push(args[i]); // copy arg
					}
				}
			}
		}
		return node;
	}

	private clear() {
		const tokenType = this.token.type;

		return tokenType === "input" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "clear input" or "clear"
	}

	private data() {
		const node = this.previousToken;
		let parameterFound = false;

		node.args = [];

		// data is special: it can have empty parameters, also the last parameter, and also if no parameters
		if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(end)") {
			node.args.push(this.expression(0)); // take first argument
			parameterFound = true;
		}

		while (this.token.type === ",") {
			if (!parameterFound) {
				node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
			}
			this.token = this.advance(",");
			if (this.keepDataComma) {
				node.args.push(this.previousToken); // ","
			}

			parameterFound = false;
			if (this.token.type === "(eol)" || this.token.type === "(end)") {
				break;
			} else if (this.token.type !== ",") {
				node.args.push(this.expression(0));
				parameterFound = true;
			}
		}

		if (!parameterFound) {
			node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
		}

		return node;
	}

	private def() {
		const node = this.previousToken; // def
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

		node.left = value2;

		node.args = (this.token.type === "(") ? this.fnGetArgsInParenthesis() : [];
		this.advance("=");

		node.right = this.expression(0);
		return node;
	}

	private "else"() { // similar to a comment, normally not used
		const node = this.previousToken;

		node.args = [];

		if (!this.quiet) {
			Utils.console.warn(this.composeError({} as Error, "ELSE: Weird use of ELSE", this.previousToken.type, this.previousToken.pos).message);
		}

		if (this.token.type === "number") { // first token number?
			this.fnChangeNumber2LineNumber(this.token);
		}

		// TODO: data line as separate statement is taken
		while (this.token.type !== "(eol)" && this.token.type !== "(end)") {
			node.args.push(this.token); // collect tokens unchecked, may contain syntax error
			this.advance(this.token.type);
		}

		return node;
	}

	private entOrEnv() {
		const node = this.previousToken;

		node.args = [];

		node.args.push(this.expression(0)); // should be number or variable

		while (this.token.type === ",") {
			this.token = this.advance(",");
			if (this.token.type === "=" && (node.args.length - 1) % 3 === 0) { // special handling for parameter "number of steps"
				this.advance("=");
				node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
			}
			const expression = this.expression(0);

			node.args.push(expression);
		}

		return node;
	}

	private "for"() {
		const node = this.previousToken;

		this.fnCheckExpressionType(this.token, "identifier", "v");

		const name = this.expression(90); // take simple identifier, nothing more

		this.fnCheckExpressionType(name, "identifier", "v"); // expected simple

		node.args = [name];

		this.advance("=");
		if (this.keepTokens) {
			node.args.push(this.previousToken);
		}
		node.args.push(this.expression(0));

		this.token = this.advance("to");
		if (this.keepTokens) {
			node.args.push(this.previousToken);
		}
		node.args.push(this.expression(0));

		if (this.token.type === "step") {
			this.advance("step");
			if (this.keepTokens) {
				node.args.push(this.previousToken);
			}
			node.args.push(this.expression(0));
		}
		return node;
	}

	private graphics() {
		const tokenType = this.token.type;

		if (tokenType !== "pen" && tokenType !== "paper") {
			throw this.composeError(Error(), "Expected PEN or PAPER", tokenType, this.token.pos);
		}

		return this.fnCombineTwoTokens(tokenType);
	}

	private fnCheckForUnreachableCode(args: ParserNode[]) {
		for (let i = 0; i < args.length; i += 1) {
			const node = args[i],
				tokenType = node.type;

			if ((i === 0 && tokenType === "linenumber") || tokenType === "goto" || tokenType === "stop") {
				const index = i + 1;

				if (index < args.length && args[index].type !== "rem") {
					if (!this.quiet) {
						Utils.console.warn(this.composeError({} as Error, "IF: Unreachable code after THEN or ELSE", tokenType, node.pos).message);
					}
					break;
				}
			}
		}
	}

	private "if"() {
		const node = this.previousToken;
		let numberToken: ParserNode[] | undefined;

		node.left = this.expression(0);

		if (this.token.type !== "goto") { // no "goto", expect "then" token...
			this.advance("then");
			if (this.keepTokens) {
				node.right = this.previousToken;
			}

			if (this.token.type === "number") {
				numberToken = this.fnGetArgs("goto"); // take number parameter as line number
			}
		}
		node.args = this.statements(BasicParser.closeTokensForLineAndElse); // get "then" statements until "else" or eol
		if (numberToken) {
			node.args.unshift(numberToken[0]);
			numberToken = undefined;
		}
		this.fnCheckForUnreachableCode(node.args);

		if (this.token.type === "else") {
			this.token = this.advance("else");
			if (this.keepTokens) {
				// TODO HOWTO?
			}

			if (this.token.type === "number") {
				numberToken = this.fnGetArgs("goto"); // take number parameter as line number
			}

			node.args2 = this.token.type === "if" ? [this.statement()] : this.statements(BasicParser.closeTokensForLineAndElse);
			if (numberToken) {
				node.args2.unshift(numberToken[0]);
			}
			this.fnCheckForUnreachableCode(node.args2);
		}
		return node;
	}

	private input() { // input or line input
		const node = this.previousToken;

		node.args = [];

		const stream = this.fnGetOptionalStream();

		node.args.push(stream);
		if (stream.len !== 0) { // not an inserted stream?
			this.advance(",");
		}

		if (this.token.type === ";") { // no newline after input?
			node.args.push(this.token);
			this.advance(";");
		} else {
			node.args.push(BasicParser.fnCreateDummyArg("null"));
		}

		if (this.token.type === "string") { // message
			node.args.push(this.token);
			this.token = this.advance("string");
			if (this.token.type === ";" || this.token.type === ",") { // ";" => need to append prompt "? " , "," = no prompt
				node.args.push(this.token);
				this.advance(this.token.type);
			} else {
				throw this.composeError(Error(), "Expected ; or ,", this.token.type, this.token.pos);
			}
		} else {
			node.args.push(BasicParser.fnCreateDummyArg("null")); // dummy message
			node.args.push(BasicParser.fnCreateDummyArg("null")); // dummy prompt
		}

		do { // we need loop for input
			const value2 = this.expression(90); // we expect "identifier", no fnxx

			this.fnCheckExpressionType(value2, "identifier", "v");

			node.args.push(value2);
			if (node.type === "lineInput") {
				break; // no loop for lineInput (only one arg)
			}
		} while ((this.token.type === ",") && this.advance(","));
		return node;
	}

	private key() {
		const tokenType = this.token.type;

		return tokenType === "def" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "key def" or "key"
	}

	private let() {
		const node = this.previousToken;

		node.right = this.assignment();
		return node;
	}

	private line() {
		this.previousToken.type = this.fnCombineTwoTokensNoArgs("input"); // combine "line" => "lineInput"
		return this.input(); // continue with input
	}

	private mid$Assign() { // mid$Assign
		this.previousToken.type = "mid$Assign"; // change type mid$ => mid$Assign
		const node = this.fnCreateFuncCall();

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
		}
		this.fnCheckExpressionType(node.args[0], "identifier", "v");

		this.advance("="); // equal as assignment
		const right = this.expression(0);

		node.right = right;

		return node;
	}

	private on() {
		const node = this.previousToken;
		let left: ParserNode;

		node.args = [];

		switch (this.token.type) {
		case "break":
			this.previousToken.type = this.fnCombineTwoTokensNoArgs("break"); // onBreak
			this.token = this.getToken();
			if (this.token.type === "gosub" || this.token.type === "cont" || this.token.type === "stop") {
				this.fnCombineTwoTokens(this.token.type); // onBreakGosub, onBreakCont, onBreakStop
			} else {
				throw this.composeError(Error(), "Expected GOSUB, CONT or STOP", this.token.type, this.token.pos);
			}
			break;
		case "error": // on error goto
			this.previousToken.type = this.fnCombineTwoTokensNoArgs("error"); // onError..
			this.fnCombineTwoTokens("goto"); // onErrorGoto
			break;
		case "sq": // on sq(n) gosub
			left = this.expression(0);
			if (!left.args) {
				throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
			}
			left = left.args[0];
			this.token = this.getToken();
			this.advance("gosub");
			node.type = "onSqGosub";
			node.args = this.fnGetArgs(node.type);
			node.left = left;
			break;
		default: // on <expr>
			left = this.expression(0);
			if (this.token.type === "gosub" || this.token.type === "goto") {
				this.advance(this.token.type);
				if (this.keepTokens) {
					node.right = this.previousToken;
				}

				node.type = "on" + Utils.stringCapitalize(this.previousToken.type); // onGoto, onGosub
				node.args = this.fnGetArgs(node.type);
				node.left = left;
			} else {
				throw this.composeError(Error(), "Expected GOTO or GOSUB", this.token.type, this.token.pos);
			}
			break;
		}
		return node;
	}

	private print() {
		const node = this.previousToken,
			closeTokens = BasicParser.closeTokensForArgs,
			stream = this.fnGetOptionalStream();

		node.args = [];
		node.args.push(stream);

		let commaAfterStream = false;

		if (stream.len !== 0) { // not an inserted stream?
			commaAfterStream = true;
		}

		while (!closeTokens[this.token.type]) {
			if (commaAfterStream) {
				this.advance(",");
				commaAfterStream = false;
			}

			let node2;

			if (this.token.type === "spc" || this.token.type === "tab") {
				this.advance(this.token.type);
				node2 = this.fnCreateFuncCall();
			} else if (this.token.type === "using") {
				node2 = this.token;
				this.advance("using");
				const t = this.expression(0); // format

				this.advance(";"); // after the format there must be a ";"

				node2.args = this.fnGetArgsSepByCommaSemi();
				node2.args.unshift(t);
				if (this.previousToken.type === ";") { // using closed by ";"?
					node.args.push(node2);
					node2 = this.previousToken; // keep it for print
				}
			} else if (BasicParser.keywords[this.token.type] && (BasicParser.keywords[this.token.type].charAt(0) === "c" || BasicParser.keywords[this.token.type].charAt(0) === "p")) { // stop also at keyword which is c=command or p=part of command
				break;
				//TTT: node2 not set?
			} else if (this.token.type === ";" || this.token.type === ",") { // separator ";" or comma tab separator ","
				node2 = this.token;
				this.advance(this.token.type);
			} else {
				node2 = this.expression(0);
			}
			node.args.push(node2);
		}
		return node;
	}

	private question() { // "?"
		const node = this.print();

		node.type = "print";
		return node;
	}

	private resume() {
		const tokenType = this.token.type;

		return tokenType === "next" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "resume next" or "resume"
	}

	private run() {
		const tokenType = this.token.type;
		let node: ParserNode;

		if (tokenType === "number") {
			node = this.previousToken;
			node.args = this.fnGetArgs("goto"); // we get linenumber arg as for goto
		} else {
			node = this.fnCreateCmdCall();
		}
		return node;
	}

	private speed() {
		const tokenType = this.token.type;

		if (tokenType !== "ink" && tokenType !== "key" && tokenType !== "write") {
			throw this.composeError(Error(), "Expected INK, KEY or WRITE", tokenType, this.token.pos);
		}

		return this.fnCombineTwoTokens(tokenType);
	}

	private symbol() {
		const tokenType = this.token.type;

		return tokenType === "after" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "symbol after" or "symbol"
	}

	private window() {
		const tokenType = this.token.type;

		return tokenType === "swap" ? this.fnCombineTwoTokens(tokenType) : this.fnCreateCmdCall(); // "window swap" or "window"
	}

	private static fnNode(node: ParserNode) {
		return node;
	}

	private createSymbol(id: string) {
		if (!this.symbols[id]) { // some symbols are extended, e.g. symbols for both infix and prefix
			this.symbols[id] = {}; // create symbol
		}
		return this.symbols[id];
	}

	private createNudSymbol(id: string, nud: ParseExpressionFunction) {
		const symbol = this.createSymbol(id);

		symbol.nud = nud;
		return symbol;
	}

	private fnInfixLed(left: ParserNode, rbp: number) {
		const node = this.previousToken;

		node.left = left;
		node.right = this.expression(rbp);
		return node;
	}

	private createInfix(id: string, lbp: number, rbp?: number) {
		const symbol = this.createSymbol(id);

		symbol.lbp = lbp;
		symbol.led = (left) => this.fnInfixLed(left, rbp || lbp);
	}

	private createInfixr(id: string, lbp: number) {
		const symbol = this.createSymbol(id);

		symbol.lbp = lbp;
		symbol.led = (left) => this.fnInfixLed(left, lbp - 1);
	}

	private fnPrefixNud(rbp: number) {
		const node = this.previousToken;

		node.right = this.expression(rbp);
		return node;
	}

	private createPrefix(id: string, rbp: number) {
		this.createNudSymbol(id, () => this.fnPrefixNud(rbp));
	}

	private createStatement(id: string, fn: ParseStatmentFunction) {
		const symbol = this.createSymbol(id);

		symbol.std = () => fn.call(this);
		return symbol;
	}

	private fnGenerateKeywordSymbols() {
		for (const key in BasicParser.keywords) {
			if (BasicParser.keywords.hasOwnProperty(key)) {
				const keywordType = BasicParser.keywords[key].charAt(0);

				if (keywordType === "f") {
					this.createNudSymbol(key, () => this.fnCreateFuncCall());
				} else if (keywordType === "c") {
					this.createStatement(key, this.specialStatements[key] || this.fnCreateCmdCall);
				} else if (keywordType === "p") { // additional parts of command
					this.createSymbol(key);
				}
			}
		}
	}

	private fnGenerateSymbols() {
		this.fnGenerateKeywordSymbols();

		// special statements ...
		this.createStatement("'", this.specialStatements["'"]);
		this.createStatement("|", this.specialStatements["|"]); // rsx
		this.createStatement("mid$", this.specialStatements.mid$); // mid$Assign (statement), combine with function
		this.createStatement("?", this.specialStatements["?"]); // "?" is same as print

		this.createSymbol(":");
		this.createSymbol(";");
		this.createSymbol(",");
		this.createSymbol(")");
		this.createSymbol("[");
		this.createSymbol("]");

		this.createSymbol("(eol)");
		this.createSymbol("(end)");

		this.createNudSymbol("number", BasicParser.fnNode);

		this.createNudSymbol("binnumber", BasicParser.fnNode);

		this.createNudSymbol("hexnumber", BasicParser.fnNode);

		this.createNudSymbol("linenumber", BasicParser.fnNode);

		this.createNudSymbol("string", BasicParser.fnNode);

		this.createNudSymbol("unquoted", BasicParser.fnNode);

		this.createNudSymbol("ws", BasicParser.fnNode); // optional whitespace

		this.createNudSymbol("identifier", () => this.fnIdentifier());

		this.createNudSymbol("(", () => this.fnParenthesis());

		this.createNudSymbol("fn", () => this.fnFn()); // separate fn


		this.createPrefix("@", 95); // address of

		this.createInfix("^", 90, 80);

		this.createPrefix("+", 80); // + can be uses as prefix or infix
		this.createPrefix("-", 80); // - can be uses as prefix or infix

		this.createInfix("*", 70);
		this.createInfix("/", 70);

		this.createInfix("\\", 60); // integer division

		this.createInfix("mod", 50);

		this.createInfix("+", 40); // + can be uses as prefix or infix, so combine with prefix function
		this.createInfix("-", 40); // - can be uses as prefix or infix, so combine with prefix function

		this.createInfix("=", 30); // equal for comparison, left associative
		this.createInfix("<>", 30);
		this.createInfix("<", 30);
		this.createInfix("<=", 30);
		this.createInfix(">", 30);
		this.createInfix(">=", 30);

		this.createPrefix("not", 23);
		this.createInfixr("and", 22);
		this.createInfixr("or", 21);
		this.createInfixr("xor", 20);

		this.createPrefix("#", 10); // priority ok?
	}


	// http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
	// http://crockford.com/javascript/tdop/parse.js
	// Operator precedence parsing
	//
	// Operator: With left binding power (lbp) and operational function.
	// Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
	// identifiers, numbers: also nud.
	parse(tokens: LexerToken[]): ParserNode[] {
		this.tokens = tokens;
		// line
		this.label = "0"; // for error messages
		this.index = 0;

		this.token = {} as ParserNode;
		this.previousToken = this.token; // just to avoid warning

		const parseTree = this.parseTree;

		parseTree.length = 0;
		this.advance(this.token.type);
		while (this.token.type !== "(end)") {
			parseTree.push(this.basicLine());
		}
		return parseTree;
	}
}
