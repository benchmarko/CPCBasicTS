// Model.ts - Model (MVC)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/


/*
declare global {
	function require(path: string): object; // eslint-disable-line @typescript-eslint/ban-types
	//var define = function (names: string[], ...func: Function[]) {}; // eslint-disable-line @typescript-eslint/ban-types
	//function define(names: string[], ...func: Function[]): void; // eslint-disable-line @typescript-eslint/ban-types
	var define: any, // eslint-disable-line vars-on-top
		exports: any;
}

if (typeof define !== "undefined") {
	define = function (names: string[], func: (...args: any) => void) {
		var args = names.map(function (name) {
			if (name === "require") {
				return null;
			} else if (name === "exports") {
				return exports;
			}
			var module = require(name); // eslint-disable-line vars-on-top, global-require, @typescript-eslint/no-var-requires

			return module;
		});

		func.apply(args);
	};
}
*/

/*
declare global {
	function require(path: string): object; // eslint-disable-line @typescript-eslint/ban-types
	function define(names: string[], func: (...args: any[]) => void): void;
}

if (typeof define === "undefined") {
	require("./loader"); // eslint-disable-line global-require
}
*/

/*
if (typeof require !== "undefined") { // nodeJs
	require("./loader"); // eslint-disable-line global-require
}
*/

import { Utils } from "./Utils";

export type ConfigEntryType = string | number | boolean;

export type ConfigType = { [k in string]: ConfigEntryType };

export interface DatabaseEntry {
	text: string
	title: string
	src: string
	script?: string
	loaded?: boolean
}

export interface ExampleEntry {
	key: string
	title: string
	meta: string // D=data
	script?: string
	loaded?: boolean
}

export type DatabasesType = { [k in string]: DatabaseEntry };

type ExamplesType = { [k in string]: { [l in string]: ExampleEntry }};

export class Model {
	private config: ConfigType;
	private initialConfig: ConfigType;
	private databases: DatabasesType;
	private examples: ExamplesType;

	constructor(config: ConfigType) {
		this.config = config || {}; // store only a reference
		this.initialConfig = Object.assign({}, this.config); // save initial config
		this.databases = {};
		this.examples = {}; // loaded examples per database
	}

	getProperty<T extends ConfigEntryType>(sProperty: string): T {
		return this.config[sProperty] as T;
	}
	setProperty<T extends ConfigEntryType>(sProperty: string, value: T): void {
		this.config[sProperty] = value;
	}
	getAllProperties(): ConfigType {
		return this.config;
	}
	getAllInitialProperties(): ConfigType {
		return this.initialConfig;
	}

	getChangedProperties(): ConfigType {
		const oCurrent = this.config,
			oInitial = this.initialConfig,
			oChanged: ConfigType = {};

		for (const sName in oCurrent) {
			if (oCurrent.hasOwnProperty(sName)) {
				if (oCurrent[sName] !== oInitial[sName]) {
					oChanged[sName] = oCurrent[sName];
				}
			}
		}
		return oChanged;
	}

	addDatabases(oDb: DatabasesType): void {
		for (const sPar in oDb) {
			if (oDb.hasOwnProperty(sPar)) {
				const oEntry = oDb[sPar];

				this.databases[sPar] = oEntry;
				this.examples[sPar] = {};
			}
		}
	}
	getAllDatabases(): DatabasesType {
		return this.databases;
	}
	getDatabase(): DatabaseEntry {
		const sDatabase = this.getProperty<string>("database");

		return this.databases[sDatabase];
	}

	getAllExamples(): {	[x: string]: ExampleEntry; } {
		const sDatabase = this.getProperty<string>("database");

		return this.examples[sDatabase];
	}
	getExample(sKey: string): ExampleEntry {
		const sDatabase = this.getProperty<string>("database");

		return this.examples[sDatabase][sKey];
	}
	setExample(oExample: ExampleEntry): void {
		const sDatabase = this.getProperty<string>("database"),
			sKey = oExample.key;

		if (!this.examples[sDatabase][sKey]) {
			if (Utils.debug > 1) {
				Utils.console.debug("setExample: creating new example:", sKey);
			}
		}
		this.examples[sDatabase][sKey] = oExample;
	}
	removeExample(sKey: string): void {
		const sDatabase = this.getProperty<string>("database");

		if (!this.examples[sDatabase][sKey]) {
			Utils.console.warn("removeExample: example does not exist: " + sKey);
		}
		delete this.examples[sDatabase][sKey];
	}
}
