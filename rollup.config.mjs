import esbuild from "rollup-plugin-esbuild";

const intentionalEvalSources = [
	"src/ui/Polyfills.ts",
	"src/node/NodeUtils.ts",
	"src/node/Headless.ts",
	"src/test/TestNodeUtils.ts",
	"src/test/testParseExamples.qunit.ts"
];

const createConfig = ({ input, file, format, name, external = [], globals = {}, paths = {}, tsconfig = "./src/tsconfig.json" }) => ({
	input,
	output: {
		file,
		format,
		sourcemap: true,
		...(name ? { name } : {}),
		globals,
		paths
	},
	external,
	onwarn(warning, defaultHandler) {
		const source = warning.loc?.file || warning.id || "";
		const isIntentionalEval = warning.code === "EVAL" && intentionalEvalSources.some((file) => source.endsWith(file));

		if (!isIntentionalEval) {
			defaultHandler(warning);
		}
	},
	plugins: [
		esbuild({
			include: /src\/.*\.ts$/,
			target: "es2020",
			tsconfig: tsconfig
		})
	]
});

export default [
	createConfig({
		input: "src/cpcbasic.ts",
		file: "dist/cpcbasic.js",
		format: "umd",
		name: "cpcbasic"
	}),
	createConfig({
		input: "src/ui/UI.ts",
		file: "dist/cpcbasicUI.js",
		format: "umd",
		name: "cpcbasicUI",
		external: (id) => id === "../Engine" || id.endsWith("/src/Engine"),
		globals: (id) => id.endsWith("/src/Engine") ? "cpcbasic" : undefined,
		paths: (id) => id.endsWith("/src/Engine") ? "./cpcbasic.js" : id,
		tsconfig: "./src/ui/tsconfig.json"
	}),
	createConfig({
		input: "src/test/main.ts",
		file: "dist/test-bundle.js",
		format: "iife",
		tsconfig: "./src/test/tsconfig.json"
	})
];
