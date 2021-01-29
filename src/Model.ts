// Model.ts - Model (MVC)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/

import { Utils } from "./Utils";

type ConfigEntryType = string | number | boolean;

export type ConfigType = { [k in string]: ConfigEntryType };

export interface DatabaseEntry {
	text: string
	title: string
	src: string
}

export interface ExampleEntry {
	key: string
	title: string
	type: string
	meta: string // D=data
	script?: string
	loaded?: boolean
}

export type DatabasesType = { [k in string]: DatabaseEntry };

type ExamplesType = { [k in string]: { [l in string]: ExampleEntry }};

export class Model {
	config: ConfigType;
	initialConfig: ConfigType;
	databases: DatabasesType;
	examples: ExamplesType;


	constructor(config: ConfigType, initialConfig: ConfigType) {
		this.config = config || {}; // store only a reference
		this.initialConfig = initialConfig || {};
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
