// CodeGeneratorJs.ts - Code Generator for JavaScript
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
import { Utils } from "./Utils";
export class CodeGeneratorJs {
    constructor(options) {
        this.line = "0"; // current line (label)
        this.stack = {
            forLabel: [],
            forVarName: [],
            whileLabel: []
        };
        this.gosubCount = 0;
        this.ifCount = 0;
        this.stopCount = 0;
        this.forCount = 0; // stack needed
        this.whileCount = 0; // stack needed
        this.referencedLabelsCount = {};
        this.dataList = []; // collected data from data lines
        this.labelList = []; // all labels
        this.sourceMap = {};
        this.countMap = {};
        // for evaluate:
        this.variables = {}; // will be set later
        this.defintDefstrTypes = {};
        /* eslint-disable no-invalid-this */
        this.allOperators = {
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
            "#": CodeGeneratorJs.stream
        };
        this.unaryOperators = {
            "+": this.plus,
            "-": this.minus,
            not: this.not,
            "@": this.addressOf,
            "#": CodeGeneratorJs.stream
        };
        /* eslint-disable no-invalid-this */
        this.parseFunctions = {
            ";": CodeGeneratorJs.commaOrSemicolon, // ";" for input, line input
            ",": CodeGeneratorJs.commaOrSemicolon, // "," for input, line input
            "|": this.vertical,
            number: CodeGeneratorJs.number,
            expnumber: CodeGeneratorJs.expnumber,
            binnumber: CodeGeneratorJs.binnumber,
            hexnumber: CodeGeneratorJs.hexnumber,
            linenumber: CodeGeneratorJs.linenumber,
            identifier: this.identifier,
            letter: CodeGeneratorJs.letter, // for defint, defreal, defstr
            range: this.range,
            linerange: this.linerange,
            string: CodeGeneratorJs.string,
            ustring: CodeGeneratorJs.string, // unterminated string the same as string
            unquoted: CodeGeneratorJs.unquoted,
            "null": CodeGeneratorJs.fnNull,
            assign: this.assign,
            label: this.label,
            // special keyword functions
            afterGosub: this.afterEveryGosub,
            call: this.fnCommandWithGoto,
            chain: this.fnCommandWithGoto,
            chainMerge: this.fnCommandWithGoto,
            clear: this.fnCommandWithGoto, // will also do e.g. closeout
            closeout: this.fnCommandWithGoto,
            cont: CodeGeneratorJs.cont,
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
            "new": CodeGeneratorJs.fnNew,
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
            "'": this.apostrophe, // apostrophe comment
            renum: this.fnCommandWithGoto,
            restore: this.onBreakGosubOrRestore,
            resume: this.gotoOrResume,
            resumeNext: this.gotoOrResume,
            "return": CodeGeneratorJs.fnReturn,
            run: this.run,
            save: this.save,
            sound: this.fnCommandWithGoto, // maybe queue is full, so insert break
            spc: this.spc,
            stop: this.stopOrEnd,
            tab: this.tab,
            tron: this.fnCommandWithGoto, // not really needed with goto, but...
            using: this.usingOrWrite,
            wend: this.wend,
            "while": this.fnWhile,
            write: this.usingOrWrite
        };
        this.options = {
            quiet: false
        };
        this.setOptions(options); // optional options
        this.reJsKeywords = CodeGeneratorJs.createJsKeywordRegex();
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
        this.line = "0"; // current line (label)
        this.resetCountsPerLine();
        this.labelList.length = 0;
        this.dataList.length = 0;
        this.sourceMap = {};
        this.referencedLabelsCount = {}; // labels or line numbers
        this.countMap = {};
    }
    resetCountsPerLine() {
        this.gosubCount = 0;
        this.ifCount = 0;
        this.stopCount = 0;
        this.forCount = 0; // stack needed
        this.whileCount = 0; // stack needed
    }
    composeError(error, message, value, pos) {
        return Utils.composeError("CodeGeneratorJs", error, message, value, pos, undefined, this.line);
    }
    static createJsKeywordRegex() {
        return new RegExp("^(" + CodeGeneratorJs.jsKeywords.join("|") + ")$");
    }
    fnDeclareVariable(name) {
        if (!this.variables.variableExist(name)) { // variable not yet defined?
            this.variables.initVariable(name);
        }
    }
    fnAdaptVariableName(node, name, arrayIndices) {
        const defScopeArgs = this.defScopeArgs;
        name = name.toLowerCase().replace(/\./g, "_");
        const firstChar = name.charAt(0);
        if ((defScopeArgs && !defScopeArgs.suppressEscape) || !Utils.supportReservedNames) { // avoid keywords as def fn parameters (keep for ERASE); and for IE8 avoid keywords in dot notation
            if (this.reJsKeywords.test(name)) { // IE8: avoid keywords in dot notation
                name = "_" + name; // prepend underscore
            }
        }
        const mappedTypeChar = CodeGeneratorJs.varTypeMap[name.charAt(name.length - 1)] || ""; // map last char
        if (mappedTypeChar) {
            name = name.slice(0, -1); // remove type char
            node.pt = name.charAt(name.length - 1); // set also type; TODO currently not used
        }
        if (arrayIndices) {
            name += "A".repeat(arrayIndices);
        }
        name += mappedTypeChar; // put type at the end
        let needDeclare = false;
        if (defScopeArgs) {
            if (!defScopeArgs.suppressEscape) { // do not escape variable names for ERASE
                if (name === "o" || name === "t" || name === "v") { // we must not use formal parameter "o", "t", "v", since we use them already
                    name = "N" + name; // change variable name to something we cannot set in BASIC
                }
            }
            if (!defScopeArgs.collectDone) { // in collection mode?
                defScopeArgs[name] = true; // declare DEF scope variable
            }
            else if (!(name in defScopeArgs)) {
                needDeclare = true;
            }
        }
        else {
            needDeclare = true;
        }
        if (needDeclare) {
            if (mappedTypeChar) { // we have an explicit type
                this.fnDeclareVariable(name);
                name = "v." + name; // access with "v."
            }
            else if (!this.defintDefstrTypes[firstChar]) {
                // the first char of the variable name is not defined via DEFINT or DEFSTR in the program
                name += "R"; // then we know that the type is real
                this.fnDeclareVariable(name);
                name = "v." + name; // access with "v."
            }
            else {
                // we do not know which type we will need, so declare for all types
                this.fnDeclareVariable(name + "I");
                this.fnDeclareVariable(name + "R");
                this.fnDeclareVariable(name + "$");
                name = 'v["' + name + '" + t.' + name.charAt(0) + "]";
            }
        }
        return name;
    }
    fnParseOneArg(arg) {
        this.parseNode(arg); // eslint-disable-line no-use-before-define
        return arg.pv;
    }
    fnParseArgRange(args, start, stop) {
        const nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
        for (let i = start; i <= stop; i += 1) {
            nodeArgs.push(this.fnParseOneArg(args[i]));
        }
        return nodeArgs;
    }
    fnParseArgs(args) {
        if (!args) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
        }
        return this.fnParseArgRange(args, 0, args.length - 1);
    }
    fnParseArgsIgnoringCommaSemi(args) {
        const nodeArgs = [];
        for (let i = 0; i < args.length; i += 1) {
            if (args[i].type !== "," && args[i].type !== ";") { // ignore separators
                nodeArgs.push(this.fnParseOneArg(args[i]));
            }
        }
        return nodeArgs;
    }
    fnDetermineStaticVarType(name) {
        return this.variables.determineStaticVarType(name);
    }
    static fnExtractVarName(name) {
        if (name.indexOf("v.") === 0) { // variable object?
            name = name.substring(2); // remove preceding "v."
            const bracketIndex = name.indexOf("[");
            if (bracketIndex >= 0) {
                name = name.substring(0, bracketIndex);
            }
        }
        if (name.indexOf('v["') === 0) { // variable object in brackets?
            name = name.substring(3); // remove preceding 'v["'
            const quotesIndex = name.indexOf('"');
            name = name.substring(0, quotesIndex);
        }
        return name;
    }
    static fnGetNameTypeExpression(name) {
        if (name.indexOf("v.") === 0) { // variable object with dot?
            name = name.substring(2); // remove preceding "v."
            const bracketIndex = name.indexOf("[");
            if (bracketIndex >= 0) {
                name = name.substring(0, bracketIndex);
            }
            name = '"' + name + '"';
        }
        if (name.indexOf("v[") === 0) { // variable object with brackets?
            name = name.substring(2); // remove preceding "v["
            const closeBracketIndex = name.indexOf("]");
            name = name.substring(0, closeBracketIndex);
        }
        return name;
    }
    static fnIsIntConst(a) {
        const reIntConst = /^[+-]?(\d+|0x[0-9a-f]+|0b[0-1]+)$/; // regex for integer, hex, binary constant
        return reIntConst.test(a);
    }
    fnGetRoundString(node, err) {
        if (node.pt !== "I") { // no rounding needed for integer, hex, binary constants, integer variables, functions returning integer (optimization)
            node.pv = "o.vmRound(" + node.pv + ")";
        }
        return this.options.integerOverflow ? "o.vmInRange16(" + node.pv + ', "' + err + '")' : node.pv;
    }
    static fnIsInString(string, find) {
        return find && string.indexOf(find) >= 0;
    }
    fnPropagateStaticTypes(node, left, right, types) {
        if (left.pt && right.pt) {
            if (CodeGeneratorJs.fnIsInString(types, left.pt + right.pt)) {
                node.pt = left.pt === right.pt ? left.pt : "R";
            }
            else {
                throw this.composeError(Error(), "Type error", node.value, node.pos);
            }
        }
        else if (left.pt && !CodeGeneratorJs.fnIsInString(types, left.pt) || right.pt && !CodeGeneratorJs.fnIsInString(types, right.pt)) {
            throw this.composeError(Error(), "Type error", node.value, node.pos);
        }
    }
    // operators
    plus(node, left, right) {
        if (left === undefined) { // unary plus? => skip it
            node.pv = right.pv;
            const type = right.pt;
            if (CodeGeneratorJs.fnIsInString("IR$", type)) { // I, R or $?
                node.pt = type;
            }
            else if (type) {
                throw this.composeError(Error(), "Type error", node.value, node.pos);
            }
        }
        else {
            node.pv = left.pv + " + " + right.pv;
            this.fnPropagateStaticTypes(node, left, right, "II RR IR RI $$");
        }
    }
    minus(node, left, right) {
        if (left === undefined) { // unary minus?
            const value = right.pv, type = right.pt;
            // when optimizing, beware of "--" operator in JavaScript!
            if (CodeGeneratorJs.fnIsIntConst(value) || right.type === "number") { // int const or number const (also fp)
                if (value.charAt(0) === "-") { // starting already with "-"?
                    node.pv = value.substring(1); // remove "-"
                }
                else {
                    node.pv = "-" + value;
                }
            }
            else {
                node.pv = "-(" + value + ")"; // can be an expression
            }
            if (CodeGeneratorJs.fnIsInString("IR", type)) { // I or R?
                node.pt = type;
            }
            else if (type) {
                throw this.composeError(Error(), "Type error", node.value, node.pos);
            }
        }
        else {
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
        node.pt = "R"; // event II can get a fraction
    }
    intDiv(node, left, right) {
        node.pv = "(" + this.fnGetRoundString(left, "IDIV") + " / " + this.fnGetRoundString(right, "IDIV") + ") | 0"; // integer division
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
        node.pv = "~(" + this.fnGetRoundString(right, "NOT") + ")"; // a can be an expression
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
        // we want a name, for arrays with "A"'s but without array indices
        const name = CodeGeneratorJs.fnGetNameTypeExpression(right.pv);
        node.pv = "o.addressOf(" + name + ")"; // address of
        node.pt = "I";
    }
    static stream(node, _oLeft, right) {
        // "#" stream as prefix operator
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
        }
        else {
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
        node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "\":";
        return node.pv;
    }
    static commaOrSemicolon(node) {
        node.pv = node.type;
    }
    vertical(node) {
        const rsxName = node.value.substring(1).toLowerCase(), nodeArgs = this.fnParseArgs(node.args), label = this.fnGetStopLabel();
        nodeArgs.unshift('"' + rsxName + '"'); // put as first arg
        node.pv = "o.callRsx(" + nodeArgs.join(", ") + "); o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // most RSX commands need goto (era, ren,...)
    }
    static number(node) {
        node.pt = (/^\d+$/).test(node.value) ? "I" : "R";
        node.pv = node.value;
    }
    static expnumber(node) {
        node.pt = "R";
        node.pv = node.value;
    }
    static binnumber(node) {
        let value = node.value.slice(2); // remove &x
        if (Utils.supportsBinaryLiterals) {
            value = "0b" + ((value.length) ? value : "0"); // &x->0b; 0b is ES6
        }
        else {
            value = "0x" + ((value.length) ? parseInt(value, 2).toString(16) : "0"); // we convert it to hex
        }
        node.pt = "I";
        node.pv = value;
    }
    static hexnumber(node) {
        let value = node.value.slice(1); // remove &
        if (value.charAt(0).toLowerCase() === "h") { // optional h
            value = value.slice(1); // remove
        }
        value || (value = "0");
        let n = parseInt(value, 16);
        if (n > 32767) { //	two's complement
            n = 65536 - n;
            value = "-0x" + n.toString(16);
        }
        else {
            value = "0x" + value;
        }
        node.pt = "I";
        node.pv = value;
    }
    identifier(node) {
        const nodeArgs = node.args ? this.fnParseArgRange(node.args, 1, node.args.length - 2) : [], // array: we skip open and close bracket
        name = this.fnAdaptVariableName(node, node.value, nodeArgs.length); // here we use node.value;
        let indices = "";
        for (let i = 0; i < nodeArgs.length; i += 1) { // array indices
            const arg = node.args[i + 1], // +1 because of opening braket
            index = arg.pt !== "I" ? ("o.vmRound(" + nodeArgs[i] + ")") : nodeArgs[i];
            // can we use fnGetRoundString()?
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
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
        }
        const left = this.fnParseOneArg(node.left).toLowerCase(), right = this.fnParseOneArg(node.right).toLowerCase();
        if (left > right) {
            throw this.composeError(Error(), "Decreasing range", node.value, node.pos);
        }
        node.pv = left + '", "' + right;
    }
    linerange(node) {
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
        }
        const left = this.fnParseOneArg(node.left), right = this.fnParseOneArg(node.right), leftNumber = Number(left), // "undefined" gets NaN (should we check node.left.type for null?)
        rightNumber = Number(right);
        if (leftNumber > rightNumber) { // comparison with NaN and number is always false
            throw this.composeError(Error(), "Decreasing line range", node.value, node.pos);
        }
        const rightSpecified = (right === "undefined") ? "65535" : right; // make sure we set a missing right range parameter
        node.pv = !right ? left : left + ", " + rightSpecified;
    }
    static string(node) {
        let value = node.value;
        value = value.replace(/\\/g, "\\\\"); // escape backslashes
        value = Utils.hexEscape(value);
        node.pt = "$";
        node.pv = '"' + value + '"';
    }
    static unquoted(node) {
        node.pt = "$";
        node.pv = node.value;
    }
    static fnNull(node) {
        node.pv = node.value || "undefined"; // use explicit value or "undefined"
    }
    assign(node) {
        // see also "let"
        if (!node.left || !node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
        }
        if (node.left.type !== "identifier") {
            throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
        }
        const name = this.fnParseOneArg(node.left), assignValue = this.fnParseOneArg(node.right);
        this.fnPropagateStaticTypes(node, node.left, node.right, "II RR IR RI $$");
        const varType = this.fnDetermineStaticVarType(name);
        let value;
        if (node.pt) {
            if (node.left.pt === "I" && node.right.pt === "R") { // special handing for IR: rounding needed
                value = "o.vmRound(" + assignValue + ")";
                node.pt = "I"; // "R" => "I"
            }
            else {
                value = assignValue;
            }
        }
        else {
            value = "o.vmAssign(\"" + varType + "\", " + assignValue + ")";
        }
        node.pv = name + " = " + value;
    }
    generateTraceLabel(node, tracePrefix, i) {
        const traceLabel = tracePrefix + ((i > 0) ? "t" + i : ""), pos = node.pos, len = node.len || node.value.length || 0;
        this.sourceMap[traceLabel] = [
            pos,
            len
        ];
        return traceLabel;
    }
    label(node) {
        const isTraceActive = this.options.trace || Boolean(this.countMap.tron), isResumeNext = Boolean(this.countMap.resumeNext), isResumeNoArgs = Boolean(this.countMap.resumeNoArgsCount);
        let label = node.value;
        this.line = label; // set line before parsing args
        if (this.countMap.resumeNext) {
            this.labelList.push(label); // only needed to support resume next
        }
        this.resetCountsPerLine(); // we want to have "stable" counts, even if other lines change, e.g. direct
        const isDirect = label === "direct";
        let value = "";
        if (isDirect) { // special handling for direct
            value = "o.vmGoto(\"directEnd\"); break;\n";
            label = '"direct"';
        }
        if (!this.options.noCodeFrame) {
            value += "case " + label + ":";
            value += " o.line = " + label + ";";
            if (isTraceActive) {
                value += " o.vmTrace();";
            }
        }
        else {
            value = "";
        }
        const nodeArgs = this.fnParseArgs(node.args);
        for (let i = 0; i < nodeArgs.length; i += 1) {
            let value2 = nodeArgs[i];
            if (value2 !== "") {
                if (isTraceActive || isResumeNext || isResumeNoArgs) {
                    const traceLabel = this.generateTraceLabel(node.args[i], this.line, i); // side effect: put position in source map
                    if (i > 0) { // only if not first statement in the line
                        if (isResumeNext || isResumeNoArgs) { // eslint-disable-line max-depth
                            value += '\ncase "' + traceLabel + '":';
                        }
                        value += ' o.line = "' + traceLabel + '";';
                        if (isResumeNext) { // eslint-disable-line max-depth
                            this.labelList.push('"' + traceLabel + '"'); // only needed to support resume next
                        }
                    }
                }
                if (!(/[}:;\n]$/).test(value2)) { // does not end with } : ; \n
                    value2 += ";";
                }
                else if (value2.substring(value2.length - 1) === "\n") {
                    value2 = value2.substring(0, value2.length - 1);
                }
                value += " " + value2;
            }
        }
        if (isDirect && !this.options.noCodeFrame) {
            value += "\n o.vmGoto(\"end\"); break;\ncase \"directEnd\":"; // put in next line because of possible "rem"
        }
        node.pv = value;
    }
    // special keyword functions
    afterEveryGosub(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
        }
        this.fnAddReferenceLabel(nodeArgs[2], node.args[2]); // argument 2 = line number
        node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
    }
    static cont(node) {
        node.pv = "o." + node.type + "(); break;"; // append break
    }
    data(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        for (let i = 0; i < node.args.length; i += 1) {
            if (node.args[i].type === "unquoted") {
                nodeArgs[i] = '"' + nodeArgs[i].replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + '"'; // escape backslashes and quotes, put in quotes
            }
        }
        let lineString = String(this.line); // TODO: already string?
        if (lineString === "direct") {
            lineString = '"' + lineString + '"';
        }
        nodeArgs.unshift(lineString); // prepend line number
        this.dataList.push("o.data(" + nodeArgs.join(", ") + ")"); // will be set at the beginning of the script
        node.pv = "/* data */";
    }
    def(node) {
        if (!node.right) {
            throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos); // should not occur
        }
        const savedValue = node.right.value;
        node.right.value = "fn" + savedValue; // prefix with "fn"
        const name = this.fnParseOneArg(node.right);
        node.right.value = savedValue; // restore
        const expressionArg = node.args.pop();
        this.defScopeArgs = {}; // collect DEF scope args
        const nodeArgs = this.fnParseArgs(node.args);
        this.defScopeArgs.collectDone = true; // collection done => now use them
        const expression = this.fnParseOneArg(expressionArg);
        this.defScopeArgs = undefined;
        this.fnPropagateStaticTypes(node, node.right, expressionArg, "II RR IR RI $$");
        let value;
        if (node.pt) {
            if (node.right.pt === "I" && expressionArg.pt === "R") { // special handing for IR: rounding needed
                value = "o.vmRound(" + expression + ")";
                node.pt = "I"; // "R" => "I"
            }
            else {
                value = expression;
            }
        }
        else {
            const varType = this.fnDetermineStaticVarType(name);
            value = "o.vmAssign(\"" + varType + "\", " + expression + ")";
        }
        value = name + " = function (" + nodeArgs.join(", ") + ") { return " + value + "; };";
        node.pv = value;
    }
    dim(node) {
        const args = [];
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
        }
        for (let i = 0; i < node.args.length; i += 1) {
            const nodeArg = node.args[i];
            if (nodeArg.type !== "identifier") {
                throw this.composeError(Error(), "Expected variable in DIM", node.type, node.pos);
            }
            if (!nodeArg.args) {
                throw this.composeError(Error(), "Programming error: Undefined args", nodeArg.type, nodeArg.pos); // should not occur
            }
            const nodeArgs = this.fnParseArgRange(nodeArg.args, 1, nodeArg.args.length - 2), // we skip open and close bracket
            fullExpression = this.fnParseOneArg(nodeArg), name = CodeGeneratorJs.fnGetNameTypeExpression(fullExpression);
            nodeArgs.unshift(name); // put as first arg
            args.push("/* " + fullExpression + " = */ o.dim(" + nodeArgs.join(", ") + ")");
        }
        node.pv = args.join("; ");
    }
    fnDelete(node) {
        const nodeArgs = this.fnParseArgs(node.args), name = Utils.supportReservedNames ? ("o." + node.type) : 'o["' + node.type + '"]';
        if (!nodeArgs.length) { // no arguments? => complete range
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
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
        }
        let value = "else"; // not: node.type;
        for (let i = 0; i < node.args.length; i += 1) {
            const token = node.args[i];
            if (token.value) {
                value += " " + token.value;
            }
        }
        node.pv = "// " + value + "\n";
    }
    erase(node) {
        this.defScopeArgs = {}; // collect DEF scope args
        this.defScopeArgs.suppressEscape = true; // suppress escape with prefix "N"
        const nodeArgs = this.fnParseArgs(node.args);
        this.defScopeArgs = undefined;
        for (let i = 0; i < nodeArgs.length; i += 1) {
            nodeArgs[i] = '"' + nodeArgs[i] + '"'; // put in quotes
        }
        node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
    }
    error(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break";
    }
    fn(node) {
        if (!node.right) {
            throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos); // should not occur
        }
        const nodeArgs = this.fnParseArgs(node.args), savedValue = node.right.value;
        node.right.value = "fn" + savedValue; // prefix with "fn"
        const name = this.fnParseOneArg(node.right);
        node.right.value = savedValue; // restore
        if (node.right.pt) {
            node.pt = node.right.pt;
        }
        node.pv = name + "(" + nodeArgs.join(", ") + ")";
    }
    static parseIntNumber(numString) {
        // Number() cannot parse negative bin or hex numbers so detect a sign first
        const hasSign = numString[0] === "-", value = hasSign ? -Number(numString.substring(1)) : Number(numString);
        return value;
    }
    // eslint-disable-next-line complexity
    fnFor(node) {
        const nodeArgs = this.fnParseArgs(node.args), varName = nodeArgs[0], label = this.fnGetForLabel();
        this.stack.forLabel.push(label);
        this.stack.forVarName.push(varName);
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
        }
        const startNode = node.args[1], endNode = node.args[2], stepNode = node.args[3]; // optional
        let startValue = nodeArgs[1], endValue = nodeArgs[2], stepValue = stepNode ? nodeArgs[3] : "1"; // default step
        // optimization for integer constants (check value and not type, because we also want to accept e.g. -<number>):
        const startIsIntConst = CodeGeneratorJs.fnIsIntConst(startValue), endIsIntConst = CodeGeneratorJs.fnIsIntConst(endValue), stepIsIntConst = CodeGeneratorJs.fnIsIntConst(stepValue), varType = this.fnDetermineStaticVarType(varName), type = (varType.length > 1) ? varType.charAt(1) : "";
        if (type === "$") {
            throw this.composeError(Error(), "Type error", node.args[0].value, node.args[0].pos);
        }
        if (!startIsIntConst) {
            if (startNode.pt !== "I") {
                startValue = "o.vmAssign(\"" + varType + "\", " + startValue + ")"; // assign checks and rounds, if needed
            }
        }
        let endName;
        if (!endIsIntConst) {
            if (endNode.pt !== "I") {
                endValue = "o.vmAssign(\"" + varType + "\", " + endValue + ")";
            }
            endName = CodeGeneratorJs.fnExtractVarName(varName) + "End";
            this.fnDeclareVariable(endName); // declare also end variable
            endName = "v." + endName;
        }
        if (varName.indexOf("v[") === 0) { // untyped?
            // TODO
        }
        let stepName;
        if (!stepIsIntConst) {
            if (stepNode && stepNode.pt !== "I") {
                stepValue = "o.vmAssign(\"" + varType + "\", " + stepValue + ")";
            }
            stepName = CodeGeneratorJs.fnExtractVarName(varName) + "Step";
            this.fnDeclareVariable(stepName); // declare also step variable
            stepName = "v." + stepName;
        }
        let value = "/* for() */";
        if (type !== "I" && type !== "R") {
            value += " o.vmAssertNumberType(\"" + varType + "\");"; // do a type check: assert number type
        }
        value += " " + varName + " = " + startValue + ";";
        if (!endIsIntConst) {
            value += " " + endName + " = " + endValue + ";";
        }
        if (!stepIsIntConst) {
            value += " " + stepName + " = " + stepValue + ";";
        }
        value += " o.vmGoto(\"" + label + "b\"); break;";
        value += "\ncase \"" + label + "\": ";
        value += varName + " += " + (stepIsIntConst ? stepValue : stepName) + ";";
        value += "\ncase \"" + label + "b\": ";
        const endNameOrValue = endIsIntConst ? endValue : endName;
        if (stepIsIntConst) {
            const stepValueAsNum = CodeGeneratorJs.parseIntNumber(stepValue); // can also be a negative binary or hexadecimal string
            if (stepValueAsNum > 0) {
                value += "if (" + varName + " > " + endNameOrValue + ") { o.vmGoto(\"" + label + "e\"); break; }";
            }
            else if (stepValueAsNum < 0) {
                value += "if (" + varName + " < " + endNameOrValue + ") { o.vmGoto(\"" + label + "e\"); break; }";
            }
            else { // stepValue === 0 => endless loop, if starting with variable !== end
                value += "if (" + varName + " === " + endNameOrValue + ") { o.vmGoto(\"" + label + "e\"); break; }";
            }
        }
        else {
            value += "if (" + stepName + " > 0 && " + varName + " > " + endNameOrValue + " || " + stepName + " < 0 && " + varName + " < " + endNameOrValue + " || !" + stepName + " && " + varName + " === " + endNameOrValue + ") { o.vmGoto(\"" + label + "e\"); break; }";
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
        node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break"; // with break
    }
    fnThenOrElsePart(args, tracePrefix) {
        const isTraceActive = this.options.trace, isResumeNext = Boolean(this.countMap.resumeNext), isResumeNoArgs = Boolean(this.countMap.resumeNoArgsCount), nodeArgs = this.fnParseArgs(args);
        if (args.length && args[0].type === "linenumber") {
            const line = nodeArgs[0];
            this.fnAddReferenceLabel(line, args[0]);
            nodeArgs[0] = "o.goto(" + line + "); break"; // convert to "goto"
        }
        if (isTraceActive || isResumeNext || isResumeNoArgs) {
            for (let i = 0; i < nodeArgs.length; i += 1) {
                const traceLabel = this.generateTraceLabel(args[i], tracePrefix, i);
                let value = "";
                if (isResumeNext || isResumeNoArgs) {
                    value += '\ncase "' + traceLabel + '":';
                }
                if (isResumeNext) {
                    this.labelList.push('"' + traceLabel + '"'); // only needed to support resume next
                }
                value += ' o.line = "' + traceLabel + '";';
                nodeArgs[i] = value + " " + nodeArgs[i];
            }
        }
        return nodeArgs.join("; ");
    }
    static fnIsSimplePart(part) {
        const partNoTrailingBreak = part.replace(/; break$/, ""), simplePart = !(/case|break/).test(partNoTrailingBreak);
        return simplePart;
    }
    fnIf(node) {
        if (!node.right) {
            throw this.composeError(Error(), "Programming error: Undefined left", node.type, node.pos); // should not occur
        }
        let expression = this.fnParseOneArg(node.right);
        if (expression.endsWith(" ? -1 : 0")) { // optimize simple expression
            expression = expression.replace(/ \? -1 : 0$/, "");
        }
        const label = this.fnGetIfLabel(), // need it also for tracing nested if
        elseArgs = node.args.length && node.args[node.args.length - 1].type === "else" ? node.args.pop().args : undefined, elsePart = elseArgs ? this.fnThenOrElsePart(elseArgs, label + "E") : "", thenPart = this.fnThenOrElsePart(node.args, label + "T"), // "then"/"goto" statements
        simpleThen = CodeGeneratorJs.fnIsSimplePart(thenPart), simpleElse = elsePart ? CodeGeneratorJs.fnIsSimplePart(elsePart) : true;
        let value = "if (" + expression + ") { ";
        if (simpleThen && simpleElse) {
            value += thenPart + "; }";
            if (elsePart) {
                value += " else { " + elsePart + "; }";
            }
        }
        else {
            value += 'o.vmGoto("' + label + '"); break; } ';
            if (elsePart !== "") { // "else" statements?
                value += "/* else */ " + elsePart + "; ";
            }
            value += 'o.vmGoto("' + label + 'e"); break;\ncase "' + label + '": ' + thenPart + ';\ncase "' + label + 'e": ';
        }
        node.pv = value;
    }
    inputOrlineInput(node) {
        const nodeArgs = this.fnParseArgs(node.args), varTypes = [], label = this.fnGetStopLabel();
        if (nodeArgs.length < 4) {
            throw this.composeError(Error(), "Programming error: Not enough parameters", node.type, node.pos); // should not occur
        }
        const stream = nodeArgs[0];
        let noCRLF = nodeArgs[1];
        if (noCRLF === ";") { // ; or null
            noCRLF = '"' + noCRLF + '"';
        }
        let msg = nodeArgs[2];
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
        }
        if (node.args[2].type === "null") { // message type
            msg = '""';
        }
        const prompt = nodeArgs[3];
        if (prompt === ";" || node.args[3].type === "null") { // ";" => insert prompt "? " in quoted string
            msg = msg.substring(0, msg.length - 1) + "? " + msg.substr(-1, 1);
        }
        for (let i = 4; i < nodeArgs.length; i += 1) {
            varTypes[i - 4] = this.fnDetermineStaticVarType(nodeArgs[i]);
        }
        let value = "o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // also before input
        const label2 = this.fnGetStopLabel();
        value += "o." + node.type + "(" + stream + ", " + noCRLF + ", " + msg + ", \"" + varTypes.join('", "') + "\"); o.vmGoto(\"" + label2 + "\"); break;\ncase \"" + label2 + "\":";
        for (let i = 4; i < nodeArgs.length; i += 1) {
            value += "; " + nodeArgs[i] + " = o.vmGetNextInput()";
        }
        node.pv = value;
    }
    let(node) {
        if (!node.right) {
            throw this.composeError(Error(), "Programming error: Undefined right", node.type, node.pos); // should not occur
        }
        this.assign(node.right);
        node.pv = node.right.pv;
        node.pt = node.right.pt; // TODO: Do we need this?
    }
    list(node) {
        const nodeArgs = this.fnParseArgs(node.args); // or: fnCommandWithGoto
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", node.type, node.pos); // should not occur
        }
        if (!node.args.length || node.args[node.args.length - 1].type === "#") { // last parameter stream? or no parameters?
            const stream = nodeArgs.pop() || "0";
            nodeArgs.unshift(stream); // put it first
        }
        node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + "); break;";
    }
    mid$Assign(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        if (nodeArgs.length < 4) {
            nodeArgs.splice(2, 0, "undefined"); // set empty length
        }
        const name = nodeArgs[0], varType = this.fnDetermineStaticVarType(name);
        node.pv = name + " = o.vmAssign(\"" + varType + "\", o.mid$Assign(" + nodeArgs.join(", ") + "))";
    }
    static fnNew(node) {
        const name = Utils.supportReservedNames ? ("o." + node.type) : 'o["' + node.type + '"]';
        node.pv = name + "();";
    }
    next(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        if (!nodeArgs.length) {
            nodeArgs.push(""); // we have no variable, so use empty argument
        }
        for (let i = 0; i < nodeArgs.length; i += 1) {
            const label = this.stack.forLabel.pop(), varName = this.stack.forVarName.pop();
            let errorNode;
            if (label === undefined) {
                if (nodeArgs[i] === "") { // inserted node?
                    errorNode = node;
                }
                else { // identifier arg
                    errorNode = node.args[i];
                }
                throw this.composeError(Error(), "Unexpected NEXT", errorNode.type, errorNode.pos);
            }
            if (nodeArgs[i] !== "" && nodeArgs[i] !== varName) {
                errorNode = node.args[i];
                throw this.composeError(Error(), "Unexpected NEXT variable", errorNode.value, errorNode.pos);
            }
            nodeArgs[i] = "/* " + node.type + "(\"" + nodeArgs[i] + "\") */ o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "e\":";
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
            if (Number(nodeArgs[i])) { // only for lines > 0
                this.fnAddReferenceLabel(nodeArgs[i], node.args[i]);
            }
        }
        node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
    }
    onGosubOnGoto(node) {
        const nodeArgs = this.fnParseArgs(node.args), label = node.type === "onGosub" ? this.fnGetGosubLabel() : this.fnGetStopLabel();
        for (let i = 1; i < nodeArgs.length; i += 1) { // starting with 1
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
            throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
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
            if (arg.type === ",") { // comma tab
                argString = "{type: \"commaTab\", args: []}"; // we must delay the commaTab() call until print() is called
                nodeArgs.push(argString);
            }
            else if (arg.type !== ";") { // ignore ";" separators
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
        }
        else {
            const label = this.fnGetStopLabel();
            value = "o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "\":"; // also before input
            value += this.fnCommandWithGoto(node) + " o.randomize(o.vmGetNextInput())";
        }
        node.pv = value;
    }
    read(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        for (let i = 0; i < nodeArgs.length; i += 1) {
            const name = nodeArgs[i], varType = this.fnDetermineStaticVarType(name);
            nodeArgs[i] = name + " = o." + node.type + "(\"" + varType + "\")";
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
            nodeArgs[0] = " " + nodeArgs[0]; // add extra space
        }
        node.pv = "//" + nodeArgs.join("") + "\n";
    }
    static fnReturn(node) {
        const name = Utils.supportReservedNames ? ("o." + node.type) : 'o["' + node.type + '"]';
        node.pv = name + "(); break;";
    }
    run(node) {
        if (node.args.length) {
            if (node.args[0].type === "linenumber" || node.args[0].type === "number") { // optional line number, should be linenumber only
                this.fnAddReferenceLabel(this.fnParseOneArg(node.args[0]), node.args[0]); // parse only one arg, args are parsed later
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
                this.defScopeArgs = {}; // collect DEF scope args
                const type = '"' + this.fnParseOneArg(node.args[1]) + '"';
                this.defScopeArgs = undefined;
                nodeArgs.push(type);
                const nodeArgs2 = node.args.slice(2), // get remaining args
                nodeArgs3 = this.fnParseArgs(nodeArgs2);
                nodeArgs = nodeArgs.concat(nodeArgs3);
            }
        }
        node.pv = this.fnCommandWithGoto(node, nodeArgs);
    }
    spc(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        node.pv = "{type: \"spc\", args: [" + nodeArgs.join(", ") + "]}"; // we must delay the spc() call until print() is called because we need stream
    }
    stopOrEnd(node) {
        const label = this.fnGetStopLabel();
        node.pv = "o." + node.type + "(\"" + label + "\"); break;\ncase \"" + label + "\":";
    }
    tab(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        node.pv = "{type: \"tab\", args: [" + nodeArgs.join(", ") + "]}"; // we must delay the tab() call until print() is called
    }
    usingOrWrite(node) {
        const nodeArgs = this.fnParseArgsIgnoringCommaSemi(node.args);
        node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
    }
    wend(node) {
        const label = this.stack.whileLabel.pop();
        if (label === undefined) {
            throw this.composeError(Error(), "Unexpected WEND", node.type, node.pos);
        }
        node.pv = "/* o." + node.type + "() */ o.vmGoto(\"" + label + "\"); break;\ncase \"" + label + "e\":";
    }
    fnWhile(node) {
        const nodeArgs = this.fnParseArgs(node.args), label = this.fnGetWhileLabel();
        this.stack.whileLabel.push(label);
        node.pv = "\ncase \"" + label + "\": if (!(" + nodeArgs + ")) { o.vmGoto(\"" + label + "e\"); break; }";
    }
    /* eslint-enable no-invalid-this */
    fnParseOther(node) {
        const nodeArgs = this.fnParseArgs(node.args), typeWithSpaces = " " + node.type + " ";
        node.pv = "o." + node.type + "(" + nodeArgs.join(", ") + ")";
        if (CodeGeneratorJs.fnIsInString(" asc cint derr eof erl err fix fre inkey inp instr int joy len memory peek pos remain sgn sq test testr unt vpos xpos ypos ", typeWithSpaces)) {
            node.pt = "I";
        }
        else if (CodeGeneratorJs.fnIsInString(" abs atn cos creal exp log log10 pi rnd round sin sqr tan time val ", typeWithSpaces)) {
            node.pt = "R";
        }
        else if (CodeGeneratorJs.fnIsInString(" bin$ chr$ copychr$ dec$ hex$ inkey$ left$ lower$ mid$ right$ space$ str$ string$ upper$ ", typeWithSpaces)) {
            node.pt = "$";
        }
        // Note: min and max usually return a number, but for a single string argument also the string!
        if (node.type === "min" || node.type === "max") {
            if (node.args.length === 1) {
                if (node.args[0].type === "$") {
                    node.pt = "$";
                }
            }
            else if (node.args.length > 1) {
                node.pt = "R";
            }
        }
    }
    parseOperator(node) {
        const operators = this.allOperators;
        if (node.left) {
            this.parseNode(node.left);
            if (operators[node.left.type] && node.left.left) { // binary operator?
                node.left.pv = "(" + node.left.pv + ")";
            }
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
            }
            this.parseNode(node.right);
            if (operators[node.right.type] && node.right.left) { // binary operator?
                node.right.pv = "(" + node.right.pv + ")";
            }
            operators[node.type].call(this, node, node.left, node.right);
        }
        else {
            if (!node.right) {
                throw this.composeError(Error(), "Programming error: Undefined right", "", -1); // should not occur
            }
            this.parseNode(node.right);
            this.unaryOperators[node.type].call(this, node, undefined, node.right); // unary operator: we just use node.right
        }
    }
    parseNode(node) {
        if (Utils.debug > 3) {
            Utils.console.debug("evaluate: parseNode node=%o type=" + node.type + " value=" + node.value + " left=%o right=%o args=%o", node, node.left, node.right, node.args);
        }
        if (this.allOperators[node.type]) {
            this.parseOperator(node);
        }
        else if (this.parseFunctions[node.type]) { // function with special handling?
            this.parseFunctions[node.type].call(this, node);
        }
        else { // for other functions, generate code directly
            this.fnParseOther(node);
        }
    }
    static fnCommentUnusedCases(output, labels) {
        return output.replace(/^case (\d+):/gm, function (all, line) {
            return (labels[line]) ? all : "/* " + all + " */";
        });
    }
    fnCheckLabel(node, lastLine) {
        let label = node.value;
        if (label === "") {
            if (this.options.implicitLines) {
                label = String(lastLine + 1); // no line => we just increase the last line by 1
                node.value = label; // we also modify the parse tree
            }
            else {
                throw this.composeError(Error(), "Direct command found", label, node.pos);
            }
        }
        const lineNumber = Number(label);
        if ((lineNumber | 0) !== lineNumber) { // eslint-disable-line no-bitwise
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
                    labels[label] = 0; // init call count
                    lastLine = Number(label);
                }
            }
        }
    }
    removeAllDefVarTypes() {
        const varTypes = this.defintDefstrTypes;
        for (const name in varTypes) { // eslint-disable-line guard-for-in
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
                }
                else if (arg.type === "range") {
                    if (!arg.left || !arg.right) {
                        throw this.composeError(Error(), "Programming error: Undefined left or right", node.type, node.pos); // should not occur
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
                this.fnPrecheckTree(node.args, countMap); // recursive
            }
        }
    }
    //
    // evaluate
    //
    evaluate(parseTree, variables) {
        this.variables = variables;
        this.defScopeArgs = undefined;
        // create labels map
        this.fnCreateLabelMap(parseTree, this.referencedLabelsCount);
        this.removeAllDefVarTypes();
        this.fnPrecheckTree(parseTree, this.countMap); // also sets "resumeNoArgsCount" for resume without args
        let output = "";
        for (let i = 0; i < parseTree.length; i += 1) {
            if (Utils.debug > 2) {
                Utils.console.debug("evaluate: parseTree i=%d, node=%o", i, parseTree[i]);
            }
            const line = this.fnParseOneArg(parseTree[i]);
            if ((line !== undefined) && (line !== "")) {
                if (line !== null) {
                    if (output.length === 0) {
                        output = line;
                    }
                    else {
                        output += "\n" + line;
                    }
                }
                else {
                    output = ""; // cls (clear output when node is set to null)
                }
            }
        }
        // optimize: comment lines which are not referenced
        if (!this.countMap.merge && !this.countMap.chainMerge && !this.countMap.resumeNext && !this.countMap.resumeNoArgsCount) {
            output = CodeGeneratorJs.fnCommentUnusedCases(output, this.referencedLabelsCount);
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
            const combinedData = CodeGeneratorJs.combineData(this.dataList), combinedLabels = CodeGeneratorJs.combineLabels(this.labelList);
            if (!this.options.noCodeFrame) {
                output = '"use strict"\n'
                    + "var v=o.vmGetAllVariables();\n"
                    + "var t=o.vmGetAllVarTypes();\n"
                    + "while (o.vmLoopCondition()) {\nswitch (o.line) {\ncase 0:\n"
                    + combinedData
                    + combinedLabels
                    + " o.vmGoto(o.startLine ? o.startLine : \"start\"); break;\ncase \"start\":\n"
                    + output
                    + "\ncase \"end\": o.line=\"end\"; o.vmStop(\"end\", 90); break;\ndefault: o.error(8); o.vmGoto(\"end\"); break;\n}}\n";
            }
            else {
                output = combinedData + output;
            }
            out.text = output;
        }
        catch (e) {
            if (Utils.isCustomError(e)) {
                out.error = e;
                if (!this.options.quiet) {
                    Utils.console.warn(e); // show our customError as warning
                }
            }
            else { // other errors
                out.error = e; // force set other error
                Utils.console.error(e);
            }
        }
        return out;
    }
}
// ECMA 3 JS Keywords which must be avoided in dot notation for properties when using IE8
CodeGeneratorJs.jsKeywords = [
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
CodeGeneratorJs.varTypeMap = {
    "!": "R",
    "%": "I",
    $: "$" // or "S"?
};
//# sourceMappingURL=CodeGeneratorJs.js.map