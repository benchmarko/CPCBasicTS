import { BasicLexer } from "../BasicLexer";
import { BasicParser } from "../BasicParser";
import { CodeGeneratorBasic } from "../CodeGeneratorBasic";
import { CodeGeneratorJs } from "../CodeGeneratorJs";
import { CodeGeneratorToken } from "../CodeGeneratorToken";
import { Variables } from "../Variables";
import { RuntimeSettings } from "../RuntimeSettings";
function createSettings() {
    const parser = new BasicParser({ quiet: true }), lexer = new BasicLexer({ keywords: parser.getKeywords(), quiet: true }), codeGeneratorJs = new CodeGeneratorJs({ lexer, parser, quiet: true }), codeGeneratorToken = new CodeGeneratorToken({ lexer, parser, quiet: true }), variables = new Variables({}), calls = [];
    const settings = new RuntimeSettings({
        codeGeneratorJs,
        variables,
        vm: {
            vmGoto: (line) => { calls.push(["goto", line]); },
            vmStop: (reason, priority, force) => { calls.push(["stop", reason, priority, force]); }
        },
        getCodeGeneratorBasic: () => new CodeGeneratorBasic({ lexer, parser }),
        getCodeGeneratorToken: () => codeGeneratorToken,
        onVariablesCleared: () => { calls.push(["variablesCleared"]); }
    });
    return { settings, codeGeneratorJs, codeGeneratorToken, variables, calls };
}
QUnit.module("RuntimeSettings", function () {
    QUnit.test("compiler settings update existing generators", function (assert) {
        const host = createSettings();
        host.settings.setImplicitLines(true);
        host.settings.setIntegerOverflow(true);
        host.settings.setTrace(true);
        host.settings.setPrettyLowercaseVars(true);
        assert.strictEqual(host.codeGeneratorJs.getOptions().implicitLines, true);
        assert.strictEqual(host.codeGeneratorJs.getOptions().integerOverflow, true);
        assert.strictEqual(host.codeGeneratorJs.getOptions().trace, true);
        assert.strictEqual(host.codeGeneratorToken.getOptions().implicitLines, true);
    });
    QUnit.test("array bounds reset the current line and refresh variables only when cleared", function (assert) {
        const host = createSettings();
        host.variables.setVariable("valueR", 7);
        host.settings.setArrayBounds(true);
        assert.strictEqual(host.variables.getOptions().arrayBounds, true);
        assert.deepEqual(host.calls, [["goto", 0], ["stop", "end", 0, true], ["variablesCleared"]]);
        assert.deepEqual(host.variables.getAllVariableNames(), []);
        host.calls.length = 0;
        host.settings.setArrayBounds(false);
        assert.strictEqual(host.variables.getOptions().arrayBounds, false);
        assert.deepEqual(host.calls, [["goto", 0], ["stop", "end", 0, true]]);
    });
    QUnit.test("speed preserves the controller delay formula", function (assert) {
        assert.strictEqual(RuntimeSettings.getLoopDelay(100), 0);
        assert.strictEqual(RuntimeSettings.getLoopDelay(50), 500);
        assert.strictEqual(RuntimeSettings.getLoopDelay(120), -200);
    });
});
//# sourceMappingURL=RuntimeSettings.qunit.js.map