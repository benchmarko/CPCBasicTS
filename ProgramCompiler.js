export class ProgramCompiler {
    constructor(options) {
        this.options = options;
    }
    compile(input, variables) {
        var _a;
        const options = this.options, output = options.generator.generateProgram(input, variables);
        if (output.error) {
            return output;
        }
        options.vm.vmSetSourceMap(options.generator.getSourceMap());
        const tokens = options.encodeTokens(input);
        (_a = options.onTokenized) === null || _a === void 0 ? void 0 : _a.call(options, input.length, tokens.length);
        try {
            options.vm.vmPutProgramInMem(tokens);
        }
        catch (error) {
            options.onMemoryError(error);
        }
        return output;
    }
}
//# sourceMappingURL=ProgramCompiler.js.map