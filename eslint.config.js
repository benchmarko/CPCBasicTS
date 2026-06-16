const js = require("@eslint/js");
const globals = require("globals");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
	{
		ignores: [
			"dist/**",
			"node_modules/**",
			"package.json",
			"package-lock.json",
			"lint*.txt"
		],
		linterOptions: {
			reportUnusedDisableDirectives: "off"
		}
	},
	js.configs.recommended,
	...tsPlugin.configs["flat/recommended"],
	...tsPlugin.configs["flat/strict"],
	...tsPlugin.configs["flat/stylistic"],
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2018,
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021
			}
		},
		rules: {
			"@typescript-eslint/consistent-type-definitions": "off",
			"@typescript-eslint/consistent-indexed-object-style": "off",
			"@typescript-eslint/no-dynamic-delete": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_"
				}
			],
			"@typescript-eslint/no-extraneous-class": "off",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-invalid-void-type": "off",
			"@typescript-eslint/no-non-null-assertion": "warn",
			"@typescript-eslint/no-this-alias": "warn",
			"@typescript-eslint/prefer-for-of": "off",
			"complexity": "warn",
			"eqeqeq": "error",
			"curly": "error",
			"no-prototype-builtins": "off",
			"no-eval": "error",
			"no-implied-eval": "error",
			"no-process-env": "error",
			"no-process-exit": "error",
			"no-var": "off",
			"no-useless-assignment": "off",
			"no-warning-comments": "warn",
			"prefer-rest-params": "off",
			"prefer-spread": "off",
			"max-depth": "warn"
		}
	},
	{
		files: ["src/Polyfills.ts"],
		rules: {
			"@typescript-eslint/no-wrapper-object-types": "off"
		}
	}
];