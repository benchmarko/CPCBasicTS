import type { ICore, INodeUtils, ICpcVmRsx, LoadScriptFn } from "../Interfaces";
import "../ui/Polyfills";
import { UiUtils } from "../ui/UiUtils";
import { Controller, ControllerOptions } from "../ui/Controller";
import { View } from "../ui/View";
import { NodeDocumentAdapter } from "./NodeDocumentAdapter";

interface NodeHttps {
	get: (url: string, fn: (res: any) => void) => any
}

interface NodeFs {
	readFile: (name: string, encoding: string, fn: (res: any) => void) => any
}

const myGlobalThis = (typeof globalThis !== "undefined") ? globalThis : Function("return this")(); // eslint-disable-line no-new-func

export class NodeUtils implements INodeUtils {
	private static currentScriptKey = "";

	private static nodeReadUrl(url: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
		const nodeHttps = eval("require")("https") as NodeHttps; // eslint-disable-line no-eval

		nodeHttps.get(url, (resp) => {
			let data = "";

			resp.on("data", (chunk: string) => {
				data += chunk;
			});

			resp.on("end", () => {
				fnDataLoaded(undefined, data);
			});
		}).on("error", (err: Error) => {
			console.log("Error: " + err.message);
			fnDataLoaded(err);
		});
	}

	private static nodeReadFile(name: string, fnDataLoaded: (error: Error | undefined, data?: string) => void) {
		const nodeFs = eval("require")("fs") as NodeFs, // eslint-disable-line no-eval
			cwd = (myGlobalThis.process && myGlobalThis.process.cwd) ? myGlobalThis.process.cwd() : "",
			name2 = (cwd && name.indexOf(":") < 0 && !name.startsWith("/")) ? cwd + "/" + name : name;

		nodeFs.readFile(name2, "utf8", fnDataLoaded);
	}

	private static isUrl(s: string) {
		return s.startsWith("http"); // http or https
	}

	static readonly loadScript: LoadScriptFn = (fileOrUrl, fnSuccess, fnError: (url2: string, key: string) => void, key) => {
		const fnLoaded = (error: Error | undefined, data?: string) => {
			if (error) {
				console.error("file error: ", error);
				fnError(fileOrUrl, key);
				return;
			}
			if (data) {
				NodeUtils.currentScriptKey = key;
				(0, eval)(data); // eslint-disable-line no-eval
				NodeUtils.currentScriptKey = "";
			}
			fnSuccess(fileOrUrl, key);
		};

		if (NodeUtils.isUrl(fileOrUrl)) {
			NodeUtils.nodeReadUrl(fileOrUrl, fnLoaded);
		} else {
			NodeUtils.nodeReadFile(fileOrUrl, fnLoaded);
		}
	};

	private static writeResultDelta(text: string, state: { text: string }) {
		const previous = state.text;
		const delta = text.startsWith(previous) ? text.substring(previous.length) : text;

		if (delta && myGlobalThis.process && myGlobalThis.process.stdout) {
			myGlobalThis.process.stdout.write(delta);
		}
		state.text = text;
	}

	public nodeMain(core: ICore) {
		const model = core.getModel(),
			config = model.getAllProperties();

		core.parseArgs(myGlobalThis.process.argv.slice(2), config);

		if (config.canvasType === "graphics") {
			config.canvasType = "text";
		}

		if (!myGlobalThis.AudioContext && config.sound === true) {
			config.sound = false;
		}

		config.showCpc = false; // disable canvas updates in headless mode

		const debug = model.getProperty<number>("debug");

		if (debug) {
			core.setDebug(debug);
			UiUtils.setDebug(debug);
		}
		core.init(); // init databases

		const nodeDocument = new NodeDocumentAdapter();

		(myGlobalThis as any).document = nodeDocument;
		(myGlobalThis as any).cpcBasic = {
			addIndex: core.addIndex,
			addItem: (key: string, input: string | (() => void)) => {
				core.addItem(key || NodeUtils.currentScriptKey, input);
			},
			addRsx: (key: string, RsxConstructor: new () => ICpcVmRsx) => core.addRsx(key || NodeUtils.currentScriptKey, RsxConstructor)
		};
		View.setDocument(nodeDocument);

		const outputState = {
			text: ""
		};

		const controllerOptions: ControllerOptions = {
			isHeadlessDirectInput: true,
			loadScript: NodeUtils.loadScript,
			onResultText: (value: string) => {
				NodeUtils.writeResultDelta(value, outputState);
			},
			onProgramEnd: () => {
				myGlobalThis.process.exit(0);
			}
		};

		const controller = new Controller(core, new View(), controllerOptions);

		controller.onDatabaseSelectChange(); // trigger loading configured example
	}
}
