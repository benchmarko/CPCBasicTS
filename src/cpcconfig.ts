/* cpcconfig.ts - configuration file for CPCBasicTS */

export const cpcconfig = { // eslint-disable-line no-unused-vars
	//databaseDirs: "./examples,https://benchmarko.github.io/CPCBasicApps/apps,storage",
	databaseDirs: "./examples,../../CPCBasicApps/apps,storage", // local test

	// just an example, not the full list of moved examples...
	redirectExamples: {
		"examples/art": {
			database: "apps",
			example: "demo/art"
		},
		"examples/blkedit": {
			database: "apps",
			example: "apps/blkedit"
		}
	}
};
