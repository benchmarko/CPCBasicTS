// NodePolyfills.ts - minimal polyfills for headless Node runtime
//

interface PolyfillsLike {
	list: string[];
	getList: () => string[];
	log: (part: string) => void;
	console: Console;
	localStorage: Storage;
}

interface GlobalWithPolyfills {
	window?: Window & typeof globalThis;
	Polyfills?: PolyfillsLike;
}

function createLocalStorage(): Storage {
	const data: Record<string, string> = {};
	const storage: Record<string, unknown> = {
		clear() {
			Object.keys(data).forEach((key) => {
				delete data[key];
				delete storage[key];
			});
		},
		getItem(key: string) {
			return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
		},
		key(index: number) {
			const keys = Object.keys(data);

			return (index >= 0 && index < keys.length) ? keys[index] : null;
		},
		removeItem(key: string) {
			delete data[key];
			delete storage[key];
		},
		setItem(key: string, value: string) {
			const value2 = String(value);

			data[key] = value2;
			storage[key] = value2;
		},
		get length() {
			return Object.keys(data).length;
		}
	};

	return storage as Storage;
}

const myGlobal = ((typeof globalThis !== "undefined") ? globalThis : Function("return this")()) as unknown as GlobalWithPolyfills; // eslint-disable-line no-new-func

if (!myGlobal.window) {
	myGlobal.window = myGlobal as unknown as Window & typeof globalThis;
}

const localStorage = (myGlobal.window.localStorage || createLocalStorage());

myGlobal.window.localStorage = localStorage;

var Polyfills = myGlobal.Polyfills || {
	list: [] as string[],
	getList: function (): string[] {
		return Polyfills.list;
	},
	log: function (part: string): void {
		Polyfills.list.push(part);
	},
	console: myGlobal.console,
	localStorage: localStorage
};

Polyfills.console = myGlobal.console;
Polyfills.localStorage = localStorage;

myGlobal.Polyfills = Polyfills;
