// Model.ts - Model (MVC)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasicTS/
define(["require", "exports", "./Utils"], function (require, exports, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Model = void 0;
    var Model = /** @class */ (function () {
        function Model(config) {
            this.config = config || {}; // store only a reference
            this.initialConfig = Object.assign({}, this.config); // save initial config
            this.databases = {};
            this.examples = {}; // loaded examples per database
        }
        Model.prototype.getProperty = function (property) {
            return this.config[property];
        };
        Model.prototype.setProperty = function (property, value) {
            this.config[property] = value;
        };
        Model.prototype.getAllProperties = function () {
            return this.config;
        };
        Model.prototype.getAllInitialProperties = function () {
            return this.initialConfig;
        };
        Model.prototype.getChangedProperties = function () {
            var current = this.config, initial = this.initialConfig, changed = {};
            for (var name_1 in current) {
                if (current.hasOwnProperty(name_1)) {
                    if (current[name_1] !== initial[name_1]) {
                        changed[name_1] = current[name_1];
                    }
                }
            }
            return changed;
        };
        Model.prototype.addDatabases = function (db) {
            for (var par in db) {
                if (db.hasOwnProperty(par)) {
                    var entry = db[par];
                    this.databases[par] = entry;
                    this.examples[par] = {};
                }
            }
        };
        Model.prototype.getAllDatabases = function () {
            return this.databases;
        };
        Model.prototype.getDatabase = function () {
            var database = this.getProperty(Model.props.database);
            return this.databases[database];
        };
        Model.prototype.getAllExamples = function () {
            var database = this.getProperty(Model.props.database);
            return this.examples[database];
        };
        Model.prototype.getExample = function (key) {
            var database = this.getProperty(Model.props.database);
            return this.examples[database][key];
        };
        Model.prototype.setExample = function (example) {
            var database = this.getProperty(Model.props.database), key = example.key;
            if (!this.examples[database][key]) {
                if (Utils_1.Utils.debug > 1) {
                    Utils_1.Utils.console.debug("setExample: creating new example:", key);
                }
            }
            this.examples[database][key] = example;
        };
        Model.prototype.removeExample = function (key) {
            var database = this.getProperty(Model.props.database);
            if (!this.examples[database][key]) {
                Utils_1.Utils.console.warn("removeExample: example does not exist: " + key);
            }
            delete this.examples[database][key];
        };
        Model.props = {
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
        return Model;
    }());
    exports.Model = Model;
});
//# sourceMappingURL=Model.js.map