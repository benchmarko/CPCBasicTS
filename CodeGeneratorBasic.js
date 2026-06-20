// CodeGeneratorBasic.ts - Code Generator for BASIC (for testing, pretty print?)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
//
//
import { Utils } from "./Utils";
export class CodeGeneratorBasic {
    constructor(options) {
        this.hasColons = false;
        this.keepWhiteSpace = false;
        this.line = 0; // current line (label)
        /* eslint-disable no-invalid-this */
        this.parseFunctions = {
            "(": this.fnParenthesisOpen,
            string: CodeGeneratorBasic.string,
            ustring: CodeGeneratorBasic.ustring,
            assign: this.assign,
            expnumber: CodeGeneratorBasic.expnumber,
            binnumber: CodeGeneratorBasic.binHexNumber,
            hexnumber: CodeGeneratorBasic.binHexNumber,
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
            onBreakCont: this.onBreakOrError, // 3 parts
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
        return Utils.composeError("CodeGeneratorBasic", error, message, value, pos, undefined, this.line);
    }
    static fnWs(node) {
        return node.ws || "";
    }
    static fnSpace1(value) {
        return (!value.length || value.startsWith(" ") ? "" : " ") + value;
    }
    static getUcKeyword(node) {
        const type = node.type;
        return CodeGeneratorBasic.combinedKeywords[type] || type.toUpperCase();
    }
    fnParseArgs(args) {
        const nodeArgs = []; // do not modify node.args here (could be a parameter of defined function)
        if (!args) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
        }
        for (let i = 0; i < args.length; i += 1) {
            let value = this.parseNode(args[i]);
            if (args[i].type === "'" || args[i].type === "else" || args[i].type === "elseComment") { // fast hack to put a space before "'", "else" or "elseComment", if there is no space previously
                if (i > 0 && !nodeArgs[i - 1].endsWith(" ") && !nodeArgs[i - 1].endsWith(":")) {
                    value = CodeGeneratorBasic.fnSpace1(value);
                }
            }
            nodeArgs.push(value);
        }
        return nodeArgs;
    }
    combineArgsWithColon(args) {
        if (!this.hasColons) {
            for (let i = 1; i < args.length; i += 1) { // start with 1
                const arg = args[i].trim();
                if (!arg.startsWith("ELSE") && !arg.startsWith("'") && arg !== "") {
                    args[i] = ":" + args[i];
                }
            }
        }
        return args.join("");
    }
    fnParenthesisOpen(node) {
        return CodeGeneratorBasic.fnWs(node) + node.value + (node.args ? this.fnParseArgs(node.args).join("") : "");
    }
    static string(node) {
        return CodeGeneratorBasic.fnWs(node) + '"' + node.value + '"';
    }
    static ustring(node) {
        return CodeGeneratorBasic.fnWs(node) + '"' + node.value;
    }
    assign(node) {
        // see also "let"
        if (node.left.type !== "identifier") {
            throw this.composeError(Error(), "Unexpected assign type", node.type, node.pos); // should not occur
        }
        // no spaces needed around "="
        return this.parseNode(node.left) + CodeGeneratorBasic.fnWs(node) + node.value + this.parseNode(node.right);
    }
    static expnumber(node) {
        return CodeGeneratorBasic.fnWs(node) + Number(node.value).toExponential().toUpperCase().replace(/(\d+)$/, function (x) {
            return x.length >= 2 ? x : x.padStart(2, "0"); // format with 2 exponential digits
        });
    }
    static binHexNumber(node) {
        return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase(); // binnumber: maybe "&x", hexnumber: mayby "&h"
    }
    label(node) {
        this.line = Number(node.value); // set line before parsing args
        const value = this.combineArgsWithColon(this.fnParseArgs(node.args));
        return CodeGeneratorBasic.fnWs(node) + node.value + (node.value !== "" ? CodeGeneratorBasic.fnSpace1(value) : value);
    }
    // special keyword functions
    vertical(node) {
        return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + this.fnParseArgs(node.args).join("");
    }
    afterEveryGosub(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        nodeArgs[0] = CodeGeneratorBasic.fnSpace1(nodeArgs[0]); // first argument
        nodeArgs[nodeArgs.length - 2] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]); // "gosub"
        nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]); // line number
        return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + nodeArgs.join("");
    }
    chainOrChainMerge(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        if (nodeArgs.length > 2) { // with delete?
            if (nodeArgs[nodeArgs.length - 2] === "DELETE") {
                nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]);
            }
        }
        return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + (node.right ? CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) : "") + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
    }
    data(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        for (let i = 0; i < nodeArgs.length; i += 1) {
            const value2 = nodeArgs[i];
            nodeArgs[i] = value2;
        }
        let args = nodeArgs.join("");
        if (!this.keepWhiteSpace) {
            args = Utils.stringTrimEnd(args); // remove trailing spaces
        }
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(args);
    }
    def(node) {
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.right ? CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + this.fnParseArgs(node.args).join("") : "");
    }
    elseComment(node) {
        if (!node.args) {
            throw this.composeError(Error(), "Programming error: Undefined args", "", -1); // should not occur
        }
        const args = node.args;
        let value = "";
        for (let i = 0; i < args.length; i += 1) {
            const token = args[i];
            if (token.value) {
                if (this.keepWhiteSpace) {
                    value += CodeGeneratorBasic.fnWs(token) + token.value;
                }
                else {
                    value += CodeGeneratorBasic.fnSpace1(CodeGeneratorBasic.fnWs(token) + token.value);
                }
            }
        }
        return CodeGeneratorBasic.fnWs(node) + "else".toUpperCase() + value;
    }
    fn(node) {
        if (!node.right) {
            return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase(); // only fn
        }
        const nodeArgs = node.args ? this.fnParseArgs(node.args) : [];
        let right = this.parseNode(node.right);
        if ((node.right.pos - node.pos) > 2) { // space between fn and identifier?
            right = CodeGeneratorBasic.fnSpace1(right); // keep it
        }
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + right + nodeArgs.join("");
    }
    fnFor(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        for (let i = 0; i < nodeArgs.length; i += 1) {
            if (i !== 1 && i !== 2) { // not for "=" and startValue
                nodeArgs[i] = CodeGeneratorBasic.fnSpace1(nodeArgs[i]); // set minimal spaces in case we do not keep whitespace
            }
        }
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + nodeArgs.join("");
    }
    fnElse(node) {
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(this.fnParseArgs(node.args)));
    }
    fnIf(node) {
        const nodeArgs = this.fnParseArgs(node.args), partName = nodeArgs.shift(); // "then"/"goto"
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right))
            + CodeGeneratorBasic.fnSpace1(partName) + CodeGeneratorBasic.fnSpace1(this.combineArgsWithColon(nodeArgs));
    }
    inputLineInput(node) {
        const nodeArgs = node.args ? this.fnParseArgs(node.args) : [], // also for clear input, which has no args
        name = node.right ? this.parseNode(node.right) : ""; // line input?
        return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + CodeGeneratorBasic.fnSpace1(name) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
    }
    list(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        if (nodeArgs.length && nodeArgs[0] === "") { // empty range?
            nodeArgs.shift(); // remove
        }
        if (nodeArgs.length && nodeArgs[nodeArgs.length - 1] === "#") { // dummy stream?
            nodeArgs.pop(); // remove
        }
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
    }
    mid$Assign(node) {
        return CodeGeneratorBasic.fnWs(node) + CodeGeneratorBasic.getUcKeyword(node) + this.fnParseArgs(node.args).join("");
    }
    onBreakOrError(node) {
        return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join(""));
    }
    onGotoGosub(node) {
        const nodeArgs = this.fnParseArgs(node.args), expression = nodeArgs.shift(), instruction = nodeArgs.shift(); // "goto" or "gosub"
        return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(expression) + CodeGeneratorBasic.fnSpace1(instruction) + CodeGeneratorBasic.fnSpace1(nodeArgs.join(""));
    }
    onSqGosub(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        nodeArgs[nodeArgs.length - 2] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 2]); // "gosub" with space (optional)
        nodeArgs[nodeArgs.length - 1] = CodeGeneratorBasic.fnSpace1(nodeArgs[nodeArgs.length - 1]); // line number with space
        return CodeGeneratorBasic.fnWs(node) + "ON" + CodeGeneratorBasic.fnSpace1(this.parseNode(node.right)) + nodeArgs.join("");
    }
    print(node) {
        const nodeArgs = this.fnParseArgs(node.args);
        let value = "";
        for (let i = 0; i < nodeArgs.length; i += 1) {
            value += nodeArgs[i];
        }
        if (node.value !== "?") { // for "print"
            value = CodeGeneratorBasic.fnSpace1(value);
        }
        return CodeGeneratorBasic.fnWs(node) + node.value.toUpperCase() + value; // we use value to get PRINT or ?
    }
    rem(node) {
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + this.fnParseArgs(node.args).join("");
    }
    using(node) {
        const nodeArgs = this.fnParseArgs(node.args), template = nodeArgs.length ? nodeArgs.shift() || "" : "";
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + CodeGeneratorBasic.fnSpace1(template) + nodeArgs.join("");
    }
    write(node) {
        return CodeGeneratorBasic.fnWs(node) + node.type.toUpperCase() + (node.args ? CodeGeneratorBasic.fnSpace1(this.fnParseArgs(node.args).join("")) : ""); // separators already there
    }
    /* eslint-enable no-invalid-this */
    fnParseOther(node) {
        const type = node.type;
        let value = ""; // CodeGeneratorBasic.fnGetWs(node);
        if (node.left) {
            value += this.parseNode(node.left);
        }
        value += CodeGeneratorBasic.fnWs(node);
        const keyType = this.keywords[type];
        if (keyType) {
            value += CodeGeneratorBasic.getUcKeyword(node);
        }
        else if (node.value) { // e.g. string,...
            value += node.value;
        }
        let right = "";
        if (node.right) {
            right = this.parseNode(node.right);
            const needSpace1 = this.keywords[right.toLowerCase()] || keyType;
            value += needSpace1 ? CodeGeneratorBasic.fnSpace1(right) : right;
        }
        if (node.args) {
            const nodeArgs = this.fnParseArgs(node.args).join(""), needSpace2 = keyType && keyType.charAt(0) !== "f" && node.type !== "'";
            // special handling for combined keywords with 2 tokens (for 3 tokens, we need a specific function)
            value += needSpace2 ? CodeGeneratorBasic.fnSpace1(nodeArgs) : nodeArgs;
        }
        return value;
    }
    static getLeftOrRightOperatorPrecedence(node) {
        const precedence = CodeGeneratorBasic.operatorPrecedence, operators = CodeGeneratorBasic.operators;
        let pr;
        if (operators[node.type] && (node.left || node.right)) { // binary operator (or unary operator, e.g. not)
            if (node.left) { // right is binary
                pr = precedence[node.type] || 0;
            }
            else {
                pr = precedence["p" + node.type] || precedence[node.type] || 0;
            }
        }
        return pr;
    }
    parseOperator(node) {
        const precedence = CodeGeneratorBasic.operatorPrecedence, operators = CodeGeneratorBasic.operators;
        let value;
        if (node.left) {
            value = this.parseNode(node.left);
            const p = precedence[node.type], pl = CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(node.left);
            if (pl !== undefined && pl < p) {
                value = "(" + value + ")";
            }
            const right = node.right;
            let value2 = this.parseNode(right);
            const pr = CodeGeneratorBasic.getLeftOrRightOperatorPrecedence(right);
            if (pr !== undefined) {
                if (pr < p) {
                    // Lower precedence on right: always needs parentheses
                    value2 = "(" + value2 + ")";
                }
                else if (pr === p) {
                    // Equal precedence: check associativity
                    const assoc = CodeGeneratorBasic.operatorAssociativity[node.type];
                    if (assoc === "right") {
                        // Right-associative: no parentheses needed for equal precedence
                        // e.g., 2^3^4 = 2^(3^4)
                    }
                    else if (assoc === "left") {
                        // Left-associative: parentheses needed for non-commutative operators
                        // Commutative operators: + and * (associativity handles it)
                        // Non-commutative: - / \ mod (must preserve grouping)
                        // eslint-disable-next-line max-depth
                        if ((/(^|-|\/|\\|mod|=|<>|<|<=|>|>=)$/).test(node.type)) {
                            value2 = "(" + value2 + ")";
                        }
                    }
                    else {
                        // "none" (comparison operators): always keep parentheses
                        value2 = "(" + value2 + ")";
                    }
                }
            }
            const operator = CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase();
            if ((/^(and|or|xor|mod)$/).test(node.type)) {
                value += CodeGeneratorBasic.fnSpace1(operator) + CodeGeneratorBasic.fnSpace1(value2);
            }
            else {
                value += operator + value2;
            }
        }
        else if (node.right) { // unary operator, e.g. not, '#'
            if (node.len === 0) {
                value = ""; // ignore dummy token, e.g. '#'
            }
            else {
                const right = node.right;
                value = this.parseNode(right);
                let pr;
                if (right.left) { // was binary op?
                    pr = precedence[right.type] || 0; // no special prio
                }
                else {
                    pr = precedence["p" + right.type] || precedence[right.type] || 0; // check unary operator first
                }
                const p = precedence["p" + node.type] || precedence[node.type] || 0; // check unary operator first
                if (p && pr && (pr < p)) {
                    value = "(" + value + ")";
                }
                value = CodeGeneratorBasic.fnWs(node) + operators[node.type].toUpperCase() + (node.type === "not" ? CodeGeneratorBasic.fnSpace1(value) : value);
            }
        }
        else { // no operator, e.g. "=" in "for"
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
        if (CodeGeneratorBasic.operators[type]) {
            value = this.parseOperator(node);
        }
        else if (this.parseFunctions[type]) { // function with special handling?
            value = this.parseFunctions[type].call(this, node);
        }
        else { // for other functions, generate code directly
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
            if ((line !== undefined) && (line !== "")) {
                if (line !== null) {
                    if (output.length === 0) {
                        output = line;
                    }
                    else {
                        output += line;
                    }
                }
                else {
                    output = ""; // cls (clear output when node is set to null)
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
CodeGeneratorBasic.combinedKeywords = {
    chainMerge: "CHAIN", // "CHAIN MERGE"
    clearInput: "CLEAR", // "CLEAR INPUT"
    graphicsPaper: "GRAPHICS", // "GRAPHICS PAPER"
    graphicsPen: "GRAPHICS", // "GRAPHICS PEN"
    keyDef: "KEY", // "KEY DEF"
    lineInput: "LINE", // "LINE INPUT"
    mid$Assign: "MID$",
    onBreakCont: "ON", // ""ON BREAK CONT"
    onBreakGosub: "ON", // ""ON BREAK GOSUB"
    onBreakStop: "ON", // ""ON BREAK STOP"
    onErrorGoto: "ON", // "ON ERROR GOTO"
    resumeNext: "RESUME", // "RESUME NEXT"
    speedInk: "SPEED", // "SPEED INK"
    speedKey: "SPEED", // "SPEED KEY"
    speedWrite: "SPEED", // "SPEED WRITE"
    symbolAfter: "SYMBOL", // "SYMBOL AFTER"
    windowSwap: "WINDOW" // "WINDOW SWAP"
};
CodeGeneratorBasic.operators = {
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
CodeGeneratorBasic.operatorPrecedence = {
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
};
CodeGeneratorBasic.operatorAssociativity = {
    "^": "right", // right-associative
    "*": "left", // left-associative (commutative, so parens not needed for equal precedence)
    "+": "left", // left-associative (commutative, so parens not needed for equal precedence)
    "/": "left", // left-associative (non-commutative, so parens ARE needed for equal precedence)
    "\\": "left", // left-associative (non-commutative, so parens ARE needed)
    mod: "left", // left-associative (non-commutative)
    "-": "left", // left-associative (non-commutative, so parens ARE needed for equal precedence)
    "=": "none", // comparison operators are non-associative
    "<>": "none",
    "<": "none",
    "<=": "none",
    ">": "none",
    ">=": "none",
    and: "left",
    or: "left",
    xor: "left"
};
//# sourceMappingURL=CodeGeneratorBasic.js.map