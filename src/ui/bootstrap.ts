import "./Polyfills";
import { UI } from "./UI";

import { cpcBasic, CpcBasicStartupAdapter } from "../cpcbasic";
import type { ConfigType } from "../Interfaces";

interface CpcBasicWindow extends Window {
	cpcConfig?: Partial<ConfigType>
}

const uiStartupAdapter: CpcBasicStartupAdapter = {
	getConfigOverrides: () => (window as CpcBasicWindow).cpcConfig || {},
	getArgs: () => [],
	getUI: () => new UI(),
	isNodeRuntime: () => false,
	getNodeUtils: () => undefined
};

window.onload = () => {
	cpcBasic.start(uiStartupAdapter);
};
