// Model.qunit.ts - QUnit tests for CPCBasic Model
//

import { Model } from "../Model";
import {} from "qunit";

QUnit.module("Model: Properties", function (hooks: NestedHooks) {
	hooks.beforeEach(function (this: any) {
		const that = this, // eslint-disable-line no-invalid-this, @typescript-eslint/no-this-alias
			config = {
				p1: "v1"
			};

		that.model = new Model(config);
		that.model.setProperty("p2", "v2");
	});

	QUnit.test("init without options", function (assert: Assert) {
		const model = new Model({});

		assert.ok(model, "defined");
	});

	QUnit.test("properties", function (this: any, assert: Assert) {
		const model = this.model; // eslint-disable-line no-invalid-this

		let allProperties = model.getAllInitialProperties();

		assert.strictEqual(Object.keys(allProperties).join(" "), "p1", "all initial properties: p1");

		assert.strictEqual(model.getProperty("p1"), "v1", "p1=v1");
		assert.strictEqual(model.getProperty("p2"), "v2", "p2=v2");
		assert.strictEqual(model.getProperty(""), undefined, "<empty>=undefiend");

		allProperties = model.getAllProperties();
		assert.strictEqual(Object.keys(allProperties).join(" "), "p1 p2", "all properties: p1 p2");
		assert.strictEqual(allProperties.p1, "v1", "p1=v1");
		assert.strictEqual(allProperties.p2, "v2", "p2=v2");

		model.setProperty("p1", "v1.2");
		assert.strictEqual(model.getProperty("p1"), "v1.2", "p1=v1.2");

		model.setProperty("p3", "v3");
		assert.strictEqual(model.getProperty("p3"), "v3", "p3=v3");

		allProperties = model.getAllProperties();
		assert.strictEqual(Object.keys(allProperties).join(" "), "p1 p2 p3", "all properties: p1 p2 p3");

		allProperties = model.getAllInitialProperties();
		assert.strictEqual(Object.keys(allProperties).join(" "), "p1", "all initial properties: p1");
	});
});


QUnit.module("Model: Databases", function (hooks: NestedHooks) {
	hooks.beforeEach(function () {
		// empty
	});

	QUnit.test("databases", function (assert: Assert) {
		const model = new Model({}),
			exampleDatabases = {
				db1: {
					text: "text1",
					title: "title1",
					src: "src1"
				},
				db2: {
					text: "text1",
					title: "title2",
					src: ""
				}
			},
			databases = model.getAllDatabases();

		assert.strictEqual(Object.keys(databases).length, 0, "no databases");

		model.addDatabases(exampleDatabases);

		assert.strictEqual(Object.keys(databases).join(" "), "db1 db2", "two databases: db1, db2");

		model.setProperty("database", "db1");

		assert.strictEqual(model.getDatabase(), exampleDatabases.db1, "databases db1");

		model.setProperty("database", "db2");

		assert.strictEqual(model.getDatabase(), exampleDatabases.db2, "databases db2");

		model.setProperty("database", "");

		assert.strictEqual(model.getDatabase(), undefined, "databases undefined");
	});
});


QUnit.module("Model: Examples", function (hooks: NestedHooks) {
	hooks.beforeEach(function (this: any) {
		const that = this, // eslint-disable-line no-invalid-this, @typescript-eslint/no-this-alias
			exampleDatabases = {
				db1: {
					text: "db1Text",
					title: "db1Title",
					src: "db1Src"
				},
				db2: {
					text: "db2text",
					title: "",
					src: ""
				}
			},
			example1 = {
				key: "ex1",
				title: "ex1",
				type: "",
				meta: ""
			},
			example2 = {
				key: "ex2",
				title: "ex2",
				type: "",
				meta: ""
			},
			model = new Model({});

		model.addDatabases(exampleDatabases);
		model.setProperty("database", "db1");
		model.setExample(example1);
		model.setExample(example2);
		that.model = model;
	});

	QUnit.test("examples", function (this: any, assert: Assert) {
		const model = this.model; // eslint-disable-line no-invalid-this

		assert.strictEqual(model.getExample("ex1").key, "ex1", "ex1");
		assert.strictEqual(model.getExample("ex2").key, "ex2", "ex2");

		assert.strictEqual(Object.keys(model.getAllExamples()).join(), "ex1,ex2", "two examples: ex1,ex2");
	});
});
// end
