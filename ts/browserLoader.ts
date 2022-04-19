// browserLoader.ts - Loader for the browser
// (c) Marco Vieth, 2022

interface Window { // eslint-disable-line @typescript-eslint/no-unused-vars
	exports: {[k in string]: object}; // eslint-disable-line @typescript-eslint/ban-types
	require: any; //(path: string) => object; // eslint-disable-line @typescript-eslint/ban-types,
	define: unknown;
}

if (!window.exports) {
	window.exports = {};
}


if (!window.require) {
	window.require = function (name: string) {
		const module: { [k in string]: object } = {}; // eslint-disable-line @typescript-eslint/ban-types

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
		const args = names.map(function (name) {
			if (name === "require") {
				return null;
			} else if (name === "exports") {
				return window.exports;
			}
			const module = window.require(name);

			return module;
		});

		func.apply(this, args);
	};
}
