"use strict";
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
        // const module = document.currentScript && (document.currentScript as HTMLScriptElement).src,
        var args = names.map(function (name) {
            if (name === "require") {
                return null;
            }
            else if (name === "exports") {
                return window.exports;
            }
            return window.require(name);
        });
        func.apply(this, args);
    };
}
//# sourceMappingURL=browserLoader.js.map