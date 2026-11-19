//import { ModelPropID } from "./Constants";
import { BasicFormatter } from "./BasicFormatter";
import type { AddItemInput, ConfigType, DatabasesType, ExampleEntry, ExampleImplementation, ICore, ICpcVmRsx, IModel } from "./Interfaces";
import { Model } from "./Model";
import { Utils } from "./Utils";

const ModelPropIDdatabase = "database";
const ModelPropIDexample = "example";

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
			databaseDirs = model.getAllProperties().databaseDirs.split(",");
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
				[dir]: JSON.parse(Core.fnHereDoc(input).trim()) as unknown
			};
		}

		for (const value in input) {
			const item = input[value] as ExampleEntry[];

			for (let i = 0; i < item.length; i += 1) {
				this.model.setExample(item[i]);
			}
		}
	};

	public addItem = (key: string, input: string | (() => void) | AddItemInput): void => { // need property function because we need bound "this"
		if (!key) { // maybe ""
			Utils.console.warn("addItem: no key!");
			key = "unknown";
		}

		const example = this.model.getExample(key);
		if (example) {
			if (typeof input === "object") {
				const implementations = input.implementations.map((implementation): ExampleImplementation => ({
					id: implementation.id,
					title: implementation.title,
					script: this.prepareInput(implementation.source)
				}));
				example.implementations = implementations;
				const requestedImplementation = this.model.getAllProperties().implementation;
				const defaultImplementation = Core.getDefaultImplementation(implementations, requestedImplementation || input.defaultImplementation);
				example.implementation = defaultImplementation.id;
				example.script = defaultImplementation.script;
			} else {
				example.script = this.prepareInput(input);
			}
		}
	};

	private prepareInput(input: string | (() => void)): string {
		let inputString = typeof input !== "string" ? Core.fnHereDoc(input) : input;
		inputString = inputString.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines

		const { implicitLines, linesOnLoad } = this.model.getAllProperties();
		if (inputString.startsWith("REM ") && !implicitLines && linesOnLoad) {
			inputString = BasicFormatter.addLineNumbers(inputString);
		}
		return inputString;
	}

	private static getDefaultImplementation(implementations: ExampleImplementation[], defaultId?: string): ExampleImplementation {
		const implementation = defaultId ? implementations.find((item) => item.id === defaultId) : implementations[0];
		if (!implementation) {
			throw new Error("addItem: no implementations supplied or default implementation not found");
		}
		return implementation;
	}

	public addRsx = (key: string, RsxConstructor: new () => ICpcVmRsx): string => {
		const example = this.model.getExample(key);

		example.key = key; // maybe changed
		example.rsx = new RsxConstructor();
		example.loaded = true;
		Utils.console.log("addItem:", key);
		return key;
	};

	public parseArgs(args: string[], config: Record<string, ConfigType[keyof ConfigType]>): void {
		for (const arg of args) {
			const [name, ...valueParts] = arg.split("=");
			const nameType = typeof config[name];

			const rawValue = valueParts.join("=");
			let value: ConfigType[keyof ConfigType];
			if (nameType === "number") {
				value = Number(rawValue);
			} else if (nameType === "boolean") {
				value = rawValue === "true";
			} else {
				value = rawValue;
			}
			config[name] = value;
		}
	}

	public fnRedirectExamples(redirectExamples: RedirectExamplesType) {
		const model = this.getModel();
		const name = model.getAllProperties().database + "/" + model.getAllProperties().example;

		if (redirectExamples[name]) {
			model.setProperty(ModelPropIDdatabase, redirectExamples[name].database);
			model.setProperty(ModelPropIDexample, redirectExamples[name].example);
		}
	}
}
