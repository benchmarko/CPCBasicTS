import { Controller0 } from "./Controller0";
import { Model } from "./Model";
import { Utils } from "./Utils";
const ModelPropIDdatabase = "database";
const ModelPropIDexample = "example";
const ModelPropIDdatabaseDirs = "databaseDirs";
export class Core {
    constructor(defaultConfig) {
        this.addIndex = (dir, input) => {
            if (typeof input === "function") {
                input = {
                    [dir]: JSON.parse(Core.fnHereDoc(input).trim())
                };
            }
            for (const value in input) {
                const item = input[value];
                for (let i = 0; i < item.length; i += 1) {
                    this.model.setExample(item[i]);
                }
            }
        };
        this.addItem = (key, input) => {
            let inputString = typeof input !== "string" ? Core.fnHereDoc(input) : input;
            inputString = inputString.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
            if (!key) { // maybe ""
                Utils.console.warn("addItem: no key!");
                key = "unknown";
            }
            const implicitLines = this.model.getProperty("implicitLines" /* ModelPropID.implicitLines */);
            const linesOnLoad = this.model.getProperty("linesOnLoad" /* ModelPropID.linesOnLoad */);
            if (inputString.startsWith("REM ") && !implicitLines && linesOnLoad) {
                inputString = Controller0.addLineNumbers(inputString);
            }
            const example = this.model.getExample(key);
            if (example) {
                example.script = inputString;
            }
        };
        this.addRsx = (key, RsxConstructor) => {
            const example = this.model.getExample(key);
            example.key = key; // maybe changed
            example.rsx = new RsxConstructor();
            example.loaded = true;
            Utils.console.log("addItem:", key);
            return key;
        };
        this.model = new Model(defaultConfig);
    }
    init() {
        this.initDatabases();
    }
    getModel() {
        return this.model;
    }
    setDebug(debug) {
        Utils.setDebug(debug);
    }
    static getUniqueDbKey(name, databases) {
        let key = name, index = 2;
        while (databases[key]) {
            key = name + index;
            index += 1;
        }
        return key;
    }
    initDatabases() {
        const model = this.model, databases = {}, databaseDirs = model.getProperty(ModelPropIDdatabaseDirs).split(",");
        //let hasStorageDatabase = false;
        for (const databaseDir of databaseDirs) {
            const parts1 = databaseDir.split("="), databaseSrc = parts1[0], assignedName = parts1.length > 1 ? parts1[1] : "", parts2 = databaseSrc.split("/"), name = assignedName || parts2[parts2.length - 1], key = Core.getUniqueDbKey(name, databases);
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
    static fnHereDoc(fn) {
        return String(fn).replace(/^[^/]+\/\*\S*/, "").replace(/\*\/[^/]+$/, "");
    }
    parseArgs(args, config) {
        for (const arg of args) {
            const [name, ...valueParts] = arg.split("=");
            const nameType = typeof config[name];
            let value = valueParts.join("=");
            if (value !== undefined) {
                if (nameType === "boolean") {
                    value = value === "true";
                }
                else if (nameType === "number") {
                    value = Number(value);
                }
                config[name] = value;
            }
        }
        return config;
    }
    fnRedirectExamples(redirectExamples) {
        const model = this.getModel();
        const name = model.getProperty(ModelPropIDdatabase) + "/" + model.getProperty(ModelPropIDexample);
        if (redirectExamples[name]) {
            model.setProperty(ModelPropIDdatabase, redirectExamples[name].database);
            model.setProperty(ModelPropIDexample, redirectExamples[name].example);
        }
    }
}
//# sourceMappingURL=Core.js.map