/* globals console, URL */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
//import { URL } from 'url';

// Read the version from package.json
import packageConfig from './package.json' with { type: 'json' }; 
const version = packageConfig.version;

// Path to the index.html file
const indexPath = new URL(join('dist', 'index.html'), import.meta.url);

// Read the index.html file
let indexHtml = readFileSync(indexPath, 'utf8');

// Replace the version in the title tag
indexHtml = indexHtml.replace(/(<title id="title">CPCBasicTS v)([\d.]+)(<\/title>)/, `$1${version}$3`);

// Write the updated index.html file
writeFileSync(indexPath, indexHtml, 'utf8');

console.log(`Updated index.html to version ${version}`);
