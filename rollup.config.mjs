import esbuild from "rollup-plugin-esbuild";

const createConfig = ({ input, file, format, name, external = [], tsconfig = "./src/tsconfig.json" }) => ({
	input,
	output: {
		file,
		format,
		sourcemap: true,
		...(name ? { name } : {})
	},
	external,
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
		input: "src/core/main.ts",
		file: "dist/cpcbasic-core.js",
		format: "umd",
		name: "cpcbasicCore",
		tsconfig: "./src/core/tsconfig.json"
	}),
	createConfig({
		input: "src/ui/main.ts",
		file: "dist/cpcbasic-ui.js",
		format: "umd",
		name: "cpcbasicUI",
		tsconfig: "./src/ui/tsconfig.json"
	}),
	createConfig({
		input: "src/ui/bootstrap.ts",
		file: "dist/cpcbasic-ui-bootstrap.js",
		format: "umd",
		name: "cpcbasicUIBootstrap",
		tsconfig: "./src/ui/tsconfig.json"
	}),
	createConfig({
		input: "src/node/main.ts",
		file: "dist/cpcbasic-node.js",
		format: "cjs",
		external: ["fs", "https", "module"],
		tsconfig: "./src/node/tsconfig.json"
	}),
	createConfig({
		input: "src/node/bootstrap.ts",
		file: "dist/cpcbasic-node-bootstrap.js",
		format: "cjs",
		external: ["fs", "https", "module"],
		tsconfig: "./src/node/tsconfig.json"
	}),
	createConfig({
		input: "src/test/main.ts",
		file: "dist/test-bundle.js",
		format: "iife",
		tsconfig: "./src/test/tsconfig.json"
	})
];
