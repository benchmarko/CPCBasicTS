// BasicFormatter.ts - Format BASIC source
// (c) Marco Vieth, 2020
// https://benchmarko.github.io/CPCBasicTS/
//
//

import { Utils } from "./Utils";
import type { CustomError, IOutput } from "./Interfaces";
import { BasicLexer } from "./BasicLexer";
import { BasicParser, ParserNode } from "./BasicParser";

interface BasicFormatterOptions {
	lexer: BasicLexer
	parser: BasicParser
	implicitLines?: boolean
}

interface LineEntry {
	value: string,
	pos: number,
	len: number,
	refCount: number
	newValue?: string
}

type RefsEntry = Omit<LineEntry, "refCount">;

type LinesType = Record<string, LineEntry>;

type ChangesType = Record<number, RefsEntry>;

export class BasicFormatter {
	static parseLineNumber(line: string): number {
		return parseInt(line, 10); // we do not check for linenumber in range 0...65535
	}

	static addLineNumbers(input: string): string {
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

	static splitLines(input: string, implicitLines = false): string[] | undefined {
		if (implicitLines) {
			input = BasicFormatter.addLineNumbers(input);
		}
		const parts = input.split(/^(\s*\d+)/m),
			lines: string[] = [];
		if (parts[0] === "") {
			parts.shift();
		}
		if (parts.length % 2 !== 0) {
			return undefined;
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

	static mergeLines(lines1: readonly string[], lines2: readonly string[]): string {
		const result: string[] = [];
		let index1 = 0,
			index2 = 0;
		while (index1 < lines1.length && index2 < lines2.length) {
			const line1 = lines1[index1],
				line2 = lines2[index2],
				number1 = parseInt(line1, 10),
				number2 = parseInt(line2, 10);
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

	static getLinesInRange(sourceLines: readonly string[], firstLine: number, lastLine: number): string[] {
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

	static getLinesInRangeFromScript(
		script: string,
		firstLine: number,
		lastLine: number,
		implicitLines = false,
		onInvalid?: () => void
	): string[] {
		const lines = script ? BasicFormatter.splitLines(script, implicitLines) : [];
		if (!lines) {
			onInvalid?.();
			return [];
		}
		return BasicFormatter.getLinesInRange(lines, firstLine, lastLine);
	}

	static mergeScripts(
		script1: string,
		script2: string,
		implicitLines = false,
		onInvalid?: () => void
	): string {
		const split = (script: string): string[] => {
			const lines = BasicFormatter.splitLines(Utils.stringTrimEnd(script), implicitLines);
			if (!lines) {
				onInvalid?.();
				return [];
			}
			return lines;
		};
		return BasicFormatter.mergeLines(split(script1), split(script2));
	}

	static formatListing(lines: readonly string[], stream: number): string[] {
		return lines.map((line) => stream === 9 ? line : Utils.escapeControlCharacters(line));
	}

	static createDeleteScript(lines: readonly string[]): string | undefined {
		const numbers: string[] = [];
		for (const line of lines) {
			const number = parseInt(line, 10);
			if (isNaN(number)) {
				return undefined;
			}
			numbers.push(String(number));
		}
		return numbers.join("\n");
	}

	private readonly options: BasicFormatterOptions;

	private label = ""; // current label (line) for error messages

	constructor(options: BasicFormatterOptions) {
		this.options = {
			implicitLines: false
		} as BasicFormatterOptions;
		this.setOptions(options);
	}

	getOptions(): BasicFormatterOptions {
		return this.options;
	}

	setOptions(options: Partial<BasicFormatterOptions>): void {
		Object.assign(this.options, options);
	}

	private composeError(error: Error, message: string, value: string, pos: number, len?: number) {
		return Utils.composeError("BasicFormatter", error, message, value, pos, len, this.label);
	}

	// renumber

	private static fnHasLabel(label: string) {
		return label !== "";
	}

	private fnCreateLabelEntry(node: ParserNode, lastLine: number, implicitLines: boolean) { // create line numbers map
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

		const labelEntry: LineEntry = {
			value: label,
			pos: node.pos,
			len: origLen, // original length
			refCount: 0
		};

		return labelEntry;
	}

	private fnCreateLabelMap(nodes: ParserNode[], implicitLines: boolean) { // create line numbers map
		const lines: LinesType = {}; // line numbers
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

	private fnAddSingleReference(node: ParserNode, lines: LinesType, refs: RefsEntry[]) {
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
				} else {
					linesEntry.refCount += 1;
				}
			} else {
				throw this.composeError(Error(), "Line does not exist", node.value, node.pos);
			}
		}
	}

	private fnAddReferencesForNode(node: ParserNode, lines: LinesType, refs: RefsEntry[]) {
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
			if (node.type === "onErrorGoto" && node.args.length === 1 && node.args[0].value === "0") {
				// ignore "on error goto 0"
			} else {
				this.fnAddReferences(node.args, lines, refs); // recursive
			}
		}
	}

	private fnAddReferences(nodes: ParserNode[], lines: LinesType, refs: RefsEntry[]) {
		for (let i = 0; i < nodes.length; i += 1) {
			this.fnAddReferencesForNode(nodes[i], lines, refs);
		}
	}

	private fnRenumberLines(lines: LinesType, refs: RefsEntry[], newLine: number, oldLine: number, step: number, keep: number) {
		const changes: ChangesType = {},
			keys = Object.keys(lines);

		function fnSortbyPosition(a: string, b: string) {
			return lines[a].pos - lines[b].pos;
		}

		keys.sort(fnSortbyPosition);

		for (let i = 0; i < keys.length; i += 1) {
			const lineEntry = lines[keys[i]],
				hasLabel = BasicFormatter.fnHasLabel(lineEntry.value),
				line = Number(lineEntry.value);

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
			const ref = refs[i],
				lineString = ref.value,
				line = Number(lineString);

			if (line >= oldLine && line < keep) {
				if (lineString !== lines[lineString].newValue) {
					ref.newValue = lines[lineString].newValue;
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

			input = input.substring(0, line.pos) + line.newValue + input.substring(line.pos + line.len);
		}
		return input;
	}

	private fnRenumber(input: string, parseTree: ParserNode[], newLine: number, oldLine: number, step: number, keep: number) {
		const refs: RefsEntry[] = [], // references
			lines = this.fnCreateLabelMap(parseTree, Boolean(this.options.implicitLines));

		this.fnAddReferences(parseTree, lines, refs); // create reference list

		const changes = this.fnRenumberLines(lines, refs, newLine, oldLine, step, keep),
			output = BasicFormatter.fnApplyChanges(input, changes);

		return output;
	}

	private prepareParser(): void {
		this.options.lexer.setOptions({ keepWhiteSpace: false });
		this.options.parser.setOptions({ keepBrackets: false, keepColons: false, keepDataComma: false, keepTokens: false });
	}

	renumber(input: string, newLine: number, oldLine: number, step: number, keep: number): IOutput {
		this.prepareParser();
		const out: IOutput = {
			text: ""
		};

		this.label = ""; // current line (label)
		try {
			const tokens = this.options.lexer.lex(input),
				parseTree = this.options.parser.parse(tokens),
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

	// ---


	private fnRemoveUnusedLines(input: string, parseTree: ParserNode[]) {
		const refs: RefsEntry[] = [], // references
			implicitLines = true,
			lines = this.fnCreateLabelMap(parseTree, implicitLines);

		this.fnAddReferences(parseTree, lines, refs); // create reference list
		// reference count would be enough

		const changes: ChangesType = {},
			keys = Object.keys(lines);

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

	removeUnusedLines(input: string): IOutput {
		this.prepareParser();
		const out: IOutput = {
			text: ""
		};

		this.label = ""; // current line (label)
		try {
			const tokens = this.options.lexer.lex(input),
				parseTree = this.options.parser.parse(tokens),
				output = this.fnRemoveUnusedLines(input, parseTree);

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
