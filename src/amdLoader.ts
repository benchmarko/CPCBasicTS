// amdLoader.ts - AMD Loader for the browser or nodeJS
// (c) Marco Vieth, 2022
//
// Simulates nodeJS exports, require, define in the browser.
// Does not support default exports, (maybe possible with document.currentScript.src, but not for IE; or when compiled to one file)
//

//
// based on:
// https://github.com/ajaxorg/node-amd-loader/blob/master/amd-loader.js

type MyDefineFunctionType = (...args: any) => void;

function amd4Node() {
	const Module = require("module"); // eslint-disable-line global-require, @typescript-eslint/no-var-requires
	const moduleStack: any[] = [],
		defaultCompile = module.constructor.prototype._compile; // eslint-disable-line no-underscore-dangle

	// eslint-disable-next-line no-underscore-dangle
	module.constructor.prototype._compile = function (content: any, filename: string) {
		moduleStack.push(this);
		try {
			return defaultCompile.call(this, content, filename);
		} finally {
			moduleStack.pop();
		}
	};

	(global as any).define = function (arg1: string | string[], arg2: string[] | MyDefineFunctionType, arg3?: MyDefineFunctionType) {
		// if arg1 is no id, we have an anonymous module
		// eslint-disable-next-line array-element-newline
		const [deps, func] = (typeof arg1 !== "string") ? [arg1, arg2 as MyDefineFunctionType] : [arg2 as string[], arg3 as MyDefineFunctionType],
			// const [id, deps, func] = (typeof arg1 !== "string") ? ["", arg1, arg2 as MyDefineFunctionType] : [arg1, arg2 as string[], arg3 as MyDefineFunctionType],
			currentModule = moduleStack[moduleStack.length - 1],
			mod = currentModule || module.parent || require.main,

			req = function (module: any, relativeId: string): any {
				if (module.exports[relativeId]) { // already loaded, maybe from define in same file?
					return module.exports;
				}
				let fileName = Module._resolveFilename(relativeId, module); // eslint-disable-line no-underscore-dangle

				if (Array.isArray(fileName)) {
					fileName = fileName[0];
				}

				return require(fileName); // eslint-disable-line global-require
			}.bind(this, mod);

		func.apply(mod.exports, deps.map(function (injection: string) {
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
		(window as any).require = function (name: string) {
			name = name.replace(/^.*[\\/]/, "");
			if (!window.exports[name]) {
				console.error("ERROR: Module not loaded:", name);
				throw new Error();
			}
			return window.exports;
		};
	}

	if (!(window as any).define) {
		(window as any).define = function (arg1: string | string[], arg2: string[] | MyDefineFunctionType, arg3?: MyDefineFunctionType) {
			// if arg1 is no id, we have an anonymous module
			const [deps, func] = (typeof arg1 !== "string") ? [arg1, arg2 as MyDefineFunctionType] : [arg2 as string[], arg3 as MyDefineFunctionType], // eslint-disable-line array-element-newline
				depsMapped: string[] = []; // deps.map() (Array.map() not IE8)

			for (let i = 0; i < deps.length; i += 1) {
				const name = deps[i];
				let mapped;

				if (name === "require") {
					mapped = null;
				} else if (name === "exports") {
					mapped = window.exports;
				} else {
					mapped = window.require(name);
				}
				depsMapped[i] = mapped;
			}

			func.apply(this, depsMapped);
		};
	}
}

if (Polyfills.isNodeAvailable) {
	amd4Node();
} else {
	amd4browser();
}
