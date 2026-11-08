#!/usr/bin/env node
// Prints the CHANGELOG.md section for a version (default: package.json version).
//   node scripts/release-notes.mjs [version] [--amo <out.json>]
// With --amo, also writes store/listings/amo-metadata.json plus these notes as
// the AMO version's release notes, for `web-ext sign --amo-metadata`.

import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const amoIndex = args.indexOf("--amo");
const amoOut = amoIndex >= 0 ? args.splice(amoIndex, 2)[1] : null;
const version = args[0] || JSON.parse(readFileSync("package.json", "utf8")).version;

const changelog = readFileSync("CHANGELOG.md", "utf8");
const escaped = version.replace(/\./g, "\\.");
const match = changelog.match(new RegExp(`^## ${escaped}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
if (!match || !match[1].trim()) {
    console.error(`CHANGELOG.md has no "## ${version}" section. Add one before releasing.`);
    process.exit(1);
}
const notes = match[1].trim();

if (amoOut) {
    const meta = JSON.parse(readFileSync("store/listings/amo-metadata.json", "utf8"));
    meta.version = { ...meta.version, release_notes: { "en-US": notes } };
    writeFileSync(amoOut, JSON.stringify(meta, null, 2) + "\n");
}
console.log(notes);
