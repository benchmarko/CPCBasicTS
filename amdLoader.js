"use strict";
// amdLoader.ts - AMD Loader for the browser or nodeJS
// (c) Marco Vieth, 2022
//
// Simulates nodeJS exports, require, define in the browser.
// Does not support default exports, (maybe possible with document.currentScript.src, but not for IE; or when compiled to one file)
//
function amd4Node() {
    var Module = require("module"); // eslint-disable-line global-require, @typescript-eslint/no-var-requires
    var moduleStack = [], defaultCompile = module.constructor.prototype._compile; // eslint-disable-line no-underscore-dangle
    // eslint-disable-next-line no-underscore-dangle
    module.constructor.prototype._compile = function (content, filename) {
        moduleStack.push(this);
        try {
            return defaultCompile.call(this, content, filename);
        }
        finally {
            moduleStack.pop();
        }
    };
    global.define = function (arg1, arg2, arg3) {
        // if arg1 is no id, we have an anonymous module
        // eslint-disable-next-line array-element-newline
        var _a = (typeof arg1 !== "string") ? [arg1, arg2] : [arg2, arg3], deps = _a[0], func = _a[1], 
        // const [id, deps, func] = (typeof arg1 !== "string") ? ["", arg1, arg2 as MyDefineFunctionType] : [arg1, arg2 as string[], arg3 as MyDefineFunctionType],
        currentModule = moduleStack[moduleStack.length - 1], mod = currentModule || module.parent || require.main, req = function (module, relativeId) {
            if (module.exports[relativeId]) { // already loaded, maybe from define in same file?
                return module.exports;
            }
            var fileName = Module._resolveFilename(relativeId, module); // eslint-disable-line no-underscore-dangle
            if (Array.isArray(fileName)) {
                fileName = fileName[0];
            }
            return require(fileName); // eslint-disable-line global-require
        }.bind(this, mod);
        func.apply(mod.exports, deps.map(function (injection) {
            switch (injection) {
                // check for CommonJS injection variables
                case "require": return req;
                case "exports": return mod.exports;
                case "module": return mod;
                default: return req(injection); // a module dependency
            }
        }));
    };
}
function amd4browser() {
    if (!window.exports) {
        window.exports = {};
    }
    if (!window.require) {
        window.require = function (name) {
            name = name.replace(/^.*[\\/]/, "");
            if (!window.exports[name]) {
                console.error("ERROR: Module not loaded:", name);
                throw new Error();
            }
            return window.exports;
        };
    }
    if (!window.define) {
        window.define = function (arg1, arg2, arg3) {
            // if arg1 is no id, we have an anonymous module
            var _a = (typeof arg1 !== "string") ? [arg1, arg2] : [arg2, arg3], deps = _a[0], func = _a[1], // eslint-disable-line array-element-newline
            depsMapped = []; // deps.map() (Array.map() not IE8)
            for (var i = 0; i < deps.length; i += 1) {
                var name_1 = deps[i];
                var mapped = void 0;
                if (name_1 === "require") {
                    mapped = null;
                }
                else if (name_1 === "exports") {
                    mapped = window.exports;
                }
                else {
                    mapped = window.require(name_1);
                }
                depsMapped[i] = mapped;
            }
            func.apply(this, depsMapped);
        };
    }
}
if (Polyfills.isNodeAvailable) {
    amd4Node();
}
else {
    amd4browser();
}
//# sourceMappingURL=amdLoader.js.map