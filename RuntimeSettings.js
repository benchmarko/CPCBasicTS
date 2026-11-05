export class RuntimeSettings {
    constructor(options) {
        this.options = options;
    }
    setImplicitLines(value) {
        var _a;
        this.options.codeGeneratorJs.setOptions({ implicitLines: value });
        (_a = this.options.getCodeGeneratorToken()) === null || _a === void 0 ? void 0 : _a.setOptions({ implicitLines: value });
    }
    setIntegerOverflow(value) {
        this.options.codeGeneratorJs.setOptions({ integerOverflow: value });
    }
    setTrace(value) {
        this.options.codeGeneratorJs.setOptions({ trace: value });
    }
    setPrettyLowercaseVars(value) {
        this.options.getCodeGeneratorBasic().setOptions({ lowercaseVars: value });
    }
    setArrayBounds(value) {
        var _a, _b;
        const variables = this.options.variables;
        variables.setOptions({ arrayBounds: value });
        this.options.vm.vmGoto(0);
        this.options.vm.vmStop("end", 0, true);
        if (Object.keys(variables.getAllVariables()).length) {
            variables.removeAllVariables();
            (_b = (_a = this.options).onVariablesCleared) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
    }
    static getLoopDelay(speed) {
        return 1000 - speed * 10;
    }
}
//# sourceMappingURL=RuntimeSettings.js.map