// Model.js - Model (MVC)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/

import { Utils } from "./Utils";

type ConfigEntryType = string | number | boolean;

type ConfigType = { [k in string]: ConfigEntryType };

interface DatabaseEntry {
	text: string
	title: string
	src: string
}

interface ExampleEntry {
	key: string
	title: string
	type: string
	meta: string // D=data
	script?: string
	loaded?: boolean
}

type DatabasesType = { [k in string]: DatabaseEntry };

type ExamplesType = { [k in string]: { [l in string]: ExampleEntry }};

export class Model {
	config: ConfigType;
	initialConfig: ConfigType;
	databases: DatabasesType;
	examples: ExamplesType;


	constructor(config: ConfigType, initialConfig: ConfigType) {
		this.init(config, initialConfig);
	}

	init(config: ConfigType, initialConfig: ConfigType): void {
		this.config = config || {}; // store only a reference
		this.initialConfig = initialConfig || {};
		this.databases = {};
		this.examples = {}; // loaded examples per database
	}
	getProperty(sProperty: string): ConfigEntryType {
		return this.config[sProperty];
	}
	getStringProperty(sProperty: string): string {
		return this.config[sProperty] as string;
	}
	getBooleanProperty(sProperty: string): boolean {
		return this.config[sProperty] as boolean;
	}
	setProperty(sProperty: string, value: ConfigEntryType): this {
		this.config[sProperty] = value;
		return this;
	}
	getAllProperties(): ConfigType {
		return this.config;
	}
	getAllInitialProperties(): ConfigType {
		return this.initialConfig;
	}

	addDatabases(oDb: DatabasesType): this {
		for (const sPar in oDb) {
			if (oDb.hasOwnProperty(sPar)) {
				const oEntry = oDb[sPar];

				this.databases[sPar] = oEntry;
				this.examples[sPar] = {};
			}
		}
		return this;
	}
	getAllDatabases(): DatabasesType {
		return this.databases;
	}
	getDatabase(): DatabaseEntry {
		const sDatabase = this.getStringProperty("database");

		return this.databases[sDatabase];
	}

	getAllExamples(): {	[x: string]: ExampleEntry; } {
		const sDatabase = this.getStringProperty("database");

		return this.examples[sDatabase];
	}
	getExample(sKey: string): ExampleEntry {
		const sDatabase = this.getStringProperty("database");

		return this.examples[sDatabase][sKey];
	}
	setExample(oExample: ExampleEntry): this {
		const sDatabase = this.getStringProperty("database"),
			sKey = oExample.key;

		if (!this.examples[sDatabase][sKey]) {
			if (Utils.debug > 1) {
				Utils.console.debug("setExample: creating new example:", sKey);
			}
		}
		this.examples[sDatabase][sKey] = oExample;
		return this;
	}
	removeExample(sKey: string): this {
		const sDatabase = this.getStringProperty("database");

		if (!this.examples[sDatabase][sKey]) {
			Utils.console.warn("removeExample: example does not exist: " + sKey);
		}
		delete this.examples[sDatabase][sKey];
		return this;
	}
}
