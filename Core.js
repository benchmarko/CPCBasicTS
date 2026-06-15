import { Model } from "./Model";
import { Utils } from "./Utils";
var ModelPropIDdatabase = "database";
var ModelPropIDexample = "example";
var ModelPropIDdatabaseDirs = "databaseDirs";
var Core = /** @class */ (function () {
    function Core(defaultConfig) {
        var _this = this;
        this.addIndex = function (dir, input) {
            var _a;
            if (typeof input === "function") {
                input = (_a = {},
                    _a[dir] = JSON.parse(Core.fnHereDoc(input).trim()),
                    _a);
            }
            for (var value in input) {
                var item = input[value];
                for (var i = 0; i < item.length; i += 1) {
                    _this.model.setExample(item[i]);
                }
            }
        };
        this.addItem = function (key, input) {
            var inputString = typeof input !== "string" ? Core.fnHereDoc(input) : input;
            inputString = inputString.replace(/^\n/, "").replace(/\n$/, ""); // remove preceding and trailing newlines
            if (!key) { // maybe ""
                console.warn("addItem: no key!");
                key = "unknown";
            }
            var example = _this.model.getExample(key);
            if (example) {
                example.script = inputString;
            }
        };
        this.addRsx = function (key, RsxConstructor) {
            if (!key) { // maybe ""
                key = (document.currentScript && document.currentScript.getAttribute("data-key")) || _this.model.getProperty(ModelPropIDexample);
                // on IE we can just get the current example
            }
            var example = _this.model.getExample(key);
            example.key = key; // maybe changed
            example.rsx = new RsxConstructor();
            example.loaded = true;
            console.log("addItem:", key);
            return key;
        };
        this.model = new Model(defaultConfig);
    }
    Core.prototype.init = function () {
        this.initDatabases();
    };
    Core.prototype.getModel = function () {
        return this.model;
    };
    Core.prototype.setDebug = function (debug) {
        Utils.setDebug(debug);
    };
    Core.getUniqueDbKey = function (name, databases) {
        var key = name, index = 2;
        while (databases[key]) {
            key = name + index;
            index += 1;
        }
        return key;
    };
    Core.prototype.initDatabases = function () {
        var model = this.model, databases = {}, databaseDirs = model.getProperty(ModelPropIDdatabaseDirs).split(",");
        //let hasStorageDatabase = false;
        for (var _i = 0, databaseDirs_1 = databaseDirs; _i < databaseDirs_1.length; _i++) {
            var databaseDir = databaseDirs_1[_i];
            var parts1 = databaseDir.split("="), databaseSrc = parts1[0], assignedName = parts1.length > 1 ? parts1[1] : "", parts2 = databaseSrc.split("/"), name_1 = assignedName || parts2[parts2.length - 1], key = Core.getUniqueDbKey(name_1, databases);
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
    };
    Core.fnHereDoc = function (fn) {
        return String(fn).replace(/^[^/]+\/\*\S*/, "").replace(/\*\/[^/]+$/, "");
    };
    Core.prototype.parseArgs = function (args, config) {
        for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
            var arg = args_1[_i];
            var _a = arg.split("="), name_2 = _a[0], valueParts = _a.slice(1);
            var nameType = typeof config[name_2];
            var value = valueParts.join("=");
            if (value !== undefined) {
                if (nameType === "boolean") {
                    value = value === "true";
                }
                else if (nameType === "number") {
                    value = Number(value);
                }
                config[name_2] = value;
            }
        }
        return config;
    };
    Core.prototype.fnRedirectExamples = function (redirectExamples) {
        var model = this.getModel();
        var name = model.getProperty(ModelPropIDdatabase) + "/" + model.getProperty(ModelPropIDexample);
        if (redirectExamples[name]) {
            model.setProperty(ModelPropIDdatabase, redirectExamples[name].database);
            model.setProperty(ModelPropIDexample, redirectExamples[name].example);
        }
    };
    return Core;
}());
export { Core };
//# sourceMappingURL=Core.js.map