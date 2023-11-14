// NodeAdapt.ts - Adaptations for nodeJS
//

import { ViewID } from "./Constants";
import { Utils } from "./Utils";

// examples:
// npm run build:one
// node dist/cpcbasicts.js sound=false canvasType=text debug=0 example=test/testpage
// node dist/cpcbasicts.js sound=false canvasType=text debug=0 databaseDirs=https://benchmarko.github.io/CPCBasicApps/apps database=apps example=math/euler
interface NodeHttps {
	get: (url: string, fn: (res: any) => void) => any
}

interface NodeFs {
	readFile: (name: string, encoding: string, fn: (res: any) => void) => any
}

export class NodeAdapt {
	static doAdapt(): void {
		let https: NodeHttps, // nodeJs
			fs: NodeFs,
			module: any,
			audioContext: any;

		const domElements: Record<string, any> = {},
			myCreateElement = function (id: string) {
				domElements[id] = {
					className: "",
					style: {
						borderwidth: "",
						borderStyle: ""
					},
					addEventListener: () => {
						// nothing
					},
					options: [],
					getAttribute: () => {
						// nothing
					},
					setAttribute: () => {
						// nothing
					}
				};

				// old syntax for getter with "get length() { ... }"
				Object.defineProperty(domElements[id], "length", {
					get() {
						return domElements[id].options.length;
					},
					set(len: number) {
						domElements[id].options.length = len;
					},
					enumerable: true,
					configurable: true
				});
				return domElements[id];
			};

		function fnEval(code: string) {
			return eval(code); // eslint-disable-line no-eval
		}

		if (!audioContext) {
			// fnEval('audioContext = require("web-audio-api").AudioContext;'); // has no createChannelMerger()
			if (!audioContext) {
				audioContext = () => {
					throw new Error("AudioContext not supported");
				};
			}
		}

		Object.assign(window, {
			console: console,
			document: {
				addEventListener: () => {
					// nothing
				},
				getElementById: (id: string) => domElements[id] || myCreateElement(id),
				createElement: (type: string) => {
					if (type === "option") {
						return {};
					}
					Utils.console.error("createElement: unknown type", type);
					return {};
				}
			},
			AudioContext: audioContext
		});

		// eslint-disable-next-line no-eval
		const nodeExports = eval("exports"),
			view = nodeExports.View,
			setSelectOptionsOrig = view.prototype.setSelectOptions;

		// fast hacks...

		view.prototype.setSelectOptions = (id: string, options: any[]) => {
			const element = domElements[id] || myCreateElement(id);

			if (!element.options.add) {
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
			if (id === ViewID.resultText) {
				if (value) {
					Utils.console.log(value);
				}
			}
			return setAreaValueOrig(id, value);
		};

		// https://nodejs.dev/learn/accept-input-from-the-command-line-in-nodejs
		// readline?
		const controller = nodeExports.Controller;

		controller.prototype.startWithDirectInput = function () {
			this.stopUpdateCanvas();
			Utils.console.log("We are ready.");
		};

		function isUrl(s: string) {
			return s.startsWith("http"); // http or https
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
// end
