// BasicFormatter.ts - Format BASIC source
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BasicFormatter = void 0;
    var BasicFormatter = /** @class */ (function () {
        function BasicFormatter(options) {
            this.line = ""; // current line (label) for error messages
            this.lexer = options.lexer;
            this.parser = options.parser;
        }
        BasicFormatter.prototype.composeError = function (error, message, value, pos) {
            return Utils_1.Utils.composeError("BasicFormatter", error, message, value, pos, undefined, this.line);
        };
        // renumber
        BasicFormatter.prototype.fnCreateLineNumbersMap = function (nodes) {
            var lines = {}; // line numbers
            var lastLine = -1;
            for (var i = 0; i < nodes.length; i += 1) {
                var node = nodes[i];
                if (node.type === "label") {
                    var lineString = node.value, line = Number(lineString);
                    this.line = lineString;
                    if (lineString in lines) {
                        throw this.composeError(Error(), "Duplicate line number", lineString, node.pos);
                    }
                    if (line <= lastLine) {
                        throw this.composeError(Error(), "Line number not increasing", lineString, node.pos);
                    }
                    if (line < 1 || line > 65535) {
                        throw this.composeError(Error(), "Line number overflow", lineString, node.pos);
                    }
                    lines[lineString] = {
                        value: lineString,
                        pos: node.pos,
                        len: (node.orig || lineString).length
                    };
                    lastLine = line;
                }
            }
            return lines;
        };
        BasicFormatter.prototype.fnAddSingleReference = function (node, lines, refs) {
            if (node.type === "linenumber") {
                if (node.value in lines) {
                    refs.push({
                        value: node.value,
                        pos: node.pos,
                        len: (node.orig || node.value).length
                    });
                }
                else {
                    throw this.composeError(Error(), "Line does not exist", node.value, node.pos);
                }
            }
        };
        BasicFormatter.prototype.fnAddReferences = function (nodes, lines, refs) {
            for (var i = 0; i < nodes.length; i += 1) {
                var node = nodes[i];
                if (node.type === "label") {
                    this.line = node.value;
                }
                else {
                    this.fnAddSingleReference(node, lines, refs);
                }
                if (node.left) {
                    this.fnAddSingleReference(node.left, lines, refs);
                }
                if (node.right) {
                    this.fnAddSingleReference(node.right, lines, refs);
                }
                if (node.args) {
                    if (node.type === "onErrorGoto" && node.args.length === 1 && node.args[0].value === "0") {
                        // ignore "on error goto 0"
                    }
                    else {
                        this.fnAddReferences(node.args, lines, refs); // recursive
                    }
                }
                if (node.args2) { // for "ELSE"
                    this.fnAddReferences(node.args2, lines, refs); // recursive
                }
            }
        };
        BasicFormatter.prototype.fnRenumberLines = function (lines, refs, newLine, oldLine, step, keep) {
            var changes = {}, keys = Object.keys(lines);
            for (var i = 0; i < keys.length; i += 1) {
                var lineEntry = lines[keys[i]], line = Number(lineEntry.value);
                if (line >= oldLine && line < keep) {
                    if (newLine > 65535) {
                        throw this.composeError(Error(), "Line number overflow", lineEntry.value, lineEntry.pos);
                    }
                    lineEntry.newLine = newLine;
                    changes[lineEntry.pos] = lineEntry;
                    newLine += step;
                }
            }
            for (var i = 0; i < refs.length; i += 1) {
                var ref = refs[i], lineString = ref.value, line = Number(lineString);
                if (line >= oldLine && line < keep) {
                    if (line !== lines[lineString].newLine) {
                        ref.newLine = lines[lineString].newLine;
                        changes[ref.pos] = ref;
                    }
                }
            }
            return changes;
        };
        BasicFormatter.fnSortNumbers = function (a, b) {
            return a - b;
        };
        BasicFormatter.fnApplyChanges = function (input, changes) {
            var keys = Object.keys(changes).map(Number);
            keys.sort(BasicFormatter.fnSortNumbers);
            // apply changes to input in reverse order
            for (var i = keys.length - 1; i >= 0; i -= 1) {
                var line = changes[keys[i]];
                input = input.substring(0, line.pos) + line.newLine + input.substr(line.pos + line.len);
            }
            return input;
        };
        BasicFormatter.prototype.fnRenumber = function (input, parseTree, newLine, oldLine, step, keep) {
            var refs = [], // references
            lines = this.fnCreateLineNumbersMap(parseTree);
            this.fnAddReferences(parseTree, lines, refs); // create reference list
            var changes = this.fnRenumberLines(lines, refs, newLine, oldLine, step, keep), output = BasicFormatter.fnApplyChanges(input, changes);
            return output;
        };
        BasicFormatter.prototype.renumber = function (input, newLine, oldLine, step, keep) {
            var out = {
                text: ""
            };
            this.line = ""; // current line (label)
            try {
                var tokens = this.lexer.lex(input), parseTree = this.parser.parse(tokens), output = this.fnRenumber(input, parseTree, newLine, oldLine, step, keep || 65535);
                out.text = output;
            }
            catch (e) {
                if (Utils_1.Utils.isCustomError(e)) {
                    out.error = e;
                }
                else { // other errors
                    out.error = e; // force set other error
                    Utils_1.Utils.console.error(e);
                }
            }
            return out;
        };
        return BasicFormatter;
    }());
    exports.BasicFormatter = BasicFormatter;
});
//# sourceMappingURL=BasicFormatter.js.map