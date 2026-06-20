import { ModelPropID } from "./Constants";
import { Controller0 } from "./Controller0";
import type { ConfigEntryType, ConfigType, DatabasesType, ExampleEntry, ICore, ICpcVmRsx, IModel } from "./Interfaces";
import { Model } from "./Model";
import { Utils } from "./Utils";

const ModelPropIDdatabase = "database";
const ModelPropIDexample = "example";
const ModelPropIDdatabaseDirs = "databaseDirs";

type RedirectExamplesType = Record<string, Record<"database" | "example", string>>;

export class Core implements ICore {
	private model: Model;

	constructor(defaultConfig: ConfigType) {
		this.model = new Model(defaultConfig);
	}

	public init() {
		this.initDatabases();
	}

	public getModel(): IModel {
		return this.model;
	}

	public setDebug(debug: number) {
		Utils.setDebug(debug);
	}

	private static getUniqueDbKey(name: string, databases: DatabasesType) {
		let key = name,
			index = 2;

		while (databases[key]) {
			key = name + index;
			index += 1;
		}
		return key;
	}

	private initDatabases() {
		const model = this.model,
			databases: DatabasesType = {},
			databaseDirs = model.getProperty<string>(ModelPropIDdatabaseDirs).split(",");
		//let hasStorageDatabase = false;

		for (const databaseDir of databaseDirs) {
			const parts1 = databaseDir.split("="),
				databaseSrc = parts1[0],
				assignedName = parts1.length > 1 ? parts1[1] : "",
				parts2 = databaseSrc.split("/"),
				name = assignedName || parts2[parts2.length - 1],
				key = Core.getUniqueDbKey(name, databases);

			databases[key] = {
				text: key,
				title: databaseSrc,
				src: databaseSrc
			};
			/* if (databaseDir === "storage") {
				hasStorageDatabase = true;
			}
			*/
		}
		this.model.addDatabases(databases);

		//this.setDatabaseSelectOptions();
		//return hasStorageDatabase;
	}

	private static fnHereDoc(fn: () => void) {
		return String(fn).replace(/^[^/]+\/\*\S*/, "").replace(/\*\/[^/]+$/, "");
	}

	public addIndex = (dir: string, input: Record<string, unknown> | (() => void)): void => { // need property function because we need bound "this"
		if (typeof input === "function") {
			input = {
				[dir]: JSON.parse(Core.fnHereDoc(input).trim())
			};
		}

		for (const value in input) {
			const item = input[value] as ExampleEntry[];

			for (let i = 0; i < item.length; i += 1) {
				this.model.setExample(item[i]);
			}
		}
	};

	public addItem = (key: string, input: string | (() => void)): void => { // need property function because we need bound "this"
		let inputString = typeof input !== "string" ? Core.fnHereDoc(input) : input;
		inputString = inputString.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines

		if (!key) { // maybe ""
			Utils.console.warn("addItem: no key!");
			key = "unknown";
		}

		const implicitLines = this.model.getProperty<boolean>(ModelPropID.implicitLines);
		const linesOnLoad = this.model.getProperty<boolean>(ModelPropID.linesOnLoad);

		if (inputString.startsWith("REM ") && !implicitLines && linesOnLoad) {
			inputString = Controller0.addLineNumbers(inputString);
		}

		const example = this.model.getExample(key);
		if (example) {
			example.script = inputString;
		}
	};

	public addRsx = (key: string, RsxConstructor: new () => ICpcVmRsx): string => {
		const example = this.model.getExample(key);

		example.key = key; // maybe changed
		example.rsx = new RsxConstructor();
		example.loaded = true;
		Utils.console.log("addItem:", key);
		return key;
	};

	public parseArgs(args: string[], config: Record<string, ConfigEntryType>): Record<string, ConfigEntryType> {
		for (const arg of args) {
			const [name, ...valueParts] = arg.split("=");
			const nameType = typeof config[name];

			let value: ConfigEntryType = valueParts.join("=");
			if (value !== undefined) {
				if (nameType === "boolean") {
					value = value === "true";
				} else if (nameType === "number") {
					value = Number(value);
				}
				config[name] = value;
			}
		}
		return config;
	}

	public fnRedirectExamples(redirectExamples: RedirectExamplesType) {
		const model = this.getModel();
		const name = model.getProperty(ModelPropIDdatabase) + "/" + model.getProperty(ModelPropIDexample);

		if (redirectExamples[name]) {
			model.setProperty(ModelPropIDdatabase, redirectExamples[name].database);
			model.setProperty(ModelPropIDexample, redirectExamples[name].example);
		}
	}
}
