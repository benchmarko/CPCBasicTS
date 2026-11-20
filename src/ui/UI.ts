import { UiUtils } from "./UiUtils";
import type { ConfigType, ICanvasVm, IEngine, IUI } from "../Interfaces";
import { Controller, ControllerOptions } from "./Controller";
import { View } from "./View";

export class UI implements IUI {
	private view: View = new View();
	private controller = {} as Controller;

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

	private static parseUri(config: Record<string, ConfigType[keyof ConfigType]>): string[] {
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

	public getCanvasVm(): ICanvasVm {
		return this.controller?.getCanvas();
	}

	public getCurrentDataKey(): string {
		return document.currentScript && document.currentScript.getAttribute("data-key") || "";
	}

	public onWindowLoadContinue(engine: IEngine): void {
		const core = engine.core;
		const model = core.getModel();
		const config = model.getAllProperties();
		const args = UI.parseUri(config);

		core.parseArgs(args, config);
		const debug = model.getAllProperties().debug;
		if (debug) {
			core.setDebug(debug);
			UiUtils.setDebug(debug);
		}
		core.init(); // init databases

		const controllerOptions: ControllerOptions = {};

		this.controller = new Controller(engine, this.view, controllerOptions);
		this.controller.onDatabaseSelectChange(); // trigger loading example
	}
}
