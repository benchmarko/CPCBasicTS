import type { CustomError, IOutput } from "../Interfaces";
import { ProgramCompiler } from "../ProgramCompiler";
import { Variables } from "../Variables";

function createCompiler() {
	const events: string[] = [],
		errors: unknown[] = [],
		variables = new Variables({}),
		sourceMap = { "10": [0, 5] },
		state = { output: { text: "compiled" } as IOutput, tokens: "tokens", memoryError: undefined as Error | undefined };
	let receivedVariables: Variables | undefined,
		receivedMap: Record<string, number[]> | undefined;
	const compiler = new ProgramCompiler({
		generator: {
			generateProgram: (input, passedVariables) => {
				events.push("compile:" + input);
				receivedVariables = passedVariables;
				return state.output;
			},
			getSourceMap: () => sourceMap
		},
		vm: {
			vmSetSourceMap: (map) => { events.push("map"); receivedMap = map; },
			vmPutProgramInMem: (tokens) => {
				events.push("memory:" + tokens);
				if (state.memoryError) { throw state.memoryError; }
				return tokens.length;
			}
		},
		encodeTokens: (input) => { events.push("tokens:" + input); return state.tokens; },
		onTokenized: (sourceLength, tokenLength) => { events.push("lengths:" + sourceLength + ":" + tokenLength); },
		onMemoryError: (error) => { errors.push(error); }
	});
	return {
		compiler, variables, sourceMap, state, events, errors,
		get receivedVariables() { return receivedVariables; },
		get receivedMap() { return receivedMap; }
	};
}

QUnit.module("ProgramCompiler", function () {
	QUnit.test("installs source maps and tokenized memory after compilation in order", function (assert) {
		const host = createCompiler(),
			output = host.compiler.compile("10 END", host.variables);
		assert.strictEqual(output, host.state.output);
		assert.strictEqual(host.receivedVariables, host.variables);
		assert.strictEqual(host.receivedMap, host.sourceMap);
		assert.deepEqual(host.events, ["compile:10 END", "map", "tokens:10 END", "lengths:6:6", "memory:tokens"]);
	});

	QUnit.test("compiler diagnostics bypass tokenization and VM writes", function (assert) {
		const host = createCompiler(),
			error = new Error("compile failure") as CustomError;
		host.state.output = { text: "", error };
		assert.strictEqual(host.compiler.compile("invalid", host.variables).error, error);
		assert.deepEqual(host.events, ["compile:invalid"]);
		assert.deepEqual(host.errors, []);
	});

	QUnit.test("memory failures are reported without replacing successful compiler output", function (assert) {
		const host = createCompiler(),
			error = new Error("memory failure");
		host.state.memoryError = error;
		assert.strictEqual(host.compiler.compile("10 END", host.variables), host.state.output);
		assert.deepEqual(host.errors, [error]);
	});

	QUnit.test("empty token output retains the existing program-memory call", function (assert) {
		const host = createCompiler();
		host.state.tokens = "";
		host.compiler.compile("", host.variables);
		assert.deepEqual(host.events, ["compile:", "map", "tokens:", "lengths:0:0", "memory:"]);
	});
});