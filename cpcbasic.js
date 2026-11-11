(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.cpcbasic = {}));
})(this, (function (exports) { 'use strict';

	const _Utils = class _Utils {
	  //typeof globalThis !== "undefined" ? globalThis.console : undefined;
	  static setDebug(debug) {
	    _Utils.debug = debug;
	  }
	  static hexEscape(str) {
	    return str.replace(/[\x00-\x1f]/g, function(char) {
	      return "\\x" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
	    });
	  }
	  static escapeControlCharacters(input) {
	    return input.replace(/([\x00-\x1f])/g, "$1");
	  }
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
	  static createDiagnostic(error, noSelection = false, errCode) {
	    const custom = error;
	    return {
	      name: error.name,
	      message: error.message,
	      shortMessage: _Utils.isCustomError(error) ? custom.shortMessage || error.message : error.message,
	      value: custom.value,
	      pos: custom.pos,
	      len: custom.len,
	      line: custom.line,
	      errCode: custom.errCode ?? errCode,
	      selectSource: custom.pos !== void 0 && !noSelection
	    };
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
	      out += String.fromCharCode.apply(null, Array.from(chunk));
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
	_Utils.console = console;
	_Utils.supportsBinaryLiterals = _Utils.testIsSupported("0b01");
	// does the browser support binary literals?
	_Utils.supportReservedNames = _Utils.testIsSupported("({}).return()");
	let Utils = _Utils;

	var ModelPropID = /* @__PURE__ */ ((ModelPropID2) => {
	  ModelPropID2["arrayBounds"] = "arrayBounds";
	  ModelPropID2["autorun"] = "autorun";
	  ModelPropID2["basicVersion"] = "basicVersion";
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

	class BasicFormatter {
	  // current label (line) for error messages
	  constructor(options) {
	    this.label = "";
	    this.options = {
	      implicitLines: false
	    };
	    this.setOptions(options);
	  }
	  static parseLineNumber(line) {
	    return parseInt(line, 10);
	  }
	  static addLineNumbers(input) {
	    const lineParts = input.split("\n");
	    let lastLine = 0;
	    for (let index = 0; index < lineParts.length; index += 1) {
	      let lineNumber = parseInt(lineParts[index], 10);
	      if (isNaN(lineNumber)) {
	        lineNumber = lastLine + 1;
	        lineParts[index] = String(lineNumber) + " " + lineParts[index];
	      }
	      lastLine = lineNumber;
	    }
	    return lineParts.join("\n");
	  }
	  static splitLines(input, implicitLines = false) {
	    if (implicitLines) {
	      input = BasicFormatter.addLineNumbers(input);
	    }
	    const parts = input.split(/^(\s*\d+)/m), lines = [];
	    if (parts[0] === "") {
	      parts.shift();
	    }
	    if (parts.length % 2 !== 0) {
	      return void 0;
	    }
	    for (let index = 0; index < parts.length; index += 2) {
	      let content = parts[index + 1];
	      if (content.endsWith("\n")) {
	        content = content.substring(0, content.length - 1);
	      }
	      lines.push(parts[index] + content);
	    }
	    return lines;
	  }
	  static mergeLines(lines1, lines2) {
	    const result = [];
	    let index1 = 0, index2 = 0;
	    while (index1 < lines1.length && index2 < lines2.length) {
	      const line1 = lines1[index1], line2 = lines2[index2], number1 = parseInt(line1, 10), number2 = parseInt(line2, 10);
	      if (number1 < number2) {
	        result.push(line1);
	        index1 += 1;
	      } else {
	        if (String(number2) !== line2) {
	          result.push(line2);
	        }
	        index2 += 1;
	        if (number1 === number2) {
	          index1 += 1;
	        }
	      }
	    }
	    const merged = result.concat(lines1.slice(index1), lines2.slice(index2));
	    if (merged.length >= 2 && merged[merged.length - 2] === "" && merged[merged.length - 1] === "") {
	      merged.pop();
	    }
	    return merged.join("\n");
	  }
	  static getLinesInRange(sourceLines, firstLine, lastLine) {
	    const lines = sourceLines.slice();
	    while (lines.length && parseInt(lines[0], 10) < firstLine) {
	      lines.shift();
	    }
	    if (lines.length && lines[lines.length - 1] === "") {
	      lines.pop();
	    }
	    while (lines.length && parseInt(lines[lines.length - 1], 10) > lastLine) {
	      lines.pop();
	    }
	    return lines;
	  }
	  static getLinesInRangeFromScript(script, firstLine, lastLine, implicitLines = false, onInvalid) {
	    const lines = script ? BasicFormatter.splitLines(script, implicitLines) : [];
	    if (!lines) {
	      onInvalid?.();
	      return [];
	    }
	    return BasicFormatter.getLinesInRange(lines, firstLine, lastLine);
	  }
	  static mergeScripts(script1, script2, implicitLines = false, onInvalid) {
	    const split = (script) => {
	      const lines = BasicFormatter.splitLines(Utils.stringTrimEnd(script), implicitLines);
	      if (!lines) {
	        onInvalid?.();
	        return [];
	      }
	      return lines;
	    };
	    return BasicFormatter.mergeLines(split(script1), split(script2));
	  }
	  static formatListing(lines, stream) {
	    return lines.map((line) => stream === 9 ? line : Utils.escapeControlCharacters(line));
	  }
	  static createDeleteScript(lines) {
	    const numbers = [];
	    for (const line of lines) {
	      const number = parseInt(line, 10);
	      if (isNaN(number)) {
	        return void 0;
	      }
	      numbers.push(String(number));
	    }
	    return numbers.join("\n");
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
	  prepareParser() {
	    this.options.lexer.setOptions({ keepWhiteSpace: false });
	    this.options.parser.setOptions({ keepBrackets: false, keepColons: false, keepDataComma: false, keepTokens: false });
	  }
	  renumber(input, newLine, oldLine, step, keep) {
	    this.prepareParser();
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
	    this.prepareParser();
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

	class Model {
	  constructor(config) {
	    this.config = config || {};
	    this.initialConfig = Object.assign({}, this.config);
	    this.databases = {};
	    this.examples = {};
	  }
	  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	  getProperty(property) {
	    return this.config[property];
	  }
	  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	  setProperty(property, value) {
	    const previousValue = this.config[property];
	    this.config[property] = value;
	    if (value !== previousValue && this.propertyChangeCallback) {
	      this.propertyChangeCallback();
	    }
	  }
	  setPropertyChangeCallback(callback) {
	    this.propertyChangeCallback = callback;
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
	      if (Object.prototype.hasOwnProperty.call(current, name)) {
	        if (current[name] !== initial[name]) {
	          changed[name] = current[name];
	        }
	      }
	    }
	    return changed;
	  }
	  addDatabases(db) {
	    for (const par in db) {
	      if (Object.prototype.hasOwnProperty.call(db, par)) {
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

	const ModelPropIDdatabase = "database";
	const ModelPropIDexample = "example";
	const ModelPropIDdatabaseDirs = "databaseDirs";
	class Core {
	  constructor(defaultConfig) {
	    this.addIndex = (dir, input) => {
	      if (typeof input === "function") {
	        input = {
	          [dir]: JSON.parse(Core.fnHereDoc(input).trim())
	        };
	      }
	      for (const value in input) {
	        const item = input[value];
	        for (let i = 0; i < item.length; i += 1) {
	          this.model.setExample(item[i]);
	        }
	      }
	    };
	    this.addItem = (key, input) => {
	      let inputString = typeof input !== "string" ? Core.fnHereDoc(input) : input;
	      inputString = inputString.replace(/^\n/, "").replace(/\n$/, "");
	      if (!key) {
	        Utils.console.warn("addItem: no key!");
	        key = "unknown";
	      }
	      const implicitLines = this.model.getProperty(ModelPropID.implicitLines);
	      const linesOnLoad = this.model.getProperty(ModelPropID.linesOnLoad);
	      if (inputString.startsWith("REM ") && !implicitLines && linesOnLoad) {
	        inputString = BasicFormatter.addLineNumbers(inputString);
	      }
	      const example = this.model.getExample(key);
	      if (example) {
	        example.script = inputString;
	      }
	    };
	    this.addRsx = (key, RsxConstructor) => {
	      const example = this.model.getExample(key);
	      example.key = key;
	      example.rsx = new RsxConstructor();
	      example.loaded = true;
	      Utils.console.log("addItem:", key);
	      return key;
	    };
	    this.model = new Model(defaultConfig);
	  }
	  init() {
	    this.initDatabases();
	  }
	  getModel() {
	    return this.model;
	  }
	  setDebug(debug) {
	    Utils.setDebug(debug);
	  }
	  static getUniqueDbKey(name, databases) {
	    let key = name, index = 2;
	    while (databases[key]) {
	      key = name + index;
	      index += 1;
	    }
	    return key;
	  }
	  initDatabases() {
	    const model = this.model, databases = {}, databaseDirs = model.getProperty(ModelPropIDdatabaseDirs).split(",");
	    for (const databaseDir of databaseDirs) {
	      const parts1 = databaseDir.split("="), databaseSrc = parts1[0], assignedName = parts1.length > 1 ? parts1[1] : "", parts2 = databaseSrc.split("/"), name = assignedName || parts2[parts2.length - 1], key = Core.getUniqueDbKey(name, databases);
	      databases[key] = {
	        text: key,
	        title: databaseSrc,
	        src: databaseSrc
	      };
	    }
	    this.model.addDatabases(databases);
	  }
	  static fnHereDoc(fn) {
	    return String(fn).replace(/^[^/]+\/\*\S*/, "").replace(/\*\/[^/]+$/, "");
	  }
	  parseArgs(args, config) {
	    for (const arg of args) {
	      const [name, ...valueParts] = arg.split("=");
	      const nameType = typeof config[name];
	      let value = valueParts.join("=");
	      if (value !== void 0) {
	        if (nameType === "boolean") {
	          value = value === "true";
	        } else if (nameType === "number") {
	          value = Number(value);
	        }
	        config[name] = value;
	      }
	    }
	    return config;
	  }
	  fnRedirectExamples(redirectExamples) {
	    const model = this.getModel();
	    const name = model.getProperty(ModelPropIDdatabase) + "/" + model.getProperty(ModelPropIDexample);
	    if (redirectExamples[name]) {
	      model.setProperty(ModelPropIDdatabase, redirectExamples[name].database);
	      model.setProperty(ModelPropIDexample, redirectExamples[name].example);
	    }
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
	    let format;
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
	      if (Object.prototype.hasOwnProperty.call(dir, name)) {
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

	const _Snapshot = class _Snapshot {
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
	  applyToVm(vm) {
	    const info = this.getSnapshotInfo(), memory = this.getMemory(), inks = info.ga.inkval;
	    vm.vmChangeMode(info.ga.multi & 3);
	    for (let index = 0; index < inks.length - 1; index += 1) {
	      vm.ink(index, _Snapshot.gaInk2Ink[inks[index]]);
	    }
	    vm.border(_Snapshot.gaInk2Ink[inks[inks.length - 1]]);
	    vm.vmSetRamSelect(info.ramconf);
	    for (let index = 0; index < info.crtc.reg.length; index += 1) {
	      vm.vmSetCrtcData(index, info.crtc.reg[index]);
	    }
	    return memory;
	  }
	};
	_Snapshot.gaInk2Ink = [13, 27, 19, 25, 1, 7, 10, 16, 28, 29, 24, 26, 6, 8, 15, 17, 30, 31, 18, 20, 0, 2, 9, 11, 4, 22, 21, 23, 3, 5, 12, 14];
	let Snapshot = _Snapshot;

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
	    const offs = [0, 0];
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
	    let dataUTF8;
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

	const _FileHandler = class _FileHandler {
	  constructor(options) {
	    this.processFileImports = true;
	    this.options = {};
	    this.setOptions(options);
	  }
	  setOptions(options) {
	    Object.assign(this.options, options);
	  }
	  getDiskImage() {
	    if (!this.diskImage) {
	      this.diskImage = new DiskImage({
	        data: ""
	        // will be set later
	      });
	    }
	    return this.diskImage;
	  }
	  startDiskImage(format) {
	    const diskImage = this.getDiskImage();
	    diskImage.setOptions({
	      diskName: "test",
	      data: diskImage.formatImage(format)
	    });
	  }
	  prepareAmsdosFile(name, data, meta) {
	    if (meta.typeString === "A" || meta.typeString === "X" || meta.typeString === "Z") {
	      return data;
	    }
	    const [name1, ext1] = DiskImage.getFilenameAndExtension(name), header = DiskImage.createAmsdosHeader({
	      name: name1,
	      ext: ext1,
	      typeString: meta.typeString,
	      start: meta.start,
	      length: meta.length,
	      entry: meta.entry
	    });
	    return DiskImage.combineAmsdosHeader(header) + data;
	  }
	  addFileToDiskImage(name, data, meta) {
	    const diskImage = this.getDiskImage();
	    diskImage.writeFile(name, this.prepareAmsdosFile(name, data, meta));
	    return diskImage.getOptions().data;
	  }
	  getDiskImageData(stripEmptyTracks) {
	    const diskImage = this.getDiskImage();
	    return stripEmptyTracks ? diskImage.stripEmptyTracks() : diskImage.getOptions().data;
	  }
	  static getStorageName(name, defaultExtension) {
	    if (name.indexOf(".") < 0) {
	      name += "." + (defaultExtension || "");
	    }
	    return name;
	  }
	  static createExampleLoadRequest(key, database, metadata, autorun) {
	    const type = metadata?.charAt(0), loadOnly = type === "B" || type === "D" || type === "G";
	    return {
	      name: database === "storage" ? key : "/" + key,
	      command: autorun && !loadOnly ? "run" : "load"
	    };
	  }
	  static resolveExamplePath(name, currentKey) {
	    if (name.charAt(0) === "/") {
	      const absolute = name.substring(1);
	      return { name: absolute, memorizedExample: absolute };
	    }
	    const lastSlash = currentKey.lastIndexOf("/");
	    if (lastSlash >= 0) {
	      name = currentKey.substring(0, lastSlash) + "/" + name;
	      name = name.replace(/\w+\/\.\.\//, "");
	    }
	    return { name, memorizedExample: currentKey };
	  }
	  static prepareExampleLoad(name, currentKey, examples, databaseDir) {
	    const resolved = _FileHandler.resolveExamplePath(name, currentKey), entry = examples[resolved.name], status = entry?.loaded ? "loaded" : resolved.name && entry ? "fetch" : "missing";
	    return {
	      name: resolved.name,
	      memorizedExample: resolved.memorizedExample,
	      entry,
	      url: status === "fetch" ? databaseDir + "/" + resolved.name + ".js" : resolved.name,
	      status
	    };
	  }
	  static prepareSave(file, getSource, encodeTokens) {
	    const type = file.typeString, extension = type === "P" || type === "T" ? "bas" : type === "B" ? "bin" : "", name = _FileHandler.getStorageName(file.name, extension);
	    let data;
	    if (file.fileData.length || type === "B" || file.command === "openout") {
	      data = file.fileData.join("");
	      if (!file.length) {
	        file.length = data.length;
	      }
	    } else {
	      data = getSource();
	      if (type === "T" || type === "P") {
	        data = encodeTokens(data, name);
	        if (data === "") {
	          file.typeString = "A";
	        } else if (type === "P") {
	          data = DiskImage.unOrProtectData(data);
	        }
	      }
	      file.length = data.length;
	    }
	    return { name, data, storedData: _FileHandler.joinMeta(file) + "," + data };
	  }
	  saveFile(file, getSource, encodeTokens) {
	    const prepared = _FileHandler.prepareSave(file, getSource, encodeTokens);
	    this.options.storage.setItem(prepared.name, prepared.storedData);
	    this.options.updateStorageDatabase("set", prepared.name);
	    return prepared;
	  }
	  static loadFromStorage(storage, name) {
	    if (name.indexOf(".") >= 0) {
	      return storage.getItem(name);
	    }
	    for (const extension of _FileHandler.defaultExtensions) {
	      const data = storage.getItem(_FileHandler.getStorageName(name, extension));
	      if (data !== null) {
	        return data;
	      }
	    }
	    return null;
	  }
	  static splitMeta(input) {
	    if (input.indexOf(_FileHandler.metaIdent) === 0) {
	      const index = input.indexOf(",");
	      if (index >= 0) {
	        const meta = input.substring(0, index).split(";");
	        return {
	          meta: {
	            typeString: meta[1],
	            start: Number(meta[2]),
	            length: Number(meta[3]),
	            entry: Number(meta[4]),
	            encoding: meta[5]
	          },
	          data: input.substring(index + 1)
	        };
	      }
	    }
	    return { meta: { typeString: "" }, data: input };
	  }
	  static getMetaIdent() {
	    return _FileHandler.metaIdent;
	  }
	  static formatDirectoryEntries(entries, sort = false) {
	    const names = entries.map((entry) => {
	      const parts = entry.split(".");
	      return parts[0].padEnd(8, " ") + "." + (parts.length >= 2 ? parts[1] : "").padEnd(3, " ");
	    });
	    if (sort) {
	      names.sort();
	    }
	    return ["\r\nDrive A: user  0\r\n\r\n", ...names.map((name) => name + "  "), "\r\n\r\n999K free\r\n\r\n"];
	  }
	  static decodeStoredFile(input, options) {
	    const result = _FileHandler.splitMeta(input), type = result.meta.typeString;
	    let data = result.data;
	    if (result.meta.encoding === "base64") {
	      data = options.atobFn(data);
	    }
	    if (type === "T") {
	      data = options.decodeTokenizedBasic(data);
	    } else if (type === "P") {
	      data = options.decodeTokenizedBasic(DiskImage.unOrProtectData(data));
	    } else if (type === "A") {
	      data = data.replace(/\x1a+$/, "");
	    } else if (type === "G") {
	      data = _FileHandler.asmGena3Convert(data);
	    } else if (type === "S") {
	      data = options.applySnapshot(data);
	    } else if (type === "X" || type === "Z") {
	      data = "1 ' " + options.importArchive(data, type).join(", ");
	    }
	    return { meta: result.meta, data };
	  }
	  static asmGena3Convert(data) {
	    const length = data.length;
	    let pos = 4, output = "";
	    while (pos < length) {
	      const line = data.charCodeAt(pos) + data.charCodeAt(pos + 1) * 256;
	      pos += 2;
	      const cr = data.indexOf("\r", pos), separator = data.indexOf("", pos), end = Math.min(cr < 0 ? length : cr, separator < 0 ? length : separator);
	      output += line + " " + data.substring(pos, end) + "\n";
	      pos = end + 1;
	    }
	    return output;
	  }
	  static prepareMaskRegExp(mask) {
	    mask = mask.replace(/([.+^$[\]\\(){}|-])/g, "\\$1");
	    mask = mask.replace(/\?/g, ".");
	    mask = mask.replace(/\*/g, ".*");
	    return new RegExp("^" + mask + "$");
	  }
	  static getStorageDirectoryEntries(storage, mask) {
	    const entries = [], regExp = mask ? _FileHandler.prepareMaskRegExp(mask) : void 0;
	    for (let index = 0; index < storage.length; index += 1) {
	      const key = storage.key(index);
	      if (key === null) {
	        continue;
	      }
	      const data = storage.getItem(key);
	      if (data !== null && data.startsWith(_FileHandler.metaIdent)) {
	        const matchKey = key.replace(/[\n\r]/g, "");
	        if (!regExp || regExp.test(matchKey)) {
	          entries.push(key);
	        }
	      }
	    }
	    return entries;
	  }
	  static getDirectoryEntries(storage, examples, currentExample, mask) {
	    let fileMask = mask ? _FileHandler.getStorageName(mask) : "";
	    const entries = _FileHandler.getStorageDirectoryEntries(storage, fileMask), lastSlash = currentExample.lastIndexOf("/");
	    let path = "";
	    if (lastSlash >= 0) {
	      path = currentExample.substring(0, lastSlash) + "/";
	      fileMask = path + (fileMask || "*.*");
	    }
	    const regExp = fileMask ? _FileHandler.prepareMaskRegExp(fileMask) : void 0, fileExists = {};
	    for (const entry of entries) {
	      fileExists[entry] = true;
	    }
	    for (const key in examples) {
	      if (Object.prototype.hasOwnProperty.call(examples, key)) {
	        const example = examples[key], name = example.key, matchName = name + (name.indexOf(".") < 0 ? "." : "");
	        if (!regExp || regExp.test(matchName)) {
	          const entry = name.substring(path.length);
	          if (!fileExists[entry]) {
	            fileExists[entry] = true;
	            entries.push(entry);
	          }
	        }
	      }
	    }
	    return entries;
	  }
	  eraseFiles(mask) {
	    const name = _FileHandler.getStorageName(mask), entries = _FileHandler.getStorageDirectoryEntries(this.options.storage, name), removed = [], missing = [];
	    for (const entry of entries) {
	      if (this.options.storage.getItem(entry) !== null) {
	        this.options.storage.removeItem(entry);
	        this.options.updateStorageDatabase("remove", entry);
	        removed.push(entry);
	      } else {
	        missing.push(entry);
	      }
	    }
	    return { name, matched: entries.length > 0, removed, missing };
	  }
	  renameFile(oldName, newName) {
	    oldName = _FileHandler.getStorageName(oldName);
	    newName = _FileHandler.getStorageName(newName);
	    const item = this.options.storage.getItem(oldName);
	    if (item === null) {
	      return { status: "oldNotFound", oldName, newName };
	    }
	    if (this.options.storage.getItem(newName)) {
	      return { status: "newExists", oldName, newName };
	    }
	    this.options.storage.setItem(newName, item);
	    this.options.updateStorageDatabase("set", newName);
	    this.options.storage.removeItem(oldName);
	    this.options.updateStorageDatabase("remove", oldName);
	    return { status: "renamed", oldName, newName };
	  }
	  static joinMeta(meta) {
	    return [
	      _FileHandler.metaIdent,
	      meta.typeString,
	      meta.start,
	      meta.length,
	      meta.entry,
	      meta.encoding
	    ].join(";");
	  }
	  // eslint-disable-line no-control-regex
	  // starting with (line) number, or 7 bit ASCII characters without control codes except \x1a=EOF
	  processDskFile(data, name, imported) {
	    try {
	      const dsk = this.getDiskImage();
	      dsk.setOptions({
	        data,
	        diskName: name
	      });
	      const dir = dsk.readDirectory(), diskFiles = Object.keys(dir);
	      for (let i = 0; i < diskFiles.length; i += 1) {
	        const fileName = diskFiles[i];
	        try {
	          data = dsk.readFile(dir[fileName]);
	          this.fnLoad2(data, fileName, "", imported);
	        } catch (e) {
	          Utils.console.error(e);
	          if (e instanceof Error) {
	            this.options.outputError(e, true);
	          }
	        }
	      }
	    } catch (e) {
	      Utils.console.error(e);
	      if (e instanceof Error) {
	        this.options.outputError(e, true);
	      }
	    }
	  }
	  processZipFile(uint8Array, name, imported) {
	    let zip;
	    try {
	      zip = new ZipFile({
	        data: uint8Array,
	        // rather data
	        zipName: name
	      });
	    } catch (e) {
	      Utils.console.error(e);
	      if (e instanceof Error) {
	        this.options.outputError(e, true);
	      }
	    }
	    if (zip) {
	      const zipDirectory = zip.getZipDirectory(), entries = Object.keys(zipDirectory);
	      for (let i = 0; i < entries.length; i += 1) {
	        const name2 = entries[i];
	        if (name2.startsWith("__MACOSX/")) {
	          Utils.console.log("processZipFile: Ignoring file:", name2);
	        } else {
	          let data2;
	          try {
	            data2 = zip.readData(name2);
	          } catch (e) {
	            Utils.console.error(e);
	            if (e instanceof Error) {
	              this.options.outputError(e, true);
	            }
	          }
	          if (data2) {
	            this.fnLoad2(data2, name2, "", imported);
	          }
	        }
	      }
	    }
	  }
	  fnLoad2(data, name, type, imported) {
	    let header;
	    if (type === "" && !(data instanceof Uint8Array)) {
	      header = DiskImage.parseAmsdosHeader(data);
	      if (header) {
	        type = "H";
	        data = data.substring(128);
	      } else if (_FileHandler.reRegExpIsText.test(data)) {
	        type = "A";
	      } else if (Snapshot.testSnapIdent(data.substring(0, 8))) {
	        type = "S";
	      } else if (DiskImage.testDiskIdent(data.substring(0, 8))) {
	        type = "X";
	      }
	    }
	    switch (type) {
	      case "A":
	      // "text/plain"
	      case "B":
	        header = DiskImage.createAmsdosHeader({
	          typeString: type,
	          length: data.length
	        });
	        break;
	      case "H":
	        break;
	      case "S":
	        header = DiskImage.createAmsdosHeader({
	          typeString: type,
	          length: data.length
	        });
	        break;
	      case "X":
	        if (this.processFileImports) {
	          this.processDskFile(data, name, imported);
	        } else {
	          header = DiskImage.createAmsdosHeader({
	            typeString: type,
	            length: data.length
	          });
	        }
	        break;
	      case "Z":
	        if (this.processFileImports) {
	          this.processZipFile(data instanceof Uint8Array ? data : Utils.string2Uint8Array(data), name, imported);
	        } else {
	          header = DiskImage.createAmsdosHeader({
	            typeString: type,
	            length: data.length
	          });
	        }
	        break;
	      default:
	        Utils.console.warn("fnLoad2: " + name + ": Unknown file type: " + type + ", assuming B");
	        header = DiskImage.createAmsdosHeader({
	          typeString: "B",
	          length: data.length
	        });
	        break;
	    }
	    if (header) {
	      const storageName = _FileHandler.getStorageName(this.options.adaptFilename(name, "FILE")), meta = _FileHandler.joinMeta(header), dataAsString = data instanceof Uint8Array ? Utils.uint8Array2string(data) : data;
	      try {
	        this.options.storage.setItem(storageName, meta + "," + dataAsString);
	        this.options.updateStorageDatabase("set", storageName);
	        Utils.console.log("fnOnLoad: file: " + storageName + " meta: " + meta + " imported");
	        imported.push(name);
	      } catch (e) {
	        Utils.console.error(e);
	        if (e instanceof Error) {
	          if (e.name === "QuotaExceededError") {
	            e.shortMessage = storageName + ": Quota exceeded";
	          }
	          this.options.outputError(e, true);
	        }
	      }
	    }
	  }
	};
	_FileHandler.metaIdent = "CPCBasic";
	_FileHandler.defaultExtensions = ["", "bas", "bin"];
	_FileHandler.reRegExpIsText = new RegExp(/^\d+ |^[\t\r\n\x1a\x20-\x7e]*$/);
	let FileHandler = _FileHandler;

	class NullCanvas {
	  reset() {
	  }
	  resetCustomChars() {
	  }
	  setScreenOffset(_offset) {
	  }
	  updateColorsAndCanvasImmediately(_inkList) {
	  }
	  updateSpeedInk() {
	  }
	  setCustomChar(_char, _charData) {
	  }
	  getCharData(_char) {
	    return [];
	  }
	  setDefaultInks() {
	  }
	  getXpos() {
	    return 0;
	  }
	  getYpos() {
	    return 0;
	  }
	  fillTextBox(_left, _top, _width, _height, _paper) {
	  }
	  getByte(_addr) {
	    return 0;
	  }
	  setByte(_addr, _byte) {
	  }
	  draw(_x, _y) {
	  }
	  move(_x, _y) {
	  }
	  plot(_x, _y) {
	  }
	  test(_x, _y) {
	    return 0;
	  }
	  setInk(_pen, _ink1, _ink2) {
	    return false;
	  }
	  setBorder(_ink1, _ink2) {
	  }
	  setGPen(_gPen) {
	  }
	  setGPaper(_gPaper) {
	  }
	  setGTransparentMode(_transparent) {
	  }
	  printGChar(_char) {
	  }
	  printChar(_char, _x, _y, _pen, _paper, _transparent) {
	  }
	  drawCursor(_x, _y, _pen, _paper) {
	  }
	  readChar(_x, _y, _pen, _paper) {
	    return 0;
	  }
	  fill(_fillPen) {
	  }
	  setOrigin(_xOrig, _yOrig) {
	  }
	  getXOrigin() {
	    return 0;
	  }
	  getYOrigin() {
	    return 0;
	  }
	  setGWindow(_xLeft, _xRight, _yTop, _yBottom) {
	  }
	  setGColMode(_gColMode) {
	  }
	  clearTextWindow(_left, _right, _top, _bottom, _paper) {
	  }
	  clearGraphicsWindow() {
	  }
	  clearFullWindow() {
	  }
	  windowScrollUp(_left, _right, _top, _bottom, _paper) {
	  }
	  windowScrollDown(_left, _right, _top, _bottom, _paper) {
	  }
	  setSpeedInk(_time1, _time2) {
	  }
	  setMask(_mask) {
	  }
	  setMaskFirst(_maskFirst) {
	  }
	  getMode() {
	    return 0;
	  }
	  changeMode(_mode) {
	  }
	  setMode(_mode) {
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
	      if (Object.prototype.hasOwnProperty.call(keywords10, key)) {
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
	      if (Object.prototype.hasOwnProperty.call(this.keywords, key)) {
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
	    let out;
	    if (closingQuotes < 0 || closingQuotes >= this.lineEnd) {
	      out = BasicTokenizer.fnControlsToUnicode(this.fnStringUntilEol());
	    } else {
	      out = BasicTokenizer.fnControlsToUnicode(this.input.substring(this.pos, closingQuotes + 1));
	      this.pos = closingQuotes + 1;
	    }
	    out = '"' + out;
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
	  setBasicVersion(basicVersion) {
	    this.options.parser.setOptions({ basicVersion });
	    this.options.lexer.setOptions({ keywords: this.options.parser.getKeywords() });
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
	    let lineString = this.line;
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
	      msg = msg.substring(0, msg.length - 1) + "? " + msg.slice(-1);
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
	  prepareProgramParser() {
	    this.options.lexer.setOptions({ keepWhiteSpace: false });
	    this.options.parser.setOptions({
	      keepBrackets: false,
	      keepColons: false,
	      keepDataComma: false,
	      keepTokens: false
	    });
	  }
	  generateProgram(input, variables) {
	    this.prepareProgramParser();
	    return this.generate(input, variables);
	  }
	  generateDirect(input, program, variables) {
	    this.prepareProgramParser();
	    if (program && (!isNaN(parseInt(program, 10)) || this.options.implicitLines)) {
	      const separator = program.endsWith("\n") ? "" : "\n", commandStart = program.length + separator.length, output = this.generate(program + separator + input, variables, true);
	      if (!output.error || !(output.error.pos < commandStart)) {
	        return output;
	      }
	      output.error.message = "[prg] " + output.error.message;
	    }
	    return this.generate(input, variables, true);
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
	  generatePretty(input, keepWhiteSpace, keepBrackets, keepColons) {
	    this.options.lexer.setOptions({ keepWhiteSpace });
	    this.options.parser.setOptions({ keepTokens: true, keepBrackets, keepColons, keepDataComma: true });
	    return this.generate(input);
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
	    let right;
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
	  generateProgram(input) {
	    this.options.lexer.setOptions({ keepWhiteSpace: true });
	    this.options.parser.setOptions({ keepTokens: true, keepBrackets: true, keepColons: true, keepDataComma: true });
	    return this.generate(input);
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
	      if (Object.prototype.hasOwnProperty.call(rsxCommands, command)) {
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
	    this.canvas = options.canvas;
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
	  getOnCanvasClickHandler() {
	    return this.fnOnCanvasClickHandler;
	  }
	  setCanvas(canvas) {
	    this.canvas = canvas;
	  }
	  /*
	  setCanvas(canvas: ICanvasVm): ICanvasVm {
	  	this.canvas = canvas;
	  	if (this.canvas) {
	  		this.canvas.setOptions({
	  			onCanvasClick: this.fnOnCanvasClickHandler
	  		});
	  	}
	  	return canvas;
	  }
	  */
	  vmGetLoadHandler() {
	    return this.fnLoadHandler;
	  }
	  vmGetMem() {
	    return this.mem;
	  }
	  onCanvasClickCallback(x, y, xTxt, yTxt, doubleClick) {
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
	      if ((char < 0 || char === 32 || char === 143) && doubleClick) {
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
	  /*
	  vmGetKeyboard(): Keyboard {
	  	return this.keyboard;
	  }
	  */
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
	    if (!inputParas.noCRLF) {
	      this.print(stream, "\r\n");
	    }
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
	    if (!inputParas.noCRLF) {
	      this.print(inputParas.stream, "\r\n");
	    }
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
	  vmPutFileInMemory(input, meta, includeSnapshot) {
	    if (input === null || input === void 0 || !meta) {
	      return false;
	    }
	    const inFile = this.inFile, shouldPutInMemory = meta.typeString === "B" || includeSnapshot && meta.typeString === "S" || inFile.start !== void 0;
	    if (!shouldPutInMemory) {
	      return false;
	    }
	    const start = inFile.start !== void 0 ? inFile.start : Number(meta.start);
	    let length = Number(meta.length);
	    if (isNaN(length)) {
	      length = input.length;
	    }
	    if (Utils.debug > 1) {
	      Utils.console.debug("vmPutFileInMemory:", inFile.name + ": putting data in memory", start, "-", start + length);
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
	    return true;
	  }
	  vmLoadCallback(input, meta) {
	    const putInMemory = this.vmPutFileInMemory(input, meta, true);
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
	    return s.substring(start - 1, len === void 0 ? void 0 : start - 1 + len);
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
	    if (input !== null && input !== void 0) {
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
	        if (Object.prototype.hasOwnProperty.call(dataLineIndex, dataLine)) {
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
	    const inFile = this.inFile, line = inFile.line, putInMemory = input !== null && input !== void 0 && Boolean(meta && (meta.typeString === "B" || inFile.start !== void 0));
	    if (input !== null && input !== void 0) {
	      const lineParas = {
	        command: "run",
	        stream: 0,
	        // unused
	        first: line,
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

	class InputLine {
	  constructor(keyboard, vm) {
	    this.keyboard = keyboard;
	    this.vm = vm;
	  }
	  submit(paras) {
	    if (!paras.noCRLF && paras.command !== "input" && paras.command !== "lineinput") {
	      this.vm.print(paras.stream, "\r\n");
	    }
	    return paras.fnInputCallback ? paras.fnInputCallback() : true;
	  }
	  readAndSubmit(paras, onReturn) {
	    const edited = this.read(paras.input, paras.stream);
	    paras.input = edited.input;
	    if (edited.submitted) {
	      onReturn?.(edited.input);
	      return this.submit(paras);
	    }
	    return false;
	  }
	  read(input, stream) {
	    let key;
	    do {
	      key = this.keyboard.getKeyFromBuffer();
	      switch (key) {
	        case "":
	        case "\r":
	          break;
	        case "":
	          key = "\x07";
	          break;
	        case "\x7F":
	          if (input.length) {
	            input = input.slice(0, -1);
	            key = "\b";
	          } else {
	            key = "\x07";
	          }
	          break;
	        case "\xE0": {
	          const copied = this.vm.copychr$(stream);
	          input += copied;
	          key = copied.length ? "	" : "\x07";
	          break;
	        }
	        case "\xF0":
	          key = input.length ? "\x07" : "\v";
	          break;
	        case "\xF1":
	          key = input.length ? "\x07" : "\n";
	          break;
	        case "\xF2":
	          key = input.length ? "\x07" : "\b";
	          break;
	        case "\xF3":
	          key = input.length ? "\x07" : "	";
	          break;
	        case "\xF4":
	        case "\xF5":
	        case "\xF6":
	        case "\xF7":
	        case "\xF8":
	        case "\xF9":
	        case "\xFA":
	        case "\xFB":
	          key = "";
	          break;
	        default:
	          input += key;
	          if (key < " ") {
	            key = "" + key;
	          }
	          break;
	      }
	      if (key && key !== "\r") {
	        this.vm.print(stream, key);
	      }
	    } while (key !== "" && key !== "\r");
	    return { input, submitted: key === "\r" };
	  }
	}

	class ExecutionStateReporter {
	  constructor(onChange) {
	    this.onChange = onChange;
	  }
	  report(state) {
	    const previous = this.previous;
	    if (previous && previous.reason === state.reason && previous.line === state.line && previous.isRunning === state.isRunning) {
	      return;
	    }
	    this.previous = { ...state };
	    this.onChange?.({ ...state });
	  }
	}

	class ProgramCompiler {
	  constructor(options) {
	    this.options = options;
	  }
	  compile(input, variables) {
	    const options = this.options, output = options.generator.generateProgram(input, variables);
	    if (output.error) {
	      return output;
	    }
	    options.vm.vmSetSourceMap(options.generator.getSourceMap());
	    const tokens = options.encodeTokens(input);
	    options.onTokenized?.(input.length, tokens.length);
	    try {
	      options.vm.vmPutProgramInMem(tokens);
	    } catch (error) {
	      options.onMemoryError(error);
	    }
	    return output;
	  }
	}

	class ProgramRunner {
	  constructor(options) {
	    this.options = options;
	  }
	  static compile(script) {
	    return new Function("o", script);
	  }
	  static listProgram(vm, lines, stream) {
	    for (const line of BasicFormatter.formatListing(lines, stream)) {
	      vm.print(stream, line, "\r\n");
	    }
	    vm.vmGoto(0);
	    vm.vmStop("end", 0, true);
	  }
	  static editLine(vm, paras, line, onInput) {
	    vm.print(paras.stream, line);
	    vm.cursor(paras.stream, 1);
	    const input = {
	      command: paras.command,
	      line: paras.line,
	      stream: paras.stream,
	      message: "",
	      fnInputCallback: onInput,
	      input: line
	    };
	    vm.vmStop("waitInput", 45, true, input);
	  }
	  static renumberProgram(vm, source, paras, renumber, setSource, onError) {
	    const output = renumber(source, paras.newLine || 10, paras.oldLine || 1, paras.step || 10, paras.keep || 65535);
	    if (output.error) {
	      onError(output.error);
	    } else {
	      setSource(output.text);
	    }
	    vm.vmGoto(0);
	    vm.vmStop("end", 0, true);
	    return output;
	  }
	  static commitEditedLine(vm, paras, source, merge, setSource, onProgramEdited) {
	    setSource(merge(source, paras.input));
	    vm.vmSetStartLine(0);
	    vm.vmGoto(0);
	    onProgramEdited?.();
	    vm.cursor(paras.stream, 0);
	    vm.vmStop("end", 90);
	    return true;
	  }
	  static newProgram(vm, clearSource, clearVariables, invalidate) {
	    clearSource();
	    clearVariables();
	    vm.vmGoto(0);
	    vm.vmStop("end", 0, true);
	    invalidate();
	  }
	  static resetProgram(vm, clearVariables, resetDevices, clearOutput, invalidate) {
	    clearVariables();
	    vm.vmReset();
	    resetDevices();
	    vm.vmStop("end", 0, true);
	    clearOutput();
	    invalidate();
	  }
	  static prepareChainMergeLoad(vm, file, deleteLines) {
	    if (file.command === "chainMerge" && file.first && file.last) {
	      deleteLines({
	        first: file.first,
	        last: file.last,
	        command: "CHAIN MERGE",
	        stream: 0,
	        line: vm.line
	      });
	      vm.vmStop("fileLoad", 90);
	    }
	  }
	  static closeSavedFile(vm, file, data, onWarning) {
	    if (file.fnFileCallback) {
	      try {
	        file.fnFileCallback(data);
	      } catch (error) {
	        onWarning(error);
	      }
	    }
	    vm.vmResetOutFileHandling();
	  }
	  static dispatchFileSave(vm, file, save, onSaved, onNotOpen, onWarning) {
	    if (file.open) {
	      const data = save(file);
	      onSaved(file.name);
	      ProgramRunner.closeSavedFile(vm, file, data, onWarning);
	    } else {
	      onNotOpen();
	    }
	    vm.vmStop("", 0, true);
	  }
	  static dispatchFileLoad(file, actions) {
	    if (file.open) {
	      ProgramRunner.prepareChainMergeLoad(actions.vm, file, actions.deleteLines);
	      actions.logFile(file);
	      const input = actions.loadFromStorage(file.name);
	      if (input !== null) {
	        actions.onStorageLoad(input);
	      } else {
	        actions.loadExample();
	      }
	    } else {
	      actions.onNotOpen(file.name);
	    }
	    actions.setNextDelay(actions.vm.vmGetTimeUntilFrame());
	  }
	  static applyLoad(request, actions) {
	    let startLine = 0;
	    switch (request.command) {
	      case "openin":
	        break;
	      case "chainMerge":
	        actions.setSource(actions.merge(actions.getSource(), request.input));
	        actions.clearResult();
	        startLine = request.line;
	        actions.invalidate();
	        actions.parseChain();
	        break;
	      case "load":
	        if (!request.inMemory) {
	          actions.setSource(request.input);
	          actions.clearResult();
	          actions.invalidate();
	          actions.vm.vmStop("end", 90);
	        }
	        break;
	      case "merge":
	        actions.setSource(actions.merge(actions.getSource(), request.input));
	        actions.clearResult();
	        actions.invalidate();
	        actions.removeVariables();
	        actions.vm.vmStop("end", 90);
	        break;
	      case "chain":
	        actions.setSource(request.input);
	        actions.clearResult();
	        startLine = request.line;
	        actions.invalidate();
	        actions.parseChain();
	        break;
	      case "run":
	        if (!request.inMemory) {
	          actions.setSource(request.input);
	          actions.clearResult();
	          startLine = request.line;
	          if (!request.isSnapshot) {
	            actions.reset();
	          }
	          actions.parseRun();
	        } else {
	          actions.reset();
	          actions.vm.clear();
	          actions.loadFileInMemory();
	        }
	        break;
	      default:
	        actions.onUnknownCommand(request.command);
	        break;
	    }
	    return startLine;
	  }
	  static continueLoad(input, file, actions) {
	    const { decode, decodeTokenizedBasic, loadFileInMemory, setStartLine, startMainLoop, onWarning, onError, ...loadActions } = actions;
	    let data, putInMemory = false;
	    if (input !== null && input !== void 0) {
	      data = decode(input);
	      input = data.data;
	    }
	    const command = file.command, line = file.line || 0, name = file.name;
	    if (file.fnFileCallback) {
	      try {
	        putInMemory = Boolean(file.fnFileCallback(input, data?.meta));
	      } catch (error) {
	        onWarning(error);
	      }
	    }
	    if (input === void 0) {
	      onError("loadFileContinue: File " + name + ": input undefined!");
	      actions.vm.vmStop("stop", 60, true);
	      startMainLoop();
	      return;
	    }
	    if (input === null) {
	      startMainLoop();
	      return;
	    }
	    if (data?.meta.typeString === "S" && putInMemory) {
	      input = decodeTokenizedBasic(input.substring(368));
	      putInMemory = false;
	    }
	    const startLine = ProgramRunner.applyLoad({ command, input, line, inMemory: putInMemory, isSnapshot: data?.meta.typeString === "S" }, {
	      ...loadActions,
	      loadFileInMemory: () => {
	        loadFileInMemory(input, data?.meta);
	      }
	    });
	    setStartLine(startLine);
	    startMainLoop();
	  }
	  static enterDirectMode(vm, onInput) {
	    const stream = 0, message = "Ready\r\n";
	    vm.tagoff(stream);
	    vm.vmResetControlBuffer();
	    if (vm.pos(stream) > 1) {
	      vm.print(stream, "\r\n");
	    }
	    vm.print(stream, message);
	    vm.cursor(stream, 1, 1);
	    vm.vmStop("direct", 0, true, {
	      command: "direct",
	      stream,
	      message,
	      fnInputCallback: onInput,
	      input: "",
	      line: vm.line
	    });
	  }
	  static finishInput(vm, reason, startMainLoop, continueExecution) {
	    if (reason === "waitInput") {
	      vm.vmStop("", 0, true);
	    } else if (reason === "direct") {
	      vm.vmStop("", 0, true);
	      startMainLoop();
	    } else {
	      continueExecution();
	    }
	  }
	  invalidate() {
	    this.script = void 0;
	  }
	  setScript(script) {
	    this.script = script;
	  }
	  start(source, vm, line = 0, beforeCompile) {
	    if (line === 0) {
	      vm.vmResetData();
	    }
	    beforeCompile?.();
	    if (!this.script) {
	      try {
	        this.script = ProgramRunner.compile(source);
	      } catch (error) {
	        (this.options.logger || Utils.console).error(error);
	        if (error instanceof Error) {
	          this.options.onJsError?.(error);
	          error.shortMessage = "JS " + String(error);
	          this.options.outputError(error, true);
	        }
	        this.script = void 0;
	      }
	    }
	    vm.vmReset4Run();
	    if (!this.script) {
	      return false;
	    }
	    vm.vmStop("", 0, true);
	    vm.vmGoto(0);
	    vm.vmSetStartLine(line);
	    return true;
	  }
	  execute(vm) {
	    const script = this.script;
	    if (script) {
	      this.run(() => {
	        script(vm);
	      });
	    }
	  }
	  run(execute) {
	    const options = this.options, logger = options.logger || Utils.console;
	    try {
	      execute();
	    } catch (error) {
	      if (!(error instanceof Error)) {
	        logger.error(error);
	        return;
	      }
	      if (error.name === "CpcVm" || error.name === "Variables") {
	        let customError = error;
	        if (customError.errCode !== void 0) {
	          customError = options.composeError(customError, customError.errCode, customError.value);
	        }
	        if (!customError.hidden) {
	          logger.warn(customError);
	          options.outputError(customError, !customError.pos);
	        } else {
	          logger.log(customError.message);
	        }
	      } else {
	        logger.error(error);
	        options.onJsError?.(error);
	        options.composeError(error, 2, "JS " + String(error));
	        options.outputError(error, true);
	      }
	    }
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
	    let mantissa = 0, exponent, sign = 0;
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
	    this.rndGen.init(seed);
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
	    Reflect.apply(this.renum, this, args);
	  }
	};
	let RsxCpcBasic = _RsxCpcBasic;

	class RuntimeSettings {
	  constructor(options) {
	    this.options = options;
	  }
	  setImplicitLines(value) {
	    this.options.codeGeneratorJs.setOptions({ implicitLines: value });
	    this.options.codeGeneratorToken.setOptions({ implicitLines: value });
	  }
	  setIntegerOverflow(value) {
	    this.options.codeGeneratorJs.setOptions({ integerOverflow: value });
	  }
	  setTrace(value) {
	    this.options.codeGeneratorJs.setOptions({ trace: value });
	  }
	  setPrettyLowercaseVars(value) {
	    this.options.codeGeneratorBasic.setOptions({ lowercaseVars: value });
	  }
	  setArrayBounds(value) {
	    const variables = this.options.variables;
	    variables.setOptions({ arrayBounds: value });
	    this.options.vm.vmGoto(0);
	    this.options.vm.vmStop("end", 0, true);
	    if (Object.keys(variables.getAllVariables()).length) {
	      variables.removeAllVariables();
	      this.options.onVariablesCleared?.();
	    }
	  }
	  static getLoopDelay(speed) {
	    return 1e3 - speed * 10;
	  }
	}

	class RunLoop {
	  constructor(options) {
	    this.options = options;
	    this.active = false;
	    this.runHandler = () => {
	      this.run();
	    };
	    this.nextDelay = 0;
	  }
	  get isRunning() {
	    return this.active;
	  }
	  start() {
	    if (!this.active) {
	      this.active = true;
	      this.options.setTimeout(this.runHandler, 0);
	    }
	    this.options.onStateChange();
	  }
	  run() {
	    const options = this.options, stop = options.vm.vmGetStopObject();
	    this.nextDelay = options.getInitialDelay();
	    if (!stop.reason) {
	      options.execute();
	    }
	    if (Object.prototype.hasOwnProperty.call(options.handlers, stop.reason)) {
	      options.handlers[stop.reason](stop.paras);
	    } else {
	      options.onUnknownReason(stop.reason);
	      options.vm.vmStop("error", 50);
	    }
	    if (stop.reason && stop.reason !== "waitSound" && stop.reason !== "waitKey" && stop.reason !== "waitInput") {
	      this.active = false;
	      options.onStateChange();
	      options.onExit();
	    } else {
	      options.setTimeout(this.runHandler, this.nextDelay);
	    }
	    options.onStateChange();
	  }
	}

	class SoundQueue {
	  constructor(vm, sound) {
	    this.vm = vm;
	    this.sound = sound;
	  }
	  poll(activated = true) {
	    const stop = this.vm.vmGetStopObject();
	    this.vm.vmLoopCondition();
	    if (activated) {
	      const queue = this.vm.vmGetSoundData();
	      while (queue.length && this.sound.testCanQueue(queue[0].state)) {
	        const data = queue[0];
	        queue.shift();
	        this.sound.sound(data);
	      }
	      if (!queue.length && stop.reason === "waitSound") {
	        this.vm.vmStop("", 0, true);
	      }
	    }
	    return this.vm.vmGetTimeUntilFrame();
	  }
	}

	class SuspendedState {
	  constructor(initial) {
	    this.initial = SuspendedState.copy(initial);
	    this.saved = SuspendedState.copy(initial);
	  }
	  static copy(stop) {
	    return { ...stop, paras: { ...stop.paras } };
	  }
	  save(stop) {
	    if (stop.reason !== "break" && stop.reason !== "escape") {
	      this.saved = SuspendedState.copy(stop);
	    }
	  }
	  get() {
	    return SuspendedState.copy(this.saved);
	  }
	  reset() {
	    this.saved = SuspendedState.copy(this.initial);
	  }
	  restore(stop) {
	    Object.assign(stop, this.get());
	    this.reset();
	  }
	  restoreForContinue(vm, stop, beforeRestore) {
	    if (stop.reason !== "break" && stop.reason !== "escape" && stop.reason !== "stop" && stop.reason !== "direct") {
	      return false;
	    }
	    if (stop.reason === "direct" || stop.reason === "escape") {
	      vm.cursor(stop.paras.stream, 0);
	    }
	    beforeRestore?.();
	    this.restore(stop);
	    return true;
	  }
	  escape(vm, keyboard) {
	    const stop = vm.vmGetStopObject(), stream = 0;
	    if (vm.vmOnBreakContSet()) {
	      return "ignored";
	    }
	    if (stop.reason === "direct" || vm.vmOnBreakHandlerActive()) {
	      stop.paras.input = "";
	      vm.print(stream, "*Break*\r\n");
	      return "input";
	    }
	    if (stop.reason !== "escape") {
	      vm.cursor(stream, 1);
	      keyboard.clearInput();
	      this.save(stop);
	      vm.vmStop("escape", 85, false, { command: "escape", stream, first: 0, last: 0, line: vm.line });
	      return "suspended";
	    }
	    vm.cursor(stream, 0);
	    const saved = this.get();
	    if (saved.reason === "waitInput") {
	      vm.vmGoto(saved.paras.line);
	    }
	    if (!vm.vmEscape()) {
	      vm.vmStop("", 0, true);
	      this.reset();
	      return "continued";
	    }
	    vm.vmStop("stop", 0, true);
	    vm.print(stream, "Break in " + vm.line + "\r\n");
	    return "stopped";
	  }
	}

	class ArrayProxy {
	  static create(len) {
	    return new Proxy(new Array(len), new ArrayProxy());
	  }
	  // eslint-disable-next-line class-methods-use-this
	  get(target, prop) {
	    if (typeof prop === "string" && !isNaN(Number(prop))) {
	      const numProp = Number(prop);
	      if (numProp < 0 || numProp >= target.length) {
	        throw Utils.composeVmError("Variables", Error(), 9, prop);
	      }
	    }
	    return Reflect.get(target, prop);
	  }
	  // eslint-disable-next-line class-methods-use-this
	  set(target, prop, value) {
	    if (typeof prop === "string" && !isNaN(Number(prop))) {
	      const numProp = Number(prop);
	      if (numProp < 0 || numProp >= target.length) {
	        throw Utils.composeVmError("Variables", Error(), 9, prop);
	      }
	    }
	    return Reflect.set(target, prop, value);
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
	    const fnCreateRec = (index) => {
	      const len = dims[index], arr = this.options.arrayBounds ? ArrayProxy.create(len) : new Array(len);
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
	    };
	    return fnCreateRec(0);
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

	class Runtime {
	  constructor(options) {
	    this.onVariablesCleared = options.onVariablesCleared;
	    this.outputError = options.outputError;
	    this.logger = options.logger;
	    this.executionStateReporter = new ExecutionStateReporter(options.onExecutionState);
	    this.programHost = options.programHost;
	    this.keyboard = options.keyboard;
	    this.variables = new Variables({ arrayBounds: options.arrayBounds });
	    const random = new Random(options.randomMode === "cpc");
	    this.vm = new CpcVm({
	      canvas: options.canvas,
	      keyboard: options.keyboard,
	      random,
	      sound: options.sound,
	      variables: this.variables,
	      onClickKey: options.onClickKey
	    });
	    this.vm.vmRegisterRsx(new RsxAmsdos(), true);
	    this.vm.vmRegisterRsx(new RsxCpcBasic(), true);
	    this.suspendedState = new SuspendedState(this.vm.vmGetStopObject());
	    this.inputLine = new InputLine(options.keyboard, this.vm);
	    this.soundQueue = new SoundQueue(this.vm, options.sound);
	    this.programRunner = new ProgramRunner({
	      composeError: this.vm.vmComposeError.bind(this.vm),
	      outputError: options.outputError,
	      onJsError: options.onJsError,
	      logger: options.logger
	    });
	    this.basicParser = new BasicParser({ basicVersion: options.basicVersion });
	    this.basicLexer = new BasicLexer({ keywords: this.basicParser.getKeywords() });
	    this.basicFormatter = new BasicFormatter({ lexer: this.basicLexer, parser: this.basicParser });
	    this.basicTokenizer = new BasicTokenizer();
	    this.codeGeneratorBasic = new CodeGeneratorBasic({
	      lexer: this.basicLexer,
	      parser: this.basicParser,
	      lowercaseVars: options.prettyLowercaseVars
	    });
	    this.codeGeneratorToken = new CodeGeneratorToken({
	      lexer: this.basicLexer,
	      parser: this.basicParser,
	      implicitLines: options.implicitLines
	    });
	    this.codeGeneratorJs = new CodeGeneratorJs({
	      lexer: this.basicLexer,
	      parser: this.basicParser,
	      trace: options.trace,
	      implicitLines: options.implicitLines,
	      integerOverflow: options.integerOverflow
	    });
	    this.programCompiler = new ProgramCompiler({
	      generator: this.codeGeneratorJs,
	      vm: this.vm,
	      encodeTokens: (input) => this.encodeTokenizedBasic(input),
	      onTokenized: options.onTokenized,
	      onMemoryError: options.onMemoryError
	    });
	    this.runtimeSettings = new RuntimeSettings({
	      codeGeneratorJs: this.codeGeneratorJs,
	      variables: this.variables,
	      vm: this.vm,
	      codeGeneratorBasic: this.codeGeneratorBasic,
	      codeGeneratorToken: this.codeGeneratorToken,
	      onVariablesCleared: options.onVariablesCleared
	    });
	    const handlers = {
	      timer: () => {
	        this.vm.vmStop("", 0, true);
	      },
	      waitFrame: () => {
	        this.handleWaitFrame();
	      },
	      onError: () => {
	        this.vm.vmStop("", 0, true);
	      },
	      error: Runtime.noop,
	      stop: Runtime.noop,
	      break: Runtime.noop,
	      escape: Runtime.noop,
	      end: Runtime.noop,
	      ...options.handlers
	    };
	    this.runLoop = new RunLoop({
	      vm: this.vm,
	      execute: () => {
	        this.programRunner.execute(this.vm);
	      },
	      handlers,
	      getInitialDelay: options.getInitialDelay,
	      setTimeout: options.setTimeout,
	      onExit: options.onExit,
	      onStateChange: () => {
	        this.executionStateReporter.report(this.getExecutionState());
	      },
	      onUnknownReason: options.onUnknownReason
	    });
	  }
	  getExecutionState() {
	    return {
	      reason: this.vm.vmGetStopObject().reason,
	      line: this.vm.line,
	      isRunning: this.runLoop.isRunning
	    };
	  }
	  addLineNumbers(source) {
	    return BasicFormatter.addLineNumbers(source);
	  }
	  mergeScripts(source, added, implicitLines, onInvalid) {
	    return BasicFormatter.mergeScripts(source, added, implicitLines, onInvalid);
	  }
	  getLinesInRangeFromScript(source, firstLine, lastLine, implicitLines, onInvalid) {
	    return BasicFormatter.getLinesInRangeFromScript(source, firstLine, lastLine, implicitLines, onInvalid);
	  }
	  encodeTokenizedBasic(input, name = "test") {
	    const output = this.codeGeneratorToken.generateProgram(input);
	    if (output.error) {
	      this.outputError(output.error);
	    } else if (Utils.debug > 1) {
	      const outputText = output.text, hex = outputText.split("").map((char) => char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")).join(","), decoded = this.basicTokenizer.decode(outputText), diff = Diff.testDiff(input.toUpperCase(), decoded.toUpperCase());
	      this.logger.debug("TokenizerInput (" + name + ") [len=" + input.length + "]:\n" + input);
	      this.logger.debug("TokenizerOutputHex (" + name + ") [len=" + outputText.length + "]:\n" + hex);
	      this.logger.debug("TokenizerOutputDecoded (" + name + ") [len=" + decoded.length + "]:\n" + decoded);
	      this.logger.debug("TokenizerDiff (" + name + ") [len=" + diff.length + "]:\n" + diff);
	    }
	    return output.text;
	  }
	  formatDiff(source, result) {
	    return Diff.testDiff(source.toUpperCase(), result.toUpperCase());
	  }
	  startMainLoop() {
	    this.runLoop.start();
	  }
	  setNextDelay(delay) {
	    this.runLoop.nextDelay = delay;
	  }
	  static noop() {
	  }
	  reset() {
	    this.vm.vmReset();
	  }
	  applySnapshot(data, name = "") {
	    const snapshot = new Snapshot({ name, data });
	    return snapshot.applyToVm(this.vm);
	  }
	  continueLoad(input, file, actions) {
	    ProgramRunner.continueLoad(input, file, {
	      ...actions,
	      vm: this.vm,
	      setStartLine: (line) => {
	        this.vm.vmSetStartLine(line);
	      },
	      loadFileInMemory: (fileInput, meta) => this.vm.vmPutFileInMemory(fileInput, meta, false)
	    });
	  }
	  dispatchFileLoad(file, actions) {
	    ProgramRunner.dispatchFileLoad(file, {
	      ...actions,
	      vm: this.vm,
	      onStorageLoad: (input) => {
	        this.completeStorageLoad(input, actions.onStorageLoad);
	      }
	    });
	  }
	  completeStorageLoad(input, continueLoad) {
	    this.vm.vmStop("", 0, true);
	    continueLoad(input);
	  }
	  completeExampleLoad(input, rsx, continueLoad) {
	    this.vm.vmStop("", 0, true);
	    if (rsx) {
	      this.vm.vmRegisterRsx(rsx, false);
	    }
	    continueLoad(input);
	  }
	  failExampleLoad(example, outputError, continueLoad) {
	    this.vm.vmStop("", 0, true);
	    const error = this.vm.vmComposeError(Error(), 32, example + " not found");
	    if (error.hidden) {
	      this.vm.vmStop("", 0, true);
	    }
	    outputError(error, true);
	    continueLoad(null);
	  }
	  dispatchFileSave(file, save, onSaved, onNotOpen, onWarning) {
	    ProgramRunner.dispatchFileSave(this.vm, file, save, onSaved, onNotOpen, onWarning);
	  }
	  finishInput(reason, startMainLoop, continueExecution) {
	    ProgramRunner.finishInput(this.vm, reason, startMainLoop, continueExecution);
	  }
	  handleWaitSound(activated = true) {
	    this.runLoop.nextDelay = this.soundQueue.poll(activated);
	  }
	  handleWaitFrame() {
	    this.vm.vmStop("", 0, true);
	    this.runLoop.nextDelay = this.vm.vmGetTimeUntilFrame();
	  }
	  handleWaitKey(isSoundActivated = () => true, onKey) {
	    const key = this.keyboard.getKeyFromBuffer();
	    if (key !== "") {
	      onKey?.(key);
	      this.vm.vmStop("", 0, true);
	    } else {
	      this.handleWaitSound(isSoundActivated());
	    }
	    return key;
	  }
	  handleWaitInput(actions) {
	    const stop = this.vm.vmGetStopObject(), inputParas = stop.paras;
	    if (!inputParas || inputParas.input === void 0 || inputParas.stream === void 0) {
	      actions.onInvalid(this.vm.vmComposeError(Error(), 32, "Programming Error: fnWaitInput"));
	      return { status: "invalid" };
	    }
	    if (!this.inputLine.readAndSubmit(inputParas, actions.onInputReturn)) {
	      return { status: "pending", reason: stop.reason };
	    }
	    actions.onInputSubmitted?.();
	    this.finishInput(stop.reason, actions.startMainLoop, actions.continueExecution);
	    return { status: "submitted" };
	  }
	  enterDirectMode(onInput) {
	    ProgramRunner.enterDirectMode(this.vm, onInput);
	  }
	  resetSuspendedState() {
	    this.suspendedState.reset();
	  }
	  beginControl(reason, beforeStop) {
	    const priority = reason === "break" ? 80 : reason === "reset" ? 99 : 95;
	    if (reason === "break") {
	      this.saveSuspendedState();
	    } else if (reason !== "parse") {
	      this.resetSuspendedState();
	    }
	    beforeStop?.();
	    this.vm.vmStop(reason, priority);
	  }
	  beginRenumber(options = {}) {
	    this.vm.vmStop("renumLines", 85, false, {
	      command: "renum",
	      stream: 0,
	      newLine: options.newLine,
	      oldLine: options.oldLine,
	      step: options.step,
	      keep: options.keep,
	      line: this.vm.line
	    });
	  }
	  deleteProgramLines(paras, lines, applyDeletion, onInvalid) {
	    if (lines.length) {
	      const deletion = BasicFormatter.createDeleteScript(lines);
	      if (deletion === void 0) {
	        onInvalid(this.vm.vmComposeError(Error(), 21, paras.command));
	      } else {
	        applyDeletion(deletion);
	      }
	    }
	    this.vm.vmGoto(0);
	    this.vm.vmStop("end", 0, true);
	  }
	  eraseFiles(fileHandler, paras, onRemoved, onMissing) {
	    const result = fileHandler.eraseFiles(paras.fileMask || "");
	    if (!result.matched) {
	      this.vm.print(paras.stream, result.name + " not found\r\n");
	    }
	    for (const name of result.removed) {
	      onRemoved(name);
	    }
	    for (const name of result.missing) {
	      this.vm.print(paras.stream, name + " not found\r\n");
	      onMissing(name);
	    }
	    this.vm.vmStop("", 0, true);
	    return result;
	  }
	  renameFile(fileHandler, paras) {
	    const result = fileHandler.renameFile(paras.oldName, paras.newName);
	    if (result.status === "newExists") {
	      this.vm.print(paras.stream, result.oldName + " already exists\r\n");
	    } else if (result.status === "oldNotFound") {
	      this.vm.print(paras.stream, result.oldName + " not found\r\n");
	    }
	    this.vm.vmStop("", 0, true);
	    return result;
	  }
	  saveSuspendedState() {
	    this.suspendedState.save(this.vm.vmGetStopObject());
	  }
	  handleEscape(keyboard) {
	    return this.suspendedState.escape(this.vm, keyboard);
	  }
	  restoreForContinue(beforeRestore) {
	    return this.suspendedState.restoreForContinue(this.vm, this.vm.vmGetStopObject(), beforeRestore);
	  }
	  continueProgram(startMainLoop, beforeRestore, onContinueState) {
	    const restored = this.restoreForContinue(beforeRestore);
	    onContinueState?.(restored);
	    startMainLoop();
	  }
	  compileProgram(source) {
	    return this.programCompiler.compile(source, this.variables);
	  }
	  parseProgram() {
	    return this.compileHostProgram(false).output;
	  }
	  setArrayBounds(value) {
	    this.runtimeSettings.setArrayBounds(value);
	  }
	  setImplicitLines(value) {
	    this.runtimeSettings.setImplicitLines(value);
	  }
	  setPrettyLowercaseVars(value) {
	    this.runtimeSettings.setPrettyLowercaseVars(value);
	  }
	  setIntegerOverflow(value) {
	    this.runtimeSettings.setIntegerOverflow(value);
	  }
	  setTrace(value) {
	    this.runtimeSettings.setTrace(value);
	  }
	  setBasicVersion(value) {
	    this.codeGeneratorJs.setBasicVersion(value);
	  }
	  static getLoopDelay(speed) {
	    return RuntimeSettings.getLoopDelay(speed);
	  }
	  listProgram(lines, stream) {
	    ProgramRunner.listProgram(this.vm, lines, stream);
	  }
	  printDirectoryEntries(entries, stream, sort) {
	    for (const text of FileHandler.formatDirectoryEntries(entries, sort)) {
	      this.vm.print(stream, text);
	    }
	    this.vm.vmStop("", 0, true);
	  }
	  editLine(paras, line, onInput, onMissing) {
	    if (line === void 0) {
	      onMissing(this.vm.vmComposeError(Error(), 8, String(paras.first || 0)));
	      this.vm.vmStop("stop", 60, true);
	      return false;
	    }
	    ProgramRunner.editLine(this.vm, paras, line, onInput);
	    return true;
	  }
	  renumProgram(source, paras, renumber, setSource, onError) {
	    return ProgramRunner.renumberProgram(this.vm, source, paras, renumber, setSource, onError);
	  }
	  commitEditedLine(paras, source, merge, setSource, onProgramEdited) {
	    return ProgramRunner.commitEditedLine(this.vm, paras, source, merge, setSource, onProgramEdited);
	  }
	  compileDirectProgram(input, source) {
	    return this.codeGeneratorJs.generateDirect(input, source, this.variables);
	  }
	  readDirectInput() {
	    const inputParas = this.vm.vmGetStopObject().paras, input = inputParas.input.trim();
	    inputParas.input = "";
	    if (input !== "") {
	      this.vm.cursor(inputParas.stream, 0);
	    }
	    return {
	      input,
	      stream: inputParas.stream,
	      message: inputParas.message,
	      isProgramLine: input !== "" && !Number.isNaN(BasicFormatter.parseLineNumber(input))
	    };
	  }
	  executeDirectCommand(input, source, line, stream, inputMessage, actions) {
	    const output = this.compileDirectProgram(input, source);
	    let outputText = output.error ? actions.outputError(output.error) : output.text;
	    if (outputText && outputText.length > 0) {
	      outputText += "\n";
	    }
	    actions.setOutputText(outputText);
	    if (!output.error) {
	      try {
	        this.prepareDirectProgram(outputText, line);
	      } catch (error) {
	        actions.onPrepareError(error);
	      }
	    } else {
	      this.vm.print(stream, inputMessage);
	      this.vm.cursor(stream, 1);
	    }
	    return output;
	  }
	  insertDirectProgramLine(source, input, stream, merge, setSource, onProgramEdited) {
	    setSource(merge(source, input));
	    this.vm.vmSetStartLine(0);
	    this.vm.vmGoto(0);
	    onProgramEdited?.();
	    this.vm.cursor(stream, 1);
	  }
	  prepareDirectProgram(source, line) {
	    this.vm.vmSetStartLine(line);
	    this.vm.vmGoto("direct");
	    this.programRunner.setScript(ProgramRunner.compile(source));
	    this.vm.vmSetSourceMap(this.codeGeneratorJs.getSourceMap());
	  }
	  compileAndStartProgram(options) {
	    const result = this.compileHostProgram(options.clearVariables);
	    if (!result.output.error) {
	      this.startProgram(result.source, 0, options.clearBeforeRun);
	    }
	    return result.output;
	  }
	  resetProgram(resetDevices, clearOutput, invalidate) {
	    ProgramRunner.resetProgram(this.vm, () => {
	      this.removeAllVariables();
	    }, resetDevices, clearOutput, invalidate);
	  }
	  newProgram(clearSource, invalidate) {
	    ProgramRunner.newProgram(this.vm, clearSource, () => {
	      this.removeAllVariables();
	    }, invalidate);
	  }
	  removeAllVariables() {
	    if (Object.keys(this.variables.getAllVariables()).length) {
	      this.variables.removeAllVariables();
	      this.onVariablesCleared?.();
	    }
	  }
	  startProgram(source, line, clearBeforeRun) {
	    if (clearBeforeRun) {
	      this.vm.clear();
	    }
	    const started = this.programRunner.start(source, this.vm, line, this.programHost.beforeProgramStart);
	    this.programHost.afterProgramStart?.();
	    return started;
	  }
	  compileHostProgram(clearVariables) {
	    if (clearVariables) {
	      this.removeAllVariables();
	    }
	    const source = this.programHost.getSource();
	    this.programHost.beforeCompileProgram?.(source);
	    const output = this.compileProgram(source), compiledSource = this.programHost.prepareCompileOutput(output);
	    return { output, source: compiledSource };
	  }
	  invalidateProgram() {
	    this.programRunner.invalidate();
	  }
	  setProgramScript(script) {
	    this.programRunner.setScript(script);
	  }
	}

	class Engine {
	  constructor(defaultConfig) {
	    this.files = {
	      createExampleLoadRequest: FileHandler.createExampleLoadRequest,
	      prepareExampleLoad: FileHandler.prepareExampleLoad,
	      loadFromStorage: FileHandler.loadFromStorage,
	      splitMeta: FileHandler.splitMeta,
	      decodeStoredFile: FileHandler.decodeStoredFile,
	      getStorageDirectoryEntries: FileHandler.getStorageDirectoryEntries,
	      getDirectoryEntries: FileHandler.getDirectoryEntries,
	      joinMeta: FileHandler.joinMeta
	    };
	    this.core = new Core(defaultConfig);
	  }
	  createRuntime(options) {
	    return new Runtime(options);
	  }
	  createFileHandler(options) {
	    return new FileHandler(options);
	  }
	  createDiagnostic(error, noSelection = false, errCode) {
	    return Utils.createDiagnostic(error, noSelection, errCode);
	  }
	  escapeControlCharacters(input) {
	    return Utils.escapeControlCharacters(input);
	  }
	  getLoopDelay(speed) {
	    return Runtime.getLoopDelay(speed);
	  }
	}
	Engine.NullCanvas = NullCanvas;

	const cpcconfig = {
	  // eslint-disable-line no-unused-vars
	  databaseDirs: "./examples,https://benchmarko.github.io/CPCBasicApps/apps,https://benchmarko.github.io/LocoBasic/examples=locobasic,https://benchmarko.github.io/CPCBasicApps/rosetta,storage",
	  //databaseDirs: "./examples,../../CPCBasicApps/apps,../../LocoBasic/dist/examples=locobasic,../../CPCBasicApps/rosetta,storage", // local test
	  // just an example, not the full list of moved examples...
	  redirectExamples: {
	    "examples/art": {
	      database: "apps",
	      example: "demo/art"
	    },
	    "examples/blkedit": {
	      database: "apps",
	      example: "apps/blkedit"
	    }
	  }
	};

	class Controller0 {
	  constructor(engine, options) {
	    this.inScript = "";
	    this.outScript = "";
	    this.initialLoopTimeout = 0;
	    /* eslint-disable no-invalid-this */
	    this.handlers = {
	      waitKey: () => this.runtime.handleWaitKey(),
	      waitSound: this.fnWaitSound,
	      waitInput: this.fnWaitInput,
	      fileCat: this.fnFileCat,
	      fileDir: this.fnFileDir,
	      fileEra: this.fnFileEra,
	      fileRen: (paras) => this.runtime.renameFile(this.getFileHandler(), paras),
	      renumLines: this.fnRenumLines,
	      deleteLines: this.fnDeleteLines,
	      editLine: this.fnEditLine,
	      list: this.fnList,
	      fileLoad: this.fnFileLoad,
	      fileSave: this.fnFileSave,
	      "new": this.fnNew,
	      run: this.fnRun,
	      parse: () => this.runtime.parseProgram(),
	      parseRun: this.fnParseRun,
	      reset: this.fnReset
	    };
	    this.fnDirectInputHandler = this.fnDirectInput.bind(this);
	    this.fnPutKeyInBufferHandler = this.fnPutKeysInBuffer.bind(this);
	    this.fnEditLineCallbackHandler = this.fnEditLineCallback.bind(this);
	    this.engine = engine;
	    this.core = engine.core;
	    const model = this.core.getModel();
	    this.options = options;
	    this.fnSpeed();
	    this.runtime = this.engine.createRuntime({
	      canvas: this.options.canvas,
	      keyboard: this.options.keyboard,
	      sound: this.options.sound,
	      randomMode: model.getProperty(ModelPropID.random),
	      arrayBounds: model.getProperty(ModelPropID.arrayBounds),
	      basicVersion: model.getProperty(ModelPropID.basicVersion),
	      trace: model.getProperty(ModelPropID.trace),
	      implicitLines: model.getProperty(ModelPropID.implicitLines),
	      integerOverflow: model.getProperty(ModelPropID.integerOverflow),
	      prettyLowercaseVars: model.getProperty(ModelPropID.prettyLowercaseVars),
	      onClickKey: this.fnPutKeyInBufferHandler,
	      outputError: this.outputError.bind(this),
	      logger: Utils.console,
	      onTokenized: (sourceLength, tokenLength) => {
	        if (Utils.debug) {
	          Utils.console.debug("parse: input length:", sourceLength, ", tokenized length:", tokenLength);
	        }
	      },
	      onMemoryError: (error) => {
	        Utils.console.error("vmPutProgramInMem", error);
	      },
	      programHost: {
	        getSource: () => this.getInputText(),
	        prepareCompileOutput: (output) => this.presentCompileOutput(output),
	        beforeProgramStart: () => {
	          this.beforeProgramStart();
	        },
	        afterProgramStart: () => {
	          this.afterProgramStart();
	        }
	      },
	      handlers: Object.fromEntries(Object.entries(this.handlers).map(([reason, handler]) => [reason, handler.bind(this)])),
	      getInitialDelay: () => this.initialLoopTimeout,
	      setTimeout: (callback, delay) => this.options.setTimeout(callback, delay),
	      onExit: () => {
	        this.exitLoop();
	      },
	      onExecutionState: options.onExecutionState,
	      onUnknownReason: (reason) => {
	        Utils.console.warn("runLoop: Unknown run mode:", reason);
	      }
	    });
	    this.variables = this.runtime.variables;
	    this.vm = this.runtime.vm;
	    this.vm.setCanvas(this.options.canvas);
	    this.runtime.reset();
	    this.hasStorageDatabase = this.getHasStorageDatabase();
	    this.storage = this.options.storage;
	  }
	  getStorage() {
	    return this.storage;
	  }
	  getHasStorageDatabase() {
	    const databases = this.core.getModel().getAllDatabases();
	    let hasStorageDatabase = false;
	    for (const value in databases) {
	      if (Object.prototype.hasOwnProperty.call(databases, value)) {
	        if (value === "storage") {
	          hasStorageDatabase = true;
	        }
	      }
	    }
	    return hasStorageDatabase;
	  }
	  updateStorageDatabase(action, key) {
	    if (!this.hasStorageDatabase) {
	      return;
	    }
	    const database = this.core.getModel().getProperty(ModelPropID.database), storage = this.getStorage();
	    let selectedExample = "", exampleChanged = false;
	    if (database !== "storage") {
	      this.core.getModel().setProperty(ModelPropID.database, "storage");
	    } else {
	      selectedExample = this.core.getModel().getProperty(ModelPropID.example);
	    }
	    let dir;
	    if (!key) {
	      dir = this.fnGetStorageDirectoryEntries();
	      dir.sort();
	    } else {
	      dir = [key];
	    }
	    for (let i = 0; i < dir.length; i += 1) {
	      key = dir[i];
	      if (action === "remove") {
	        this.core.getModel().removeExample(key);
	      } else if (action === "set") {
	        let example = this.core.getModel().getExample(key);
	        if (selectedExample === "" || selectedExample === key) {
	          exampleChanged = true;
	        }
	        if (!example) {
	          const dataString = storage.getItem(key) || "", data = FileHandler.splitMeta(dataString);
	          example = {
	            key,
	            title: "",
	            // or set key?
	            meta: data.meta.typeString
	            // currently we take only the type
	          };
	          this.core.getModel().setExample(example);
	        }
	      } else {
	        Utils.console.error("updateStorageDatabase: unknown action", action);
	      }
	    }
	    if (database === "storage") {
	      if (exampleChanged) {
	        this.onDirectorySelectChange();
	      }
	    } else {
	      this.core.getModel().setProperty(ModelPropID.database, database);
	    }
	  }
	  getInputText() {
	    return this.inScript;
	  }
	  getVariableNames() {
	    return this.variables.getAllVariableNames();
	  }
	  getVariable(name) {
	    return this.variables.getVariable(name);
	  }
	  setInputText(input, keepStack) {
	    this.inScript = input;
	    this.options.onInputText?.(input, keepStack);
	  }
	  invalidateScript() {
	    this.runtime.invalidateProgram();
	  }
	  fnWaitSound() {
	    this.runtime.handleWaitSound();
	  }
	  fnWaitInput() {
	    const result = this.runtime.handleWaitInput({
	      onInvalid: (error) => this.outputError(error, true),
	      startMainLoop: () => {
	        this.startMainLoop();
	      },
	      continueExecution: () => {
	        this.startContinue();
	      }
	    });
	    if (result.status === "invalid") {
	      return;
	    }
	    if (result.status === "pending" && result.reason === "waitInput") {
	      this.fnWaitSound();
	    }
	    this.updateResultText();
	  }
	  static addLineNumbers(input) {
	    return BasicFormatter.addLineNumbers(input);
	  }
	  // merge two scripts with sorted line numbers, lines from script2 overwrite lines from script1
	  mergeScripts(script1, script2) {
	    return this.runtime.mergeScripts(
	      script1,
	      script2,
	      this.core.getModel().getProperty(ModelPropID.implicitLines),
	      () => {
	        this.reportSplitLinesError();
	      }
	    );
	  }
	  // get line range from a script with sorted line numbers
	  fnGetLinesInRange(script, firstLine, lastLine) {
	    return this.runtime.getLinesInRangeFromScript(
	      script,
	      firstLine,
	      lastLine,
	      this.core.getModel().getProperty(ModelPropID.implicitLines),
	      () => {
	        this.reportSplitLinesError();
	      }
	    );
	  }
	  reportSplitLinesError() {
	    Utils.console.warn("splitLines: No line numbers?");
	    this.outputError(this.vm.vmComposeError(Error(), 21, "split"), true);
	  }
	  fnGetStorageDirectoryEntries(mask) {
	    return FileHandler.getStorageDirectoryEntries(this.getStorage(), mask);
	  }
	  fnFileCat(paras) {
	    const stream = paras.stream, dirList = this.fnGetStorageDirectoryEntries();
	    this.runtime.printDirectoryEntries(dirList, stream, true);
	  }
	  fnFileDir(paras) {
	    const stream = paras.stream, example = this.core.getModel().getProperty(ModelPropID.example), dirList = FileHandler.getDirectoryEntries(this.getStorage(), this.core.getModel().getAllExamples(), example, paras.fileMask);
	    this.runtime.printDirectoryEntries(dirList, stream, false);
	  }
	  fnFileEra(paras) {
	    this.runtime.eraseFiles(this.getFileHandler(), paras, (name) => {
	      if (Utils.debug > 0) {
	        Utils.console.debug("fnEraseFile: name=" + name + ": removed from localStorage");
	      }
	    }, (name) => {
	      Utils.console.warn("fnEraseFile: file not found in localStorage:", name);
	    });
	  }
	  decodeTokenizedBasic(input) {
	    return this.runtime.basicTokenizer.decode(input);
	  }
	  prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons) {
	    const output = this.runtime.codeGeneratorBasic.generatePretty(input, keepWhiteSpace, keepBrackets, keepColons);
	    if (output.error) {
	      this.outputError(output.error);
	    }
	    return output.text;
	  }
	  loadFileContinue(input) {
	    const inFile = this.vm.vmGetInFileObject();
	    this.runtime.continueLoad(input, inFile, {
	      decode: (storedInput) => FileHandler.decodeStoredFile(storedInput, {
	        atobFn: (value) => this.options.atobFn(value),
	        decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value),
	        applySnapshot: (value) => this.runtime.applySnapshot(value),
	        importArchive: (value, type) => {
	          const imported = [];
	          this.getFileHandler().fnLoad2(value, inFile.name, type, imported);
	          return imported;
	        }
	      }),
	      getSource: () => this.getInputText(),
	      setSource: (source) => {
	        this.setInputText(source);
	      },
	      clearResult: () => {
	        this.setResultText("");
	      },
	      merge: (source, loaded) => this.mergeScripts(source, loaded),
	      invalidate: () => {
	        this.invalidateScript();
	      },
	      removeVariables: () => {
	        this.fnRemoveAllVariables();
	      },
	      reset: () => {
	        this.fnReset();
	      },
	      parseRun: () => {
	        this.fnParseRun();
	      },
	      parseChain: () => {
	        this.fnParseChain();
	      },
	      onUnknownCommand: (value) => {
	        Utils.console.error("loadExample: Unknown command:", value);
	      },
	      startMainLoop: () => {
	        this.startMainLoop();
	      },
	      onWarning: (error) => {
	        Utils.console.warn(error);
	      },
	      onError: (message) => {
	        Utils.console.error(message);
	      },
	      decodeTokenizedBasic: (value) => this.decodeTokenizedBasic(value)
	    });
	  }
	  createFnExampleLoaded(example, url, inFile) {
	    return (_sFullUrl, key, suppressLog) => {
	      if (key !== example) {
	        Utils.console.warn("fnExampleLoaded: Unexpected", key, "<>", example);
	      }
	      const exampleEntry = this.core.getModel().getExample(example);
	      if (!suppressLog) {
	        Utils.console.log("Example loaded:", url, exampleEntry.meta);
	      }
	      this.core.getModel().setProperty(ModelPropID.example, inFile.memorizedExample);
	      const input = exampleEntry.script;
	      this.runtime.completeExampleLoad(input, exampleEntry.rsx, (loadedInput) => {
	        this.loadFileContinue(loadedInput);
	      });
	    };
	  }
	  createFnExampleError(example, url, inFile) {
	    return () => {
	      Utils.console.log("Example", url, "error");
	      this.core.getModel().setProperty(ModelPropID.example, inFile.memorizedExample);
	      this.runtime.failExampleLoad(example, (error, noSelection) => this.outputError(error, noSelection), (input) => {
	        this.loadFileContinue(input);
	      });
	    };
	  }
	  getLoadScript() {
	    return this.options.loadScript;
	  }
	  getOutputText() {
	    return this.outScript;
	  }
	  setOutputText(text) {
	    this.outScript = text;
	    this.invalidateScript();
	    this.options.onOutputText?.(text);
	  }
	  setResultText(text, _scroll = false) {
	    this.options.onResultText?.(text);
	  }
	  loadExampleFile() {
	    const inFile = this.vm.vmGetInFileObject(), key = this.core.getModel().getProperty(ModelPropID.example), model = this.core.getModel(), plan = FileHandler.prepareExampleLoad(inFile.name, key, model.getAllExamples(), model.getDatabase().src), example = plan.name, exampleEntry = plan.entry, url = plan.url;
	    inFile.memorizedExample = plan.memorizedExample;
	    if (Utils.debug > 0) {
	      Utils.console.debug("loadExample: name=" + example + " (current=" + key + ")");
	    }
	    if (plan.status === "loaded" && exampleEntry) {
	      this.core.getModel().setProperty(ModelPropID.example, example);
	      const fnExampleLoaded = this.createFnExampleLoaded(example, url, inFile);
	      fnExampleLoaded("", example, true);
	    } else if (plan.status === "fetch" && exampleEntry) {
	      this.core.getModel().setProperty(ModelPropID.example, example);
	      this.getLoadScript()(url, this.createFnExampleLoaded(example, url, inFile), this.createFnExampleError(example, url, inFile), example);
	    } else {
	      if (example !== "") {
	        Utils.console.warn("loadExample: Unknown file:", example);
	        const fnExampleError = this.createFnExampleError(example, url, inFile);
	        fnExampleError();
	      } else {
	        this.core.getModel().setProperty(ModelPropID.example, example);
	        this.runtime.completeExampleLoad("", void 0, (input) => {
	          this.loadFileContinue(input);
	        });
	      }
	    }
	  }
	  tryLoadingFromLocalStorage(name) {
	    return FileHandler.loadFromStorage(this.getStorage(), name);
	  }
	  fnFileLoad() {
	    const inFile = this.vm.vmGetInFileObject();
	    this.runtime.dispatchFileLoad(inFile, {
	      deleteLines: (paras) => {
	        this.fnDeleteLines(paras);
	      },
	      logFile: (file) => {
	        if (Utils.debug > 1) {
	          Utils.console.debug("fnFileLoad:", file.command, file.name, "details:", file);
	        }
	      },
	      loadFromStorage: (name) => this.tryLoadingFromLocalStorage(name),
	      onStorageLoad: (input) => {
	        if (Utils.debug > 0) {
	          Utils.console.debug("fnFileLoad:", inFile.command, inFile.name, "from localStorage");
	        }
	        this.loadFileContinue(input);
	      },
	      loadExample: () => {
	        this.loadExampleFile();
	      },
	      onNotOpen: (name) => {
	        Utils.console.error("fnFileLoad:", name, "File not open!");
	      },
	      setNextDelay: (delay) => {
	        this.runtime.setNextDelay(delay);
	      }
	    });
	  }
	  fnFileSave() {
	    const outFile = this.vm.vmGetOutFileObject();
	    this.runtime.dispatchFileSave(
	      outFile,
	      (file) => this.getFileHandler().saveFile(file, () => this.getInputText(), (input, storageName) => this.runtime.encodeTokenizedBasic(input, storageName)).data,
	      (name) => {
	        if (Utils.debug > 0) {
	          Utils.console.debug("fnFileSave: name=" + name + ": put into localStorage");
	        }
	      },
	      () => {
	        Utils.console.error("fnFileSave: file not open!");
	      },
	      (error) => {
	        Utils.console.warn(error);
	      }
	    );
	  }
	  fnDeleteLines(paras) {
	    const inputText = this.getInputText(), lines = this.fnGetLinesInRange(inputText, paras.first || 0, paras.last || 65535);
	    this.runtime.deleteProgramLines(
	      paras,
	      lines,
	      (deletion) => {
	        this.setInputText(this.mergeScripts(inputText, deletion));
	      },
	      (error) => this.outputError(error, true)
	    );
	  }
	  fnNew() {
	    this.runtime.newProgram(
	      () => {
	        this.setInputText("");
	      },
	      () => {
	        this.invalidateScript();
	      }
	    );
	  }
	  fnList(paras) {
	    const input = this.getInputText(), stream = paras.stream, lines = this.fnGetLinesInRange(input, paras.first || 0, paras.last || 65535);
	    this.runtime.listProgram(lines, stream);
	  }
	  fnReset() {
	    this.runtime.resetProgram(
	      () => void 0,
	      () => {
	        this.setOutputText("");
	      },
	      () => {
	        this.invalidateScript();
	      }
	    );
	  }
	  outputError(error, noSelection) {
	    const stream = 0, diagnostic = Utils.createDiagnostic(error, noSelection, error.name === "CpcVm" ? this.vm.err() : void 0), shortError = diagnostic.shortMessage;
	    this.options.onDiagnostic?.(diagnostic);
	    const escapedShortError = Utils.escapeControlCharacters(shortError);
	    this.vm.print(stream, escapedShortError + "\r\n");
	    return shortError;
	  }
	  fnRenumLines(paras) {
	    this.runtime.renumProgram(
	      this.getInputText(),
	      paras,
	      (source, newLine, oldLine, step, keep) => this.runtime.basicFormatter.renumber(source, newLine, oldLine, step, keep),
	      (source) => {
	        this.setInputText(source, true);
	      },
	      (error) => {
	        Utils.console.warn(error);
	        this.outputError(error);
	      }
	    );
	  }
	  fnEditLineCallback() {
	    const inputParas = this.vm.vmGetStopObject().paras, inputText = this.getInputText();
	    return this.runtime.commitEditedLine(inputParas, inputText, (source, edited) => this.mergeScripts(source, edited), (source) => {
	      this.setInputText(source);
	    });
	  }
	  fnEditLine(paras) {
	    const input = this.getInputText(), lineNumber = paras.first || 0, lines = this.fnGetLinesInRange(input, lineNumber, lineNumber);
	    if (lines.length) {
	      if (this.runtime.editLine(paras, lines[0], this.fnEditLineCallbackHandler, (error) => this.outputError(error))) {
	        this.fnWaitInput();
	      }
	    }
	  }
	  presentCompileOutput(output) {
	    let outputString;
	    if (output.error) {
	      outputString = this.outputError(output.error);
	    } else {
	      outputString = output.text;
	    }
	    if (outputString && outputString.length > 0) {
	      outputString += "\n";
	    }
	    this.setOutputText(outputString);
	    this.invalidateScript();
	    return this.getOutputText();
	  }
	  fnParseAndStart(clearVariables, clearBeforeRun) {
	    this.runtime.compileAndStartProgram({
	      clearVariables,
	      clearBeforeRun
	    });
	  }
	  fnPretty() {
	    const model = this.core.getModel();
	    const input = this.getInputText(), keepWhiteSpace = model.getProperty(ModelPropID.prettySpace), keepBrackets = model.getProperty(ModelPropID.prettyBrackets), keepColons = model.getProperty(ModelPropID.prettyColons), output = this.prettyPrintBasic(input, keepWhiteSpace, keepBrackets, keepColons);
	    if (output) {
	      this.setInputText(output, true);
	      const diff = this.runtime.formatDiff(input, output);
	      this.setOutputText(diff);
	    }
	  }
	  fnAddLines() {
	    const input = this.getInputText(), output = Controller0.addLineNumbers(input);
	    if (output) {
	      this.setInputText(output, true);
	    }
	  }
	  fnRemoveLines() {
	    const input = this.getInputText(), output = this.runtime.basicFormatter.removeUnusedLines(input);
	    if (output.error) {
	      this.outputError(output.error);
	    } else {
	      this.setInputText(output.text, true);
	    }
	  }
	  // eslint-disable-next-line complexity
	  fnDownload() {
	    const options = ["test1"], meta = {
	      typeString: "A",
	      // ASCII
	      start: 368,
	      length: 0,
	      entry: 0
	    };
	    let name = "", data = "";
	    const fileHandler = this.getFileHandler();
	    this.options.btoaFn;
	    for (let i = 0; i < options.length; i += 1) {
	      const item = options[i];
	      name = item;
	      data = this.tryLoadingFromLocalStorage(name) || "";
	      const metaAndData = FileHandler.splitMeta(data);
	      Object.assign(meta, metaAndData.meta);
	      data = metaAndData.data;
	      {
	        data = fileHandler.prepareAmsdosFile(name, data, meta);
	      }
	    }
	  }
	  fnChain(paras, clearBeforeRun = false) {
	    const line = paras && paras.first || 0;
	    this.runtime.startProgram(this.getOutputText(), line, clearBeforeRun);
	  }
	  beforeProgramStart() {
	    if (this.vm.vmGetOutFileObject().open) {
	      this.fnFileSave();
	    }
	  }
	  afterProgramStart() {
	    if (Utils.debug > 1) {
	      Utils.console.debug("End of fnRun");
	    }
	  }
	  fnRun(paras) {
	    this.fnChain(paras, true);
	  }
	  fnParseRun() {
	    this.fnParseAndStart(true, true);
	  }
	  fnParseChain() {
	    this.fnParseAndStart(false, false);
	  }
	  fnDirectInput() {
	    const directInput = this.runtime.readDirectInput(), { input, stream } = directInput;
	    if (input !== "") {
	      const inputText = this.getInputText();
	      if (directInput.isProgramLine) {
	        if (Utils.debug > 0) {
	          Utils.console.debug("fnDirectInput: insert line=" + input);
	        }
	        this.runtime.insertDirectProgramLine(
	          inputText,
	          input,
	          stream,
	          (source, line) => this.mergeScripts(source, line),
	          (source) => {
	            this.setInputText(source, true);
	          }
	        );
	        this.updateResultText();
	        return false;
	      }
	      if (Utils.debug > 0) {
	        Utils.console.log("fnDirectInput: execute:", input);
	      }
	      const output = this.runtime.executeDirectCommand(input, inputText, this.vm.line, stream, directInput.message, {
	        outputError: (error) => this.outputError(error, true),
	        setOutputText: (text) => {
	          this.setOutputText(text);
	        },
	        onPrepareError: (error) => {
	          Utils.console.error(error);
	          if (error instanceof Error) {
	            this.outputError(error, true);
	          }
	        }
	      });
	      if (!output.error) {
	        this.updateResultText();
	        return true;
	      }
	    }
	    this.updateResultText();
	    return false;
	  }
	  startWithDirectInput() {
	    if (this.options.isHeadlessDirectInput) {
	      if (Utils.debug) {
	        Utils.console.log("We are ready.");
	      }
	      if (this.options.onProgramEnd) {
	        this.options.onProgramEnd();
	      }
	      return;
	    }
	    this.runtime.enterDirectMode(this.fnDirectInputHandler);
	    this.fnWaitInput();
	  }
	  updateResultText() {
	    const outText = this.vm.vmGetOutBuffer();
	    this.setResultText(outText, true);
	  }
	  exitLoop() {
	    const stop = this.vm.vmGetStopObject(), reason = stop.reason;
	    this.updateResultText();
	    if (reason === "stop" || reason === "end" || reason === "error" || reason === "parse" || reason === "parseRun") {
	      this.startWithDirectInput();
	    }
	  }
	  getExecutionState() {
	    return this.runtime.getExecutionState();
	  }
	  startMainLoop() {
	    this.runtime.startMainLoop();
	  }
	  startParse() {
	    this.runtime.beginControl("parse");
	    this.startMainLoop();
	  }
	  startRenum(options = {}) {
	    const stream = 0;
	    this.runtime.beginRenumber(options);
	    if (this.vm.pos(stream) > 1) {
	      this.vm.print(stream, "\r\n");
	    }
	    this.vm.print(stream, "renum\r\n");
	    this.startMainLoop();
	  }
	  startRun() {
	    this.runtime.beginControl("run");
	    this.startMainLoop();
	  }
	  startParseRun() {
	    this.runtime.beginControl("parseRun");
	    this.startMainLoop();
	  }
	  startBreak() {
	    this.runtime.beginControl("break");
	    this.startMainLoop();
	  }
	  startEscape() {
	    const action = this.runtime.handleEscape(this.options.keyboard);
	    if (action === "ignored" || action === "input") {
	      this.updateResultText();
	      return;
	    }
	    this.startMainLoop();
	  }
	  startContinue() {
	    this.runtime.continueProgram(() => {
	      this.startMainLoop();
	    });
	  }
	  startReset() {
	    this.runtime.beginControl("reset");
	    this.startMainLoop();
	  }
	  putKeys(keys) {
	    this.fnPutKeysInBuffer(keys);
	    const reason = this.vm.vmGetStopObject().reason;
	    if (reason === "direct") {
	      this.fnWaitInput();
	    } else if (reason === "escape") {
	      if (this.options.keyboard.getKeyFromBuffer() !== "") {
	        this.vm.cursor(0, 0);
	        this.startContinue();
	      }
	    } else if (reason === "waitInput" || reason === "waitKey") {
	      this.startMainLoop();
	    }
	  }
	  fnPutKeysInBuffer(keys) {
	    for (let i = 0; i < keys.length; i += 1) {
	      this.options.keyboard.putKeyInBuffer(keys.charAt(i), i === keys.length - 1);
	    }
	  }
	  setBasicVersion(basicVersion) {
	    this.runtime.setBasicVersion(basicVersion);
	    this.invalidateScript();
	  }
	  adaptFilename(name, err) {
	    return this.vm.vmAdaptFilename(name, err);
	  }
	  getFileHandler() {
	    if (!this.fileHandler) {
	      this.fileHandler = this.engine.createFileHandler({
	        adaptFilename: this.adaptFilename.bind(this),
	        updateStorageDatabase: this.updateStorageDatabase.bind(this),
	        outputError: this.outputError.bind(this),
	        processFileImports: this.core.getModel().getProperty(ModelPropID.processFileImports),
	        storage: this.storage
	      });
	    }
	    return this.fileHandler;
	  }
	  createFnDatabaseLoaded(url) {
	    return (_sFullUrl, key) => {
	      const selectedName = this.core.getModel().getProperty(ModelPropID.database);
	      if (selectedName === key) {
	        this.core.getModel().getDatabase().loaded = true;
	      } else {
	        Utils.console.warn("databaseLoaded: name changed: " + key + " => " + selectedName);
	        this.core.getModel().setProperty(ModelPropID.database, key);
	        const database = this.core.getModel().getDatabase();
	        if (database) {
	          database.loaded = true;
	        }
	        this.core.getModel().setProperty(ModelPropID.database, selectedName);
	      }
	      Utils.console.log("fnDatabaseLoaded: database loaded: " + key + ": " + url);
	      this.onDirectorySelectChange();
	    };
	  }
	  createFnDatabaseError(url) {
	    return (_sFullUrl, key) => {
	      Utils.console.error("fnDatabaseError: database error: " + key + ": " + url);
	      this.onDirectorySelectChange();
	      this.setInputText("");
	      this.setResultText("Cannot load database: " + key);
	    };
	  }
	  onDatabaseSelectChange() {
	    this.loadDatabase();
	  }
	  loadDatabase(name) {
	    const model = this.core.getModel();
	    if (name !== void 0) {
	      model.setProperty(ModelPropID.database, name);
	    }
	    const databaseName = model.getProperty(ModelPropID.database);
	    const database = model.getDatabase();
	    if (!database) {
	      Utils.console.error("onDatabaseSelectChange: database not available:", databaseName);
	      return;
	    }
	    if (database.text === "storage") {
	      this.updateStorageDatabase("set", "");
	      database.loaded = true;
	    }
	    if (database.loaded) {
	      this.loadExample(model.getProperty(ModelPropID.example));
	    } else {
	      this.setInputText("#loading database " + databaseName + "...");
	      const exampleIndex = this.core.getModel().getProperty(ModelPropID.exampleIndex);
	      const url = database.src + "/" + exampleIndex;
	      const loadScriptFn = this.getLoadScript();
	      loadScriptFn(url, this.createFnDatabaseLoaded(url), this.createFnDatabaseError(url), databaseName);
	    }
	  }
	  onDirectorySelectChange() {
	    this.onExampleSelectChange();
	  }
	  onExampleSelectChange() {
	    this.loadExample(this.core.getModel().getProperty(ModelPropID.example));
	  }
	  loadExample(key, options = {}) {
	    const model = this.core.getModel();
	    const vm = this.vm, inFile = vm.vmGetInFileObject(), dataBaseName = model.getProperty(ModelPropID.database);
	    model.setProperty(ModelPropID.example, key);
	    vm.closein();
	    inFile.open = true;
	    const request = FileHandler.createExampleLoadRequest(key, dataBaseName, model.getExample(key)?.meta, options.autorun ?? model.getProperty(ModelPropID.autorun));
	    inFile.command = request.command;
	    inFile.name = request.name;
	    inFile.start = void 0;
	    inFile.fnFileCallback = vm.vmGetLoadHandler();
	    vm.vmStop("fileLoad", 90);
	    this.startMainLoop();
	  }
	  fnArrayBounds() {
	    const arrayBounds = this.core.getModel().getProperty(ModelPropID.arrayBounds);
	    this.runtime.setArrayBounds(arrayBounds);
	  }
	  fnImplicitLines() {
	    const implicitLines = this.core.getModel().getProperty(ModelPropID.implicitLines);
	    this.runtime.setImplicitLines(implicitLines);
	  }
	  fnRemoveAllVariables() {
	    if (Object.keys(this.variables.getAllVariables()).length) {
	      this.variables.removeAllVariables();
	    }
	  }
	  fnPrettyLowercaseVars() {
	    const lowercaseVars = this.core.getModel().getProperty(ModelPropID.prettyLowercaseVars);
	    this.runtime.setPrettyLowercaseVars(lowercaseVars);
	  }
	  fnIntegerOverflow() {
	    const integerOverflow = this.core.getModel().getProperty(ModelPropID.integerOverflow);
	    this.runtime.setIntegerOverflow(integerOverflow);
	  }
	  fnTrace() {
	    const trace = this.core.getModel().getProperty(ModelPropID.trace);
	    this.runtime.setTrace(trace);
	  }
	  fnSpeed() {
	    const speed = this.core.getModel().getProperty(ModelPropID.speed);
	    this.initialLoopTimeout = Runtime.getLoopDelay(speed);
	  }
	  /* eslint-enable no-invalid-this */
	}

	function requireNodeModule(moduleName) {
	  return eval("require")(moduleName);
	}
	const myGlobalThis = typeof globalThis !== "undefined" ? globalThis : Function("return this")();
	function createLocalStorage() {
	  const data = {};
	  const storage = {
	    clear() {
	      Object.keys(data).forEach((key) => {
	        delete data[key];
	        delete storage[key];
	      });
	    },
	    getItem(key) {
	      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
	    },
	    key(index) {
	      const keys = Object.keys(data);
	      return index >= 0 && index < keys.length ? keys[index] : null;
	    },
	    removeItem(key) {
	      delete data[key];
	      delete storage[key];
	    },
	    setItem(key, value) {
	      const value2 = String(value);
	      data[key] = value2;
	      storage[key] = value2;
	    },
	    get length() {
	      return Object.keys(data).length;
	    }
	  };
	  return storage;
	}
	const _NodeUtils = class _NodeUtils {
	  static nodeReadUrl(url, fnDataLoaded) {
	    const nodeHttps = requireNodeModule("https");
	    nodeHttps.get(url, (resp) => {
	      let data = "";
	      resp.on("data", (chunk) => {
	        data += chunk;
	      });
	      resp.on("end", () => {
	        fnDataLoaded(void 0, data);
	      });
	    }).on("error", (err) => {
	      console.log("Error: " + err.message);
	      fnDataLoaded(err);
	    });
	  }
	  static nodeReadFile(name, fnDataLoaded) {
	    const nodeFs = requireNodeModule("fs"), cwd = myGlobalThis.process && myGlobalThis.process.cwd ? myGlobalThis.process.cwd() : "", name2 = cwd && name.indexOf(":") < 0 && !name.startsWith("/") ? cwd + "/" + name : name;
	    nodeFs.readFile(name2, "utf8", (error, data) => {
	      fnDataLoaded(error ?? void 0, data);
	    });
	  }
	  static isUrl(s) {
	    return s.startsWith("http");
	  }
	  static writeResultDelta(text, state) {
	    const previous = state.text;
	    const delta = text.startsWith(previous) ? text.substring(previous.length) : text;
	    if (delta && myGlobalThis.process && myGlobalThis.process.stdout) {
	      myGlobalThis.process.stdout.write(delta);
	    }
	    state.text = text;
	  }
	  nodeMain(engine) {
	    const core = engine.core;
	    const model = core.getModel(), config = model.getAllProperties();
	    core.parseArgs(myGlobalThis.process.argv.slice(2), config);
	    if (config.canvasType === "graphics") {
	      config.canvasType = "text";
	    }
	    if (!myGlobalThis.AudioContext && config.sound === true) {
	      config.sound = false;
	    }
	    config.showCpc = false;
	    const debug = model.getProperty("debug");
	    if (debug) {
	      core.setDebug(debug);
	      Utils.setDebug(debug);
	    }
	    core.init();
	    myGlobalThis.cpcBasic = {
	      addIndex: core.addIndex,
	      addItem: (key, input) => {
	        core.addItem(key || _NodeUtils.currentScriptKey, input);
	      },
	      addRsx: (key, RsxConstructor) => core.addRsx(key || _NodeUtils.currentScriptKey, RsxConstructor)
	    };
	    const outputState = {
	      text: ""
	    };
	    const textBuffer = [];
	    const putCharInTextBuffer = (char, x, y) => {
	      if (!textBuffer[y]) {
	        textBuffer[y] = [];
	      }
	      textBuffer[y][x] = char;
	    };
	    const getCharFromTextBuffer = (x, y) => {
	      let char;
	      if (textBuffer[y]) {
	        char = textBuffer[y][x];
	      }
	      return char;
	    };
	    const clearTextBufferBox = (left, top, width, height) => {
	      for (let y = top; y < top + height; y += 1) {
	        const textBufferRow = textBuffer[y];
	        if (textBufferRow) {
	          for (let x = left; x < left + width; x += 1) {
	            delete textBufferRow[x];
	          }
	        }
	      }
	    };
	    const copyTextBufferBoxUp = (left, top, width, height, left2, top2) => {
	      for (let y = 0; y < height; y += 1) {
	        const sourceRow = textBuffer[top + y];
	        let destinationRow = textBuffer[top2 + y];
	        if (sourceRow) {
	          if (!destinationRow) {
	            destinationRow = [];
	            textBuffer[top2 + y] = destinationRow;
	          }
	          for (let x = 0; x < width; x += 1) {
	            destinationRow[left2 + x] = sourceRow[left + x];
	          }
	        } else if (destinationRow) {
	          delete textBuffer[top2 + y];
	        }
	      }
	    };
	    const canvas = {
	      reset: () => {
	        textBuffer.length = 0;
	      },
	      resetCustomChars: () => void 0,
	      setScreenOffset: (_offset) => void 0,
	      updateColorsAndCanvasImmediately: (_inkList) => void 0,
	      updateSpeedInk: () => void 0,
	      setCustomChar: (_char, _charData) => void 0,
	      getCharData: (_char) => [],
	      setDefaultInks: () => void 0,
	      //onCanvasClick: (_event: MouseEvent) => undefined,
	      getXpos: () => 0,
	      getYpos: () => 0,
	      getByte: (_addr) => 0,
	      setByte: (_addr, _byte) => void 0,
	      draw: (_x, _y) => void 0,
	      move: (_x, _y) => void 0,
	      plot: (_x, _y) => void 0,
	      test: (_x, _y) => 0,
	      setInk: (_pen, _ink1, _ink2) => false,
	      setBorder: (_ink1, _ink2) => void 0,
	      setGPen: (_gPen) => void 0,
	      setGPaper: (_gPaper) => void 0,
	      setGTransparentMode: (_transparent) => void 0,
	      printGChar: (_char) => void 0,
	      drawCursor: (_x, _y, _pen, _paper) => void 0,
	      fill: (_fillPen) => void 0,
	      setOrigin: (_xOrig, _yOrig) => void 0,
	      getXOrigin: () => 0,
	      getYOrigin: () => 0,
	      setGWindow: (_xLeft, _xRight, _yTop, _yBottom) => void 0,
	      setGColMode: (_gColMode) => void 0,
	      clearGraphicsWindow: () => void 0,
	      setSpeedInk: (_time1, _time2) => void 0,
	      setMask: (_mask) => void 0,
	      setMaskFirst: (_maskFirst) => void 0,
	      getMode: () => 0,
	      changeMode: (_mode) => void 0,
	      //takeScreenShot: () => "",
	      //startUpdateCanvas: () => undefined,
	      //stopUpdateCanvas: () => undefined,
	      //onWindowClick: (_event: Event) => undefined,
	      fillTextBox: (left, top, width, height, _paper) => {
	        clearTextBufferBox(left, top, width, height);
	      },
	      printChar: (char, x, y, _pen, _paper, _transparent) => {
	        putCharInTextBuffer(char, x, y);
	      },
	      readChar: (x, y, _pen, _paper) => {
	        let char = getCharFromTextBuffer(x, y);
	        if (char === void 0) {
	          char = -1;
	        }
	        return char;
	      },
	      clearTextWindow: (_left, _right, _top, _bottom, _paper) => void 0,
	      setMode: (_mode) => void 0,
	      clearFullWindow: () => {
	        textBuffer.length = 0;
	      },
	      windowScrollUp: (left, right, top, bottom, _paper) => {
	        const width = right + 1 - left, height = bottom + 1 - top;
	        if (height > 1) {
	          copyTextBufferBoxUp(left, top + 1, width, height - 1, left, top);
	        }
	        canvas.fillTextBox(left, bottom, width, 1, 0);
	      },
	      windowScrollDown: (_left, _right, _top, _bottom, _paper) => void 0
	    };
	    const keyboard = {
	      reset: () => void 0,
	      resetExpansionTokens: () => void 0,
	      resetCpcKeysExpansions: () => void 0,
	      clearInput: () => void 0,
	      getKeyFromBuffer: () => "",
	      putKeyInBuffer: (_key, _triggerOnKeyDown) => void 0,
	      getKeyState: (_cpcKeyCode) => 0,
	      getJoyState: (_joy) => 0,
	      setExpansionToken: (_token, _string) => void 0,
	      setCpcKeyExpansion: (_options) => void 0
	    };
	    const sound = {
	      reset: () => void 0,
	      resetQueue: () => void 0,
	      testCanQueue: (_state) => true,
	      sound: (_soundData) => void 0,
	      setVolEnv: (_volEnv, _volEnvData) => void 0,
	      setToneEnv: (_toneEnv, _toneEnvData) => void 0,
	      scheduler: () => void 0,
	      release: (_releaseMask) => void 0,
	      sq: (_n) => 0
	    };
	    const atobFn = (input) => {
	      return Buffer.from(input, "base64").toString("binary");
	    };
	    const btoaFn = (input) => {
	      return Buffer.from(input, "binary").toString("base64");
	    };
	    const controllerOptions = {
	      canvas,
	      keyboard,
	      sound,
	      isHeadlessDirectInput: true,
	      loadScript: _NodeUtils.loadScript,
	      onResultText: (value) => {
	        _NodeUtils.writeResultDelta(value, outputState);
	      },
	      onProgramEnd: () => {
	        myGlobalThis.process.exit(0);
	      },
	      storage: createLocalStorage(),
	      atobFn,
	      btoaFn,
	      console,
	      setTimeout
	    };
	    const controller = new Controller0(engine, controllerOptions);
	    controller.loadDatabase();
	  }
	};
	_NodeUtils.currentScriptKey = "";
	_NodeUtils.loadScript = (fileOrUrl, fnSuccess, fnError, key) => {
	  const fnLoaded = (error, data) => {
	    if (error) {
	      console.error("file error: ", error);
	      fnError(fileOrUrl, key);
	      return;
	    }
	    if (data) {
	      _NodeUtils.currentScriptKey = key;
	      (0, eval)(data);
	      _NodeUtils.currentScriptKey = "";
	    }
	    fnSuccess(fileOrUrl, key);
	  };
	  if (_NodeUtils.isUrl(fileOrUrl)) {
	    _NodeUtils.nodeReadUrl(fileOrUrl, fnLoaded);
	  } else {
	    _NodeUtils.nodeReadFile(fileOrUrl, fnLoaded);
	  }
	};
	let NodeUtils = _NodeUtils;

	function unsupported(feature) {
	  throw new Error("Headless testing does not support " + feature);
	}
	class HeadlessScreen extends NullCanvas {
	  constructor() {
	    super(...arguments);
	    this.cells = /* @__PURE__ */ new Map();
	    this.modeValue = 1;
	  }
	  reset() {
	    this.cells?.clear();
	  }
	  getCell(x, y) {
	    const cell = this.cells.get(x + "," + y);
	    return cell && { ...cell };
	  }
	  printChar(char, x, y, pen, paper, transparent) {
	    if (transparent) {
	      unsupported("transparent text pixel composition");
	    }
	    this.cells.set(x + "," + y, { char, pen, paper });
	  }
	  readChar(x, y) {
	    return this.getCell(x, y)?.char ?? 32;
	  }
	  clearFullWindow() {
	    this.cells.clear();
	  }
	  fillTextBox(left, top, width, height, paper) {
	    for (let y = top; y < top + height; y += 1) {
	      for (let x = left; x < left + width; x += 1) {
	        this.cells.set(x + "," + y, { char: 32, pen: paper, paper });
	      }
	    }
	  }
	  clearTextWindow(left, right, top, bottom, paper) {
	    this.fillTextBox(left, top, right - left + 1, bottom - top + 1, paper);
	  }
	  scroll(left, right, top, bottom, paper, direction) {
	    const snapshot = new Map(this.cells);
	    for (let y = top; y <= bottom; y += 1) {
	      for (let x = left; x <= right; x += 1) {
	        const sourceY = y + direction, cell = sourceY >= top && sourceY <= bottom ? snapshot.get(x + "," + sourceY) : void 0;
	        this.cells.set(x + "," + y, cell ? { ...cell } : { char: 32, pen: paper, paper });
	      }
	    }
	  }
	  windowScrollUp(left, right, top, bottom, paper) {
	    this.scroll(left, right, top, bottom, paper, 1);
	  }
	  windowScrollDown(left, right, top, bottom, paper) {
	    this.scroll(left, right, top, bottom, paper, -1);
	  }
	  setMode(mode) {
	    this.modeValue = mode;
	  }
	  getMode() {
	    return this.modeValue;
	  }
	  changeMode(_mode) {
	    unsupported("screen reinterpretation");
	  }
	  getByte(_address) {
	    return unsupported("screen-memory reads");
	  }
	  setByte(_address, _byte) {
	    unsupported("screen-memory writes");
	  }
	  draw(_x, _y) {
	    unsupported("graphics DRAW");
	  }
	  move(_x, _y) {
	    unsupported("graphics MOVE");
	  }
	  plot(_x, _y) {
	    unsupported("graphics PLOT");
	  }
	  test(_x, _y) {
	    return unsupported("graphics TEST");
	  }
	  fill(_pen) {
	    unsupported("graphics FILL");
	  }
	  printGChar(_char) {
	    unsupported("graphics text");
	  }
	}
	class HeadlessKeyboard {
	  constructor() {
	    this.queue = [];
	    this.reads = 0;
	  }
	  reset() {
	    this.clearInput();
	    this.reads = 0;
	  }
	  clearInput() {
	    this.queue.length = 0;
	  }
	  getKeyFromBuffer() {
	    this.reads += 1;
	    return this.queue.shift() ?? "";
	  }
	  putKeyInBuffer(key) {
	    this.queue.push(...key.split(""));
	  }
	  getKeyState(_key) {
	    return unsupported("INKEY key-state queries; use INKEY$");
	  }
	  getJoyState(_joy) {
	    return unsupported("joysticks");
	  }
	  resetExpansionTokens() {
	  }
	  resetCpcKeysExpansions() {
	  }
	  setExpansionToken(_token, _text) {
	    unsupported("KEY expansions");
	  }
	  setCpcKeyExpansion() {
	    unsupported("KEY DEF");
	  }
	}
	class HeadlessSound {
	  reset() {
	  }
	  resetQueue() {
	  }
	  testCanQueue(_state) {
	    return true;
	  }
	  sound(_data) {
	  }
	  setVolEnv(_env, _data) {
	  }
	  setToneEnv(_env, _data) {
	  }
	  scheduler() {
	  }
	  release(_mask) {
	  }
	  sq(_channel) {
	    return unsupported("sound-queue queries");
	  }
	}
	class HeadlessVm extends CpcVm {
	  constructor() {
	    super(...arguments);
	    this.ticks = 0;
	    this.checkpoint = () => false;
	    this.readKey = () => "";
	  }
	  vmLoopCondition() {
	    return this.checkpoint();
	  }
	  time() {
	    return this.ticks;
	  }
	  inkey$() {
	    return this.readKey();
	  }
	  frame() {
	    this.ticks += 6;
	    super.frame();
	  }
	  afterGosub() {
	    unsupported("AFTER timers");
	  }
	  everyGosub() {
	    unsupported("EVERY timers");
	  }
	  onSqGosub() {
	    unsupported("ON SQ timers");
	  }
	}
	class HeadlessCompileError extends Error {
	  constructor(diagnostic) {
	    super(String(diagnostic));
	    this.diagnostic = diagnostic;
	    this.name = "HeadlessCompileError";
	  }
	}
	class HeadlessProgram {
	  constructor(code, variableNames) {
	    this.code = code;
	    this.variableNames = variableNames;
	  }
	  createHeadlessMachine(options = {}) {
	    return new HeadlessMachine(this.code, this.variableNames, options);
	  }
	}
	class HeadlessMachine {
	  constructor(code, names, options) {
	    this.screen = new HeadlessScreen();
	    this.keyboard = new HeadlessKeyboard();
	    this.variables = new Variables({ arrayBounds: true });
	    const random = new Random(true);
	    this.vm = new HeadlessVm({ canvas: this.screen, keyboard: this.keyboard, sound: new HeadlessSound(), random, variables: this.variables, quiet: true });
	    this.vm.vmReset();
	    for (const name of names) {
	      this.variables.initVariable(name);
	    }
	    if (options.seed !== void 0 && !Number.isFinite(options.seed)) {
	      throw new RangeError("Seed must be finite");
	    }
	    random.init(options.seed);
	    this.advanceTime(options.ticks ?? 0);
	    this.vm.readKey = () => this.keyboard.getKeyFromBuffer();
	    this.execute = new Function("o", code);
	  }
	  advanceTime(ticks) {
	    if (!Number.isSafeInteger(ticks) || ticks < 0 || !Number.isSafeInteger(this.vm.ticks + ticks)) {
	      throw new RangeError("Ticks must be nonnegative safe integers");
	    }
	    this.vm.ticks += ticks;
	  }
	  pressKey(key) {
	    if ([...key].some((char) => char.charCodeAt(0) > 255)) {
	      throw new RangeError("Keys must be CPC byte characters");
	    }
	    this.keyboard.putKeyInBuffer(key);
	  }
	  run(options = {}) {
	    return this.executeUntil(false, options);
	  }
	  // INKEY$ returns before pausing at the next generated-code checkpoint. This
	  // never unwinds/replays a partially executed BASIC expression or statement.
	  runUntilInput(options = {}) {
	    return this.executeUntil(true, options);
	  }
	  executeUntil(untilInput, options) {
	    const limit = options.maxSteps ?? 1e5, initialReads = this.keyboard.reads;
	    if (!Number.isSafeInteger(limit) || limit < 1) {
	      throw new RangeError("maxSteps must be a positive safe integer");
	    }
	    if (this.vm.vmGetStopObject().reason === "waitFrame") {
	      this.vm.vmStop("", 0, true);
	    }
	    let steps = 0;
	    this.vm.checkpoint = () => {
	      if (this.vm.vmGetStopObject().reason || this.fault || steps >= limit || untilInput && this.keyboard.reads > initialReads) {
	        return false;
	      }
	      steps += 1;
	      return true;
	    };
	    try {
	      this.execute(this.vm);
	    } catch (error) {
	      this.fault = error instanceof Error ? error : new Error(String(error));
	    }
	    const vmReason = this.vm.vmGetStopObject().reason, reason = this.fault ? "error" : vmReason === "stop" || vmReason === "end" ? "stopped" : vmReason === "waitFrame" ? "frame" : vmReason ? "blocked" : untilInput && this.keyboard.reads > initialReads ? "input" : "budget";
	    return { reason, steps, line: this.vm.line, vmReason, ...this.fault ? { error: this.fault } : {} };
	  }
	  getOutput() {
	    return this.vm.vmGetOutBuffer();
	  }
	  getTime() {
	    return this.vm.ticks;
	  }
	  variableKey(name, dimensions) {
	    if (!/^[a-z][a-z0-9.]*(?:[!%$])?$/i.test(name)) {
	      throw new TypeError("Expected a BASIC variable name without subscripts");
	    }
	    const explicit = /[!%$]$/.test(name), base = (explicit ? name.slice(0, -1) : name).toLowerCase().replace(/\./g, "_"), type = explicit ? { "!": "R", "%": "I", $: "$" }[name.slice(-1)] : this.variables.getVarType(base[0]), key = base + "A".repeat(dimensions) + type;
	    if (this.variables.variableExist(key)) {
	      return key;
	    }
	    if (this.variables.variableExist("_" + key)) {
	      return "_" + key;
	    }
	    throw new ReferenceError("Unknown BASIC variable: " + name);
	  }
	  scalar(value) {
	    if (typeof value !== "number" && typeof value !== "string") {
	      throw new TypeError("Expected a scalar BASIC value");
	    }
	    return value;
	  }
	  assigned(key, value) {
	    if (typeof value === "number" && !Number.isFinite(value)) {
	      throw new RangeError("Numeric values must be finite");
	    }
	    const type = key.slice(-1);
	    if (type === "$") {
	      if (typeof value !== "string") {
	        throw new TypeError("Expected a string value");
	      }
	      if (value.length > 255) {
	        throw new RangeError("BASIC strings cannot exceed 255 characters");
	      }
	      return value;
	    }
	    if (type !== "$" && typeof value !== "number") {
	      throw new TypeError("Expected a numeric value");
	    }
	    if (type === "I") {
	      const rounded = value < 0 ? -Math.round(-value) : Math.round(value);
	      if (rounded < -32768 || rounded > 32767) {
	        throw new RangeError("BASIC integer overflow");
	      }
	      return rounded;
	    }
	    return value;
	  }
	  getVariable(name) {
	    return this.scalar(this.variables.getVariable(this.variableKey(name, 0)));
	  }
	  setVariable(name, value) {
	    const key = this.variableKey(name, 0);
	    this.variables.setVariable(key, this.assigned(key, value));
	  }
	  arraySlot(name, indices) {
	    if (indices.length < 1 || indices.length > 3 || indices.some((index) => !Number.isSafeInteger(index) || index < 0)) {
	      throw new RangeError("Expected one to three nonnegative integer indices");
	    }
	    const key = this.variableKey(name, indices.length);
	    let value = this.variables.getVariable(key);
	    for (let dimension = 0; dimension < indices.length; dimension += 1) {
	      const index = indices[dimension];
	      if (!Array.isArray(value) || index >= value.length) {
	        throw new RangeError("BASIC array index out of bounds");
	      }
	      if (dimension === indices.length - 1) {
	        return { key, array: value, index };
	      }
	      value = value[index];
	    }
	    throw new RangeError("Invalid array indices");
	  }
	  getArrayElement(name, indices) {
	    const slot = this.arraySlot(name, indices);
	    return this.scalar(slot.array[slot.index]);
	  }
	  setArrayElement(name, indices, value) {
	    const slot = this.arraySlot(name, indices);
	    slot.array[slot.index] = this.assigned(slot.key, value);
	  }
	}
	function compile(source, options = {}) {
	  const parser = new BasicParser({ quiet: true }), variables = new Variables({ arrayBounds: true }), generator = new CodeGeneratorJs({ parser, lexer: new BasicLexer({ keywords: parser.getKeywords(), quiet: true }), implicitLines: options.implicitLines ?? false, integerOverflow: true, quiet: true }), output = generator.generate(source, variables);
	  if (output.error) {
	    throw new HeadlessCompileError(output.error);
	  }
	  return new HeadlessProgram(output.text, variables.getAllVariableNames());
	}

	const startConfig = {
	  arrayBounds: false,
	  autorun: true,
	  basicVersion: "1.1",
	  // "1.1" or "1.0"
	  canvasType: "graphics",
	  // "graphics", "text", "none"
	  databaseDirs: "examples",
	  // example base directories (comma separated)
	  database: "examples",
	  // examples, apps, saved
	  debug: 0,
	  example: "cpcbasic",
	  exampleIndex: "0index.js",
	  // example index for every databaseDir
	  implicitLines: false,
	  // allow implicit line numbers
	  input: "",
	  // keyboard input when starting the app
	  integerOverflow: false,
	  // check for integer overflow
	  kbdLayout: "alphanum",
	  // alphanum, alpha, num
	  linesOnLoad: true,
	  // add missing line numbers on load
	  dragElements: false,
	  palette: "color",
	  // "color", "green", "grey"
	  prettyBrackets: true,
	  // pretty print: brackets
	  prettyColons: true,
	  // pretty print: colons
	  prettyLowercaseVars: false,
	  // pretty print: lowercase variables
	  prettySpace: false,
	  // pretty print: spaces
	  processFileImports: true,
	  // open ZIP, DSK files on import
	  random: "cpc",
	  // cpc or minstd
	  selectDataFiles: false,
	  // select data files in example selection
	  showConsoleLog: false,
	  showCpc: true,
	  showDisass: false,
	  showExport: false,
	  showGallery: false,
	  showInput: true,
	  showInp2: false,
	  showKbd: false,
	  showKbdSettings: false,
	  showMore: false,
	  showOutput: false,
	  showPretty: false,
	  showRenum: false,
	  showResult: false,
	  showSettings: false,
	  showVariable: false,
	  showView: false,
	  sound: true,
	  speed: 100,
	  trace: false
	  // trace code
	};
	class cpcBasic {
	  static start(startupAdapter) {
	    Utils.console.log("CPCBasicTS started at", Utils.dateFormat(/* @__PURE__ */ new Date()));
	    const adapterConfig = startupAdapter.getConfigOverrides() || {};
	    Object.assign(startConfig, cpcconfig, adapterConfig);
	    const redirectExamples = startConfig.redirectExamples;
	    delete startConfig.redirectExamples;
	    const engine = new Engine(startConfig), core = engine.core;
	    if (redirectExamples) {
	      core.fnRedirectExamples(redirectExamples);
	    }
	    if (!startupAdapter.isNodeRuntime()) {
	      const winFn = () => {
	        const ui = startupAdapter.getUI();
	        const win = window;
	        if (!ui) {
	          throw new Error("start: UI undefined!");
	        }
	        if (!win) {
	          throw new Error("start: window undefined!");
	        }
	        win.cpcBasic = {
	          addIndex: core.addIndex,
	          addItem: (key, input) => {
	            if (!key) {
	              key = ui.getCurrentDataKey();
	            }
	            core.addItem(key, input);
	          },
	          addRsx: (key, RsxConstructor) => {
	            if (!key) {
	              key = ui.getCurrentDataKey();
	            }
	            core.addRsx(key, RsxConstructor);
	          }
	        };
	        ui.onWindowLoadContinue(engine);
	      };
	      winFn();
	    } else {
	      const nodeUtils = startupAdapter.getNodeUtils();
	      if (!nodeUtils) {
	        throw new Error("start: NodeUtils undefined!");
	      }
	      nodeUtils.nodeMain(engine);
	    }
	  }
	}
	const cpcWindow = typeof window !== "undefined" ? window : void 0;
	if (cpcWindow) {
	  cpcWindow.onload = () => {
	    cpcBasic.start({
	      getConfigOverrides: () => cpcWindow.cpcConfig || {},
	      isNodeRuntime: () => false,
	      getUI: () => new cpcWindow.cpcbasicUI.UI(),
	      getNodeUtils: () => void 0
	    });
	  };
	} else if (typeof require !== "undefined" && require.main === module) {
	  cpcBasic.start({
	    getConfigOverrides: () => ({}),
	    isNodeRuntime: () => true,
	    getUI: () => void 0,
	    getNodeUtils: () => new NodeUtils()
	  });
	}

	exports.Engine = Engine;
	exports.HeadlessCompileError = HeadlessCompileError;
	exports.HeadlessMachine = HeadlessMachine;
	exports.HeadlessProgram = HeadlessProgram;
	exports.HeadlessScreen = HeadlessScreen;
	exports.compile = compile;
	exports.cpcBasic = cpcBasic;

}));
//# sourceMappingURL=cpcbasic.js.map
