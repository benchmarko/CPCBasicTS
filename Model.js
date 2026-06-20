// Model.ts - Model (MVC)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
import { Utils } from "./Utils";
const ModelPropIDdatabase = "database"; //TODO
export class Model {
    constructor(config) {
        this.config = config || {}; // store only a reference
        this.initialConfig = Object.assign({}, this.config); // save initial config
        this.databases = {};
        this.examples = {}; // loaded examples per database
    }
    // {
    getProperty(property) {
        return this.config[property]; // keyof ConfigType?
    }
    setProperty(property, value) {
        this.config[property] = value;
    }
    getAllProperties() {
        return this.config;
    }
    getAllInitialProperties() {
        return this.initialConfig;
    }
    getChangedProperties() {
        const current = this.config, initial = this.initialConfig, changed = {};
        for (const name in current) {
            if (current.hasOwnProperty(name)) {
                if (current[name] !== initial[name]) {
                    changed[name] = current[name];
                }
            }
        }
        return changed;
    }
    addDatabases(db) {
        for (const par in db) {
            if (db.hasOwnProperty(par)) {
                const entry = db[par];
                this.databases[par] = entry;
                this.examples[par] = {};
            }
        }
    }
    getAllDatabases() {
        return this.databases;
    }
    getDatabase() {
        const database = this.getProperty(ModelPropIDdatabase);
        return this.databases[database];
    }
    getAllExamples() {
        const database = this.getProperty(ModelPropIDdatabase);
        return this.examples[database];
    }
    getExample(key) {
        const database = this.getProperty(ModelPropIDdatabase);
        return this.examples[database][key];
    }
    setExample(example) {
        const database = this.getProperty(ModelPropIDdatabase), key = example.key;
        if (!this.examples[database][key]) {
            if (Utils.debug > 1) {
                Utils.console.debug("setExample: creating new example:", key);
            }
        }
        this.examples[database][key] = example;
    }
    removeExample(key) {
        const database = this.getProperty(ModelPropIDdatabase);
        if (!this.examples[database][key]) {
            Utils.console.warn("removeExample: example does not exist: " + key);
        }
        delete this.examples[database][key];
    }
}
//# sourceMappingURL=Model.js.map