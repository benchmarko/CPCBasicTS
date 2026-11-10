import type { RuntimeHost } from "../Interfaces";
import { createBrowserHost } from "../ui/BrowserHost";

QUnit.module("BrowserHost", function () {
	QUnit.test("host overrides do not require browser globals", function (assert) {
		const files = new Map<string, string>(),
			pending: { callback: () => void, delay?: number }[] = [],
			requests: string[] = [];
		const services: RuntimeHost = {
			storage: {
				get length() { return files.size; },
				clear: () => files.clear(),
				getItem: (key) => files.get(key) ?? null,
				key: (index) => Array.from(files.keys())[index] ?? null,
				removeItem: (key) => { files.delete(key); },
				setItem: (key, value) => { files.set(key, value); }
			},
			loadScript: (url, success, _error, key) => { requests.push(url); success(url, key); },
			atobFn: (input) => "decoded:" + input,
			btoaFn: (input) => "encoded:" + input,
			setTimeout: (callback, delay) => { pending.push({ callback, delay }); return pending.length; }
		};
		const host = createBrowserHost(services);
		assert.strictEqual(host.storage, services.storage);
		host.storage.setItem("test", "contents");
		assert.strictEqual(files.get("test"), "contents");
		assert.strictEqual(host.atobFn("data"), "decoded:data");
		assert.strictEqual(host.btoaFn("data"), "encoded:data");
		host.loadScript("examples/0index.js", (url, key) => {
			assert.strictEqual(url, "examples/0index.js");
			assert.strictEqual(key, "examples");
		}, () => assert.ok(false, "Unexpected loader error"), "examples");
		assert.deepEqual(requests, ["examples/0index.js"]);
		let called = false;
		assert.strictEqual(host.setTimeout(() => { called = true; }, 17), 1);
		assert.strictEqual(called, false);
		assert.strictEqual(pending[0].delay, 17);
		pending[0].callback();
		assert.strictEqual(called, true);
	});

	QUnit.test("default browser services are resolved lazily", function (assert) {
		const host = createBrowserHost();
		assert.strictEqual(typeof host.loadScript, "function");
		assert.strictEqual(typeof host.atobFn, "function");
		assert.strictEqual(typeof host.btoaFn, "function");
		assert.strictEqual(typeof host.setTimeout, "function");
	});
});