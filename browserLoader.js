"use strict";
// browserLoader.ts - Loader for the browser
// (c) Marco Vieth, 2022
if (!window.exports) {
    window.exports = {};
}
if (!window.require) {
    window.require = function (name) {
        var module = {}; // eslint-disable-line @typescript-eslint/ban-types
        name = name.replace(/^.*[\\/]/, "");
        module[name] = window.exports[name];
        if (!module[name]) {
            console.error("ERROR: Module not loaded:", name);
            throw new Error();
        }
        return module;
    };
}
if (!window.define) {
    window.define = function (names, func) {
        var args = names.map(function (name) {
            if (name === "require") {
                return null;
            }
            else if (name === "exports") {
                return window.exports;
            }
            var module = window.require(name);
            return module;
        });
        func.apply(this, args);
    };
}
//# sourceMappingURL=browserLoader.js.map