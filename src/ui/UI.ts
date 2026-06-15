import { UiUtils } from "./UiUtils";
import type { ConfigEntryType, ICore, IUI } from "../Interfaces";
import { Controller, ControllerOptions } from "./Controller";
import { View } from "./View";

export class UI implements IUI {
	private view: View = new View();
	private controller?: Controller;
	private core?: ICore;

	/*
	private static fnMapObjectProperties(arg: any) {
		if (typeof arg === "object") {
			const res = [];

			for (const key in arg) { // eslint-disable-line guard-for-in
				const value = arg[key];

				if (typeof value !== "object" && typeof value !== "function") {
					res.push(key + ": " + value);
				}
			}
			arg = String(arg) + "{" + res.join(", ") + "}";
		}
		return arg;
	}
	*/

	private static fnDecodeUri(s: string): string {
		let decoded = "";

		try {
			decoded = decodeURIComponent(s.replace(/\+/g, " "));
		} catch (err) {
			if (err instanceof Error) {
				err.message += ": " + s;
			}
			console.error(err);
		}
		return decoded;
	}

	private static parseUri(config: Record<string, ConfigEntryType>): string[] {
		const urlQuery = window.location.search.substring(1);
		const rSearch = /([^&=]+)=?([^&]*)/g;
		const args: string[] = [];
		let match: RegExpExecArray | null;

		while ((match = rSearch.exec(urlQuery)) !== null) {
			const name = UI.fnDecodeUri(match[1]);
			const value = UI.fnDecodeUri(match[2]);

			if (value !== null && config[name] !== undefined) {
				args.push(name + "=" + value);
			}
		}
		return args;
	}

	/*
	private static createDebugUtilsConsole(cpcBasicLog: string) {
		const currentConsole = UiUtils.console;

		return {
			consoleLog: {
				value: cpcBasicLog || "" // already something collected?
			},
			console: currentConsole,
			rawLog: function (fnMethod: (args: any) => void, level: string, args: any) {
				if (level) {
					args.unshift(level);
				}
				if (fnMethod) {
					if (fnMethod.apply) {
						fnMethod.apply(console, args);
					}
				}
				if (this.consoleLog) {
					this.consoleLog.value += args.map(UI.fnMapObjectProperties).join(" ") + ((level !== null) ? "\n" : "");
				}
			},
			log: function () {
				this.rawLog(this.console && this.console.log, "", Array.prototype.slice.call(arguments));
			},
			debug: function () {
				this.rawLog(this.console && this.console.debug, "DEBUG:", Array.prototype.slice.call(arguments));
			},
			info: function () {
				this.rawLog(this.console && this.console.info, "INFO:", Array.prototype.slice.call(arguments));
			},
			warn: function () {
				this.rawLog(this.console && this.console.warn, "WARN:", Array.prototype.slice.call(arguments));
			},
			error: function () {
				this.rawLog(this.console && this.console.error, "ERROR:", Array.prototype.slice.call(arguments));
			},
			changeLog: function (log: any) {
				const oldLog = this.consoleLog;

				this.consoleLog = log;
				if (oldLog && oldLog.value && log) { // some log entires collected?
					log.value += oldLog.value; // take collected log entries
				}
			}
		};
	}
	*/

	public getCurrentDataKey(): string {
		return document.currentScript && document.currentScript.getAttribute("data-key") || "";
	}

	public onWindowLoadContinue(core: ICore): void {
		//this.isMobile = UI.isMobile();
		this.core = core;
		const model = core.getModel();
		const config = model.getAllProperties();
		const args = UI.parseUri(config);

		core.parseArgs(args, config);
		const debug = model.getProperty<number>("debug"); //TTT
		if (debug) {
			core.setDebug(debug);
			UiUtils.setDebug(debug);
		}
		core.init(); // init databases

		const controllerOptions: ControllerOptions = {};

		this.controller = new Controller(core, this.view, controllerOptions);
		this.controller.onDatabaseSelectChange(); // trigger loading example
	}
}
