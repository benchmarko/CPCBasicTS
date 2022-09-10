// NodeAdapt.ts - Adaptations for nodeJS
//

/* globals globalThis */

import { Utils } from "./Utils";

// examples:
// npm run build:one
// node dist/cpcbasicts.js sound=false showCpc=false debug=0 example=test/testpage
// node dist/cpcbasicts.js sound=false showCpc=false debug=0 databaseDirs=https://benchmarko.github.io/CPCBasicApps/apps database=apps example=math/euler
interface NodeHttps {
	get: (url: string, fn: (res: any) => void) => any
}

interface NodeFs {
	readFile: (name: string, encoding: string, fn: (res: any) => void) => any
}

export class NodeAdapt {
	static isNodeAvailable(): boolean {
		// eslint-disable-next-line no-new-func
		const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // for old IE
		let nodeJs = false;

		// https://www.npmjs.com/package/detect-node
		// Only Node.JS has a process variable that is of [[Class]] process
		try {
			if (Object.prototype.toString.call(myGlobalThis.process) === "[object process]") {
				nodeJs = true;
			}
		} catch (e) {
			// empty
		}
		return nodeJs;
	}

	static doAdapt(): void {
		let https: NodeHttps, // nodeJs
			fs: NodeFs,
			module: any;

		const domElements: Record<string, any> = {},
			myCreateElement = function (id: string) {
				domElements[id] = {
					className: "",
					style: {
						borderwidth: "",
						borderStyle: ""
					},
					addEventListener: () => {}, // eslint-disable-line no-empty-function, @typescript-eslint/no-empty-function
					options: [],
					get length() {
						return domElements[id].options.length;
					}
				};
				return domElements[id];
			};

		Object.assign(window, {
			console: console,
			document: {
				addEventListener: () => {}, // eslint-disable-line no-empty-function, @typescript-eslint/no-empty-function
				getElementById: (id: string) => domElements[id] || myCreateElement(id),
				createElement: (type: string) => {
					if (type === "option") {
						return {};
					}
					Utils.console.error("createElement: unknown type", type);
					return {};
				}
			},
			AudioContext: () => { throw new Error("AudioContext not supported"); }
		});

		// eslint-disable-next-line no-eval
		const nodeExports = eval("exports"),
			view = nodeExports.View,
			setSelectOptionsOrig = view.prototype.setSelectOptions;

		view.prototype.setSelectOptions = (id: string, options: any[]) => {
			const element = domElements[id] || myCreateElement(id);

			if (!element.options.add) {
				// element.options = [];
				element.add = (option: any) => {
					// eslint-disable-next-line no-invalid-this
					element.options.push(option);
					if (element.options.length === 1 || option.selected) {
						element.value = element.options[element.options.length - 1].value;
					}
				};
			}
			return setSelectOptionsOrig(id, options);
		};

		const setAreaValueOrig = view.prototype.setAreaValue;

		view.prototype.setAreaValue = (id: string, value: string) => {
			if (id === "resultText") {
				if (value) {
					Utils.console.log(value);
				}
			}
			return setAreaValueOrig(id, value);
		};

		// https://nodejs.dev/learn/accept-input-from-the-command-line-in-nodejs
		// readline?
		const controller = nodeExports.Controller;
		// startWithDirectInputOrig = controller.prototype.startWithDirectInput;

		controller.prototype.startWithDirectInput = () => {
			Utils.console.log("We are ready.");
		};

		//

		function isUrl(s: string) {
			return s.startsWith("http"); // http or https
		}

		function fnEval(code: string) {
			return eval(code); // eslint-disable-line no-eval
		}

		function nodeReadUrl(url: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
			if (!https) {
				fnEval('https = require("https");'); // to trick TypeScript
			}
			https.get(url, (resp) => {
				let data = "";

				// A chunk of data has been received.
				resp.on("data", (chunk: string) => {
					data += chunk;
				});

				// The whole response has been received. Print out the result.
				resp.on("end", () => {
					fnDataLoaded(undefined, data);
				});
			}).on("error", (err: Error) => {
				Utils.console.log("Error: " + err.message);
				fnDataLoaded(err);
			});
		}

		let modulePath: string;

		function nodeReadFile(name: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
			if (!fs) {
				fnEval('fs = require("fs");'); // to trick TypeScript
			}

			if (!module) {
				fnEval('module = require("module");'); // to trick TypeScript

				modulePath = module.path || "";

				if (!modulePath) {
					Utils.console.warn("nodeReadFile: Cannot determine module path");
				}
			}

			const name2 = modulePath ? modulePath + "/" + name : name;

			fs.readFile(name2, "utf8", fnDataLoaded);
		}

		const utils = nodeExports.Utils;

		utils.loadScript = (fileOrUrl: string, fnSuccess: ((url2: string, key: string) => void), _fnError: ((url2: string, key: string) => void), key: string) => {
			const fnLoaded = (error: Error | undefined, data?: string) => {
				if (error) {
					Utils.console.error("file error: ", error);
				}
				if (data) {
					fnEval(data); // load js (for nodeJs)
				}
				fnSuccess(fileOrUrl, key);
			};

			if (isUrl(fileOrUrl)) {
				nodeReadUrl(fileOrUrl, fnLoaded);
			} else {
				nodeReadFile(fileOrUrl, fnLoaded);
			}
		};
	}
}

//Utils.console.debug("Polyfill: end of Polyfills: count=" + Polyfills.count);
// end
