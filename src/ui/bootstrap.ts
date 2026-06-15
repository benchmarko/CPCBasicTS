import "./Polyfills";
import { UI } from "./UI";

import { cpcBasic, CpcBasicStartupAdapter } from "../cpcbasic";
import type { ConfigType } from "../Interfaces";

const uiStartupAdapter: CpcBasicStartupAdapter = {
	getConfigOverrides: () => ({} as Partial<ConfigType>), //TODO window?.cpcConfig || {},
	getArgs: () => [],
	getUI: () => new UI(),
	isNodeRuntime: () => false,
	getNodeUtils: () => undefined
};

window.onload = () => {
	cpcBasic.start(uiStartupAdapter);
};
