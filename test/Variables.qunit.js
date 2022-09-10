// Variables.qunit.ts - QUnit tests for CPCBasic Variables
//
define(["require", "exports", "../Variables", "./TestHelper"], function (require, exports, Variables_1, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    QUnit.module("Variables", function ( /* hooks */) {
        QUnit.test("create class", function (assert) {
            var variables = new Variables_1.Variables();
            assert.ok(variables, "defined");
        });
        QUnit.test("variable types", function (assert) {
            var variables = new Variables_1.Variables();
            variables.setVarType("a1", "I");
            assert.strictEqual(variables.getVarType("a1"), "I", "a1: I");
            variables.setVarType("a2", "R");
            assert.strictEqual(variables.getVarType("a2"), "R", "a2: R");
            variables.setVarType("s1", "$");
            assert.strictEqual(variables.getVarType("s1"), "$", "s1: $");
            variables.setVarType("s$", "$");
            assert.strictEqual(variables.getVarType("s$"), "$", "s$: $");
            assert.propEqual(variables.getAllVarTypes(), {
                a1: "I",
                a2: "R",
                s1: "$",
                s$: "$"
            }, "getAll: a1:I a2:R s1:$ s$:$");
        });
        QUnit.test("plain variables: get and set", function (assert) {
            var variables = new Variables_1.Variables();
            assert.propEqual(variables.getAllVariables(), {}, "getAll:");
            assert.strictEqual(variables.getVariable("n1"), undefined, "get n1: undefined");
            variables.setVariable("a1", 11);
            assert.strictEqual(variables.getVariable("a1"), 11, "set a1,11; get a1: 11");
            variables.setVariable("s$", "12");
            assert.strictEqual(variables.getVariable("s$"), "12", 'set s$,"12"; get s$: "12"');
            assert.propEqual(variables.getAllVariables(), {
                a1: 11,
                s$: "12"
            }, 'getAll: a1:11 s$:"12"');
            assert.strictEqual(variables.variableExist("a1"), true, "exist a1: true");
            assert.strictEqual(variables.variableExist("s$"), true, "exist s$: true");
            assert.strictEqual(variables.variableExist("n1"), false, "exist n1: false");
            assert.strictEqual(variables.getVariableIndex("a1"), 0, "varIndex a1: 0");
            assert.strictEqual(variables.getVariableIndex("s$"), 1, "varIndex s$: 1");
            assert.strictEqual(variables.getVariableIndex("n1"), -1, "varIndex n1: -1");
            assert.strictEqual(variables.getVariableByIndex(0), 11, "getByIndex 0: 11");
            assert.strictEqual(variables.getVariableByIndex(1), "12", 'getByIndex 1: "12"');
            assert.strictEqual(variables.getVariableByIndex(2), undefined, "getByIndex 2: undefined");
            assert.propEqual(variables.getAllVariableNames(), ["a1", "s$"], "allNames: a1, s$"); // eslint-disable-line array-element-newline
            variables.initVariable("i1");
            assert.strictEqual(variables.getVariable("i1"), 0, "init i1; get i1: 0");
            variables.initVariable("i$");
            assert.strictEqual(variables.getVariable("i$"), "", 'init i$; get i$: ""');
            variables.initAllVariables();
            var allVars = variables.getAllVariables();
            assert.propEqual(variables.getAllVariables(), {
                a1: 0,
                s$: "",
                i1: 0,
                i$: ""
            }, 'initAll; getAll: a1:11 s$:"12"');
            variables.removeAllVariables();
            assert.propEqual(allVars, {}, 'removeAll; previous getAll:"');
            assert.propEqual(variables.getAllVariables(), {}, 'removeAll; getAll:"');
        });
        function createListOfItems(item, length) {
            var list = [];
            for (var i = 0; i < length; i += 1) {
                list.push(item);
            }
            return list;
        }
        function createListOfListWithZeros(count, count2) {
            var listList = [];
            for (var i = 0; i < count; i += 1) {
                listList.push(createListOfItems(0, count2));
            }
            return listList;
        }
        QUnit.test("array variables", function (assert) {
            var variables = new Variables_1.Variables();
            assert.propEqual(variables.getAllVariables(), {}, "getAll:");
            var zeros11 = createListOfItems(0, 11);
            variables.initVariable("a1A");
            assert.propEqual(variables.getVariable("a1A"), zeros11, "init a1A; get a1A: 0,0... (11)"); // eslint-disable-line array-element-newline
            variables.initVariable("sA$");
            assert.propEqual(variables.getVariable("sA$"), ["", "", "", "", "", "", "", "", "", "", ""], 'init sA$; get sA$: "","",... (11)'); // eslint-disable-line array-element-newline
            var zero11x11 = createListOfListWithZeros(11, 11);
            variables.initVariable("bAA");
            assert.propEqual(variables.getVariable("bAA"), zero11x11, "init bAA; get bAA: 0,0... (11x11)");
            var zero11x11x11 = [];
            for (var i = 0; i < 11; i += 1) {
                zero11x11x11.push(createListOfListWithZeros(11, 11));
            }
            variables.initVariable("bAAA");
            assert.propEqual(variables.getVariable("bAAA"), zero11x11x11, "init bAAA; get bAAA: 0,0... (11x11x11)");
            var zero2x5 = createListOfListWithZeros(2, 5);
            variables.dimVariable("cAA", [2, 5]); // eslint-disable-line array-element-newline
            assert.propEqual(variables.getVariable("cAA"), zero2x5, "init cAA; get cAA: 0,0... (2x5)");
        });
    });
    QUnit.module("Variables: determineStaticVarType", function () {
        /* eslint-disable quote-props */
        var allTests = {
            determineStaticVarType: {
                // eslint-disable-next-line quote-props
                "a": "a",
                "aI": "aI",
                "aR": "aR",
                "a$": "a$",
                "abcI": "aI",
                "bcR": "bR",
                "z7$": "z$",
                "aAI[b]": "aI",
                "_a": "a",
                "v.a": "a",
                "v.aI": "aI",
                "v.aR": "aR",
                "v.a$": "a$",
                'v["a" + t.a]': "a",
                'v["aA" + t.a][b]': "a"
            }
        };
        /* eslint-enable quote-props */
        function runTestsForDetermineStaticVarType(_category, tests, assert, results) {
            var variables = new Variables_1.Variables();
            for (var key in tests) {
                if (tests.hasOwnProperty(key)) {
                    var expected = tests[key], result = variables.determineStaticVarType(key);
                    if (results) {
                        results.push(TestHelper_1.TestHelper.stringInQuotes(key) + ": " + TestHelper_1.TestHelper.stringInQuotes(result));
                    }
                    if (assert) {
                        assert.strictEqual(result, expected, key);
                    }
                }
            }
        }
        TestHelper_1.TestHelper.generateAndRunAllTests(allTests, runTestsForDetermineStaticVarType);
    });
});
// end
//# sourceMappingURL=Variables.qunit.js.map