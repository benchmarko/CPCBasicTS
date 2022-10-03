// BasicFormatter.ts - Format BASIC source
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils, CustomError } from "./Utils";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser";
import { IOutput } from "./Interfaces";

interface BasicFormatterOptions {
	lexer: BasicLexer
	parser: BasicParser
}

interface LineEntry {
	value: string,
	pos: number,
	len: number,
	lineLen?: number,
	newLine?: number
}

type LinesType = Record<string, LineEntry>;

type ChangesType = Record<number, LineEntry>;

export class BasicFormatter {
	private readonly lexer: BasicLexer;
	private readonly parser: BasicParser;
	private line = ""; // current line (label) for error messages

	constructor(options: BasicFormatterOptions) {
		this.lexer = options.lexer;
		this.parser = options.parser;
	}

	private composeError(error: Error, message: string, value: string, pos: number, len?: number) {
		return Utils.composeError("BasicFormatter", error, message, value, pos, len, this.line);
	}

	// renumber

	private static fnIsDirect(label: string) {
		return label === "";
	}

	private fnCreateLabelEntry(node: ParserNode, lastLine: number) { // create line numbers map
		const label = node.value,
			isDirect = BasicFormatter.fnIsDirect(label),
			line = Number(label);

		this.line = label;
		if (!isDirect) {
			if (line <= lastLine) {
				throw this.composeError(Error(), "Expected increasing line number", label, node.pos, node.len);
			}
			if (line < 1 || line > 65535) {
				throw this.composeError(Error(), "Line number overflow", label, node.pos, node.len);
			}
		}

		const labelEntry: LineEntry = {
			value: label,
			pos: node.pos,
			len: (node.orig || label).length
		};

		return labelEntry;
	}

	private fnCreateLabelMap(nodes: ParserNode[]) { // create line numbers map
		const lines: LinesType = {}; // line numbers
		let lastLine = -1;

		for (let i = 0; i < nodes.length; i += 1) {
			const node = nodes[i];

			if (node.type === "label") {
				const labelEntry = this.fnCreateLabelEntry(node, lastLine);

				if (labelEntry) {
					lines[labelEntry.value] = labelEntry;
					lastLine = Number(labelEntry.value);
				}
			}
		}
		return lines;
	}

	private fnAddSingleReference(node: ParserNode, lines: LinesType, refs: LineEntry[]) {
		if (node.type === "linenumber") {
			if (node.value in lines) {
				refs.push({
					value: node.value,
					pos: node.pos,
					len: (node.orig || node.value).length
				});
			} else {
				throw this.composeError(Error(), "Line does not exist", node.value, node.pos);
			}
		}
	}

	private fnAddReferencesForNode(node: ParserNode, lines: LinesType, refs: LineEntry[]) {
		if (node.type === "label") {
			this.line = node.value;
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
			if (node.type === "onErrorGoto" && node.args.length === 1 && node.args[0].value === "0") {
				// ignore "on error goto 0"
			} else {
				this.fnAddReferences(node.args, lines, refs); // recursive
			}
		}
		if (node.args2) { // for "ELSE"
			this.fnAddReferences(node.args2, lines, refs); // recursive
		}
	}

	private fnAddReferences(nodes: ParserNode[], lines: LinesType, refs: LineEntry[]) {
		for (let i = 0; i < nodes.length; i += 1) {
			this.fnAddReferencesForNode(nodes[i], lines, refs);
		}
	}

	private fnRenumberLines(lines: LinesType, refs: LineEntry[], newLine: number, oldLine: number, step: number, keep: number) {
		const changes: ChangesType = {},
			keys = Object.keys(lines);

		function fnSortbyPosition(a: string, b: string) {
			return lines[a].pos - lines[b].pos;
		}

		keys.sort(fnSortbyPosition);

		for (let i = 0; i < keys.length; i += 1) {
			const lineEntry = lines[keys[i]],
				isDirect = BasicFormatter.fnIsDirect(lineEntry.value),
				line = Number(lineEntry.value);

			if (isDirect || (line >= oldLine && line < keep)) {
				if (newLine > 65535) {
					throw this.composeError(Error(), "Line number overflow", lineEntry.value, lineEntry.pos);
				}
				lineEntry.newLine = newLine;
				changes[lineEntry.pos] = lineEntry;
				newLine += step;
			}
		}

		for (let i = 0; i < refs.length; i += 1) {
			const ref = refs[i],
				lineString = ref.value,
				line = Number(lineString);

			if (line >= oldLine && line < keep) {
				if (line !== lines[lineString].newLine) {
					ref.newLine = lines[lineString].newLine;
					changes[ref.pos] = ref;
				}
			}
		}
		return changes;
	}

	private static fnSortNumbers(a: number, b: number) {
		return a - b;
	}

	private static fnApplyChanges(input: string, changes: ChangesType) {
		const keys = Object.keys(changes).map(Number);

		keys.sort(BasicFormatter.fnSortNumbers);

		// apply changes to input in reverse order
		for (let i = keys.length - 1; i >= 0; i -= 1) {
			const line = changes[keys[i]];

			input = input.substring(0, line.pos) + line.newLine + input.substring(line.pos + line.len);
		}
		return input;
	}

	private fnRenumber(input: string, parseTree: ParserNode[], newLine: number, oldLine: number, step: number, keep: number) {
		const refs: LineEntry[] = [], // references
			lines = this.fnCreateLabelMap(parseTree);

		this.fnAddReferences(parseTree, lines, refs); // create reference list

		const changes = this.fnRenumberLines(lines, refs, newLine, oldLine, step, keep),
			output = BasicFormatter.fnApplyChanges(input, changes);

		return output;
	}

	renumber(input: string, newLine: number, oldLine: number, step: number, keep: number): IOutput {
		const out: IOutput = {
			text: ""
		};

		this.line = ""; // current line (label)
		try {
			const tokens = this.lexer.lex(input),
				parseTree = this.parser.parse(tokens),
				output = this.fnRenumber(input, parseTree, newLine, oldLine, step, keep || 65535);

			out.text = output;
		} catch (e) {
			if (Utils.isCustomError(e)) {
				out.error = e;
			} else { // other errors
				out.error = e as CustomError; // force set other error
				Utils.console.error(e);
			}
		}
		return out;
	}
}
