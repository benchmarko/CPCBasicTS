/* eslint-disable one-var */
const fs = require("fs"); // eslint-disable-line @typescript-eslint/no-var-requires
const path = require("path"); // eslint-disable-line @typescript-eslint/no-var-requires
const packageJson = require("./package.json"); // eslint-disable-line @typescript-eslint/no-var-requires

try {
	// Read the version from package.json
	const version = packageJson.version;

	// Path to the index.html file
	const indexPath = path.join(__dirname, "src", "index.html");

	// Read the index.html file
	let indexHtml = fs.readFileSync(indexPath, "utf8"); // eslint-disable-line no-sync

	// Replace the version in the title tag
	indexHtml = indexHtml.replace(/(<title id="title">CPCBasicTS v)([\d.]+)(<\/title>)/, `$1${version}$3`);

	// Write the updated index.html file
	fs.writeFileSync(indexPath, indexHtml, "utf8"); // eslint-disable-line no-sync

	console.log(`Updated index.html to version ${version}`);
} catch (error) {
	console.error("Error updating index.html:", error);
}
/* eslint-enable one-var */
