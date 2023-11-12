// Model.ts - Model (MVC)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/

import { Utils } from "./Utils";
import { ICpcVmRsx } from "./Interfaces";

export type ConfigEntryType = string | number | boolean;

export type ConfigType = Record<string, ConfigEntryType>;

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
	rsx?: ICpcVmRsx
	loaded?: boolean
}

export type DatabasesType = Record<string, DatabaseEntry>;

type ExamplesType = Record<string, Record<string, ExampleEntry>>;

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

	static readonly props = {
		arrayBounds: "arrayBounds",
		autorun: "autorun",
		basicVersion: "basicVersion",
		bench: "bench",
		databaseDirs: "databaseDirs",
		database: "database",
		debug: "debug",
		example: "example",
		exampleIndex: "exampleIndex",
		implicitLines: "implicitLines",
		input: "input",
		kbdLayout: "kbdLayout",
		canvasType: "canvasType",
		palette: "palette",
		processFileImports: "processFileImports",
		showConsoleLog: "showConsoleLog",
		showConvert: "showConvert",
		showCpc: "showCpc",
		showDisass: "showDisass",
		showExport: "showExport",
		showGallery: "showGallery",
		showInput: "showInput",
		showInp2: "showInp2",
		showKbd: "showKbd",
		showKbdSettings: "showKbdSettings",
		showMore: "showMore",
		showOutput: "showOutput",
		showResult: "showResult",
		showSettings: "showSettings",
		showVariable: "showVariable",
		showView: "showView",
		sound: "sound",
		speed: "speed",
		trace: "trace"
	};

	getProperty<T extends ConfigEntryType>(property: string): T {
		return this.config[property] as T;
	}
	setProperty<T extends ConfigEntryType>(property: string, value: T): void {
		this.config[property] = value;
	}
	getAllProperties(): ConfigType {
		return this.config;
	}
	getAllInitialProperties(): ConfigType {
		return this.initialConfig;
	}

	getChangedProperties(): ConfigType {
		const current = this.config,
			initial = this.initialConfig,
			changed: ConfigType = {};

		for (const name in current) {
			if (current.hasOwnProperty(name)) {
				if (current[name] !== initial[name]) {
					changed[name] = current[name];
				}
			}
		}
		return changed;
	}

	addDatabases(db: DatabasesType): void {
		for (const par in db) {
			if (db.hasOwnProperty(par)) {
				const entry = db[par];

				this.databases[par] = entry;
				this.examples[par] = {};
			}
		}
	}
	getAllDatabases(): DatabasesType {
		return this.databases;
	}
	getDatabase(): DatabaseEntry {
		const database = this.getProperty<string>(Model.props.database);

		return this.databases[database];
	}

	getAllExamples(): {	[x: string]: ExampleEntry; } {
		const database = this.getProperty<string>(Model.props.database);

		return this.examples[database];
	}
	getExample(key: string): ExampleEntry {
		const database = this.getProperty<string>(Model.props.database);

		return this.examples[database][key];
	}
	setExample(example: ExampleEntry): void {
		const database = this.getProperty<string>(Model.props.database),
			key = example.key;

		if (!this.examples[database][key]) {
			if (Utils.debug > 1) {
				Utils.console.debug("setExample: creating new example:", key);
			}
		}
		this.examples[database][key] = example;
	}
	removeExample(key: string): void {
		const database = this.getProperty<string>(Model.props.database);

		if (!this.examples[database][key]) {
			Utils.console.warn("removeExample: example does not exist: " + key);
		}
		delete this.examples[database][key];
	}
}
