import esbuild from "rollup-plugin-esbuild";

const createConfig = ({ input, file, format, name, external = [] }) => ({
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
			tsconfig: "./src/tsconfig.json"
		})
	]
});

export default [
	createConfig({
		input: "src/core/main.ts",
		file: "dist/cpcbasic-core.js",
		format: "umd",
		name: "cpcbasicCore"
	}),
	createConfig({
		input: "src/ui/main.ts",
		file: "dist/cpcbasic-ui.js",
		format: "umd",
		name: "cpcbasicUI"
	}),
	createConfig({
		input: "src/ui/bootstrap.ts",
		file: "dist/cpcbasic-ui-bootstrap.js",
		format: "umd",
		name: "cpcbasicUIBootstrap"
	}),
	createConfig({
		input: "src/node/main.ts",
		file: "dist/cpcbasic-node.js",
		format: "cjs",
		external: ["fs", "https", "module"]
	}),
	createConfig({
		input: "src/node/bootstrap.ts",
		file: "dist/cpcbasic-node-bootstrap.js",
		format: "cjs",
		external: ["fs", "https", "module"]
	}),
	createConfig({
		input: "src/test/main.ts",
		file: "dist/test-bundle.js",
		format: "iife"
	})
];
