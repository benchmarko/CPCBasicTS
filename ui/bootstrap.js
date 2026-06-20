import "./Polyfills";
import { UI } from "./UI";
import { cpcBasic } from "../cpcbasic";
const uiStartupAdapter = {
    getConfigOverrides: () => ({}), //TODO window?.cpcConfig || {},
    getArgs: () => [],
    getUI: () => new UI(),
    isNodeRuntime: () => false,
    getNodeUtils: () => undefined
};
window.onload = () => {
    cpcBasic.start(uiStartupAdapter);
};
//# sourceMappingURL=bootstrap.js.map