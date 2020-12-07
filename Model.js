"use strict";
// Model.js - Model (MVC)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
var Utils_1 = require("./Utils");
var Model = /** @class */ (function () {
    function Model(config, initialConfig) {
        this.init(config, initialConfig);
    }
    Model.prototype.init = function (config, initialConfig) {
        this.config = config || {}; // store only a reference
        this.initialConfig = initialConfig || {};
        this.databases = {};
        this.examples = {}; // loaded examples per database
    };
    Model.prototype.getProperty = function (sProperty) {
        return this.config[sProperty];
    };
    Model.prototype.getStringProperty = function (sProperty) {
        return this.config[sProperty];
    };
    Model.prototype.getBooleanProperty = function (sProperty) {
        return this.config[sProperty];
    };
    Model.prototype.setProperty = function (sProperty, value) {
        this.config[sProperty] = value;
        return this;
    };
    Model.prototype.getAllProperties = function () {
        return this.config;
    };
    Model.prototype.getAllInitialProperties = function () {
        return this.initialConfig;
    };
    Model.prototype.addDatabases = function (oDb) {
        for (var sPar in oDb) {
            if (oDb.hasOwnProperty(sPar)) {
                var oEntry = oDb[sPar];
                this.databases[sPar] = oEntry;
                this.examples[sPar] = {};
            }
        }
        return this;
    };
    Model.prototype.getAllDatabases = function () {
        return this.databases;
    };
    Model.prototype.getDatabase = function () {
        var sDatabase = this.getStringProperty("database");
        return this.databases[sDatabase];
    };
    Model.prototype.getAllExamples = function () {
        var sDatabase = this.getStringProperty("database");
        return this.examples[sDatabase];
    };
    Model.prototype.getExample = function (sKey) {
        var sDatabase = this.getStringProperty("database");
        return this.examples[sDatabase][sKey];
    };
    Model.prototype.setExample = function (oExample) {
        var sDatabase = this.getStringProperty("database"), sKey = oExample.key;
        if (!this.examples[sDatabase][sKey]) {
            if (Utils_1.Utils.debug > 1) {
                Utils_1.Utils.console.debug("setExample: creating new example:", sKey);
            }
        }
        this.examples[sDatabase][sKey] = oExample;
        return this;
    };
    Model.prototype.removeExample = function (sKey) {
        var sDatabase = this.getStringProperty("database");
        if (!this.examples[sDatabase][sKey]) {
            Utils_1.Utils.console.warn("removeExample: example does not exist: " + sKey);
        }
        delete this.examples[sDatabase][sKey];
        return this;
    };
    return Model;
}());
exports.Model = Model;
//# sourceMappingURL=Model.js.map