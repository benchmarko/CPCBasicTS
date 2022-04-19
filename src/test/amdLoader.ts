// amdLoader.ts - Loader for amd modules with node
// (c) Marco Vieth, 2022

//
// based on:
// https://github.com/ajaxorg/node-amd-loader/blob/master/amd-loader.js

var Module = require("module"); // eslint-disable-line @typescript-eslint/no-var-requires

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

(global as any).define = function (deps: string[], factory: (...args: any) => void) {
	const currentModule = moduleStack[moduleStack.length - 1],
		mod = currentModule || module.parent || require.main,

		req = function (module: string, relativeId: string): any {
			let fileName = Module._resolveFilename(relativeId, module); // eslint-disable-line no-underscore-dangle

			if (Array.isArray(fileName)) {
				fileName = fileName[0];
			}

			return require(fileName); // eslint-disable-line global-require
		}.bind(this, mod);

	factory.apply(mod.exports, deps.map(function (injection: string) {
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

};
