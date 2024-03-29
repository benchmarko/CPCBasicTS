// Model.qunit.ts - QUnit tests for CPCBasic Model
//

import { ModelPropID } from "../Constants";
import { Model } from "../Model";
import { } from "qunit";

QUnit.module("Model: Properties", function (hooks) {
	const that = {} as { model: Model }; // eslint-disable-line consistent-this

	function convId(id: string) {
		return id as ModelPropID;
	}

	hooks.beforeEach(function () {
		const config = {
			p1: "v1"
		};

		that.model = new Model(config);
	});

	QUnit.test("init without options", function (assert) {
		const model = new Model({});

		assert.ok(model, "defined");
	});

	QUnit.test("properties", function (assert) {
		const model = that.model,
			prop1 = convId("p1"),
			prop2 = convId("p2"),
			prop3 = convId("p3");

		that.model.setProperty(prop2, "v2");

		let allProperties = model.getAllInitialProperties();

		assert.strictEqual(Object.keys(allProperties).join(" "), "p1", "all initial properties: p1");

		assert.strictEqual(model.getProperty(prop1), "v1", "p1=v1");
		assert.strictEqual(model.getProperty(prop2), "v2", "p2=v2");
		assert.strictEqual(model.getProperty(convId("")), undefined, "<empty>=undefiend");

		allProperties = model.getAllProperties();
		assert.strictEqual(Object.keys(allProperties).join(" "), "p1 p2", "all properties: p1 p2");
		assert.strictEqual(allProperties.p1, "v1", "p1=v1");
		assert.strictEqual(allProperties.p2, "v2", "p2=v2");

		model.setProperty(prop1, "v1.2");
		assert.strictEqual(model.getProperty(prop1), "v1.2", "p1=v1.2");

		model.setProperty(prop3, "v3");
		assert.strictEqual(model.getProperty(prop3), "v3", "p3=v3");

		allProperties = model.getAllProperties();
		assert.strictEqual(Object.keys(allProperties).join(" "), "p1 p2 p3", "all properties: p1 p2 p3");

		allProperties = model.getAllInitialProperties();
		assert.strictEqual(Object.keys(allProperties).join(" "), "p1", "all initial properties: p1");
	});
});


QUnit.module("Model: Databases", function (hooks) {
	hooks.beforeEach(function () {
		// empty
	});

	QUnit.test("databases", function (assert) {
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

		model.setProperty(ModelPropID.database, "db1");

		assert.strictEqual(model.getDatabase(), exampleDatabases.db1, "databases db1");

		model.setProperty(ModelPropID.database, "db2");

		assert.strictEqual(model.getDatabase(), exampleDatabases.db2, "databases db2");

		model.setProperty(ModelPropID.database, "");

		assert.strictEqual(model.getDatabase(), undefined, "databases undefined");
	});
});


QUnit.module("Model: Examples", function (hooks) {
	const that = {} as { model: Model }; // eslint-disable-line consistent-this

	hooks.beforeEach(function () {
		that.model = new Model({});

		const exampleDatabases = {
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
			};

		that.model.addDatabases(exampleDatabases);
		that.model.setProperty(ModelPropID.database, "db1");
		that.model.setExample(example1);
		that.model.setExample(example2);
	});

	QUnit.test("examples", function (assert) {
		const model = that.model;

		assert.strictEqual(model.getExample("ex1").key, "ex1", "ex1");
		assert.strictEqual(model.getExample("ex2").key, "ex2", "ex2");

		assert.strictEqual(Object.keys(model.getAllExamples()).join(), "ex1,ex2", "two examples: ex1,ex2");
	});
});
// end
