(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.cpcbasicCore = {}));
})(this, (function (exports) { 'use strict';

	const Polyfills = window.Polyfills;
	const _Utils = class _Utils {
	  static fnLoadScriptOrStyle(script, fnSuccess, fnError) {
	    let ieTimeoutCount = 3;
	    const onScriptLoad = function(event) {
	      const type = event.type, node = event.currentTarget || event.srcElement, fullUrl = node.src || node.href, key = node.getAttribute("data-key");
	      if (_Utils.debug > 1) {
	        _Utils.console.debug("onScriptLoad:", type, fullUrl, key);
	      }
	      node.removeEventListener("load", onScriptLoad, false);
	      node.removeEventListener("error", onScriptLoad, false);
	      if (type === "load") {
	        fnSuccess(fullUrl, key);
	      } else {
	        fnError(fullUrl, key);
	      }
	    }, onScriptReadyStateChange = function(event) {
	      const node = event ? event.currentTarget || event.srcElement : script, fullUrl = node.src || node.href, key = node.getAttribute("data-key"), node2 = node;
	      if (node2.detachEvent) {
	        node2.detachEvent("onreadystatechange", onScriptReadyStateChange);
	      }
	      if (_Utils.debug > 1) {
	        _Utils.console.debug("onScriptReadyStateChange: " + fullUrl);
	      }
	      if (node2.readyState !== "loaded" && node2.readyState !== "complete") {
	        if (node2.readyState === "loading" && ieTimeoutCount) {
	          ieTimeoutCount -= 1;
	          const timeout = 200;
	          _Utils.console.error("onScriptReadyStateChange: Still loading: " + fullUrl + " Waiting " + timeout + "ms (count=" + ieTimeoutCount + ")");
	          setTimeout(function() {
	            onScriptReadyStateChange();
	          }, timeout);
	        } else {
	          _Utils.console.error("onScriptReadyStateChange: Cannot load file " + fullUrl + " readystate=" + node2.readyState);
	          fnError(fullUrl, key);
	        }
	      } else {
	        fnSuccess(fullUrl, key);
	      }
	    };
	    if (script.readyState) {
	      ieTimeoutCount = 3;
	      script.attachEvent("onreadystatechange", onScriptReadyStateChange);
	    } else {
	      script.addEventListener("load", onScriptLoad, false);
	      script.addEventListener("error", onScriptLoad, false);
	    }
	    document.getElementsByTagName("head")[0].appendChild(script);
	  }
	  static loadScript(url, fnSuccess, fnError, key) {
	    const script = document.createElement("script");
	    script.type = "text/javascript";
	    script.charset = "utf-8";
	    script.async = true;
	    script.src = url;
	    script.setAttribute("data-key", key);
	    this.fnLoadScriptOrStyle(script, fnSuccess, fnError);
	  }
	  static hexEscape(str) {
	    return str.replace(/[\x00-\x1f]/g, function(char) {
	      return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
	    });
	  }
	  /*
	  static hexUnescape(str: string): string {
	  	return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
	  		return String.fromCharCode(parseInt(arguments[1], 16));
	  	});
	  }
	  */
	  static dateFormat(d) {
	    return d.getFullYear() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2) + "." + ("0" + d.getMilliseconds()).slice(-3);
	  }
	  static stringCapitalize(str) {
	    return str.charAt(0).toUpperCase() + str.substring(1);
	  }
	  static numberWithCommas(x) {
	    const parts = String(x).split(".");
	    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	    return parts.join(".");
	  }
	  static toRadians(deg) {
	    return deg * Math.PI / 180;
	  }
	  static toDegrees(rad) {
	    return rad * 180 / Math.PI;
	  }
	  static toPrecision9(num) {
	    const numStr = num.toPrecision(9), [decimal, exponent] = numStr.split("e"), result = String(Number(decimal)) + (exponent !== void 0 ? "E" + exponent.replace(/(\D)(\d)$/, "$10$2") : "");
	    return result;
	  }
	  static testIsSupported(testExpression) {
	    try {
	      Function(testExpression);
	    } catch (_e) {
	      return false;
	    }
	    return true;
	  }
	  // does the browser support reserved names (delete, new, return) in dot notation? (not old IE8; "goto" is ok)
	  static stringTrimEnd(str) {
	    return str.replace(/[\s\uFEFF\xA0]+$/, "");
	  }
	  static isCustomError(e) {
	    return e.pos !== void 0;
	  }
	  static split2(str, char) {
	    const index = str.indexOf(char);
	    return index >= 0 ? [str.slice(0, index), str.slice(index + 1)] : [str];
	  }
	  static string2Uint8Array(data) {
	    const buf = new ArrayBuffer(data.length), view = new Uint8Array(buf);
	    for (let i = 0; i < data.length; i += 1) {
	      view[i] = data.charCodeAt(i);
	    }
	    return view;
	  }
	  static uint8Array2string(data) {
	    const callSize = 25e3;
	    let len = data.length, offset = 0, out = "";
	    while (len) {
	      const chunkLen = Math.min(len, callSize), chunk = data.slice ? data.slice(offset, offset + chunkLen) : data.subarray(offset, offset + chunkLen);
	      out += String.fromCharCode.apply(null, chunk);
	      offset += chunkLen;
	      len -= chunkLen;
	    }
	    return out;
	  }
	  static composeError(name, errorObject, message, value, pos, len, line, hidden) {
	    const customError = errorObject;
	    customError.name = name;
	    customError.message = message;
	    customError.value = value;
	    if (pos !== void 0) {
	      customError.pos = pos;
	    }
	    if (len !== void 0) {
	      customError.len = len;
	    }
	    if (line !== customError.line) {
	      customError.line = line;
	    }
	    if (hidden !== void 0) {
	      customError.hidden = hidden;
	    }
	    let errorLen = customError.len;
	    if (errorLen === void 0 && customError.value !== void 0) {
	      errorLen = String(customError.value).length;
	    }
	    const endPos = (customError.pos || 0) + (errorLen || 0), lineMsg = customError.line !== void 0 ? " in " + customError.line : "", posMsg = pos !== void 0 ? " at pos " + (pos !== endPos ? customError.pos + "-" + endPos : customError.pos) : "";
	    customError.shortMessage = customError.message + (lineMsg || posMsg) + ": " + customError.value;
	    customError.message += lineMsg + posMsg + ": " + customError.value;
	    return customError;
	  }
	  static composeVmError(name, errorObject, errCode, value) {
	    const customError = _Utils.composeError(name, errorObject, String(errCode), value);
	    customError.errCode = errCode;
	    return customError;
	  }
	};
	_Utils.debug = 0;
	_Utils.console = Polyfills.console;
	_Utils.supportsBinaryLiterals = _Utils.testIsSupported("0b01");
	// does the browser support binary literals?
	_Utils.supportReservedNames = _Utils.testIsSupported("({}).return()");
	_Utils.localStorage = Polyfills.localStorage || window.localStorage;
	_Utils.atob = function(data) {
	  return window.atob(data);
	};
	_Utils.btoa = function(data) {
	  return window.btoa(data);
	};
	let Utils = _Utils;

	class BasicFormatter {
	  // current label (line) for error messages
	  constructor(options) {
	    this.label = "";
	    this.options = {
	      implicitLines: false
	    };
	    this.setOptions(options);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  composeError(error, message, value, pos, len) {
	    return Utils.composeError("BasicFormatter", error, message, value, pos, len, this.label);
	  }
	  // renumber
	  static fnHasLabel(label) {
	    return label !== "";
	  }
	  fnCreateLabelEntry(node, lastLine, implicitLines) {
	    const origLen = (node.orig || node.value).length;
	    if (!BasicFormatter.fnHasLabel(node.value) && implicitLines) {
	      node.value = String(lastLine + 1);
	    }
	    const label = node.value;
	    this.label = label;
	    if (BasicFormatter.fnHasLabel(label)) {
	      const line = Number(label);
	      if (line < 1 || line > 65535) {
	        throw this.composeError(Error(), "Line number overflow", label, node.pos, node.len);
	      }
	      if (line <= lastLine) {
	        throw this.composeError(Error(), "Expected increasing line number", label, node.pos, node.len);
	      }
	    }
	    const labelEntry = {
	      value: label,
	      pos: node.pos,
	      len: origLen,
	      // original length
	      refCount: 0
	    };
	    return labelEntry;
	  }
	  fnCreateLabelMap(nodes, implicitLines) {
	    const lines = {};
	    let lastLine = 0;
	    for (let i = 0; i < nodes.length; i += 1) {
	      const node = nodes[i];
	      if (node.type === "label") {
	        const labelEntry = this.fnCreateLabelEntry(node, lastLine, implicitLines);
	        lines[labelEntry.value] = labelEntry;
	        lastLine = Number(labelEntry.value);
	      }
	    }
	    return lines;
	  }
	  fnAddSingleReference(node, lines, refs) {
	    if (node.type === "linenumber") {
	      if (node.value in lines) {
	        refs.push({
	          value: node.value,
	          pos: node.pos,
	          len: (node.orig || node.value).length
	        });
	        const linesEntry = lines[node.value];
	        if (linesEntry.refCount === void 0) {
	          linesEntry.refCount = 1;
	        } else {
	          linesEntry.refCount += 1;
	        }
	      } else {
	        throw this.composeError(Error(), "Line does not exist", node.value, node.pos);
	      }
	    }
	  }
	  fnAddReferencesForNode(node, lines, refs) {
	    if (node.type === "label") {
	      this.label = node.value;
	    } else {
	      this.fnAddSingleReference(node, lines, refs);
	    }
	    if (node.left) {
	      this.fnAddSingleReference(node.left, lines, refs);
	    }
	    if (node.right) {
	      this.fnAddSingleReference(node.right, lines, refs);
	    }
	    if (node.args) {
	      if (node.type === "onErrorGoto" && node.args.length === 1 && node.args[0].value === "0") ; else {
	        this.fnAddReferences(node.args, lines, refs);
	      }
	    }
	  }
	  fnAddReferences(nodes, lines, refs) {
	    for (let i = 0; i < nodes.length; i += 1) {
	      this.fnAddReferencesForNode(nodes[i], lines, refs);
	    }
	  }
	  fnRenumberLines(lines, refs, newLine, oldLine, step, keep) {
	    const changes = {}, keys = Object.keys(lines);
	    function fnSortbyPosition(a, b) {
	      return lines[a].pos - lines[b].pos;
	    }
	    keys.sort(fnSortbyPosition);
	    for (let i = 0; i < keys.length; i += 1) {
	      const lineEntry = lines[keys[i]], hasLabel = BasicFormatter.fnHasLabel(lineEntry.value), line = Number(lineEntry.value);
	      if (!hasLabel || line >= oldLine && line < keep) {
	        if (newLine > 65535) {
	          throw this.composeError(Error(), "Line number overflow", lineEntry.value, lineEntry.pos);
	        }
	        lineEntry.newValue = String(newLine);
	        changes[lineEntry.pos] = lineEntry;
	        newLine += step;
	      }
	    }
	    for (let i = 0; i < refs.length; i += 1) {
	      const ref = refs[i], lineString = ref.value, line = Number(lineString);
	      if (line >= oldLine && line < keep) {
	        if (lineString !== lines[lineString].newValue) {
	          ref.newValue = lines[lineString].newValue;
	          changes[ref.pos] = ref;
	        }
	      }
	    }
	    return changes;
	  }
	  static fnSortNumbers(a, b) {
	    return a - b;
	  }
	  static fnApplyChanges(input, changes) {
	    const keys = Object.keys(changes).map(Number);
	    keys.sort(BasicFormatter.fnSortNumbers);
	    for (let i = keys.length - 1; i >= 0; i -= 1) {
	      const line = changes[keys[i]];
	      input = input.substring(0, line.pos) + line.newValue + input.substring(line.pos + line.len);
	    }
	    return input;
	  }
	  fnRenumber(input, parseTree, newLine, oldLine, step, keep) {
	    const refs = [], lines = this.fnCreateLabelMap(parseTree, Boolean(this.options.implicitLines));
	    this.fnAddReferences(parseTree, lines, refs);
	    const changes = this.fnRenumberLines(lines, refs, newLine, oldLine, step, keep), output = BasicFormatter.fnApplyChanges(input, changes);
	    return output;
	  }
	  renumber(input, newLine, oldLine, step, keep) {
	    const out = {
	      text: ""
	    };
	    this.label = "";
	    try {
	      const tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.fnRenumber(input, parseTree, newLine, oldLine, step, keep || 65535);
	      out.text = output;
	    } catch (e) {
	      if (Utils.isCustomError(e)) {
	        out.error = e;
	      } else {
	        out.error = e;
	        Utils.console.error(e);
	      }
	    }
	    return out;
	  }
	  // ---
	  fnRemoveUnusedLines(input, parseTree) {
	    const refs = [], implicitLines = true, lines = this.fnCreateLabelMap(parseTree, implicitLines);
	    this.fnAddReferences(parseTree, lines, refs);
	    const changes = {}, keys = Object.keys(lines);
	    for (let i = 0; i < keys.length; i += 1) {
	      const lineEntry = lines[keys[i]];
	      if (lineEntry.len && !lineEntry.refCount) {
	        lineEntry.newValue = "";
	        if (input[lineEntry.pos + lineEntry.len] === " ") {
	          lineEntry.len += 1;
	        }
	        changes[lineEntry.pos] = lineEntry;
	      }
	    }
	    const output = BasicFormatter.fnApplyChanges(input, changes);
	    return output;
	  }
	  removeUnusedLines(input) {
	    const out = {
	      text: ""
	    };
	    this.label = "";
	    try {
	      const tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.fnRemoveUnusedLines(input, parseTree);
	      out.text = output;
	    } catch (e) {
	      if (Utils.isCustomError(e)) {
	        out.error = e;
	      } else {
	        out.error = e;
	        Utils.console.error(e);
	      }
	    }
	    return out;
	  }
	}

	class BasicLexer {
	  // collected whitespace
	  constructor(options) {
	    this.label = "";
	    // for error messages
	    this.takeNumberAsLabel = true;
	    // first number in a line is assumed to be a label (line number)
	    this.input = "";
	    // input to analyze
	    this.index = 0;
	    // position in input
	    this.tokens = [];
	    this.whiteSpace = "";
	    this.options = {
	      keepWhiteSpace: false,
	      quiet: false
	    };
	    this.setOptions(options);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  composeError(error, message, value, pos, len) {
	    return Utils.composeError("BasicLexer", error, message, value, pos, len, this.label || void 0);
	  }
	  static isOperatorOrStreamOrAddress(c) {
	    return /[+\-*/^=()[\],;:?\\@#]/.test(c);
	  }
	  static isComparison(c) {
	    return /[<>]/.test(c);
	  }
	  static isComparison2(c) {
	    return /[<>=]/.test(c);
	  }
	  static isDigit(c) {
	    return /\d/.test(c);
	  }
	  static isSign(c) {
	    return /[+-]/.test(c);
	  }
	  static isBin(c) {
	    return /[01]/.test(c);
	  }
	  static isHex(c) {
	    return /[0-9A-Fa-f]/.test(c);
	  }
	  static isWhiteSpace(c) {
	    return /[ \r]/.test(c);
	  }
	  static isNotQuotes(c) {
	    return c !== "" && c !== '"' && c !== "\n";
	  }
	  static isIdentifierStart(c) {
	    return c !== "" && /[A-Za-z]/.test(c);
	  }
	  static isIdentifierMiddle(c) {
	    return c !== "" && /[A-Za-z0-9.]/.test(c);
	  }
	  static isIdentifierEnd(c) {
	    return c !== "" && /[$%!]/.test(c);
	  }
	  static isNotNewLine(c) {
	    return c !== "" && c !== "\n";
	  }
	  static isUnquotedData(c) {
	    return c !== "" && /[^:,\r\n]/.test(c);
	  }
	  testChar(add) {
	    return this.input.charAt(this.index + add);
	  }
	  getChar() {
	    return this.input.charAt(this.index);
	  }
	  advance() {
	    this.index += 1;
	    return this.getChar();
	  }
	  advanceWhile(char, fn) {
	    let token = "";
	    do {
	      token += char;
	      char = this.advance();
	    } while (fn(char));
	    return token;
	  }
	  debugCheckValue(type, value, pos, orig) {
	    const origValue = orig || value, part = this.input.substring(pos, pos + origValue.length);
	    if (part !== origValue) {
	      Utils.console.debug("BasicLexer:debugCheckValue:", type, part, "<>", origValue, "at pos", pos);
	    }
	  }
	  addToken(type, value, pos, orig) {
	    const node = {
	      type,
	      value,
	      pos
	    };
	    if (orig !== void 0) {
	      if (orig !== value) {
	        node.orig = orig;
	      }
	    }
	    if (this.whiteSpace !== "") {
	      node.ws = this.whiteSpace;
	      this.whiteSpace = "";
	    }
	    if (Utils.debug > 1) {
	      this.debugCheckValue(type, value, pos, node.orig);
	    }
	    this.tokens.push(node);
	  }
	  fnParseExponentialNumber(char) {
	    let token = "", index = 1;
	    while (BasicLexer.isWhiteSpace(this.testChar(index))) {
	      index += 1;
	    }
	    const char1 = this.testChar(index), char2 = this.testChar(index + 1);
	    if (BasicLexer.isDigit(char1) || BasicLexer.isSign(char1) && BasicLexer.isDigit(char2)) {
	      token += char;
	      char = this.advance();
	      while (BasicLexer.isWhiteSpace(char)) {
	        token += char;
	        char = this.advance();
	      }
	      if (BasicLexer.isSign(char)) {
	        token += char;
	        char = this.advance();
	      }
	      if (BasicLexer.isDigit(char)) {
	        token += this.advanceWhile(char, BasicLexer.isDigit);
	      }
	    }
	    return token;
	  }
	  fnParseNumber(char, startPos, startsWithDot) {
	    let token = "";
	    if (startsWithDot) {
	      token = char;
	      char = this.advance();
	    }
	    token += this.advanceWhile(char, BasicLexer.isDigit);
	    char = this.getChar();
	    if (char === "." && !startsWithDot) {
	      token += char;
	      char = this.advance();
	      if (BasicLexer.isDigit(char)) {
	        token += this.advanceWhile(char, BasicLexer.isDigit);
	        char = this.getChar();
	      }
	    }
	    let expNumberPart = "";
	    if (char === "e" || char === "E") {
	      expNumberPart = this.fnParseExponentialNumber(char);
	      token += expNumberPart;
	      if (expNumberPart[1] === " " && !this.options.quiet) {
	        Utils.console.warn(this.composeError({}, "Whitespace in exponential number", token, startPos).message);
	      }
	    }
	    const orig = token;
	    token = token.replace(/ /g, "");
	    if (!isFinite(Number(token))) {
	      throw this.composeError(Error(), "Number is too large or too small", token, startPos);
	    }
	    const number = expNumberPart ? token : parseFloat(token);
	    this.addToken(expNumberPart ? "expnumber" : "number", String(number), startPos, orig);
	    if (this.takeNumberAsLabel) {
	      this.takeNumberAsLabel = false;
	      this.label = String(number);
	    }
	  }
	  fnParseCompleteLineForRemOrApostrophe(char, startPos) {
	    if (BasicLexer.isNotNewLine(char)) {
	      let token = this.advanceWhile(char, BasicLexer.isNotNewLine), whiteSpace = "";
	      char = this.getChar();
	      if (token.endsWith("\r")) {
	        token = token.substring(0, token.length - 1);
	        whiteSpace = "\r";
	      }
	      this.addToken("unquoted", token, startPos);
	      if (whiteSpace && this.options.keepWhiteSpace) {
	        this.whiteSpace = whiteSpace;
	      }
	    }
	    return char;
	  }
	  fnParseWhiteSpace(char) {
	    const token = this.advanceWhile(char, BasicLexer.isWhiteSpace);
	    if (this.options.keepWhiteSpace) {
	      this.whiteSpace = token;
	    }
	  }
	  fnParseUnquoted(char, pos) {
	    const reSpacesAtEnd = new RegExp(/\s+$/);
	    let token = this.advanceWhile(char, BasicLexer.isUnquotedData);
	    const match = reSpacesAtEnd.exec(token), endingSpaces = match && match[0] || "";
	    token = token.trim();
	    this.addToken("unquoted", token, pos);
	    if (this.options.keepWhiteSpace) {
	      this.whiteSpace = endingSpaces;
	    }
	  }
	  fnParseCompleteLineForData(char) {
	    let pos;
	    while (BasicLexer.isNotNewLine(char)) {
	      if (BasicLexer.isWhiteSpace(char)) {
	        this.fnParseWhiteSpace(char);
	        char = this.getChar();
	      }
	      if (char === "\n") {
	        break;
	      }
	      pos = this.index;
	      if (char === '"') {
	        this.fnParseString(pos);
	        char = this.getChar();
	      } else if (char === ",") ; else {
	        this.fnParseUnquoted(char, pos);
	        char = this.getChar();
	      }
	      if (BasicLexer.isWhiteSpace(char)) {
	        this.fnParseWhiteSpace(char);
	        char = this.getChar();
	      }
	      if (char !== ",") {
	        break;
	      }
	      pos = this.index;
	      this.addToken(char, char, pos);
	      char = this.advance();
	      if (char === "\r") {
	        char = this.advance();
	      }
	    }
	  }
	  fnParseIdentifier(char, startPos) {
	    let token = char;
	    char = this.advance();
	    let lcToken = (token + char).toLowerCase();
	    if (lcToken === "fn" && this.options.keywords[lcToken]) {
	      this.addToken(lcToken, token + char, startPos);
	      this.advance();
	      return;
	    }
	    if (BasicLexer.isIdentifierMiddle(char)) {
	      token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
	      char = this.getChar();
	    }
	    let idEnd = "";
	    if (BasicLexer.isIdentifierEnd(char)) {
	      token += char;
	      idEnd = char;
	      char = this.advance();
	    }
	    lcToken = token.toLowerCase();
	    if (this.options.keywords[lcToken]) {
	      this.addToken(lcToken, token, startPos);
	      if (lcToken === "rem") {
	        startPos += lcToken.length;
	        this.fnParseCompleteLineForRemOrApostrophe(char, startPos);
	      } else if (lcToken === "data") {
	        this.fnParseCompleteLineForData(char);
	      }
	    } else {
	      if (idEnd && this.options.keywords[lcToken.substring(0, lcToken.length - 1)]) {
	        throw this.composeError(Error(), "Invalid identifier", token, startPos);
	      }
	      this.addToken("identifier", token, startPos);
	    }
	  }
	  fnParseHexOrBin(char, startPos) {
	    let token = char;
	    char = this.advance();
	    if (char.toLowerCase() === "x") {
	      token += char;
	      char = this.advance();
	      if (BasicLexer.isBin(char)) {
	        token += this.advanceWhile(char, BasicLexer.isBin);
	        this.addToken("binnumber", token, startPos);
	      } else {
	        throw this.composeError(Error(), "Expected binary number", token, startPos);
	      }
	    } else {
	      if (char.toLowerCase() === "h") {
	        token += char;
	        char = this.advance();
	      }
	      if (BasicLexer.isHex(char)) {
	        token += this.advanceWhile(char, BasicLexer.isHex);
	        this.addToken("hexnumber", token, startPos);
	      } else {
	        throw this.composeError(Error(), "Expected hex number", token, startPos);
	      }
	    }
	  }
	  fnTryContinueString(char) {
	    let out = "";
	    while (char === "\n") {
	      const char1 = this.testChar(1);
	      if (char1 !== "" && (char1 < "0" || char1 > "9")) {
	        out += this.advanceWhile(char, BasicLexer.isNotQuotes);
	        char = this.getChar();
	      } else {
	        break;
	      }
	    }
	    return out;
	  }
	  fnParseString(startPos) {
	    let char = "", token = this.advanceWhile(char, BasicLexer.isNotQuotes), type = "string", whiteSpace = "";
	    char = this.getChar();
	    if (char !== '"') {
	      const contString = this.fnTryContinueString(char);
	      if (contString) {
	        if (Utils.debug) {
	          Utils.console.debug(this.composeError({}, "Continued string", token, startPos + 1).message);
	        }
	        token += contString;
	        char = this.getChar();
	      }
	    }
	    if (char === '"') {
	      this.advance();
	    } else {
	      if (Utils.debug) {
	        Utils.console.debug(this.composeError({}, "Unterminated string", token, startPos + 1).message);
	      }
	      type = "ustring";
	      if (token.endsWith("\r")) {
	        token = token.substring(0, token.length - 1);
	        whiteSpace = "\r";
	      }
	    }
	    this.addToken(type, token, startPos + 1);
	    if (whiteSpace && this.options.keepWhiteSpace) {
	      this.whiteSpace = whiteSpace;
	    }
	  }
	  fnParseRsx(char, startPos) {
	    let token = char;
	    char = this.advance();
	    if (BasicLexer.isIdentifierMiddle(char)) {
	      token += this.advanceWhile(char, BasicLexer.isIdentifierMiddle);
	    }
	    this.addToken("|", token, startPos);
	  }
	  processNextCharacter(startPos) {
	    let char = this.getChar(), token;
	    if (BasicLexer.isWhiteSpace(char)) {
	      this.fnParseWhiteSpace(char);
	    } else if (char === "\n") {
	      this.addToken("(eol)", char, startPos);
	      this.advance();
	      this.takeNumberAsLabel = true;
	    } else if (char === "'") {
	      this.addToken(char, char, startPos);
	      char = this.advance();
	      this.fnParseCompleteLineForRemOrApostrophe(char, startPos + 1);
	    } else if (BasicLexer.isOperatorOrStreamOrAddress(char)) {
	      this.addToken(char, char, startPos);
	      this.advance();
	    } else if (BasicLexer.isDigit(char)) {
	      this.fnParseNumber(char, startPos, false);
	    } else if (char === ".") {
	      this.fnParseNumber(char, startPos, true);
	    } else if (char === "&") {
	      this.fnParseHexOrBin(char, startPos);
	    } else if (char === '"') {
	      this.fnParseString(startPos);
	    } else if (BasicLexer.isIdentifierStart(char)) {
	      this.fnParseIdentifier(char, startPos);
	    } else if (char === "|") {
	      this.fnParseRsx(char, startPos);
	    } else if (BasicLexer.isComparison(char)) {
	      token = this.advanceWhile(char, BasicLexer.isComparison2);
	      this.addToken(token, token, startPos);
	    } else {
	      throw this.composeError(Error(), "Unrecognized token", char, startPos);
	    }
	  }
	  lex(input) {
	    let startPos;
	    this.input = input;
	    this.index = 0;
	    this.label = "";
	    this.takeNumberAsLabel = true;
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

	const _BasicParser = class _BasicParser {
	  // just to check last statement when generating error message
	  constructor(options) {
	    // keyward list for BASIC 1.0
	    this.keywords = _BasicParser.keywordsBasic11;
	    this.label = "0";
	    // for error messages
	    this.symbols = {};
	    // set also during parse
	    this.tokens = [];
	    this.index = 0;
	    // current token
	    this.parseTree = [];
	    this.statementList = [];
	    /* eslint-disable no-invalid-this */
	    this.specialStatements = {
	      // to call methods, use specialStatements[].call(this,...)
	      "|": this.rsx,
	      // rsx
	      after: this.afterEveryGosub,
	      chain: this.chain,
	      clear: this.clear,
	      data: this.data,
	      def: this.def,
	      "else": this.fnElse,
	      // simular to a comment, normally not used
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
	      mid$: this.mid$Assign,
	      // mid$Assign
	      on: this.on,
	      print: this.print,
	      "?": this.question,
	      // ? is same as print
	      resume: this.resume,
	      run: this.run,
	      speed: this.speed,
	      symbol: this.symbol,
	      window: this.window,
	      write: this.write
	    };
	    this.options = {
	      basicVersion: "1.1",
	      // default
	      quiet: false,
	      keepBrackets: false,
	      keepColons: false,
	      keepDataComma: false,
	      keepTokens: false
	    };
	    this.setOptions(options, true);
	    this.previousToken = {};
	    this.token = this.previousToken;
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options, force) {
	    const currentBasicVersion = this.options.basicVersion;
	    Object.assign(this.options, options);
	    if (force || this.options.basicVersion !== currentBasicVersion) {
	      this.applyBasicVersion();
	    }
	  }
	  getKeywords() {
	    return this.keywords;
	  }
	  applyBasicVersion() {
	    const basicVersion = this.options.basicVersion;
	    this.keywords = basicVersion === "1.0" ? this.getKeywords10() : _BasicParser.keywordsBasic11;
	    this.fnClearSymbols();
	    this.fnGenerateSymbols();
	  }
	  static fnIsInString(string, find) {
	    return find && string.indexOf(find) >= 0;
	  }
	  getKeywords10() {
	    if (this.keywordsBasic10) {
	      return this.keywordsBasic10;
	    }
	    const keywords10 = {
	      ..._BasicParser.keywordsBasic11
	    };
	    for (const key in keywords10) {
	      if (keywords10.hasOwnProperty(key)) {
	        const keyWithSpaces = " " + key + " ";
	        if (_BasicParser.fnIsInString(" clearInput copychr$ cursor derr fill frame graphics graphicsPaper graphicsPen mask onBreakCont ", keyWithSpaces)) {
	          delete keywords10[key];
	        } else if (_BasicParser.fnIsInString(" draw drawr move mover pen plot plotr ", keyWithSpaces)) {
	          keywords10[key] = keywords10[key].substring(0, keywords10[key].lastIndexOf(" "));
	          if (_BasicParser.fnIsInString(" move mover ", keyWithSpaces)) {
	            keywords10[key] = keywords10[key].substring(0, keywords10[key].lastIndexOf(" "));
	          }
	        }
	      }
	    }
	    this.keywordsBasic10 = keywords10;
	    return keywords10;
	  }
	  composeError(error, message, value, pos, len) {
	    len = value === "(end)" ? 0 : len;
	    return Utils.composeError("BasicParser", error, message, value, pos, len, this.label || void 0);
	  }
	  fnLastStatementIsOnErrorGotoX() {
	    const statements = this.statementList;
	    let isOnErrorGoto = false;
	    for (let i = statements.length - 1; i >= 0; i -= 1) {
	      const lastStatement = statements[i];
	      if (lastStatement.type !== ":") {
	        if (lastStatement.type === "onErrorGoto" && lastStatement.args && Number(lastStatement.args[0].value) > 0) {
	          isOnErrorGoto = true;
	        }
	        break;
	      }
	    }
	    return isOnErrorGoto;
	  }
	  fnMaskedError(node, message) {
	    if (!this.fnLastStatementIsOnErrorGotoX()) {
	      throw this.composeError(Error(), message, node.value, node.pos);
	    } else if (!this.options.quiet) {
	      Utils.console.warn(this.composeError({}, message, node.value, node.pos).message);
	    }
	  }
	  // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
	  // http://crockford.com/javascript/tdop/parse.js
	  // Operator precedence parsing
	  //
	  // Operator: With left binding power (lbp) and operational function.
	  // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
	  // identifiers, numbers: also nud.
	  advance(id) {
	    let token = this.token;
	    this.previousToken = this.token;
	    if (id && id !== token.type) {
	      if (!this.fnLastStatementIsOnErrorGotoX()) {
	        throw this.composeError(Error(), "Expected " + id, token.value === "" ? token.type : token.value, token.pos);
	      } else if (!this.options.quiet) {
	        Utils.console.warn(this.composeError({}, "Expected " + id, token.value === "" ? token.type : token.value, token.pos).message);
	      }
	    }
	    token = this.tokens[this.index];
	    if (!token) {
	      Utils.console.error(this.composeError({}, "advance: End of file", "", this.token && this.token.pos).message);
	      return this.token;
	    }
	    this.index += 1;
	    const sym = this.symbols[token.type];
	    if (!sym) {
	      throw this.composeError(Error(), "Unknown token", token.type, token.pos);
	    }
	    this.token = token;
	    return token;
	  }
	  expression(rbp) {
	    let t = this.token, s = this.symbols[t.type];
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
	    let left = s.nud(t);
	    t = this.token;
	    s = this.symbols[t.type];
	    while (rbp < (s.lbp || 0)) {
	      this.advance();
	      if (!s.led) {
	        throw this.composeError(Error(), "Unexpected token", t.type, t.pos);
	      }
	      left = s.led(left);
	      t = this.token;
	      s = this.symbols[t.type];
	    }
	    return left;
	  }
	  fnCheckExpressionType(expression, expectedType, typeFirstChar) {
	    if (expression.type !== expectedType) {
	      this.fnMaskedError(expression, "Expected " + _BasicParser.parameterTypes[typeFirstChar]);
	    }
	  }
	  assignment() {
	    this.fnCheckExpressionType(this.token, "identifier", "v");
	    const left = this.expression(90), value = this.token;
	    this.advance("=");
	    value.left = left;
	    value.right = this.expression(0);
	    value.type = "assign";
	    return value;
	  }
	  statement() {
	    const t = this.token, s = this.symbols[t.type];
	    if (s.std) {
	      this.advance();
	      return s.std(this.previousToken);
	    }
	    let value;
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
	  statements(statementList, closeTokens) {
	    this.statementList = statementList;
	    let colonExpected = false;
	    while (!closeTokens[this.token.type]) {
	      if (colonExpected || this.token.type === ":") {
	        if (this.token.type !== "'" && this.token.type !== "else") {
	          this.advance(":");
	          if (this.options.keepColons) {
	            statementList.push(this.previousToken);
	          } else if (this.previousToken.ws) {
	            this.token.ws = this.previousToken.ws + (this.token.ws || "");
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
	  static fnCreateDummyArg(type, value) {
	    return {
	      type,
	      // e.g. "null"
	      value: value || "",
	      pos: 0,
	      len: 0
	    };
	  }
	  basicLine() {
	    let node;
	    if (this.token.type !== "number") {
	      node = _BasicParser.fnCreateDummyArg("label", "");
	      node.pos = this.token.pos;
	    } else {
	      this.advance();
	      node = this.previousToken;
	      node.type = "label";
	    }
	    this.label = node.value;
	    node.args = this.statements([], _BasicParser.closeTokensForLine);
	    if (this.token.type === "(eol)") {
	      if (this.options.keepTokens) {
	        node.args.push(this.token);
	      }
	      this.advance();
	    } else if (this.token.type === "(end)" && this.token.ws && this.options.keepTokens) {
	      node.args.push(this.token);
	    }
	    return node;
	  }
	  fnCombineTwoTokensNoArgs(node, token2) {
	    const name = node.type + Utils.stringCapitalize(this.token.type);
	    node.value += (this.token.ws || " ") + this.token.value;
	    this.token = this.advance(token2);
	    if (this.options.keepTokens) {
	      if (!node.right) {
	        node.right = this.previousToken;
	      } else {
	        node.right.right = this.previousToken;
	      }
	    }
	    this.previousToken = node;
	    return name;
	  }
	  fnCombineTwoTokens(node, token2) {
	    return this.fnCreateCmdCallForType(node, this.fnCombineTwoTokensNoArgs(node, token2));
	  }
	  fnGetOptionalStream() {
	    let node;
	    if (this.token.type === "#") {
	      node = this.expression(0);
	    } else {
	      node = _BasicParser.fnCreateDummyArg("#");
	      node.right = _BasicParser.fnCreateDummyArg("null", "0");
	    }
	    return node;
	  }
	  fnChangeNumber2LineNumber(node) {
	    this.fnCheckExpressionType(node, "number", "l");
	    node.type = "linenumber";
	  }
	  fnGetLineRange() {
	    let left;
	    if (this.token.type === "number") {
	      left = this.token;
	      this.advance();
	      this.fnChangeNumber2LineNumber(left);
	    }
	    let range;
	    if (this.token.type === "-") {
	      range = this.token;
	      this.advance();
	    }
	    if (range) {
	      let right;
	      if (this.token.type === "number") {
	        right = this.token;
	        this.advance();
	        this.fnChangeNumber2LineNumber(right);
	      }
	      range.type = "linerange";
	      range.left = left || _BasicParser.fnCreateDummyArg("null");
	      range.right = right || _BasicParser.fnCreateDummyArg("null");
	    } else if (left) {
	      range = left;
	    } else {
	      throw this.composeError(Error(), "Programming error: Undefined range", this.token.value, this.token.pos);
	    }
	    return range;
	  }
	  static fnIsSingleLetterIdentifier(node) {
	    return node.type === "identifier" && !node.args && node.value.length === 1;
	  }
	  fnGetLetterRange(typeFirstChar) {
	    this.fnCheckExpressionType(this.token, "identifier", typeFirstChar);
	    const expression = this.expression(0);
	    if (_BasicParser.fnIsSingleLetterIdentifier(expression)) {
	      expression.type = "letter";
	    } else if (expression.type === "-" && expression.left && expression.right && _BasicParser.fnIsSingleLetterIdentifier(expression.left) && _BasicParser.fnIsSingleLetterIdentifier(expression.right)) {
	      expression.type = "range";
	      expression.left.type = "letter";
	      expression.right.type = "letter";
	    } else {
	      this.fnMaskedError(expression, "Expected " + _BasicParser.parameterTypes[typeFirstChar]);
	    }
	    return expression;
	  }
	  fnCheckRemainingTypes(types) {
	    for (let i = 0; i < types.length; i += 1) {
	      const type = types[i];
	      if (!type.endsWith("?") && !type.endsWith("*")) {
	        const text = _BasicParser.parameterTypes[type] || "parameter " + type;
	        this.fnMaskedError(this.token, "Expected " + text + " for " + this.previousToken.type);
	      }
	    }
	  }
	  fnCheckStaticTypeNotNumber(expression, typeFirstChar) {
	    const type = expression.type, isStringFunction = (this.keywords[type] || "").startsWith("f") && type.endsWith("$"), isStringIdentifier = type === "identifier" && expression.value.endsWith("$");
	    if (type === "string" || type === "ustring" || type === "#" || isStringFunction || isStringIdentifier) {
	      this.fnMaskedError(expression, "Expected " + _BasicParser.parameterTypes[typeFirstChar]);
	    }
	  }
	  fnCheckStaticTypeNotString(expression, typeFirstChar) {
	    const type = expression.type, isNumericFunction = (this.keywords[type] || "").startsWith("f") && !type.endsWith("$"), isNumericIdentifier = type === "identifier" && (expression.value.endsWith("%") || expression.value.endsWith("!")), isComparison = type === "=" || type.startsWith("<") || type.startsWith(">");
	    if (type === "number" || type === "binnumber" || type === "hexnumber" || type === "expnumber" || type === "#" || isNumericFunction || isNumericIdentifier || isComparison) {
	      this.fnMaskedError(expression, "Expected " + _BasicParser.parameterTypes[typeFirstChar]);
	    }
	  }
	  fnGetExpressionForType(args, type, types) {
	    const typeFirstChar = type.charAt(0), separator = ",";
	    let expression, suppressAdvance = false;
	    switch (typeFirstChar) {
	      case "#":
	        if (type === "#0?") {
	          if (this.token.type !== "#") {
	            suppressAdvance = true;
	            type = ",";
	          }
	          expression = this.fnGetOptionalStream();
	        } else {
	          expression = this.expression(0);
	          this.fnCheckExpressionType(expression, "#", typeFirstChar);
	        }
	        break;
	      case "l":
	        expression = this.expression(0);
	        this.fnCheckExpressionType(expression, "number", typeFirstChar);
	        this.fnChangeNumber2LineNumber(expression);
	        break;
	      case "v":
	        expression = this.expression(0);
	        this.fnCheckExpressionType(expression, "identifier", typeFirstChar);
	        break;
	      case "r":
	        expression = this.fnGetLetterRange(typeFirstChar);
	        break;
	      case "q":
	        if (type !== "q0?") {
	          throw this.composeError(Error(), "Programming error: Unexpected line range type", this.token.type, this.token.pos);
	        }
	        if (this.token.type === "number" || this.token.type === "-") {
	          expression = this.fnGetLineRange();
	        } else {
	          expression = _BasicParser.fnCreateDummyArg("null");
	          if (types.length) {
	            type = ",";
	          }
	        }
	        break;
	      case "n":
	        if (type.substring(0, 2) === "n0" && this.token.type === separator) {
	          expression = _BasicParser.fnCreateDummyArg("null");
	        } else {
	          expression = this.expression(0);
	          this.fnCheckStaticTypeNotNumber(expression, typeFirstChar);
	        }
	        break;
	      case "s":
	        expression = this.expression(0);
	        this.fnCheckStaticTypeNotString(expression, typeFirstChar);
	        break;
	      default:
	        expression = this.expression(0);
	        if (expression.type === "#") {
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
	        type = "xxx";
	      }
	    } else if (type !== ",") {
	      type = "";
	    }
	    return type;
	  }
	  fnGetArgs(args, keyword) {
	    const keyOpts = this.keywords[keyword], types = keyOpts.split(" "), closeTokens = _BasicParser.closeTokensForArgs;
	    let type = "xxx";
	    types.shift();
	    while (type && !closeTokens[this.token.type]) {
	      if (types && type.slice(-1) !== "*") {
	        type = types.shift() || "";
	        if (!type) {
	          this.fnMaskedError(this.previousToken, "Expected end of arguments");
	        }
	      }
	      type = this.fnGetExpressionForType(args, type, types);
	    }
	    if (types.length) {
	      this.fnCheckRemainingTypes(types);
	      type = types[0];
	      if (type === "#0?") {
	        const expression = _BasicParser.fnCreateDummyArg("#");
	        expression.right = _BasicParser.fnCreateDummyArg("null", "0");
	        args.push(expression);
	      }
	    }
	    if (this.previousToken.type === "," && keyword !== "delete" && keyword !== "list") {
	      this.fnMaskedError(this.previousToken, "Operand missing");
	    }
	    return args;
	  }
	  fnGetArgsSepByCommaSemi(args) {
	    const closeTokens = _BasicParser.closeTokensForArgs;
	    while (!closeTokens[this.token.type]) {
	      args.push(this.expression(0));
	      if (this.token.type === "," || this.token.type === ";") {
	        args.push(this.token);
	        this.advance();
	      } else {
	        break;
	      }
	    }
	    return args;
	  }
	  fnGetArgsInParenthesis(args, keyword) {
	    this.advance("(");
	    if (this.options.keepTokens) {
	      args.push(this.previousToken);
	    }
	    this.fnGetArgs(args, keyword || "_any1");
	    this.advance(")");
	    if (this.options.keepTokens) {
	      args.push(this.previousToken);
	    }
	    return args;
	  }
	  fnGetArgsInParenthesesOrBrackets(args) {
	    const brackets = _BasicParser.brackets;
	    this.advance(this.token.type === "[" ? "[" : "(");
	    const bracketOpen = this.previousToken;
	    args.push(bracketOpen);
	    this.fnGetArgs(args, "_any1");
	    this.advance(this.token.type === "]" ? "]" : ")");
	    const bracketClose = this.previousToken;
	    args.push(bracketClose);
	    if (!this.options.quiet && brackets[bracketOpen.type] !== bracketClose.type) {
	      Utils.console.warn(this.composeError({}, "Inconsistent bracket style", this.previousToken.value, this.previousToken.pos).message);
	    }
	    return args;
	  }
	  fnCreateCmdCall(node) {
	    node.args = this.fnGetArgs([], node.type);
	    return node;
	  }
	  fnCreateCmdCallForType(node, type) {
	    if (type) {
	      node.type = type;
	    }
	    return this.fnCreateCmdCall(node);
	  }
	  fnCreateFuncCall(node) {
	    node.args = [];
	    if (this.token.type === "(") {
	      if (node.type === "dec$" && this.options.basicVersion === "1.0") {
	        this.advance("(");
	      }
	      this.fnGetArgsInParenthesis(node.args, node.type);
	    } else {
	      const keyOpts = this.keywords[node.type];
	      if (keyOpts) {
	        const types = keyOpts.split(" ");
	        types.shift();
	        this.fnCheckRemainingTypes(types);
	      }
	    }
	    return node;
	  }
	  // ...
	  fnIdentifier(node) {
	    if (this.token.type === "(" || this.token.type === "[") {
	      node.args = [];
	      this.fnGetArgsInParenthesesOrBrackets(node.args);
	    }
	    return node;
	  }
	  fnParenthesis(node) {
	    if (this.options.keepBrackets) {
	      node.args = [this.expression(0)];
	    } else {
	      if (node.ws) {
	        this.token.ws = node.ws + (this.token.ws || "");
	      }
	      node = this.expression(0);
	    }
	    this.advance(")");
	    if (this.options.keepBrackets) {
	      node.args.push(this.previousToken);
	    } else if (this.previousToken.ws) {
	      this.token.ws = this.previousToken.ws + (this.token.ws || "");
	    }
	    return node;
	  }
	  fnFn(node) {
	    node.args = [];
	    this.token = this.advance("identifier");
	    node.right = this.previousToken;
	    if (this.token.type === "(") {
	      this.fnGetArgsInParenthesis(node.args);
	    }
	    return node;
	  }
	  rsx(node) {
	    node.args = [];
	    let type = "_any1";
	    if (this.token.type === ",") {
	      this.advance();
	      if (this.options.keepTokens) {
	        node.args.push(this.previousToken);
	      }
	      type = "_rsx1";
	    }
	    this.fnGetArgs(node.args, type);
	    if (this.options.basicVersion === "1.0") {
	      for (let i = 0; i < node.args.length; i += 1) {
	        this.fnCheckStaticTypeNotNumber(node.args[i], "n");
	      }
	    }
	    return node;
	  }
	  afterEveryGosub(node) {
	    const combinedNode = this.fnCreateCmdCallForType(node, node.type + "Gosub");
	    if (!combinedNode.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos);
	    }
	    if (combinedNode.args.length < 2) {
	      combinedNode.args.push(_BasicParser.fnCreateDummyArg("null"));
	    }
	    this.advance("gosub");
	    if (this.options.keepTokens) {
	      combinedNode.args.push(this.previousToken);
	    }
	    this.fnGetArgs(combinedNode.args, "gosub");
	    return combinedNode;
	  }
	  chain(node) {
	    if (this.token.type === "merge") {
	      const name = this.fnCombineTwoTokensNoArgs(node, this.token.type);
	      node.type = name;
	    }
	    node.args = [];
	    let node2 = this.expression(0);
	    node.args.push(node2);
	    if (this.token.type === ",") {
	      this.token = this.advance();
	      if (this.options.keepTokens) {
	        node.args.push(this.previousToken);
	      }
	      let numberExpression = false;
	      if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(end)") {
	        node2 = this.expression(0);
	        node.args.push(node2);
	        numberExpression = true;
	      }
	      if (this.token.type === ",") {
	        this.advance();
	        if (this.options.keepTokens) {
	          node.args.push(this.previousToken);
	        }
	        if (!numberExpression) {
	          node2 = _BasicParser.fnCreateDummyArg("null");
	          node.args.push(node2);
	        }
	        this.advance("delete");
	        if (this.options.keepTokens) {
	          node.args.push(this.previousToken);
	        }
	        this.fnGetArgs(node.args, this.previousToken.type);
	      }
	    }
	    return node;
	  }
	  clear(node) {
	    const tokenType = this.token.type;
	    return tokenType === "input" && this.keywords.clearInput ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node);
	  }
	  data(node) {
	    let parameterFound = false;
	    node.args = [];
	    if (this.token.type !== "," && this.token.type !== "(eol)" && this.token.type !== "(end)") {
	      node.args.push(this.expression(0));
	      parameterFound = true;
	    }
	    while (this.token.type === ",") {
	      if (!parameterFound) {
	        node.args.push(_BasicParser.fnCreateDummyArg("null"));
	      }
	      this.token = this.advance();
	      if (this.options.keepDataComma) {
	        node.args.push(this.previousToken);
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
	      node.args.push(_BasicParser.fnCreateDummyArg("null"));
	    }
	    return node;
	  }
	  def(node) {
	    node.args = [];
	    this.advance("fn");
	    if (this.options.keepTokens) {
	      node.right = this.previousToken;
	    }
	    this.token = this.advance("identifier");
	    if (node.right) {
	      node.right.right = this.previousToken;
	    } else {
	      node.right = this.previousToken;
	    }
	    if (this.token.type === "(") {
	      this.fnGetArgsInParenthesis(node.args, "_vars1");
	    }
	    this.advance("=");
	    if (this.options.keepTokens) {
	      node.args.push(this.previousToken);
	    }
	    const expression = this.expression(0);
	    node.args.push(expression);
	    return node;
	  }
	  fnElse(node) {
	    node.args = [];
	    node.type += "Comment";
	    if (!this.options.quiet) {
	      Utils.console.warn(this.composeError({}, "ELSE: Weird use of ELSE", this.previousToken.type, this.previousToken.pos).message);
	    }
	    if (this.token.type === "number") {
	      this.fnChangeNumber2LineNumber(this.token);
	    }
	    while (this.token.type !== "(eol)" && this.token.type !== "(end)") {
	      node.args.push(this.token);
	      this.advance();
	    }
	    return node;
	  }
	  entOrEnv(node) {
	    node.args = [this.expression(0)];
	    let count = 0;
	    while (this.token.type === ",") {
	      this.token = this.advance();
	      if (this.options.keepTokens) {
	        node.args.push(this.previousToken);
	      }
	      if (this.token.type === "=" && count % 3 === 0) {
	        this.advance();
	        if (this.options.keepTokens) {
	          node.args.push(this.previousToken);
	        }
	        node.args.push(_BasicParser.fnCreateDummyArg("null"));
	        count += 1;
	      }
	      const expression = this.expression(0);
	      node.args.push(expression);
	      count += 1;
	    }
	    return node;
	  }
	  fnFor(node) {
	    this.fnCheckExpressionType(this.token, "identifier", "v");
	    const name = this.expression(90);
	    this.fnCheckExpressionType(name, "identifier", "v");
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
	  graphics(node) {
	    const tokenType = this.token.type;
	    if (tokenType !== "pen" && tokenType !== "paper") {
	      throw this.composeError(Error(), "Expected PEN or PAPER", tokenType, this.token.pos);
	    }
	    return this.fnCombineTwoTokens(node, tokenType);
	  }
	  fnCheckForUnreachableCode(args) {
	    for (let i = 0; i < args.length; i += 1) {
	      const node = args[i], tokenType = node.type;
	      if (i === 0 && tokenType === "linenumber" || tokenType === "goto" || tokenType === "stop") {
	        const index = i + 1;
	        if (index < args.length && args[index].type !== "rem" && args[index].type !== "'") {
	          if (args[index].type === ":" && this.options.keepColons) ; else if (!this.options.quiet) {
	            Utils.console.warn(this.composeError({}, "IF: Unreachable code after THEN or ELSE", tokenType, node.pos).message);
	          }
	          break;
	        }
	      }
	    }
	  }
	  fnIf(node) {
	    node.right = this.expression(0);
	    node.args = [];
	    if (this.token.type !== "goto") {
	      this.advance("then");
	      if (this.options.keepTokens) {
	        node.args.unshift(this.previousToken);
	      }
	      if (this.token.type === "number") {
	        this.fnGetArgs(node.args, "goto");
	      }
	    }
	    this.statements(node.args, _BasicParser.closeTokensForLineAndElse);
	    this.fnCheckForUnreachableCode(node.args);
	    if (this.token.type === "else") {
	      this.token = this.advance("else");
	      const elseNode = this.previousToken;
	      node.args.push(elseNode);
	      elseNode.args = [];
	      if (this.token.type === "number") {
	        this.fnGetArgs(elseNode.args, "goto");
	      }
	      if (this.token.type === "if") {
	        elseNode.args.push(this.statement());
	      } else {
	        this.statements(elseNode.args, _BasicParser.closeTokensForLineAndElse);
	      }
	      this.fnCheckForUnreachableCode(elseNode.args);
	    }
	    return node;
	  }
	  input(node) {
	    const stream = this.fnGetOptionalStream();
	    node.args = [stream];
	    if (stream.len !== 0) {
	      this.advance(",");
	      if (this.options.keepTokens) {
	        node.args.push(this.previousToken);
	      }
	    }
	    if (this.token.type === ";") {
	      node.args.push(this.token);
	      this.advance();
	    } else {
	      node.args.push(_BasicParser.fnCreateDummyArg("null"));
	    }
	    if (this.token.type === "string" || this.token.type === "ustring") {
	      node.args.push(this.token);
	      this.token = this.advance();
	      if (this.token.type === ";" || this.token.type === ",") {
	        node.args.push(this.token);
	        this.advance();
	      } else {
	        throw this.composeError(Error(), "Expected ; or ,", this.token.type, this.token.pos);
	      }
	    } else {
	      node.args.push(_BasicParser.fnCreateDummyArg("null"));
	      node.args.push(_BasicParser.fnCreateDummyArg("null"));
	    }
	    do {
	      const value2 = this.expression(90);
	      this.fnCheckExpressionType(value2, "identifier", "v");
	      node.args.push(value2);
	      if (node.type === "lineInput" || this.token.type !== ",") {
	        break;
	      }
	      this.advance(",");
	      if (this.options.keepTokens) {
	        node.args.push(this.previousToken);
	      }
	    } while (true);
	    return node;
	  }
	  key(node) {
	    const tokenType = this.token.type;
	    return tokenType === "def" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node);
	  }
	  let(node) {
	    node.right = this.assignment();
	    return node;
	  }
	  line(node) {
	    node.type = this.fnCombineTwoTokensNoArgs(node, "input");
	    return this.input(node);
	  }
	  mid$Assign(node) {
	    node.type = "mid$Assign";
	    this.fnCreateFuncCall(node);
	    if (!node.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos);
	    }
	    let i = 0;
	    if (this.options.keepTokens) {
	      while (node.args[i].type === "(" && i < node.args.length - 1) {
	        i += 1;
	      }
	    }
	    this.fnCheckExpressionType(node.args[i], "identifier", "v");
	    this.advance("=");
	    if (this.options.keepTokens) {
	      node.args.push(this.previousToken);
	    }
	    const expression = this.expression(0);
	    node.args.push(expression);
	    return node;
	  }
	  on(node) {
	    node.args = [];
	    let tokenType;
	    switch (this.token.type) {
	      case "break":
	        node.type = this.fnCombineTwoTokensNoArgs(node, "break");
	        tokenType = this.token.type;
	        if (tokenType === "cont" && this.keywords.onBreakCont || tokenType === "gosub" || tokenType === "stop") {
	          this.fnCombineTwoTokens(node, this.token.type);
	        } else {
	          const msgContPart = this.keywords.onBreakCont ? "CONT, " : "";
	          throw this.composeError(Error(), "Expected " + msgContPart + "GOSUB or STOP", this.token.type, this.token.pos);
	        }
	        break;
	      case "error":
	        node.type = this.fnCombineTwoTokensNoArgs(node, "error");
	        this.fnCombineTwoTokens(node, "goto");
	        break;
	      case "sq":
	        node.right = this.expression(0);
	        if (!node.right.args) {
	          throw this.composeError(Error(), "Programming error: Undefined args", this.token.type, this.token.pos);
	        }
	        this.advance("gosub");
	        if (this.options.keepTokens) {
	          node.args.push(this.previousToken);
	        }
	        node.type = "onSqGosub";
	        this.fnGetArgs(node.args, node.type);
	        break;
	      default:
	        node.args.push(this.expression(0));
	        if (this.token.type === "gosub" || this.token.type === "goto") {
	          this.advance();
	          if (this.options.keepTokens) {
	            node.args.push(this.previousToken);
	          }
	          node.type = "on" + Utils.stringCapitalize(this.previousToken.type);
	          this.fnGetArgs(node.args, node.type);
	        } else {
	          throw this.composeError(Error(), "Expected GOTO or GOSUB", this.token.type, this.token.pos);
	        }
	        break;
	    }
	    return node;
	  }
	  print(node) {
	    const closeTokens = _BasicParser.closeTokensForArgs, stream = this.fnGetOptionalStream();
	    node.args = [stream];
	    if (stream.len !== 0) {
	      if (!closeTokens[this.token.type]) {
	        this.advance(",");
	        if (this.options.keepTokens) {
	          node.args.push(this.previousToken);
	        }
	      }
	    }
	    while (!closeTokens[this.token.type]) {
	      let node2;
	      if (this.token.type === "spc" || this.token.type === "tab") {
	        this.advance();
	        node2 = this.fnCreateFuncCall(this.previousToken);
	      } else if (this.token.type === "using") {
	        node2 = this.token;
	        node2.args = [];
	        this.advance();
	        node2.args.push(this.expression(0));
	        this.advance(";");
	        node2.args.push(this.previousToken);
	        node2.args = this.fnGetArgsSepByCommaSemi(node2.args);
	        if (this.previousToken.type === ";") {
	          node2.args.pop();
	          node.args.push(node2);
	          node2 = this.previousToken;
	        }
	      } else if (this.token.type === ";" || this.token.type === ",") {
	        node2 = this.token;
	        this.advance();
	      } else {
	        node2 = this.expression(0);
	      }
	      node.args.push(node2);
	    }
	    return node;
	  }
	  question(node) {
	    const node2 = this.print(node);
	    node2.type = "print";
	    return node2;
	  }
	  resume(node) {
	    const tokenType = this.token.type;
	    return tokenType === "next" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node);
	  }
	  run(node) {
	    if (this.token.type === "number") {
	      node.args = this.fnGetArgs([], "goto");
	    } else {
	      node = this.fnCreateCmdCall(node);
	    }
	    return node;
	  }
	  speed(node) {
	    const tokenType = this.token.type;
	    if (tokenType !== "ink" && tokenType !== "key" && tokenType !== "write") {
	      throw this.composeError(Error(), "Expected INK, KEY or WRITE", tokenType, this.token.pos);
	    }
	    return this.fnCombineTwoTokens(node, tokenType);
	  }
	  symbol(node) {
	    const tokenType = this.token.type;
	    return tokenType === "after" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node);
	  }
	  window(node) {
	    const tokenType = this.token.type;
	    return tokenType === "swap" ? this.fnCombineTwoTokens(node, tokenType) : this.fnCreateCmdCall(node);
	  }
	  write(node) {
	    const closeTokens = _BasicParser.closeTokensForArgs, stream = this.fnGetOptionalStream();
	    node.args = [stream];
	    if (stream.len !== 0) {
	      if (!closeTokens[this.token.type]) {
	        this.advance(",");
	        if (this.options.keepTokens) {
	          node.args.push(this.previousToken);
	        }
	      }
	    }
	    const lengthBefore = node.args.length;
	    this.fnGetArgsSepByCommaSemi(node.args);
	    if (this.previousToken.type === "," && node.args.length > lengthBefore || this.previousToken.type === ";") {
	      this.fnMaskedError(this.previousToken, "Operand missing");
	    }
	    return node;
	  }
	  // ---
	  fnClearSymbols() {
	    this.symbols = {};
	  }
	  static fnNode(node) {
	    return node;
	  }
	  createSymbol(id) {
	    if (!this.symbols[id]) {
	      this.symbols[id] = {};
	    }
	    return this.symbols[id];
	  }
	  createNudSymbol(id, nud) {
	    const symbol = this.createSymbol(id);
	    symbol.nud = nud;
	    return symbol;
	  }
	  fnInfixLed(left, rbp) {
	    const node = this.previousToken;
	    node.left = left;
	    node.right = this.expression(rbp);
	    return node;
	  }
	  createInfix(id, lbp, rbp) {
	    const symbol = this.createSymbol(id);
	    symbol.lbp = lbp;
	    symbol.led = (left) => this.fnInfixLed(left, rbp || lbp);
	  }
	  createInfixr(id, lbp) {
	    const symbol = this.createSymbol(id);
	    symbol.lbp = lbp;
	    symbol.led = (left) => this.fnInfixLed(left, lbp - 1);
	  }
	  fnPrefixNud(rbp) {
	    const node = this.previousToken;
	    node.right = this.expression(rbp);
	    return node;
	  }
	  createPrefix(id, rbp) {
	    this.createNudSymbol(id, () => this.fnPrefixNud(rbp));
	  }
	  createStatement(id, fn) {
	    const symbol = this.createSymbol(id);
	    symbol.std = () => fn.call(this, this.previousToken);
	    return symbol;
	  }
	  fnGenerateKeywordSymbols() {
	    for (const key in this.keywords) {
	      if (this.keywords.hasOwnProperty(key)) {
	        const keywordType = this.keywords[key].charAt(0);
	        if (keywordType === "f") {
	          this.createNudSymbol(key, () => this.fnCreateFuncCall(this.previousToken));
	        } else if (keywordType === "c") {
	          this.createStatement(key, this.specialStatements[key] || this.fnCreateCmdCall);
	        } else if (keywordType === "p") {
	          this.createSymbol(key);
	        }
	      }
	    }
	  }
	  fnGenerateSymbols() {
	    this.fnGenerateKeywordSymbols();
	    this.createStatement("|", this.specialStatements["|"]);
	    this.createStatement("mid$", this.specialStatements.mid$);
	    this.createStatement("?", this.specialStatements["?"]);
	    this.createSymbol(":");
	    this.createSymbol(";");
	    this.createSymbol(",");
	    this.createSymbol(")");
	    this.createSymbol("[");
	    this.createSymbol("]");
	    this.createSymbol("(eol)");
	    this.createSymbol("(end)");
	    this.createNudSymbol("number", _BasicParser.fnNode);
	    this.createNudSymbol("binnumber", _BasicParser.fnNode);
	    this.createNudSymbol("expnumber", _BasicParser.fnNode);
	    this.createNudSymbol("hexnumber", _BasicParser.fnNode);
	    this.createNudSymbol("linenumber", _BasicParser.fnNode);
	    this.createNudSymbol("string", _BasicParser.fnNode);
	    this.createNudSymbol("ustring", _BasicParser.fnNode);
	    this.createNudSymbol("unquoted", _BasicParser.fnNode);
	    this.createNudSymbol("ws", _BasicParser.fnNode);
	    this.createNudSymbol("identifier", () => this.fnIdentifier(this.previousToken));
	    this.createNudSymbol("(", () => this.fnParenthesis(this.previousToken));
	    this.createNudSymbol("fn", () => this.fnFn(this.previousToken));
	    this.createPrefix("@", 95);
	    this.createInfix("^", 90, 80);
	    this.createPrefix("+", 80);
	    this.createPrefix("-", 80);
	    this.createInfix("*", 70);
	    this.createInfix("/", 70);
	    this.createInfix("\\", 60);
	    this.createInfix("mod", 50);
	    this.createInfix("+", 40);
	    this.createInfix("-", 40);
	    this.createInfix("=", 30);
	    this.createInfix("<>", 30);
	    this.createInfix("<", 30);
	    this.createInfix("<=", 30);
	    this.createInfix(">", 30);
	    this.createInfix(">=", 30);
	    this.createPrefix("not", 23);
	    this.createInfixr("and", 22);
	    this.createInfixr("or", 21);
	    this.createInfixr("xor", 20);
	    this.createPrefix("#", 10);
	  }
	  // http://crockford.com/javascript/tdop/tdop.html (old: http://javascript.crockford.com/tdop/tdop.html)
	  // http://crockford.com/javascript/tdop/parse.js
	  // Operator precedence parsing
	  //
	  // Operator: With left binding power (lbp) and operational function.
	  // Manipulates tokens to its left (e.g: +)? => left denotative function led(), otherwise null denotative function nud()), (e.g. unary -)
	  // identifiers, numbers: also nud.
	  parse(tokens) {
	    this.tokens = tokens;
	    this.label = "0";
	    this.index = 0;
	    this.token = {};
	    this.previousToken = this.token;
	    const parseTree = this.parseTree;
	    parseTree.length = 0;
	    this.advance();
	    while (this.token.type !== "(end)") {
	      parseTree.push(this.basicLine());
	    }
	    return parseTree;
	  }
	};
	// for basicKeywords:
	_BasicParser.parameterTypes = {
	  c: "command",
	  f: "function",
	  o: "operator",
	  n: "number",
	  s: "string",
	  l: "line number",
	  // checked
	  q: "line number range",
	  v: "variable",
	  // checked,
	  r: "letter or range",
	  a: "any parameter",
	  "n0?": "optional parameter with default null",
	  "#": "stream"
	};
	// keyword list for BASIC 1.1
	// first letter: c=command, f=function, p=part of command, o=operator, x=misc
	// following are arguments: n=number, s=string, l=line number (checked), v=variable (checked), q=line number range, r=letter or range, a=any, n0?=optional parameter with default null, #=stream, #0?=optional stream with default 0; suffix ?=optional (optionals must be last); last *=any number of arguments may follow
	_BasicParser.keywordsBasic11 = {
	  abs: "f n",
	  // ABS(<numeric expression>)
	  after: "c",
	  // => afterGosub
	  afterGosub: "c n n?",
	  // AFTER <timer delay>[,<timer number>] GOSUB <line number> / (special, cannot check optional first n, and line number)
	  and: "o",
	  // <argument> AND <argument>
	  asc: "f s",
	  // ASC(<string expression>)
	  atn: "f n",
	  // ATN(<numeric expression>)
	  auto: "c n0? n0?",
	  // AUTO [<line number>][,<increment>]
	  bin$: "f n n?",
	  // BIN$(<unsigned integer expression>[,<integer expression>])
	  border: "c n n?",
	  // BORDER <color>[,<color>]
	  "break": "p",
	  // see: ON BREAK...
	  call: "c n *",
	  // CALL <address expression>[,<list of: parameter>]
	  cat: "c",
	  // CAT
	  chain: "c s n? *",
	  // CHAIN <filename>[,<line number expression>][,DELETE <line number range>]  (accepts also delete syntax) or: => chainMerge
	  chainMerge: "c s n? *",
	  // CHAIN MERGE <filename>[,<line number expression>][,DELETE <line number range>] / (special)
	  chr$: "f n",
	  // CHR$(<integer expression>)
	  cint: "f n",
	  // CINT(<numeric expression>)
	  clear: "c",
	  // CLEAR  or: => clearInput
	  clearInput: "c",
	  // CLEAR INPUT  (BASIC 1.1)
	  clg: "c n?",
	  // CLG [<ink>]
	  closein: "c",
	  // CLOSEIN
	  closeout: "c",
	  // CLOSEOUT
	  cls: "c #0?",
	  // CLS[#<stream expression>]
	  cont: "c",
	  // CONT
	  copychr$: "f #",
	  // COPYCHR$(#<stream expression>)  (BASIC 1.1)
	  cos: "f n",
	  // COS(<numeric expression>)
	  creal: "f n",
	  // CREAL(<numeric expression>)
	  cursor: "c #0? n0? n?",
	  // CURSOR [<system switch>][,<user switch>] (either parameter can be omitted but not both)  (BASIC 1.1)
	  data: "c n0*",
	  // DATA <list of: constant> (rather 0*, insert dummy null, if necessary)
	  dec$: "f n s",
	  // DEC$(<numeric expression>,<format template>)  (corrected with BASIC 1.1)
	  def: "c s *",
	  // DEF FN[<space>]<function name>[(<formal parameters>)]=<expression> / (not checked from this)
	  defint: "c r r*",
	  // DEFINT <list of: letter range>
	  defreal: "c r r*",
	  // DEFREAL <list of: letter range>
	  defstr: "c r r*",
	  // DEFSTR <list of: letter range>
	  deg: "c",
	  // DEG
	  "delete": "c q0?",
	  // DELETE [<line number range>]
	  derr: "f",
	  // DERR [BASIC 1.1]
	  di: "c",
	  // DI
	  dim: "c v *",
	  // DIM <list of: subscripted variable>
	  draw: "c n n n0? n?",
	  // DRAW <x coordinate>,<y coordinate>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink mode>)
	  drawr: "c n n n0? n?",
	  // DRAWR <x offset>,<y offset>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink mode>)
	  edit: "c l",
	  // EDIT <line number>
	  ei: "c",
	  // EI
	  "else": "c",
	  // see: IF (else belongs to "if", but can also be used as command)
	  end: "c",
	  // END
	  ent: "c n *",
	  // ENT <envelope number>[,<envelope section][,<envelope section>]... (up to 5) / section: <number of steps>,<step size>,<pause time>  or: =<tone period>,<pause time>
	  env: "c n *",
	  // ENV <envelope number>[,<envelope section][,<envelope section>]... (up to 5) / section: <number of steps>,<step size>,<pause time>  or: =<hardware envelope>,<envelope period>
	  eof: "f",
	  // EOF
	  erase: "c v *",
	  // ERASE <list of: variable name>  (array names without indices or dimensions)
	  erl: "f",
	  // ERL
	  err: "f",
	  // ERR
	  error: "c n",
	  // ERROR <integer expression>
	  every: "c",
	  // => everyGosub
	  everyGosub: "c n n?",
	  // EVERY <timer delay>[,<timer number>] GOSUB <line number>  / (special, cannot check optional first n, and line number)
	  exp: "f n",
	  // EXP(<numeric expression>)
	  fill: "c n",
	  // FILL <ink>  (BASIC 1.1)
	  fix: "f n",
	  // FIX(<numeric expression>)
	  fn: "x",
	  // see DEF FN / (FN can also be separate from <function name>)
	  "for": "c",
	  // FOR <simple variable>=<start> TO <end> [STEP <size>]
	  frame: "c",
	  // FRAME
	  fre: "f a",
	  // FRE(<numeric expression>)  or: FRE(<string expression>)
	  gosub: "c l",
	  // GOSUB <line number>
	  "goto": "c l",
	  // GOTO <line number>
	  graphics: "c",
	  // => graphicsPaper or graphicsPen  (BASIC 1.1)
	  graphicsPaper: "x n",
	  // GRAPHICS PAPER <ink>  / (special)  (BASIC 1.1)
	  graphicsPen: "x n0? n?",
	  // GRAPHICS PEN [<ink>][,<background mode>]  / (either of the parameters may be omitted, but not both)  (BASIC 1.1)
	  hex$: "f n n?",
	  // HEX$(<unsigned integer expression>[,<field width>])
	  himem: "f",
	  // HIMEM
	  "if": "c",
	  // IF <logical expression> THEN <option part> [ELSE <option part>]
	  ink: "c n n n?",
	  // INK <ink>,<color>[,<color>]
	  inkey: "f n",
	  // INKEY(<integer expression>)
	  inkey$: "f",
	  // INKEY$
	  inp: "f n",
	  // INP(<port number>)
	  input: "c #0? *",
	  // INPUT[#<stream expression>,][;][<quoted string><separator>]<list of: variable>  / (special: not checked from this)
	  instr: "f a a a?",
	  // INSTR([<start position>,]<searched string>,<searched for string>)  / (cannot check "f n? s s")
	  "int": "f n",
	  // INT(<numeric expression>)
	  joy: "f n",
	  // JOY(<integer expression>)
	  key: "c n s",
	  // KEY <expansion token number>,<string expression>  / or: => keyDef
	  keyDef: "c n n n? n? n?",
	  // KEY DEF <key number>,<repeat>[,<normal>[,<shifted>[,<control>]]]
	  left$: "f s n",
	  // LEFT$(<string expression>,<required length>)
	  len: "f s",
	  // LEN(<string expression>)
	  let: "c",
	  // LET <variable>=<expression>
	  line: "c",
	  // => lineInput / (not checked from this)
	  lineInput: "c #0? *",
	  // INPUT INPUT[#<stream expression>,][;][<quoted string><separator>]<string variable> (not checked from this)
	  list: "c q0? #0?",
	  // LIST [<line number range>][,#<stream expression>] (not checked from this, we cannot check multiple optional args; here we have stream as last parameter)
	  load: "c s n?",
	  // LOAD <filename>[,<address expression>]
	  locate: "c #0? n n",
	  // LOCATE [#<stream expression>,]<x coordinate>,<y coordinate>
	  log: "f n",
	  // LOG(<numeric expression>)
	  log10: "f n",
	  // LOG10(<numeric expression>)
	  lower$: "f s",
	  // LOWER$(<string expression>)
	  mask: "c n0? n?",
	  // MASK [<integer expression>][,<first point setting>]  / (either of the parameters may be omitted, but not both)  (BASIC 1.1)
	  max: "f a *",
	  // MAX(<list of: numeric expression> | <one number of string>)
	  memory: "c n",
	  // MEMORY <address expression>
	  merge: "c s",
	  // MERGE <filename>
	  mid$: "f s n n?",
	  // MID$(<string expression>,<start position>[,<sub-string length>])  / (start position=1..255, sub-string length=0..255)
	  mid$Assign: "f s n n?",
	  // MID$(<string variable>,<insertion point>[,<new string length>])=<new string expression>  / (mid$ as assign)
	  min: "f a *",
	  // MIN(<list of: numeric expression> | <one number of string>)
	  mod: "o",
	  // <argument> MOD <argument>
	  mode: "c n",
	  // MODE <integer expression>
	  move: "c n n n0? n?",
	  // MOVE <x coordinate>,<y coordinate>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink>,<ink mode>)
	  mover: "c n n n0? n?",
	  // MOVER <x offset>,<y offset>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink>,<ink mode>)
	  "new": "c",
	  // NEW
	  next: "c v*",
	  // NEXT [<list of: variable>]
	  not: "o",
	  // NOT <argument>
	  on: "c",
	  // => onBreakCont, on break gosub, on break stop, on error goto, on <ex> gosub, on <ex> goto, on sq(n) gosub
	  onBreakCont: "c",
	  // ON BREAK CONT  / (special)
	  onBreakGosub: "c l",
	  // ON BREAK GOSUB <line number>  / (special)
	  onBreakStop: "c",
	  // ON BREAK STOP  / (special)
	  onErrorGoto: "c l",
	  // ON ERROR GOTO <line number>  / (special)
	  onGosub: "c l l*",
	  // ON <selector> GOSUB <list of: line number>  / (special; n not checked from this)
	  onGoto: "c l l*",
	  // ON <selector> GOTO <list of: line number>  / (special; n not checked from this)
	  onSqGosub: "c l",
	  // ON SQ(<channel>) GOSUB <line number>  / (special)
	  openin: "c s",
	  // OPENIN <filename>
	  openout: "c s",
	  // OPENOUT <filename>
	  or: "o",
	  // <argument> OR <argument>
	  origin: "c n n n? n? n? n?",
	  // ORIGIN <x>,<y>[,<left>,<right>,<top>,<bottom>]
	  out: "c n n",
	  // OUT <port number>,<integer expression>
	  paper: "c #0? n",
	  // PAPER[#<stream expression>,]<ink>
	  peek: "f n",
	  // PEEK(<address expression>)
	  pen: "c #0? n0 n?",
	  // PEN[#<stream expression>,][<ink>][,<background mode>]  / ink=0..15; background mode=0..1 (BASIC 1.1 with <background mode)
	  pi: "f",
	  // PI
	  plot: "c n n n0? n?",
	  // PLOT <x coordinate>,<y coordinate>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink mode>)
	  plotr: "c n n n0? n?",
	  // PLOTR <x offset>,<y offset>[,[<ink>][,<ink mode>]]  (BASIC 1.1 with <ink mode>)
	  poke: "c n n",
	  // POKE <address expression>,<integer expression>
	  pos: "f #",
	  // POS(#<stream expression>)
	  print: "c #0? *",
	  // PRINT[#<stream expression>,][<list of: print items>] ... [;][SPC(<integer expression>)] ... [;][TAB(<integer expression>)] ... [;][USING <format template>][<separator expression>]
	  rad: "c",
	  // RAD
	  randomize: "c n?",
	  // RANDOMIZE [<numeric expression>]
	  read: "c v v*",
	  // READ <list of: variable>
	  release: "c n",
	  // RELEASE <sound channels>  / (sound channels=1..7)
	  rem: "c s?",
	  // REM <rest of line>
	  "'": "c s?",
	  // '<rest of line> (apostrophe comment)
	  remain: "f n",
	  // REMAIN(<timer number>)  / (timer number=0..3)
	  renum: "c n0? n0? n?",
	  // RENUM [<new line number>][,<old line number>][,<increment>]
	  restore: "c l?",
	  // RESTORE [<line number>]
	  resume: "c l?",
	  // RESUME [<line number>]  or: => resumeNext
	  resumeNext: "c",
	  // RESUME NEXT
	  "return": "c",
	  // RETURN
	  right$: "f s n",
	  // RIGHT$(<string expression>,<required length>)
	  rnd: "f n?",
	  // RND[(<numeric expression>)]
	  round: "f n n?",
	  // ROUND(<numeric expression>[,<decimals>])
	  run: "c a?",
	  // RUN <string expression>  or: RUN [<line number>]  / (cannot check "c s | l?")
	  save: "c s a? n? n? n?",
	  // SAVE <filename>[,<file type>][,<binary parameters>]  // <binary parameters>=<start address>,<file tength>[,<entry point>]
	  sgn: "f n",
	  // SGN(<numeric expression>)
	  sin: "f n",
	  // SIN(<numeric expression>)
	  sound: "c n n n? n0? n0? n0? n?",
	  // SOUND <channel status>,<tone period>[,<duration>[,<volume>[,<valume envelope>[,<tone envelope>[,<noise period>]]]]]
	  space$: "f n",
	  // SPACE$(<integer expression>)
	  spc: "f n",
	  // SPC(<integer expression)  / see: PRINT SPC
	  speed: "c",
	  // => speedInk, speedKey, speedWrite
	  speedInk: "c n n",
	  // SPEED INK <period1>,<period2>  / (special)
	  speedKey: "c n n",
	  // SPEED KEY <start delay>,<repeat period>  / (special)
	  speedWrite: "c n",
	  // SPEED WRITE <integer expression>  / (integer expression=0..1)
	  sq: "f n",
	  // SQ(<channel>)  / (channel=1,2 or 4)
	  sqr: "f n",
	  // SQR(<numeric expression>)
	  step: "p",
	  // STEP <size> / see: FOR
	  stop: "c",
	  // STOP
	  str$: "f n",
	  // STR$(<numeric expression>)
	  string$: "f n a",
	  // STRING$(<length>,<character specificier>) / character specificier=string character or number 0..255
	  swap: "p n n?",
	  // => windowSwap
	  symbol: "c n n *",
	  // SYMBOL <character number>,<list of: rows>   or => symbolAfter  / character number=0..255, list of 1..8 rows=0..255
	  symbolAfter: "c n",
	  // SYMBOL AFTER <integer expression>  / integer expression=0..256 (special)
	  tab: "f n",
	  // TAB(<integer expression)  / see: PRINT TAB
	  tag: "c #0?",
	  // TAG[#<stream expression>]
	  tagoff: "c #0?",
	  // TAGOFF[#<stream expression>]
	  tan: "f n",
	  // TAN(<numeric expression>)
	  test: "f n n",
	  // TEST(<x coordinate>,<y coordinate>)
	  testr: "f n n",
	  // TESTR(<x offset>,<y offset>)
	  then: "p",
	  // THEN <option part>  / see: IF
	  time: "f",
	  // TIME
	  to: "p",
	  // TO <end>  / see: FOR
	  troff: "c",
	  // TROFF
	  tron: "c",
	  // TRON
	  unt: "f n",
	  // UNT(<address expression>)
	  upper$: "f s",
	  // UPPER$(<string expression>)
	  using: "p",
	  // USING <format template>[<separator expression>]  / see: PRINT
	  val: "f s",
	  // VAL (<string expression>)
	  vpos: "f #",
	  // VPOS(#<stream expression>)
	  wait: "c n n n?",
	  // WAIT <port number>,<mask>[,<inversion>]
	  wend: "c",
	  // WEND
	  "while": "c n",
	  // WHILE <logical expression>
	  width: "c n",
	  // WIDTH <integer expression>
	  window: "c #0? n n n n",
	  // WINDOW[#<stream expression>,]<left>,<right>,<top>,<bottom>  / or: => windowSwap
	  windowSwap: "c n n?",
	  // WINDOW SWAP <stream expression>[,<stream expression>]  / (special: with numbers, not streams)
	  write: "c #0? *",
	  // WRITE [#<stream expression>,][<write list>]
	  xor: "o",
	  // <argument> XOR <argument>
	  xpos: "f",
	  // XPOS
	  ypos: "f",
	  // YPOS
	  zone: "c n",
	  // ZONE <integer expression>  / integer expression=1..255
	  _rsx1: "c a a*",
	  // |<rsxName>[, <argument list>] dummy with at least one parameter
	  _any1: "x *",
	  // dummy: any number of args
	  _vars1: "x v*"
	  // dummy: any number of variables
	};
	/* eslint-enable no-invalid-this */
	_BasicParser.closeTokensForLine = {
	  "(eol)": 1,
	  "(end)": 1
	};
	_BasicParser.closeTokensForLineAndElse = {
	  "(eol)": 1,
	  "(end)": 1,
	  "else": 1
	};
	_BasicParser.closeTokensForArgs = {
	  ":": 1,
	  "(eol)": 1,
	  "(end)": 1,
	  "else": 1,
	  rem: 1,
	  "'": 1
	};
	_BasicParser.brackets = {
	  "(": ")",
	  "[": "]"
	};
	let BasicParser = _BasicParser;

	class BasicTokenizer {
	  constructor() {
	    this.pos = 0;
	    this.line = 0;
	    // will also be set in decode
	    this.lineEnd = 0;
	    this.input = "";
	    this.needSpace = false;
	    // hmm
	    this.debug = {
	      startPos: 0,
	      line: 0,
	      info: ""
	    };
	    // on sq?
	    /* eslint-disable no-invalid-this */
	    this.tokens = {
	      0: "",
	      // marker for "end of tokenised line"
	      1: ":",
	      // ":" statement seperator
	      2: this.fnIntVar,
	      // integer variable definition (defined with "%" suffix)
	      3: this.fnStringVar,
	      // string variable definition (defined with "$" suffix)
	      4: this.fnFpVar,
	      // floating point variable definition (defined with "!" suffix)
	      5: "var?",
	      6: "var?",
	      7: "var?",
	      // ??
	      8: "var?",
	      // ??
	      9: "var?",
	      // ??
	      10: "var?",
	      // ??
	      11: this.fnVar,
	      // integer variable definition (no suffix)
	      12: this.fnVar,
	      // string variable definition (no suffix)
	      13: this.fnVar,
	      // floating point or no type (no suffix)
	      14: "0",
	      // number constant "0"
	      15: "1",
	      // number constant "1"
	      16: "2",
	      // number constant "2"
	      17: "3",
	      // number constant "3"
	      18: "4",
	      // number constant "4"
	      19: "5",
	      // number constant "5"
	      20: "6",
	      // number constant "6"
	      21: "7",
	      // number constant "7"
	      22: "8",
	      // number constant "8"
	      23: "9",
	      // number constant "9"
	      24: "10",
	      // number constant "10"
	      25: this.fnNum8DecAsStr,
	      // 8-bit integer decimal value
	      26: this.fnNum16DecAsStr,
	      // 16-bit integer decimal value
	      27: this.fnNum16Bin,
	      // 16-bit integer binary value (with "&X" prefix)
	      28: this.fnNum16Hex,
	      // num16Hex: 16-bit integer hexadecimal value (with "&H" or "&" prefix)
	      29: this.fnNum16LineAddrAsStr,
	      // 16-bit BASIC program line memory address pointer
	      30: this.fnNum16DecAsStr,
	      // 16-bit integer BASIC line number
	      31: this.fnNumFp,
	      // floating point value
	      // 0x20-0x21 ASCII printable symbols
	      34: this.fnQuotedString,
	      // '"' quoted string value
	      // 0x23-0x7b ASCII printable symbols
	      124: this.fnRsx,
	      // "|" symbol; prefix for RSX commands
	      128: "AFTER",
	      129: "AUTO",
	      130: "BORDER",
	      131: "CALL",
	      132: "CAT",
	      133: "CHAIN",
	      134: "CLEAR",
	      135: "CLG",
	      136: "CLOSEIN",
	      137: "CLOSEOUT",
	      138: "CLS",
	      139: "CONT",
	      140: "DATA",
	      141: "DEF",
	      142: "DEFINT",
	      143: "DEFREAL",
	      144: "DEFSTR",
	      145: "DEG",
	      146: "DELETE",
	      147: "DIM",
	      148: "DRAW",
	      149: "DRAWR",
	      150: "EDIT",
	      151: "ELSE",
	      // always with 0x01 0x97
	      152: "END",
	      153: "ENT",
	      154: "ENV",
	      155: "ERASE",
	      156: "ERROR",
	      157: "EVERY",
	      158: "FOR",
	      159: "GOSUB",
	      160: "GOTO",
	      161: "IF",
	      162: "INK",
	      163: "INPUT",
	      164: "KEY",
	      165: "LET",
	      166: "LINE",
	      167: "LIST",
	      168: "LOAD",
	      169: "LOCATE",
	      170: "MEMORY",
	      171: "MERGE",
	      172: "MID$",
	      173: "MODE",
	      174: "MOVE",
	      175: "MOVER",
	      176: "NEXT",
	      177: "NEW",
	      178: "ON",
	      179: "ON BREAK",
	      180: "ON ERROR GOTO 0",
	      // (on error goto n > 0 is decoded with separate tokens)
	      181: "ON SQ",
	      182: "OPENIN",
	      183: "OPENOUT",
	      184: "ORIGIN",
	      185: "OUT",
	      186: "PAPER",
	      187: "PEN",
	      188: "PLOT",
	      189: "PLOTR",
	      190: "POKE",
	      191: "PRINT",
	      192: this.fnApostrophe,
	      // "'" symbol (same function as REM keyword); always with 0x01 0xC0
	      193: "RAD",
	      194: "RANDOMIZE",
	      195: "READ",
	      196: "RELEASE",
	      197: this.fnRem,
	      // REM
	      198: "RENUM",
	      199: "RESTORE",
	      200: "RESUME",
	      201: "RETURN",
	      202: "RUN",
	      203: "SAVE",
	      204: "SOUND",
	      205: "SPEED",
	      206: "STOP",
	      207: "SYMBOL",
	      208: "TAG",
	      209: "TAGOFF",
	      210: "TROFF",
	      211: "TRON",
	      212: "WAIT",
	      213: "WEND",
	      214: "WHILE",
	      215: "WIDTH",
	      216: "WINDOW",
	      217: "WRITE",
	      218: "ZONE",
	      219: "DI",
	      220: "EI",
	      221: "FILL",
	      // (v1.1)
	      222: "GRAPHICS",
	      // (v1.1)
	      223: "MASK",
	      // (v1.1)
	      224: "FRAME",
	      // (v1.1)
	      225: "CURSOR",
	      // (v1.1)
	      226: "<unused>",
	      227: "ERL",
	      228: "FN",
	      229: "SPC",
	      230: "STEP",
	      231: "SWAP",
	      232: "<unused>",
	      233: "<unused>",
	      234: "TAB",
	      235: "THEN",
	      236: "TO",
	      237: "USING",
	      238: ">",
	      // (greater than)
	      239: "=",
	      // (equal)
	      240: ">=",
	      // (greater or equal)
	      241: "<",
	      // (less than)
	      242: "<>",
	      // (not equal)
	      243: "<=",
	      // =<, <=, < = (less than or equal)
	      244: "+",
	      // (addition)
	      245: "-",
	      // (subtraction or unary minus)
	      246: "*",
	      // (multiplication)
	      247: "/",
	      // (division)
	      248: "^",
	      // (x to the power of y)
	      249: "\\",
	      // (integer division)
	      250: "AND",
	      251: "MOD",
	      252: "OR",
	      253: "XOR",
	      254: "NOT"
	      // 0xff: (prefix for additional keywords)
	    };
	    /* eslint-enable no-invalid-this */
	    this.tokensFF = {
	      // Functions with one argument
	      0: "ABS",
	      1: "ASC",
	      2: "ATN",
	      3: "CHR$",
	      4: "CINT",
	      5: "COS",
	      6: "CREAL",
	      7: "EXP",
	      8: "FIX",
	      9: "FRE",
	      10: "INKEY",
	      11: "INP",
	      12: "INT",
	      13: "JOY",
	      14: "LEN",
	      15: "LOG",
	      16: "LOG10",
	      17: "LOWER$",
	      18: "PEEK",
	      19: "REMAIN",
	      20: "SGN",
	      21: "SIN",
	      22: "SPACE$",
	      23: "SQ",
	      24: "SQR",
	      25: "STR$",
	      26: "TAN",
	      27: "UNT",
	      28: "UPPER$",
	      29: "VAL",
	      // Functions without arguments
	      64: "EOF",
	      65: "ERR",
	      66: "HIMEM",
	      67: "INKEY$",
	      68: "PI",
	      69: "RND",
	      70: "TIME",
	      71: "XPOS",
	      72: "YPOS",
	      73: "DERR",
	      // (v1.1)
	      // Functions with more arguments
	      113: "BIN$",
	      114: "DEC$",
	      // (v1.1)
	      115: "HEX$",
	      116: "INSTR",
	      117: "LEFT$",
	      118: "MAX",
	      119: "MIN",
	      120: "POS",
	      121: "RIGHT$",
	      122: "ROUND",
	      123: "STRING$",
	      124: "TEST",
	      125: "TESTR",
	      126: "COPYCHR$",
	      // (v1.1)
	      127: "VPOS"
	    };
	  }
	  fnNum8Dec() {
	    const num = this.input.charCodeAt(this.pos);
	    this.pos += 1;
	    return num;
	  }
	  fnNum16Dec() {
	    return this.fnNum8Dec() + this.fnNum8Dec() * 256;
	  }
	  fnNum32Dec() {
	    return this.fnNum16Dec() + this.fnNum16Dec() * 65536;
	  }
	  fnNum8DecAsStr() {
	    return String(this.fnNum8Dec());
	  }
	  fnNum16DecAsStr() {
	    return String(this.fnNum16Dec());
	  }
	  // line number pointer (can occur when loading snapshots)
	  fnNum16LineAddrAsStr() {
	    const prgStart = 368, lineAddr = this.fnNum16Dec() - prgStart, addr = lineAddr + 3, line = this.input.charCodeAt(addr) + this.input.charCodeAt(addr + 1) * 256;
	    return String(line);
	  }
	  fnNum16Bin() {
	    return "&X" + this.fnNum16Dec().toString(2);
	  }
	  fnNum16Hex() {
	    return "&" + this.fnNum16Dec().toString(16).toUpperCase();
	  }
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
	  fnNumFp() {
	    const value = this.fnNum32Dec();
	    let exponent = this.fnNum8Dec(), out;
	    if (!exponent) {
	      out = "0";
	    } else {
	      const mantissa = value >= 0 ? value + 2147483648 : value;
	      exponent -= 129;
	      const num = mantissa * Math.pow(2, exponent - 31);
	      out = Utils.toPrecision9(num);
	    }
	    return out;
	  }
	  fnGetBit7TerminatedString() {
	    const data = this.input;
	    let pos = this.pos;
	    while (data.charCodeAt(pos) <= 127 && pos < this.lineEnd) {
	      pos += 1;
	    }
	    const out = data.substring(this.pos, pos) + String.fromCharCode(data.charCodeAt(pos) & 127);
	    if (pos < this.lineEnd) {
	      this.pos = pos + 1;
	    }
	    return out;
	  }
	  fnVar() {
	    this.fnNum16Dec();
	    return this.fnGetBit7TerminatedString();
	  }
	  fnIntVar() {
	    return this.fnVar() + "%";
	  }
	  fnStringVar() {
	    return this.fnVar() + "$";
	  }
	  fnFpVar() {
	    return this.fnVar() + "!";
	  }
	  fnRsx() {
	    let name = this.fnGetBit7TerminatedString();
	    name = name.substring(1);
	    return "|" + name;
	  }
	  static fnControlsToUnicode(s) {
	    return s.replace(/[\x00-\x1F\x80-\x9F]/g, function(ch) {
	      return String.fromCharCode(ch.charCodeAt(0) + 256);
	    });
	  }
	  fnStringUntilEol() {
	    const out = BasicTokenizer.fnControlsToUnicode(this.input.substring(this.pos, this.lineEnd - 1));
	    this.pos = this.lineEnd;
	    return out;
	  }
	  fnApostrophe() {
	    return "'" + this.fnStringUntilEol();
	  }
	  fnRem() {
	    return "REM" + this.fnStringUntilEol();
	  }
	  fnQuotedString() {
	    const closingQuotes = this.input.indexOf('"', this.pos);
	    let out = "";
	    if (closingQuotes < 0 || closingQuotes >= this.lineEnd) {
	      out = BasicTokenizer.fnControlsToUnicode(this.fnStringUntilEol());
	    } else {
	      out = BasicTokenizer.fnControlsToUnicode(this.input.substring(this.pos, closingQuotes + 1));
	      this.pos = closingQuotes + 1;
	    }
	    out = '"' + out;
	    if (out.indexOf("\r") >= 0) {
	      Utils.console.log("BasicTokenizer line", this.line, ": string contains CR, replaced by CHR$(13)");
	      out = out.replace(/\r/g, '"+chr$(13)+"');
	    }
	    if (/\n\d/.test(out)) {
	      Utils.console.log("BasicTokenizer line", this.line, ": string contains LF<digit>, replaced by CHR$(10)<digit>");
	      out = out.replace(/\n(\d)/g, '"+chr$(10)+"$1');
	    }
	    return out;
	  }
	  debugPrintInfo() {
	    const debug = this.debug;
	    Utils.console.debug("BasicTokenizer Details:\n", debug.info);
	    debug.line = 0;
	    debug.info = "";
	  }
	  debugCollectInfo(tokenLine) {
	    const debug = this.debug, hex = this.input.substring(debug.startPos, this.pos).split("").map(function(s) {
	      return s.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
	    }).join(",");
	    if (this.line !== debug.line) {
	      if (debug.info) {
	        debug.info += "\n";
	      }
	      debug.line = this.line;
	      debug.info += debug.line + ": ";
	    }
	    debug.info += " [" + hex + "] " + tokenLine;
	  }
	  fnParseNextToken(input) {
	    const oldNeedSpace = this.needSpace;
	    let token = this.fnNum8Dec();
	    if (token === 1) {
	      if (this.pos < input.length) {
	        const nextToken = input.charCodeAt(this.pos);
	        if (nextToken === 151 || nextToken === 192) {
	          token = nextToken;
	          this.pos += 1;
	        }
	      }
	    }
	    this.needSpace = token >= 5 && token <= 13 || token === 124;
	    let tokenValue;
	    if (token === 255) {
	      token = this.fnNum8Dec();
	      tokenValue = this.tokensFF[token];
	    } else {
	      tokenValue = this.tokens[token];
	    }
	    let tstr;
	    if (tokenValue !== void 0) {
	      tstr = typeof tokenValue === "function" ? tokenValue.call(this) : tokenValue;
	      if (/[a-zA-Z.]$/.test(tstr) && token !== 228) {
	        this.needSpace = true;
	      }
	    } else {
	      tstr = String.fromCharCode(token);
	    }
	    if (oldNeedSpace) {
	      if (/^[a-zA-Z$%!]/.test(tstr) || token >= 2 && token <= 31) {
	        tstr = " " + tstr;
	      }
	    }
	    if (Utils.debug > 2) {
	      this.debugCollectInfo(tstr);
	    }
	    return tstr;
	  }
	  fnParseLineFragment() {
	    const input = this.input;
	    let out = "";
	    this.needSpace = false;
	    while (this.pos < this.lineEnd) {
	      this.debug.startPos = this.pos;
	      const tstr = this.fnParseNextToken(input);
	      out += tstr;
	    }
	    return out;
	  }
	  fnParseNextLine() {
	    const lineLength = this.fnNum16Dec();
	    if (!lineLength) {
	      return void 0;
	    }
	    this.line = this.fnNum16Dec();
	    this.lineEnd = this.pos - 4 + lineLength;
	    if (this.lineEnd > this.input.length) {
	      this.lineEnd = this.input.length;
	      Utils.console.warn("fnParseNextLine: pos=" + this.pos + ": EOF met!");
	    }
	    return this.line + " " + this.fnParseLineFragment();
	  }
	  fnParseProgram() {
	    let out = "", line;
	    while ((line = this.fnParseNextLine()) !== void 0) {
	      out += line + "\n";
	    }
	    return out;
	  }
	  decodeLineFragment(program, offset, length) {
	    this.input = program;
	    this.pos = offset;
	    this.line = 0;
	    this.lineEnd = this.pos + length;
	    const out = this.fnParseLineFragment();
	    if (Utils.debug > 2) {
	      this.debugPrintInfo();
	    }
	    return out;
	  }
	  decode(program) {
	    this.input = program;
	    this.pos = 0;
	    this.line = 0;
	    const out = this.fnParseProgram();
	    if (Utils.debug > 2) {
	      this.debugPrintInfo();
	    }
	    return out;
	  }
	}

	const _CodeGeneratorBasic = class _CodeGeneratorBasic {
	  // current line (label)
	  constructor(options) {
	    this.hasColons = false;
	    this.keepWhiteSpace = false;
	    this.line = 0;
	    /* eslint-disable no-invalid-this */
	    this.parseFunctions = {
	      // to call methods, use parseFunctions[].call(this,...)
	      "(": this.fnParenthesisOpen,
	      string: _CodeGeneratorBasic.string,
	      ustring: _CodeGeneratorBasic.ustring,
	      assign: this.assign,
	      expnumber: _CodeGeneratorBasic.expnumber,
	      binnumber: _CodeGeneratorBasic.binHexNumber,
	      hexnumber: _CodeGeneratorBasic.binHexNumber,
	      label: this.label,
	      "|": this.vertical,
	      afterGosub: this.afterEveryGosub,
	      chain: this.chainOrChainMerge,
	      chainMerge: this.chainOrChainMerge,
	      data: this.data,
	      def: this.def,
	      "else": this.fnElse,
	      elseComment: this.elseComment,
	      everyGosub: this.afterEveryGosub,
	      fn: this.fn,
	      "for": this.fnFor,
	      "if": this.fnIf,
	      input: this.inputLineInput,
	      lineInput: this.inputLineInput,
	      list: this.list,
	      mid$Assign: this.mid$Assign,
	      onBreakCont: this.onBreakOrError,
	      // 3 parts
	      onBreakGosub: this.onBreakOrError,
	      onBreakStop: this.onBreakOrError,
	      onErrorGoto: this.onBreakOrError,
	      onGosub: this.onGotoGosub,
	      onGoto: this.onGotoGosub,
	      onSqGosub: this.onSqGosub,
	      print: this.print,
	      rem: this.rem,
	      using: this.using,
	      write: this.write
	    };
	    this.options = {
	      quiet: false
	    };
	    this.setOptions(options);
	    this.keywords = options.parser.getKeywords();
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  composeError(error, message, value, pos) {
	    return Utils.composeError("CodeGeneratorBasic", error, message, value, pos, void 0, this.line);
	  }
	  static fnWs(node) {
	    return node.ws || "";
	  }
	  static fnSpace1(value) {
	    return (!value.length || value.startsWith(" ") ? "" : " ") + value;
	  }
	  static getUcKeyword(node) {
	    const type = node.type;
	    return _CodeGeneratorBasic.combinedKeywords[type] || type.toUpperCase();
	  }
	  fnParseArgs(args) {
	    const nodeArgs = [];
	    if (!args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", "", -1);
	    }
	    for (let i = 0; i < args.length; i += 1) {
	      let value = this.parseNode(args[i]);
	      if (args[i].type === "'" || args[i].type === "else" || args[i].type === "elseComment") {
	        if (i > 0 && !nodeArgs[i - 1].endsWith(" ") && !nodeArgs[i - 1].endsWith(":")) {
	          value = _CodeGeneratorBasic.fnSpace1(value);
	        }
	      }
	      nodeArgs.push(value);
	    }
	    return nodeArgs;
	  }
	  combineArgsWithColon(args) {
	    if (!this.hasColons) {
	      for (let i = 1; i < args.length; i += 1) {
	        const arg = args[i].trim();
	        if (!arg.startsWith("ELSE") && !arg.startsWith("'") && arg !== "") {
	          args[i] = ":" + args[i];
	        }
	      }
	    }
	    return args.join("");
	  }
	  fnParenthesisOpen(node) {
	    return _CodeGeneratorBasic.fnWs(node) + node.value + (node.args ? this.fnParseArgs(node.args).join("") : "");
	  }
	  static string(node) {
	    return _CodeGeneratorBasic.fnWs(node) + '"' + node.value + '"';
	  }
	  static ustring(node) {
	    return _CodeGeneratorBasic.fnWs(node) + '"' + node.value;
	  }
	  assign(node) {
	    if (node.left.type !== "identifier") {
	      throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos);
	    }
	    return this.parseNode(node.left) + _CodeGeneratorBasic.fnWs(node) + node.value + this.parseNode(node.right);
	  }
	  static expnumber(node) {
	    return _CodeGeneratorBasic.fnWs(node) + Number(node.value).toExponential().toUpperCase().replace(/(\d+)$/, function(x) {
	      return x.length >= 2 ? x : x.padStart(2, "0");
	    });
	  }
	  static binHexNumber(node) {
	    return _CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase();
	  }
	  label(node) {
	    this.line = Number(node.value);
	    const value = this.combineArgsWithColon(this.fnParseArgs(node.args));
	    return _CodeGeneratorBasic.fnWs(node) + node.value + (node.value !== "" ? _CodeGeneratorBasic.fnSpace1(value) : value);
	  }
	  // special keyword functions
	  vertical(node) {
	    return _CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + this.fnParseArgs(node.args).join("");
	  }
	  afterEveryGosub(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    nodeArgs[0] = _CodeGeneratorBasic.fnSpace1(nodeArgs[0]);
	    nodeArgs[nodeArgs.length - 2] = _CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]);
	    nodeArgs[nodeArgs.length - 1] = _CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]);
	    return _CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + nodeArgs.join("");
	  }
	  chainOrChainMerge(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    if (nodeArgs.length > 2) {
	      if (nodeArgs[nodeArgs.length - 2] === "DELETE") {
	        nodeArgs[nodeArgs.length - 1] = _CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]);
	      }
	    }
	    return _CodeGeneratorBasic.fnWs(node) + _CodeGeneratorBasic.getUcKeyword(node) + (node.right ? _CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) : "") + _CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
	  }
	  data(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      const value2 = nodeArgs[i];
	      nodeArgs[i] = value2;
	    }
	    let args = nodeArgs.join("");
	    if (!this.keepWhiteSpace) {
	      args = Utils.stringTrimEnd(args);
	    }
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + _CodeGeneratorBasic.fnSpace1(args);
	  }
	  def(node) {
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.right ? _CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + this.fnParseArgs(node.args).join("") : "");
	  }
	  elseComment(node) {
	    if (!node.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", "", -1);
	    }
	    const args = node.args;
	    let value = "";
	    for (let i = 0; i < args.length; i += 1) {
	      const token = args[i];
	      if (token.value) {
	        if (this.keepWhiteSpace) {
	          value += _CodeGeneratorBasic.fnWs(token) + token.value;
	        } else {
	          value += _CodeGeneratorBasic.fnSpace1(_CodeGeneratorBasic.fnWs(token) + token.value);
	        }
	      }
	    }
	    return _CodeGeneratorBasic.fnWs(node) + "else".toUpperCase() + value;
	  }
	  fn(node) {
	    if (!node.right) {
	      return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase();
	    }
	    const nodeArgs = node.args ? this.fnParseArgs(node.args) : [];
	    let right = this.parseNode(node.right);
	    if (node.right.pos - node.pos > 2) {
	      right = _CodeGeneratorBasic.fnSpace1(right);
	    }
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + right + nodeArgs.join("");
	  }
	  fnFor(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      if (i !== 1 && i !== 2) {
	        nodeArgs[i] = _CodeGeneratorBasic.fnSpace1(nodeArgs[i]);
	      }
	    }
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + nodeArgs.join("");
	  }
	  fnElse(node) {
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + _CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(this.fnParseArgs(node.args)));
	  }
	  fnIf(node) {
	    const nodeArgs = this.fnParseArgs(node.args), partName = nodeArgs.shift();
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + _CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + _CodeGeneratorBasic.fnSpace1(partName) + _CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(nodeArgs));
	  }
	  inputLineInput(node) {
	    const nodeArgs = node.args ? this.fnParseArgs(node.args) : [], name = node.right ? this.parseNode(node.right) : "";
	    return _CodeGeneratorBasic.fnWs(node) + _CodeGeneratorBasic.getUcKeyword(node) + _CodeGeneratorBasic.fnSpace1(name) + _CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
	  }
	  list(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    if (nodeArgs.length && nodeArgs[0] === "") {
	      nodeArgs.shift();
	    }
	    if (nodeArgs.length && nodeArgs[nodeArgs.length - 1] === "#") {
	      nodeArgs.pop();
	    }
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + _CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
	  }
	  mid$Assign(node) {
	    return _CodeGeneratorBasic.fnWs(node) + _CodeGeneratorBasic.getUcKeyword(node) + this.fnParseArgs(node.args).join("");
	  }
	  onBreakOrError(node) {
	    return _CodeGeneratorBasic.fnWs(node) + "ON" + _CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + _CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join(""));
	  }
	  onGotoGosub(node) {
	    const nodeArgs = this.fnParseArgs(node.args), expression = nodeArgs.shift(), instruction = nodeArgs.shift();
	    return _CodeGeneratorBasic.fnWs(node) + "ON" + _CodeGeneratorBasic.fnSpace1(expression) + _CodeGeneratorBasic.fnSpace1(instruction) + _CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
	  }
	  onSqGosub(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    nodeArgs[nodeArgs.length - 2] = _CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]);
	    nodeArgs[nodeArgs.length - 1] = _CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]);
	    return _CodeGeneratorBasic.fnWs(node) + "ON" + _CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + nodeArgs.join("");
	  }
	  print(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    let value = "";
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      value += nodeArgs[i];
	    }
	    if (node.value !== "?") {
	      value = _CodeGeneratorBasic.fnSpace1(value);
	    }
	    return _CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + value;
	  }
	  rem(node) {
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + this.fnParseArgs(node.args).join("");
	  }
	  using(node) {
	    const nodeArgs = this.fnParseArgs(node.args), template = nodeArgs.length ? nodeArgs.shift() || "" : "";
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + _CodeGeneratorBasic.fnSpace1(template) + nodeArgs.join("");
	  }
	  write(node) {
	    return _CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.args ? _CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join("")) : "");
	  }
	  /* eslint-enable no-invalid-this */
	  fnParseOther(node) {
	    const type = node.type;
	    let value = "";
	    if (node.left) {
	      value += this.parseNode(node.left);
	    }
	    value += _CodeGeneratorBasic.fnWs(node);
	    const keyType = this.keywords[type];
	    if (keyType) {
	      value += _CodeGeneratorBasic.getUcKeyword(node);
	    } else if (node.value) {
	      value += node.value;
	    }
	    let right = "";
	    if (node.right) {
	      right = this.parseNode(node.right);
	      const needSpace1 = this.keywords[right.toLowerCase()] || keyType;
	      value += needSpace1 ? _CodeGeneratorBasic.fnSpace1(right) : right;
	    }
	    if (node.args) {
	      const nodeArgs = this.fnParseArgs(node.args).join(""), needSpace2 = keyType && keyType.charAt(0) !== "f" && node.type !== "'";
	      value += needSpace2 ? _CodeGeneratorBasic.fnSpace1(nodeArgs) : nodeArgs;
	    }
	    return value;
	  }
	  static getLeftOrRightOperatorPrecedence(node) {
	    const precedence = _CodeGeneratorBasic.operatorPrecedence, operators = _CodeGeneratorBasic.operators;
	    let pr;
	    if (operators[node.type] && (node.left || node.right)) {
	      if (node.left) {
	        pr = precedence[node.type] || 0;
	      } else {
	        pr = precedence["p" + node.type] || precedence[node.type] || 0;
	      }
	    }
	    return pr;
	  }
	  parseOperator(node) {
	    const precedence = _CodeGeneratorBasic.operatorPrecedence, operators = _CodeGeneratorBasic.operators;
	    let value;
	    if (node.left) {
	      value = this.parseNode(node.left);
	      const p = precedence[node.type], pl = _CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(node.left);
	      if (pl !== void 0 && pl < p) {
	        value = "(" + value + ")";
	      }
	      const right = node.right;
	      let value2 = this.parseNode(right);
	      const pr = _CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(right);
	      if (pr !== void 0) {
	        if (pr < p) {
	          value2 = "(" + value2 + ")";
	        } else if (pr === p) {
	          const assoc = _CodeGeneratorBasic.operatorAssociativity[node.type];
	          if (assoc === "right") ; else if (assoc === "left") {
	            if (/(^|-|\/|\\|mod|=|<>|<|<=|>|>=)$/.test(node.type)) {
	              value2 = "(" + value2 + ")";
	            }
	          } else {
	            value2 = "(" + value2 + ")";
	          }
	        }
	      }
	      const operator = _CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase();
	      if (/^(and|or|xor|mod)$/.test(node.type)) {
	        value += _CodeGeneratorBasic.fnSpace1(operator) + _CodeGeneratorBasic.fnSpace1(value2);
	      } else {
	        value += operator + value2;
	      }
	    } else if (node.right) {
	      if (node.len === 0) {
	        value = "";
	      } else {
	        const right = node.right;
	        value = this.parseNode(right);
	        let pr;
	        if (right.left) {
	          pr = precedence[right.type] || 0;
	        } else {
	          pr = precedence["p" + right.type] || precedence[right.type] || 0;
	        }
	        const p = precedence["p" + node.type] || precedence[node.type] || 0;
	        if (p && pr && pr < p) {
	          value = "(" + value + ")";
	        }
	        value = _CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase() + (node.type === "not" ? _CodeGeneratorBasic.fnSpace1(value) : value);
	      }
	    } else {
	      value = this.fnParseOther(node);
	    }
	    return value;
	  }
	  parseNode(node) {
	    const type = node.type;
	    if (Utils.debug > 3) {
	      Utils.console.debug("evaluate: parseNode node=%o type=" + type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
	    }
	    let value;
	    if (_CodeGeneratorBasic.operators[type]) {
	      value = this.parseOperator(node);
	    } else if (this.parseFunctions[type]) {
	      value = this.parseFunctions[type].call(this, node);
	    } else {
	      if ((type === "identifier" || type === "letter") && this.options.lowercaseVars) {
	        node.value = node.value.toLowerCase();
	      }
	      value = this.fnParseOther(node);
	    }
	    return value;
	  }
	  evaluate(parseTree) {
	    let output = "";
	    for (let i = 0; i < parseTree.length; i += 1) {
	      if (Utils.debug > 2) {
	        Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
	      }
	      const line = this.parseNode(parseTree[i]);
	      if (line !== void 0 && line !== "") {
	        if (line !== null) {
	          if (output.length === 0) {
	            output = line;
	          } else {
	            output += line;
	          }
	        } else {
	          output = "";
	        }
	      }
	    }
	    return output;
	  }
	  generate(input) {
	    const out = {
	      text: ""
	    };
	    this.hasColons = Boolean(this.options.parser.getOptions().keepColons);
	    this.keepWhiteSpace = Boolean(this.options.lexer.getOptions().keepWhiteSpace);
	    this.keywords = this.options.parser.getKeywords();
	    this.line = 0;
	    try {
	      const tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.evaluate(parseTree);
	      out.text = output;
	    } catch (e) {
	      if (Utils.isCustomError(e)) {
	        out.error = e;
	        if (!this.options.quiet) {
	          Utils.console.warn(e);
	        }
	      } else {
	        out.error = e;
	        Utils.console.error(e);
	      }
	    }
	    return out;
	  }
	};
	_CodeGeneratorBasic.combinedKeywords = {
	  chainMerge: "CHAIN",
	  // "CHAIN MERGE"
	  clearInput: "CLEAR",
	  // "CLEAR INPUT"
	  graphicsPaper: "GRAPHICS",
	  // "GRAPHICS PAPER"
	  graphicsPen: "GRAPHICS",
	  // "GRAPHICS PEN"
	  keyDef: "KEY",
	  // "KEY DEF"
	  lineInput: "LINE",
	  // "LINE INPUT"
	  mid$Assign: "MID$",
	  onBreakCont: "ON",
	  // ""ON BREAK CONT"
	  onBreakGosub: "ON",
	  // ""ON BREAK GOSUB"
	  onBreakStop: "ON",
	  // ""ON BREAK STOP"
	  onErrorGoto: "ON",
	  // "ON ERROR GOTO"
	  resumeNext: "RESUME",
	  // "RESUME NEXT"
	  speedInk: "SPEED",
	  // "SPEED INK"
	  speedKey: "SPEED",
	  // "SPEED KEY"
	  speedWrite: "SPEED",
	  // "SPEED WRITE"
	  symbolAfter: "SYMBOL",
	  // "SYMBOL AFTER"
	  windowSwap: "WINDOW"
	  // "WINDOW SWAP"
	};
	_CodeGeneratorBasic.operators = {
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
	};
	_CodeGeneratorBasic.operatorPrecedence = {
	  "@": 95,
	  // prefix
	  "^": 90,
	  "p-": 80,
	  // prefix - (fast hack)
	  "p+": 80,
	  // prefix + (fast hack)
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
	  not: 23,
	  // prefix
	  and: 22,
	  or: 21,
	  xor: 20,
	  "#": 10
	  // priority?
	};
	_CodeGeneratorBasic.operatorAssociativity = {
	  "^": "right",
	  // right-associative
	  "*": "left",
	  // left-associative (commutative, so parens not needed for equal precedence)
	  "+": "left",
	  // left-associative (commutative, so parens not needed for equal precedence)
	  "/": "left",
	  // left-associative (non-commutative, so parens ARE needed for equal precedence)
	  "\\": "left",
	  // left-associative (non-commutative, so parens ARE needed)
	  mod: "left",
	  // left-associative (non-commutative)
	  "-": "left",
	  // left-associative (non-commutative, so parens ARE needed for equal precedence)
	  "=": "none",
	  // comparison operators are non-associative
	  "<>": "none",
	  "<": "none",
	  "<=": "none",
	  ">": "none",
	  ">=": "none",
	  and: "left",
	  or: "left",
	  xor: "left"
	};
	let CodeGeneratorBasic = _CodeGeneratorBasic;

	const _CodeGeneratorJs = class _CodeGeneratorJs {
	  constructor(options) {
	    this.line = "0";
	    this.stack = {
	      forLabel: [],
	      forVarName: [],
	      whileLabel: []
	    };
	    this.gosubCount = 0;
	    this.ifCount = 0;
	    this.stopCount = 0;
	    this.forCount = 0;
	    // stack needed
	    this.whileCount = 0;
	    // stack needed
	    this.referencedLabelsCount = {};
	    this.dataList = [];
	    // collected data from data lines
	    this.labelList = [];
	    // all labels
	    this.sourceMap = {};
	    this.countMap = {};
	    // for evaluate:
	    this.variables = {};
	    this.defintDefstrTypes = {};
	    /* eslint-disable no-invalid-this */
	    this.allOperators = {
	      // to call methods, use allOperators[].call(this,...)
	      "+": this.plus,
	      "-": this.minus,
	      "*": this.mult,
	      "/": this.div,
	      "\\": this.intDiv,
	      "^": this.exponent,
	      and: this.and,
	      or: this.or,
	      xor: this.xor,
	      not: this.not,
	      mod: this.mod,
	      ">": this.greater,
	      "<": this.less,
	      ">=": this.greaterEqual,
	      "<=": this.lessEqual,
	      "=": this.equal,
	      "<>": this.notEqual,
	      "@": this.addressOf,
	      "#": _CodeGeneratorJs.stream
	    };
	    this.unaryOperators = {
	      // to call methods, use unaryOperators[].call(this,...)
	      "+": this.plus,
	      "-": this.minus,
	      not: this.not,
	      "@": this.addressOf,
	      "#": _CodeGeneratorJs.stream
	    };
	    /* eslint-disable no-invalid-this */
	    this.parseFunctions = {
	      // to call methods, use parseFunctions[].call(this,...)
	      ";": _CodeGeneratorJs.commaOrSemicolon,
	      // ";" for input, line input
	      ",": _CodeGeneratorJs.commaOrSemicolon,
	      // "," for input, line input
	      "|": this.vertical,
	      number: _CodeGeneratorJs.number,
	      expnumber: _CodeGeneratorJs.expnumber,
	      binnumber: _CodeGeneratorJs.binnumber,
	      hexnumber: _CodeGeneratorJs.hexnumber,
	      linenumber: _CodeGeneratorJs.linenumber,
	      identifier: this.identifier,
	      letter: _CodeGeneratorJs.letter,
	      // for defint, defreal, defstr
	      range: this.range,
	      linerange: this.linerange,
	      string: _CodeGeneratorJs.string,
	      ustring: _CodeGeneratorJs.string,
	      // unterminated string the same as string
	      unquoted: _CodeGeneratorJs.unquoted,
	      "null": _CodeGeneratorJs.fnNull,
	      assign: this.assign,
	      label: this.label,
	      // special keyword functions
	      afterGosub: this.afterEveryGosub,
	      call: this.fnCommandWithGoto,
	      chain: this.fnCommandWithGoto,
	      chainMerge: this.fnCommandWithGoto,
	      clear: this.fnCommandWithGoto,
	      // will also do e.g. closeout
	      closeout: this.fnCommandWithGoto,
	      cont: _CodeGeneratorJs.cont,
	      data: this.data,
	      def: this.def,
	      defint: this.fnParseDefIntRealStr,
	      defreal: this.fnParseDefIntRealStr,
	      defstr: this.fnParseDefIntRealStr,
	      dim: this.dim,
	      "delete": this.fnDelete,
	      edit: this.edit,
	      elseComment: this.elseComment,
	      end: this.stopOrEnd,
	      erase: this.erase,
	      error: this.error,
	      everyGosub: this.afterEveryGosub,
	      fn: this.fn,
	      "for": this.fnFor,
	      frame: this.fnCommandWithGoto,
	      gosub: this.gosub,
	      "goto": this.gotoOrResume,
	      "if": this.fnIf,
	      input: this.inputOrlineInput,
	      let: this.let,
	      lineInput: this.inputOrlineInput,
	      list: this.list,
	      load: this.fnCommandWithGoto,
	      merge: this.fnCommandWithGoto,
	      mid$Assign: this.mid$Assign,
	      "new": _CodeGeneratorJs.fnNew,
	      next: this.next,
	      onBreakGosub: this.onBreakGosubOrRestore,
	      onErrorGoto: this.onErrorGoto,
	      onGosub: this.onGosubOnGoto,
	      onGoto: this.onGosubOnGoto,
	      onSqGosub: this.onSqGosub,
	      openin: this.fnCommandWithGoto,
	      print: this.print,
	      randomize: this.randomize,
	      read: this.read,
	      rem: this.rem,
	      "'": this.apostrophe,
	      // apostrophe comment
	      renum: this.fnCommandWithGoto,
	      restore: this.onBreakGosubOrRestore,
	      resume: this.gotoOrResume,
	      resumeNext: this.gotoOrResume,
	      "return": _CodeGeneratorJs.fnReturn,
	      run: this.run,
	      save: this.save,
	      sound: this.fnCommandWithGoto,
	      // maybe queue is full, so insert break
	      spc: this.spc,
	      stop: this.stopOrEnd,
	      tab: this.tab,
	      tron: this.fnCommandWithGoto,
	      // not really needed with goto, but...
	      using: this.usingOrWrite,
	      wend: this.wend,
	      "while": this.fnWhile,
	      write: this.usingOrWrite
	    };
	    this.options = {
	      quiet: false
	    };
	    this.setOptions(options);
	    this.reJsKeywords = _CodeGeneratorJs.createJsKeywordRegex();
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  reset() {
	    const stack = this.stack;
	    stack.forLabel.length = 0;
	    stack.forVarName.length = 0;
	    stack.whileLabel.length = 0;
	    this.line = "0";
	    this.resetCountsPerLine();
	    this.labelList.length = 0;
	    this.dataList.length = 0;
	    this.sourceMap = {};
	    this.referencedLabelsCount = {};
	    this.countMap = {};
	  }
	  resetCountsPerLine() {
	    this.gosubCount = 0;
	    this.ifCount = 0;
	    this.stopCount = 0;
	    this.forCount = 0;
	    this.whileCount = 0;
	  }
	  composeError(error, message, value, pos) {
	    return Utils.composeError("CodeGeneratorJs", error, message, value, pos, void 0, this.line);
	  }
	  static createJsKeywordRegex() {
	    return new RegExp("^(" + _CodeGeneratorJs.jsKeywords.join("|") + ")$");
	  }
	  fnDeclareVariable(name) {
	    if (!this.variables.variableExist(name)) {
	      this.variables.initVariable(name);
	    }
	  }
	  fnAdaptVariableName(node, name, arrayIndices) {
	    const defScopeArgs = this.defScopeArgs;
	    name = name.toLowerCase().replace(/\./g, "_");
	    const firstChar = name.charAt(0);
	    if (defScopeArgs && !defScopeArgs.suppressEscape || !Utils.supportReservedNames) {
	      if (this.reJsKeywords.test(name)) {
	        name = "_" + name;
	      }
	    }
	    const mappedTypeChar = _CodeGeneratorJs.varTypeMap[name.charAt(name.length - 1)] || "";
	    if (mappedTypeChar) {
	      name = name.slice(0, -1);
	      node.pt = name.charAt(name.length - 1);
	    }
	    if (arrayIndices) {
	      name += "A".repeat(arrayIndices);
	    }
	    name += mappedTypeChar;
	    let needDeclare = false;
	    if (defScopeArgs) {
	      if (!defScopeArgs.suppressEscape) {
	        if (name === "o" || name === "t" || name === "v") {
	          name = "N" + name;
	        }
	      }
	      if (!defScopeArgs.collectDone) {
	        defScopeArgs[name] = true;
	      } else if (!(name in defScopeArgs)) {
	        needDeclare = true;
	      }
	    } else {
	      needDeclare = true;
	    }
	    if (needDeclare) {
	      if (mappedTypeChar) {
	        this.fnDeclareVariable(name);
	        name = "v." + name;
	      } else if (!this.defintDefstrTypes[firstChar]) {
	        name += "R";
	        this.fnDeclareVariable(name);
	        name = "v." + name;
	      } else {
	        this.fnDeclareVariable(name + "I");
	        this.fnDeclareVariable(name + "R");
	        this.fnDeclareVariable(name + "$");
	        name = 'v["' + name + '" + t.' + name.charAt(0) + "]";
	      }
	    }
	    return name;
	  }
	  fnParseOneArg(arg) {
	    this.parseNode(arg);
	    return arg.pv;
	  }
	  fnParseArgRange(args, start, stop) {
	    const nodeArgs = [];
	    for (let i = start; i <= stop; i += 1) {
	      nodeArgs.push(this.fnParseOneArg(args[i]));
	    }
	    return nodeArgs;
	  }
	  fnParseArgs(args) {
	    if (!args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", "", -1);
	    }
	    return this.fnParseArgRange(args, 0, args.length - 1);
	  }
	  fnParseArgsIgnoringCommaSemi(args) {
	    const nodeArgs = [];
	    for (let i = 0; i < args.length; i += 1) {
	      if (args[i].type !== "," && args[i].type !== ";") {
	        nodeArgs.push(this.fnParseOneArg(args[i]));
	      }
	    }
	    return nodeArgs;
	  }
	  fnDetermineStaticVarType(name) {
	    return this.variables.determineStaticVarType(name);
	  }
	  static fnExtractVarName(name) {
	    if (name.indexOf("v.") === 0) {
	      name = name.substring(2);
	      const bracketIndex = name.indexOf("[");
	      if (bracketIndex >= 0) {
	        name = name.substring(0, bracketIndex);
	      }
	    }
	    if (name.indexOf('v["') === 0) {
	      name = name.substring(3);
	      const quotesIndex = name.indexOf('"');
	      name = name.substring(0, quotesIndex);
	    }
	    return name;
	  }
	  static fnGetNameTypeExpression(name) {
	    if (name.indexOf("v.") === 0) {
	      name = name.substring(2);
	      const bracketIndex = name.indexOf("[");
	      if (bracketIndex >= 0) {
	        name = name.substring(0, bracketIndex);
	      }
	      name = '"' + name + '"';
	    }
	    if (name.indexOf("v[") === 0) {
	      name = name.substring(2);
	      const closeBracketIndex = name.indexOf("]");
	      name = name.substring(0, closeBracketIndex);
	    }
	    return name;
	  }
	  static fnIsIntConst(a) {
	    const reIntConst = /^[+-]?(\d+|0x[0-9a-f]+|0b[0-1]+)$/;
	    return reIntConst.test(a);
	  }
	  fnGetRoundString(node, err) {
	    if (node.pt !== "I") {
	      node.pv = "o.vmRound(" + node.pv + ")";
	    }
	    return this.options.integerOverflow ? "o.vmInRange16(" + node.pv + ', "' + err + '")' : node.pv;
	  }
	  static fnIsInString(string, find) {
	    return find && string.indexOf(find) >= 0;
	  }
	  fnPropagateStaticTypes(node, left, right, types) {
	    if (left.pt && right.pt) {
	      if (_CodeGeneratorJs.fnIsInString(types, left.pt + right.pt)) {
	        node.pt = left.pt === right.pt ? left.pt : "R";
	      } else {
	        throw this.composeError(Error(), "Type error", node.value, node.pos);
	      }
	    } else if (left.pt && !_CodeGeneratorJs.fnIsInString(types, left.pt) || right.pt && !_CodeGeneratorJs.fnIsInString(types, right.pt)) {
	      throw this.composeError(Error(), "Type error", node.value, node.pos);
	    }
	  }
	  // operators
	  plus(node, left, right) {
	    if (left === void 0) {
	      node.pv = right.pv;
	      const type = right.pt;
	      if (_CodeGeneratorJs.fnIsInString("IR$", type)) {
	        node.pt = type;
	      } else if (type) {
	        throw this.composeError(Error(), "Type error", node.value, node.pos);
	      }
	    } else {
	      node.pv = left.pv + " + " + right.pv;
	      this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
	    }
	  }
	  minus(node, left, right) {
	    if (left === void 0) {
	      const value = right.pv, type = right.pt;
	      if (_CodeGeneratorJs.fnIsIntConst(value) || right.type === "number") {
	        if (value.charAt(0) === "-") {
	          node.pv = value.substring(1);
	        } else {
	          node.pv = "-" + value;
	        }
	      } else {
	        node.pv = "-(" + value + ")";
	      }
	      if (_CodeGeneratorJs.fnIsInString("IR", type)) {
	        node.pt = type;
	      } else if (type) {
	        throw this.composeError(Error(), "Type error", node.value, node.pos);
	      }
	    } else {
	      node.pv = left.pv + " - " + right.pv;
	      this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
	    }
	  }
	  mult(node, left, right) {
	    node.pv = left.pv + " * " + right.pv;
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
	  }
	  div(node, left, right) {
	    node.pv = left.pv + " / " + right.pv;
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
	    node.pt = "R";
	  }
	  intDiv(node, left, right) {
	    node.pv = "(" + this.fnGetRoundString(left, "IDIV") + " / " + this.fnGetRoundString(right, "IDIV") + ") | 0";
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
	    node.pt = "I";
	  }
	  exponent(node, left, right) {
	    node.pv = "Math.pow(" + left.pv + ", " + right.pv + ")";
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
	  }
	  and(node, left, right) {
	    node.pv = this.fnGetRoundString(left, "AND") + " & " + this.fnGetRoundString(right, "AND");
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
	    node.pt = "I";
	  }
	  or(node, left, right) {
	    node.pv = this.fnGetRoundString(left, "OR") + " | " + this.fnGetRoundString(right, "OR");
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
	    node.pt = "I";
	  }
	  xor(node, left, right) {
	    node.pv = this.fnGetRoundString(left, "XOR") + " ^ " + this.fnGetRoundString(right, "XOR");
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
	    node.pt = "I";
	  }
	  not(node, _oLeft, right) {
	    node.pv = "~(" + this.fnGetRoundString(right, "NOT") + ")";
	    node.pt = "I";
	  }
	  mod(node, left, right) {
	    node.pv = this.fnGetRoundString(left, "MOD") + " % " + this.fnGetRoundString(right, "MOD");
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI");
	    node.pt = "I";
	  }
	  greater(node, left, right) {
	    node.pv = left.pv + " > " + right.pv + " ? -1 : 0";
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
	    node.pt = "I";
	  }
	  less(node, left, right) {
	    node.pv = left.pv + " < " + right.pv + " ? -1 : 0";
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
	    node.pt = "I";
	  }
	  greaterEqual(node, left, right) {
	    node.pv = left.pv + " >= " + right.pv + " ? -1 : 0";
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
	    node.pt = "I";
	  }
	  lessEqual(node, left, right) {
	    node.pv = left.pv + " <= " + right.pv + " ? -1 : 0";
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
	    node.pt = "I";
	  }
	  equal(node, left, right) {
	    node.pv = left.pv + " === " + right.pv + " ? -1 : 0";
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
	    node.pt = "I";
	  }
	  notEqual(node, left, right) {
	    node.pv = left.pv + " !== " + right.pv + " ? -1 : 0";
	    this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
	    node.pt = "I";
	  }
	  addressOf(node, _oLeft, right) {
	    if (right.type !== "identifier") {
	      throw this.composeError(Error(), "Expected variable", node.value, node.pos);
	    }
	    const name = _CodeGeneratorJs.fnGetNameTypeExpression(right.pv);
	    node.pv = "o.addressOf(" + name + ")";
	    node.pt = "I";
	  }
	  static stream(node, _oLeft, right) {
	    node.pv = right.pv;
	    node.pt = "I";
	  }
	  /* eslint-enable no-invalid-this */
	  fnParseDefIntRealStr(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      const arg = nodeArgs[i];
	      nodeArgs[i] = "o." + node.type + '("' + arg + '")';
	    }
	    node.pv = nodeArgs.join("; ");
	  }
	  fnAddReferenceLabel(label, node) {
	    if (label in this.referencedLabelsCount) {
	      this.referencedLabelsCount[label] += 1;
	    } else {
	      if (Utils.debug > 1) {
	        Utils.console.debug("fnAddReferenceLabel: line does not (yet) exist:", label);
	      }
	      if (!this.countMap.merge && !this.countMap.chainMerge) {
	        throw this.composeError(Error(), "Line does not exist", label, node.pos);
	      }
	    }
	  }
	  fnGetForLabel() {
	    const label = this.line + "f" + this.forCount;
	    this.forCount += 1;
	    return label;
	  }
	  fnGetGosubLabel() {
	    const label = this.line + "g" + this.gosubCount;
	    this.gosubCount += 1;
	    return label;
	  }
	  fnGetIfLabel() {
	    const label = this.line + "i" + this.ifCount;
	    this.ifCount += 1;
	    return label;
	  }
	  fnGetStopLabel() {
	    const label = this.line + "s" + this.stopCount;
	    this.stopCount += 1;
	    return label;
	  }
	  fnGetWhileLabel() {
	    const label = this.line + "w" + this.whileCount;
	    this.whileCount += 1;
	    return label;
	  }
	  fnCommandWithGoto(node, nodeArgs) {
	    nodeArgs = nodeArgs || this.fnParseArgs(node.args);
	    const label = this.fnGetStopLabel();
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + '); o.vmGoto("' + label + '"); break;\ncase "' + label + '":';
	    return node.pv;
	  }
	  static commaOrSemicolon(node) {
	    node.pv = node.type;
	  }
	  vertical(node) {
	    const rsxName = node.value.substring(1).toLowerCase(), nodeArgs = this.fnParseArgs(node.args), label = this.fnGetStopLabel();
	    nodeArgs.unshift('"' + rsxName + '"');
	    node.pv = "o.callRsx(" + nodeArgs.join(", ") + '); o.vmGoto("' + label + '"); break;\ncase "' + label + '":';
	  }
	  static number(node) {
	    node.pt = /^\d+$/.test(node.value) ? "I" : "R";
	    node.pv = node.value;
	  }
	  static expnumber(node) {
	    node.pt = "R";
	    node.pv = node.value;
	  }
	  static binnumber(node) {
	    let value = node.value.slice(2);
	    if (Utils.supportsBinaryLiterals) {
	      value = "0b" + (value.length ? value : "0");
	    } else {
	      value = "0x" + (value.length ? parseInt(value, 2).toString(16) : "0");
	    }
	    node.pt = "I";
	    node.pv = value;
	  }
	  static hexnumber(node) {
	    let value = node.value.slice(1);
	    if (value.charAt(0).toLowerCase() === "h") {
	      value = value.slice(1);
	    }
	    value || (value = "0");
	    let n = parseInt(value, 16);
	    if (n > 32767) {
	      n = 65536 - n;
	      value = "-0x" + n.toString(16);
	    } else {
	      value = "0x" + value;
	    }
	    node.pt = "I";
	    node.pv = value;
	  }
	  identifier(node) {
	    const nodeArgs = node.args ? this.fnParseArgRange(node.args, 1, node.args.length - 2) : [], name = this.fnAdaptVariableName(node, node.value, nodeArgs.length);
	    let indices = "";
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      const arg = node.args[i + 1], index = arg.pt !== "I" ? "o.vmRound(" + nodeArgs[i] + ")" : nodeArgs[i];
	      indices += "[" + index + "]";
	    }
	    const varType = this.fnDetermineStaticVarType(name);
	    if (varType.length > 1) {
	      node.pt = varType.charAt(1);
	    }
	    node.pv = name + indices;
	  }
	  static letter(node) {
	    node.pv = node.value.toLowerCase();
	  }
	  static linenumber(node) {
	    node.pv = node.value;
	  }
	  range(node) {
	    if (!node.left || !node.right) {
	      throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos);
	    }
	    const left = this.fnParseOneArg(node.left).toLowerCase(), right = this.fnParseOneArg(node.right).toLowerCase();
	    if (left > right) {
	      throw this.composeError(Error(), "Decreasing range", node.value, node.pos);
	    }
	    node.pv = left + '", "' + right;
	  }
	  linerange(node) {
	    if (!node.left || !node.right) {
	      throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos);
	    }
	    const left = this.fnParseOneArg(node.left), right = this.fnParseOneArg(node.right), leftNumber = Number(left), rightNumber = Number(right);
	    if (leftNumber > rightNumber) {
	      throw this.composeError(Error(), "Decreasing line range", node.value, node.pos);
	    }
	    const rightSpecified = right === "undefined" ? "65535" : right;
	    node.pv = !right ? left : left + ", " + rightSpecified;
	  }
	  static string(node) {
	    let value = node.value;
	    value = value.replace(/\\/g, "\\\\");
	    value = Utils.hexEscape(value);
	    node.pt = "$";
	    node.pv = '"' + value + '"';
	  }
	  static unquoted(node) {
	    node.pt = "$";
	    node.pv = node.value;
	  }
	  static fnNull(node) {
	    node.pv = node.value || "undefined";
	  }
	  assign(node) {
	    if (!node.left || !node.right) {
	      throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos);
	    }
	    if (node.left.type !== "identifier") {
	      throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos);
	    }
	    const name = this.fnParseOneArg(node.left), assignValue = this.fnParseOneArg(node.right);
	    this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
	    const varType = this.fnDetermineStaticVarType(name);
	    let value;
	    if (node.pt) {
	      if (node.left.pt === "I" && node.right.pt === "R") {
	        value = "o.vmRound(" + assignValue + ")";
	        node.pt = "I";
	      } else {
	        value = assignValue;
	      }
	    } else {
	      value = 'o.vmAssign("' + varType + '", ' + assignValue + ")";
	    }
	    node.pv = name + " = " + value;
	  }
	  generateTraceLabel(node, tracePrefix, i) {
	    const traceLabel = tracePrefix + (i > 0 ? "t" + i : ""), pos = node.pos, len = node.len || node.value.length || 0;
	    this.sourceMap[traceLabel] = [
	      pos,
	      len
	    ];
	    return traceLabel;
	  }
	  label(node) {
	    const isTraceActive = this.options.trace || Boolean(this.countMap.tron), isResumeNext = Boolean(this.countMap.resumeNext), isResumeNoArgs = Boolean(this.countMap.resumeNoArgsCount);
	    let label = node.value;
	    this.line = label;
	    if (this.countMap.resumeNext) {
	      this.labelList.push(label);
	    }
	    this.resetCountsPerLine();
	    const isDirect = label === "direct";
	    let value = "";
	    if (isDirect) {
	      value = 'o.vmGoto("directEnd"); break;\n';
	      label = '"direct"';
	    }
	    if (!this.options.noCodeFrame) {
	      value += "case " + label + ":";
	      value += " o.line = " + label + ";";
	      if (isTraceActive) {
	        value += " o.vmTrace();";
	      }
	    } else {
	      value = "";
	    }
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      let value2 = nodeArgs[i];
	      if (value2 !== "") {
	        if (isTraceActive || isResumeNext || isResumeNoArgs) {
	          const traceLabel = this.generateTraceLabel(node.args[i], this.line, i);
	          if (i > 0) {
	            if (isResumeNext || isResumeNoArgs) {
	              value += '\ncase "' + traceLabel + '":';
	            }
	            value += ' o.line = "' + traceLabel + '";';
	            if (isResumeNext) {
	              this.labelList.push('"' + traceLabel + '"');
	            }
	          }
	        }
	        if (!/[}:;\n]$/.test(value2)) {
	          value2 += ";";
	        } else if (value2.substring(value2.length - 1) === "\n") {
	          value2 = value2.substring(0, value2.length - 1);
	        }
	        value += " " + value2;
	      }
	    }
	    if (isDirect && !this.options.noCodeFrame) {
	      value += '\n o.vmGoto("end"); break;\ncase "directEnd":';
	    }
	    node.pv = value;
	  }
	  // special keyword functions
	  afterEveryGosub(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    if (!node.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos);
	    }
	    this.fnAddReferenceLabel(nodeArgs[2], node.args[2]);
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
	  }
	  static cont(node) {
	    node.pv = "o." + node.type + "(); break;";
	  }
	  data(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < node.args.length; i += 1) {
	      if (node.args[i].type === "unquoted") {
	        nodeArgs[i] = '"' + nodeArgs[i].replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
	      }
	    }
	    let lineString = String(this.line);
	    if (lineString === "direct") {
	      lineString = '"' + lineString + '"';
	    }
	    nodeArgs.unshift(lineString);
	    this.dataList.push("o.data(" + nodeArgs.join(", ") + ")");
	    node.pv = "/* data */";
	  }
	  def(node) {
	    if (!node.right) {
	      throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos);
	    }
	    const savedValue = node.right.value;
	    node.right.value = "fn" + savedValue;
	    const name = this.fnParseOneArg(node.right);
	    node.right.value = savedValue;
	    const expressionArg = node.args.pop();
	    this.defScopeArgs = {};
	    const nodeArgs = this.fnParseArgs(node.args);
	    this.defScopeArgs.collectDone = true;
	    const expression = this.fnParseOneArg(expressionArg);
	    this.defScopeArgs = void 0;
	    this.fnPropagateStaticTypes(node, node.right, expressionArg, "II RR IR RI $$");
	    let value;
	    if (node.pt) {
	      if (node.right.pt === "I" && expressionArg.pt === "R") {
	        value = "o.vmRound(" + expression + ")";
	        node.pt = "I";
	      } else {
	        value = expression;
	      }
	    } else {
	      const varType = this.fnDetermineStaticVarType(name);
	      value = 'o.vmAssign("' + varType + '", ' + expression + ")";
	    }
	    value = name + " = function (" + nodeArgs.join(", ") + ") { return " + value + "; };";
	    node.pv = value;
	  }
	  dim(node) {
	    const args = [];
	    if (!node.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos);
	    }
	    for (let i = 0; i < node.args.length; i += 1) {
	      const nodeArg = node.args[i];
	      if (nodeArg.type !== "identifier") {
	        throw this.composeError(Error(), "Expected variable in DIM", node.type, node.pos);
	      }
	      if (!nodeArg.args) {
	        throw this.composeError(Error(), "Programming error: Undefined args", nodeArg.type, nodeArg.pos);
	      }
	      const nodeArgs = this.fnParseArgRange(nodeArg.args, 1, nodeArg.args.length - 2), fullExpression = this.fnParseOneArg(nodeArg), name = _CodeGeneratorJs.fnGetNameTypeExpression(fullExpression);
	      nodeArgs.unshift(name);
	      args.push("/* " + fullExpression + " = */ o.dim(" + nodeArgs.join(", ") + ")");
	    }
	    node.pv = args.join("; ");
	  }
	  fnDelete(node) {
	    const nodeArgs = this.fnParseArgs(node.args), name = Utils.supportReservedNames ? "o." + node.type : 'o["' + node.type + '"]';
	    if (!nodeArgs.length) {
	      nodeArgs.push("1");
	      nodeArgs.push("65535");
	    }
	    node.pv = name + "(" + nodeArgs.join(", ") + "); break;";
	  }
	  edit(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break;";
	  }
	  elseComment(node) {
	    if (!node.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", "", -1);
	    }
	    let value = "else";
	    for (let i = 0; i < node.args.length; i += 1) {
	      const token = node.args[i];
	      if (token.value) {
	        value += " " + token.value;
	      }
	    }
	    node.pv = "// " + value + "\n";
	  }
	  erase(node) {
	    this.defScopeArgs = {};
	    this.defScopeArgs.suppressEscape = true;
	    const nodeArgs = this.fnParseArgs(node.args);
	    this.defScopeArgs = void 0;
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      nodeArgs[i] = '"' + nodeArgs[i] + '"';
	    }
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
	  }
	  error(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break";
	  }
	  fn(node) {
	    if (!node.right) {
	      throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos);
	    }
	    const nodeArgs = this.fnParseArgs(node.args), savedValue = node.right.value;
	    node.right.value = "fn" + savedValue;
	    const name = this.fnParseOneArg(node.right);
	    node.right.value = savedValue;
	    if (node.right.pt) {
	      node.pt = node.right.pt;
	    }
	    node.pv = name + "(" + nodeArgs.join(", ") + ")";
	  }
	  static parseIntNumber(numString) {
	    const hasSign = numString[0] === "-", value = hasSign ? -Number(numString.substring(1)) : Number(numString);
	    return value;
	  }
	  // eslint-disable-next-line complexity
	  fnFor(node) {
	    const nodeArgs = this.fnParseArgs(node.args), varName = nodeArgs[0], label = this.fnGetForLabel();
	    this.stack.forLabel.push(label);
	    this.stack.forVarName.push(varName);
	    if (!node.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos);
	    }
	    const startNode = node.args[1], endNode = node.args[2], stepNode = node.args[3];
	    let startValue = nodeArgs[1], endValue = nodeArgs[2], stepValue = stepNode ? nodeArgs[3] : "1";
	    const startIsIntConst = _CodeGeneratorJs.fnIsIntConst(startValue), endIsIntConst = _CodeGeneratorJs.fnIsIntConst(endValue), stepIsIntConst = _CodeGeneratorJs.fnIsIntConst(stepValue), varType = this.fnDetermineStaticVarType(varName), type = varType.length > 1 ? varType.charAt(1) : "";
	    if (type === "$") {
	      throw this.composeError(Error(), "Type error", node.args[0].value, node.args[0].pos);
	    }
	    if (!startIsIntConst) {
	      if (startNode.pt !== "I") {
	        startValue = 'o.vmAssign("' + varType + '", ' + startValue + ")";
	      }
	    }
	    let endName;
	    if (!endIsIntConst) {
	      if (endNode.pt !== "I") {
	        endValue = 'o.vmAssign("' + varType + '", ' + endValue + ")";
	      }
	      endName = _CodeGeneratorJs.fnExtractVarName(varName) + "End";
	      this.fnDeclareVariable(endName);
	      endName = "v." + endName;
	    }
	    if (varName.indexOf("v[") === 0) ;
	    let stepName;
	    if (!stepIsIntConst) {
	      if (stepNode && stepNode.pt !== "I") {
	        stepValue = 'o.vmAssign("' + varType + '", ' + stepValue + ")";
	      }
	      stepName = _CodeGeneratorJs.fnExtractVarName(varName) + "Step";
	      this.fnDeclareVariable(stepName);
	      stepName = "v." + stepName;
	    }
	    let value = "/* for() */";
	    if (type !== "I" && type !== "R") {
	      value += ' o.vmAssertNumberType("' + varType + '");';
	    }
	    value += " " + varName + " = " + startValue + ";";
	    if (!endIsIntConst) {
	      value += " " + endName + " = " + endValue + ";";
	    }
	    if (!stepIsIntConst) {
	      value += " " + stepName + " = " + stepValue + ";";
	    }
	    value += ' o.vmGoto("' + label + 'b"); break;';
	    value += '\ncase "' + label + '": ';
	    value += varName + " += " + (stepIsIntConst ? stepValue : stepName) + ";";
	    value += '\ncase "' + label + 'b": ';
	    const endNameOrValue = endIsIntConst ? endValue : endName;
	    if (stepIsIntConst) {
	      const stepValueAsNum = _CodeGeneratorJs.parseIntNumber(stepValue);
	      if (stepValueAsNum > 0) {
	        value += "if (" + varName + " > " + endNameOrValue + ') { o.vmGoto("' + label + 'e"); break; }';
	      } else if (stepValueAsNum < 0) {
	        value += "if (" + varName + " < " + endNameOrValue + ') { o.vmGoto("' + label + 'e"); break; }';
	      } else {
	        value += "if (" + varName + " === " + endNameOrValue + ') { o.vmGoto("' + label + 'e"); break; }';
	      }
	    } else {
	      value += "if (" + stepName + " > 0 && " + varName + " > " + endNameOrValue + " || " + stepName + " < 0 && " + varName + " < " + endNameOrValue + " || !" + stepName + " && " + varName + " === " + endNameOrValue + ') { o.vmGoto("' + label + 'e"); break; }';
	    }
	    node.pv = value;
	  }
	  gosub(node) {
	    const nodeArgs = this.fnParseArgs(node.args), label = this.fnGetGosubLabel();
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
	    }
	    node.pv = "o." + node.type + '("' + label + '", ' + nodeArgs.join(", ") + '); break;\ncase "' + label + '":';
	  }
	  gotoOrResume(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
	    }
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break";
	  }
	  fnThenOrElsePart(args, tracePrefix) {
	    const isTraceActive = this.options.trace, isResumeNext = Boolean(this.countMap.resumeNext), isResumeNoArgs = Boolean(this.countMap.resumeNoArgsCount), nodeArgs = this.fnParseArgs(args);
	    if (args.length && args[0].type === "linenumber") {
	      const line = nodeArgs[0];
	      this.fnAddReferenceLabel(line, args[0]);
	      nodeArgs[0] = "o.goto(" + line + "); break";
	    }
	    if (isTraceActive || isResumeNext || isResumeNoArgs) {
	      for (let i = 0; i < nodeArgs.length; i += 1) {
	        const traceLabel = this.generateTraceLabel(args[i], tracePrefix, i);
	        let value = "";
	        if (isResumeNext || isResumeNoArgs) {
	          value += '\ncase "' + traceLabel + '":';
	        }
	        if (isResumeNext) {
	          this.labelList.push('"' + traceLabel + '"');
	        }
	        value += ' o.line = "' + traceLabel + '";';
	        nodeArgs[i] = value + " " + nodeArgs[i];
	      }
	    }
	    return nodeArgs.join("; ");
	  }
	  static fnIsSimplePart(part) {
	    const partNoTrailingBreak = part.replace(/; break$/, ""), simplePart = !/case|break/.test(partNoTrailingBreak);
	    return simplePart;
	  }
	  fnIf(node) {
	    if (!node.right) {
	      throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos);
	    }
	    let expression = this.fnParseOneArg(node.right);
	    if (expression.endsWith(" ? -1 : 0")) {
	      expression = expression.replace(/ \? -1 : 0$/, "");
	    }
	    const label = this.fnGetIfLabel(), elseArgs = node.args.length && node.args[node.args.length - 1].type === "else" ? node.args.pop().args : void 0, elsePart = elseArgs ? this.fnThenOrElsePart(elseArgs, label + "E") : "", thenPart = this.fnThenOrElsePart(node.args, label + "T"), simpleThen = _CodeGeneratorJs.fnIsSimplePart(thenPart), simpleElse = elsePart ? _CodeGeneratorJs.fnIsSimplePart(elsePart) : true;
	    let value = "if (" + expression + ") { ";
	    if (simpleThen && simpleElse) {
	      value += thenPart + "; }";
	      if (elsePart) {
	        value += " else { " + elsePart + "; }";
	      }
	    } else {
	      value += 'o.vmGoto("' + label + '"); break; } ';
	      if (elsePart !== "") {
	        value += "/* else */ " + elsePart + "; ";
	      }
	      value += 'o.vmGoto("' + label + 'e"); break;\ncase "' + label + '": ' + thenPart + ';\ncase "' + label + 'e": ';
	    }
	    node.pv = value;
	  }
	  inputOrlineInput(node) {
	    const nodeArgs = this.fnParseArgs(node.args), varTypes = [], label = this.fnGetStopLabel();
	    if (nodeArgs.length < 4) {
	      throw this.composeError(Error(), "Programming error: Not enough parameters", node.type, node.pos);
	    }
	    const stream = nodeArgs[0];
	    let noCRLF = nodeArgs[1];
	    if (noCRLF === ";") {
	      noCRLF = '"' + noCRLF + '"';
	    }
	    let msg = nodeArgs[2];
	    if (!node.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos);
	    }
	    if (node.args[2].type === "null") {
	      msg = '""';
	    }
	    const prompt = nodeArgs[3];
	    if (prompt === ";" || node.args[3].type === "null") {
	      msg = msg.substring(0, msg.length - 1) + "? " + msg.substr(-1, 1);
	    }
	    for (let i = 4; i < nodeArgs.length; i += 1) {
	      varTypes[i - 4] = this.fnDetermineStaticVarType(nodeArgs[i]);
	    }
	    let value = 'o.vmGoto("' + label + '"); break;\ncase "' + label + '":';
	    const label2 = this.fnGetStopLabel();
	    value += "o." + node.type + "(" + stream + ", " + noCRLF + ", " + msg + ', "' + varTypes.join('", "') + '"); o.vmGoto("' + label2 + '"); break;\ncase "' + label2 + '":';
	    for (let i = 4; i < nodeArgs.length; i += 1) {
	      value += "; " + nodeArgs[i] + " = o.vmGetNextInput()";
	    }
	    node.pv = value;
	  }
	  let(node) {
	    if (!node.right) {
	      throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos);
	    }
	    this.assign(node.right);
	    node.pv = node.right.pv;
	    node.pt = node.right.pt;
	  }
	  list(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    if (!node.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos);
	    }
	    if (!node.args.length || node.args[node.args.length - 1].type === "#") {
	      const stream = nodeArgs.pop() || "0";
	      nodeArgs.unshift(stream);
	    }
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break;";
	  }
	  mid$Assign(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    if (nodeArgs.length < 4) {
	      nodeArgs.splice(2, 0, "undefined");
	    }
	    const name = nodeArgs[0], varType = this.fnDetermineStaticVarType(name);
	    node.pv = name + ' = o.vmAssign("' + varType + '", o.mid$Assign(' + nodeArgs.join(", ") + "))";
	  }
	  static fnNew(node) {
	    const name = Utils.supportReservedNames ? "o." + node.type : 'o["' + node.type + '"]';
	    node.pv = name + "();";
	  }
	  next(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    if (!nodeArgs.length) {
	      nodeArgs.push("");
	    }
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      const label = this.stack.forLabel.pop(), varName = this.stack.forVarName.pop();
	      let errorNode;
	      if (label === void 0) {
	        if (nodeArgs[i] === "") {
	          errorNode = node;
	        } else {
	          errorNode = node.args[i];
	        }
	        throw this.composeError(Error(), "Unexpected NEXT", errorNode.type, errorNode.pos);
	      }
	      if (nodeArgs[i] !== "" && nodeArgs[i] !== varName) {
	        errorNode = node.args[i];
	        throw this.composeError(Error(), "Unexpected NEXT variable", errorNode.value, errorNode.pos);
	      }
	      nodeArgs[i] = "/* " + node.type + '("' + nodeArgs[i] + '") */ o.vmGoto("' + label + '"); break;\ncase "' + label + 'e":';
	    }
	    node.pv = nodeArgs.join("; ");
	  }
	  onBreakGosubOrRestore(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
	    }
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
	  }
	  onErrorGoto(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      if (Number(nodeArgs[i])) {
	        this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
	      }
	    }
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
	  }
	  onGosubOnGoto(node) {
	    const nodeArgs = this.fnParseArgs(node.args), label = node.type === "onGosub" ? this.fnGetGosubLabel() : this.fnGetStopLabel();
	    for (let i = 1; i < nodeArgs.length; i += 1) {
	      this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
	    }
	    nodeArgs.unshift('"' + label + '"');
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + '); break;\ncase "' + label + '":';
	  }
	  onSqGosub(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
	    }
	    if (!node.right) {
	      throw this.composeError(Error(), "Programming error: Undefined right", "", -1);
	    }
	    const sqArgs = this.fnParseArgs(node.right.args);
	    nodeArgs.unshift(sqArgs[0]);
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
	  }
	  print(node) {
	    const args = node.args, nodeArgs = [];
	    let newLine = true;
	    for (let i = 0; i < args.length; i += 1) {
	      const arg = args[i];
	      let argString = this.fnParseOneArg(arg);
	      if (i === args.length - 1) {
	        if (arg.type === ";" || arg.type === "," || arg.type === "spc" || arg.type === "tab") {
	          newLine = false;
	        }
	      }
	      if (arg.type === ",") {
	        argString = '{type: "commaTab", args: []}';
	        nodeArgs.push(argString);
	      } else if (arg.type !== ";") {
	        nodeArgs.push(argString);
	      }
	    }
	    if (newLine) {
	      const arg2 = '"\\r\\n"';
	      nodeArgs.push(arg2);
	    }
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
	  }
	  randomize(node) {
	    let value;
	    if (node.args.length) {
	      const nodeArgs = this.fnParseArgs(node.args);
	      value = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
	    } else {
	      const label = this.fnGetStopLabel();
	      value = 'o.vmGoto("' + label + '"); break;\ncase "' + label + '":';
	      value += this.fnCommandWithGoto(node) + " o.randomize(o.vmGetNextInput())";
	    }
	    node.pv = value;
	  }
	  read(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    for (let i = 0; i < nodeArgs.length; i += 1) {
	      const name = nodeArgs[i], varType = this.fnDetermineStaticVarType(name);
	      nodeArgs[i] = name + " = o." + node.type + '("' + varType + '")';
	    }
	    node.pv = nodeArgs.join("; ");
	  }
	  rem(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    node.pv = "//" + nodeArgs.join("") + "\n";
	  }
	  apostrophe(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    if (nodeArgs.length && !nodeArgs[0].startsWith(" ")) {
	      nodeArgs[0] = " " + nodeArgs[0];
	    }
	    node.pv = "//" + nodeArgs.join("") + "\n";
	  }
	  static fnReturn(node) {
	    const name = Utils.supportReservedNames ? "o." + node.type : 'o["' + node.type + '"]';
	    node.pv = name + "(); break;";
	  }
	  run(node) {
	    if (node.args.length) {
	      if (node.args[0].type === "linenumber" || node.args[0].type === "number") {
	        this.fnAddReferenceLabel(this.fnParseOneArg(node.args[0]), node.args[0]);
	      }
	    }
	    node.pv = this.fnCommandWithGoto(node);
	  }
	  save(node) {
	    let nodeArgs = [];
	    if (node.args.length) {
	      const fileName = this.fnParseOneArg(node.args[0]);
	      nodeArgs.push(fileName);
	      if (node.args.length > 1) {
	        this.defScopeArgs = {};
	        const type = '"' + this.fnParseOneArg(node.args[1]) + '"';
	        this.defScopeArgs = void 0;
	        nodeArgs.push(type);
	        const nodeArgs2 = node.args.slice(2), nodeArgs3 = this.fnParseArgs(nodeArgs2);
	        nodeArgs = nodeArgs.concat(nodeArgs3);
	      }
	    }
	    node.pv = this.fnCommandWithGoto(node, nodeArgs);
	  }
	  spc(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    node.pv = '{type: "spc", args: [' + nodeArgs.join(", ") + "]}";
	  }
	  stopOrEnd(node) {
	    const label = this.fnGetStopLabel();
	    node.pv = "o." + node.type + '("' + label + '"); break;\ncase "' + label + '":';
	  }
	  tab(node) {
	    const nodeArgs = this.fnParseArgs(node.args);
	    node.pv = '{type: "tab", args: [' + nodeArgs.join(", ") + "]}";
	  }
	  usingOrWrite(node) {
	    const nodeArgs = this.fnParseArgsIgnoringCommaSemi(node.args);
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
	  }
	  wend(node) {
	    const label = this.stack.whileLabel.pop();
	    if (label === void 0) {
	      throw this.composeError(Error(), "Unexpected WEND", node.type, node.pos);
	    }
	    node.pv = "/* o." + node.type + '() */ o.vmGoto("' + label + '"); break;\ncase "' + label + 'e":';
	  }
	  fnWhile(node) {
	    const nodeArgs = this.fnParseArgs(node.args), label = this.fnGetWhileLabel();
	    this.stack.whileLabel.push(label);
	    node.pv = '\ncase "' + label + '": if (!(' + nodeArgs + ')) { o.vmGoto("' + label + 'e"); break; }';
	  }
	  /* eslint-enable no-invalid-this */
	  fnParseOther(node) {
	    const nodeArgs = this.fnParseArgs(node.args), typeWithSpaces = " " + node.type + " ";
	    node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
	    if (_CodeGeneratorJs.fnIsInString(" asc cint derr eof erl err fix fre inkey inp instr int joy len memory peek pos remain sgn sq test testr unt vpos xpos ypos ", typeWithSpaces)) {
	      node.pt = "I";
	    } else if (_CodeGeneratorJs.fnIsInString(" abs atn cos creal exp log log10 pi rnd round sin sqr tan time val ", typeWithSpaces)) {
	      node.pt = "R";
	    } else if (_CodeGeneratorJs.fnIsInString(" bin$ chr$ copychr$ dec$ hex$ inkey$ left$ lower$ mid$ right$ space$ str$ string$ upper$ ", typeWithSpaces)) {
	      node.pt = "$";
	    }
	    if (node.type === "min" || node.type === "max") {
	      if (node.args.length === 1) {
	        if (node.args[0].type === "$") {
	          node.pt = "$";
	        }
	      } else if (node.args.length > 1) {
	        node.pt = "R";
	      }
	    }
	  }
	  parseOperator(node) {
	    const operators = this.allOperators;
	    if (node.left) {
	      this.parseNode(node.left);
	      if (operators[node.left.type] && node.left.left) {
	        node.left.pv = "(" + node.left.pv + ")";
	      }
	      if (!node.right) {
	        throw this.composeError(Error(), "Programming error: Undefined right", "", -1);
	      }
	      this.parseNode(node.right);
	      if (operators[node.right.type] && node.right.left) {
	        node.right.pv = "(" + node.right.pv + ")";
	      }
	      operators[node.type].call(this, node, node.left, node.right);
	    } else {
	      if (!node.right) {
	        throw this.composeError(Error(), "Programming error: Undefined right", "", -1);
	      }
	      this.parseNode(node.right);
	      this.unaryOperators[node.type].call(this, node, void 0, node.right);
	    }
	  }
	  parseNode(node) {
	    if (Utils.debug > 3) {
	      Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
	    }
	    if (this.allOperators[node.type]) {
	      this.parseOperator(node);
	    } else if (this.parseFunctions[node.type]) {
	      this.parseFunctions[node.type].call(this, node);
	    } else {
	      this.fnParseOther(node);
	    }
	  }
	  static fnCommentUnusedCases(output, labels) {
	    return output.replace(/^case (\d+):/gm, function(all, line) {
	      return labels[line] ? all : "/* " + all + " */";
	    });
	  }
	  fnCheckLabel(node, lastLine) {
	    let label = node.value;
	    if (label === "") {
	      if (this.options.implicitLines) {
	        label = String(lastLine + 1);
	        node.value = label;
	      } else {
	        throw this.composeError(Error(), "Direct command found", label, node.pos);
	      }
	    }
	    const lineNumber = Number(label);
	    if ((lineNumber | 0) !== lineNumber) {
	      throw this.composeError(Error(), "Expected integer line number", label, node.pos);
	    }
	    if (lineNumber < 1 || lineNumber > 65535) {
	      throw this.composeError(Error(), "Line number overflow", label, node.pos);
	    }
	    if (lineNumber <= lastLine) {
	      throw this.composeError(Error(), "Expected increasing line number", label, node.pos);
	    }
	    return label;
	  }
	  fnCreateLabelMap(nodes, labels) {
	    let lastLine = 0;
	    for (let i = 0; i < nodes.length; i += 1) {
	      const node = nodes[i];
	      if (node.type === "label" && node.value !== "direct") {
	        const label = this.fnCheckLabel(node, lastLine);
	        if (label) {
	          labels[label] = 0;
	          lastLine = Number(label);
	        }
	      }
	    }
	  }
	  removeAllDefVarTypes() {
	    const varTypes = this.defintDefstrTypes;
	    for (const name in varTypes) {
	      delete varTypes[name];
	    }
	  }
	  fnSetDefVarTypeRange(type, first, last) {
	    const firstNum = first.charCodeAt(0), lastNum = last.charCodeAt(0);
	    for (let i = firstNum; i <= lastNum; i += 1) {
	      const varChar = String.fromCharCode(i);
	      this.defintDefstrTypes[varChar] = type;
	    }
	  }
	  fnPrecheckDefintDefstr(node) {
	    if (node.args) {
	      const type = node.type === "defint" ? "I" : "$";
	      for (let i = 0; i < node.args.length; i += 1) {
	        const arg = node.args[i];
	        if (arg.type === "letter") {
	          this.defintDefstrTypes[arg.value.toLowerCase()] = type;
	        } else if (arg.type === "range") {
	          if (!arg.left || !arg.right) {
	            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos);
	          }
	          this.fnSetDefVarTypeRange(type, arg.left.value.toLowerCase(), arg.right.value.toLowerCase());
	        }
	      }
	    }
	  }
	  fnPrecheckTree(nodes, countMap) {
	    for (let i = 0; i < nodes.length; i += 1) {
	      const node = nodes[i];
	      countMap[node.type] = (countMap[node.type] || 0) + 1;
	      if (node.type === "defint" || node.type === "defstr") {
	        if (node.args) {
	          this.fnPrecheckDefintDefstr(node);
	        }
	      }
	      if (node.type === "resume" && !(node.args && node.args.length)) {
	        const resumeNoArgs = "resumeNoArgsCount";
	        countMap[resumeNoArgs] = (countMap[resumeNoArgs] || 0) + 1;
	      }
	      if (node.args) {
	        this.fnPrecheckTree(node.args, countMap);
	      }
	    }
	  }
	  //
	  // evaluate
	  //
	  evaluate(parseTree, variables) {
	    this.variables = variables;
	    this.defScopeArgs = void 0;
	    this.fnCreateLabelMap(parseTree, this.referencedLabelsCount);
	    this.removeAllDefVarTypes();
	    this.fnPrecheckTree(parseTree, this.countMap);
	    let output = "";
	    for (let i = 0; i < parseTree.length; i += 1) {
	      if (Utils.debug > 2) {
	        Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
	      }
	      const line = this.fnParseOneArg(parseTree[i]);
	      if (line !== void 0 && line !== "") {
	        if (line !== null) {
	          if (output.length === 0) {
	            output = line;
	          } else {
	            output += "\n" + line;
	          }
	        } else {
	          output = "";
	        }
	      }
	    }
	    if (!this.countMap.merge && !this.countMap.chainMerge && !this.countMap.resumeNext && !this.countMap.resumeNoArgsCount) {
	      output = _CodeGeneratorJs.fnCommentUnusedCases(output, this.referencedLabelsCount);
	    }
	    return output;
	  }
	  static combineData(data) {
	    return data.length ? data.join(";\n") + ";\n" : "";
	  }
	  static combineLabels(data) {
	    return data.length ? "o.vmSetLabels([" + data.join(",") + "]);\n" : "";
	  }
	  getSourceMap() {
	    return this.sourceMap;
	  }
	  debugGetLabelsCount() {
	    return Object.keys(this.referencedLabelsCount).length;
	  }
	  generate(input, variables, allowDirect) {
	    const out = {
	      text: ""
	    };
	    this.reset();
	    try {
	      const tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens);
	      if (allowDirect && parseTree.length) {
	        const lastLine = parseTree[parseTree.length - 1];
	        if (lastLine.type === "label" && lastLine.value === "") {
	          lastLine.value = "direct";
	        }
	      }
	      let output = this.evaluate(parseTree, variables);
	      const combinedData = _CodeGeneratorJs.combineData(this.dataList), combinedLabels = _CodeGeneratorJs.combineLabels(this.labelList);
	      if (!this.options.noCodeFrame) {
	        output = '"use strict"\nvar v=o.vmGetAllVariables();\nvar t=o.vmGetAllVarTypes();\nwhile (o.vmLoopCondition()) {\nswitch (o.line) {\ncase 0:\n' + combinedData + combinedLabels + ' o.vmGoto(o.startLine ? o.startLine : "start"); break;\ncase "start":\n' + output + '\ncase "end": o.line="end"; o.vmStop("end", 90); break;\ndefault: o.error(8); o.vmGoto("end"); break;\n}}\n';
	      } else {
	        output = combinedData + output;
	      }
	      out.text = output;
	    } catch (e) {
	      if (Utils.isCustomError(e)) {
	        out.error = e;
	        if (!this.options.quiet) {
	          Utils.console.warn(e);
	        }
	      } else {
	        out.error = e;
	        Utils.console.error(e);
	      }
	    }
	    return out;
	  }
	};
	// ECMA 3 JS Keywords which must be avoided in dot notation for properties when using IE8
	_CodeGeneratorJs.jsKeywords = [
	  "do",
	  "if",
	  "in",
	  "for",
	  "int",
	  "new",
	  "try",
	  "var",
	  "byte",
	  "case",
	  "char",
	  "else",
	  "enum",
	  "goto",
	  "long",
	  "null",
	  "this",
	  "true",
	  "void",
	  "with",
	  "break",
	  "catch",
	  "class",
	  "const",
	  "false",
	  "final",
	  "float",
	  "short",
	  "super",
	  "throw",
	  "while",
	  "delete",
	  "double",
	  "export",
	  "import",
	  "native",
	  "public",
	  "return",
	  "static",
	  "switch",
	  "throws",
	  "typeof",
	  "boolean",
	  "default",
	  "extends",
	  "finally",
	  "package",
	  "private",
	  "abstract",
	  "continue",
	  "debugger",
	  "function",
	  "volatile",
	  "interface",
	  "protected",
	  "transient",
	  "implements",
	  "instanceof",
	  "synchronized"
	];
	_CodeGeneratorJs.varTypeMap = {
	  "!": "R",
	  "%": "I",
	  $: "$"
	  // or "S"?
	};
	let CodeGeneratorJs = _CodeGeneratorJs;

	const _CodeGeneratorToken = class _CodeGeneratorToken {
	  // current line (label)
	  constructor(options) {
	    this.label = "0";
	    /* eslint-disable no-invalid-this */
	    this.parseFunctions = {
	      // to call methods, use parseFunctions[].call(this,...)
	      args: this.fnArgs,
	      range: this.range,
	      linerange: this.linerange,
	      string: _CodeGeneratorToken.string,
	      ustring: _CodeGeneratorToken.ustring,
	      "(eol)": _CodeGeneratorToken.fnEol,
	      // ignore newline "\n"
	      number: _CodeGeneratorToken.number,
	      expnumber: _CodeGeneratorToken.number,
	      // same handling as for number
	      binnumber: _CodeGeneratorToken.binnumber,
	      hexnumber: _CodeGeneratorToken.hexnumber,
	      identifier: this.identifier,
	      linenumber: _CodeGeneratorToken.linenumber,
	      label: this.fnLabel,
	      "|": this.vertical,
	      "else": this.fnElseOrApostrophe,
	      elseComment: this.elseComment,
	      onBreakCont: this.onBreakContOrGosubOrStop,
	      onBreakGosub: this.onBreakContOrGosubOrStop,
	      onBreakStop: this.onBreakContOrGosubOrStop,
	      onErrorGoto: this.onErrorGoto,
	      onSqGosub: this.onSqGosub,
	      "'": this.fnElseOrApostrophe
	    };
	    this.options = {
	      allowLineFragments: false,
	      // only for testing
	      implicitLines: false,
	      quiet: false
	    };
	    this.setOptions(options);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  composeError(error, message, value, pos) {
	    return Utils.composeError("CodeGeneratorToken", error, message, value, pos, void 0, this.label);
	  }
	  static convUInt8ToString(n) {
	    return String.fromCharCode(n);
	  }
	  static convUInt16ToString(n) {
	    return String.fromCharCode(n & 255) + String.fromCharCode(n >> 8);
	  }
	  static convInt32ToString(n) {
	    return _CodeGeneratorToken.convUInt16ToString(n & 65535) + _CodeGeneratorToken.convUInt16ToString(n >> 16 & 65535);
	  }
	  static token2String(name) {
	    let token = _CodeGeneratorToken.tokens[name], result = "";
	    if (token === void 0) {
	      token = _CodeGeneratorToken.tokensFF[name];
	      if (token === void 0) {
	        Utils.console.error("token2String: Not a token: " + name);
	        return name;
	      }
	      result = _CodeGeneratorToken.convUInt8ToString(255);
	    }
	    return result + _CodeGeneratorToken.convUInt8ToString(token);
	  }
	  static getBit7TerminatedString(s) {
	    return s.substring(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) | 128);
	  }
	  static fnGetWs(node) {
	    return node.ws || "";
	  }
	  fnParseArgs(args) {
	    const nodeArgs = [];
	    if (!args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", "", -1);
	    }
	    for (let i = 0; i < args.length; i += 1) {
	      nodeArgs.push(this.parseNode(args[i]));
	    }
	    return nodeArgs;
	  }
	  fnArgs(node) {
	    return this.fnParseArgs(node.args).join(node.value);
	  }
	  range(node) {
	    return this.parseNode(node.left) + _CodeGeneratorToken.fnGetWs(node) + node.value + this.parseNode(node.right);
	  }
	  linerange(node) {
	    return this.parseNode(node.left) + _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String(node.value) + this.parseNode(node.right);
	  }
	  static string(node) {
	    return _CodeGeneratorToken.fnGetWs(node) + '"' + node.value + '"';
	  }
	  static ustring(node) {
	    return _CodeGeneratorToken.fnGetWs(node) + '"' + node.value;
	  }
	  static fnEol() {
	    return "";
	  }
	  static floatToByteString(number) {
	    let mantissa = 0, exponent = 0, sign = 0;
	    if (number !== 0) {
	      if (number < 0) {
	        sign = 2147483648;
	        number = -number;
	      }
	      exponent = Math.ceil(Math.log(number) / Math.log(2));
	      mantissa = Math.round(number / Math.pow(2, exponent - 32)) & 2147483647;
	      if (mantissa === 0) {
	        exponent += 1;
	      }
	      exponent += 128;
	    }
	    return _CodeGeneratorToken.convInt32ToString(sign + mantissa) + _CodeGeneratorToken.convUInt8ToString(exponent);
	  }
	  static number(node) {
	    const numberString = node.value.toUpperCase(), number = Number(numberString);
	    let result = "";
	    if (number === Math.floor(number)) {
	      if (number >= 0 && number <= 9) {
	        result = _CodeGeneratorToken.token2String(numberString);
	      } else if (number >= 10 && number <= 255) {
	        result = _CodeGeneratorToken.token2String("_dec8") + _CodeGeneratorToken.convUInt8ToString(number);
	      } else if (number >= -32767 && number <= 32767) {
	        result = (number < 0 ? _CodeGeneratorToken.token2String("-") : "") + _CodeGeneratorToken.token2String("_dec16") + _CodeGeneratorToken.convUInt16ToString(number);
	      }
	    }
	    if (result === "") {
	      result = _CodeGeneratorToken.token2String("_float") + _CodeGeneratorToken.floatToByteString(number);
	    }
	    return _CodeGeneratorToken.fnGetWs(node) + result;
	  }
	  static binnumber(node) {
	    const valueString = node.value.slice(2), value = valueString.length ? parseInt(valueString, 2) : 0;
	    return _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String("_bin16") + _CodeGeneratorToken.convUInt16ToString(value);
	  }
	  static hexnumber(node) {
	    let valueString = node.value.slice(1);
	    if (valueString.charAt(0).toLowerCase() === "h") {
	      valueString = valueString.slice(1);
	    }
	    const value = valueString.length ? parseInt(valueString, 16) : 0;
	    return _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String("_hex16") + _CodeGeneratorToken.convUInt16ToString(value);
	  }
	  identifier(node) {
	    let name = node.value, mappedTypeName = _CodeGeneratorToken.varTypeMap[name.charAt(name.length - 1)] || "";
	    if (mappedTypeName) {
	      name = name.slice(0, -1);
	    } else {
	      mappedTypeName = "_anyVar";
	    }
	    const offset = 0;
	    return _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String(mappedTypeName) + _CodeGeneratorToken.convUInt16ToString(offset) + _CodeGeneratorToken.getBit7TerminatedString(name) + (node.args ? this.fnParseArgs(node.args).join("") : "");
	  }
	  static linenumber(node) {
	    return _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String("_line16") + _CodeGeneratorToken.convUInt16ToString(Number(node.value));
	  }
	  fnLabel(node) {
	    if (node.value === "") {
	      if (this.options.implicitLines) {
	        node.value = String(Number(this.label) + 1);
	      } else if (!this.options.allowLineFragments) {
	        throw this.composeError(Error(), "Direct command found", node.value, node.pos);
	      }
	    }
	    this.label = node.value;
	    const line = Number(this.label), nodeArgs = this.fnParseArgs(node.args);
	    let value = nodeArgs.join("");
	    if (node.value !== "") {
	      if (value.charAt(0) === " ") {
	        value = value.substring(1);
	      }
	      value = _CodeGeneratorToken.convUInt16ToString(line) + value + _CodeGeneratorToken.token2String("_eol");
	      value = _CodeGeneratorToken.convUInt16ToString(value.length + 2) + value;
	    }
	    return value;
	  }
	  // special keyword functions
	  vertical(node) {
	    const rsxName = node.value.substring(1).toUpperCase(), nodeArgs = this.fnParseArgs(node.args), offset = 0;
	    return _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String(node.type) + (rsxName.length ? _CodeGeneratorToken.convUInt8ToString(offset) : "") + _CodeGeneratorToken.getBit7TerminatedString(rsxName) + nodeArgs.join("");
	  }
	  fnElseOrApostrophe(node) {
	    return _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String(":") + _CodeGeneratorToken.token2String(node.type) + this.fnParseArgs(node.args).join("");
	  }
	  elseComment(node) {
	    if (!node.args) {
	      throw this.composeError(Error(), "Programming error: Undefined args", "", -1);
	    }
	    const type = "else";
	    let value = _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String(":") + _CodeGeneratorToken.token2String(type);
	    const args = node.args;
	    for (let i = 0; i < args.length; i += 1) {
	      const token = args[i];
	      let value2 = token.value;
	      if (value2) {
	        if (token.type === "linenumber") {
	          value2 = _CodeGeneratorToken.linenumber(token);
	        }
	        value += value2;
	      }
	    }
	    return value;
	  }
	  onBreakContOrGosubOrStop(node) {
	    return _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String("_onBreak") + (node.right && node.right.right ? this.parseNode(node.right.right) : "") + this.fnParseArgs(node.args).join("");
	  }
	  onErrorGoto(node) {
	    if (node.args && node.args.length && node.args[0].value === "0") {
	      return _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String("_onErrorGoto0");
	    }
	    return _CodeGeneratorToken.fnGetWs(node) + _CodeGeneratorToken.token2String("on") + this.parseNode(node.right) + this.fnParseArgs(node.args).join("");
	  }
	  onSqGosub(node) {
	    return _CodeGeneratorToken.token2String("_onSq") + this.fnParseArgs(node.right.args).join("") + this.fnParseArgs(node.args).join("");
	  }
	  /* eslint-enable no-invalid-this */
	  fnParseOther(node) {
	    const type = node.type, isToken = _CodeGeneratorToken.tokens[type] !== void 0 || _CodeGeneratorToken.tokensFF[type] !== void 0;
	    let value = "";
	    if (node.left) {
	      value += this.parseNode(node.left);
	    }
	    value += _CodeGeneratorToken.fnGetWs(node);
	    if (isToken) {
	      value += _CodeGeneratorToken.token2String(type);
	    } else if (node.value) {
	      value += node.value;
	    }
	    if (node.right) {
	      value += this.parseNode(node.right);
	    }
	    if (node.args) {
	      value += this.fnParseArgs(node.args).join("");
	    }
	    return value;
	  }
	  parseNode(node) {
	    if (Utils.debug > 3) {
	      Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
	    }
	    const type = node.type;
	    let value;
	    if (node.len === 0 && type !== "label") {
	      value = "";
	    } else {
	      value = this.parseFunctions[type] ? this.parseFunctions[type].call(this, node) : this.fnParseOther(node);
	    }
	    if (Utils.debug > 2) {
	      Utils.console.debug("parseNode: type='" + type + "', value='" + node.value + "', ws='" + node.ws + "', resultValue='" + value + "'");
	    }
	    return value;
	  }
	  evaluate(parseTree) {
	    let output = "";
	    for (let i = 0; i < parseTree.length; i += 1) {
	      if (Utils.debug > 2) {
	        Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
	      }
	      const node = this.parseNode(parseTree[i]);
	      if (node !== void 0 && node !== "") {
	        if (node !== null) {
	          output += node;
	        } else {
	          output = "";
	        }
	      }
	    }
	    if (this.label) {
	      output += _CodeGeneratorToken.token2String("_eol") + _CodeGeneratorToken.token2String("_eol");
	    }
	    return output;
	  }
	  generate(input) {
	    const out = {
	      text: ""
	    };
	    this.label = "0";
	    try {
	      const tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.evaluate(parseTree);
	      out.text = output;
	    } catch (e) {
	      if (Utils.isCustomError(e)) {
	        out.error = e;
	        if (!this.options.quiet) {
	          Utils.console.warn(e);
	        }
	      } else {
	        out.error = e;
	        Utils.console.error(e);
	      }
	    }
	    return out;
	  }
	};
	_CodeGeneratorToken.tokens = {
	  _eol: 0,
	  // marker for "end of tokenised line"
	  ":": 1,
	  // ":" statement seperator
	  _intVar: 2,
	  // integer variable definition (defined with "%" suffix)  "(A-Z)+%"
	  _stringVar: 3,
	  // string variable definition (defined with "$" suffix)  "(A-Z)+\$"
	  _floatVar: 4,
	  // floating point variable definition (defined with "!" suffix) "(A-Z)+!"
	  // "": 0x05, // "var?"
	  // "": 0x06, // "var?"
	  // "": 0x07, // "var?"
	  // "": 0x08, // "var?"
	  // "": 0x09, // "var?"
	  // "": 0x0a, // "var?"
	  // "": 0x0b, // integer variable definition (no suffix)
	  // "": 0x0c, // string variable definition (no suffix)
	  _anyVar: 13,
	  // floating point or no type (no suffix)
	  0: 14,
	  // number constant "0"
	  1: 15,
	  // number constant "1"
	  2: 16,
	  // number constant "2"
	  3: 17,
	  // number constant "3"
	  4: 18,
	  // number constant "4"
	  5: 19,
	  // number constant "5"
	  6: 20,
	  // number constant "6"
	  7: 21,
	  // number constant "7"
	  8: 22,
	  // number constant "8"
	  9: 23,
	  // number constant "9"
	  10: 24,
	  // number constant "10" (not sure when this is used)
	  _dec8: 25,
	  // 8-bit integer decimal value
	  _dec16: 26,
	  // 16-bit integer decimal value
	  _bin16: 27,
	  // 16-bit integer binary value (with "&X" prefix)
	  _hex16: 28,
	  // num16Hex: 16-bit integer hexadecimal value (with "&H" or "&" prefix)
	  // "": 0x1d, // 16-bit BASIC program line memory address pointer (should not occur)
	  _line16: 30,
	  // 16-bit integer BASIC line number
	  _float: 31,
	  // floating point value
	  // 0x20-0x21 ASCII printable symbols (space, "!")
	  // "": 0x22, // '"' quoted string value
	  // 0x23-0x7b ASCII printable symbols
	  "#": 35,
	  // "#" character (stream)
	  "(": 40,
	  // "(" character
	  ")": 41,
	  // ")" character
	  ",": 44,
	  // "," character
	  "?": 63,
	  // "?" character (print)
	  "@": 64,
	  // "@" character (address of)
	  "[": 91,
	  // "[" character
	  "]": 93,
	  // "]" character
	  "|": 124,
	  // "|" symbol; prefix for RSX commands
	  after: 128,
	  afterGosub: 128,
	  auto: 129,
	  border: 130,
	  call: 131,
	  cat: 132,
	  chain: 133,
	  chainMerge: 133,
	  // 0xab85
	  clear: 134,
	  clearInput: 134,
	  // 0xa386
	  clg: 135,
	  closein: 136,
	  closeout: 137,
	  cls: 138,
	  cont: 139,
	  data: 140,
	  def: 141,
	  defint: 142,
	  defreal: 143,
	  defstr: 144,
	  deg: 145,
	  "delete": 146,
	  dim: 147,
	  draw: 148,
	  drawr: 149,
	  edit: 150,
	  "else": 151,
	  end: 152,
	  ent: 153,
	  env: 154,
	  erase: 155,
	  error: 156,
	  every: 157,
	  everyGosub: 157,
	  "for": 158,
	  gosub: 159,
	  "goto": 160,
	  "if": 161,
	  ink: 162,
	  input: 163,
	  key: 164,
	  keyDef: 164,
	  // 0x8da4
	  let: 165,
	  line: 166,
	  lineInput: 166,
	  // 0xa3a6
	  list: 167,
	  load: 168,
	  locate: 169,
	  memory: 170,
	  merge: 171,
	  mid$: 172,
	  mid$Assign: 172,
	  mode: 173,
	  move: 174,
	  mover: 175,
	  next: 176,
	  "new": 177,
	  on: 178,
	  _onBreak: 179,
	  // onBreakCont, onBreakGosub, onBreakStop
	  _onErrorGoto0: 180,
	  // "on error goto 0" (on error goto n > 0 is decoded with separate tokens)
	  onGosub: 178,
	  onGoto: 178,
	  _onSq: 181,
	  // "on sq" (onSqGosub)
	  openin: 182,
	  openout: 183,
	  origin: 184,
	  out: 185,
	  paper: 186,
	  pen: 187,
	  plot: 188,
	  plotr: 189,
	  poke: 190,
	  print: 191,
	  "'": 192,
	  // apostrophe "'" symbol (same function as REM keyword)
	  rad: 193,
	  randomize: 194,
	  read: 195,
	  release: 196,
	  rem: 197,
	  // rem
	  renum: 198,
	  restore: 199,
	  resume: 200,
	  resumeNext: 200,
	  // 0xb0c8
	  "return": 201,
	  run: 202,
	  save: 203,
	  sound: 204,
	  speedInk: 205,
	  // 0xa2cd
	  speedKey: 205,
	  // 0xa4cd,
	  speedWrite: 205,
	  // 0xd9cd
	  stop: 206,
	  swap: 231,
	  symbol: 207,
	  symbolAfter: 207,
	  // 0x80cf
	  tag: 208,
	  tagoff: 209,
	  troff: 210,
	  tron: 211,
	  wait: 212,
	  wend: 213,
	  "while": 214,
	  width: 215,
	  window: 216,
	  windowSwap: 216,
	  // 0xe7d8
	  write: 217,
	  zone: 218,
	  di: 219,
	  ei: 220,
	  fill: 221,
	  // (v1.1)
	  graphics: 222,
	  // (v1.1)
	  graphicsPaper: 222,
	  // 0xbade
	  graphicsPen: 222,
	  // 0xbbde
	  mask: 223,
	  // (v1.1)
	  frame: 224,
	  // (v1.1)
	  cursor: 225,
	  // (v1.1)
	  // "<unused>":         0xe2,
	  erl: 227,
	  fn: 228,
	  spc: 229,
	  step: 230,
	  // swap: 0xe7, only: windowSwap...
	  // "<unused>":         0xe8,
	  // "<unused>":         0xe9,
	  tab: 234,
	  then: 235,
	  to: 236,
	  using: 237,
	  ">": 238,
	  // (greater than)
	  "=": 239,
	  // (equal)
	  assign: 239,
	  // equal as assign
	  ">=": 240,
	  // (greater or equal)
	  "<": 241,
	  // (less than)
	  "<>": 242,
	  // (not equal)
	  "<=": 243,
	  // =<, <=, < = (less than or equal)
	  "+": 244,
	  // (addition)
	  "-": 245,
	  // (subtraction or unary minus)
	  "*": 246,
	  // (multiplication)
	  "/": 247,
	  // (division)
	  "^": 248,
	  // (x to the power of y)
	  "\\": 249,
	  // (integer division)
	  and: 250,
	  mod: 251,
	  or: 252,
	  xor: 253,
	  not: 254
	  // 0xff: (prefix for additional keywords)
	};
	_CodeGeneratorToken.tokensFF = {
	  // Functions with one argument
	  abs: 0,
	  asc: 1,
	  atn: 2,
	  chr$: 3,
	  cint: 4,
	  cos: 5,
	  creal: 6,
	  exp: 7,
	  fix: 8,
	  fre: 9,
	  inkey: 10,
	  inp: 11,
	  "int": 12,
	  joy: 13,
	  len: 14,
	  log: 15,
	  log10: 16,
	  lower$: 17,
	  peek: 18,
	  remain: 19,
	  sgn: 20,
	  sin: 21,
	  space$: 22,
	  sq: 23,
	  sqr: 24,
	  str$: 25,
	  tan: 26,
	  unt: 27,
	  upper$: 28,
	  val: 29,
	  // Functions without arguments
	  eof: 64,
	  err: 65,
	  himem: 66,
	  inkey$: 67,
	  pi: 68,
	  rnd: 69,
	  time: 70,
	  xpos: 71,
	  ypos: 72,
	  derr: 73,
	  // (v1.1)
	  // Functions with more arguments
	  bin$: 113,
	  dec$: 114,
	  // (v1.1)
	  hex$: 115,
	  instr: 116,
	  left$: 117,
	  max: 118,
	  min: 119,
	  pos: 120,
	  right$: 121,
	  round: 122,
	  string$: 123,
	  test: 124,
	  testr: 125,
	  copychr$: 126,
	  // (v1.1)
	  vpos: 127
	};
	_CodeGeneratorToken.varTypeMap = {
	  "!": "_floatVar",
	  "%": "_intVar",
	  $: "_stringVar"
	};
	let CodeGeneratorToken = _CodeGeneratorToken;

	var ModelPropID = /* @__PURE__ */ ((ModelPropID2) => {
	  ModelPropID2["arrayBounds"] = "arrayBounds";
	  ModelPropID2["autorun"] = "autorun";
	  ModelPropID2["basicVersion"] = "basicVersion";
	  ModelPropID2["bench"] = "bench";
	  ModelPropID2["canvasType"] = "canvasType";
	  ModelPropID2["databaseDirs"] = "databaseDirs";
	  ModelPropID2["database"] = "database";
	  ModelPropID2["debug"] = "debug";
	  ModelPropID2["example"] = "example";
	  ModelPropID2["exampleIndex"] = "exampleIndex";
	  ModelPropID2["implicitLines"] = "implicitLines";
	  ModelPropID2["input"] = "input";
	  ModelPropID2["integerOverflow"] = "integerOverflow";
	  ModelPropID2["kbdLayout"] = "kbdLayout";
	  ModelPropID2["linesOnLoad"] = "linesOnLoad";
	  ModelPropID2["dragElements"] = "dragElements";
	  ModelPropID2["palette"] = "palette";
	  ModelPropID2["prettyBrackets"] = "prettyBrackets";
	  ModelPropID2["prettyColons"] = "prettyColons";
	  ModelPropID2["prettyLowercaseVars"] = "prettyLowercaseVars";
	  ModelPropID2["prettySpace"] = "prettySpace";
	  ModelPropID2["processFileImports"] = "processFileImports";
	  ModelPropID2["random"] = "random";
	  ModelPropID2["selectDataFiles"] = "selectDataFiles";
	  ModelPropID2["showConsoleLog"] = "showConsoleLog";
	  ModelPropID2["showCpc"] = "showCpc";
	  ModelPropID2["showDisass"] = "showDisass";
	  ModelPropID2["showExport"] = "showExport";
	  ModelPropID2["showGallery"] = "showGallery";
	  ModelPropID2["showInput"] = "showInput";
	  ModelPropID2["showInp2"] = "showInp2";
	  ModelPropID2["showKbd"] = "showKbd";
	  ModelPropID2["showKbdSettings"] = "showKbdSettings";
	  ModelPropID2["showMore"] = "showMore";
	  ModelPropID2["showOutput"] = "showOutput";
	  ModelPropID2["showPretty"] = "showPretty";
	  ModelPropID2["showRenum"] = "showRenum";
	  ModelPropID2["showResult"] = "showResult";
	  ModelPropID2["showSettings"] = "showSettings";
	  ModelPropID2["showVariable"] = "showVariable";
	  ModelPropID2["showView"] = "showView";
	  ModelPropID2["sound"] = "sound";
	  ModelPropID2["speed"] = "speed";
	  ModelPropID2["trace"] = "trace";
	  return ModelPropID2;
	})(ModelPropID || {});
	var ViewID = /* @__PURE__ */ ((ViewID2) => {
	  ViewID2["arrayBoundsInput"] = "arrayBoundsInput";
	  ViewID2["autorunInput"] = "autorunInput";
	  ViewID2["basicVersionSelect"] = "basicVersionSelect";
	  ViewID2["canvasTypeSelect"] = "canvasTypeSelect";
	  ViewID2["clearInputButton"] = "clearInputButton";
	  ViewID2["consoleLogArea"] = "consoleLogArea";
	  ViewID2["consoleLogText"] = "consoleLogText";
	  ViewID2["continueButton"] = "continueButton";
	  ViewID2["copyTextButton"] = "copyTextButton";
	  ViewID2["cpcArea"] = "cpcArea";
	  ViewID2["cpcCanvas"] = "cpcCanvas";
	  ViewID2["databaseSelect"] = "databaseSelect";
	  ViewID2["debugInput"] = "debugInput";
	  ViewID2["directorySelect"] = "directorySelect";
	  ViewID2["disassArea"] = "disassArea";
	  ViewID2["disassInput"] = "disassInput";
	  ViewID2["disassText"] = "disassText";
	  ViewID2["downloadButton"] = "downloadButton";
	  ViewID2["dropZone"] = "dropZone";
	  ViewID2["enterButton"] = "enterButton";
	  ViewID2["exampleSelect"] = "exampleSelect";
	  ViewID2["exportArea"] = "exportArea";
	  ViewID2["exportButton"] = "exportButton";
	  ViewID2["exportBase64Input"] = "exportBase64Input";
	  ViewID2["exportDSKInput"] = "exportDSKInput";
	  ViewID2["exportDSKFormatSelect"] = "exportDSKFormatSelect";
	  ViewID2["exportDSKStripEmptyInput"] = "exportDSKStripEmptyInput";
	  ViewID2["exportFileSelect"] = "exportFileSelect";
	  ViewID2["exportTokenizedInput"] = "exportTokenizedInput";
	  ViewID2["fileInput"] = "fileInput";
	  ViewID2["fullscreenButton"] = "fullscreenButton";
	  ViewID2["galleryArea"] = "galleryArea";
	  ViewID2["galleryAreaItems"] = "galleryAreaItems";
	  ViewID2["galleryButton"] = "galleryButton";
	  ViewID2["galleryItem"] = "galleryItem";
	  ViewID2["helpButton"] = "helpButton";
	  ViewID2["implicitLinesInput"] = "implicitLinesInput";
	  ViewID2["inp2Area"] = "inp2Area";
	  ViewID2["inp2Text"] = "inp2Text";
	  ViewID2["inputArea"] = "inputArea";
	  ViewID2["inputText"] = "inputText";
	  ViewID2["integerOverflowInput"] = "integerOverflowInput";
	  ViewID2["kbdAlpha"] = "kbdAlpha";
	  ViewID2["kbdArea"] = "kbdArea";
	  ViewID2["kbdAreaInner"] = "kbdAreaInner";
	  ViewID2["kbdLayoutSelect"] = "kbdLayoutSelect";
	  ViewID2["kbdNum"] = "kbdNum";
	  ViewID2["lineNumberAddButton"] = "lineNumberAddButton";
	  ViewID2["lineNumberRemoveButton"] = "lineNumberRemoveButton";
	  ViewID2["linesOnLoadInput"] = "linesOnLoadInput";
	  ViewID2["mainArea"] = "mainArea";
	  ViewID2["moreArea"] = "moreArea";
	  ViewID2["moreButton"] = "moreButton";
	  ViewID2["dragElementsInput"] = "dragElementsInput";
	  ViewID2["noCanvas"] = "noCanvas";
	  ViewID2["outputArea"] = "outputArea";
	  ViewID2["outputText"] = "outputText";
	  ViewID2["pageBody"] = "pageBody";
	  ViewID2["paletteSelect"] = "paletteSelect";
	  ViewID2["parseButton"] = "parseButton";
	  ViewID2["parseRunButton"] = "parseRunButton";
	  ViewID2["prettyArea"] = "prettyArea";
	  ViewID2["prettyBracketsInput"] = "prettyBracketsInput";
	  ViewID2["prettyButton"] = "prettyButton";
	  ViewID2["prettyColonsInput"] = "prettyColonsInput";
	  ViewID2["prettyLowercaseVarsInput"] = "prettyLowercaseVarsInput";
	  ViewID2["prettyPopoverButton"] = "prettyPopoverButton";
	  ViewID2["prettySpaceInput"] = "prettySpaceInput";
	  ViewID2["redoButton"] = "redoButton";
	  ViewID2["redoButton2"] = "redoButton2";
	  ViewID2["reloadButton"] = "reloadButton";
	  ViewID2["reload2Button"] = "reload2Button";
	  ViewID2["renumArea"] = "renumArea";
	  ViewID2["renumButton"] = "renumButton";
	  ViewID2["renumKeepInput"] = "renumKeepInput";
	  ViewID2["renumNewInput"] = "renumNewInput";
	  ViewID2["renumPopoverButton"] = "renumPopoverButton";
	  ViewID2["renumStartInput"] = "renumStartInput";
	  ViewID2["renumStepInput"] = "renumStepInput";
	  ViewID2["resetButton"] = "resetButton";
	  ViewID2["resultArea"] = "resultArea";
	  ViewID2["resultText"] = "resultText";
	  ViewID2["runButton"] = "runButton";
	  ViewID2["screenshotButton"] = "screenshotButton";
	  ViewID2["screenshotLink"] = "screenshotLink";
	  ViewID2["selectDataFilesInput"] = "selectDataFilesInput";
	  ViewID2["settingsArea"] = "settingsArea";
	  ViewID2["settingsButton"] = "settingsButton";
	  ViewID2["showConsoleLogInput"] = "showConsoleLogInput";
	  ViewID2["showCpcInput"] = "showCpcInput";
	  ViewID2["showDisassInput"] = "showDisassInput";
	  ViewID2["showInp2Input"] = "showInp2Input";
	  ViewID2["showInputInput"] = "showInputInput";
	  ViewID2["showKbdInput"] = "showKbdInput";
	  ViewID2["showOutputInput"] = "showOutputInput";
	  ViewID2["showResultInput"] = "showResultInput";
	  ViewID2["showVariableInput"] = "showVariableInput";
	  ViewID2["soundInput"] = "soundInput";
	  ViewID2["speedInput"] = "speedInput";
	  ViewID2["stopButton"] = "stopButton";
	  ViewID2["traceInput"] = "traceInput";
	  ViewID2["textCanvasDiv"] = "textCanvasDiv";
	  ViewID2["textText"] = "textText";
	  ViewID2["undoButton"] = "undoButton";
	  ViewID2["undoButton2"] = "undoButton2";
	  ViewID2["variableArea"] = "variableArea";
	  ViewID2["varSelect"] = "varSelect";
	  ViewID2["varText"] = "varText";
	  ViewID2["viewArea"] = "viewArea";
	  ViewID2["viewButton"] = "viewButton";
	  ViewID2["window"] = "window";
	  return ViewID2;
	})(ViewID || {});

	class CpcVmRsx {
	  constructor() {
	    this.rsxPermanent = {};
	    this.rsxTemporary = {};
	  }
	  callRsx(vm, name, ...args) {
	    const fn = this.rsxTemporary[name] || this.rsxPermanent[name];
	    if (fn) {
	      fn.apply(vm, args);
	    }
	    return Boolean(fn);
	  }
	  registerRsx(rsxModule, permanent) {
	    const rsxRegister = permanent ? this.rsxPermanent : this.rsxTemporary, rsxCommands = rsxModule.getRsxCommands();
	    for (const command in rsxCommands) {
	      if (rsxCommands.hasOwnProperty(command)) {
	        rsxRegister[command] = rsxCommands[command];
	      }
	    }
	  }
	  resetRsx() {
	    this.rsxTemporary = {};
	  }
	}

	const _CpcVm = class _CpcVm {
	  constructor(options) {
	    this.quiet = false;
	    // file handling
	    this.inkeyTimeMs = 0;
	    // next time of frame fly (if >0, next time when inkey$ can be checked without inserting "waitFrame")
	    this.gosubStack = [];
	    // stack of line numbers for gosub/return
	    this.maxGosubStackLength = 83;
	    // array for BASIC data lines (continuous)
	    this.dataIndex = 0;
	    // current index
	    this.dataLineIndex = {
	      // line number index for the data line buffer
	      0: 0
	      // for line 0: index 0
	    };
	    // for resume next
	    this.sourceMap = {};
	    this.crtcReg = 0;
	    this.printControlBuf = "";
	    this.startTime = 0;
	    this.lastRnd = 0;
	    // last random number
	    this.nextFrameTime = 0;
	    this.initialStop = 5;
	    this.stopCount = 0;
	    this.line = 0;
	    this.startLine = 0;
	    this.errorGotoLine = 0;
	    this.errorResumeLine = 0;
	    this.breakGosubLine = 0;
	    this.breakResumeLine = 0;
	    this.outBuffer = "";
	    this.errorCode = 0;
	    // last error code (Err)
	    this.errorLine = 0;
	    // line of last error (Erl)
	    this.degFlag = false;
	    // degree or radians
	    this.tronFlag1 = false;
	    // trace flag
	    this.ramSelect = 0;
	    this.screenPage = 3;
	    // 16K screen page, 3=0xc000..0xffff
	    this.minCharHimem = _CpcVm.maxHimem;
	    this.maxCharHimem = _CpcVm.maxHimem;
	    this.himemValue = _CpcVm.maxHimem;
	    this.minCustomChar = 256;
	    this.timerPriority = -1;
	    // priority of running task: -1=low (min priority to start new timers)
	    this.zoneValue = 13;
	    // print tab zone value
	    this.modeValue = -1;
	    this.progEnd = _CpcVm.progStart + 3;
	    // initially 370
	    this.rsx = new CpcVmRsx();
	    /* eslint-disable no-invalid-this */
	    this.vmInternal = {
	      getTimerList: this.vmTestGetTimerList,
	      getWindowDataList: this.vmTestGetWindowDataList,
	      commaTab: this.commaTab,
	      spc: this.spc,
	      tab: this.tab
	    };
	    this.fnOpeninHandler = this.vmOpeninCallback.bind(this);
	    this.fnCloseinHandler = this.vmCloseinCallback.bind(this);
	    this.fnCloseoutHandler = this.vmCloseoutCallback.bind(this);
	    this.fnLoadHandler = this.vmLoadCallback.bind(this);
	    this.fnRunHandler = this.vmRunCallback.bind(this);
	    this.fnOnCanvasClickHandler = this.onCanvasClickCallback.bind(this);
	    this.fnInputCallbackHandler = this.vmInputCallback.bind(this);
	    this.fnLineInputCallbackHandler = this.vmLineInputCallback.bind(this);
	    this.fnRandomizeCallbackHandler = this.vmRandomizeCallback.bind(this);
	    this.options = {};
	    this.setOptions(options);
	    this.canvas = this.setCanvas(options.canvas);
	    this.keyboard = options.keyboard;
	    this.random = options.random;
	    this.soundClass = options.sound;
	    this.variables = options.variables;
	    this.quiet = Boolean(options.quiet);
	    this.onClickKey = options.onClickKey;
	    this.stopCount = this.initialStop;
	    this.stopEntry = {
	      reason: "",
	      // stop reason
	      priority: 0,
	      // stop priority (higher number means higher priority which can overwrite lower priority)
	      paras: {}
	    };
	    this.inputValues = [];
	    this.inFile = {
	      open: false,
	      command: "",
	      name: "",
	      line: 0,
	      start: void 0,
	      fileData: [],
	      fnFileCallback: void 0,
	      first: 0,
	      last: 0,
	      memorizedExample: ""
	    };
	    this.outFile = {
	      open: false,
	      command: "",
	      name: "",
	      line: 0,
	      start: 0,
	      fileData: [],
	      fnFileCallback: void 0,
	      stream: 0,
	      typeString: "",
	      length: 0,
	      entry: 0
	    };
	    this.gosubStack = [];
	    this.mem = [];
	    this.dataList = [];
	    this.labelList = [];
	    this.windowDataList = [];
	    for (let i = 0; i < _CpcVm.streamCount; i += 1) {
	      this.windowDataList[i] = {};
	    }
	    this.timerList = [];
	    for (let i = 0; i < _CpcVm.timerCount; i += 1) {
	      this.timerList[i] = {};
	    }
	    this.soundData = [];
	    this.sqTimer = [];
	    for (let i = 0; i < _CpcVm.sqTimerCount; i += 1) {
	      this.sqTimer[i] = {};
	    }
	    this.crtcData = [];
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  vmReset() {
	    this.startTime = Date.now();
	    this.vmResetRandom();
	    this.nextFrameTime = Date.now() + _CpcVm.frameTimeMs;
	    this.stopCount = this.initialStop;
	    this.line = 0;
	    this.startLine = 0;
	    this.errorGotoLine = 0;
	    this.errorResumeLine = 0;
	    this.breakGosubLine = 0;
	    this.breakResumeLine = 0;
	    this.inputValues.length = 0;
	    this.vmResetInFileHandling();
	    this.vmResetControlBuffer();
	    this.outBuffer = "";
	    this.vmStop("", 0, true);
	    this.vmResetData();
	    this.errorCode = 0;
	    this.errorLine = 0;
	    this.gosubStack.length = 0;
	    this.degFlag = false;
	    this.tronFlag1 = false;
	    this.screenPage = 3;
	    this.crtcReg = 0;
	    this.crtcData.length = 0;
	    this.vmResetMemory();
	    this.symbolAfter(240);
	    this.vmResetTimers();
	    this.timerPriority = -1;
	    this.zoneValue = 13;
	    this.defreal("a", "z");
	    this.vmResetPenPaperWindowData();
	    this.mode(1);
	    this.canvas.reset();
	    this.keyboard.reset();
	    this.soundClass.reset();
	    this.soundData.length = 0;
	    this.inkeyTimeMs = 0;
	    this.rsx.resetRsx();
	  }
	  vmResetMemory() {
	    this.mem.length = 0;
	    this.ramSelect = 0;
	    this.minCharHimem = _CpcVm.maxHimem;
	    this.maxCharHimem = _CpcVm.maxHimem;
	    this.himemValue = _CpcVm.maxHimem;
	    this.minCustomChar = 256;
	    this.progEnd = _CpcVm.progStart + 3;
	  }
	  vmResetRandom() {
	    this.random.init();
	    this.lastRnd = 0;
	  }
	  vmResetTimers() {
	    const data = {
	      line: 0,
	      // gosub line when timer expires
	      repeat: false,
	      // flag if timer is repeating (every) or one time (after)
	      intervalMs: 0,
	      // interval or timeout
	      active: false,
	      // flag if timer is active
	      nextTimeMs: 0,
	      // next expiration time
	      handlerRunning: false,
	      // flag if handler (subroutine) is running
	      stackIndexReturn: 0,
	      // index in gosub stack with return, if handler is running
	      savedPriority: 0
	      // priority befora calling the handler
	    }, timer = this.timerList, sqTimer = this.sqTimer;
	    for (let i = 0; i < _CpcVm.timerCount; i += 1) {
	      Object.assign(timer[i], data);
	    }
	    for (let i = 0; i < _CpcVm.sqTimerCount; i += 1) {
	      Object.assign(sqTimer[i], data);
	    }
	  }
	  vmResetPenPaperWindowData() {
	    const penPaperData = {
	      pen: 1,
	      paper: 0
	    }, windowDataList = this.windowDataList;
	    for (let i = 0; i < windowDataList.length - 2; i += 1) {
	      Object.assign(windowDataList[i], penPaperData);
	    }
	  }
	  vmResetWindowData(resetPenPaper) {
	    if (resetPenPaper) {
	      this.vmResetPenPaperWindowData();
	    }
	    const data = {
	      pos: 0,
	      // current text position in line
	      vpos: 0,
	      textEnabled: true,
	      // text enabled
	      tag: false,
	      // tag=text at graphics
	      transparent: false,
	      // transparent mode
	      cursorOn: false,
	      // system switch
	      cursorEnabled: true
	      // user switch
	    }, printData = {
	      pos: 0,
	      vpos: 0,
	      right: 132
	      // override
	    }, cassetteData = {
	      pos: 0,
	      vpos: 0,
	      right: 255
	      // override
	    }, winData = _CpcVm.winData[this.modeValue], windowDataList = this.windowDataList, modeDataPens = _CpcVm.modeData[this.modeValue].pens;
	    for (let i = 0; i < windowDataList.length - 2; i += 1) {
	      const modeWinData = Object.assign(windowDataList[i], winData, data);
	      modeWinData.pen %= modeDataPens;
	      modeWinData.paper %= modeDataPens;
	    }
	    Object.assign(windowDataList[8], winData, printData);
	    Object.assign(windowDataList[9], winData, cassetteData);
	  }
	  vmResetControlBuffer() {
	    this.printControlBuf = "";
	  }
	  static vmResetFileHandling(file) {
	    file.open = false;
	    file.command = "";
	    file.name = "";
	    file.line = 0;
	    file.start = void 0;
	    file.fileData.length = 0;
	  }
	  vmResetInFileHandling() {
	    const inFile = this.inFile;
	    _CpcVm.vmResetFileHandling(inFile);
	    inFile.first = 0;
	    inFile.last = 0;
	  }
	  vmResetOutFileHandling() {
	    const outFile = this.outFile;
	    _CpcVm.vmResetFileHandling(outFile);
	    outFile.stream = 0;
	    outFile.typeString = "";
	    outFile.length = 0;
	    outFile.entry = 0;
	  }
	  vmResetData() {
	    this.dataList.length = 0;
	    this.dataIndex = 0;
	    this.dataLineIndex = {
	      // line number index for the data line buffer
	      0: 0
	      // for line 0: index 0
	    };
	  }
	  vmResetInks() {
	    this.canvas.setDefaultInks();
	    this.canvas.setSpeedInk(10, 10);
	  }
	  vmReset4Run() {
	    const stream = 0;
	    this.clearInput();
	    this.closein();
	    this.closeout();
	    this.cursor(stream, 0);
	    this.labelList.length = 0;
	    this.gosubStack.length = 0;
	    this.restore();
	    this.errorGotoLine = 0;
	    this.errorResumeLine = 0;
	    this.soundClass.resetQueue();
	    this.soundData.length = 0;
	    this.canvas.setGColMode(0);
	  }
	  vmPutProgramInMem(tokens) {
	    const addr = _CpcVm.progStart + 1, tokensLen = addr + tokens.length > 65535 ? 65535 - addr : tokens.length;
	    this.progEnd = addr + tokensLen;
	    for (let i = 0; i < tokensLen; i += 1) {
	      let code = _CpcVm.vmGetCharCodeAt(tokens, i);
	      if (code > 255) {
	        Utils.console.warn("Put token in memory: addr=" + (addr + i) + ", code=" + code + ", char=" + tokens.charAt(i));
	        code = 32;
	      }
	      this.poke(addr + i, code);
	    }
	    if (tokensLen < tokens.length) {
	      if (!this.quiet) {
	        Utils.console.warn("vmPutProgramInMem: program too large (" + tokens.length + "), truncated by", tokens.length - tokensLen, "to fit in memory");
	      }
	    }
	    return tokensLen;
	  }
	  setCanvas(canvas) {
	    this.canvas = canvas;
	    if (this.canvas) {
	      this.canvas.setOptions({
	        onCanvasClick: this.fnOnCanvasClickHandler
	      });
	    }
	    return canvas;
	  }
	  vmGetLoadHandler() {
	    return this.fnLoadHandler;
	  }
	  vmGetMem() {
	    return this.mem;
	  }
	  onCanvasClickCallback(event, x, y, xTxt, yTxt) {
	    const height = 400;
	    let char = -1;
	    x -= this.canvas.getXOrigin();
	    y = height - 1 - (y + this.canvas.getYOrigin());
	    if (this.canvas.getXpos() === 1e3 && this.canvas.getYpos() === 1e3) {
	      this.canvas.move(x, y);
	    }
	    if (this.onClickKey) {
	      for (let stream = 0; stream < _CpcVm.streamCount - 2; stream += 1) {
	        const win = this.windowDataList[stream];
	        char = this.canvas.readChar(xTxt, yTxt, win.pen, win.paper);
	        if (char > 0 && char !== 32) {
	          break;
	        }
	      }
	      if ((char < 0 || char === 32 || char === 143) && event.detail === 2) {
	        char = 13;
	      }
	      if (char >= 0) {
	        this.onClickKey(String.fromCharCode(char));
	      }
	    }
	    if (Utils.debug > 0) {
	      Utils.console.debug("onCanvasClickCallback: x", x, "y", y, "xTxt", xTxt, "yTxt", yTxt, "char", char);
	    }
	  }
	  vmRegisterRsx(rsxModule, permanent) {
	    this.rsx.registerRsx(rsxModule, permanent);
	  }
	  vmGetAllVariables() {
	    return this.variables.getAllVariables();
	  }
	  vmGetAllVarTypes() {
	    return this.variables.getAllVarTypes();
	  }
	  vmGetVariableByIndex(index) {
	    return this.variables.getVariableByIndex(index);
	  }
	  vmSetStartLine(line) {
	    this.startLine = line;
	  }
	  vmSetLabels(labels) {
	    this.labelList.length = 0;
	    Object.assign(this.labelList, labels);
	  }
	  vmOnBreakContSet() {
	    return this.breakGosubLine < 0;
	  }
	  vmOnBreakHandlerActive() {
	    return Boolean(this.breakResumeLine);
	  }
	  vmEscape() {
	    let stop = true;
	    if (this.breakGosubLine > 0) {
	      if (!this.breakResumeLine) {
	        this.breakResumeLine = Number(this.line);
	        this.vmGosub(this.line, this.breakGosubLine);
	      }
	      stop = false;
	    } else if (this.breakGosubLine < 0) {
	      stop = false;
	    }
	    return stop;
	  }
	  vmAssertNumber(n, err) {
	    if (typeof n !== "number") {
	      throw this.vmComposeError(Error(), 13, err + " " + n);
	    }
	  }
	  vmAssertString(s, err) {
	    if (typeof s !== "string") {
	      throw this.vmComposeError(Error(), 13, err + " " + s);
	    }
	  }
	  vmAssertInRange(n, min, max, err) {
	    this.vmAssertNumber(n, err);
	    if (n < min || n > max) {
	      if (!this.quiet) {
	        Utils.console.warn("vmAssertInRange: number not in range:", min + "<=" + n + "<=" + max);
	      }
	      throw this.vmComposeError(Error(), 5, err + " " + n);
	    }
	    return n;
	  }
	  // round number (-2^31..2^31) to integer; throw error if no number
	  vmRound(n, err) {
	    this.vmAssertNumber(n, err || "?");
	    return n >= 0 ? n + 0.5 | 0 : n - 0.5 | 0;
	  }
	  vmInRangeRound(n, min, max, err) {
	    n = this.vmRound(n, err);
	    if (n < min || n > max) {
	      if (!this.quiet) {
	        Utils.console.warn("vmInRangeRound: number not in range:", min + "<=" + n + "<=" + max);
	      }
	      throw this.vmComposeError(Error(), n < -32768 || n > 32767 ? 6 : 5, err + " " + n);
	    }
	    return n;
	  }
	  vmInRange16(n, err) {
	    const min = -32768, max = 32767;
	    if (n < min || n > max) {
	      if (!this.quiet) {
	        Utils.console.warn("vmInRange16: number not in range:", min + "<=" + n + "<=" + max);
	      }
	      throw this.vmComposeError(Error(), n < min || n > max ? 6 : 5, err + " " + n);
	    }
	    return n;
	  }
	  vmLineInRange(n, err) {
	    const min = 1, max = 65535, num2 = this.vmRound(n, err);
	    if (n !== num2) {
	      throw this.vmComposeError(Error(), 23, err + " " + n);
	    }
	    if (n < min || n > max) {
	      if (!this.quiet) {
	        Utils.console.warn("vmLineInRange: number not in range:", min + "<=" + n + "<=" + max);
	      }
	      throw this.vmComposeError(Error(), 5, err + " " + n);
	    }
	    return n;
	  }
	  vmRound2Complement(n, err) {
	    n = this.vmInRangeRound(n, -32768, 65535, err);
	    if (n < 0) {
	      n += 65536;
	    }
	    return n;
	  }
	  vmGetLetterCode(s, err) {
	    this.vmAssertString(s, err);
	    s = s.toLowerCase();
	    if (s.length !== 1 || s < "a" || s > "z") {
	      throw this.vmComposeError(Error(), 2, err + " " + s);
	    }
	    return s.charCodeAt(0);
	  }
	  vmDetermineVarType(varType) {
	    return varType.length > 1 ? varType.charAt(1) : this.variables.getVarType(varType.charAt(0));
	  }
	  vmAssertNumberType(varType) {
	    const type = this.vmDetermineVarType(varType);
	    if (type !== "I" && type !== "R") {
	      throw this.vmComposeError(Error(), 13, "type " + type);
	    }
	  }
	  // format a value for assignment to a variable with type determined from varType
	  vmAssign(varType, value) {
	    const type = this.vmDetermineVarType(varType);
	    if (type === "R") {
	      this.vmAssertNumber(value, "=");
	    } else if (type === "I") {
	      value = this.vmRound(value, "=");
	    } else if (type === "$") {
	      if (typeof value !== "string") {
	        if (!this.quiet) {
	          Utils.console.warn("vmAssign: expected string but got:", value);
	        }
	        throw this.vmComposeError(Error(), 13, "type " + type + "=" + value);
	      }
	    }
	    return value;
	  }
	  vmGoto(line, _msg) {
	    this.line = line;
	  }
	  fnCheckSqTimer() {
	    let timerExpired = false;
	    if (this.timerPriority < 2) {
	      for (let i = 0; i < _CpcVm.sqTimerCount; i += 1) {
	        const timer = this.sqTimer[i];
	        if (timer.active && !timer.handlerRunning && this.soundClass.sq(i) & 7) {
	          this.vmGosub(this.line, timer.line);
	          timer.handlerRunning = true;
	          timer.stackIndexReturn = this.gosubStack.length;
	          timer.repeat = false;
	          timerExpired = true;
	          break;
	        }
	      }
	    }
	    return timerExpired;
	  }
	  vmCheckTimer(time) {
	    let timerExpired = false;
	    for (let i = _CpcVm.timerCount - 1; i > this.timerPriority; i -= 1) {
	      const timer = this.timerList[i];
	      if (timer.active && !timer.handlerRunning && time > timer.nextTimeMs) {
	        this.vmGosub(this.line, timer.line);
	        timer.handlerRunning = true;
	        timer.stackIndexReturn = this.gosubStack.length;
	        timer.savedPriority = this.timerPriority;
	        this.timerPriority = i;
	        if (!timer.repeat) {
	          timer.active = false;
	        } else {
	          const delta = time - timer.nextTimeMs;
	          timer.nextTimeMs += timer.intervalMs * Math.ceil(delta / timer.intervalMs);
	        }
	        timerExpired = true;
	        break;
	      } else if (i === 2) {
	        if (this.fnCheckSqTimer()) {
	          break;
	        }
	      }
	    }
	    return timerExpired;
	  }
	  vmCheckTimerHandlers() {
	    for (let i = _CpcVm.timerCount - 1; i >= 0; i -= 1) {
	      const timer = this.timerList[i];
	      if (timer.handlerRunning) {
	        if (timer.stackIndexReturn > this.gosubStack.length) {
	          timer.handlerRunning = false;
	          this.timerPriority = timer.savedPriority;
	          timer.stackIndexReturn = 0;
	        }
	      }
	    }
	  }
	  vmCheckSqTimerHandlers() {
	    let timerReloaded = false;
	    for (let i = _CpcVm.sqTimerCount - 1; i >= 0; i -= 1) {
	      const timer = this.sqTimer[i];
	      if (timer.handlerRunning) {
	        if (timer.stackIndexReturn > this.gosubStack.length) {
	          timer.handlerRunning = false;
	          this.timerPriority = timer.savedPriority;
	          timer.stackIndexReturn = 0;
	          if (!timer.repeat) {
	            timer.active = false;
	          } else {
	            timerReloaded = true;
	          }
	        }
	      }
	    }
	    return timerReloaded;
	  }
	  vmCheckNextFrame(time) {
	    if (time >= this.nextFrameTime) {
	      const delta = time - this.nextFrameTime;
	      if (delta > _CpcVm.frameTimeMs) {
	        this.nextFrameTime += _CpcVm.frameTimeMs * Math.ceil(delta / _CpcVm.frameTimeMs);
	      } else {
	        this.nextFrameTime += _CpcVm.frameTimeMs;
	      }
	      this.canvas.updateSpeedInk();
	      this.vmCheckTimer(time);
	      this.soundClass.scheduler();
	    }
	  }
	  vmGetTimeUntilFrame(time) {
	    time = time || Date.now();
	    return this.nextFrameTime - time;
	  }
	  vmLoopCondition() {
	    const time = Date.now();
	    if (time >= this.nextFrameTime) {
	      this.vmCheckNextFrame(time);
	      this.stopCount -= 1;
	      if (this.stopCount <= 0) {
	        this.stopCount = this.initialStop;
	        this.vmStop("timer", 20);
	      }
	    }
	    return this.stopEntry.reason === "";
	  }
	  vmDefineVarTypes(type, err, first, last) {
	    const firstNum = this.vmGetLetterCode(first, err), lastNum = last ? this.vmGetLetterCode(last, err) : firstNum;
	    for (let i = firstNum; i <= lastNum; i += 1) {
	      const varChar = String.fromCharCode(i);
	      this.variables.setVarType(varChar, type);
	    }
	  }
	  vmStop(reason, priority, force, paras) {
	    const defaultPriority = _CpcVm.stopPriority[reason];
	    if (defaultPriority === void 0) {
	      Utils.console.warn("Programming error: vmStop: Unknown reason:", reason);
	    }
	    priority = priority || 0;
	    if (priority !== 0) {
	      priority = defaultPriority;
	    }
	    if (force || priority >= this.stopEntry.priority) {
	      this.stopEntry.priority = priority;
	      this.stopEntry.reason = reason;
	      this.stopEntry.paras = paras || _CpcVm.emptyParas;
	    }
	  }
	  vmNotImplemented(name) {
	    if (Utils.debug > 0) {
	      Utils.console.debug("Not implemented:", name);
	    }
	  }
	  vmUsingStringFormat(format, arg) {
	    const padChar = " ", re1 = /^\\ *\\$/;
	    let str;
	    if (format === "&") {
	      str = arg;
	    } else if (format === "!") {
	      str = arg.charAt(0);
	    } else if (re1.test(format)) {
	      const padLen = format.length - arg.length, pad = padLen > 0 ? padChar.repeat(padLen) : "";
	      str = arg + pad;
	    } else {
	      throw this.vmComposeError(Error(), 13, "USING format " + format);
	    }
	    return str;
	  }
	  // not fully implemented
	  vmUsingNumberFormat(format, arg) {
	    const padChar = " ", re1 = /^\\ *\\$/;
	    let str;
	    if (format === "&" || format === "!" || re1.test(format)) {
	      throw this.vmComposeError(Error(), 13, "USING format " + format);
	    }
	    if (format.indexOf(".") < 0) {
	      str = arg.toFixed(0);
	    } else {
	      const formatParts = format.split(".", 2), decimals = formatParts[1].length;
	      arg = Number(Math.round(Number(arg + "e" + decimals)) + "e-" + decimals);
	      str = arg.toFixed(decimals);
	    }
	    if (format.indexOf(",") >= 0) {
	      str = Utils.numberWithCommas(str);
	    }
	    const padLen = format.length - str.length, pad = padLen > 0 ? padChar.repeat(padLen) : "";
	    str = pad + str;
	    if (str.length > format.length) {
	      str = "%" + str;
	    }
	    return str;
	  }
	  vmUsingFormat(format, arg) {
	    return typeof arg === "string" ? this.vmUsingStringFormat(format, arg) : this.vmUsingNumberFormat(format, arg);
	  }
	  vmGetStopObject() {
	    return this.stopEntry;
	  }
	  vmGetInFileObject() {
	    return this.inFile;
	  }
	  vmGetKeyboard() {
	    return this.keyboard;
	  }
	  vmGetOutFileObject() {
	    return this.outFile;
	  }
	  vmAdaptFilename(name, err) {
	    this.vmAssertString(name, err);
	    name = name.replace(/ /g, "");
	    if (name[0] === "!") {
	      name = name.substring(1);
	    }
	    const index = name.indexOf(":");
	    if (index >= 0) {
	      name = name.substring(index + 1);
	    }
	    if (name.endsWith(".")) {
	      name = name.substring(0, name.length - 1);
	    }
	    name = name.toLowerCase();
	    if (!name) {
	      throw this.vmComposeError(Error(), 32, "Bad filename: " + name);
	    }
	    return name;
	  }
	  vmGetSoundData() {
	    return this.soundData;
	  }
	  vmSetSourceMap(sourceMap) {
	    this.sourceMap = sourceMap;
	  }
	  vmTrace() {
	    if (this.tronFlag1) {
	      const stream = 0;
	      this.print(stream, "[" + String(this.line) + "]");
	    }
	  }
	  vmGetOutBuffer() {
	    return this.outBuffer;
	  }
	  vmPrint2OutBuffer(s) {
	    this.outBuffer += _CpcVm.vmWithControlCodes(s);
	  }
	  vmDrawMovePlot(type, gPen, gColMode) {
	    if (gPen !== void 0) {
	      gPen = this.vmInRangeRound(gPen, 0, 15, type);
	      this.canvas.setGPen(gPen);
	    }
	    if (gColMode !== void 0) {
	      gColMode = this.vmInRangeRound(gColMode, 0, 3, type);
	      this.canvas.setGColMode(gColMode);
	    }
	  }
	  vmAfterEveryGosub(type, interval, timer, line) {
	    interval = this.vmInRangeRound(interval, 0, 32767, type);
	    timer = this.vmInRangeRound(timer || 0, 0, 3, type);
	    line = this.vmLineInRange(line, type + " GOSUB");
	    const timerEntry = this.timerList[timer];
	    if (interval) {
	      const intervalMs = interval * _CpcVm.frameTimeMs;
	      timerEntry.intervalMs = intervalMs;
	      timerEntry.line = line;
	      timerEntry.repeat = type === "EVERY";
	      timerEntry.active = true;
	      timerEntry.nextTimeMs = Date.now() + intervalMs;
	    } else {
	      timerEntry.active = false;
	    }
	  }
	  vmCopyFromScreen(source, dest) {
	    for (let i = 0; i < 16384; i += 1) {
	      let byte = this.canvas.getByte(source + i);
	      if (byte === null) {
	        byte = this.mem[source + i] || 0;
	      }
	      this.mem[dest + i] = byte;
	    }
	  }
	  vmCopyToScreen(source, dest) {
	    for (let i = 0; i < 16384; i += 1) {
	      const byte = this.mem[source + i] || 0;
	      this.canvas.setByte(dest + i, byte);
	    }
	  }
	  vmSetScreenBase(byte) {
	    byte = this.vmInRangeRound(byte, 0, 255, "screenBase");
	    const page = byte >> 6, oldPage = this.screenPage;
	    if (page !== oldPage) {
	      let addr = oldPage << 14;
	      this.vmCopyFromScreen(addr, addr);
	      this.screenPage = page;
	      addr = page << 14;
	      this.vmCopyToScreen(addr, addr);
	    }
	  }
	  vmSetScreenOffset(offset) {
	    this.canvas.setScreenOffset(offset);
	  }
	  // could be also set vmSetScreenViewBase? thisiScreenViewPage?  We always draw on visible canvas?
	  vmSetTransparentMode(stream, transparent) {
	    this.windowDataList[stream].transparent = Boolean(transparent);
	  }
	  // --
	  abs(n) {
	    this.vmAssertNumber(n, "ABS");
	    return Math.abs(n);
	  }
	  addressOf(variable) {
	    this.vmAssertString(variable, "@");
	    const varIndex = this.variables.getVariableIndex(variable);
	    if (varIndex < 0) {
	      throw this.vmComposeError(Error(), 5, "@" + variable);
	    }
	    return varIndex;
	  }
	  afterGosub(interval, timer, line) {
	    this.vmAfterEveryGosub("AFTER", interval, timer, line);
	  }
	  static vmGetCharCodeAt(s, i) {
	    const code = s.charCodeAt(i);
	    if (code < 256 || code >= 512) {
	      return code;
	    }
	    return code & 255;
	  }
	  static vmWithControlCodes(s) {
	    let out = "";
	    for (let i = 0; i < s.length; i += 1) {
	      out += String.fromCharCode(_CpcVm.vmGetCharCodeAt(s, i));
	    }
	    return out;
	  }
	  /*
	  private static vmGetCpcCharCode(code: number): number {
	  	return code & 0xFF; // eslint-disable-line no-bitwise
	  }
	  */
	  static vmGetCpcCharCode(code) {
	    if (code > 255) {
	      if (_CpcVm.utf8ToCpc[code]) {
	        code = _CpcVm.utf8ToCpc[code];
	      } else if (code <= 511) {
	        code &= 255;
	      }
	    }
	    return code;
	  }
	  // and
	  asc(s) {
	    this.vmAssertString(s, "ASC");
	    if (!s.length) {
	      throw this.vmComposeError(Error(), 5, "ASC");
	    }
	    return _CpcVm.vmGetCpcCharCode(s.charCodeAt(0));
	  }
	  atn(n) {
	    this.vmAssertNumber(n, "ATN");
	    n = Math.atan(n);
	    return this.degFlag ? Utils.toDegrees(n) : n;
	  }
	  auto(line, increment) {
	    line = line === void 0 ? 10 : this.vmLineInRange(line, "AUTO");
	    increment = increment === void 0 ? 10 : this.vmLineInRange(increment, "AUTO");
	    this.vmNotImplemented("AUTO " + line + "," + increment);
	  }
	  bin$(n, pad) {
	    n = this.vmRound2Complement(n, "BIN$");
	    pad = this.vmInRangeRound(pad || 0, 0, 16, "BIN$");
	    return n.toString(2).padStart(pad, "0");
	  }
	  border(ink1, ink2) {
	    ink1 = this.vmInRangeRound(ink1, 0, 31, "BORDER");
	    if (ink2 === void 0) {
	      ink2 = ink1;
	    } else {
	      ink2 = this.vmInRangeRound(ink2, 0, 31, "BORDER");
	    }
	    this.canvas.setBorder(ink1, ink2);
	  }
	  // break
	  vmMcSetMode(mode) {
	    mode = this.vmInRangeRound(mode, 0, 3, "MCSetMode");
	    const canvasMode = this.canvas.getMode();
	    if (mode !== canvasMode) {
	      const addr = this.screenPage << 14;
	      this.vmCopyFromScreen(addr, addr);
	      this.canvas.changeMode(mode);
	      this.vmCopyToScreen(addr, addr);
	      this.canvas.changeMode(canvasMode);
	    }
	  }
	  vmTxtInverse(stream) {
	    const win = this.windowDataList[stream], tmpPen = win.pen;
	    this.pen(stream, win.paper);
	    this.paper(stream, tmpPen);
	  }
	  // special function to set all inks temporarily; experimental and expensive
	  updateColorsImmediately(addr) {
	    const inkList = [];
	    for (let i = 0; i < 17; i += 1) {
	      const byte = this.peek(addr + i & 65535), color = byte & 31;
	      inkList[i] = color;
	    }
	    this.canvas.updateColorsAndCanvasImmediately(inkList);
	  }
	  call(addr, ...args) {
	    addr = this.vmRound2Complement(addr, "CALL");
	    if (args.length > 32) {
	      throw this.vmComposeError(Error(), 2, "CALL ");
	    }
	    for (let i = 0; i < args.length; i += 1) {
	      if (typeof args[i] === "number") {
	        args[i] = this.vmRound2Complement(args[i], "CALL");
	      }
	    }
	    switch (addr) {
	      case 47872:
	        this.keyboard.resetCpcKeysExpansions();
	        this.call(47875);
	        break;
	      case 47875:
	        this.clearInput();
	        this.keyboard.resetExpansionTokens();
	        break;
	      case 47884:
	        this.keyboard.putKeyInBuffer(String.fromCharCode(args.length), true);
	        break;
	      case 47878:
	      // KM Wait Char (ROM &1A3C); since we do not return a character, we do the same as call &bb18
	      case 47896:
	        if (this.inkey$() === "") {
	          this.vmStop("waitKey", 30);
	        }
	        break;
	      case 47950:
	        this.canvas.resetCustomChars();
	        this.vmResetPenPaperWindowData();
	        this.vmResetWindowData();
	        this.vmResetControlBuffer();
	        break;
	      case 47953:
	        this.vmResetControlBuffer();
	        break;
	      case 47962:
	        this.print(0, String.fromCharCode(args.length));
	        break;
	      case 47965:
	        this.vmDrawUndrawCursor(0);
	        this.vmPrintChars(0, String.fromCharCode(args.length));
	        this.vmDrawUndrawCursor(0);
	        break;
	      case 47980:
	        this.cls(0);
	        break;
	      case 47995:
	        this.cursor(0, void 0, 1);
	        break;
	      case 47998:
	        this.cursor(0, void 0, 0);
	        break;
	      case 48001:
	        this.cursor(0, 1);
	        break;
	      case 48004:
	        this.cursor(0, 0);
	        break;
	      case 48010:
	      // TXT Place Cursor (ROM &1268)
	      case 48013:
	        this.vmPlaceRemoveCursor(0);
	        break;
	      case 48016:
	        this.pen(0, args.length % 16);
	        break;
	      case 48022:
	        this.paper(0, args.length % 16);
	        break;
	      case 48028:
	        this.vmTxtInverse(0);
	        break;
	      case 48031:
	        this.vmSetTransparentMode(0, args.length);
	        break;
	      case 48091:
	        this.canvas.clearGraphicsWindow();
	        break;
	      case 48094:
	        this.graphicsPen(args.length % 16);
	        break;
	      case 48100:
	        this.graphicsPaper(args.length % 16);
	        break;
	      case 48124:
	        this.canvas.printGChar(args.length);
	        break;
	      case 48127:
	        this.vmSetScreenBase(192);
	        this.modeValue = 1;
	        this.canvas.setMode(this.modeValue);
	        this.canvas.clearFullWindow();
	        this.vmResetInks();
	        break;
	      case 48130:
	        this.vmResetInks();
	        break;
	      case 48134:
	      // SCR SET BASE (&BC08, ROM &0B45); We use &BC06 to load reg A from reg E (not for CPC 664!)
	      case 48135:
	        this.vmSetScreenBase(args[0]);
	        break;
	      case 48142:
	        this.mode(args.length % 4);
	        break;
	      case 48217:
	        this.canvas.setGColMode(args.length % 4);
	        break;
	      case 48295:
	        this.soundClass.reset();
	        break;
	      case 48310:
	        this.vmNotImplemented("CALL &BCBC");
	        break;
	      case 48313:
	        this.vmNotImplemented("CALL &BCB9");
	        break;
	      case 48409:
	        this.frame();
	        break;
	      case 48412:
	        this.vmMcSetMode(args.length % 4);
	        break;
	      /*
	      // would be a temporary functionality, will be undo with next interrupt
	      case 0xbd22: // MC Clear Inks (ROM &0786), ink table address in DE (last parameter)
	      	break;
	      */
	      case 48421:
	        this.updateColorsImmediately(args[0]);
	        break;
	      case 48445:
	        this.clearInput();
	        break;
	      case 48457:
	        this.canvas.setMaskFirst(args.length % 2);
	        break;
	      case 48460:
	        this.canvas.setMask(args.length);
	        break;
	      case 48466:
	        this.fill(args.length % 16);
	        break;
	      case 48475:
	        this.vmSetRamSelect(args.length);
	        break;
	      default:
	        if (!this.rsx.callRsx(this, "&" + addr.toString(16).toLowerCase().padStart(4, "0"), ...args)) {
	          if (Utils.debug > 0) {
	            Utils.console.debug("Ignored: CALL", addr, args);
	          }
	        }
	        break;
	    }
	  }
	  callRsx(name, ...args) {
	    if (args.length > 32) {
	      throw this.vmComposeError(Error(), 2, "RSX ");
	    }
	    for (let i = 0; i < args.length; i += 1) {
	      if (typeof args[i] === "number") {
	        args[i] = this.vmRound2Complement(args[i], "RSX");
	      }
	    }
	    if (!this.rsx.callRsx(this, name, ...args)) {
	      throw this.vmComposeError(Error(), 28, "|" + name);
	    }
	  }
	  cat() {
	    const stream = 0, fileParas = {
	      command: "cat",
	      stream,
	      fileMask: "",
	      line: this.line
	      // unused
	    };
	    this.vmStop("fileCat", 45, false, fileParas);
	  }
	  chain(name, line, first, last) {
	    const inFile = this.inFile;
	    name = this.vmAdaptFilename(name, "CHAIN");
	    this.closein();
	    inFile.line = line === void 0 ? 0 : this.vmInRangeRound(line, 0, 65535, "CHAIN");
	    inFile.first = first === void 0 ? 0 : this.vmAssertInRange(first, 1, 65535, "CHAIN");
	    inFile.last = last === void 0 ? 0 : this.vmAssertInRange(last, 1, 65535, "CHAIN");
	    inFile.open = true;
	    inFile.command = "chain";
	    inFile.name = name;
	    inFile.fnFileCallback = this.fnCloseinHandler;
	    this.vmStop("fileLoad", 90);
	  }
	  chainMerge(name, line, first, last) {
	    const inFile = this.inFile;
	    name = this.vmAdaptFilename(name, "CHAIN MERGE");
	    this.closein();
	    inFile.line = line === void 0 ? 0 : this.vmInRangeRound(line, 0, 65535, "CHAIN MERGE");
	    inFile.first = first === void 0 ? 0 : this.vmAssertInRange(first, 1, 65535, "CHAIN MERGE");
	    inFile.last = last === void 0 ? 0 : this.vmAssertInRange(last, 1, 65535, "CHAIN MERGE");
	    inFile.open = true;
	    inFile.command = "chainMerge";
	    inFile.name = name;
	    inFile.fnFileCallback = this.fnCloseinHandler;
	    this.vmStop("fileLoad", 90);
	  }
	  chr$(n) {
	    n = this.vmInRangeRound(n, 0, 255, "CHR$");
	    return String.fromCharCode(n);
	  }
	  cint(n) {
	    return this.vmInRangeRound(n, -32768, 32767, "CINT");
	  }
	  clear() {
	    this.vmResetTimers();
	    this.ei();
	    this.vmSetStartLine(0);
	    this.breakGosubLine = 0;
	    this.breakResumeLine = 0;
	    this.errorGotoLine = 0;
	    this.errorResumeLine = 0;
	    this.gosubStack.length = 0;
	    this.variables.initAllVariables();
	    this.defreal("a", "z");
	    this.restore();
	    this.rad();
	    this.soundClass.resetQueue();
	    this.soundData.length = 0;
	    this.vmResetInFileHandling();
	    this.vmResetOutFileHandling();
	  }
	  clearInput() {
	    this.keyboard.clearInput();
	  }
	  clg(gPaper) {
	    if (gPaper !== void 0) {
	      gPaper = this.vmInRangeRound(gPaper, 0, 15, "CLG");
	      this.canvas.setGPaper(gPaper);
	    }
	    this.canvas.clearGraphicsWindow();
	  }
	  vmCloseinCallback() {
	    const inFile = this.inFile;
	    _CpcVm.vmResetFileHandling(inFile);
	  }
	  closein() {
	    if (this.inFile.open) {
	      this.vmCloseinCallback();
	    }
	  }
	  vmCloseoutCallback() {
	    const outFile = this.outFile;
	    _CpcVm.vmResetFileHandling(outFile);
	  }
	  closeout() {
	    const outFile = this.outFile;
	    if (outFile.open) {
	      if (outFile.command !== "openout") {
	        if (!this.quiet) {
	          Utils.console.warn("closeout: command=", outFile.command);
	        }
	      }
	      if (!outFile.fileData.length) {
	        this.vmCloseoutCallback();
	      } else {
	        outFile.command = "closeout";
	        outFile.start = 0;
	        outFile.length = 0;
	        outFile.fnFileCallback = this.fnCloseoutHandler;
	        this.vmStop("fileSave", 90);
	      }
	    }
	  }
	  // also called for chr$(12), call &bb6c
	  cls(stream) {
	    stream = this.vmInRangeRound(stream, 0, 7, "CLS");
	    const win = this.windowDataList[stream];
	    this.vmDrawUndrawCursor(stream);
	    this.canvas.clearTextWindow(win.left, win.right, win.top, win.bottom, win.paper);
	    win.pos = 0;
	    win.vpos = 0;
	    if (!stream) {
	      this.outBuffer = "";
	    }
	  }
	  commaTab(stream) {
	    stream = this.vmInRangeRound(stream, 0, 9, "commaTab");
	    this.vmMoveCursor2AllowedPos(stream);
	    const zone = this.zoneValue, win = this.windowDataList[stream];
	    let count = zone - win.pos % zone;
	    if (win.pos) {
	      if (win.pos + count + zone > win.right + 1 - win.left) {
	        win.pos += count + zone;
	        this.vmMoveCursor2AllowedPos(stream);
	        count = 0;
	      }
	    }
	    return " ".repeat(count);
	  }
	  cont() {
	    if (!this.startLine) {
	      throw this.vmComposeError(Error(), 17, "CONT");
	    }
	    this.vmGoto(this.startLine, "CONT");
	    this.startLine = 0;
	  }
	  copychr$(stream) {
	    stream = this.vmInRangeRound(stream, 0, 7, "COPYCHR$");
	    this.vmMoveCursor2AllowedPos(stream);
	    this.vmDrawUndrawCursor(stream);
	    const win = this.windowDataList[stream], charCode = this.canvas.readChar(win.pos + win.left, win.vpos + win.top, win.pen, win.paper), char = charCode >= 0 ? String.fromCharCode(charCode) : " ";
	    this.vmDrawUndrawCursor(stream);
	    return char;
	  }
	  cos(n) {
	    this.vmAssertNumber(n, "COS");
	    return Math.cos(this.degFlag ? Utils.toRadians(n) : n);
	  }
	  creal(n) {
	    this.vmAssertNumber(n, "CREAL");
	    return n;
	  }
	  vmPlaceRemoveCursor(stream) {
	    const win = this.windowDataList[stream];
	    this.vmMoveCursor2AllowedPos(stream);
	    this.canvas.drawCursor(win.pos + win.left, win.vpos + win.top, win.pen, win.paper);
	  }
	  vmDrawUndrawCursor(stream) {
	    const win = this.windowDataList[stream];
	    if (win.cursorOn && win.cursorEnabled) {
	      this.vmPlaceRemoveCursor(stream);
	    }
	  }
	  cursor(stream, cursorOn, cursorEnabled) {
	    stream = this.vmInRangeRound(stream, 0, 7, "CURSOR");
	    const win = this.windowDataList[stream];
	    if (cursorOn !== void 0) {
	      cursorOn = this.vmInRangeRound(cursorOn, 0, 1, "CURSOR");
	      this.vmDrawUndrawCursor(stream);
	      win.cursorOn = Boolean(cursorOn);
	      this.vmDrawUndrawCursor(stream);
	    }
	    if (cursorEnabled !== void 0) {
	      cursorEnabled = this.vmInRangeRound(cursorEnabled, 0, 1, "CURSOR");
	      this.vmDrawUndrawCursor(stream);
	      win.cursorEnabled = Boolean(cursorEnabled);
	      this.vmDrawUndrawCursor(stream);
	    }
	  }
	  data(line, ...args) {
	    this.vmLineInRange(line, "DATA");
	    if (!this.dataLineIndex[line]) {
	      this.dataLineIndex[line] = this.dataList.length;
	    }
	    for (let i = 0; i < args.length; i += 1) {
	      this.dataList.push(args[i]);
	    }
	  }
	  dec$(n, frmt) {
	    const formatRegExp = /^[+\-$£*#,.^]*$/;
	    this.vmAssertNumber(n, "DEC$");
	    this.vmAssertString(frmt, "DEC$");
	    if (!formatRegExp.test(frmt)) {
	      throw this.vmComposeError(Error(), 5, "DEC$ " + frmt);
	    }
	    return this.vmUsingNumberFormat(frmt, n);
	  }
	  // def fn
	  defint(first, last) {
	    this.vmDefineVarTypes("I", "DEFINT", first, last);
	  }
	  defreal(first, last) {
	    this.vmDefineVarTypes("R", "DEFREAL", first, last);
	  }
	  defstr(first, last) {
	    this.vmDefineVarTypes("$", "DEFSTR", first, last);
	  }
	  deg() {
	    this.degFlag = true;
	  }
	  "delete"(first, last) {
	    if (first === void 0) {
	      first = 1;
	      last = last === void 0 ? 65535 : this.vmInRangeRound(last, 1, 65535, "DELETE");
	    } else {
	      first = this.vmInRangeRound(first, 1, 65535, "DELETE");
	      if (last === void 0) {
	        last = first;
	      } else {
	        last = this.vmInRangeRound(last, 1, 65535, "DELETE");
	      }
	    }
	    this.vmStop("deleteLines", 85, false, {
	      command: "DELETE",
	      stream: 0,
	      // unused
	      first,
	      last,
	      line: this.line
	      // unused
	    });
	  }
	  derr() {
	    return 0;
	  }
	  di() {
	    this.timerPriority = 3;
	  }
	  dim(varName, ...args) {
	    const dimensions = [];
	    this.vmAssertString(varName, "DIM");
	    for (let i = 0; i < args.length; i += 1) {
	      const size = this.vmInRangeRound(args[i], 0, 32767, "DIM") + 1;
	      dimensions.push(size);
	    }
	    this.variables.dimVariable(varName, dimensions);
	  }
	  draw(x, y, gPen, gColMode) {
	    x = this.vmInRangeRound(x, -32768, 32767, "DRAW");
	    y = this.vmInRangeRound(y, -32768, 32767, "DRAW");
	    this.vmDrawMovePlot("DRAW", gPen, gColMode);
	    this.canvas.draw(x, y);
	  }
	  drawr(x, y, gPen, gColMode) {
	    x = this.vmInRangeRound(x, -32768, 32767, "DRAWR") + this.canvas.getXpos();
	    y = this.vmInRangeRound(y, -32768, 32767, "DRAWR") + this.canvas.getYpos();
	    this.vmDrawMovePlot("DRAWR", gPen, gColMode);
	    this.canvas.draw(x, y);
	  }
	  edit(line) {
	    const lineParas = {
	      command: "edit",
	      stream: 0,
	      // unused
	      first: line,
	      last: 0,
	      // unused,
	      line: this.line
	      // unused
	    };
	    this.vmStop("editLine", 85, false, lineParas);
	  }
	  ei() {
	    this.timerPriority = -1;
	  }
	  end(label) {
	    this.stop(label);
	  }
	  ent(toneEnv, ...args) {
	    toneEnv = this.vmInRangeRound(toneEnv, -15, 15, "ENT");
	    const envData = [];
	    let arg, repeat = false;
	    if (toneEnv < 0) {
	      toneEnv = -toneEnv;
	      repeat = true;
	    }
	    if (toneEnv) {
	      for (let i = 0; i < args.length; i += 3) {
	        if (args[i] !== void 0) {
	          arg = {
	            steps: this.vmInRangeRound(args[i], 0, 239, "ENT"),
	            // number of steps: 0..239
	            diff: this.vmInRangeRound(args[i + 1], -128, 127, "ENT"),
	            // size (period change) of steps: -128..+127
	            time: this.vmInRangeRound(args[i + 2], 0, 255, "ENT"),
	            // time per step: 0..255 (0=256)
	            repeat
	          };
	        } else {
	          arg = {
	            period: this.vmInRangeRound(args[i + 1], 0, 4095, "ENT"),
	            // absolute period
	            time: this.vmInRangeRound(args[i + 2], 0, 255, "ENT")
	            // time: 0..255 (0=256)
	          };
	        }
	        envData.push(arg);
	      }
	      this.soundClass.setToneEnv(toneEnv, envData);
	    } else {
	      if (!this.quiet) {
	        Utils.console.warn("ENT: toneEnv", toneEnv);
	      }
	      throw this.vmComposeError(Error(), 5, "ENT " + toneEnv);
	    }
	  }
	  env(volEnv, ...args) {
	    volEnv = this.vmInRangeRound(volEnv, 1, 15, "ENV");
	    const envData = [];
	    let arg;
	    for (let i = 0; i < args.length; i += 3) {
	      if (args[i] !== void 0) {
	        arg = {
	          steps: this.vmInRangeRound(args[i], 0, 127, "ENV"),
	          // number of steps: 0..127
	          /* eslint-disable no-bitwise */
	          diff: this.vmInRangeRound(args[i + 1], -128, 127, "ENV") & 15,
	          // size (volume) of steps: moved to range 0..15
	          /* eslint-enable no-bitwise */
	          time: this.vmInRangeRound(args[i + 2], 0, 255, "ENV")
	          // time per step: 0..255 (0=256)
	        };
	        if (!arg.time) {
	          arg.time = 256;
	        }
	      } else {
	        arg = {
	          register: this.vmInRangeRound(args[i + 1], 0, 15, "ENV"),
	          // register: 0..15
	          period: this.vmInRangeRound(args[i + 2], -32768, 65535, "ENV")
	        };
	      }
	      envData.push(arg);
	    }
	    this.soundClass.setVolEnv(volEnv, envData);
	  }
	  eof() {
	    const inFile = this.inFile;
	    let eof = -1;
	    if (inFile.open && inFile.fileData.length) {
	      eof = 0;
	    }
	    return eof;
	  }
	  // find array variable matching <name>(A+)(typeChar?)
	  vmFindArrayVariable(name) {
	    let typeChar = name.charAt(name.length - 1);
	    if (typeChar === "I" || typeChar === "R" || typeChar === "$") {
	      name = name.slice(0, -1);
	    } else {
	      typeChar = this.vmDetermineVarType(name.charAt(0));
	    }
	    name += "A";
	    const fnArrayVarFilter = function(variable) {
	      return variable.indexOf(name) === 0 && variable.charAt(variable.length - 1) === typeChar ? variable : null;
	    };
	    let names = this.variables.getAllVariableNames();
	    names = names.filter(fnArrayVarFilter);
	    return names;
	  }
	  erase(...args) {
	    if (!args.length) {
	      throw this.vmComposeError(Error(), 2, "ERASE");
	    }
	    for (let i = 0; i < args.length; i += 1) {
	      this.vmAssertString(args[i], "ERASE");
	      const names = this.vmFindArrayVariable(args[i]);
	      if (names.length) {
	        for (let j = 0; j < names.length; j += 1) {
	          const name = names[j];
	          this.variables.initVariable(name);
	        }
	      } else {
	        if (!this.quiet) {
	          Utils.console.warn("erase: Array variable not found:", args[i]);
	        }
	        throw this.vmComposeError(Error(), 5, "ERASE " + args[i]);
	      }
	    }
	  }
	  erl() {
	    const errorLine = parseInt(String(this.errorLine), 10);
	    return errorLine || 0;
	  }
	  err() {
	    return this.errorCode;
	  }
	  vmComposeError(error, err, errInfo) {
	    const errors = _CpcVm.errors, errorString = errors[err] || errors[errors.length - 1];
	    this.errorCode = err;
	    this.errorLine = this.line;
	    const errorWithInfo = errorString + " in " + this.errorLine + (errInfo ? ": " + errInfo : "");
	    let hidden = false;
	    if (this.errorGotoLine && !this.errorResumeLine) {
	      this.errorResumeLine = this.errorLine;
	      this.vmGoto(this.errorGotoLine, "onError");
	      this.vmStop("onError", 50);
	      hidden = true;
	    } else {
	      this.vmStop("error", 50);
	    }
	    if (!this.quiet) {
	      Utils.console.log("BASIC error(" + err + "):", errorWithInfo + (hidden ? " (hidden: " + hidden + ")" : ""));
	    }
	    const traceLine = this.line, sourceMapEntry = this.sourceMap[traceLine], pos = sourceMapEntry && sourceMapEntry[0], len = sourceMapEntry && sourceMapEntry[1];
	    return Utils.composeError("CpcVm", error, errorString, errInfo, pos, len, this.line, hidden);
	  }
	  error(err, errInfo) {
	    err = this.vmInRangeRound(err, 0, 255, "ERROR");
	    throw this.vmComposeError(Error(), err, errInfo);
	  }
	  everyGosub(interval, timer, line) {
	    this.vmAfterEveryGosub("EVERY", interval, timer, line);
	  }
	  exp(n) {
	    this.vmAssertNumber(n, "EXP");
	    return Math.exp(n);
	  }
	  fill(gPen) {
	    gPen = this.vmInRangeRound(gPen, 0, 15, "FILL");
	    this.canvas.fill(gPen);
	  }
	  fix(n) {
	    this.vmAssertNumber(n, "FIX");
	    return Math.trunc(n);
	  }
	  frame() {
	    this.vmStop("waitFrame", 40);
	  }
	  fre(arg) {
	    if (typeof arg !== "number" && typeof arg !== "string") {
	      throw this.vmComposeError(Error(), 2, "FRE");
	    }
	    return this.himemValue - this.progEnd;
	  }
	  vmGosub(retLabel, n) {
	    this.vmGoto(n, "gosub (ret=" + retLabel + ")");
	    this.gosubStack.push(retLabel);
	  }
	  gosub(retLabel, n) {
	    this.vmLineInRange(n, "GOSUB");
	    if (this.gosubStack.length >= this.maxGosubStackLength) {
	      throw this.vmComposeError(Error(), 7, "GOSUB " + n);
	    }
	    this.vmGosub(retLabel, n);
	  }
	  "goto"(line) {
	    this.vmLineInRange(line, "GOTO");
	    this.vmGoto(line, "goto");
	  }
	  graphicsPaper(gPaper) {
	    gPaper = this.vmInRangeRound(gPaper, 0, 15, "GRAPHICS PAPER");
	    this.canvas.setGPaper(gPaper);
	  }
	  graphicsPen(gPen, transparentMode) {
	    if (gPen === void 0 && transparentMode === void 0) {
	      throw this.vmComposeError(Error(), 22, "GRAPHICS PEN");
	    }
	    if (gPen !== void 0) {
	      gPen = this.vmInRangeRound(gPen, 0, 15, "GRAPHICS PEN");
	      this.canvas.setGPen(gPen);
	    }
	    if (transparentMode !== void 0) {
	      transparentMode = this.vmInRangeRound(transparentMode, 0, 1, "GRAPHICS PEN");
	      this.canvas.setGTransparentMode(Boolean(transparentMode));
	    }
	  }
	  hex$(n, pad) {
	    n = this.vmRound2Complement(n, "HEX$");
	    pad = this.vmInRangeRound(pad || 0, 0, 16, "HEX$");
	    return n.toString(16).toUpperCase().padStart(pad, "0");
	  }
	  himem() {
	    return this.himemValue;
	  }
	  ink(pen, ink1, ink2) {
	    pen = this.vmInRangeRound(pen, 0, 15, "INK");
	    ink1 = this.vmInRangeRound(ink1, 0, 31, "INK");
	    if (ink2 === void 0) {
	      ink2 = ink1;
	    } else {
	      ink2 = this.vmInRangeRound(ink2, 0, 31, "INK");
	    }
	    this.canvas.setInk(pen, ink1, ink2);
	  }
	  inkey(key) {
	    key = this.vmInRangeRound(key, 0, 79, "INKEY");
	    return this.keyboard.getKeyState(key);
	  }
	  inkey$() {
	    const key = this.keyboard.getKeyFromBuffer();
	    if (key !== "") {
	      this.inkeyTimeMs = 0;
	    } else {
	      const now = Date.now();
	      if (this.inkeyTimeMs && now < this.inkeyTimeMs) {
	        this.frame();
	      }
	      this.inkeyTimeMs = now + _CpcVm.frameTimeMs;
	    }
	    return key;
	  }
	  inp(port) {
	    port = this.vmRound2Complement(port, "INP");
	    let byte = port & 255;
	    byte |= 255;
	    return byte;
	  }
	  vmSetInputValues(inputValues) {
	    this.inputValues = inputValues;
	  }
	  vmGetNextInput() {
	    const inputValues = this.inputValues, value = inputValues.shift();
	    return value;
	  }
	  vmInputCallback() {
	    const inputParas = this.vmGetStopObject().paras, stream = inputParas.stream, input = inputParas.input, inputValues = input.split(","), convertedInputValues = [], types = inputParas.types;
	    let inputOk = true;
	    if (Utils.debug > 0) {
	      Utils.console.debug("vmInputCallback:", input);
	    }
	    if (types && inputValues.length === types.length) {
	      for (let i = 0; i < types.length; i += 1) {
	        const varType = types[i], type = this.vmDetermineVarType(varType), value = inputValues[i];
	        if (type !== "$") {
	          const valueNumber = this.vmVal(value);
	          if (isNaN(valueNumber)) {
	            inputOk = false;
	          }
	          convertedInputValues.push(valueNumber);
	        } else {
	          convertedInputValues.push(value);
	        }
	      }
	    } else {
	      inputOk = false;
	    }
	    this.cursor(stream, 0);
	    if (!inputOk) {
	      this.print(stream, "?Redo from start\r\n");
	      inputParas.input = "";
	      this.print(stream, inputParas.message);
	      this.cursor(stream, 1);
	    } else {
	      this.vmSetInputValues(convertedInputValues);
	    }
	    return inputOk;
	  }
	  fnFileInputGetString(fileData) {
	    let line = fileData[0].replace(/^\s+/, ""), value;
	    if (line.charAt(0) === '"') {
	      const index = line.indexOf('"', 1);
	      if (index >= 0) {
	        value = line.substring(1, index + 1 - 1);
	        line = line.substring(index + 1);
	        line = line.replace(/^\s*,/, "");
	      } else if (fileData.length > 1) {
	        fileData.shift();
	        line += "\n" + fileData[0];
	      } else {
	        throw this.vmComposeError(Error(), 13, "INPUT #9: no closing quotes: " + line);
	      }
	    } else {
	      const index = line.indexOf(",");
	      if (index >= 0) {
	        value = line.substring(0, index);
	        line = line.substring(index + 1);
	      } else {
	        value = line;
	        line = "";
	      }
	    }
	    fileData[0] = line;
	    return value;
	  }
	  fnFileInputGetNumber(fileData) {
	    let line = fileData[0].replace(/^\s+/, ""), index = line.indexOf(","), value;
	    if (index >= 0) {
	      value = line.substring(0, index);
	      line = line.substring(index + 1);
	    } else {
	      index = line.indexOf(" ");
	      if (index >= 0) {
	        value = line.substring(0, index);
	        line = line.substring(index);
	        line = line.replace(/^\s*/, "");
	      } else {
	        value = line;
	        line = "";
	      }
	    }
	    const nValue = this.vmVal(value);
	    if (isNaN(nValue)) {
	      throw this.vmComposeError(Error(), 13, "INPUT #9 " + nValue + ": " + value);
	    }
	    fileData[0] = line;
	    return nValue;
	  }
	  vmInputNextFileItem(type) {
	    const fileData = this.inFile.fileData;
	    let value;
	    while (fileData.length && value === void 0) {
	      if (type === "$") {
	        value = this.fnFileInputGetString(fileData);
	      } else {
	        value = this.fnFileInputGetNumber(fileData);
	      }
	      if (!fileData[0].length) {
	        fileData.shift();
	      }
	    }
	    return value;
	  }
	  vmInputFromFile(types) {
	    const inputValues = [];
	    for (let i = 0; i < types.length; i += 1) {
	      const varType = types[i], type = this.vmDetermineVarType(varType), value = this.vmInputNextFileItem(type);
	      inputValues[i] = this.vmAssign(varType, value);
	    }
	    this.vmSetInputValues(inputValues);
	  }
	  input(stream, noCRLF, msg, ...args) {
	    stream = this.vmInRangeRound(stream, 0, 9, "INPUT");
	    if (stream < 8) {
	      this.print(stream, msg);
	      this.vmStop("waitInput", 45, false, {
	        command: "input",
	        stream,
	        message: msg,
	        noCRLF,
	        fnInputCallback: this.fnInputCallbackHandler,
	        types: args,
	        input: "",
	        line: this.line
	        // to repeat in case of break
	      });
	      this.cursor(stream, 1);
	    } else if (stream === 8) {
	      this.vmSetInputValues(["I am the printer!"]);
	    } else if (stream === 9) {
	      if (!this.inFile.open) {
	        throw this.vmComposeError(Error(), 31, "INPUT #" + stream);
	      } else if (this.eof()) {
	        throw this.vmComposeError(Error(), 24, "INPUT #" + stream);
	      }
	      this.vmInputFromFile(args);
	    }
	  }
	  instr(p1, p2, p3) {
	    const startPos = typeof p1 === "number" ? this.vmInRangeRound(p1, 1, 255, "INSTR") - 1 : 0, str = typeof p1 === "number" ? p2 : p1, search = typeof p1 === "number" ? p3 : p2;
	    this.vmAssertString(str, "INSTR");
	    this.vmAssertString(search, "INSTR");
	    if (startPos >= str.length) {
	      return 0;
	    }
	    if (!search.length) {
	      return startPos + 1;
	    }
	    return _CpcVm.vmWithControlCodes(str).indexOf(_CpcVm.vmWithControlCodes(search), startPos) + 1;
	  }
	  "int"(n) {
	    this.vmAssertNumber(n, "INT");
	    return Math.floor(n);
	  }
	  joy(joy) {
	    joy = this.vmInRangeRound(joy, 0, 1, "JOY");
	    return this.keyboard.getJoyState(joy);
	  }
	  key(token, s) {
	    token = this.vmRound(token, "KEY");
	    if (token >= 128 && token <= 159) {
	      token -= 128;
	    }
	    token = this.vmInRangeRound(token, 0, 31, "KEY");
	    this.vmAssertString(s, "KEY");
	    this.keyboard.setExpansionToken(token, s);
	  }
	  keyDef(cpcKey, repeat, normal, shift, ctrl) {
	    const options = {
	      cpcKey: this.vmInRangeRound(cpcKey, 0, 79, "KEY DEF"),
	      repeat: this.vmInRangeRound(repeat, 0, 1, "KEY DEF"),
	      normal: normal !== void 0 ? this.vmInRangeRound(normal, 0, 255, "KEY DEF") : void 0,
	      shift: shift !== void 0 ? this.vmInRangeRound(shift, 0, 255, "KEY DEF") : void 0,
	      ctrl: ctrl !== void 0 ? this.vmInRangeRound(ctrl, 0, 255, "KEY DEF") : void 0
	    };
	    this.keyboard.setCpcKeyExpansion(options);
	  }
	  left$(s, len) {
	    this.vmAssertString(s, "LEFT$");
	    len = this.vmInRangeRound(len, 0, 255, "LEFT$");
	    return s.substring(0, len);
	  }
	  len(s) {
	    this.vmAssertString(s, "LEN");
	    return s.length;
	  }
	  // let
	  vmLineInputCallback() {
	    const inputParas = this.vmGetStopObject().paras, input = inputParas.input;
	    if (Utils.debug > 0) {
	      Utils.console.debug("vmLineInputCallback:", input);
	    }
	    this.vmSetInputValues([input]);
	    this.cursor(inputParas.stream, 0);
	    return true;
	  }
	  lineInput(stream, noCRLF, msg, varType) {
	    stream = this.vmInRangeRound(stream, 0, 9, "LINE INPUT");
	    if (stream < 8) {
	      this.vmAssertString(varType, "LINE INPUT");
	      this.print(stream, msg);
	      const type = this.vmDetermineVarType(varType);
	      if (type !== "$") {
	        this.print(stream, "\r\n");
	        throw this.vmComposeError(Error(), 13, "LINE INPUT " + type);
	      }
	      this.cursor(stream, 1);
	      this.vmStop("waitInput", 45, false, {
	        command: "lineinput",
	        stream,
	        message: msg,
	        noCRLF,
	        fnInputCallback: this.fnLineInputCallbackHandler,
	        input: "",
	        line: this.line
	        // to repeat in case of break
	      });
	    } else if (stream === 8) {
	      this.vmSetInputValues(["I am the printer!"]);
	    } else if (stream === 9) {
	      if (!this.inFile.open) {
	        throw this.vmComposeError(Error(), 31, "LINE INPUT #" + stream);
	      } else if (this.eof()) {
	        throw this.vmComposeError(Error(), 24, "LINE INPUT #" + stream);
	      }
	      this.vmSetInputValues(this.inFile.fileData.splice(0, arguments.length - 3));
	    }
	  }
	  list(stream, first, last) {
	    stream = this.vmInRangeRound(stream, 0, 9, "LIST");
	    if (first === void 0) {
	      first = 1;
	      if (last === void 0) {
	        last = 65535;
	      }
	    } else {
	      first = this.vmInRangeRound(first, 1, 65535, "LIST");
	      if (last === void 0) {
	        last = first;
	      } else {
	        last = this.vmInRangeRound(last, 1, 65535, "LIST");
	      }
	    }
	    if (stream === 9) {
	      if (!this.outFile.open) {
	        throw this.vmComposeError(Error(), 31, "LIST #" + stream);
	      }
	    }
	    this.vmStop("list", 90, false, {
	      command: "list",
	      stream,
	      first,
	      last,
	      line: this.line
	      // unused
	    });
	  }
	  vmLoadCallback(input, meta) {
	    const inFile = this.inFile;
	    let putInMemory = false;
	    if (input !== null && meta) {
	      if (meta.typeString === "B" || meta.typeString === "S" || inFile.start !== void 0) {
	        const start = inFile.start !== void 0 ? inFile.start : Number(meta.start);
	        let length = Number(meta.length);
	        if (isNaN(length)) {
	          length = input.length;
	        }
	        if (Utils.debug > 1) {
	          Utils.console.debug("vmLoadCallback:", inFile.name + ": putting data in memory", start, "-", start + length);
	        }
	        if (meta.typeString === "S") {
	          for (let i = 0; i < length; i += 1) {
	            this.vmSetMem(start + i, input.charCodeAt(i));
	          }
	          const addr = this.screenPage << 14;
	          this.vmCopyToScreen(addr, addr);
	        } else {
	          for (let i = 0; i < length; i += 1) {
	            this.poke(start + i & 65535, input.charCodeAt(i));
	          }
	        }
	        putInMemory = true;
	      }
	    }
	    this.closein();
	    return putInMemory;
	  }
	  load(name, start) {
	    const inFile = this.inFile;
	    name = this.vmAdaptFilename(name, "LOAD");
	    if (start !== void 0) {
	      start = this.vmRound2Complement(start, "LOAD");
	    }
	    this.closein();
	    inFile.open = true;
	    inFile.command = "load";
	    inFile.name = name;
	    inFile.start = start;
	    inFile.fnFileCallback = this.fnLoadHandler;
	    this.vmStop("fileLoad", 90);
	  }
	  vmLocate(stream, pos, vpos) {
	    const win = this.windowDataList[stream];
	    win.pos = pos - 1;
	    win.vpos = vpos - 1;
	  }
	  locate(stream, pos, vpos) {
	    stream = this.vmInRangeRound(stream, 0, 7, "LOCATE");
	    pos = this.vmInRangeRound(pos, 1, 255, "LOCATE");
	    vpos = this.vmInRangeRound(vpos, 1, 255, "LOCATE");
	    this.vmDrawUndrawCursor(stream);
	    this.vmLocate(stream, pos, vpos);
	    this.vmDrawUndrawCursor(stream);
	  }
	  log(n) {
	    this.vmAssertNumber(n, "LOG");
	    if (n <= 0) {
	      throw this.vmComposeError(Error(), 6, "LOG " + n);
	    }
	    return Math.log(n);
	  }
	  log10(n) {
	    this.vmAssertNumber(n, "LOG10");
	    if (n <= 0) {
	      throw this.vmComposeError(Error(), 6, "LOG10 " + n);
	    }
	    return Math.log10(n);
	  }
	  static fnLowerCase(match) {
	    return match.toLowerCase();
	  }
	  lower$(s) {
	    this.vmAssertString(s, "LOWER$");
	    s = s.replace(/[A-Z]/g, _CpcVm.fnLowerCase);
	    return s;
	  }
	  mask(mask, first) {
	    if (mask === void 0 && first === void 0) {
	      throw this.vmComposeError(Error(), 22, "MASK");
	    }
	    if (mask !== void 0) {
	      mask = this.vmInRangeRound(mask, 0, 255, "MASK");
	      this.canvas.setMask(mask);
	    }
	    if (first !== void 0) {
	      first = this.vmInRangeRound(first, 0, 1, "MASK");
	      this.canvas.setMaskFirst(first);
	    }
	  }
	  max(...args) {
	    if (!args.length) {
	      throw this.vmComposeError(Error(), 22, "MAX");
	    } else if (args.length === 1) {
	      if (typeof args[0] !== "number" && !this.quiet) {
	        Utils.console.warn("MAX: Not a number:", args[0]);
	      }
	      return args[0];
	    }
	    for (let i = 0; i < args.length; i += 1) {
	      this.vmAssertNumber(args[i], "MAX");
	    }
	    return Math.max.apply(null, args);
	  }
	  memory(n) {
	    n = this.vmRound2Complement(n, "MEMORY");
	    if (n < this.progEnd || n > this.minCharHimem) {
	      throw this.vmComposeError(Error(), 7, "MEMORY " + n);
	    }
	    this.himemValue = n;
	  }
	  merge(name) {
	    const inFile = this.inFile;
	    name = this.vmAdaptFilename(name, "MERGE");
	    this.closein();
	    inFile.open = true;
	    inFile.command = "merge";
	    inFile.name = name;
	    inFile.fnFileCallback = this.fnCloseinHandler;
	    this.vmStop("fileLoad", 90);
	  }
	  mid$(s, start, len) {
	    this.vmAssertString(s, "MID$");
	    start = this.vmInRangeRound(start, 1, 255, "MID$");
	    if (len !== void 0) {
	      len = this.vmInRangeRound(len, 0, 255, "MID$");
	    }
	    return s.substr(start - 1, len);
	  }
	  mid$Assign(s, start, len, newString) {
	    this.vmAssertString(s, "MID$");
	    this.vmAssertString(newString, "MID$");
	    start = this.vmInRangeRound(start, 1, 255, "MID$") - 1;
	    len = len !== void 0 ? this.vmInRangeRound(len, 0, 255, "MID$") : newString.length;
	    if (len > newString.length) {
	      len = newString.length;
	    }
	    if (len > s.length - start) {
	      len = s.length - start;
	    }
	    s = s.substring(0, start) + newString.substring(0, len) + s.substring(start + len);
	    return s;
	  }
	  min(...args) {
	    if (!args.length) {
	      throw this.vmComposeError(Error(), 22, "MIN");
	    } else if (args.length === 1) {
	      if (typeof args[0] !== "number" && !this.quiet) {
	        Utils.console.warn("MIN: Not a number:", args[0]);
	      }
	      return args[0];
	    }
	    for (let i = 0; i < args.length; i += 1) {
	      this.vmAssertNumber(args[i], "MIN");
	    }
	    return Math.min.apply(null, args);
	  }
	  // mod
	  // changing the mode without clearing the screen (called by rsx |MODE)
	  vmChangeMode(mode) {
	    this.modeValue = mode;
	    const winData = _CpcVm.winData[this.modeValue];
	    for (let i = 0; i < _CpcVm.streamCount - 2; i += 1) {
	      const win = this.windowDataList[i];
	      Object.assign(win, winData);
	    }
	    this.canvas.changeMode(mode);
	  }
	  mode(mode) {
	    mode = this.vmInRangeRound(mode, 0, 3, "MODE");
	    this.modeValue = mode;
	    this.vmResetWindowData();
	    this.outBuffer = "";
	    this.canvas.setMode(mode);
	    this.canvas.clearFullWindow();
	  }
	  move(x, y, gPen, gColMode) {
	    x = this.vmInRangeRound(x, -32768, 32767, "MOVE");
	    y = this.vmInRangeRound(y, -32768, 32767, "MOVE");
	    this.vmDrawMovePlot("MOVE", gPen, gColMode);
	    this.canvas.move(x, y);
	  }
	  mover(x, y, gPen, gColMode) {
	    x = this.vmInRangeRound(x, -32768, 32767, "MOVER") + this.canvas.getXpos();
	    y = this.vmInRangeRound(y, -32768, 32767, "MOVER") + this.canvas.getYpos();
	    this.vmDrawMovePlot("MOVER", gPen, gColMode);
	    this.canvas.move(x, y);
	  }
	  "new"() {
	    this.progEnd = _CpcVm.progStart + 3;
	    this.clear();
	    const lineParas = {
	      command: "new",
	      stream: 0,
	      // unused
	      first: 0,
	      // unused
	      last: 0,
	      // unused
	      line: this.line
	      // unused
	    };
	    this.vmStop("new", 90, false, lineParas);
	  }
	  onBreakCont() {
	    this.breakGosubLine = -1;
	    this.breakResumeLine = 0;
	  }
	  onBreakGosub(line) {
	    this.breakGosubLine = this.vmLineInRange(line, "ON BREAK GOSUB");
	    this.breakResumeLine = 0;
	  }
	  onBreakStop() {
	    this.breakGosubLine = 0;
	    this.breakResumeLine = 0;
	  }
	  onErrorGoto(line) {
	    this.errorGotoLine = line !== 0 ? this.vmLineInRange(line, "ON ERROR GOTO") : 0;
	    if (!line && this.errorResumeLine) {
	      throw this.vmComposeError(Error(), this.errorCode, "ON ERROR GOTO without RESUME from " + this.errorLine);
	    }
	  }
	  onGosub(retLabel, n, ...args) {
	    n = this.vmInRangeRound(n, 0, 255, "ON GOSUB");
	    let line;
	    if (!n || n > args.length) {
	      if (Utils.debug > 1) {
	        Utils.console.debug("onGosub: out of range: n=" + n + " in " + this.line);
	      }
	      line = retLabel;
	    } else {
	      line = this.vmLineInRange(args[n - 1], "ON GOSUB");
	      if (this.gosubStack.length >= this.maxGosubStackLength) {
	        throw this.vmComposeError(Error(), 7, "ON GOSUB " + n);
	      }
	      this.gosubStack.push(retLabel);
	    }
	    this.vmGoto(line, "onGosub (n=" + n + ", ret=" + retLabel + ", line=" + line + ")");
	  }
	  onGoto(retLabel, n, ...args) {
	    n = this.vmInRangeRound(n, 0, 255, "ON GOTO");
	    let line;
	    if (!n || n > args.length) {
	      if (Utils.debug > 1) {
	        Utils.console.debug("onGoto: out of range: n=" + n + " in " + this.line);
	      }
	      line = retLabel;
	    } else {
	      line = this.vmLineInRange(args[n - 1], "ON GOTO");
	    }
	    this.vmGoto(line, "onGoto (n=" + n + ", ret=" + retLabel + ", line=" + line + ")");
	  }
	  static fnChannel2ChannelIndex(channel) {
	    if (channel === 4) {
	      channel = 2;
	    } else {
	      channel -= 1;
	    }
	    return channel;
	  }
	  onSqGosub(channel, line) {
	    channel = this.vmInRangeRound(channel, 1, 4, "ON SQ GOSUB");
	    if (channel === 3) {
	      throw this.vmComposeError(Error(), 5, "ON SQ GOSUB " + channel);
	    }
	    channel = _CpcVm.fnChannel2ChannelIndex(channel);
	    const sqTimer = this.sqTimer[channel];
	    sqTimer.line = this.vmLineInRange(line, "ON SQ GOSUB");
	    sqTimer.active = true;
	    sqTimer.repeat = true;
	  }
	  vmOpeninCallback(input) {
	    if (input !== null) {
	      const inFile = this.inFile, eolStr = input.indexOf("\r\n") > 0 ? "\r\n" : "\n";
	      if (input.endsWith(eolStr)) {
	        input = input.substring(0, input.length - eolStr.length);
	      }
	      inFile.fileData = input.split(eolStr);
	    } else {
	      this.closein();
	    }
	  }
	  openin(name) {
	    name = this.vmAdaptFilename(name, "OPENIN");
	    const inFile = this.inFile;
	    if (!inFile.open) {
	      if (name) {
	        inFile.open = true;
	        inFile.command = "openin";
	        inFile.name = name;
	        inFile.fnFileCallback = this.fnOpeninHandler;
	        this.vmStop("fileLoad", 90);
	      }
	    } else {
	      throw this.vmComposeError(Error(), 27, "OPENIN " + inFile.name);
	    }
	  }
	  openout(name) {
	    const outFile = this.outFile;
	    if (outFile.open) {
	      throw this.vmComposeError(Error(), 27, "OPENOUT " + outFile.name);
	    }
	    name = this.vmAdaptFilename(name, "OPENOUT");
	    outFile.open = true;
	    outFile.command = "openout";
	    outFile.name = name;
	    outFile.fileData.length = 0;
	    outFile.typeString = "A";
	  }
	  // or
	  origin(xOff, yOff, xLeft, xRight, yTop, yBottom) {
	    xOff = this.vmInRangeRound(xOff, -32768, 32767, "ORIGIN");
	    yOff = this.vmInRangeRound(yOff, -32768, 32767, "ORIGIN");
	    this.canvas.setOrigin(xOff, yOff);
	    if (xLeft !== void 0) {
	      xLeft = this.vmInRangeRound(xLeft, -32768, 32767, "ORIGIN");
	      xRight = this.vmInRangeRound(xRight, -32768, 32767, "ORIGIN");
	      yTop = this.vmInRangeRound(yTop, -32768, 32767, "ORIGIN");
	      yBottom = this.vmInRangeRound(yBottom, -32768, 32767, "ORIGIN");
	      this.canvas.setGWindow(xLeft, xRight, yTop, yBottom);
	    }
	  }
	  vmSetRamSelect(bank) {
	    if (!bank) {
	      this.ramSelect = 0;
	    } else if (bank >= 4) {
	      this.ramSelect = bank - 3;
	    }
	  }
	  vmSetCrtcData(crtcReg, byte) {
	    const crtcData = this.crtcData;
	    crtcData[crtcReg] = byte;
	    if (crtcReg === 12 || crtcReg === 13) {
	      const offset = ((crtcData[12] || 0) & 3) << 9 | (crtcData[13] || 0) << 1;
	      this.vmSetScreenOffset(offset);
	      if (crtcReg === 12) {
	        this.vmSetScreenBase(byte << 2 & 192);
	      }
	    }
	  }
	  out(port, byte) {
	    port = this.vmRound2Complement(port, "OUT");
	    byte = this.vmInRangeRound(byte, 0, 255, "OUT");
	    const portHigh = port >> 8;
	    if (portHigh === 127) {
	      this.vmSetRamSelect(byte - 192);
	    } else if (portHigh === 188) {
	      this.crtcReg = byte % 14;
	    } else if (portHigh === 189) {
	      this.vmSetCrtcData(this.crtcReg, byte);
	    } else if (Utils.debug > 0) {
	      Utils.console.debug("OUT", Number(port).toString(16), byte, ": unknown port");
	    }
	  }
	  paper(stream, paper) {
	    stream = this.vmInRangeRound(stream, 0, 7, "PAPER");
	    paper = this.vmInRangeRound(paper, 0, 15, "PAPER");
	    const win = this.windowDataList[stream], modeData = _CpcVm.modeData[this.modeValue];
	    win.paper = paper % modeData.pens;
	  }
	  vmGetCharDataByte(addr) {
	    const dataPos = (addr - 1 - this.minCharHimem) % 8, char = this.minCustomChar + (addr - 1 - dataPos - this.minCharHimem) / 8, charData = this.canvas.getCharData(char);
	    return charData[dataPos];
	  }
	  vmSetCharDataByte(addr, byte) {
	    const dataPos = (addr - 1 - this.minCharHimem) % 8, char = this.minCustomChar + (addr - 1 - dataPos - this.minCharHimem) / 8, charData = this.canvas.getCharData(char), charDataCopy = charData.slice();
	    charDataCopy[dataPos] = byte;
	    this.canvas.setCustomChar(char, charDataCopy);
	  }
	  peek(addr) {
	    addr = this.vmRound2Complement(addr, "PEEK");
	    const page = addr >> 14;
	    let byte;
	    if (page === this.screenPage) {
	      byte = this.canvas.getByte(addr);
	      if (byte === null) {
	        byte = this.mem[addr] || 0;
	      }
	    } else if (page === 1 && this.ramSelect) {
	      addr = (this.ramSelect - 1) * 16384 + 65536 + addr;
	      byte = this.mem[addr] || 0;
	    } else if (addr > this.minCharHimem && addr <= this.maxCharHimem) {
	      byte = this.vmGetCharDataByte(addr);
	    } else {
	      byte = this.mem[addr] || 0;
	    }
	    return byte;
	  }
	  pen(stream, pen, transparent) {
	    stream = this.vmInRangeRound(stream, 0, 7, "PEN");
	    if (pen !== void 0) {
	      const win = this.windowDataList[stream], modeData = _CpcVm.modeData[this.modeValue];
	      pen = this.vmInRangeRound(pen, 0, 15, "PEN");
	      win.pen = pen % modeData.pens;
	    }
	    if (transparent !== void 0) {
	      transparent = this.vmInRangeRound(transparent, 0, 1, "PEN");
	      this.vmSetTransparentMode(stream, transparent);
	    }
	  }
	  pi() {
	    return Math.PI;
	  }
	  plot(x, y, gPen, gColMode) {
	    x = this.vmInRangeRound(x, -32768, 32767, "PLOT");
	    y = this.vmInRangeRound(y, -32768, 32767, "PLOT");
	    this.vmDrawMovePlot("PLOT", gPen, gColMode);
	    this.canvas.plot(x, y);
	  }
	  plotr(x, y, gPen, gColMode) {
	    x = this.vmInRangeRound(x, -32768, 32767, "PLOTR") + this.canvas.getXpos();
	    y = this.vmInRangeRound(y, -32768, 32767, "PLOTR") + this.canvas.getYpos();
	    this.vmDrawMovePlot("PLOTR", gPen, gColMode);
	    this.canvas.plot(x, y);
	  }
	  // put directly in memory without memory papping
	  vmSetMem(addr, byte) {
	    this.mem[addr] = byte;
	  }
	  poke(addr, byte) {
	    addr = this.vmRound2Complement(addr, "POKE address");
	    byte = this.vmInRangeRound(byte, 0, 255, "POKE byte");
	    const page = addr >> 14;
	    if (page === 1 && this.ramSelect) {
	      addr = (this.ramSelect - 1) * 16384 + 65536 + addr;
	    } else if (page === this.screenPage) {
	      this.canvas.setByte(addr, byte);
	    } else if (addr > this.minCharHimem && addr <= this.maxCharHimem) {
	      this.vmSetCharDataByte(addr, byte);
	    }
	    this.mem[addr] = byte;
	  }
	  pos(stream) {
	    stream = this.vmInRangeRound(stream, 0, 9, "POS");
	    let pos;
	    if (stream < 8) {
	      pos = this.vmGetAllowedPosOrVpos(stream, false) + 1;
	    } else if (stream === 8) {
	      pos = 1;
	    } else {
	      const win = this.windowDataList[stream];
	      pos = win.pos + 1;
	    }
	    return pos;
	  }
	  vmGetAllowedPosOrVpos(stream, vpos) {
	    const win = this.windowDataList[stream], left = win.left, right = win.right, top = win.top, bottom = win.bottom;
	    let x = win.pos, y = win.vpos;
	    if (x > right - left) {
	      y += 1;
	      x = 0;
	    }
	    if (x < 0) {
	      y -= 1;
	      x = right - left;
	    }
	    if (!vpos) {
	      return x;
	    }
	    if (y < 0) {
	      y = 0;
	    }
	    if (y > bottom - top) {
	      y = bottom - top;
	    }
	    return y;
	  }
	  vmMoveCursor2AllowedPos(stream) {
	    const win = this.windowDataList[stream], left = win.left, right = win.right, top = win.top, bottom = win.bottom;
	    let x = win.pos, y = win.vpos;
	    if (x > right - left) {
	      y += 1;
	      x = 0;
	      this.vmPrint2OutBuffer("\n");
	    }
	    if (x < 0) {
	      y -= 1;
	      x = right - left;
	    }
	    if (y < 0) {
	      y = 0;
	      if (stream < 8) {
	        this.canvas.windowScrollDown(left, right, top, bottom, win.paper);
	      }
	    }
	    if (y > bottom - top) {
	      y = bottom - top;
	      if (stream < 8) {
	        this.canvas.windowScrollUp(left, right, top, bottom, win.paper);
	      }
	    }
	    win.pos = x;
	    win.vpos = y;
	  }
	  vmPrintChars(stream, str) {
	    const win = this.windowDataList[stream];
	    if (!win.textEnabled) {
	      if (Utils.debug > 0) {
	        Utils.console.debug("vmPrintChars: text output disabled:", str);
	      }
	      return;
	    }
	    this.vmMoveCursor2AllowedPos(stream);
	    if (win.pos && win.pos + str.length > win.right + 1 - win.left) {
	      win.pos = 0;
	      win.vpos += 1;
	    }
	    for (let i = 0; i < str.length; i += 1) {
	      const char = _CpcVm.vmGetCpcCharCode(str.charCodeAt(i));
	      this.vmMoveCursor2AllowedPos(stream);
	      this.canvas.printChar(char, win.pos + win.left, win.vpos + win.top, win.pen, win.paper, win.transparent);
	      win.pos += 1;
	    }
	  }
	  vmControlSymbol(para) {
	    const paraList = [];
	    for (let i = 0; i < para.length; i += 1) {
	      paraList.push(para.charCodeAt(i));
	    }
	    while (paraList.length < 9) {
	      paraList.push(0);
	    }
	    const char = paraList[0];
	    if (char >= this.minCustomChar) {
	      this.symbol.apply(this, paraList);
	    } else if (Utils.debug > 0) {
	      Utils.console.debug("vmControlSymbol: define SYMBOL ignored:", char);
	    }
	  }
	  vmControlWindow(para, stream) {
	    const paraList = [];
	    for (let i = 0; i < para.length; i += 1) {
	      let value = para.charCodeAt(i) + 1;
	      value %= 256;
	      if (!value) {
	        value = 1;
	      }
	      paraList.push(value);
	    }
	    this.window(stream, paraList[0], paraList[1], paraList[2], paraList[3]);
	  }
	  vmHandleControlCode(code, para, stream) {
	    const win = this.windowDataList[stream], out = "";
	    switch (code) {
	      case 0:
	        break;
	      case 1:
	        this.vmPrintChars(stream, para);
	        break;
	      case 2:
	        win.cursorEnabled = false;
	        break;
	      case 3:
	        win.cursorEnabled = true;
	        break;
	      case 4:
	        this.mode(para.charCodeAt(0) & 3);
	        break;
	      case 5:
	        this.vmPrintGraphChars(para);
	        break;
	      case 6:
	        win.cursorEnabled = true;
	        win.textEnabled = true;
	        break;
	      case 7:
	        this.sound(135, 90, 20, 12, 0, 0, 0);
	        break;
	      case 8:
	        this.vmMoveCursor2AllowedPos(stream);
	        win.pos -= 1;
	        break;
	      case 9:
	        this.vmMoveCursor2AllowedPos(stream);
	        win.pos += 1;
	        break;
	      case 10:
	        this.vmMoveCursor2AllowedPos(stream);
	        win.vpos += 1;
	        break;
	      case 11:
	        this.vmMoveCursor2AllowedPos(stream);
	        win.vpos -= 1;
	        break;
	      case 12:
	        this.cls(stream);
	        break;
	      case 13:
	        this.vmMoveCursor2AllowedPos(stream);
	        win.pos = 0;
	        break;
	      case 14:
	        this.paper(stream, para.charCodeAt(0) & 15);
	        break;
	      case 15:
	        this.pen(stream, para.charCodeAt(0) & 15);
	        break;
	      case 16:
	        this.vmMoveCursor2AllowedPos(stream);
	        this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, 1, 1, win.paper);
	        break;
	      case 17:
	        this.vmMoveCursor2AllowedPos(stream);
	        this.canvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper);
	        break;
	      case 18:
	        this.vmMoveCursor2AllowedPos(stream);
	        this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper);
	        break;
	      case 19:
	        this.vmMoveCursor2AllowedPos(stream);
	        this.canvas.fillTextBox(win.left, win.top, win.right - win.left + 1, win.top - win.vpos, win.paper);
	        this.canvas.fillTextBox(win.left, win.top + win.vpos, win.pos + 1, 1, win.paper);
	        break;
	      case 20:
	        this.vmMoveCursor2AllowedPos(stream);
	        this.canvas.fillTextBox(win.left + win.pos, win.top + win.vpos, win.right - win.left + 1 - win.pos, 1, win.paper);
	        this.canvas.fillTextBox(win.left, win.top + win.vpos + 1, win.right - win.left + 1, win.bottom - win.top - win.vpos, win.paper);
	        break;
	      case 21:
	        win.cursorEnabled = false;
	        win.textEnabled = false;
	        break;
	      case 22:
	        this.vmSetTransparentMode(stream, para.charCodeAt(0) & 1);
	        break;
	      case 23:
	        this.canvas.setGColMode(para.charCodeAt(0) % 4);
	        break;
	      case 24:
	        this.vmTxtInverse(stream);
	        break;
	      case 25:
	        this.vmControlSymbol(para);
	        break;
	      case 26:
	        this.vmControlWindow(para, stream);
	        break;
	      case 27:
	        break;
	      case 28:
	        this.ink(para.charCodeAt(0) & 15, para.charCodeAt(1) & 31, para.charCodeAt(2) & 31);
	        break;
	      case 29:
	        this.border(para.charCodeAt(0) & 31, para.charCodeAt(1) & 31);
	        break;
	      case 30:
	        win.pos = 0;
	        win.vpos = 0;
	        break;
	      case 31:
	        this.vmLocate(stream, _CpcVm.vmGetCharCodeAt(para, 0), _CpcVm.vmGetCharCodeAt(para, 1));
	        break;
	      default:
	        Utils.console.warn("vmHandleControlCode: Unknown control code:", code);
	        break;
	    }
	    return out;
	  }
	  vmPrintCharsOrControls(stream, str) {
	    let buf = "", out = "", i = 0;
	    while (i < str.length) {
	      const code = _CpcVm.vmGetCharCodeAt(str, i);
	      i += 1;
	      if (code <= 31) {
	        if (out !== "") {
	          this.vmPrintChars(stream, out);
	          out = "";
	        }
	        const paraCount = _CpcVm.controlCodeParameterCount[code];
	        if (i + paraCount <= str.length) {
	          out += this.vmHandleControlCode(code, str.substring(i, i + paraCount), stream);
	          i += paraCount;
	        } else {
	          buf = str.substring(i - 1);
	          i = str.length;
	        }
	      } else {
	        out += String.fromCharCode(code);
	      }
	    }
	    if (out !== "") {
	      this.vmPrintChars(stream, out);
	    }
	    return buf;
	  }
	  vmPrintGraphChars(str) {
	    for (let i = 0; i < str.length; i += 1) {
	      const char = _CpcVm.vmGetCpcCharCode(str.charCodeAt(i));
	      this.canvas.printGChar(char);
	    }
	  }
	  print(stream, ...args) {
	    stream = this.vmInRangeRound(stream, 0, 9, "PRINT");
	    const win = this.windowDataList[stream];
	    if (stream < 8) {
	      if (!win.tag) {
	        this.vmDrawUndrawCursor(stream);
	      }
	    } else if (stream === 9) {
	      if (!this.outFile.open) {
	        throw this.vmComposeError(Error(), 31, "PRINT #" + stream);
	      }
	      this.outFile.stream = stream;
	    }
	    let buf = this.printControlBuf;
	    for (let i = 0; i < args.length; i += 1) {
	      const arg = args[i];
	      let str;
	      if (typeof arg === "object") {
	        const specialArgs = arg.args;
	        switch (arg.type) {
	          case "commaTab":
	            str = this.commaTab(stream);
	            break;
	          case "spc":
	            str = this.spc(stream, specialArgs[0]);
	            break;
	          case "tab":
	            str = this.tab(stream, specialArgs[0]);
	            break;
	          default:
	            throw this.vmComposeError(Error(), 5, "PRINT " + arg.type);
	        }
	      } else if (typeof arg === "number") {
	        str = (arg >= 0 ? " " : "") + Utils.toPrecision9(arg) + " ";
	      } else {
	        str = String(arg);
	      }
	      if (stream < 8) {
	        if (win.tag) {
	          this.vmPrintGraphChars(str);
	        } else {
	          if (buf.length) {
	            str = buf + str;
	          }
	          buf = this.vmPrintCharsOrControls(stream, str);
	        }
	        this.vmPrint2OutBuffer(str);
	      } else if (stream === 8) {
	        this.vmPrint2OutBuffer(str);
	      } else {
	        const lastCrPos = buf.lastIndexOf("\r");
	        if (lastCrPos >= 0) {
	          win.pos = str.length - lastCrPos;
	        } else {
	          win.pos += str.length;
	        }
	        if (str === "\r\n") {
	          win.pos = 0;
	        }
	        if (win.pos >= win.right) {
	          str = "\r\n" + str;
	          win.pos = 0;
	        }
	        buf += str;
	      }
	    }
	    if (stream < 8) {
	      if (!win.tag) {
	        this.vmDrawUndrawCursor(stream);
	        this.printControlBuf = buf;
	      }
	    } else if (stream === 9) {
	      this.outFile.fileData.push(buf);
	    }
	  }
	  rad() {
	    this.degFlag = false;
	  }
	  vmRandomizeCallback() {
	    const inputParas = this.vmGetStopObject().paras, input = inputParas.input, value = this.vmVal(input);
	    let inputOk = true;
	    if (Utils.debug > 0) {
	      Utils.console.debug("vmRandomizeCallback:", input);
	    }
	    if (isNaN(value)) {
	      inputOk = false;
	      inputParas.input = "";
	      this.print(inputParas.stream, inputParas.message);
	    } else {
	      this.vmSetInputValues([value]);
	    }
	    return inputOk;
	  }
	  randomize(n) {
	    const stream = 0;
	    if (n === void 0) {
	      const msg = "Random number seed ? ";
	      this.print(stream, msg);
	      const inputParas = {
	        command: "randomize",
	        stream,
	        message: msg,
	        fnInputCallback: this.fnRandomizeCallbackHandler,
	        input: "",
	        line: this.line
	        // to repeat in case of break
	      };
	      this.vmStop("waitInput", 45, false, inputParas);
	    } else {
	      this.vmAssertNumber(n, "RANDOMIZE");
	      if (Utils.debug > 1) {
	        Utils.console.debug("randomize:", n);
	      }
	      this.random.init(n);
	    }
	  }
	  read(varType) {
	    this.vmAssertString(varType, "READ");
	    const type = this.vmDetermineVarType(varType);
	    let item;
	    if (this.dataIndex < this.dataList.length) {
	      const dataItem = this.dataList[this.dataIndex];
	      this.dataIndex += 1;
	      if (dataItem === void 0) {
	        item = type === "$" ? "" : 0;
	      } else if (type !== "$") {
	        item = this.val(String(dataItem));
	      } else {
	        item = dataItem;
	      }
	      item = this.vmAssign(varType, item);
	    } else {
	      throw this.vmComposeError(Error(), 4, "READ");
	    }
	    return item;
	  }
	  release(channelMask) {
	    channelMask = this.vmInRangeRound(channelMask, 0, 7, "RELEASE");
	    this.soundClass.release(channelMask);
	  }
	  // rem
	  remain(timerNumber) {
	    timerNumber = this.vmInRangeRound(timerNumber, 0, 3, "REMAIN");
	    const timerEntry = this.timerList[timerNumber];
	    let remain = 0;
	    if (timerEntry.active) {
	      remain = timerEntry.nextTimeMs - Date.now();
	      remain /= _CpcVm.frameTimeMs;
	      timerEntry.active = false;
	    }
	    return remain;
	  }
	  renum(newLine = 10, oldLine = 1, step = 10, keep = 65535) {
	    newLine = this.vmInRangeRound(newLine, 1, 65535, "RENUM");
	    oldLine = this.vmInRangeRound(oldLine, 1, 65535, "RENUM");
	    step = this.vmInRangeRound(step, 1, 65535, "RENUM");
	    keep = this.vmInRangeRound(keep, 1, 65535, "RENUM");
	    const lineRenumParas = {
	      command: "renum",
	      stream: 0,
	      // unused
	      line: this.line,
	      // unused
	      newLine,
	      oldLine,
	      step,
	      keep
	      // keep lines
	    };
	    this.vmStop("renumLines", 85, false, lineRenumParas);
	  }
	  restore(line) {
	    line = line === void 0 ? 0 : this.vmLineInRange(line, "RESTORE");
	    const dataLineIndex = this.dataLineIndex;
	    if (line in dataLineIndex) {
	      this.dataIndex = dataLineIndex[line];
	    } else {
	      if (Utils.debug > 0) {
	        Utils.console.debug("restore: search for dataLine >", line);
	      }
	      for (const dataLine in dataLineIndex) {
	        if (dataLineIndex.hasOwnProperty(dataLine)) {
	          if (Number(dataLine) >= line) {
	            dataLineIndex[line] = dataLineIndex[dataLine];
	            break;
	          }
	        }
	      }
	      if (line in dataLineIndex) {
	        this.dataIndex = dataLineIndex[line];
	      } else {
	        if (Utils.debug > 0) {
	          Utils.console.debug("restore", line + ": No DATA found starting at line");
	        }
	        this.dataIndex = this.dataList.length;
	      }
	    }
	  }
	  resume(line) {
	    if (this.errorGotoLine) {
	      const label = line === void 0 ? this.errorResumeLine : this.vmLineInRange(line, "RESUME");
	      this.vmGoto(label, "resume");
	      this.errorResumeLine = 0;
	    } else {
	      throw this.vmComposeError(Error(), 20, String(line));
	    }
	  }
	  resumeNext() {
	    if (!this.errorGotoLine || !this.errorResumeLine) {
	      throw this.vmComposeError(Error(), 20, "RESUME NEXT");
	    }
	    const resumeLineIndex = this.labelList.indexOf(this.errorResumeLine);
	    if (resumeLineIndex < 0) {
	      Utils.console.error("resumeNext: line not found: " + this.errorResumeLine);
	      this.errorResumeLine = 0;
	      return;
	    }
	    const line = this.labelList[resumeLineIndex + 1];
	    this.vmGoto(line, "resumeNext");
	    this.errorResumeLine = 0;
	  }
	  "return"() {
	    const line = this.gosubStack.pop();
	    if (line === void 0) {
	      throw this.vmComposeError(Error(), 3, "");
	    } else {
	      this.vmGoto(line, "return");
	    }
	    if (line === this.breakResumeLine) {
	      this.breakResumeLine = 0;
	    }
	    this.vmCheckTimerHandlers();
	    if (this.vmCheckSqTimerHandlers()) {
	      this.fnCheckSqTimer();
	    }
	  }
	  right$(s, len) {
	    this.vmAssertString(s, "RIGHT$");
	    len = this.vmInRangeRound(len, 0, 255, "RIGHT$");
	    return s.substring(s.length - len);
	  }
	  rnd(n) {
	    if (n !== void 0) {
	      this.vmAssertNumber(n, "RND");
	    }
	    let x;
	    if (n === void 0 || n > 0) {
	      x = this.random.random();
	      this.lastRnd = x;
	    } else if (n < 0) {
	      x = this.lastRnd || this.random.random();
	    } else {
	      x = this.lastRnd || this.random.random();
	    }
	    return x;
	  }
	  round(n, decimals) {
	    this.vmAssertNumber(n, "ROUND");
	    decimals = this.vmInRangeRound(decimals || 0, -39, 39, "ROUND");
	    const maxDecimals = 20 - Math.floor(Math.log10(n));
	    if (decimals >= 0 && decimals > maxDecimals) {
	      decimals = maxDecimals;
	    }
	    return Math.sign(n) * Number(Math.round(Number(Math.abs(n) + "e" + decimals)) + "e" + (decimals >= 0 ? "-" + decimals : "+" + -decimals));
	  }
	  vmRunCallback(input, meta) {
	    const inFile = this.inFile, putInMemory = input !== null && meta && (meta.typeString === "B" || inFile.start !== void 0);
	    if (input !== null) {
	      const lineParas = {
	        command: "run",
	        stream: 0,
	        // unused
	        first: inFile.line,
	        last: 0,
	        // unused
	        line: this.line
	      };
	      this.vmStop("run", 95, false, lineParas);
	    }
	    this.closein();
	    return putInMemory;
	  }
	  run(numOrString) {
	    const inFile = this.inFile;
	    if (typeof numOrString === "string") {
	      const name = this.vmAdaptFilename(numOrString, "RUN");
	      this.closein();
	      inFile.open = true;
	      inFile.command = "run";
	      inFile.name = name;
	      inFile.start = void 0;
	      inFile.fnFileCallback = this.fnRunHandler;
	      this.vmStop("fileLoad", 90);
	    } else {
	      if (numOrString !== void 0) {
	        this.vmLineInRange(numOrString, "RUN");
	      }
	      const lineParas = {
	        command: "run",
	        stream: 0,
	        // unused
	        first: numOrString || 0,
	        last: 0,
	        // unused
	        line: this.line
	      };
	      this.vmStop("run", 95, false, lineParas);
	    }
	  }
	  save(name, type, start, length, entry) {
	    const outFile = this.outFile;
	    name = this.vmAdaptFilename(name, "SAVE");
	    if (!type) {
	      type = "T";
	    } else {
	      type = String(type).toUpperCase();
	    }
	    const fileData = outFile.fileData;
	    fileData.length = 0;
	    if (type === "B") {
	      start = this.vmRound2Complement(start, "SAVE");
	      length = this.vmRound2Complement(length, "SAVE");
	      if (entry !== void 0) {
	        entry = this.vmRound2Complement(entry, "SAVE");
	      }
	      for (let i = 0; i < length; i += 1) {
	        const address = start + i & 65535;
	        fileData[i] = String.fromCharCode(this.peek(address));
	      }
	    } else if ((type === "A" || type === "T" || type === "P") && start === void 0) {
	      start = 368;
	    } else {
	      throw this.vmComposeError(Error(), 2, "SAVE " + type);
	    }
	    outFile.open = true;
	    outFile.command = "save";
	    outFile.name = name;
	    outFile.typeString = type;
	    outFile.start = start;
	    outFile.length = length || 0;
	    outFile.entry = entry || 0;
	    outFile.fnFileCallback = this.fnCloseoutHandler;
	    this.vmStop("fileSave", 90);
	  }
	  sgn(n) {
	    this.vmAssertNumber(n, "SGN");
	    return Math.sign(n);
	  }
	  sin(n) {
	    this.vmAssertNumber(n, "SIN");
	    return Math.sin(this.degFlag ? Utils.toRadians(n) : n);
	  }
	  sound(state, period, duration, volume, volEnv, toneEnv, noise) {
	    state = this.vmInRangeRound(state, 1, 255, "SOUND");
	    period = this.vmInRangeRound(period, 0, 4095, "SOUND ,");
	    const soundData = {
	      state,
	      period,
	      duration: duration !== void 0 ? this.vmInRangeRound(duration, -32768, 32767, "SOUND ,,") : 20,
	      volume: volume !== void 0 ? this.vmInRangeRound(volume, 0, 15, "SOUND ,,,") : 12,
	      volEnv: volEnv !== void 0 ? this.vmInRangeRound(volEnv, 0, 15, "SOUND ,,,,") : 0,
	      toneEnv: toneEnv !== void 0 ? this.vmInRangeRound(toneEnv, 0, 15, "SOUND ,,,,,") : 0,
	      noise: noise !== void 0 ? this.vmInRangeRound(noise, 0, 31, "SOUND ,,,,,,") : 0
	    };
	    if (this.soundClass.testCanQueue(state)) {
	      this.soundClass.sound(soundData);
	    } else {
	      this.soundData.push(soundData);
	      this.vmStop("waitSound", 43);
	      for (let i = 0; i < 3; i += 1) {
	        if (state & 1 << i) {
	          const sqTimer = this.sqTimer[i];
	          sqTimer.active = false;
	        }
	      }
	    }
	  }
	  space$(n) {
	    n = this.vmInRangeRound(n, 0, 255, "SPACE$");
	    return " ".repeat(n);
	  }
	  spc(stream, n) {
	    stream = this.vmInRangeRound(stream, 0, 9, "SPC");
	    n = this.vmInRangeRound(n, -32768, 32767, "SPC");
	    let str = "";
	    if (n >= 0) {
	      const win = this.windowDataList[stream], width = win.right - win.left + 1;
	      if (width) {
	        n %= width;
	      }
	      str = " ".repeat(n);
	    } else if (!this.quiet) {
	      Utils.console.log("SPC: negative number ignored:", n);
	    }
	    return str;
	  }
	  speedInk(time1, time2) {
	    time1 = this.vmInRangeRound(time1, 1, 255, "SPEED INK");
	    time2 = this.vmInRangeRound(time2, 1, 255, "SPEED INK");
	    this.canvas.setSpeedInk(time1, time2);
	  }
	  speedKey(delay, repeat) {
	    delay = this.vmInRangeRound(delay, 1, 255, "SPEED KEY");
	    repeat = this.vmInRangeRound(repeat, 1, 255, "SPEED KEY");
	    this.vmNotImplemented("SPEED KEY " + delay + " " + repeat);
	  }
	  speedWrite(n) {
	    n = this.vmInRangeRound(n, 0, 1, "SPEED WRITE");
	    this.vmNotImplemented("SPEED WRITE " + n);
	  }
	  sq(channel) {
	    channel = this.vmInRangeRound(channel, 1, 4, "SQ");
	    if (channel === 3) {
	      throw this.vmComposeError(Error(), 5, "SQ " + channel);
	    }
	    channel = _CpcVm.fnChannel2ChannelIndex(channel);
	    const sq = this.soundClass.sq(channel), sqTimer = this.sqTimer[channel];
	    if (!(sq & 7) && sqTimer.active) {
	      sqTimer.active = false;
	    }
	    return sq;
	  }
	  sqr(n) {
	    this.vmAssertNumber(n, "SQR");
	    if (n < 0) {
	      throw this.vmComposeError(Error(), 5, "SQR " + n);
	    }
	    return Math.sqrt(n);
	  }
	  // step
	  stop(label) {
	    this.vmGoto(label, "stop");
	    this.vmStop("stop", 60);
	  }
	  str$(n) {
	    this.vmAssertNumber(n, "STR$");
	    return (n >= 0 ? " " : "") + String(n);
	  }
	  string$(len, chr) {
	    len = this.vmInRangeRound(len, 0, 255, "STRING$");
	    if (typeof chr === "number") {
	      chr = this.vmInRangeRound(chr, 0, 255, "STRING$");
	      chr = String.fromCharCode(chr);
	    } else {
	      this.vmAssertString(chr, "STRING$");
	      chr = chr.charAt(0);
	    }
	    return chr.repeat(len);
	  }
	  // swap (window swap)
	  symbol(char, ...args) {
	    char = this.vmInRangeRound(char, this.minCustomChar, 255, "SYMBOL");
	    const charData = [];
	    for (let i = 0; i < args.length; i += 1) {
	      const bitMask = this.vmInRangeRound(args[i], 0, 255, "SYMBOL");
	      charData.push(bitMask);
	    }
	    while (charData.length < 8) {
	      charData.push(0);
	    }
	    this.canvas.setCustomChar(char, charData);
	  }
	  symbolAfter(char) {
	    char = this.vmInRangeRound(char, 0, 256, "SYMBOL AFTER");
	    if (this.minCustomChar < 256) {
	      if (this.minCharHimem !== this.himemValue) {
	        throw this.vmComposeError(Error(), 5, "SYMBOL AFTER " + char);
	      }
	    } else {
	      this.maxCharHimem = this.himemValue;
	    }
	    let minCharHimem = this.maxCharHimem - (256 - char) * 8;
	    if (minCharHimem < this.progEnd) {
	      throw this.vmComposeError(Error(), 7, "SYMBOL AFTER " + minCharHimem);
	    }
	    this.himemValue = minCharHimem;
	    this.canvas.resetCustomChars();
	    if (char === 256) {
	      minCharHimem = _CpcVm.maxHimem;
	      this.maxCharHimem = minCharHimem;
	    }
	    this.minCustomChar = char;
	    this.minCharHimem = minCharHimem;
	  }
	  tab(stream, n) {
	    stream = this.vmInRangeRound(stream, 0, 9, "TAB");
	    n = this.vmInRangeRound(n, -32768, 32767, "TAB");
	    let str = "";
	    if (n > 0) {
	      n -= 1;
	      const win = this.windowDataList[stream], width = win.right - win.left + 1;
	      if (width) {
	        n %= width;
	      }
	      let count = n - win.pos;
	      if (count < 0) {
	        win.pos = win.right + 1;
	        this.vmMoveCursor2AllowedPos(stream);
	        count = n;
	      }
	      str = " ".repeat(count);
	    } else if (!this.quiet) {
	      Utils.console.log("TAB: no tab for value", n);
	    }
	    return str;
	  }
	  tag(stream) {
	    stream = this.vmInRangeRound(stream, 0, 7, "TAG");
	    const win = this.windowDataList[stream];
	    win.tag = true;
	  }
	  tagoff(stream) {
	    stream = this.vmInRangeRound(stream, 0, 7, "TAGOFF");
	    const win = this.windowDataList[stream];
	    win.tag = false;
	  }
	  tan(n) {
	    this.vmAssertNumber(n, "TAN");
	    return Math.tan(this.degFlag ? Utils.toRadians(n) : n);
	  }
	  test(x, y) {
	    x = this.vmInRangeRound(x, -32768, 32767, "TEST");
	    y = this.vmInRangeRound(y, -32768, 32767, "TEST");
	    return this.canvas.test(x, y);
	  }
	  testr(x, y) {
	    x = this.vmInRangeRound(x, -32768, 32767, "TESTR") + this.canvas.getXpos();
	    y = this.vmInRangeRound(y, -32768, 32767, "TESTR") + this.canvas.getYpos();
	    return this.canvas.test(x, y);
	  }
	  time() {
	    return (Date.now() - this.startTime) * 300 / 1e3 | 0;
	  }
	  troff() {
	    this.tronFlag1 = false;
	  }
	  tron() {
	    this.tronFlag1 = true;
	  }
	  unt(n) {
	    n = this.vmInRangeRound(n, -32768, 65535, "UNT");
	    if (n > 32767) {
	      n -= 65536;
	    }
	    return n;
	  }
	  static fnUpperCase(match) {
	    return match.toUpperCase();
	  }
	  upper$(s) {
	    this.vmAssertString(s, "UPPER$");
	    return s.replace(/[a-z]/g, _CpcVm.fnUpperCase);
	  }
	  using(format, ...args) {
	    const reFormat = /(_|!|&|\\ *\\|(?:\*\*|\$\$|\*\*\$)?\+?(?:#|,)+\.?#*(?:\^\^\^\^)?[+-]?)/g, formatList = [];
	    this.vmAssertString(format, "USING");
	    let index = 0, match;
	    while ((match = reFormat.exec(format)) !== null) {
	      let nonFormChars = format.substring(index, match.index);
	      if (match[0] === "_") {
	        nonFormChars += format.charAt(match.index + 1) || "_";
	      }
	      if (formatList.length % 2) {
	        formatList[formatList.length - 1] += nonFormChars;
	      } else {
	        formatList.push(nonFormChars);
	      }
	      if (match[0] === "_") {
	        reFormat.lastIndex += 1;
	        index = reFormat.lastIndex;
	      } else {
	        formatList.push(match[0]);
	        index = match.index + match[0].length;
	      }
	    }
	    if (index < format.length) {
	      const nonFormCharsEnd = format.substring(index);
	      if (formatList.length % 2) {
	        formatList[formatList.length - 1] += nonFormCharsEnd;
	      } else {
	        formatList.push(nonFormCharsEnd);
	      }
	    }
	    if (formatList.length < 2) {
	      if (!this.quiet) {
	        Utils.console.warn("USING: empty or invalid format:", format);
	      }
	      throw this.vmComposeError(Error(), 5, "USING format " + format);
	    }
	    let formatIndex = 0, s = "";
	    for (let i = 0; i < args.length; i += 1) {
	      formatIndex %= formatList.length;
	      if (formatIndex === 0) {
	        s += formatList[formatIndex];
	        formatIndex += 1;
	      }
	      if (formatIndex < formatList.length) {
	        const arg = args[i];
	        s += this.vmUsingFormat(formatList[formatIndex], arg);
	        formatIndex += 1;
	      }
	      if (formatIndex < formatList.length) {
	        s += formatList[formatIndex];
	        formatIndex += 1;
	      }
	    }
	    return s;
	  }
	  vmVal(s) {
	    let num = 0;
	    s = s.trim().toLowerCase();
	    if (s[0] === "&") {
	      if (s[1] === "x") {
	        num = parseInt(s.slice(2), 2);
	      } else {
	        if (s[1] === "h") {
	          num = parseInt(s.slice(2), 16);
	        } else {
	          num = parseInt(s.slice(1), 16);
	        }
	        if (num > 32767) {
	          num -= 65536;
	        }
	      }
	      if (isNaN(num)) {
	        throw this.vmComposeError(Error(), 13, "VAL " + s);
	      }
	    } else if (s !== "") {
	      num = parseFloat(s);
	      if (isNaN(num)) {
	        if (s[0] === "-" || s[0] === ".") {
	          throw this.vmComposeError(Error(), 13, "VAL " + s);
	        }
	      }
	    }
	    return num;
	  }
	  val(s) {
	    this.vmAssertString(s, "VAL");
	    s = s.replace(/ /g, "");
	    let num = this.vmVal(s);
	    if (isNaN(num)) {
	      num = 0;
	    }
	    return num;
	  }
	  vpos(stream) {
	    stream = this.vmInRangeRound(stream, 0, 7, "VPOS");
	    return this.vmGetAllowedPosOrVpos(stream, true) + 1;
	  }
	  wait(port, mask, inv) {
	    port = this.vmRound2Complement(port, "WAIT");
	    mask = this.vmInRangeRound(mask, 0, 255, "WAIT");
	    if (inv !== void 0) {
	      this.vmInRangeRound(inv, 0, 255, "WAIT");
	    }
	    if ((port & 65280) === 62720) {
	      if (mask === 1) {
	        this.frame();
	      }
	    }
	  }
	  // wend
	  // while
	  width(width) {
	    width = this.vmInRangeRound(width, 1, 255, "WIDTH");
	    const win = this.windowDataList[8];
	    win.right = win.left + width;
	  }
	  static forceInRange(num, min, max) {
	    if (num < min) {
	      num = min;
	    } else if (num > max) {
	      num = max;
	    }
	    return num;
	  }
	  window(stream, left, right, top, bottom) {
	    stream = this.vmInRangeRound(stream, 0, 7, "WINDOW");
	    left = this.vmInRangeRound(left, 1, 255, "WINDOW");
	    right = this.vmInRangeRound(right, 1, 255, "WINDOW");
	    top = this.vmInRangeRound(top, 1, 255, "WINDOW");
	    bottom = this.vmInRangeRound(bottom, 1, 255, "WINDOW");
	    const win = this.windowDataList[stream], winData = _CpcVm.winData[this.modeValue];
	    win.left = _CpcVm.forceInRange(Math.min(left, right) - 1, winData.left, winData.right);
	    win.right = _CpcVm.forceInRange(Math.max(left, right) - 1, winData.left, winData.right);
	    win.top = _CpcVm.forceInRange(Math.min(top, bottom) - 1, winData.top, winData.bottom);
	    win.bottom = _CpcVm.forceInRange(Math.max(top, bottom) - 1, winData.top, winData.bottom);
	    win.pos = 0;
	    win.vpos = 0;
	  }
	  windowSwap(stream1, stream2) {
	    stream1 = this.vmInRangeRound(stream1, 0, 7, "WINDOW SWAP");
	    stream2 = this.vmInRangeRound(stream2 || 0, 0, 7, "WINDOW SWAP");
	    const temp = this.windowDataList[stream1];
	    this.windowDataList[stream1] = this.windowDataList[stream2];
	    this.windowDataList[stream2] = temp;
	  }
	  write(stream, ...args) {
	    stream = this.vmInRangeRound(stream, 0, 9, "WRITE");
	    const writeArgs = [];
	    let str;
	    for (let i = 0; i < args.length; i += 1) {
	      const arg = args[i];
	      if (typeof arg === "number") {
	        str = Utils.toPrecision9(arg);
	      } else {
	        str = '"' + String(arg) + '"';
	      }
	      writeArgs.push(str);
	    }
	    str = writeArgs.join(",");
	    if (stream < 8) {
	      const win = this.windowDataList[stream];
	      if (win.tag) {
	        this.vmPrintGraphChars(str + "\r\n");
	      } else {
	        this.vmDrawUndrawCursor(stream);
	        this.vmPrintCharsOrControls(stream, str);
	        this.vmPrintCharsOrControls(stream, "\r\n");
	        this.vmDrawUndrawCursor(stream);
	      }
	      this.vmPrint2OutBuffer(str + "\n");
	    } else if (stream === 8) {
	      this.vmPrint2OutBuffer(str + "\n");
	    } else if (stream === 9) {
	      this.outFile.stream = stream;
	      if (!this.outFile.open) {
	        throw this.vmComposeError(Error(), 31, "WRITE #" + stream);
	      }
	      this.outFile.fileData.push(str + "\r\n");
	    }
	  }
	  // xor
	  xpos() {
	    return this.canvas.getXpos();
	  }
	  ypos() {
	    return this.canvas.getYpos();
	  }
	  zone(n) {
	    this.zoneValue = this.vmInRangeRound(n, 1, 255, "ZONE");
	  }
	  // access some private stuff for testing
	  vmTestGetTimerList() {
	    return this.timerList;
	  }
	  vmTestGetWindowDataList() {
	    return this.windowDataList;
	  }
	  /* eslint-enable no-invalid-this */
	};
	_CpcVm.frameTimeMs = 1e3 / 50;
	// 50 Hz => 20 ms
	_CpcVm.timerCount = 4;
	// number of timers
	_CpcVm.sqTimerCount = 3;
	// sound queue timers
	_CpcVm.streamCount = 10;
	// 0..7 window, 8 printer, 9 cassette
	_CpcVm.progStart = 367;
	_CpcVm.maxHimem = 42747;
	// high memory limit (42747 after symbol after 256)
	_CpcVm.emptyParas = {};
	_CpcVm.modeData = [
	  // mode data for mode 0,1,2,3
	  {
	    pens: 16
	    // number of pens (see also Canvas: modeData)
	  },
	  {
	    pens: 4
	  },
	  {
	    pens: 2
	  },
	  {
	    pens: 16
	  }
	];
	_CpcVm.winData = [
	  // window data for mode 0,1,2,3 (we are counting from 0 here)
	  {
	    left: 0,
	    right: 19,
	    top: 0,
	    bottom: 24
	  },
	  {
	    left: 0,
	    right: 39,
	    top: 0,
	    bottom: 24
	  },
	  {
	    left: 0,
	    right: 79,
	    top: 0,
	    bottom: 24
	  },
	  {
	    left: 0,
	    // mode 3 not available on CPC
	    right: 79,
	    top: 0,
	    bottom: 49
	  }
	];
	_CpcVm.utf8ToCpc = {
	  // needed for UTF-8 character data in openin / input#9
	  8364: 128,
	  8218: 130,
	  402: 131,
	  8222: 132,
	  8230: 133,
	  8224: 134,
	  8225: 135,
	  710: 136,
	  8240: 137,
	  352: 138,
	  8249: 139,
	  338: 140,
	  381: 142,
	  8216: 145,
	  8217: 146,
	  8220: 147,
	  8221: 148,
	  8226: 149,
	  8211: 150,
	  8212: 151,
	  732: 152,
	  8482: 153,
	  353: 154,
	  8250: 155,
	  339: 156,
	  382: 158,
	  376: 159
	};
	_CpcVm.controlCodeParameterCount = [
	  0,
	  // 0x00
	  1,
	  // 0x01
	  0,
	  // 0x02
	  0,
	  // 0x03
	  1,
	  // 0x04
	  1,
	  // 0x05
	  0,
	  // 0x06
	  0,
	  // 0x07
	  0,
	  // 0x08
	  0,
	  // 0x09
	  0,
	  // 0x0a
	  0,
	  // 0x0b
	  0,
	  // 0x0c
	  0,
	  // 0x0d
	  1,
	  // 0x0e
	  1,
	  // 0x0f
	  0,
	  // 0x10
	  0,
	  // 0x11
	  0,
	  // 0x12
	  0,
	  // 0x13
	  0,
	  // 0x14
	  0,
	  // 0x15
	  1,
	  // 0x16
	  1,
	  // 0x17
	  0,
	  // 0x18
	  9,
	  // 0x19
	  4,
	  // 0x1a
	  0,
	  // 0x1b
	  3,
	  // 0x1c
	  2,
	  // 0x1d
	  0,
	  // 0x1e
	  2
	  //  0x1f
	];
	_CpcVm.errors = [
	  // BASIC error numbers
	  "Improper argument",
	  // 0
	  "Unexpected NEXT",
	  // 1
	  "Syntax Error",
	  // 2
	  "Unexpected RETURN",
	  // 3
	  "DATA exhausted",
	  // 4
	  "Improper argument",
	  // 5
	  "Overflow",
	  // 6
	  "Memory full",
	  // 7
	  "Line does not exist",
	  // 8
	  "Subscript out of range",
	  // 9
	  "Array already dimensioned",
	  // 10
	  "Division by zero",
	  // 11
	  "Invalid direct command",
	  // 12
	  "Type mismatch",
	  // 13
	  "String space full",
	  // 14
	  "String too long",
	  // 15
	  "String expression too complex",
	  // 16
	  "Cannot CONTinue",
	  // 17
	  "Unknown user function",
	  // 18
	  "RESUME missing",
	  // 19
	  "Unexpected RESUME",
	  // 20
	  "Direct command found",
	  // 21
	  "Operand missing",
	  // 22
	  "Line too long",
	  // 23
	  "EOF met",
	  // 24
	  "File type error",
	  // 25
	  "NEXT missing",
	  // 26
	  "File already open",
	  // 27
	  "Unknown command",
	  // 28
	  "WEND missing",
	  // 29
	  "Unexpected WEND",
	  // 30
	  "File not open",
	  // 31,
	  "Broken",
	  // 32 "Broken in" (derr=146: xxx not found)
	  "Unknown error"
	  // 33...
	];
	_CpcVm.stopPriority = {
	  "": 0,
	  // nothing
	  direct: 0,
	  // direct input mode
	  timer: 20,
	  // timer expired
	  waitFrame: 40,
	  // FRAME command: wait for frame fly
	  waitKey: 41,
	  // wait for key (higher priority that waitFrame)
	  waitSound: 43,
	  // wait for sound queue
	  waitInput: 45,
	  // wait for input: INPUT, LINE INPUT, RANDOMIZE without parameter
	  fileCat: 45,
	  // CAT
	  fileDir: 45,
	  // |DIR
	  fileEra: 45,
	  // |ERA
	  fileRen: 45,
	  // |REN
	  error: 50,
	  // BASIC error, ERROR command
	  onError: 50,
	  // ON ERROR GOTO active, hide error
	  stop: 60,
	  // STOP or END command
	  "break": 80,
	  // break pressed
	  escape: 85,
	  // escape key, set in controller
	  renumLines: 85,
	  // RENUMber program
	  deleteLines: 85,
	  // delete lines
	  editLine: 85,
	  // edit line
	  end: 90,
	  // end of program
	  list: 90,
	  // LIST program
	  fileLoad: 90,
	  // CHAIN, CHAIN MERGE, LOAD, MERGE, OPENIN, RUN
	  fileSave: 90,
	  // OPENOUT, SAVE
	  "new": 90,
	  // NEW, remove program, variables
	  run: 95,
	  parse: 95,
	  // set in controller
	  parseRun: 95,
	  // parse and run, used in controller
	  reset: 99
	  // reset system
	};
	let CpcVm = _CpcVm;

	class Diff {
	  // Refer to http://www.xmailserver.org/diff2.pdf
	  static composeError(error, message, value, pos) {
	    return Utils.composeError("Diff", error, message, value, pos, void 0, 0);
	  }
	  static inRange(x, l, r) {
	    return l <= x && x <= r || r <= x && x <= l;
	  }
	  static fnEquals(a, b) {
	    return a === b;
	  }
	  // Accepts custom comparator
	  static customIndexOf(arr, item, start, fnEquals) {
	    for (let i2 = start; i2 < arr.length; i2 += 1) {
	      if (fnEquals(item, arr[i2])) {
	        return i2;
	      }
	    }
	    return -1;
	  }
	  /* can we use it here? need to define aA, aB, lcsAtoms, findMidSnake():
	  	private static lcs(startA: number, endA: number, startB: number, endB: number) {
	  		const N = endA - startA + 1,
	  			M = endB - startB + 1;
	  
	  		if (N > 0 && M > 0) {
	  			const middleSnake = findMidSnake(startA, endA, startB, endB),
	  				// A[x;u] == B[y,v] and is part of LCS
	  				x = middleSnake[0][0],
	  				y = middleSnake[0][1],
	  				u = middleSnake[1][0],
	  				v = middleSnake[1][1],
	  				D = middleSnake[2];
	  
	  			if (D > 1) {
	  				Diff.lcs(startA, x - 1, startB, y - 1);
	  				if (x <= u) {
	  					[].push.apply(lcsAtoms, aA.slice(x, u + 1));
	  				}
	  				lcs(u + 1, endA, v + 1, endB);
	  			} else if (M > N) {
	  				[].push.apply(lcsAtoms, aA.slice(startA, endA + 1));
	  			} else {
	  				[].push.apply(lcsAtoms, aB.slice(startB, endB + 1));
	  			}
	  		}
	  	}
	  	*/
	  // Longest Common Subsequence
	  // @param A - sequence of atoms - Array
	  // @param B - sequence of atoms - Array
	  // @param equals - optional comparator of atoms - returns true or false,
	  //                 if not specified, triple equals operator is used
	  // @returns Array - sequence of atoms, one of LCSs, edit script from A to B
	  static fnLCS(aA, aB, equals) {
	    const toPoint = function(x) {
	      return [
	        x,
	        x - this
	        // eslint-disable-line no-invalid-this
	      ];
	    }, findMidSnake = function(startA, endA, startB, endB) {
	      const iN = endA - startA + 1, iM = endB - startB + 1, max = iN + iM, delta = iN - iM, hhalfMaxCeil = (max + 1) / 2 | 0, oV = {}, oU = {};
	      let overlap, iD;
	      oV[1] = 0;
	      oU[delta - 1] = iN;
	      for (iD = 0; iD <= hhalfMaxCeil; iD += 1) {
	        for (let k = -iD; k <= iD && !overlap; k += 2) {
	          let x;
	          if (k === -iD || k !== iD && oV[k - 1] < oV[k + 1]) {
	            x = oV[k + 1];
	          } else {
	            x = oV[k - 1] + 1;
	          }
	          let y = x - k;
	          if (isNaN(y) || x > iN || y > iM) {
	            continue;
	          }
	          const xx = x;
	          while (x < iN && y < iM && equals(aA[startA + x], aB[startB + y])) {
	            x += 1;
	            y += 1;
	          }
	          oV[k] = x;
	          if ((delta & 1) === 1 && Diff.inRange(k, delta - (iD - 1), delta + (iD - 1))) {
	            if (oV[k] >= oU[k]) {
	              overlap = [
	                xx,
	                x
	              ].map(toPoint, k);
	            }
	          }
	        }
	        let SES;
	        if (overlap) {
	          SES = iD * 2 - 1;
	        }
	        for (let k = -iD; k <= iD && !overlap; k += 2) {
	          const K = k + delta;
	          let x;
	          if (k === iD || k !== -iD && oU[K - 1] < oU[K + 1]) {
	            x = oU[K - 1];
	          } else {
	            x = oU[K + 1] - 1;
	          }
	          let y = x - K;
	          if (isNaN(y) || x < 0 || y < 0) {
	            continue;
	          }
	          const xx = x;
	          while (x > 0 && y > 0 && equals(aA[startA + x - 1], aB[startB + y - 1])) {
	            x -= 1;
	            y -= 1;
	          }
	          oU[K] = x;
	          if (delta % 2 === 0 && Diff.inRange(K, -iD, iD)) {
	            if (oU[K] <= oV[K]) {
	              overlap = [
	                x,
	                xx
	              ].map(toPoint, K);
	            }
	          }
	        }
	        if (overlap) {
	          SES = SES || iD * 2;
	          for (let i = 0; i < 2; i += 1) {
	            for (let j = 0; j < 2; j += 1) {
	              overlap[i][j] += [
	                startA,
	                startB
	              ][j] - i;
	            }
	          }
	          return overlap.concat([
	            SES,
	            (max - SES) / 2
	          ]);
	        }
	      }
	      throw Diff.composeError(Error(), "Programming error in findMidSnake", "", 0);
	    }, lcsAtoms = [], lcs = function(startA, endA, startB, endB) {
	      const N = endA - startA + 1, M = endB - startB + 1;
	      if (N > 0 && M > 0) {
	        const middleSnake = findMidSnake(startA, endA, startB, endB), x = middleSnake[0][0], y = middleSnake[0][1], u = middleSnake[1][0], v = middleSnake[1][1], D = middleSnake[2];
	        if (D > 1) {
	          lcs(startA, x - 1, startB, y - 1);
	          if (x <= u) {
	            [].push.apply(lcsAtoms, aA.slice(x, u + 1));
	          }
	          lcs(u + 1, endA, v + 1, endB);
	        } else if (M > N) {
	          [].push.apply(lcsAtoms, aA.slice(startA, endA + 1));
	        } else {
	          [].push.apply(lcsAtoms, aB.slice(startB, endB + 1));
	        }
	      }
	    };
	    lcs(0, aA.length - 1, 0, aB.length - 1);
	    return lcsAtoms;
	  }
	  // Diff sequence
	  // @param A - sequence of atoms - Array
	  // @param B - sequence of atoms - Array
	  // [@param equals - optional comparator of atoms - returns true or false,
	  //                 if not specified, triple equals operator is used]
	  // @returns Array - sequence of objects in a form of:
	  //   - operation: one of "none", "add", "delete"
	  //   - atom: the atom found in either A or B
	  // Applying operations from diff sequence you should be able to transform A to B
	  static diff(aA, aB) {
	    const diff = [], fnEquals = Diff.fnEquals;
	    let i = 0, j = 0, iN = aA.length, iM = aB.length, iK = 0;
	    while (i < iN && j < iM && fnEquals(aA[i], aB[j])) {
	      i += 1;
	      j += 1;
	    }
	    while (i < iN && j < iM && fnEquals(aA[iN - 1], aB[iM - 1])) {
	      iN -= 1;
	      iM -= 1;
	      iK += 1;
	    }
	    [].push.apply(diff, aA.slice(0, i).map(function(atom2) {
	      return {
	        operation: "none",
	        atom: atom2
	      };
	    }));
	    const lcs = Diff.fnLCS(aA.slice(i, iN), aB.slice(j, iM), fnEquals);
	    for (let k = 0; k < lcs.length; k += 1) {
	      const atom = lcs[k], ni = Diff.customIndexOf(aA, atom, i, fnEquals), nj = Diff.customIndexOf(aB, atom, j, fnEquals);
	      [].push.apply(diff, aA.slice(i, ni).map(function(atom2) {
	        return {
	          operation: "delete",
	          atom: atom2
	        };
	      }));
	      [].push.apply(diff, aB.slice(j, nj).map(function(atom2) {
	        return {
	          operation: "add",
	          atom: atom2
	        };
	      }));
	      diff.push({
	        operation: "none",
	        atom
	      });
	      i = ni + 1;
	      j = nj + 1;
	    }
	    [].push.apply(diff, aA.slice(i, iN).map(function(atom2) {
	      return {
	        operation: "delete",
	        atom: atom2
	      };
	    }));
	    [].push.apply(diff, aB.slice(j, iM).map(function(atom2) {
	      return {
	        operation: "add",
	        atom: atom2
	      };
	    }));
	    [].push.apply(diff, aA.slice(iN, iN + iK).map(function(atom2) {
	      return {
	        operation: "none",
	        atom: atom2
	      };
	    }));
	    return diff;
	  }
	  static testDiff(text1, text2) {
	    const textParts1 = text1.split("\n"), textParts2 = text2.split("\n");
	    let diff = Diff.diff(textParts1, textParts2).map(function(o) {
	      let result = "";
	      if (o.operation === "add") {
	        result = "+ " + o.atom;
	      } else if (o.operation === "delete") {
	        result = "- " + o.atom;
	      }
	      return result;
	    }).join("\n");
	    diff = diff.replace(/\n\n+/g, "\n");
	    return diff;
	  }
	}

	const _DiskImage = class _DiskImage {
	  constructor(options) {
	    this.diskInfo = _DiskImage.getInitialDiskInfo();
	    this.options = {
	      data: "",
	      quiet: false
	    };
	    this.setOptions(options);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    const currentData = this.options.data;
	    Object.assign(this.options, options);
	    if (this.options.data !== currentData) {
	      this.diskInfo.ident = "";
	      this.diskInfo.trackInfo.ident = "";
	    }
	  }
	  static getInitialDiskInfo() {
	    const diskInfo = {
	      ident: "",
	      creator: "",
	      tracks: 0,
	      heads: 0,
	      trackSize: 0,
	      trackInfo: {
	        ident: "",
	        sectorInfoList: []
	      },
	      trackSizes: [],
	      trackInfoPosList: [],
	      extended: false
	    };
	    return diskInfo;
	  }
	  getFormatDescriptor() {
	    const formatDescriptor = this.formatDescriptor;
	    if (!formatDescriptor) {
	      throw this.composeError(Error(), "getFormatDescriptor: formatDescriptor:", String(formatDescriptor));
	    }
	    return formatDescriptor;
	  }
	  composeError(error, message, value, pos) {
	    const len = 0;
	    return Utils.composeError("DiskImage", error, this.options.diskName + ": " + message, value, pos || 0, len);
	  }
	  static testDiskIdent(ident) {
	    const diskType = _DiskImage.diskInfoIdentMap[ident] || 0;
	    return diskType;
	  }
	  readUtf(pos, len) {
	    const out = this.options.data.substring(pos, pos + len);
	    if (out.length !== len) {
	      throw this.composeError(new Error(), "End of File", "", pos);
	    }
	    return out;
	  }
	  readUInt8(pos) {
	    const num = this.options.data.charCodeAt(pos);
	    if (isNaN(num)) {
	      throw this.composeError(new Error(), "End of File", String(num), pos);
	    }
	    return num;
	  }
	  readUInt16(pos) {
	    return this.readUInt8(pos) + this.readUInt8(pos + 1) * 256;
	  }
	  static uInt8ToString(value) {
	    return String.fromCharCode(value);
	  }
	  static uInt16ToString(value) {
	    return _DiskImage.uInt8ToString(value & 255) + _DiskImage.uInt8ToString(value >> 8 & 255);
	  }
	  static uInt24ToString(value) {
	    return _DiskImage.uInt16ToString(value & 65535) + _DiskImage.uInt8ToString(value >> 16);
	  }
	  readDiskInfo(diskInfo, pos) {
	    const ident = this.readUtf(pos, 8), diskType = _DiskImage.testDiskIdent(ident);
	    if (!diskType) {
	      throw this.composeError(Error(), "Ident not found", ident, pos);
	    }
	    diskInfo.extended = diskType === 2;
	    diskInfo.ident = ident + this.readUtf(pos + 8, 34 - 8);
	    if (diskInfo.ident.substring(34 - 11, 34 - 11 + 9) !== "Disk-Info") {
	      if (!this.options.quiet) {
	        Utils.console.warn(this.composeError({}, "Disk ident not found", diskInfo.ident.substring(34 - 11, 34 - 11 + 9), pos + 34 - 11).message);
	      }
	    }
	    diskInfo.creator = this.readUtf(pos + 34, 14);
	    diskInfo.tracks = this.readUInt8(pos + 48);
	    diskInfo.heads = this.readUInt8(pos + 49);
	    diskInfo.trackSize = this.readUInt16(pos + 50);
	    const trackSizes = [], trackInfoPosList = [], trackSizeCount = diskInfo.tracks * diskInfo.heads;
	    let trackInfoPos = _DiskImage.diskInfoSize;
	    pos += 52;
	    for (let i = 0; i < trackSizeCount; i += 1) {
	      trackInfoPosList.push(trackInfoPos);
	      const trackSize = diskInfo.trackSize || this.readUInt8(pos + i) * 256;
	      trackSizes.push(trackSize);
	      trackInfoPos += trackSize;
	    }
	    diskInfo.trackSizes = trackSizes;
	    diskInfo.trackInfoPosList = trackInfoPosList;
	    diskInfo.trackInfo.ident = "";
	    if (Utils.debug > 1) {
	      Utils.console.debug("readDiskInfo: extended=" + diskInfo.extended + ", tracks=" + diskInfo.tracks + ", heads=" + diskInfo.heads + ", trackSize=" + diskInfo.trackSize);
	    }
	  }
	  static createDiskInfoAsString(diskInfo) {
	    const diskInfoString = diskInfo.ident + diskInfo.creator + _DiskImage.uInt8ToString(diskInfo.tracks) + _DiskImage.uInt8ToString(diskInfo.heads) + _DiskImage.uInt16ToString(diskInfo.trackSize) + _DiskImage.uInt8ToString(0).repeat(204);
	    return diskInfoString;
	  }
	  readTrackInfo(trackInfo, pos) {
	    const trackInfoSize = _DiskImage.trackInfoSize, sectorInfoList = trackInfo.sectorInfoList, trackDataPos = pos + trackInfoSize;
	    trackInfo.ident = this.readUtf(pos, 12);
	    if (trackInfo.ident.substring(0, 10) !== "Track-Info") {
	      if (!this.options.quiet) {
	        Utils.console.warn(this.composeError({}, "Track ident not found", trackInfo.ident.substring(0, 10), pos).message);
	      }
	    }
	    trackInfo.track = this.readUInt8(pos + 16);
	    trackInfo.head = this.readUInt8(pos + 17);
	    trackInfo.dataRate = this.readUInt8(pos + 18);
	    trackInfo.recMode = this.readUInt8(pos + 19);
	    trackInfo.bps = this.readUInt8(pos + 20);
	    trackInfo.spt = this.readUInt8(pos + 21);
	    trackInfo.gap3 = this.readUInt8(pos + 22);
	    trackInfo.fill = this.readUInt8(pos + 23);
	    sectorInfoList.length = trackInfo.spt;
	    const sectorNum2Index = {};
	    trackInfo.sectorNum2Index = sectorNum2Index;
	    pos += 24;
	    let sectorPos = trackDataPos;
	    for (let i = 0; i < trackInfo.spt; i += 1) {
	      const sectorInfo = sectorInfoList[i] || {};
	      sectorInfoList[i] = sectorInfo;
	      sectorInfo.dataPos = sectorPos;
	      sectorInfo.track = this.readUInt8(pos);
	      sectorInfo.head = this.readUInt8(pos + 1);
	      sectorInfo.sector = this.readUInt8(pos + 2);
	      sectorInfo.bps = this.readUInt8(pos + 3);
	      sectorInfo.state1 = this.readUInt8(pos + 4);
	      sectorInfo.state2 = this.readUInt8(pos + 5);
	      const sectorSize = this.readUInt16(pos + 6) || 128 << trackInfo.bps;
	      sectorInfo.sectorSize = sectorSize;
	      sectorPos += sectorSize;
	      sectorNum2Index[sectorInfo.sector] = i;
	      pos += 8;
	    }
	  }
	  static createTrackInfoAsString(trackInfo) {
	    const sectorInfoList = trackInfo.sectorInfoList;
	    let trackInfoString = trackInfo.ident + _DiskImage.uInt8ToString(0).repeat(4) + _DiskImage.uInt8ToString(trackInfo.track) + _DiskImage.uInt8ToString(trackInfo.head) + _DiskImage.uInt8ToString(trackInfo.dataRate) + _DiskImage.uInt8ToString(trackInfo.recMode) + _DiskImage.uInt8ToString(trackInfo.bps) + _DiskImage.uInt8ToString(trackInfo.spt) + _DiskImage.uInt8ToString(trackInfo.gap3) + _DiskImage.uInt8ToString(trackInfo.fill);
	    for (let i = 0; i < trackInfo.spt; i += 1) {
	      const sectorInfo = sectorInfoList[i], sectorinfoString = _DiskImage.uInt8ToString(sectorInfo.track) + _DiskImage.uInt8ToString(sectorInfo.head) + _DiskImage.uInt8ToString(sectorInfo.sector) + _DiskImage.uInt8ToString(sectorInfo.bps) + _DiskImage.uInt8ToString(sectorInfo.state1) + _DiskImage.uInt8ToString(sectorInfo.state2) + _DiskImage.uInt16ToString(0);
	      trackInfoString += sectorinfoString;
	    }
	    trackInfoString += _DiskImage.uInt8ToString(0).repeat(_DiskImage.trackInfoSize - trackInfoString.length);
	    return trackInfoString;
	  }
	  seekTrack(diskInfo, track, head) {
	    if (!diskInfo.ident) {
	      this.readDiskInfo(diskInfo, 0);
	    }
	    const trackInfo = diskInfo.trackInfo;
	    if (trackInfo.ident && trackInfo.track === track && trackInfo.head === head) {
	      return;
	    }
	    const trackInfoPos = diskInfo.trackInfoPosList[track * diskInfo.heads + head];
	    if (trackInfoPos === void 0) {
	      throw this.composeError(new Error(), "Track not found", String(track));
	    }
	    this.readTrackInfo(trackInfo, trackInfoPos);
	  }
	  static sectorNum2Index(trackInfo, sector) {
	    const sectorIndex = trackInfo.sectorNum2Index[sector];
	    return sectorIndex;
	  }
	  static seekSector(sectorInfoList, sectorIndex) {
	    return sectorInfoList[sectorIndex];
	  }
	  readSector(trackInfo, sector) {
	    const sectorIndex = _DiskImage.sectorNum2Index(trackInfo, sector);
	    if (sectorIndex === void 0) {
	      throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
	    }
	    const sectorInfo = _DiskImage.seekSector(trackInfo.sectorInfoList, sectorIndex), out = this.readUtf(sectorInfo.dataPos, sectorInfo.sectorSize);
	    return out;
	  }
	  writeSector(trackInfo, sector, sectorData) {
	    const sectorIndex = _DiskImage.sectorNum2Index(trackInfo, sector);
	    if (sectorIndex === void 0) {
	      throw this.composeError(Error(), "Track " + trackInfo.track + ": Sector not found", String(sector), 0);
	    }
	    const sectorInfo = _DiskImage.seekSector(trackInfo.sectorInfoList, sectorIndex), data = this.options.data;
	    if (sectorData.length !== sectorInfo.sectorSize) {
	      Utils.console.error(this.composeError({}, "sectordata.length " + sectorData.length + " <> sectorSize " + sectorInfo.sectorSize, String(0)));
	    }
	    this.options.data = data.substring(0, sectorInfo.dataPos) + sectorData + data.substring(sectorInfo.dataPos + sectorInfo.sectorSize);
	  }
	  // ...
	  composeFormatDescriptor(format) {
	    const derivedFormatDescriptor = _DiskImage.formatDescriptors[format];
	    if (!derivedFormatDescriptor) {
	      throw this.composeError(Error(), "Unknown format", format);
	    }
	    let formatDescriptor;
	    if (derivedFormatDescriptor.parentRef) {
	      const parentFormatDescriptor = this.composeFormatDescriptor(derivedFormatDescriptor.parentRef);
	      formatDescriptor = Object.assign({}, parentFormatDescriptor, derivedFormatDescriptor);
	    } else {
	      formatDescriptor = Object.assign({}, derivedFormatDescriptor);
	    }
	    return formatDescriptor;
	  }
	  determineFormat(diskInfo) {
	    const trackInfo = diskInfo.trackInfo, track = 0, head = 0;
	    this.seekTrack(diskInfo, track, head);
	    let firstSector = 255;
	    for (let i = 0; i < trackInfo.spt; i += 1) {
	      const sector = trackInfo.sectorInfoList[i].sector;
	      if (sector < firstSector) {
	        firstSector = sector;
	      }
	    }
	    let format = "";
	    if (firstSector === 193) {
	      format = "data";
	    } else if (firstSector === 65) {
	      format = "system";
	    } else if (firstSector === 145 && diskInfo.tracks === 80) {
	      format = "parados80";
	    } else if (firstSector === 1 && diskInfo.tracks === 80) {
	      format = "big780k";
	    } else {
	      throw this.composeError(Error(), "Unknown format with sector", String(firstSector));
	    }
	    if (diskInfo.heads > 1) {
	      format += _DiskImage.twoHeads;
	    }
	    if (Utils.debug > 1) {
	      Utils.console.debug("determineFormat: format=", format);
	    }
	    return format;
	  }
	  createImage(format) {
	    const formatDescriptor = this.composeFormatDescriptor(format), sectorInfoList = [], sectorSize = 128 << formatDescriptor.bps, sectorInfo = {
	      track: 0,
	      head: 0,
	      sector: 0,
	      bps: formatDescriptor.bps,
	      state1: 0,
	      state2: 0,
	      sectorSize,
	      dataPos: 0
	    }, trackInfo = {
	      ident: "Track-Info\r\n",
	      track: 0,
	      head: 0,
	      dataRate: 0,
	      recMode: 0,
	      bps: formatDescriptor.bps,
	      spt: formatDescriptor.spt,
	      gap3: formatDescriptor.gap3,
	      fill: formatDescriptor.fill,
	      sectorInfoList,
	      sectorNum2Index: {}
	    }, diskInfo = {
	      ident: "MV - CPCEMU Disk-File\r\nDisk-Info\r\n",
	      // 34
	      creator: (this.options.creator || "CpcBasicTS").padEnd(14, " "),
	      // 14
	      tracks: formatDescriptor.tracks,
	      heads: formatDescriptor.heads,
	      trackSize: _DiskImage.trackInfoSize + formatDescriptor.spt * sectorSize,
	      // eslint-disable-line no-bitwise
	      trackInfo,
	      trackSizes: [],
	      // only for extended DSK format
	      trackInfoPosList: [],
	      extended: false
	    }, emptySectorData = _DiskImage.uInt8ToString(formatDescriptor.fill).repeat(sectorSize);
	    for (let i = 0; i < trackInfo.spt; i += 1) {
	      const sectorInfoClone = {
	        ...sectorInfo
	      };
	      sectorInfoClone.sector = formatDescriptor.firstSector + i;
	      trackInfo.sectorNum2Index[sectorInfoClone.sector] = i;
	      sectorInfoList.push(sectorInfoClone);
	    }
	    let image = _DiskImage.createDiskInfoAsString(diskInfo), trackInfoPos = _DiskImage.diskInfoSize;
	    for (let track = 0; track < formatDescriptor.tracks; track += 1) {
	      for (let head = 0; head < formatDescriptor.heads; head += 1) {
	        trackInfo.track = track;
	        trackInfo.head = head;
	        diskInfo.trackInfoPosList.push(trackInfoPos);
	        for (let sector = 0; sector < trackInfo.spt; sector += 1) {
	          const sectorInfo2 = sectorInfoList[sector];
	          sectorInfo2.track = track;
	          sectorInfo2.head = head;
	          sectorInfo2.dataPos = trackInfoPos + _DiskImage.trackInfoSize + sector * sectorInfo2.sectorSize;
	        }
	        const trackAsString = _DiskImage.createTrackInfoAsString(trackInfo);
	        image += trackAsString;
	        for (let sector = 0; sector < formatDescriptor.spt; sector += 1) {
	          image += emptySectorData;
	        }
	        trackInfoPos += diskInfo.trackSize;
	      }
	    }
	    this.diskInfo = diskInfo;
	    this.formatDescriptor = formatDescriptor;
	    return image;
	  }
	  formatImage(format) {
	    const image = this.createImage(format);
	    this.options.data = image;
	    return image;
	  }
	  static fnRemoveHighBit7(str) {
	    let out = "";
	    for (let i = 0; i < str.length; i += 1) {
	      const char = str.charCodeAt(i);
	      out += String.fromCharCode(char & 127);
	    }
	    return out;
	  }
	  readDirectoryExtents(extents, pos, endPos) {
	    while (pos < endPos) {
	      const extent = {
	        user: this.readUInt8(pos),
	        name: this.readUtf(pos + 1, 8),
	        ext: this.readUtf(pos + 9, 3),
	        // extension with flags
	        extent: this.readUInt8(pos + 12),
	        lastRecBytes: this.readUInt8(pos + 13),
	        extentHi: this.readUInt8(pos + 14),
	        // used for what?
	        records: this.readUInt8(pos + 15),
	        blocks: []
	      };
	      pos += 16;
	      const blocks = extent.blocks;
	      for (let i = 0; i < 16; i += 1) {
	        const block = this.readUInt8(pos + i);
	        blocks.push(block);
	      }
	      pos += 16;
	      extents.push(extent);
	    }
	    return extents;
	  }
	  static createDirectoryExtentAsString(extent) {
	    let extentString = _DiskImage.uInt8ToString(extent.user) + extent.name + extent.ext + _DiskImage.uInt8ToString(extent.extent) + _DiskImage.uInt8ToString(extent.lastRecBytes) + _DiskImage.uInt8ToString(extent.extentHi) + _DiskImage.uInt8ToString(extent.records), blockString = "";
	    for (let i = 0; i < extent.blocks.length; i += 1) {
	      blockString += _DiskImage.uInt8ToString(extent.blocks[i]);
	    }
	    extentString += blockString;
	    return extentString;
	  }
	  static createSeveralDirectoryExtentsAsString(extents, first, last) {
	    let extentString = "";
	    for (let i = first; i < last; i += 1) {
	      extentString += _DiskImage.createDirectoryExtentAsString(extents[i]);
	    }
	    return extentString;
	  }
	  static fnSortByExtentNumber(a, b) {
	    return a.extent - b.extent;
	  }
	  // do not know if we need to sort the extents per file, but...
	  static sortFileExtents(dir) {
	    for (const name in dir) {
	      if (dir.hasOwnProperty(name)) {
	        const fileExtents = dir[name];
	        fileExtents.sort(_DiskImage.fnSortByExtentNumber);
	      }
	    }
	  }
	  static prepareDirectoryList(extents, fill, reFilePattern) {
	    const dir = {};
	    for (let i = 0; i < extents.length; i += 1) {
	      const extent = extents[i];
	      if (fill === null || extent.user !== fill) {
	        const name = _DiskImage.fnRemoveHighBit7(extent.name) + "." + _DiskImage.fnRemoveHighBit7(extent.ext);
	        if (!reFilePattern || reFilePattern.test(name)) {
	          if (!(name in dir)) {
	            dir[name] = [];
	          }
	          dir[name].push(extent);
	        }
	      }
	    }
	    _DiskImage.sortFileExtents(dir);
	    return dir;
	  }
	  static convertBlock2Sector(formatDescriptor, block) {
	    const spt = formatDescriptor.spt, blockSectors = formatDescriptor.bls / 512, logSec = block * blockSectors, pos = {
	      track: Math.floor(logSec / spt) + formatDescriptor.off,
	      head: 0,
	      // currently always 0
	      sector: logSec % spt + formatDescriptor.firstSector
	    };
	    return pos;
	  }
	  readAllDirectoryExtents(diskInfo, formatDescriptor, extents) {
	    const directorySectors = 4, off = formatDescriptor.off, firstSector = formatDescriptor.firstSector, trackInfo = diskInfo.trackInfo, sectorInfoList = trackInfo.sectorInfoList;
	    this.seekTrack(diskInfo, off, 0);
	    for (let i = 0; i < directorySectors; i += 1) {
	      const sectorIndex = _DiskImage.sectorNum2Index(trackInfo, firstSector + i);
	      if (sectorIndex === void 0) {
	        throw this.composeError(Error(), "Cannot read directory at track " + off + " sector", String(firstSector));
	      }
	      const sectorInfo = _DiskImage.seekSector(sectorInfoList, sectorIndex);
	      this.readDirectoryExtents(extents, sectorInfo.dataPos, sectorInfo.dataPos + sectorInfo.sectorSize);
	    }
	    return extents;
	  }
	  writeAllDirectoryExtents(diskInfo, formatDescriptor, extents) {
	    const directoryBlocks = 2, extentsPerBlock = extents.length / directoryBlocks;
	    for (let i = 0; i < directoryBlocks; i += 1) {
	      const blockData = _DiskImage.createSeveralDirectoryExtentsAsString(extents, i * extentsPerBlock, (i + 1) * extentsPerBlock);
	      this.writeBlock(diskInfo, formatDescriptor, i, blockData);
	    }
	  }
	  readDirectory() {
	    const diskInfo = this.diskInfo, format = this.determineFormat(diskInfo), formatDescriptor = this.composeFormatDescriptor(format), extents = [];
	    this.formatDescriptor = formatDescriptor;
	    this.readAllDirectoryExtents(diskInfo, formatDescriptor, extents);
	    return _DiskImage.prepareDirectoryList(extents, this.formatDescriptor.fill);
	  }
	  static nextSector(formatDescriptor, pos) {
	    pos.sector += 1;
	    if (pos.sector >= formatDescriptor.firstSector + formatDescriptor.spt) {
	      pos.track += 1;
	      pos.sector = formatDescriptor.firstSector;
	    }
	  }
	  readBlock(diskInfo, formatDescriptor, block) {
	    const blockSectors = formatDescriptor.bls / 512, pos = _DiskImage.convertBlock2Sector(formatDescriptor, block);
	    let out = "";
	    if (pos.track >= diskInfo.tracks) {
	      Utils.console.error(this.composeError({}, "Block " + block + ": Track out of range", String(pos.track)));
	    }
	    if (pos.head >= diskInfo.heads) {
	      Utils.console.error(this.composeError({}, "Block " + block + ": Head out of range", String(pos.track)));
	    }
	    for (let i = 0; i < blockSectors; i += 1) {
	      this.seekTrack(diskInfo, pos.track, pos.head);
	      out += this.readSector(diskInfo.trackInfo, pos.sector);
	      _DiskImage.nextSector(formatDescriptor, pos);
	    }
	    return out;
	  }
	  writeBlock(diskInfo, formatDescriptor, block, blockData) {
	    const blockSectors = formatDescriptor.bls / 512, sectorSize = 128 << formatDescriptor.bps, pos = _DiskImage.convertBlock2Sector(formatDescriptor, block);
	    if (pos.track >= diskInfo.tracks) {
	      Utils.console.error(this.composeError({}, "Block " + block + ": Track out of range", String(pos.track)));
	    }
	    if (pos.head >= diskInfo.heads) {
	      Utils.console.error(this.composeError({}, "Block " + block + ": Head out of range", String(pos.track)));
	    }
	    if (blockData.length !== blockSectors * sectorSize) {
	      Utils.console.error(this.composeError({}, "blockData.length " + blockData.length + " <> blockSize " + blockSectors * sectorSize, String(0)));
	    }
	    for (let i = 0; i < blockSectors; i += 1) {
	      this.seekTrack(diskInfo, pos.track, pos.head);
	      const sectorData = blockData.substring(i * sectorSize, (i + 1) * sectorSize);
	      this.writeSector(diskInfo.trackInfo, pos.sector, sectorData);
	      _DiskImage.nextSector(formatDescriptor, pos);
	    }
	  }
	  readExtents(diskInfo, formatDescriptor, fileExtents) {
	    const recPerBlock = formatDescriptor.bls / 128;
	    let out = "";
	    for (let i = 0; i < fileExtents.length; i += 1) {
	      const extent = fileExtents[i], blocks = extent.blocks;
	      let records = extent.records;
	      if (extent.extent > 0) {
	        if (recPerBlock > 8) {
	          records += extent.extent * 128;
	        }
	      }
	      for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
	        let block = this.readBlock(diskInfo, formatDescriptor, blocks[blockIndex]);
	        if (records < recPerBlock) {
	          block = block.substring(0, 128 * records);
	        }
	        out += block;
	        records -= recPerBlock;
	        if (records <= 0) {
	          break;
	        }
	      }
	    }
	    return out;
	  }
	  readFile(fileExtents) {
	    const diskInfo = this.diskInfo, formatDescriptor = this.getFormatDescriptor();
	    let out = this.readExtents(diskInfo, formatDescriptor, fileExtents);
	    const header = _DiskImage.parseAmsdosHeader(out);
	    let realLen;
	    if (header) {
	      const amsdosHeaderLength = 128;
	      realLen = header.length + amsdosHeaderLength;
	    }
	    if (realLen === void 0) {
	      const fileLen = out.length, lastRecPos = fileLen > 128 ? fileLen - 128 : 0, index = out.indexOf(String.fromCharCode(26), lastRecPos);
	      if (index >= 0) {
	        realLen = index;
	        if (Utils.debug > 0) {
	          Utils.console.debug("readFile: ASCII file length " + fileLen + " truncated to " + realLen);
	        }
	      }
	    }
	    if (realLen !== void 0) {
	      out = out.substring(0, realLen);
	    }
	    return out;
	  }
	  static getFreeExtents(extents, fill) {
	    const freeExtents = [];
	    for (let i = 0; i < extents.length; i += 1) {
	      if (extents[i].user === fill) {
	        freeExtents.push(i);
	      }
	    }
	    return freeExtents;
	  }
	  static getBlockMask(extents, fill, dsm, al0, al1) {
	    const blockMask = [];
	    for (let i = 0; i < dsm - 1; i += 1) {
	      blockMask[i] = false;
	    }
	    let mask = 128;
	    for (let i = 0; i < 8; i += 1) {
	      if (al0 & mask) {
	        blockMask[i] = true;
	      }
	      mask >>= 1;
	    }
	    mask = 128;
	    for (let i = 8; i < 16; i += 1) {
	      if (al1 & mask) {
	        blockMask[i] = true;
	      }
	      mask >>= 1;
	    }
	    for (let i = 0; i < extents.length; i += 1) {
	      const extent = extents[i], blockList = extent.blocks;
	      if (extent.user !== fill) {
	        for (let blockindex = 0; blockindex < blockList.length; blockindex += 1) {
	          const block = blockList[blockindex];
	          if (block) {
	            if (blockMask[block]) {
	              Utils.console.warn("getBlockMask: Block number already in use: ", block);
	            }
	            blockMask[block] = true;
	          } else {
	            break;
	          }
	        }
	      }
	    }
	    return blockMask;
	  }
	  static getFreeBlocks(blockMask, dsm) {
	    const freeBlocks = [];
	    for (let i = 0; i < dsm; i += 1) {
	      if (!blockMask[i]) {
	        freeBlocks.push(i);
	      }
	    }
	    return freeBlocks;
	  }
	  static getFilenameAndExtension(filename) {
	    let [name1, ext1] = filename.split(".");
	    name1 = name1.substring(0, 8).toUpperCase().padEnd(8, " ");
	    ext1 = ext1.substring(0, 3).toUpperCase().padEnd(3, " ");
	    return [name1, ext1];
	  }
	  writeFile(filename, data) {
	    const diskInfo = this.diskInfo, formatDescriptor = this.getFormatDescriptor(), extents = [];
	    this.readAllDirectoryExtents(diskInfo, formatDescriptor, extents);
	    const fill = formatDescriptor.fill, freeExtents = _DiskImage.getFreeExtents(extents, formatDescriptor.fill), sectors = (formatDescriptor.tracks - formatDescriptor.off) * formatDescriptor.spt, ssize = 128 << formatDescriptor.bps, dsm = sectors * ssize / formatDescriptor.bls | 0, al0 = formatDescriptor.al0, al1 = formatDescriptor.al1, blockMask = _DiskImage.getBlockMask(extents, fill, dsm, al0, al1), freeBlocks = _DiskImage.getFreeBlocks(blockMask, dsm);
	    if (Utils.debug > 0) {
	      Utils.console.debug("writeFile: freeExtents=", freeExtents.length, ", freeBlocks=", freeBlocks);
	    }
	    if (!freeBlocks.length) {
	      Utils.console.warn("writeFile: " + filename + ": No space left!");
	      return false;
	    }
	    if (!freeExtents.length) {
	      Utils.console.warn("writeFile: " + filename + ": Directory full!");
	      return false;
	    }
	    const [name1, ext1] = _DiskImage.getFilenameAndExtension(filename), fileSize = data.length, bls = formatDescriptor.bls, requiredBlocks = (fileSize + bls - 1) / bls | 0;
	    if (requiredBlocks > freeBlocks.length) {
	      const requiredKB = requiredBlocks * bls / 1024 | 0, freeKB = freeBlocks.length * bls / 1024 | 0;
	      Utils.console.warn("writeFile: " + filename + ": Not enough space left (" + requiredKB + "K > " + freeKB + "K). Ignoring.");
	      return false;
	    }
	    const blocksPerExtent = 16, requiredExtents = (requiredBlocks + blocksPerExtent - 1) / blocksPerExtent | 0;
	    if (requiredExtents > freeExtents.length) {
	      Utils.console.warn("writeFile: " + filename + ": Directory full!");
	      return false;
	    }
	    let size = fileSize, extent, extentCnt = 0, blockCnt = 0;
	    while (size > 0) {
	      if (!extent || blockCnt >= 16) {
	        const records = (size + 128 - 1) / 128 | 0;
	        extent = extents[freeExtents[extentCnt]];
	        extent.user = 0;
	        extent.name = name1;
	        extent.ext = ext1;
	        extent.extent = extentCnt;
	        extent.lastRecBytes = 0;
	        extent.extentHi = 0;
	        extent.records = records > 128 ? 128 : records;
	        extent.blocks.length = 0;
	        for (let i = 0; i < 16; i += 1) {
	          extent.blocks[i] = 0;
	        }
	        extentCnt += 1;
	        blockCnt = 0;
	      }
	      const thisSize = size > bls ? bls : size;
	      let dataChunk = data.substring(fileSize - size, fileSize - size + thisSize);
	      if (thisSize < bls) {
	        dataChunk += _DiskImage.uInt8ToString(26);
	        const remain = bls - thisSize - 1;
	        dataChunk += _DiskImage.uInt8ToString(formatDescriptor.fill).repeat(remain);
	      }
	      const block = freeBlocks[(extentCnt - 1) * 16 + blockCnt];
	      this.writeBlock(diskInfo, formatDescriptor, block, dataChunk);
	      extent.blocks[blockCnt] = block;
	      blockCnt += 1;
	      size -= thisSize;
	    }
	    this.writeAllDirectoryExtents(diskInfo, formatDescriptor, extents);
	    return true;
	  }
	  static isSectorEmpty(data, index, size, fill) {
	    const endIndex = index + size <= data.length ? index + size : data.length - index;
	    let isEmpty = true;
	    for (let i = index; i < endIndex; i += 1) {
	      if (data.charCodeAt(i) !== fill) {
	        isEmpty = false;
	        break;
	      }
	    }
	    return isEmpty;
	  }
	  stripEmptyTracks() {
	    const diskInfo = this.diskInfo, format = this.determineFormat(diskInfo), formatDescriptor = this.composeFormatDescriptor(format), tracks = diskInfo.tracks, firstDataTrack = formatDescriptor.off, head = 0;
	    let data = this.options.data;
	    this.formatDescriptor = formatDescriptor;
	    for (let track = firstDataTrack; track < tracks; track += 1) {
	      this.seekTrack(diskInfo, track, head);
	      const trackInfo = diskInfo.trackInfo, fill = diskInfo.trackInfo.fill, sectorInfoList = trackInfo.sectorInfoList;
	      let isEmpty = true;
	      for (let i = 0; i < trackInfo.spt; i += 1) {
	        const sectorInfo = sectorInfoList[i];
	        if (!_DiskImage.isSectorEmpty(data, sectorInfo.dataPos, sectorInfo.sectorSize, fill)) {
	          isEmpty = false;
	          break;
	        }
	      }
	      if (isEmpty) {
	        diskInfo.tracks = track;
	        const trackDataPos = sectorInfoList[0].dataPos;
	        data = _DiskImage.createDiskInfoAsString(diskInfo) + data.substring(_DiskImage.diskInfoSize, trackDataPos - _DiskImage.trackInfoSize);
	        this.options.data = data;
	        break;
	      }
	    }
	    return data;
	  }
	  /* eslint-enable array-element-newline */
	  static unOrProtectData(data) {
	    const table1 = _DiskImage.protectTable[0], table2 = _DiskImage.protectTable[1];
	    let out = "";
	    for (let i = 0; i < data.length; i += 1) {
	      let byte = data.charCodeAt(i);
	      byte ^= table1[(i & 127) % table1.length] ^ table2[(i & 127) % table2.length];
	      out += String.fromCharCode(byte);
	    }
	    return out;
	  }
	  // ...
	  static computeChecksum(data) {
	    let sum = 0;
	    for (let i = 0; i < data.length; i += 1) {
	      sum += data.charCodeAt(i);
	    }
	    return sum;
	  }
	  static hasAmsdosHeader(data) {
	    let hasHeader = false;
	    if (data.length >= 128) {
	      const computed = _DiskImage.computeChecksum(data.substring(0, 66)), sum = data.charCodeAt(67) + data.charCodeAt(68) * 256;
	      hasHeader = computed === sum;
	    }
	    return hasHeader;
	  }
	  static parseAmsdosHeader(data) {
	    const typeMap = {
	      0: "T",
	      // tokenized BASIC (T=not official)
	      1: "P",
	      // protected BASIC (also tokenized)
	      2: "B",
	      // Binary
	      8: "G",
	      // GENA3 Assember (G=not official)
	      22: "A"
	      // ASCII
	    };
	    let header;
	    if (_DiskImage.hasAmsdosHeader(data)) {
	      header = {
	        user: data.charCodeAt(0),
	        name: data.substring(1, 1 + 8),
	        ext: data.substring(9, 9 + 3),
	        typeNumber: data.charCodeAt(18),
	        start: data.charCodeAt(21) + data.charCodeAt(22) * 256,
	        pseudoLen: data.charCodeAt(24) + data.charCodeAt(25) * 256,
	        entry: data.charCodeAt(26) + data.charCodeAt(27) * 256,
	        length: data.charCodeAt(64) + data.charCodeAt(65) * 256 + data.charCodeAt(66) * 65536,
	        typeString: ""
	      };
	      header.typeString = typeMap[header.typeNumber] || typeMap[16];
	    }
	    return header;
	  }
	  static combineAmsdosHeader(header) {
	    const typeMap = {
	      T: 0,
	      // tokenized BASIC (T=not official)
	      P: 1,
	      // protected BASIC
	      B: 2,
	      // Binary
	      G: 8,
	      // GENA3 Assember (G=not official)
	      A: 22
	      // ASCII
	    };
	    let type = header.typeNumber;
	    if (header.typeString) {
	      type = typeMap[header.typeString];
	      if (type === void 0) {
	        type = typeMap.A;
	      }
	    }
	    let length = header.pseudoLen || header.length;
	    if (length > 65535) {
	      length = 65535;
	    }
	    const data1 = _DiskImage.uInt8ToString(header.user || 0) + (header.name || "").padEnd(8, " ") + (header.ext || "").padEnd(3, " ") + _DiskImage.uInt16ToString(0) + _DiskImage.uInt16ToString(0) + _DiskImage.uInt8ToString(0) + _DiskImage.uInt8ToString(0) + _DiskImage.uInt8ToString(type) + _DiskImage.uInt16ToString(0) + _DiskImage.uInt16ToString(header.start || 0) + _DiskImage.uInt8ToString(0) + _DiskImage.uInt16ToString(length) + _DiskImage.uInt16ToString(header.entry || 0) + "\0".repeat(36) + _DiskImage.uInt24ToString(header.length), checksum = _DiskImage.computeChecksum(data1), data = data1 + _DiskImage.uInt16ToString(checksum) + "\0".repeat(59);
	    return data;
	  }
	  static createAmsdosHeader(parameter) {
	    const header = {
	      user: 0,
	      name: "",
	      ext: "",
	      typeNumber: 0,
	      start: 0,
	      pseudoLen: 0,
	      entry: 0,
	      length: 0,
	      typeString: "",
	      ...parameter
	    };
	    return header;
	  }
	};
	_DiskImage.twoHeads = "2h";
	_DiskImage.formatDescriptors = {
	  data: {
	    tracks: 40,
	    // number of tracks (1-85)
	    heads: 1,
	    // number of heads/sides (1-2)
	    // head: 0, // head number?
	    bps: 2,
	    // Bytes per Sector (1-5)
	    spt: 9,
	    // Sectors per Track (1-18)
	    gap3: 78,
	    // gap between ID and data
	    fill: 229,
	    // filler byte
	    firstSector: 193,
	    // first sector number
	    bls: 1024,
	    // BLS: data block allocaton size (1024, 2048, 4096, 8192, 16384)
	    // bsh: 3, // log2 BLS - 7
	    // blm: 7, // BLS / 128 - 1
	    al0: 192,
	    // bit significant representation of reserved directory blocks 0..7 (0x80=0, 0xc00=0 and 1,,...)
	    al1: 0,
	    // bit significant representation of reserved directory blocks 8..15 (0x80=8,...)
	    off: 0
	    // number of reserved tracks (also the track where the directory starts)
	  },
	  data42t: {
	    parentRef: "data",
	    tracks: 42
	  },
	  // double sided data
	  data2h: {
	    parentRef: "data",
	    heads: 2
	  },
	  system: {
	    parentRef: "data",
	    firstSector: 65,
	    off: 2
	  },
	  // double sided system
	  system2h: {
	    parentRef: "system",
	    heads: 2
	  },
	  vortex: {
	    parentRef: "data",
	    tracks: 80,
	    heads: 2,
	    firstSector: 1
	  },
	  "3dos": {
	    parentRef: "data",
	    firstSector: 0
	  },
	  parados80: {
	    // 396K (https://www.cpcwiki.eu/imgs/0/0d/Parados.pdf)
	    parentRef: "data",
	    tracks: 80,
	    firstSector: 145,
	    spt: 10,
	    bls: 2048
	  },
	  big780k: {
	    parentRef: "data",
	    al0: 128,
	    // block 0 reserved
	    tracks: 80,
	    off: 1,
	    firstSector: 1
	  },
	  big780k2h: {
	    parentRef: "big780k",
	    heads: 2
	  }
	};
	_DiskImage.diskInfoIdentMap = {
	  "MV - CPC": 1,
	  EXTENDED: 2
	};
	_DiskImage.diskInfoSize = 256;
	_DiskImage.trackInfoSize = 256;
	// ...
	// see AMSDOS ROM, &D252
	/* eslint-disable array-element-newline */
	_DiskImage.protectTable = [
	  [226, 157, 219, 26, 66, 41, 57, 198, 179, 198, 144, 69, 138],
	  // 13 bytes
	  [73, 177, 54, 240, 46, 30, 6, 42, 40, 25, 234]
	  // 11 bytes
	];
	let DiskImage = _DiskImage;

	class Model {
	  constructor(config) {
	    this.config = config || {};
	    this.initialConfig = Object.assign({}, this.config);
	    this.databases = {};
	    this.examples = {};
	  }
	  getProperty(property) {
	    return this.config[property];
	  }
	  setProperty(property, value) {
	    this.config[property] = value;
	  }
	  getAllProperties() {
	    return this.config;
	  }
	  getAllInitialProperties() {
	    return this.initialConfig;
	  }
	  getChangedProperties() {
	    const current = this.config, initial = this.initialConfig, changed = {};
	    for (const name in current) {
	      if (current.hasOwnProperty(name)) {
	        if (current[name] !== initial[name]) {
	          changed[name] = current[name];
	        }
	      }
	    }
	    return changed;
	  }
	  addDatabases(db) {
	    for (const par in db) {
	      if (db.hasOwnProperty(par)) {
	        const entry = db[par];
	        this.databases[par] = entry;
	        this.examples[par] = {};
	      }
	    }
	  }
	  getAllDatabases() {
	    return this.databases;
	  }
	  getDatabase() {
	    const database = this.getProperty(ModelPropID.database);
	    return this.databases[database];
	  }
	  getAllExamples() {
	    const database = this.getProperty(ModelPropID.database);
	    return this.examples[database];
	  }
	  getExample(key) {
	    const database = this.getProperty(ModelPropID.database);
	    return this.examples[database][key];
	  }
	  setExample(example) {
	    const database = this.getProperty(ModelPropID.database), key = example.key;
	    if (!this.examples[database][key]) {
	      if (Utils.debug > 1) {
	        Utils.console.debug("setExample: creating new example:", key);
	      }
	    }
	    this.examples[database][key] = example;
	  }
	  removeExample(key) {
	    const database = this.getProperty(ModelPropID.database);
	    if (!this.examples[database][key]) {
	      Utils.console.warn("removeExample: example does not exist: " + key);
	    }
	    delete this.examples[database][key];
	  }
	}

	const randomCpcInitState = 1812433253;
	class RandomCpc {
	  constructor(seed) {
	    this.state = randomCpcInitState;
	    this.init(seed);
	  }
	  init(seed) {
	    this.state = randomCpcInitState;
	    seed || (seed = 0);
	    if (seed !== 0) {
	      this.randomizeMantissa(RandomCpc.encodeCpcMantissa(seed));
	    }
	  }
	  static encodeCpcMantissa(value) {
	    if (!Number.isFinite(value)) {
	      throw new Error("Seed must be a finite number");
	    }
	    let mantissa = 0, exponent = 0, sign = 0;
	    if (value !== 0) {
	      if (value < 0) {
	        sign = 2147483648;
	        value = -value;
	      }
	      exponent = Math.ceil(Math.log(value) / Math.log(2));
	      mantissa = Math.round(value / Math.pow(2, exponent - 32)) & 2147483647;
	    }
	    const signMantissa = sign + mantissa, result = [
	      signMantissa & 255,
	      signMantissa >> 8 & 255,
	      signMantissa >> 16 & 255,
	      signMantissa >> 24 & 255
	    ];
	    return result;
	  }
	  randomizeMantissa(bytes) {
	    const xorMask = ((bytes[1] << 8 | bytes[0]) << 16 | (bytes[3] << 8 | bytes[2])) >>> 0;
	    this.state = (this.state ^ xorMask) >>> 0;
	  }
	  static nextStateU32(state) {
	    const initLow = 35173, initHigh = 27655, mulLow = 62828, high = state >>> 16, low = state & 65535, highAcc = high * initLow + initLow, newHigh = highAcc & 65535, newLow = low * mulLow + initHigh + (highAcc >>> 16) & 65535;
	    return (newHigh << 16 | newLow) >>> 0;
	  }
	  random() {
	    this.state = RandomCpc.nextStateU32(this.state);
	    const high = this.state >>> 16, low = this.state & 65535;
	    return ((low << 16 | high) >>> 0) / 4294967296;
	  }
	}
	class RandomMinStd {
	  constructor(seed) {
	    this.init(seed);
	  }
	  // https://en.wikipedia.org/wiki/Jenkins_hash_function
	  static vmHashCode(s) {
	    let hash = 0;
	    for (let i = 0; i < s.length; i += 1) {
	      hash += s.charCodeAt(i);
	      hash += hash << 10;
	      hash ^= hash >> 6;
	    }
	    hash += hash << 3;
	    hash ^= hash >> 11;
	    hash += hash << 15;
	    return hash;
	  }
	  init(seed) {
	    seed = RandomMinStd.vmHashCode(String(seed));
	    this.x = seed || 2305125383;
	  }
	  random() {
	    const m = 2147483647, a = 16807, q = 127773, r = 2836;
	    let x = this.x;
	    x = a * (x % q) - r * (x / q | 0);
	    if (x <= 0) {
	      x += m;
	    }
	    this.x = x;
	    return x / m;
	  }
	}
	class Random {
	  constructor(useCpcRandom = true) {
	    if (useCpcRandom) {
	      this.rndGen = new RandomCpc();
	    } else {
	      this.rndGen = new RandomMinStd();
	    }
	  }
	  init(seed) {
	    return this.rndGen.init(seed);
	  }
	  random() {
	    return this.rndGen.random();
	  }
	}

	const _RsxAmsdos = class _RsxAmsdos {
	  static fnGetParameterAsString(vm, stringOrAddress) {
	    let string = "";
	    if (typeof stringOrAddress === "number") {
	      string = String(vm.vmGetVariableByIndex(stringOrAddress) || "");
	    } else if (typeof stringOrAddress === "string") {
	      string = stringOrAddress;
	    }
	    return string;
	  }
	  static dir(fileMask) {
	    const stream = 0;
	    let fileMaskString = _RsxAmsdos.fnGetParameterAsString(this, fileMask);
	    if (fileMaskString) {
	      fileMaskString = this.vmAdaptFilename(fileMaskString, "|DIR");
	    }
	    const fileParas = {
	      stream,
	      command: "|dir",
	      fileMask: fileMaskString,
	      line: this.line
	    };
	    this.vmStop("fileDir", 45, false, fileParas);
	  }
	  static era(fileMask) {
	    const stream = 0;
	    let fileMaskString = _RsxAmsdos.fnGetParameterAsString(this, fileMask);
	    fileMaskString = this.vmAdaptFilename(fileMaskString, "|ERA");
	    const fileParas = {
	      stream,
	      command: "|era",
	      fileMask: fileMaskString,
	      line: this.line
	    };
	    this.vmStop("fileEra", 45, false, fileParas);
	  }
	  static ren(newName, oldName) {
	    const stream = 0;
	    let newName2 = _RsxAmsdos.fnGetParameterAsString(this, newName), oldName2 = _RsxAmsdos.fnGetParameterAsString(this, oldName);
	    newName2 = this.vmAdaptFilename(newName2, "|REN");
	    oldName2 = this.vmAdaptFilename(oldName2, "|REN");
	    const fileParas = {
	      stream,
	      command: "|ren",
	      fileMask: "",
	      // unused
	      newName: newName2,
	      oldName: oldName2,
	      line: this.line
	    };
	    this.vmStop("fileRen", 45, false, fileParas);
	  }
	  getRsxCommands() {
	    return _RsxAmsdos.rsxCommands;
	  }
	};
	_RsxAmsdos.rsxCommands = {
	  a: function() {
	    this.vmNotImplemented("|A");
	  },
	  b: function() {
	    this.vmNotImplemented("|B");
	  },
	  cpm: function() {
	    this.vmNotImplemented("|CPM");
	  },
	  dir: _RsxAmsdos.dir,
	  disc: function() {
	    this.vmNotImplemented("|DISC");
	  },
	  "disc.in": function() {
	    this.vmNotImplemented("|DISC.IN");
	  },
	  "disc.out": function() {
	    this.vmNotImplemented("|DISC.OUT");
	  },
	  drive: function() {
	    this.vmNotImplemented("|DRIVE");
	  },
	  era: _RsxAmsdos.era,
	  ren: _RsxAmsdos.ren,
	  tape: function() {
	    this.vmNotImplemented("|TAPE");
	  },
	  "tape.in": function() {
	    this.vmNotImplemented("|TAPE.IN");
	  },
	  "tape.out": function() {
	    this.vmNotImplemented("|TAPE.OUT");
	  },
	  user: function() {
	    this.vmNotImplemented("|USER");
	  }
	};
	let RsxAmsdos = _RsxAmsdos;

	const _RsxCpcBasic = class _RsxCpcBasic {
	  getRsxCommands() {
	    return _RsxCpcBasic.rsxCommands;
	  }
	};
	_RsxCpcBasic.rsxCommands = {
	  basic() {
	    Utils.console.log("basic: |BASIC");
	    this.vmStop("reset", 90);
	  },
	  mode: function(mode) {
	    mode = this.vmInRangeRound(Number(mode), 0, 3, "|MODE");
	    this.vmChangeMode(mode);
	  },
	  renum: function(...args) {
	    this.renum.apply(this, args);
	  }
	};
	let RsxCpcBasic = _RsxCpcBasic;

	class Snapshot {
	  constructor(options) {
	    this.pos = 0;
	    this.options = {
	      quiet: false
	    };
	    this.setOptions(options);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  composeError(error, message, value, pos) {
	    const len = 0;
	    return Utils.composeError("DiskImage", error, this.options.name + ": " + message, value, pos || 0, len);
	  }
	  static testSnapIdent(ident) {
	    return ident === "MV - SNA";
	  }
	  readUInt8() {
	    const num = this.options.data.charCodeAt(this.pos);
	    if (isNaN(num)) {
	      throw this.composeError(new Error(), "End of File", String(num), this.pos);
	    }
	    this.pos += 1;
	    return num;
	  }
	  readUInt16() {
	    return this.readUInt8() + this.readUInt8() * 256;
	  }
	  readUInt8Array(len) {
	    const arr = [];
	    for (let i = 0; i < len; i += 1) {
	      arr.push(this.readUInt8());
	    }
	    return arr;
	  }
	  readUtf(len) {
	    const out = this.options.data.substring(this.pos, this.pos + len);
	    if (out.length !== len) {
	      throw this.composeError(new Error(), "End of File", "", this.pos);
	    }
	    this.pos += len;
	    return out;
	  }
	  getSnapshotInfo() {
	    this.pos = 0;
	    const info = {
	      ident: this.readUtf(8),
	      unused1: this.readUtf(8),
	      version: this.readUInt8(),
	      z80: {
	        AF: this.readUInt16(),
	        BC: this.readUInt16(),
	        DE: this.readUInt16(),
	        HL: this.readUInt16(),
	        IR: this.readUInt16(),
	        IFF: this.readUInt16(),
	        IX: this.readUInt16(),
	        IY: this.readUInt16(),
	        SP: this.readUInt16(),
	        PC: this.readUInt16(),
	        M: this.readUInt8(),
	        AF2: this.readUInt16(),
	        BC2: this.readUInt16(),
	        DE2: this.readUInt16(),
	        HL2: this.readUInt16()
	      },
	      ga: {
	        inknum: this.readUInt8(),
	        inkval: this.readUInt8Array(17),
	        multi: this.readUInt8()
	      },
	      ramconf: this.readUInt8(),
	      crtc: {
	        index: this.readUInt8(),
	        reg: this.readUInt8Array(18)
	      },
	      romnum: this.readUInt8(),
	      ppi: {
	        portA: this.readUInt8(),
	        portB: this.readUInt8(),
	        portC: this.readUInt8(),
	        portCtl: this.readUInt8()
	      },
	      psg: {
	        index: this.readUInt8(),
	        reg: this.readUInt8Array(16)
	      },
	      memsize: this.readUInt8()
	    };
	    return info;
	  }
	  getMemory() {
	    return this.options.data.substring(256);
	  }
	}

	class ArrayProxy {
	  constructor(len) {
	    return new Proxy(new Array(len), this);
	  }
	  // eslint-disable-next-line class-methods-use-this
	  get(target, prop) {
	    if (typeof prop === "string" && !isNaN(Number(prop))) {
	      const numProp = Number(prop);
	      if (numProp < 0 || numProp >= target.length) {
	        throw Utils.composeVmError("Variables", Error(), 9, prop);
	      }
	    }
	    return target[prop];
	  }
	  // eslint-disable-next-line class-methods-use-this
	  set(target, prop, value) {
	    if (!isNaN(Number(prop))) {
	      const numProp = Number(prop);
	      if (numProp < 0 || numProp >= target.length) {
	        throw Utils.composeVmError("Variables", Error(), 9, prop);
	      }
	    }
	    target[prop] = value;
	    return true;
	  }
	}
	class Variables {
	  // default variable types for variables starting with letters a-z
	  constructor(options) {
	    this.options = {
	      arrayBounds: false
	    };
	    this.setOptions(options);
	    this.variables = {};
	    this.varTypes = {};
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  removeAllVariables() {
	    const variables = this.variables;
	    for (const name in variables) {
	      delete variables[name];
	    }
	  }
	  getAllVariables() {
	    return this.variables;
	  }
	  getAllVarTypes() {
	    return this.varTypes;
	  }
	  createNDimArray(dims, initVal) {
	    const that = this, fnCreateRec = function(index) {
	      const len = dims[index], arr = that.options.arrayBounds ? new ArrayProxy(len) : new Array(len);
	      index += 1;
	      if (index < dims.length) {
	        for (let i = 0; i < len; i += 1) {
	          arr[i] = fnCreateRec(index);
	        }
	      } else {
	        for (let i = 0; i < len; i += 1) {
	          arr[i] = initVal;
	        }
	      }
	      return arr;
	    }, ret = fnCreateRec(0);
	    return ret;
	  }
	  // determine static varType (first letter + optional fixed vartype) from a variable name
	  // format: (v.|v["])(_)<sname>(A*)(I|R|$)([...]([...])) with optional parts in ()
	  determineStaticVarType(name) {
	    if (name.indexOf("v.") === 0) {
	      name = name.substring(2);
	    }
	    if (name.indexOf('v["') === 0) {
	      name = name.substring(3);
	    }
	    let nameType = name.charAt(0);
	    if (nameType === "_") {
	      nameType = name.charAt(1);
	    }
	    const bracketPos = name.indexOf("["), typePos = bracketPos >= 0 ? bracketPos - 1 : name.length - 1, typeChar = name.charAt(typePos);
	    if (typeChar === "I" || typeChar === "R" || typeChar === "$") {
	      nameType += typeChar;
	    }
	    return nameType;
	  }
	  getVarDefault(varName, dimensions) {
	    let isString = varName.includes("$");
	    if (!isString) {
	      let first = varName.charAt(0);
	      if (first === "_") {
	        first = first.charAt(1);
	      }
	      isString = this.getVarType(first) === "$";
	    }
	    let value = isString ? "" : 0, arrayIndices = varName.split("A").length - 1;
	    if (arrayIndices) {
	      if (!dimensions) {
	        dimensions = [];
	        if (arrayIndices > 3) {
	          arrayIndices = 3;
	        }
	        for (let i = 0; i < arrayIndices; i += 1) {
	          dimensions.push(11);
	        }
	      }
	      const valueArray = this.createNDimArray(dimensions, value);
	      value = valueArray;
	    }
	    return value;
	  }
	  initVariable(name) {
	    this.variables[name] = this.getVarDefault(name);
	  }
	  dimVariable(name, dimensions) {
	    this.variables[name] = this.getVarDefault(name, dimensions);
	  }
	  getAllVariableNames() {
	    return Object.keys(this.variables);
	  }
	  getVariableIndex(name) {
	    const varNames = this.getAllVariableNames(), pos = varNames.indexOf(name);
	    return pos;
	  }
	  initAllVariables() {
	    const variables = this.getAllVariableNames();
	    for (let i = 0; i < variables.length; i += 1) {
	      this.initVariable(variables[i]);
	    }
	  }
	  getVariable(name) {
	    return this.variables[name];
	  }
	  setVariable(name, value) {
	    this.variables[name] = value;
	  }
	  getVariableByIndex(index) {
	    const variables = this.getAllVariableNames(), name = variables[index];
	    return this.variables[name];
	  }
	  variableExist(name) {
	    return name in this.variables;
	  }
	  getVarType(varChar) {
	    return this.varTypes[varChar];
	  }
	  setVarType(varChar, type) {
	    this.varTypes[varChar] = type;
	  }
	}

	const _Z80Disass = class _Z80Disass {
	  // actual prefix: 0=none, 1=0xDD, 2=0xFD, 4=0xED
	  constructor(options) {
	    // hex-marker, "&" or "#" or ""
	    this.dissOp = 0;
	    // actual op-code
	    this.prefix = 0;
	    this.options = {
	      format: 7
	    };
	    this.setOptions(options);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  readByte(i) {
	    const data = this.options.data;
	    return data[i] | 0;
	  }
	  readWord(i) {
	    const data = this.options.data;
	    return data[i] | data[i + 1] << 8;
	  }
	  bget() {
	    const by = this.readByte(this.options.addr);
	    this.options.addr += 1;
	    return by;
	  }
	  // byte-out: returns byte xx at PC; PC++
	  bout() {
	    const by = this.bget();
	    return _Z80Disass.hexMark + by.toString(16).toUpperCase().padStart(2, "0");
	  }
	  // word-out: returns word xxyy from PC, PC+=2
	  wout() {
	    const wo = this.readWord(this.options.addr);
	    this.options.addr += 2;
	    return _Z80Disass.hexMark + wo.toString(16).toUpperCase().padStart(4, "0");
	  }
	  // relative-address-out : gets it from PC and returns PC+(signed)tt ; PC++
	  radrout() {
	    let dis = this.bget();
	    dis = dis << 24 >> 24;
	    let addr = this.options.addr + dis;
	    if (addr < 0) {
	      addr += 65536;
	    }
	    return _Z80Disass.hexMark + addr.toString(16).toUpperCase().padStart(4, "0");
	  }
	  /* eslint-enable array-element-newline */
	  // byte-register-out : returns string to an 8-bit register
	  // handles prefix, special op-codes with IX,IY and h,l
	  bregout(nr) {
	    const dissOp = this.dissOp;
	    nr &= 7;
	    let prefix = this.prefix;
	    if (prefix === 4 || (this.prefix === 1 || this.prefix === 2) && (dissOp === 102 || dissOp === 110 || dissOp === 116 || dissOp === 117) && nr !== 6) {
	      prefix = 0;
	    }
	    return _Z80Disass.bregtab[prefix][nr] + (prefix && nr === 6 ? this.bout() + ")" : "");
	  }
	  /* eslint-enable array-element-newline */
	  // word-register-out : returns string to a 16-bit-register
	  // handles prefix
	  wregout(nr) {
	    const prefix = this.prefix === 1 || this.prefix === 2 ? this.prefix : 0;
	    return _Z80Disass.wregtab[prefix][nr & 3];
	  }
	  // push-pop-register-out: like wregout, only SP substituted by AF
	  pupoRegout(nr) {
	    nr &= 3;
	    if (nr === 3) {
	      return "AF";
	    }
	    return this.wregout(nr);
	  }
	  onlyPrefix() {
	    let out = "";
	    if (this.prefix === 1) {
	      out = "[DD]-prefix";
	    } else if (this.prefix === 2) {
	      out = "[FD]-prefix";
	    } else {
	      out = "[ED]-prefix";
	    }
	    this.options.addr -= 1;
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  operdisCB() {
	    let out = "", newop;
	    if (this.prefix === 1 || this.prefix === 2) {
	      newop = this.readByte(this.options.addr + 1) & 254 | 6;
	    } else {
	      newop = this.readByte(this.options.addr);
	    }
	    const b6b7 = newop >> 6, b3b4b5 = newop >> 3 & 7;
	    if (b6b7 === 0) {
	      out = _Z80Disass.rlcTable[b3b4b5] + " " + this.bregout(newop);
	    } else {
	      out = _Z80Disass.bitResSetTable[b6b7 - 1] + " " + b3b4b5 + "," + this.bregout(newop);
	    }
	    if (this.prefix === 1 || this.prefix === 2) {
	      if (newop !== this.readByte(this.options.addr) && newop >> 6 !== 1) {
	        const premem = this.prefix;
	        this.prefix = 0;
	        out += " & LD " + this.bregout(this.readByte(this.options.addr));
	        this.prefix = premem;
	      }
	    }
	    this.options.addr += 1;
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  operdisEDpart40To7F(dissOp) {
	    let out = "";
	    switch (dissOp & 7) {
	      // test b0,b1,b2
	      case 0:
	        if (dissOp === 112) {
	          out = "*IN X,(C)";
	        } else {
	          out = "IN " + this.bregout(dissOp >> 3) + ",(C)";
	        }
	        break;
	      case 1:
	        if (dissOp === 113) {
	          out = "*OUT (C),0";
	        } else {
	          out = "OUT (C)," + this.bregout(dissOp >> 3);
	        }
	        break;
	      case 2:
	        out = (dissOp & 8 ? "ADC" : "SBC") + " HL," + this.wregout(dissOp >> 4);
	        break;
	      case 3:
	        if (dissOp & 8) {
	          out = "LD " + this.wregout(dissOp >> 4) + ",(" + this.wout() + ")";
	        } else {
	          out = "LD (" + this.wout() + ")," + this.wregout(dissOp >> 4);
	        }
	        break;
	      case 4:
	        out = dissOp === 68 ? "NEG" : "*NEG";
	        break;
	      case 5:
	        if (dissOp === 69) {
	          out = "RETN";
	        } else if (dissOp === 77) {
	          out = "RETI";
	        } else if ((dissOp & 15) === 5) {
	          out = "*RETN";
	        } else {
	          out = "*RETI";
	        }
	        break;
	      case 6:
	        switch (dissOp) {
	          case 70:
	            out = "IM 0";
	            break;
	          case 86:
	            out = "IM 1";
	            break;
	          case 94:
	            out = "IM 2";
	            break;
	          case 78:
	          // *im 0
	          case 102:
	          case 110:
	            out = "*IM 0";
	            break;
	          case 118:
	            out = "*IM 1";
	            break;
	          case 126:
	            out = "*IM 2";
	            break;
	        }
	        break;
	      case 7:
	        out = _Z80Disass.ldIaTable[dissOp >> 3 & 7];
	        break;
	    }
	    return out;
	  }
	  /* eslint-enable array-element-newline */
	  operdisED(dissOp) {
	    let out = "";
	    switch (dissOp >> 6) {
	      // test b6,7
	      case 0:
	        out = _Z80Disass.unknownOp;
	        break;
	      case 1:
	        out = this.operdisEDpart40To7F(dissOp);
	        break;
	      default:
	        break;
	      case 2:
	        if ((dissOp & 36) === 32) {
	          out = _Z80Disass.repeatTable[dissOp & 3][dissOp >> 3 & 3];
	        } else {
	          out = _Z80Disass.unknownOp;
	        }
	        break;
	      case 3:
	        out = _Z80Disass.unknownOp;
	        break;
	    }
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  //
	  // Disassemble 00-3F
	  //
	  operdis00To3Fpart00(b3b4b5) {
	    let out = "";
	    switch (b3b4b5) {
	      // test b3,b4,b5
	      case 0:
	        out = "NOP";
	        break;
	      case 1:
	        out = "EX AF,AF'";
	        break;
	      case 2:
	        out = "DJNZ " + this.radrout();
	        break;
	      case 3:
	        out = "JR " + this.radrout();
	        break;
	      default:
	        out = "JR " + _Z80Disass.conditionTable[b3b4b5 & 3] + "," + this.radrout();
	        break;
	    }
	    return out;
	  }
	  operdis00To3Fpart01(dissOp) {
	    let out = "";
	    if (dissOp & 8) {
	      out = "ADD " + this.wregout(2) + "," + this.wregout(dissOp >> 4);
	    } else {
	      out = "LD " + this.wregout(dissOp >> 4) + "," + this.wout();
	    }
	    return out;
	  }
	  operdis00To3Fpart02(b3b4b5) {
	    let out = "";
	    if (b3b4b5 & 4) {
	      switch (b3b4b5 & 3) {
	        // test b3,b4
	        case 0:
	          out = "LD (" + this.wout() + ")," + this.wregout(2);
	          break;
	        case 1:
	          out = "LD " + this.wregout(2) + ",(" + this.wout() + ")";
	          break;
	        case 2:
	          out = "LD (" + this.wout() + "),A";
	          break;
	        case 3:
	          out = "LD A,(" + this.wout() + ")";
	          break;
	      }
	    } else {
	      switch (b3b4b5 & 3) {
	        // test b3,b4
	        case 0:
	          out = "LD (BC),A";
	          break;
	        case 1:
	          out = "LD A,(BC)";
	          break;
	        case 2:
	          out = "LD (DE),A";
	          break;
	        case 3:
	          out = "LD A,(DE)";
	          break;
	      }
	    }
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  operdis00To3F(dissOp) {
	    let out = "";
	    switch (dissOp & 7) {
	      // test b0,b1,b2
	      case 0:
	        out = this.operdis00To3Fpart00(dissOp >> 3 & 7);
	        break;
	      case 1:
	        out = this.operdis00To3Fpart01(dissOp);
	        break;
	      case 2:
	        out = this.operdis00To3Fpart02(dissOp >> 3 & 7);
	        break;
	      case 3:
	        out = (dissOp & 8 ? "DEC " : "INC ") + this.wregout(dissOp >> 4);
	        break;
	      case 4:
	        out = "INC " + this.bregout(dissOp >> 3);
	        break;
	      case 5:
	        out = "DEC " + this.bregout(dissOp >> 3);
	        break;
	      case 6:
	        out = "LD " + this.bregout(dissOp >> 3) + "," + this.bout();
	        break;
	      case 7:
	        out = _Z80Disass.rlcaTable[dissOp >> 3 & 7];
	        break;
	    }
	    return out;
	  }
	  // eslint-disable-line array-element-newline
	  //
	  // Disassemble C0-FF
	  //
	  operdisC0ToFFpart01(dissOp) {
	    let out = "";
	    const b4b5 = dissOp >> 4 & 3;
	    if (dissOp & 8) {
	      switch (b4b5) {
	        // test b4,b5
	        case 0:
	          out = "RET";
	          break;
	        case 1:
	          out = "EXX";
	          break;
	        case 2:
	          out = "JP (" + this.wregout(2) + ")";
	          break;
	        case 3:
	          out = "LD SP," + this.wregout(2);
	          break;
	      }
	    } else {
	      out = "POP " + this.pupoRegout(b4b5);
	    }
	    return out;
	  }
	  operdisC0ToFFpart03(b3b4b5) {
	    let out = "";
	    switch (b3b4b5) {
	      // test b3,b4,b5
	      case 0:
	        out = "JP " + this.wout();
	        break;
	      case 1:
	        out = this.operdisCB();
	        break;
	      case 2:
	        out = "OUT (" + this.bout() + "),A";
	        break;
	      case 3:
	        out = "IN A,(" + this.bout() + ")";
	        break;
	      case 4:
	        out = "EX (SP)," + this.wregout(2);
	        break;
	      case 5:
	        out = "EX DE,HL";
	        break;
	      case 6:
	        out = "DI";
	        break;
	      case 7:
	        out = "EI";
	        break;
	    }
	    return out;
	  }
	  operdisC0ToFFpart05(dissOp) {
	    let out = "";
	    const b4b5 = dissOp >> 4 & 3;
	    if (dissOp & 8) {
	      if (b4b5 === 0) {
	        out = "CALL " + this.wout();
	      } else {
	        out = this.onlyPrefix();
	      }
	    } else {
	      out = "PUSH " + this.pupoRegout(b4b5);
	    }
	    return out;
	  }
	  operdisC0ToFF(dissOp) {
	    let out = "";
	    switch (dissOp & 7) {
	      // test b0,b1,b2
	      case 0:
	        out = "RET " + _Z80Disass.conditionTable[dissOp >> 3 & 7];
	        break;
	      case 1:
	        out = this.operdisC0ToFFpart01(dissOp);
	        break;
	      case 2:
	        out = "JP " + _Z80Disass.conditionTable[dissOp >> 3 & 7] + "," + this.wout();
	        break;
	      case 3:
	        out = this.operdisC0ToFFpart03(dissOp >> 3 & 7);
	        break;
	      case 4:
	        out = "CALL " + _Z80Disass.conditionTable[dissOp >> 3 & 7] + "," + this.wout();
	        break;
	      case 5:
	        out = this.operdisC0ToFFpart05(dissOp);
	        break;
	      case 6:
	        out = _Z80Disass.arithMTab[dissOp >> 3 & 7] + this.bout();
	        break;
	      case 7:
	        out = "RST " + _Z80Disass.hexMark + (dissOp & 56).toString(16).toUpperCase().padStart(2, "0");
	        break;
	    }
	    return out;
	  }
	  // disassembles next instruction
	  getNextLine() {
	    let dissOp = this.bget();
	    const prefix = _Z80Disass.prefixMap[dissOp] || 0;
	    if (prefix) {
	      dissOp = this.bget();
	    }
	    this.prefix = prefix;
	    this.dissOp = dissOp;
	    let out = "";
	    if (prefix === 4) {
	      out = this.operdisED(dissOp);
	    } else {
	      switch (dissOp >> 6) {
	        // test b6,7
	        case 0:
	          out = this.operdis00To3F(dissOp);
	          break;
	        case 1:
	          out = dissOp === 118 ? "HALT" : "LD " + this.bregout(dissOp >> 3) + "," + this.bregout(dissOp);
	          break;
	        case 2:
	          out = _Z80Disass.arithMTab[dissOp >> 3 & 7] + this.bregout(dissOp);
	          break;
	        case 3:
	          out = this.operdisC0ToFF(dissOp);
	          break;
	      }
	    }
	    return out;
	  }
	  disassLine() {
	    const format = this.options.format ?? 7, startAddr = this.options.addr, line = this.getNextLine();
	    let out = "";
	    if (format & 1) {
	      out += startAddr.toString(16).toUpperCase().padStart(4, "0");
	    }
	    if (format & 2) {
	      const byteHex = [];
	      if (out.length) {
	        out += "  ";
	      }
	      for (let i = startAddr; i < this.options.addr; i += 1) {
	        const byte = this.readByte(i) || 0;
	        byteHex.push(byte.toString(16).toUpperCase().padStart(2, "0"));
	      }
	      while (byteHex.length < 4) {
	        byteHex.push("  ");
	      }
	      out += byteHex.join(" ");
	    }
	    if (format & 4) {
	      if (out.length) {
	        out += "  ";
	      }
	      out += line;
	    }
	    return out;
	  }
	};
	_Z80Disass.hexMark = "&";
	/* eslint-disable array-element-newline */
	_Z80Disass.bregtab = [
	  // byte-register-table
	  ["B", "C", "D", "E", "H", "L", "(HL)", "A"],
	  ["B", "C", "D", "E", "HX", "LX", "(IX+", "A"],
	  // DD-Prefix
	  ["B", "C", "D", "E", "HY", "LY", "(IY+", "A"]
	  // FD-Prefix
	];
	/* eslint-disable array-element-newline */
	_Z80Disass.wregtab = [
	  // byte-register-table
	  ["BC", "DE", "HL", "SP"],
	  ["BC", "DE", "IX", "SP"],
	  // DD-Prefix
	  ["BC", "DE", "IY", "SP"]
	  // FD-Prefix
	];
	_Z80Disass.unknownOp = "unknown";
	//
	// Disassemble CB
	//
	_Z80Disass.rlcTable = ["RLC", "RRC", "RL", "RR", "SLA", "SRA", "SLS*", "SRL"];
	// eslint-disable-line array-element-newline
	_Z80Disass.bitResSetTable = ["BIT", "RES", "SET"];
	//
	// Disassemble ED
	//
	_Z80Disass.ldIaTable = ["LD I,A", "LD R,A", "LD A,I", "LD A,R", "RRD", "RLD", _Z80Disass.unknownOp, _Z80Disass.unknownOp];
	/* eslint-disable array-element-newline */
	_Z80Disass.repeatTable = [
	  ["LDI", "LDD", "LDIR", "LDDR"],
	  ["CPI", "CPD", "CPIR", "CPDR"],
	  ["INI", "IND", "INIR", "INDR"],
	  ["OUTI", "OUTD", "OTIR", "OTDR"]
	];
	_Z80Disass.conditionTable = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"];
	_Z80Disass.rlcaTable = ["RLCA", "RRCA", "RLA", "RRA", "DAA", "CPL", "SCF", "CCF"];
	_Z80Disass.arithMTab = ["ADD A,", "ADC A,", "SUB ", "SBC A,", "AND ", "XOR ", "OR ", "CP "];
	//
	// Disassemble main
	//
	_Z80Disass.prefixMap = {
	  221: 1,
	  253: 2,
	  237: 4
	};
	let Z80Disass = _Z80Disass;

	class ZipFile {
	  constructor(options) {
	    this.entryTable = {};
	    this.options = {};
	    this.setOptions(options, true);
	  }
	  getOptions() {
	    return this.options;
	  }
	  setOptions(options, force) {
	    const currentData = this.options.data;
	    Object.assign(this.options, options);
	    if (force || this.options.data !== currentData) {
	      this.data = this.options.data;
	      this.entryTable = this.readZipDirectory();
	    }
	  }
	  getZipDirectory() {
	    return this.entryTable;
	  }
	  composeError(error, message, value, pos) {
	    message = this.options.zipName + ": " + message;
	    return Utils.composeError("ZipFile", error, message, value, pos);
	  }
	  subArr(begin, length) {
	    const data = this.data, end = begin + length;
	    return data.slice ? data.slice(begin, end) : data.subarray(begin, end);
	  }
	  readUTF(offset, len) {
	    const callSize = 25e3;
	    let out = "";
	    while (len) {
	      const chunkLen = Math.min(len, callSize), nums = this.subArr(offset, chunkLen);
	      out += String.fromCharCode.apply(null, nums);
	      offset += chunkLen;
	      len -= chunkLen;
	    }
	    return out;
	  }
	  readUInt(i) {
	    const data = this.data;
	    return data[i + 3] << 24 | data[i + 2] << 16 | data[i + 1] << 8 | data[i];
	  }
	  readUShort(i) {
	    const data = this.data;
	    return data[i + 1] << 8 | data[i];
	  }
	  readEocd(eocdPos) {
	    const eocd = {
	      signature: this.readUInt(eocdPos),
	      entries: this.readUShort(eocdPos + 10),
	      // total number of central directory records
	      cdfhOffset: this.readUInt(eocdPos + 16),
	      // offset of start of central directory, relative to start of archive
	      cdSize: this.readUInt(eocdPos + 20)
	      // size of central directory (just for information)
	    };
	    return eocd;
	  }
	  readCdfh(pos) {
	    const cdfh = {
	      signature: this.readUInt(pos),
	      version: this.readUShort(pos + 6),
	      // version needed to extract (minimum)
	      flag: this.readUShort(pos + 8),
	      // General purpose bit flag
	      compressionMethod: this.readUShort(pos + 10),
	      // compression method
	      modificationTime: this.readUShort(pos + 12),
	      // File last modification time (DOS time)
	      crc: this.readUInt(pos + 16),
	      // CRC-32 of uncompressed data
	      compressedSize: this.readUInt(pos + 20),
	      // compressed size
	      size: this.readUInt(pos + 24),
	      // Uncompressed size
	      fileNameLength: this.readUShort(pos + 28),
	      // file name length
	      extraFieldLength: this.readUShort(pos + 30),
	      // extra field length
	      fileCommentLength: this.readUShort(pos + 32),
	      // file comment length
	      localOffset: this.readUInt(pos + 42),
	      // relative offset of local file header
	      // set later...
	      name: "",
	      isDirectory: false,
	      extra: [],
	      comment: "",
	      timestamp: 0,
	      dataStart: 0
	    };
	    return cdfh;
	  }
	  readZipDirectory() {
	    const eocdLen = 22, maxEocdCommentLen = 65535, eocdSignature = 101010256, cdfhSignature = 33639248, cdfhLen = 46, lfhSignature = 67324752, lfhLen = 30, data = this.data, entryTable = {};
	    let i = data.length - eocdLen + 1, eocd;
	    const n = Math.max(0, i - maxEocdCommentLen);
	    while (i >= n) {
	      i -= 1;
	      if (this.readUInt(i) === eocdSignature) {
	        eocd = this.readEocd(i);
	        if (this.readUInt(eocd.cdfhOffset) === cdfhSignature) {
	          break;
	        }
	      }
	    }
	    if (!eocd) {
	      throw this.composeError(Error(), "Zip: File ended abruptly: EOCD not found", "", i >= 0 ? i : 0);
	    }
	    const entries = eocd.entries;
	    let offset = eocd.cdfhOffset;
	    for (i = 0; i < entries; i += 1) {
	      const cdfh = this.readCdfh(offset);
	      if (cdfh.signature !== cdfhSignature) {
	        throw this.composeError(Error(), "Zip: Bad CDFH signature", "", offset);
	      }
	      if (!cdfh.fileNameLength) {
	        throw this.composeError(Error(), "Zip Entry name missing", "", offset);
	      }
	      offset += cdfhLen;
	      cdfh.name = this.readUTF(offset, cdfh.fileNameLength);
	      offset += cdfh.fileNameLength;
	      cdfh.isDirectory = cdfh.name.charAt(cdfh.name.length - 1) === "/";
	      cdfh.extra = this.subArr(offset, cdfh.extraFieldLength);
	      offset += cdfh.extraFieldLength;
	      cdfh.comment = this.readUTF(offset, cdfh.fileCommentLength);
	      offset += cdfh.fileCommentLength;
	      if ((cdfh.flag & 1) === 1) {
	        throw this.composeError(Error(), "Zip encrypted entries not supported", "", i);
	      }
	      const dostime = cdfh.modificationTime;
	      cdfh.timestamp = new Date((dostime >> 25 & 127) + 1980, (dostime >> 21 & 15) - 1, dostime >> 16 & 31, dostime >> 11 & 31, dostime >> 5 & 63, (dostime & 31) << 1).getTime();
	      if (this.readUInt(cdfh.localOffset) !== lfhSignature) {
	        Utils.console.error("Zip: readZipDirectory: LFH signature not found at offset", cdfh.localOffset);
	      }
	      const lfhExtrafieldLength = this.readUShort(cdfh.localOffset + 28);
	      cdfh.dataStart = cdfh.localOffset + lfhLen + cdfh.name.length + lfhExtrafieldLength;
	      entryTable[cdfh.name] = cdfh;
	    }
	    return entryTable;
	  }
	  static fnInflateConstruct(codes, lens2, n) {
	    let i;
	    for (i = 0; i <= 15; i += 1) {
	      codes.count[i] = 0;
	    }
	    for (i = 0; i < n; i += 1) {
	      codes.count[lens2[i]] += 1;
	    }
	    if (codes.count[0] === n) {
	      return 0;
	    }
	    let left = 1;
	    for (i = 1; i <= 15; i += 1) {
	      if ((left = (left << 1) - codes.count[i]) < 0) {
	        return left;
	      }
	    }
	    const offs = [
	      void 0,
	      0
	    ];
	    for (i = 1; i < 15; i += 1) {
	      offs[i + 1] = offs[i] + codes.count[i];
	    }
	    for (i = 0; i < n; i += 1) {
	      if (lens2[i] !== 0) {
	        codes.symbol[offs[lens2[i]]] = i;
	        offs[lens2[i]] += 1;
	      }
	    }
	    return left;
	  }
	  static fnConstructFixedHuffman(lens, lenCode, distCode) {
	    let symbol;
	    for (symbol = 0; symbol < 144; symbol += 1) {
	      lens[symbol] = 8;
	    }
	    for (; symbol < 256; symbol += 1) {
	      lens[symbol] = 9;
	    }
	    for (; symbol < 280; symbol += 1) {
	      lens[symbol] = 7;
	    }
	    for (; symbol < 288; symbol += 1) {
	      lens[symbol] = 8;
	    }
	    ZipFile.fnInflateConstruct(lenCode, lens, 288);
	    for (symbol = 0; symbol < 30; symbol += 1) {
	      lens[symbol] = 5;
	    }
	    ZipFile.fnInflateConstruct(distCode, lens, 30);
	  }
	  inflate(offset, compressedSize, finalSize) {
	    const startLens = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258], lExt = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], dists = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577], dExt = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], dynamicTableOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], that = this, data = this.data, bufEnd = offset + compressedSize, outBuf = new Uint8Array(finalSize);
	    let inCnt = offset, outCnt = 0, bitCnt = 0, bitBuf = 0, distCode, lenCode, lens;
	    const fnBits = function(need) {
	      let out = bitBuf;
	      while (bitCnt < need) {
	        if (inCnt === bufEnd) {
	          throw that.composeError(Error(), "Zip: inflate: Data overflow", that.options.zipName, -1);
	        }
	        out |= data[inCnt] << bitCnt;
	        inCnt += 1;
	        bitCnt += 8;
	      }
	      bitBuf = out >> need;
	      bitCnt -= need;
	      return out & (1 << need) - 1;
	    }, fnDecode = function(codes) {
	      let code = 0, first = 0, i = 0;
	      for (let j = 1; j <= 15; j += 1) {
	        code |= fnBits(1);
	        const count = codes.count[j];
	        if (code < first + count) {
	          return codes.symbol[i + (code - first)];
	        }
	        i += count;
	        first += count;
	        first <<= 1;
	        code <<= 1;
	      }
	      return null;
	    }, fnInflateStored = function() {
	      bitBuf = 0;
	      bitCnt = 0;
	      if (inCnt + 4 > bufEnd) {
	        throw that.composeError(Error(), "Zip: inflate: Data overflow", "", inCnt);
	      }
	      let len = that.readUShort(inCnt);
	      inCnt += 2;
	      if (data[inCnt] !== (~len & 255) || data[inCnt + 1] !== (~len >> 8 & 255)) {
	        throw that.composeError(Error(), "Zip: inflate: Bad length", "", inCnt);
	      }
	      inCnt += 2;
	      if (inCnt + len > bufEnd) {
	        throw that.composeError(Error(), "Zip: inflate: Data overflow", "", inCnt);
	      }
	      while (len) {
	        outBuf[outCnt] = data[inCnt];
	        outCnt += 1;
	        inCnt += 1;
	        len -= 1;
	      }
	    }, fnConstructDynamicHuffman = function() {
	      const nLen = fnBits(5) + 257, nDist = fnBits(5) + 1, nCode = fnBits(4) + 4;
	      if (nLen > 286 || nDist > 30) {
	        throw that.composeError(Error(), "Zip: inflate: length/distance code overflow", "", 0);
	      }
	      let i;
	      for (i = 0; i < nCode; i += 1) {
	        lens[dynamicTableOrder[i]] = fnBits(3);
	      }
	      for (; i < 19; i += 1) {
	        lens[dynamicTableOrder[i]] = 0;
	      }
	      if (ZipFile.fnInflateConstruct(lenCode, lens, 19) !== 0) {
	        throw that.composeError(Error(), "Zip: inflate: length codes incomplete", "", 0);
	      }
	      for (i = 0; i < nLen + nDist; ) {
	        let symbol = fnDecode(lenCode);
	        if (symbol < 16) {
	          lens[i] = symbol;
	          i += 1;
	        } else {
	          let len = 0;
	          if (symbol === 16) {
	            if (i === 0) {
	              throw that.composeError(Error(), "Zip: inflate: repeat lengths with no first length", "", 0);
	            }
	            len = lens[i - 1];
	            symbol = 3 + fnBits(2);
	          } else if (symbol === 17) {
	            symbol = 3 + fnBits(3);
	          } else {
	            symbol = 11 + fnBits(7);
	          }
	          if (i + symbol > nLen + nDist) {
	            throw that.composeError(Error(), "Zip: inflate: more lengths than specified", "", 0);
	          }
	          while (symbol) {
	            lens[i] = len;
	            symbol -= 1;
	            i += 1;
	          }
	        }
	      }
	      const err1 = ZipFile.fnInflateConstruct(lenCode, lens, nLen), err2 = ZipFile.fnInflateConstruct(distCode, lens.slice(nLen), nDist);
	      if (err1 < 0 || err1 > 0 && nLen - lenCode.count[0] !== 1 || (err2 < 0 || err2 > 0 && nDist - distCode.count[0] !== 1)) {
	        throw that.composeError(Error(), "Zip: inflate: bad literal or length codes", "", 0);
	      }
	    }, fnInflateHuffmann = function() {
	      let symbol;
	      do {
	        symbol = fnDecode(lenCode);
	        if (symbol < 256) {
	          outBuf[outCnt] = symbol;
	          outCnt += 1;
	        }
	        if (symbol > 256) {
	          symbol -= 257;
	          if (symbol > 28) {
	            throw that.composeError(Error(), "Zip: inflate: Invalid length/distance", "", 0);
	          }
	          let len = startLens[symbol] + fnBits(lExt[symbol]);
	          symbol = fnDecode(distCode);
	          const dist = dists[symbol] + fnBits(dExt[symbol]);
	          if (dist > outCnt) {
	            throw that.composeError(Error(), "Zip: inflate: distance out of range", "", 0);
	          }
	          while (len) {
	            outBuf[outCnt] = outBuf[outCnt - dist];
	            len -= 1;
	            outCnt += 1;
	          }
	        }
	      } while (symbol !== 256);
	    };
	    let last;
	    do {
	      last = fnBits(1);
	      const type = fnBits(2);
	      switch (type) {
	        case 0:
	          fnInflateStored();
	          break;
	        case 1:
	        case 2:
	          lenCode = {
	            count: [],
	            symbol: []
	          };
	          distCode = {
	            count: [],
	            symbol: []
	          };
	          lens = [];
	          if (type === 1) {
	            ZipFile.fnConstructFixedHuffman(lens, lenCode, distCode);
	          } else {
	            fnConstructDynamicHuffman();
	          }
	          fnInflateHuffmann();
	          break;
	        default:
	          throw this.composeError(Error(), "Zip: inflate: unsupported compression type" + type, "", 0);
	      }
	    } while (!last);
	    return outBuf;
	  }
	  readData(name) {
	    const cdfh = this.entryTable[name];
	    if (!cdfh) {
	      throw this.composeError(Error(), "Zip: readData: file does not exist:" + name, "", 0);
	    }
	    let dataUTF8 = "";
	    if (cdfh.compressionMethod === 0) {
	      dataUTF8 = this.readUTF(cdfh.dataStart, cdfh.size);
	    } else if (cdfh.compressionMethod === 8) {
	      const fileData = this.inflate(cdfh.dataStart, cdfh.compressedSize, cdfh.size), savedData = this.data;
	      this.data = fileData;
	      dataUTF8 = this.readUTF(0, fileData.length);
	      this.data = savedData;
	    } else {
	      throw this.composeError(Error(), "Zip: readData: compression method not supported:" + cdfh.compressionMethod, "", 0);
	    }
	    if (dataUTF8.length !== cdfh.size) {
	      Utils.console.error("Zip: readData: different length 2!");
	    }
	    return dataUTF8;
	  }
	}

	exports.BasicFormatter = BasicFormatter;
	exports.BasicLexer = BasicLexer;
	exports.BasicParser = BasicParser;
	exports.BasicTokenizer = BasicTokenizer;
	exports.CodeGeneratorBasic = CodeGeneratorBasic;
	exports.CodeGeneratorJs = CodeGeneratorJs;
	exports.CodeGeneratorToken = CodeGeneratorToken;
	exports.CpcVm = CpcVm;
	exports.CpcVmRsx = CpcVmRsx;
	exports.Diff = Diff;
	exports.DiskImage = DiskImage;
	exports.Model = Model;
	exports.ModelPropID = ModelPropID;
	exports.Random = Random;
	exports.RsxAmsdos = RsxAmsdos;
	exports.RsxCpcBasic = RsxCpcBasic;
	exports.Snapshot = Snapshot;
	exports.Utils = Utils;
	exports.Variables = Variables;
	exports.ViewID = ViewID;
	exports.Z80Disass = Z80Disass;
	exports.ZipFile = ZipFile;

}));
//# sourceMappingURL=cpcbasic-core.js.map
