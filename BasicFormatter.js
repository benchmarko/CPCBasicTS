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
            this.label = ""; // current label (line) for error messages
            this.options = {
                implicitLines: false
            };
            this.setOptions(options);
        }
        BasicFormatter.prototype.getOptions = function () {
            return this.options;
        };
        BasicFormatter.prototype.setOptions = function (options) {
            Object.assign(this.options, options);
        };
        BasicFormatter.prototype.composeError = function (error, message, value, pos, len) {
            return Utils_1.Utils.composeError("BasicFormatter", error, message, value, pos, len, this.label);
        };
        // renumber
        BasicFormatter.fnHasLabel = function (label) {
            return label !== "";
        };
        BasicFormatter.prototype.fnCreateLabelEntry = function (node, lastLine, implicitLines) {
            var origLen = (node.orig || node.value).length;
            if (!BasicFormatter.fnHasLabel(node.value) && implicitLines) {
                node.value = String(lastLine + 1); // generate label
            }
            var label = node.value;
            this.label = label; // for error messages
            if (BasicFormatter.fnHasLabel(label)) {
                var line = Number(label);
                if (line < 1 || line > 65535) {
                    throw this.composeError(Error(), "Line number overflow", label, node.pos, node.len);
                }
                if (line <= lastLine) {
                    throw this.composeError(Error(), "Expected increasing line number", label, node.pos, node.len);
                }
            }
            var labelEntry = {
                value: label,
                pos: node.pos,
                len: origLen,
                refCount: 0
            };
            return labelEntry;
        };
        BasicFormatter.prototype.fnCreateLabelMap = function (nodes, implicitLines) {
            var lines = {}; // line numbers
            var lastLine = 0;
            for (var i = 0; i < nodes.length; i += 1) {
                var node = nodes[i];
                if (node.type === "label") {
                    var labelEntry = this.fnCreateLabelEntry(node, lastLine, implicitLines);
                    lines[labelEntry.value] = labelEntry;
                    lastLine = Number(labelEntry.value);
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
                    var linesEntry = lines[node.value];
                    if (linesEntry.refCount === undefined) { // not needed for renum but for removing line numbers
                        linesEntry.refCount = 1;
                    }
                    else {
                        linesEntry.refCount += 1;
                    }
                }
                else {
                    throw this.composeError(Error(), "Line does not exist", node.value, node.pos);
                }
            }
        };
        BasicFormatter.prototype.fnAddReferencesForNode = function (node, lines, refs) {
            if (node.type === "label") {
                this.label = node.value;
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
        };
        BasicFormatter.prototype.fnAddReferences = function (nodes, lines, refs) {
            for (var i = 0; i < nodes.length; i += 1) {
                this.fnAddReferencesForNode(nodes[i], lines, refs);
            }
        };
        BasicFormatter.prototype.fnRenumberLines = function (lines, refs, newLine, oldLine, step, keep) {
            var changes = {}, keys = Object.keys(lines);
            function fnSortbyPosition(a, b) {
                return lines[a].pos - lines[b].pos;
            }
            keys.sort(fnSortbyPosition);
            for (var i = 0; i < keys.length; i += 1) {
                var lineEntry = lines[keys[i]], hasLabel = BasicFormatter.fnHasLabel(lineEntry.value), line = Number(lineEntry.value);
                if (!hasLabel || (line >= oldLine && line < keep)) {
                    if (newLine > 65535) {
                        throw this.composeError(Error(), "Line number overflow", lineEntry.value, lineEntry.pos);
                    }
                    lineEntry.newValue = String(newLine);
                    changes[lineEntry.pos] = lineEntry;
                    newLine += step;
                }
            }
            for (var i = 0; i < refs.length; i += 1) {
                var ref = refs[i], lineString = ref.value, line = Number(lineString);
                if (line >= oldLine && line < keep) {
                    if (lineString !== lines[lineString].newValue) {
                        ref.newValue = lines[lineString].newValue;
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
                input = input.substring(0, line.pos) + line.newValue + input.substring(line.pos + line.len);
            }
            return input;
        };
        BasicFormatter.prototype.fnRenumber = function (input, parseTree, newLine, oldLine, step, keep) {
            var refs = [], // references
            lines = this.fnCreateLabelMap(parseTree, Boolean(this.options.implicitLines));
            this.fnAddReferences(parseTree, lines, refs); // create reference list
            var changes = this.fnRenumberLines(lines, refs, newLine, oldLine, step, keep), output = BasicFormatter.fnApplyChanges(input, changes);
            return output;
        };
        BasicFormatter.prototype.renumber = function (input, newLine, oldLine, step, keep) {
            var out = {
                text: ""
            };
            this.label = ""; // current line (label)
            try {
                var tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.fnRenumber(input, parseTree, newLine, oldLine, step, keep || 65535);
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
        // ---
        BasicFormatter.prototype.fnRemoveUnusedLines = function (input, parseTree) {
            var refs = [], // references
            implicitLines = true, lines = this.fnCreateLabelMap(parseTree, implicitLines);
            this.fnAddReferences(parseTree, lines, refs); // create reference list
            // reference count would be enough
            var changes = {}, keys = Object.keys(lines);
            for (var i = 0; i < keys.length; i += 1) {
                var lineEntry = lines[keys[i]];
                if (lineEntry.len && !lineEntry.refCount) { // non-empty label without references?
                    lineEntry.newValue = ""; // set empty line number
                    if (input[lineEntry.pos + lineEntry.len] === " ") { // space following line number?
                        lineEntry.len += 1; // remove it as well
                    }
                    changes[lineEntry.pos] = lineEntry;
                }
            }
            var output = BasicFormatter.fnApplyChanges(input, changes);
            return output;
        };
        BasicFormatter.prototype.removeUnusedLines = function (input) {
            var out = {
                text: ""
            };
            this.label = ""; // current line (label)
            try {
                var tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.fnRemoveUnusedLines(input, parseTree);
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