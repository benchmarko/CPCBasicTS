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
	basicVersion?: string, // "1.1" or "1.0"
	quiet?: boolean
	keepBrackets?: boolean
	keepColons?: boolean
	keepDataComma?: boolean
	keepTokens?: boolean
}

export interface ParserNode extends LexerToken {
	left?: ParserNode
	right?: ParserNode
	args?: ParserNode[]
	len?: number
}

type ParseFunction = (node: ParserNode) => ParserNode;

interface SymbolType {
	nud?: ParseFunction // null denotative function
	lbp?: number // left binding power
	led?: ParseFunction // left denotative function
	std?: ParseFunction // statement function
}

export class BasicParser {
	private readonly options: BasicParserOptions;

	private keywordsBasic10?: typeof BasicParser.keywordsBasic11; // keyward list for BASIC 1.0

	private keywords = BasicParser.keywordsBasic11;

	private label = "0"; // for error messages
	private symbols: Record<string, SymbolType> = {};

	// set also during parse
	private tokens: LexerToken[] = [];

	private index = 0;
	private previousToken: ParserNode;
	private token: ParserNode; // current token
	private readonly parseTree: ParserNode[] = [];

	private statementList: ParserNode[] = []; // just to check last statement when generating error message

	constructor(options: BasicParserOptions) {
		this.options = {
			basicVersion: "1.1", // default
			quiet: false,
			keepBrackets: false,
			keepColons: false,
			keepDataComma: false,
			keepTokens: false
		};
		this.setOptions(options, true);

		this.previousToken = {} as ParserNode; // to avoid warnings
		this.token = this.previousToken;
	}

	getOptions(): BasicParserOptions {
		return this.options;
	}

	setOptions(options: Partial<BasicParserOptions>, force?: boolean): void {
		const currentBasicVersion = this.options.basicVersion;

		Object.assign(this.options, options);

		if (force || (this.options.basicVersion !== currentBasicVersion)) { // changed?
			this.applyBasicVersion();
		}
	}

	getKeywords(): Record<string, string> {
		return this.keywords;
	}

	private applyBasicVersion() {
		const basicVersion = this.options.basicVersion;

		this.keywords = basicVersion === "1.0" ? this.getKeywords10() : BasicParser.keywordsBasic11;

		// if basicVersion changes, we need to recreate the symbols
		this.fnClearSymbols();
		this.fnGenerateSymbols();
	}

	// for basicKeywords:
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

	// keyword list for BASIC 1.1
	// first letter: c=command, f=function, p=part of command, o=operator, x=misc
	// following are arguments: n=number, s=string, l=line number (checked), v=variable (checked), q=line number range, r=letter or range, a=any, n0?=optional parameter with default null, #=stream, #0?=optional stream with default 0; suffix ?=optional (optionals must be last); last *=any number of arguments may follow
	private static readonly keywordsBasic11: Record<string, string> = {
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
		chain: "c s n? *", // CHAIN <filename>[,<line number expression>][,DELETE <line number range>]  (accepts also delete syntax) or: => chainMerge
		chainMerge: "c s n? *", // CHAIN MERGE <filename>[,<line number expression>][,DELETE <line number range>] / (special)
		chr$: "f n", // CHR$(<integer expression>)
		cint: "f n", // CINT(<numeric expression>)
		clear: "c", // CLEAR  or: => clearInput
		clearInput: "c", // CLEAR INPUT  (BASIC 1.1)
		clg: "c n?", // CLG [<ink>]
		closein: "c", // CLOSEIN
		closeout: "c", // CLOSEOUT
		cls: "c #0?", // CLS[#<stream expression>]
		cont: "c", // CONT
		copychr$: "f #", // COPYCHR$(#<stream expression>)  (BASIC 1.1)
		cos: "f n", // COS(<numeric expression>)
		creal: "f n", // CREAL(<numeric expression>)
		cursor: "c #0? n0? n?", // CURSOR [<system switch>][,<user switch>] (either parameter can be omitted but not both)  (BASIC 1.1)
		data: "c n0*", // DATA <list of: constant> (rather 0*, insert dummy null, if necessary)
		dec$: "f n s", // DEC$(<numeric expression>,<format template>)  (corrected with BASIC 1.1)
		def: "c s *", // DEF FN[<space>]<function name>[(<formal parameters>)]=<expression> / (not checked from this)
		defint: "c r r*", // DEFINT <list of: letter range>
		defreal: "c r r*", // DEFREAL <list of: letter range>
		defstr: "c r r*", // DEFSTR <list of: letter range>
		deg: "c", // DEG
		"delete": "c q0?", // DELETE [<line number range>]
		derr: "f", // DERR [BASIC 1.1]
		di: "c", // DI
		dim: "c v *", // DIM <list of: subscripted variable>
		draw: "c n n n0? n?", // DRAW <x coordinate>,<y coordinate>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink mode>)
		drawr: "c n n n0? n?", // DRAWR <x offset>,<y offset>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink mode>)
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
		fill: "c n", // FILL <ink>  (BASIC 1.1)
		fix: "f n", // FIX(<numeric expression>)
		fn: "x", // see DEF FN / (FN can also be separate from <function name>)
		"for": "c", // FOR <simple variable>=<start> TO <end> [STEP <size>]
		frame: "c", // FRAME
		fre: "f a", // FRE(<numeric expression>)  or: FRE(<string expression>)
		gosub: "c l", // GOSUB <line number>
		"goto": "c l", // GOTO <line number>
		graphics: "c", // => graphicsPaper or graphicsPen  (BASIC 1.1)
		graphicsPaper: "x n", // GRAPHICS PAPER <ink>  / (special)  (BASIC 1.1)
		graphicsPen: "x n0? n?", // GRAPHICS PEN [<ink>][,<background mode>]  / (either of the parameters may be omitted, but not both)  (BASIC 1.1)
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
		mask: "c n0? n?", // MASK [<integer expression>][,<first point setting>]  / (either of the parameters may be omitted, but not both)  (BASIC 1.1)
		max: "f a *", // MAX(<list of: numeric expression> | <one number of string>)
		memory: "c n", // MEMORY <address expression>
		merge: "c s", // MERGE <filename>
		mid$: "f s n n?", // MID$(<string expression>,<start position>[,<sub-string length>])  / (start position=1..255, sub-string length=0..255)
		mid$Assign: "f s n n?", // MID$(<string variable>,<insertion point>[,<new string length>])=<new string expression>  / (mid$ as assign)
		min: "f a *", // MIN(<list of: numeric expression> | <one number of string>)
		mod: "o", // <argument> MOD <argument>
		mode: "c n", // MODE <integer expression>
		move: "c n n n0? n?", // MOVE <x coordinate>,<y coordinate>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink>,<ink mode>)
		mover: "c n n n0? n?", // MOVER <x offset>,<y offset>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink>,<ink mode>)
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
		pen: "c #0? n0 n?", // PEN[#<stream expression>,][<ink>][,<background mode>]  / ink=0..15; background mode=0..1 (BASIC 1.1 with <background mode)
		pi: "f", // PI
		plot: "c n n n0? n?", // PLOT <x coordinate>,<y coordinate>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink mode>)
		plotr: "c n n n0? n?", // PLOTR <x offset>,<y offset>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink mode>)
		poke: "c n n", // POKE <address expression>,<integer expression>
		pos: "f #", // POS(#<stream expression>)
		print: "c #0? *", // PRINT[#<stream expression>,][<list of: print items>] ... [;][SPC(<integer expression>)] ... [;][TAB(<integer expression>)] ... [;][USING <format template>][<separator expression>]
		rad: "c", // RAD
		randomize: "c n?", // RANDOMIZE [<numeric expression>]
		read: "c v v*", // READ <list of: variable>
		release: "c n", // RELEASE <sound channels>  / (sound channels=1..7)
		rem: "c s?", // REM <rest of line>
		"'": "c s?", // '<rest of line> (apostrophe comment)
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
		write: "c #0? *", // WRITE [#<stream expression>,][<write list>]
		xor: "o", // <argument> XOR <argument>
		xpos: "f", // XPOS
		ypos: "f", // YPOS
		zone: "c n", // ZONE <integer expression>  / integer expression=1..255
		_rsx1: "c a a*", // |<rsxName>[, <argument list>] dummy with at least one parameter
		_any1: "x *", // dummy: any number of args
		_vars1: "x v*" // dummy: any number of variables
	};

	/* eslint-disable no-invalid-this */
	private readonly specialStatements: Record<string, (node: ParserNode) => ParserNode> = { // to call methods, use specialStatements[].call(this,...)
		"|": this.rsx, // rsx
		after: this.afterEveryGosub,
		chain: this.chain,
		clear: this.clear,
		data: this.data,
		def: this.def,
		"else": this.fnElse, // simular to a comment, normally not used
		ent: this.entOrEnv,
		env: this.entOrEnv,
		every: this.afterEveryGosub,
		"for": this.fnFor,
		graphics: this.graphics,
		"if": this.fnIf,
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
		window: this.window,
		write: this.write
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

	private static fnIsInString(string: string, find: string) { // same as in CodeGeneratorJS
		return find && string.indexOf(find) >= 0;
	}

	private getKeywords10(): Record<string, string> {
		if (this.keywordsBasic10) {
			return this.keywordsBasic10;
		}

		const keywords10 = {
			...BasicParser.keywordsBasic11
		}; // clone

		for (const key in keywords10) {
			if (keywords10.hasOwnProperty(key)) {
				const keyWithSpaces = " " + key + " ";

				// what about DEC$ ?
				if (BasicParser.fnIsInString(" clearInput copychr$ cursor derr fill frame graphics graphicsPaper graphicsPen mask onBreakCont ", keyWithSpaces)) {
					delete keywords10[key]; // remove keywords which do not exist in BASIC 1.0
				} else if (BasicParser.fnIsInString(" draw drawr move mover pen plot plotr ", keyWithSpaces)) {
					keywords10[key] = keywords10[key].substring(0, keywords10[key].lastIndexOf(" ")); // remove the last parameter <ink mode>; or <background mode> for pen
					if (BasicParser.fnIsInString(" move mover ", keyWithSpaces)) {
						keywords10[key] = keywords10[key].substring(0, keywords10[key].lastIndexOf(" ")); // also remove parameter <ink>
					}
				}
			}
		}
		this.keywordsBasic10 = keywords10;
		return keywords10;
	}

	private composeError(error: Error, message: string, value: string, pos: number, len?: number) {
		len = value === "(end)" ? 0 : len;
		return Utils.composeError("BasicParser", error, message, value, pos, len, this.label || undefined);
	}

	private fnLastStatementIsOnErrorGotoX() {
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

	private fnMaskedError(node: ParserNode, message: string) {
		if (!this.fnLastStatementIsOnErrorGotoX()) {
			throw this.composeError(Error(), message, node.value, node.pos);
		} else if (!this.options.quiet) {
			Utils.console.warn(this.composeError({} as Error, message, node.value, node.pos).message);
		}
	}


	// http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
	// http://crockford.com/javascript/tdop/parse.js
	// Operator precedence parsing
	//
	// Operator: With left binding power (lbp) and operational function.
	// Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
	// identifiers, numbers: also nud.

	private advance(id?: string) {
		let token = this.token;

		this.previousToken = this.token;
		if (id && id !== token.type) {
			if (!this.fnLastStatementIsOnErrorGotoX()) {
				throw this.composeError(Error(), "Expected " + id, token.value === "" ? token.type : token.value, token.pos); // we cannot mask this error because advance is very generic
			} else if (!this.options.quiet) {
				Utils.console.warn(this.composeError({} as Error, "Expected " + id, token.value === "" ? token.type : token.value, token.pos).message);
			}
		}

		token = this.tokens[this.index] as ParserNode; // we get a lex token and reuse it as parseTree token

		if (!token) { // should not occur
			Utils.console.error(this.composeError({} as Error, "advance: End of file", "", this.token && this.token.pos).message);
			return this.token; // old token
		}

		this.index += 1;

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

		this.advance();
		if (!s.nud) {
			throw this.composeError(Error(), "Unexpected token", t.value, t.pos);
		}

		let left = s.nud(t); // process literals, variables, and prefix operators

		t = this.token;
		s = this.symbols[t.type];
		while (rbp < (s.lbp || 0)) { // as long as the right binding power is less than the left binding power of the next token...
			this.advance();
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
			this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
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
			this.advance();
			return s.std(this.previousToken);
		}

		let value: ParserNode;

		if (t.type === "identifier") {
			value = this.assignment();
		} else {
			value = this.expression(0);
		}

		if (value.type !== "assign" && value.type !== "fcall" && value.type !== "def" && value.type !== "(" && value.type !== "[") {
			this.fnMaskedError(t, "Bad expression statement");
		}
		return value;
	}

	private statements(statementList: ParserNode[], closeTokens: Record<string, number>) {
		this.statementList = statementList; // fast hack to access last statement for error messages
		let colonExpected = false;

		while (!closeTokens[this.token.type]) {
			if (colonExpected || this.token.type === ":") {
				if (this.token.type !== "'" && this.token.type !== "else") { // no colon required for line comment or ELSE
					this.advance(":");
					if (this.options.keepColons) {
						statementList.push(this.previousToken);
					} else if (this.previousToken.ws) { // colon token has ws?
						this.token.ws = this.previousToken.ws + (this.token.ws || ""); // add ws to next token
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

	private static fnCreateDummyArg(type: string, value?: string): ParserNode {
		return {
			type: type, // e.g. "null"
			value: value || "",
			pos: 0,
			len: 0
		};
	}

	private basicLine() {
		let node: ParserNode;

		if (this.token.type !== "number") {
			node = BasicParser.fnCreateDummyArg("label", "");
			node.pos = this.token.pos;
		} else {
			this.advance();
			node = this.previousToken; // number token
			node.type = "label"; // number => label
		}
		this.label = node.value; // set line number for error messages
		node.args = this.statements([], BasicParser.closeTokensForLine);

		if (this.token.type === "(eol)") {
			if (this.options.keepTokens) { // not really a token
				node.args.push(this.token); // eol token with whitespace
			}
			this.advance();
		} else if (this.token.type === "(end)" && this.token.ws && this.options.keepTokens) {
			node.args.push(this.token); // end token with whitespace
		}
		return node;
	}

	private fnCombineTwoTokensNoArgs(node: ParserNode, token2: string) {
		const name = node.type + Utils.stringCapitalize(this.token.type); // e.g ."speedInk"

		node.value += (this.token.ws || " ") + this.token.value; // combine values of both

		this.token = this.advance(token2); // for "speed" e.g. "ink", "key", "write" (this.token.type)
		if (this.options.keepTokens) {
			if (!node.right) {
				node.right = this.previousToken; // set second token in first token
			} else { // e.g. on break...
				node.right.right = this.previousToken;
			}
		}

		this.previousToken = node; // fast hack to get e.g. "speed" token

		return name;
	}

	private fnCombineTwoTokens(node: ParserNode, token2: string) {
		return this.fnCreateCmdCallForType(node, this.fnCombineTwoTokensNoArgs(node, token2));
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
			this.advance();
			this.fnChangeNumber2LineNumber(left);
		}

		let range: ParserNode | undefined;

		if (this.token.type === "-") {
			range = this.token;
			this.advance();
		}

		if (range) {
			let right: ParserNode | undefined;

			if (this.token.type === "number") {
				right = this.token;
				this.advance();
				this.fnChangeNumber2LineNumber(right);
			}
			// accept also "-" as full range

			range.type = "linerange"; // change "-" => "linerange"
			range.left = left || BasicParser.fnCreateDummyArg("null"); // insert dummy for left
			range.right = right || BasicParser.fnCreateDummyArg("null"); // insert dummy for right (do not skip it)
		} else if (left) {
			range = left; // single line number
		} else {
			throw this.composeError(Error(), "Programming error: Undefined range", this.token.value, this.token.pos);
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
			this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
		}
		return expression;
	}

	private fnCheckRemainingTypes(types: string[]) {
		for (let i = 0; i < types.length; i += 1) { // some more parameters expected?
			const type = types[i];

			if (!type.endsWith("?") && !type.endsWith("*")) { // mandatory?
				const text = BasicParser.parameterTypes[type] || ("parameter " + type);

				this.fnMaskedError(this.token, "Expected " + text + " for " + this.previousToken.type);
			}
		}
	}

	private fnCheckStaticTypeNotNumber(expression: ParserNode, typeFirstChar: string) {
		const type = expression.type,
			isStringFunction = (this.keywords[type] || "").startsWith("f") && type.endsWith("$"),
			isStringIdentifier = type === "identifier" && expression.value.endsWith("$");

		if (type === "string" || type === "ustring" || type === "#" || isStringFunction || isStringIdentifier) { // got a string or a stream? (statical check)
			this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
		}
	}

	private fnCheckStaticTypeNotString(expression: ParserNode, typeFirstChar: string) {
		const type = expression.type,
			isNumericFunction = (this.keywords[type] || "").startsWith("f") && !type.endsWith("$"),
			isNumericIdentifier = type === "identifier" && (expression.value.endsWith("%") || expression.value.endsWith("!")),
			isComparison = type === "=" || type.startsWith("<") || type.startsWith(">"); // =, <, >, <=, >=

		if (type === "number" || type === "binnumber" || type === "hexnumber" || type === "expnumber" || type === "#" || isNumericFunction || isNumericIdentifier || isComparison) { // got e.g. number or a stream? (statical check)
			this.fnMaskedError(expression, "Expected " + BasicParser.parameterTypes[typeFirstChar]);
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
					type = ",";
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
			if (type !== "q0?") { // optional line number range
				throw this.composeError(Error(), "Programming error: Unexpected line range type", this.token.type, this.token.pos); // should not occur
			}
			if (this.token.type === "number" || this.token.type === "-") {
				expression = this.fnGetLineRange();
			} else {
				expression = BasicParser.fnCreateDummyArg("null");
				if (types.length) {
					type = ","; // needMore=true, maybe take it as next parameter
				}
			}
			break;
		case "n": // number"
			if (type.substring(0, 2) === "n0" && this.token.type === separator) { // n0 or n0?: if parameter not specified, insert default value null?
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
				this.fnMaskedError(expression, "Unexpected stream");
			}
			break;
		}

		args.push(expression);

		if (this.token.type === separator) {
			if (!suppressAdvance) {
				this.advance(separator);
				if (this.options.keepTokens) {
					args.push(this.previousToken);
				}
			}
			if (type.slice(-1) !== "*") {
				type = "xxx"; // initial needMore
			}
		} else if (type !== ",") { // !needMore
			type = ""; // stop
		}
		return type;
	}

	private fnGetArgs(args: ParserNode[], keyword: string) {
		const keyOpts = this.keywords[keyword],
			types = keyOpts.split(" "),
			closeTokens = BasicParser.closeTokensForArgs;
		let type = "xxx"; // initial needMore

		types.shift(); // remove keyword type

		while (type && !closeTokens[this.token.type]) {
			if (types && type.slice(-1) !== "*") { // "*"= any number of parameters
				type = types.shift() || "";
				if (!type) {
					this.fnMaskedError(this.previousToken, "Expected end of arguments"); // If masked, it will accept more args than expected
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

		if (this.previousToken.type === "," && keyword !== "delete" && keyword !== "list") { // for line number range in delete, list it is ok
			this.fnMaskedError(this.previousToken, "Operand missing");
		}

		return args;
	}

	private fnGetArgsSepByCommaSemi(args: ParserNode[]) {
		const closeTokens = BasicParser.closeTokensForArgs;

		while (!closeTokens[this.token.type]) {
			args.push(this.expression(0));
			if (this.token.type === "," || this.token.type === ";") {
				args.push(this.token); // keep comma or semicolon
				this.advance();
			} else {
				break;
			}
		}
		return args;
	}

	private fnGetArgsInParenthesis(args: ParserNode[], keyword?: string) {
		this.advance("(");
		if (this.options.keepTokens) {
			args.push(this.previousToken);
		}
		this.fnGetArgs(args, keyword || "_any1"); // until ")"

		this.advance(")");
		if (this.options.keepTokens) {
			args.push(this.previousToken);
		}
		return args;
	}

	private static brackets: Record<string, string> = {
		"(": ")",
		"[": "]"
	};

	private fnGetArgsInParenthesesOrBrackets(args: ParserNode[]) {
		const brackets = BasicParser.brackets;

		this.advance(this.token.type === "[" ? "[" : "(");
		const bracketOpen = this.previousToken;

		args.push(bracketOpen);
		this.fnGetArgs(args, "_any1"); // until "]" or ")"

		this.advance(this.token.type === "]" ? "]" : ")");
		const bracketClose = this.previousToken;

		args.push(bracketClose);

		if (!this.options.quiet && (brackets[bracketOpen.type] !== bracketClose.type)) {
			Utils.console.warn(this.composeError({} as Error, "Inconsistent bracket style", this.previousToken.value, this.previousToken.pos).message);
		}
		return args;
	}

	private fnCreateCmdCall(node: ParserNode) {
		node.args = this.fnGetArgs([], node.type);
		return node;
	}

	private fnCreateCmdCallForType(node: ParserNode, type: string) {
		if (type) {
			node.type = type; // override
		}
		return this.fnCreateCmdCall(node);
	}

	private fnCreateFuncCall(node: ParserNode) {
		node.args = [];
		if (this.token.type === "(") { // args in parenthesis?
			if (node.type === "dec$" && this.options.basicVersion === "1.0") {
				this.advance("("); // BASIC 1.0: simulate DEC$(( bug with 2 open brackets
			}
			this.fnGetArgsInParenthesis(node.args, node.type);
		} else { // no parenthesis?
			// if we have a check, make sure there are no non-optional parameters left
			const keyOpts = this.keywords[node.type];

			if (keyOpts) {
				const types = keyOpts.split(" ");

				types.shift(); // remove key
				this.fnCheckRemainingTypes(types);
			}
		}
		return node;
	}

	// ...

	private fnIdentifier(node: ParserNode) {
		if (this.token.type === "(" || this.token.type === "[") {
			node.args = [];
			this.fnGetArgsInParenthesesOrBrackets(node.args);
		}
		return node;
	}

	private fnParenthesis(node: ParserNode) { // "("
		if (this.options.keepBrackets) {
			node.args = [this.expression(0)];
		} else {
			if (node.ws) { // bracket open has ws?
				this.token.ws = node.ws + (this.token.ws || ""); // add ws to next token
			}
			node = this.expression(0);
		}

		this.advance(")");
		if (this.options.keepBrackets) {
			(node.args as ParserNode[]).push(this.previousToken);
		} else if (this.previousToken.ws) { // bracket close token has ws?
			this.token.ws = this.previousToken.ws + (this.token.ws || ""); // add ws to next token
		}
		return node;
	}

	private fnFn(node: ParserNode) {
		node.args = [];
		this.token = this.advance("identifier");
		node.right = this.previousToken;

		if (this.token.type === "(") { // optional args?
			this.fnGetArgsInParenthesis(node.args);
		}
		return node;
	}

	private rsx(node: ParserNode) { // rsx: "|"
		node.args = [];

		let type = "_any1"; // expect any number of arguments

		if (this.token.type === ",") { // arguments starting with comma
			this.advance();
			if (this.options.keepTokens) {
				node.args.push(this.previousToken);
			}
			type = "_rsx1"; // dummy token: expect at least 1 argument
		}
		this.fnGetArgs(node.args, type); // get arguments
		if (this.options.basicVersion === "1.0") { // BASIC 1.0: make sure there are no string parameters
			for (let i = 0; i < node.args.length; i += 1) {
				this.fnCheckStaticTypeNotNumber(node.args[i], "n");
			}
		}
		return node;
	}

	private afterEveryGosub(node: ParserNode) {
		const combinedNode = this.fnCreateCmdCallForType(node, node.type + "Gosub"); // "afterGosub" or "everyGosub", interval and optional timer

		if (!combinedNode.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
		}
		if (combinedNode.args.length < 2) { // add default timer 0
			combinedNode.args.push(BasicParser.fnCreateDummyArg("null"));
		}
		this.advance("gosub");
		if (this.options.keepTokens) {
			combinedNode.args.push(this.previousToken);
		}
		this.fnGetArgs(combinedNode.args, "gosub"); // line number

		return combinedNode;
	}

	private chain(node: ParserNode) {
		if (this.token.type === "merge") { // chain merge?
			const name = this.fnCombineTwoTokensNoArgs(node, this.token.type); // chainMerge

			node.type = name;
		}
		node.args = [];

		// chain, chain merge with optional DELETE
		let node2 = this.expression(0); // filename

		node.args.push(node2);
		if (this.token.type === ",") {
			this.token = this.advance();
			if (this.options.keepTokens) {
				node.args.push(this.previousToken);
			}

			let numberExpression = false; // line number (expression) found

			if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(eof)") {
				node2 = this.expression(0); // line number or expression
				node.args.push(node2);
				numberExpression = true;
			}

			if (this.token.type === ",") {
				this.advance();
				if (this.options.keepTokens) {
					node.args.push(this.previousToken);
				}

				if (!numberExpression) {
					node2 = BasicParser.fnCreateDummyArg("null"); // insert dummy arg for line
					node.args.push(node2);
				}

				this.advance("delete");
				if (this.options.keepTokens) {
					node.args.push(this.previousToken);
				}
				this.fnGetArgs(node.args, this.previousToken.type); // args for "delete"
			}
		}
		return node;
	}

	private clear(node: ParserNode) {
		const tokenType = this.token.type;

		return tokenType === "input" && this.keywords.clearInput ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "clear input" (BASIC 1.1) or "clear"
	}

	private data(node: ParserNode) {
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
			this.token = this.advance();
			if (this.options.keepDataComma) {
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

	private def(node: ParserNode) {
		node.args = [];

		this.advance("fn");
		if (this.options.keepTokens) {
			node.right = this.previousToken;
		}

		this.token = this.advance("identifier");
		if (node.right) { // keepTokens
			node.right.right = this.previousToken;
		} else {
			node.right = this.previousToken;
		}

		if (this.token.type === "(") {
			this.fnGetArgsInParenthesis(node.args, "_vars1"); // accept only variable names
		}

		this.advance("=");
		if (this.options.keepTokens) {
			node.args.push(this.previousToken);
		}

		const expression = this.expression(0);

		node.args.push(expression);
		return node;
	}

	private fnElse(node: ParserNode) { // similar to a comment, normally not used
		node.args = [];
		node.type += "Comment"; // else => elseComment

		if (!this.options.quiet) {
			Utils.console.warn(this.composeError({} as Error, "ELSE: Weird use of ELSE", this.previousToken.type, this.previousToken.pos).message);
		}

		if (this.token.type === "number") { // first token number?
			this.fnChangeNumber2LineNumber(this.token);
		}

		// TODO: data line as separate statement is taken
		while (this.token.type !== "(eol)" && this.token.type !== "(end)") {
			node.args.push(this.token); // collect tokens unchecked, may contain syntax error
			this.advance();
		}

		return node;
	}

	private entOrEnv(node: ParserNode) {
		node.args = [this.expression(0)]; // should be number or variable

		let count = 0;

		while (this.token.type === ",") {
			this.token = this.advance();
			if (this.options.keepTokens) {
				node.args.push(this.previousToken);
			}
			if (this.token.type === "=" && count % 3 === 0) { // special handling for parameter "number of steps"
				this.advance();
				if (this.options.keepTokens) {
					node.args.push(this.previousToken);
				}

				node.args.push(BasicParser.fnCreateDummyArg("null")); // insert null parameter
				count += 1;
			}
			const expression = this.expression(0);

			node.args.push(expression);
			count += 1;
		}

		return node;
	}

	private fnFor(node: ParserNode) {
		this.fnCheckExpressionType(this.token, "identifier", "v");

		const name = this.expression(90); // take simple identifier, nothing more

		this.fnCheckExpressionType(name, "identifier", "v"); // expected simple

		node.args = [name];

		this.advance("=");
		if (this.options.keepTokens) {
			node.args.push(this.previousToken);
		}
		node.args.push(this.expression(0));

		this.token = this.advance("to");
		if (this.options.keepTokens) {
			node.args.push(this.previousToken);
		}
		node.args.push(this.expression(0));

		if (this.token.type === "step") {
			this.advance();
			if (this.options.keepTokens) {
				node.args.push(this.previousToken);
			}
			node.args.push(this.expression(0));
		}
		return node;
	}

	private graphics(node: ParserNode) {
		const tokenType = this.token.type;

		if (tokenType !== "pen" && tokenType !== "paper") {
			throw this.composeError(Error(), "Expected PEN or PAPER", tokenType, this.token.pos);
		}

		return this.fnCombineTwoTokens(node, tokenType);
	}

	private fnCheckForUnreachableCode(args: ParserNode[]) {
		for (let i = 0; i < args.length; i += 1) {
			const node = args[i],
				tokenType = node.type;

			if ((i === 0 && tokenType === "linenumber") || tokenType === "goto" || tokenType === "stop") {
				const index = i + 1;

				if (index < args.length && (args[index].type !== "rem") && (args[index].type !== "'")) {
					if (args[index].type === ":" && this.options.keepColons) {
						// ignore
					} else if (!this.options.quiet) {
						Utils.console.warn(this.composeError({} as Error, "IF: Unreachable code after THEN or ELSE", tokenType, node.pos).message);
					}
					break;
				}
			}
		}
	}

	private fnIf(node: ParserNode) {
		node.right = this.expression(0); // condition
		node.args = [];

		if (this.token.type !== "goto") { // no "goto", expect "then" token...
			this.advance("then");
			if (this.options.keepTokens) {
				node.args.unshift(this.previousToken);
			}

			if (this.token.type === "number") {
				this.fnGetArgs(node.args, "goto"); // take number parameter as line number
			}
		}
		this.statements(node.args, BasicParser.closeTokensForLineAndElse); // get "then" statements until "else" or eol

		this.fnCheckForUnreachableCode(node.args);

		if (this.token.type === "else") {
			this.token = this.advance("else");
			const elseNode = this.previousToken;

			node.args.push(elseNode);

			elseNode.args = [];

			if (this.token.type === "number") {
				this.fnGetArgs(elseNode.args, "goto"); // take number parameter as line number
				// only number 0?
			}

			if (this.token.type === "if") {
				elseNode.args.push(this.statement());
			} else {
				this.statements(elseNode.args, BasicParser.closeTokensForLineAndElse);
			}

			this.fnCheckForUnreachableCode(elseNode.args);
		}
		return node;
	}

	private input(node: ParserNode) { // input or line input
		const stream = this.fnGetOptionalStream();

		node.args = [stream];
		if (stream.len !== 0) { // not an inserted stream?
			this.advance(",");
			if (this.options.keepTokens) {
				node.args.push(this.previousToken);
			}
		}

		if (this.token.type === ";") { // no newline after input?
			node.args.push(this.token);
			this.advance();
		} else {
			node.args.push(BasicParser.fnCreateDummyArg("null"));
		}

		if (this.token.type === "string" || this.token.type === "ustring") { // message
			node.args.push(this.token);
			this.token = this.advance();
			if (this.token.type === ";" || this.token.type === ",") { // ";" => need to append prompt "? " , "," = no prompt
				node.args.push(this.token);
				this.advance();
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
			if (node.type === "lineInput" || this.token.type !== ",") {
				break; // no loop for lineInput (only one arg) or no more args
			}
			this.advance(",");
			if (this.options.keepTokens) {
				node.args.push(this.previousToken);
			}
		} while (true); // eslint-disable-line no-constant-condition
		return node;
	}

	private key(node: ParserNode) {
		const tokenType = this.token.type;

		return tokenType === "def" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "key def" or "key"
	}

	private let(node: ParserNode) {
		node.right = this.assignment();
		return node;
	}

	private line(node: ParserNode) {
		node.type = this.fnCombineTwoTokensNoArgs(node, "input"); // combine "line" => "lineInput"
		return this.input(node); // continue with input
	}

	private mid$Assign(node: ParserNode) { // mid$Assign
		node.type = "mid$Assign"; // change type mid$ => mid$Assign
		this.fnCreateFuncCall(node);

		if (!node.args) {
			throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
		}

		// check that first argument is a variable...
		let i = 0;

		if (this.options.keepTokens) {
			while (node.args[i].type === "(" && i < (node.args.length - 1)) {
				i += 1;
			}
		}
		this.fnCheckExpressionType(node.args[i], "identifier", "v");

		this.advance("="); // equal as assignment
		if (this.options.keepTokens) {
			node.args.push(this.previousToken);
		}
		const expression = this.expression(0);

		node.args.push(expression);

		return node;
	}

	private on(node: ParserNode) {
		node.args = [];
		let tokenType: string;

		switch (this.token.type) {
		case "break":
			node.type = this.fnCombineTwoTokensNoArgs(node, "break"); // onBreak
			tokenType = this.token.type;
			if ((tokenType === "cont" && this.keywords.onBreakCont) || tokenType === "gosub" || tokenType === "stop") {
				this.fnCombineTwoTokens(node, this.token.type); // onBreakGosub, onBreakCont, onBreakStop
			} else {
				const msgContPart = this.keywords.onBreakCont ? "CONT, " : "";

				throw this.composeError(Error(), "Expected " + msgContPart + "GOSUB or STOP", this.token.type, this.token.pos);
			}
			break;
		case "error": // on error goto
			node.type = this.fnCombineTwoTokensNoArgs(node, "error"); // onError..
			this.fnCombineTwoTokens(node, "goto"); // onErrorGoto
			break;
		case "sq": // on sq(n) gosub
			node.right = this.expression(0);
			if (!node.right.args) {
				throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos); // should not occur
			}
			this.advance("gosub");
			if (this.options.keepTokens) {
				node.args.push(this.previousToken);
			}

			node.type = "onSqGosub";
			this.fnGetArgs(node.args, node.type);
			break;
		default: // on <expr> goto|gosub
			node.args.push(this.expression(0));
			if (this.token.type === "gosub" || this.token.type === "goto") {
				this.advance();
				if (this.options.keepTokens) {
					node.args.push(this.previousToken); // modify
				}

				node.type = "on" + Utils.stringCapitalize(this.previousToken.type); // onGoto, onGosub
				this.fnGetArgs(node.args, node.type);
			} else {
				throw this.composeError(Error(), "Expected GOTO or GOSUB", this.token.type, this.token.pos);
			}
			break;
		}
		return node;
	}

	private print(node: ParserNode) {
		const closeTokens = BasicParser.closeTokensForArgs,
			stream = this.fnGetOptionalStream();

		node.args = [stream];

		if (stream.len !== 0) { // not an inserted stream?
			if (!closeTokens[this.token.type]) {
				this.advance(",");
				if (this.options.keepTokens) {
					node.args.push(this.previousToken);
				}
			}
		}

		while (!closeTokens[this.token.type]) {
			let node2: ParserNode | undefined;

			if (this.token.type === "spc" || this.token.type === "tab") {
				this.advance();
				node2 = this.fnCreateFuncCall(this.previousToken);
			} else if (this.token.type === "using") {
				node2 = this.token;
				node2.args = [];
				this.advance();

				node2.args.push(this.expression(0)); // format

				this.advance(";"); // after the format there must be a ";"
				node2.args.push(this.previousToken); // semicolon

				node2.args = this.fnGetArgsSepByCommaSemi(node2.args);
				if (this.previousToken.type === ";") { // using closed by ";"?
					node2.args.pop(); // remove it from using
					node.args.push(node2);
					node2 = this.previousToken; // keep it for print
				}
			} else if (this.token.type === ";" || this.token.type === ",") { // separator ";" or comma tab separator ","
				node2 = this.token;
				this.advance();
			} else {
				node2 = this.expression(0);
			}

			node.args.push(node2);
		}
		return node;
	}

	private question(node: ParserNode) { // "?"
		const node2 = this.print(node); // not really a new node

		node2.type = "print";
		return node2;
	}

	private resume(node: ParserNode) {
		const tokenType = this.token.type;

		return tokenType === "next" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "resume next" or "resume"
	}

	private run(node: ParserNode) {
		if (this.token.type === "number") {
			node.args = this.fnGetArgs([], "goto"); // we get linenumber arg as for goto
		} else {
			node = this.fnCreateCmdCall(node);
		}
		return node;
	}

	private speed(node: ParserNode) {
		const tokenType = this.token.type;

		if (tokenType !== "ink" && tokenType !== "key" && tokenType !== "write") {
			throw this.composeError(Error(), "Expected INK, KEY or WRITE", tokenType, this.token.pos);
		}

		return this.fnCombineTwoTokens(node, tokenType);
	}

	private symbol(node: ParserNode) {
		const tokenType = this.token.type;

		return tokenType === "after" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "symbol after" or "symbol"
	}

	private window(node: ParserNode) {
		const tokenType = this.token.type;

		return tokenType === "swap" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node); // "window swap" or "window"
	}

	private write(node: ParserNode) {
		const closeTokens = BasicParser.closeTokensForArgs,
			stream = this.fnGetOptionalStream();

		node.args = [stream];
		if (stream.len !== 0) { // not an inserted stream?
			if (!closeTokens[this.token.type]) {
				this.advance(",");
				if (this.options.keepTokens) {
					node.args.push(this.previousToken);
				}
			}
		}

		const lengthBefore = node.args.length;

		this.fnGetArgsSepByCommaSemi(node.args);

		if ((this.previousToken.type === "," && node.args.length > lengthBefore) || this.previousToken.type === ";") {
			this.fnMaskedError(this.previousToken, "Operand missing");
		}
		return node;
	}

	// ---

	private fnClearSymbols() {
		this.symbols = {};
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

	private createNudSymbol(id: string, nud: ParseFunction) {
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

	private createStatement(id: string, fn: ParseFunction) {
		const symbol = this.createSymbol(id);

		symbol.std = () => fn.call(this, this.previousToken);
		return symbol;
	}

	private fnGenerateKeywordSymbols() {
		for (const key in this.keywords) {
			if (this.keywords.hasOwnProperty(key)) {
				const keywordType = this.keywords[key].charAt(0);

				if (keywordType === "f") {
					this.createNudSymbol(key, () => this.fnCreateFuncCall(this.previousToken));
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

		this.createNudSymbol("expnumber", BasicParser.fnNode);

		this.createNudSymbol("hexnumber", BasicParser.fnNode);

		this.createNudSymbol("linenumber", BasicParser.fnNode);

		this.createNudSymbol("string", BasicParser.fnNode);

		this.createNudSymbol("ustring", BasicParser.fnNode);

		this.createNudSymbol("unquoted", BasicParser.fnNode);

		this.createNudSymbol("ws", BasicParser.fnNode); // optional whitespace

		this.createNudSymbol("identifier", () => this.fnIdentifier(this.previousToken));

		this.createNudSymbol("(", () => this.fnParenthesis(this.previousToken));

		this.createNudSymbol("fn", () => this.fnFn(this.previousToken)); // separate fn


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
		this.advance();
		while (this.token.type !== "(end)") {
			parseTree.push(this.basicLine());
		}
		return parseTree;
	}
}
