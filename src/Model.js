// Model.js - Model (MVC)
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/

"use strict";

var Utils;

if (typeof require !== "undefined") {
	Utils = require("./Utils.js"); // eslint-disable-line global-require
}

function Model(config, initialConfig) {
	this.init(config, initialConfig);
}

Model.prototype = {
	init: function (config, initialConfig) {
		this.config = config || {}; // store only a reference
		this.initialConfig = initialConfig || {};
		this.databases = {};
		this.examples = {}; // loaded examples per database
	},
	getProperty: function (sProperty) {
		return this.config[sProperty];
	},
	setProperty: function (sProperty, sValue) {
		this.config[sProperty] = sValue;
		return this;
	},
	getAllProperties: function () {
		return this.config;
	},
	getAllInitialProperties: function () {
		return this.initialConfig;
	},

	addDatabases: function (oDb) {
		var sPar, oEntry;

		for (sPar in oDb) {
			if (oDb.hasOwnProperty(sPar)) {
				oEntry = oDb[sPar];
				this.databases[sPar] = oEntry;
				this.examples[sPar] = {};
			}
		}
		return this;
	},
	getAllDatabases: function () {
		return this.databases;
	},
	getDatabase: function () {
		var sDatabase = this.getProperty("database");

		return this.databases[sDatabase];
	},

	getAllExamples: function () {
		var selectedDatabase = this.getProperty("database");

		return this.examples[selectedDatabase];
	},
	getExample: function (sKey) {
		var selectedDatabase = this.getProperty("database");

		return this.examples[selectedDatabase][sKey];
	},
	setExample: function (oExample) {
		var selectedDatabase = this.getProperty("database"),
			sKey = oExample.key;

		if (!this.examples[selectedDatabase][sKey]) {
			if (Utils.debug > 1) {
				Utils.console.debug("setExample: creating new example:", sKey);
			}
		}
		this.examples[selectedDatabase][sKey] = oExample;
		return this;
	},
	removeExample: function (sKey) {
		var selectedDatabase = this.getProperty("database");

		if (!this.examples[selectedDatabase][sKey]) {
			Utils.console.warn("removeExample: example does not exist: " + sKey);
		}
		delete this.examples[selectedDatabase][sKey];
		return this;
	}
};

if (typeof module !== "undefined" && module.exports) {
	module.exports = Model;
}
