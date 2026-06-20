// BasicFormatter.ts - Format BASIC source
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//
import { Utils } from "./Utils";
export class BasicFormatter {
    constructor(options) {
        this.label = ""; // current label (line) for error messages
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
            node.value = String(lastLine + 1); // generate label
        }
        const label = node.value;
        this.label = label; // for error messages
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
            len: origLen, // original length
            refCount: 0
        };
        return labelEntry;
    }
    fnCreateLabelMap(nodes, implicitLines) {
        const lines = {}; // line numbers
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
    }
    fnAddReferencesForNode(node, lines, refs) {
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
            if (!hasLabel || (line >= oldLine && line < keep)) {
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
        // apply changes to input in reverse order
        for (let i = keys.length - 1; i >= 0; i -= 1) {
            const line = changes[keys[i]];
            input = input.substring(0, line.pos) + line.newValue + input.substring(line.pos + line.len);
        }
        return input;
    }
    fnRenumber(input, parseTree, newLine, oldLine, step, keep) {
        const refs = [], // references
        lines = this.fnCreateLabelMap(parseTree, Boolean(this.options.implicitLines));
        this.fnAddReferences(parseTree, lines, refs); // create reference list
        const changes = this.fnRenumberLines(lines, refs, newLine, oldLine, step, keep), output = BasicFormatter.fnApplyChanges(input, changes);
        return output;
    }
    renumber(input, newLine, oldLine, step, keep) {
        const out = {
            text: ""
        };
        this.label = ""; // current line (label)
        try {
            const tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.fnRenumber(input, parseTree, newLine, oldLine, step, keep || 65535);
            out.text = output;
        }
        catch (e) {
            if (Utils.isCustomError(e)) {
                out.error = e;
            }
            else { // other errors
                out.error = e; // force set other error
                Utils.console.error(e);
            }
        }
        return out;
    }
    // ---
    fnRemoveUnusedLines(input, parseTree) {
        const refs = [], // references
        implicitLines = true, lines = this.fnCreateLabelMap(parseTree, implicitLines);
        this.fnAddReferences(parseTree, lines, refs); // create reference list
        // reference count would be enough
        const changes = {}, keys = Object.keys(lines);
        for (let i = 0; i < keys.length; i += 1) {
            const lineEntry = lines[keys[i]];
            if (lineEntry.len && !lineEntry.refCount) { // non-empty label without references?
                lineEntry.newValue = ""; // set empty line number
                if (input[lineEntry.pos + lineEntry.len] === " ") { // space following line number?
                    lineEntry.len += 1; // remove it as well
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
        this.label = ""; // current line (label)
        try {
            const tokens = this.options.lexer.lex(input), parseTree = this.options.parser.parse(tokens), output = this.fnRemoveUnusedLines(input, parseTree);
            out.text = output;
        }
        catch (e) {
            if (Utils.isCustomError(e)) {
                out.error = e;
            }
            else { // other errors
                out.error = e; // force set other error
                Utils.console.error(e);
            }
        }
        return out;
    }
}
//# sourceMappingURL=BasicFormatter.js.map