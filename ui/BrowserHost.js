import { UiUtils } from "./UiUtils";
export function createBrowserHost(overrides = {}) {
    var _a;
    return {
        get storage() {
            var _a;
            return (_a = overrides.storage) !== null && _a !== void 0 ? _a : (Polyfills.localStorage || window.localStorage);
        },
        loadScript: (_a = overrides.loadScript) !== null && _a !== void 0 ? _a : UiUtils.loadScript,
        atobFn: (input) => overrides.atobFn ? overrides.atobFn(input) : window.atob(input),
        btoaFn: (input) => overrides.btoaFn ? overrides.btoaFn(input) : window.btoa(input),
        setTimeout: (callback, delay) => overrides.setTimeout ? overrides.setTimeout(callback, delay) : window.setTimeout(callback, delay)
    };
}
//# sourceMappingURL=BrowserHost.js.map