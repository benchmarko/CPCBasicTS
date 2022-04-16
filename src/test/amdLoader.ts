// amdLoader.ts - Loader for amd modules with node
// (c) Marco Vieth, 2022

//
// based on:
// https://github.com/ajaxorg/node-amd-loader/blob/master/amd-loader.js

// eslint-disable-next-line @typescript-eslint/no-var-requires
var fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
var Module = require("module");

const moduleStack: any[] = [],
	// eslint-disable-next-line no-underscore-dangle
	defaultCompile = module.constructor.prototype._compile;

// eslint-disable-next-line no-underscore-dangle
module.constructor.prototype._compile = function (content: any, filename: string) {
	moduleStack.push(this);
	try {
		return defaultCompile.call(this, content, filename);
	} finally {
		moduleStack.pop();
	}
};

//(global as any).define = function (id: any, deps: string[], factory: { apply: (arg0: any, arg1: any) => any; }) {
(global as any).define = function (deps: string[], factory: (...args: any) => any) {
	/*
	// Allow for anonymous modules
	if (typeof id !== "string") {
		factory = deps;
		deps = id;
		id = null;
	}
	// This module may not have dependencies
	if (deps && !Array.isArray(deps)) {
		factory = deps;
		deps = null;
	}
	if (!deps) {
		deps = ["require", "exports", "module"];
	}
	*/

	// infer the module
	let id = null;
	const currentModule = moduleStack[moduleStack.length - 1],
		mod = currentModule || module.parent || require.main;


	if (typeof id === "string" && id !== mod.id) {
		throw new Error("Can not assign module to a different id than the current file");
	}

	const req = function (module: string, relativeId: string): any {
	//const req = function (module: any, relativeId: string[] | string, callback: { apply: (arg0: any, arg1: unknown[]) => any; }): any {
		/*
		if (Array.isArray(relativeId)) {
			// async require
			return callback.apply(this, relativeId.map(req));
		}

		const chunks = relativeId.split("!");
		let prefix;

		if (chunks.length >= 2) {
			prefix = chunks[0];
			relativeId = chunks.slice(1).join("!");
		}
		*/

		// eslint-disable-next-line no-underscore-dangle
		//console.log("DEBUG: define: relativeId:", relativeId, "module:", module);

		let fileName = Module._resolveFilename(relativeId, module); // eslint-disable-line no-underscore-dangle

		//console.log("DEBUG: define: fileName:", fileName);

		if (Array.isArray(fileName)) {
			fileName = fileName[0];
		}

		/*
		if (prefix && prefix.indexOf("text") !== -1) {
			// eslint-disable-next-line no-sync
			return fs.readFileSync(fileName, "utf8");
		}
		*/
		// eslint-disable-next-line global-require
		return require(fileName);
	}.bind(this, mod);

	id = mod.id;
	if (typeof factory !== "function") {
		// we can just provide a plain object
		mod.exports = factory;
		return factory;
	}

	const returned = factory.apply(mod.exports, deps.map(function (injection: string) {
		switch (injection) {
		// check for CommonJS injection variables
		case "require": return req;
		case "exports": return mod.exports;
		case "module": return mod;
		default:
			// a module dependency
			return req(injection);
		}
	}));

	if (returned) {
		// since AMD encapsulates a function/callback, it can allow the factory to return the exports.
		mod.exports = returned;
	}
	return null; // TTT
};

//
//
//

// nodeLoader.ts - Loader for node
// (c) Marco Vieth, 2022

// import path = require("node:path");

// var exports: any, require: any, define: any;

/* xxxglobals exports */
/* xxxglobals globalThis */

/* xxxglobals global */

/*
declare interface global {
	exports: {[k in string]: object}; // eslint-disable-line @typescript-eslint/ban-types
	require: (path: string) => object; // eslint-disable-line @typescript-eslint/ban-types,
	define: unknown;
}
*/

/*
declare interface globalThis {
	define: unknown;
}
*/

/*
declare global {
	let require: (path: string) => object; // eslint-disable-line @typescript-eslint/ban-types,
}
*/

// var require: (path: string) => object; // eslint-disable-line @typescript-eslint/ban-types,

/*
if ((typeof globalThis !== "undefined") && !globalThis.window) { // nodeJS
	//Utils.console.debug("Polyfill: window");
	//(globalThis.window as any) = {};
}
*/

// const myGlobal = (globalThis || window) as any;

/*
function fnEval(sCode: string) {
	return eval(sCode); // eslint-disable-line no-eval
}
*/

/*
interface NodeFs {
	readFile: (sName: string, sEncoding: string, fn: (res: any) => void) => any
}
*/

// https://github.com/ajaxorg/node-amd-loader/blob/master/amd-loader.js

/*
interface NodePath {
	resolve: (sDir: string, sName: string) => string
}

let path: NodePath;


if (!(globalThis as any).define) {
	(globalThis as any).define = function (names: string[], func: (...args: any) => void) {
*/
/*
		function fnEval(sCode: string) {
			return eval(sCode); // eslint-disable-line no-eval
		}
		function nodeGetAbsolutePath(sName: string) {
			if (!path) {
				fnEval('path = require("path");'); // to trick TypeScript
			}
			const sAbsolutePath = path.resolve(__dirname, sName);

			return sAbsolutePath;
		}
		*/
/*
		const args = names.map(function (name) {
			if (name === "require") {
				return null;
			} else if (name === "exports") {
				return exports;
			}
			//const absolute = nodeGetAbsolutePath(name);

			//console.log("DEBUG: define:", name, absolute);
*/
/*
			console.log("DEBUG: require:", require);
			console.log("DEBUG: require.parent:", (require as any).main.parent);
			console.log("DEBUG: require.path:", (require as any).main.path);
			console.log("DEBUG: require.paths:", (require as any).main.paths);
*/
/*
			if (name.startsWith("./")) {
				name = "." + name; // fast hack: ./ => ../
			}

			const module = require(name); // eslint-disable-line global-require, @typescript-eslint/no-var-requires

			console.log("DEBUG: define: require: name=", name, "module=", module);
			return module;
		});

		func.apply(this, args);
	};
}
*/
