// browserLoader.ts - Loader for the browser
// (c) Marco Vieth, 2022
//
// Simulates nodeJS exports, require, define un the browser.
// Does not support default exports, (maybe possible with document.currentScript.src, but not for IE)
//
interface Window { // eslint-disable-line @typescript-eslint/no-unused-vars
	exports: Record<string, object>; // eslint-disable-line @typescript-eslint/ban-types
	require: (id: string) => any;
	define: unknown;
}

if (!window.exports) {
	window.exports = {};
}

if (!window.require) {
	(window as any).require = function (name: string) {
		const module: Record<string, object> = {}; // eslint-disable-line @typescript-eslint/ban-types

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
	window.define = function (names: string[], func: (...args: any) => void) {
		// const module = document.currentScript && (document.currentScript as HTMLScriptElement).src,
		const args = names.map(function (name) {
			if (name === "require") {
				return null;
			} else if (name === "exports") {
				return window.exports;
			}
			return window.require(name);
		});

		func.apply(this, args);
	};
}
