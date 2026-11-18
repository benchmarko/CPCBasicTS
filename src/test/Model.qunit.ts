// Model.qunit.ts - QUnit tests for CPCBasic Model
//

//import { ModelPropID } from "../Constants";
import { ConfigType } from "../Interfaces";
import { Model } from "../Model";
import { } from "qunit";

QUnit.module("Model: Properties", function (hooks) {
	const that = {} as { model: Model }; // eslint-disable-line consistent-this

	/*
	function convId(id: string) {
		return id as unknown as ModelPropID;
	}
	*/

	hooks.beforeEach(function () {
		const config = {
			example: "example1"
			//debug: 0,
			//trace: false
		} as ConfigType;

		that.model = new Model(config);
	});

	QUnit.test("init without options", function (assert) {
		const model = new Model({} as ConfigType);

		assert.ok(model, "defined");
	});

	QUnit.test("properties", function (assert) {
		const model = that.model;

		that.model.setProperty("debug", 3);
		
		const allInitialProperties = model.getAllInitialProperties();
		assert.strictEqual(Object.keys(allInitialProperties).join(" "), "example", "all initial properties: example");

		that.model.setProperty("trace", false);

		assert.strictEqual(model.getAllProperties().example, "example1", "example=example1");
		assert.strictEqual(model.getAllProperties().debug, 3, "debug=3");
		assert.strictEqual(model.getAllProperties().trace, false, "trace=false");
		//assert.strictEqual(model.getProperty(convId("")), undefined, "<empty>=undefiend");

		model.setProperty("example", "example2");
		assert.strictEqual(model.getAllProperties().example, "example2", "example=example2");

		model.setProperty("trace", true);
		assert.strictEqual(model.getAllProperties().trace, true, "trace=true");

		const allProperties = model.getAllProperties();
		assert.strictEqual(Object.keys(allProperties).join(" "), "example debug trace", "all properties: example debug trace");

		const allInitialProperties2 = model.getAllInitialProperties();
		assert.strictEqual(Object.keys(allInitialProperties2).join(" "), "example", "all initial properties: example");
	});

	QUnit.test("property change callback", function (assert) {
		const model = that.model
		let changes = 0;

		model.setPropertyChangeCallback(() => {
			changes += 1;
		});
		model.setProperty("example", "example1");
		assert.strictEqual(changes, 0, "unchanged property");

		model.setProperty("example", "example2");
		assert.strictEqual(changes, 1, "changed property");
	});
});


QUnit.module("Model: Databases", function (hooks) {
	hooks.beforeEach(function () {
		// empty
	});

	QUnit.test("databases", function (assert) {
		const model = new Model({} as ConfigType),
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


QUnit.module("Model: Examples", function (hooks) {
	const that = {} as { model: Model }; // eslint-disable-line consistent-this

	hooks.beforeEach(function () {
		that.model = new Model({} as ConfigType);

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
		that.model.setProperty("database", "db1");
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
