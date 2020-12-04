// cpcbasic.js - CPCBasic for the Browser
// (c) Marco Vieth, 2019
// https://benchmarko.github.io/CPCBasic/
//

"use strict";

import { Utils } from "./Utils";
import { Controller } from "./Controller";
import { cpcconfig } from "./cpcconfig";
import { Model } from "./Model";
import { View } from "./View";

declare global {
    interface Window { cpcBasic: any; }
}

var cpcBasic = {
	config: {
		bench: 0, // debug: number of parse bench loops
		debug: 0,
		databaseDirs: "examples", // example base directories (comma separated)
		database: "examples", // examples, apps, saved
		example: "cpcbasic",
		exampleIndex: "0index.js", // example index for every exampleDir
		input: "", // keyboard input when starting the app
		kbdLayout: "alphanum", // alphanum, alpha, num
		showInput: true,
		showInp2: false,
		showCpc: true,
		showKbd: false,
		showKbdLayout: false,
		showOutput: false,
		showResult: false,
		showText: false,
		showVariable: false,
		showConsole: false,
		sound: true,
		tron: false // trace on
	},
	model: null,
	view: null,
	controller: null,

	fnHereDoc: function (fn: () => void) {
		return String(fn).
			replace(/^[^/]+\/\*\S*/, "").
			replace(/\*\/[^/]+$/, "");
	},

	addIndex: function (sDir: string, input: string | (() => void)) {
		if (typeof input !== "string") {
			input = this.fnHereDoc(input);
		}
		return cpcBasic.controller.addIndex(sDir, input);
	},

	addItem: function (sKey: string, input: string | (() => void)) {
		if (typeof input !== "string") {
			input = this.fnHereDoc(input);
		}
		return cpcBasic.controller.addItem(sKey, input);
	},

	// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
	fnParseUri: function (oConfig) {
		const rPlus = /\+/g, // Regex for replacing addition symbol with a space
			rSearch = /([^&=]+)=?([^&]*)/g,
			fnDecode = function (s: string) { return decodeURIComponent(s.replace(rPlus, " ")); },
			sQuery = window.location.search.substring(1);

		let aMatch: RegExpExecArray;
		while ((aMatch = rSearch.exec(sQuery)) !== null) {
			const sName = fnDecode(aMatch[1]);
			let sValue: string | number | boolean = fnDecode(aMatch[2]);
			if (sValue !== null && oConfig.hasOwnProperty(sName)) {
				switch (typeof oConfig[sName]) {
				case "string":
					break;
				case "boolean":
					sValue = (sValue === "true");
					break;
				case "number":
					sValue = Number(sValue);
					break;
				case "object":
					break;
				default:
					break;
				}
			}
			oConfig[sName] = sValue;
		}
	},

	setDebugUtilsConsole: function (sCpcBasicLog: string) {
		const oCurrentConsole = Utils.console,
			oConsole = {
				consoleLog: {
					value: sCpcBasicLog || "" // already something collected?
				},
				console: oCurrentConsole,
				fnMapObjectProperties: function (arg) {
					var aRes, sKey, value;

					if (typeof arg === "object") {
						aRes = [];
						for (sKey in arg) { // eslint-disable-line guard-for-in
							// if (arg.hasOwnProperty(sKey)) {
							value = arg[sKey];
							if (typeof value !== "object" && typeof value !== "function") {
								aRes.push(sKey + ": " + value);
							}
						}
						arg = String(arg) + "{" + aRes.join(", ") + "}";
					}
					return arg;
				},
				rawLog: function (fnMethod, sLevel: string, aArgs) {
					if (sLevel) {
						aArgs.unshift(sLevel);
					}
					if (fnMethod) {
						if (fnMethod.apply) {
							fnMethod.apply(console, aArgs);
						}
					}
					if (this.consoleLog) {
						this.consoleLog.value += aArgs.map(this.fnMapObjectProperties).join(" ") + ((sLevel !== null) ? "\n" : "");
					}
				},
				log: function () {
					this.rawLog(this.console && this.console.log, "", Array.prototype.slice.call(arguments));
				},
				debug: function () {
					this.rawLog(this.console && this.console.debug, "DEBUG:", Array.prototype.slice.call(arguments));
				},
				info: function () {
					this.rawLog(this.console && this.console.info, "INFO:", Array.prototype.slice.call(arguments));
				},
				warn: function () {
					this.rawLog(this.console && this.console.warn, "WARN:", Array.prototype.slice.call(arguments));
				},
				error: function () {
					this.rawLog(this.console && this.console.error, "ERROR:", Array.prototype.slice.call(arguments));
				},
				changeLog: function (oLog) {
					var oldLog = this.consoleLog;

					this.consoleLog = oLog;
					if (oldLog && oldLog.value && oLog) { // some log entires collected?
						oLog.value += oldLog.value; // take collected log entries
					}
				}
			};

		Utils.console = oConsole as any; //TTT
	},

	fnDoStart: function () {
		const that = this,
			oStartConfig = this.config;
		

		Object.assign(oStartConfig, cpcconfig || {}); // merge external config from cpcconfig.js
		const oInitialConfig = Object.assign({}, oStartConfig); // save config
		this.fnParseUri(oStartConfig); // modify config with URL parameters
		this.model = new Model(oStartConfig, oInitialConfig);
		this.view = new View();

		const iDebug = Number(this.model.getProperty("debug"));
		Utils.debug = iDebug;

		let sCpcBasicLog;
		const UtilsConsole = Utils.console as any;
		if (UtilsConsole.cpcBasicLog) {
			sCpcBasicLog = UtilsConsole.cpcBasicLog;
			UtilsConsole.cpcBasicLog = null; // do not log any more to dummy console
		}

		if (Utils.debug > 1 && this.model.getProperty("showConsole")) { // console log window?
			this.setDebugUtilsConsole(sCpcBasicLog);
			Utils.console.log("CPCBasic log started at", Utils.dateFormat(new Date()));
			UtilsConsole.changeLog(document.getElementById("consoleText"));
		}

		that.controller = new Controller(this.model, this.view);
	},

	fnOnLoad: function () {
		Utils.console.log("CPCBasic started at", Utils.dateFormat(new Date()));
		this.fnDoStart();
	}
};


window.cpcBasic = cpcBasic;

//cpcBasic.fnOnLoad(); // if cpcbasic.js is the last script, we do not need to wait for window.onload
window.onload = () => {
    cpcBasic.fnOnLoad();
};
