#!/usr/bin/env node
// Builds every distributable from the single source in src/:
//
//   dist/chrome/   -> Chrome Web Store, Microsoft Edge Add-ons, Opera Add-ons
//   dist/firefox/  -> addons.mozilla.org
//   dist/safari/   -> input for `xcrun safari-web-extension-converter`
//   dist/*.zip     -> upload-ready packages
//   userscript.js + return-youtube-subscribers.user.js (repo root, served by GitHub Pages)
//   store/listings/* -> per-store copy generated from store/listing.json
//
// No dependencies; zips are written with fixed timestamps so the same source
// always produces byte-identical packages (reviewers can verify them).

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync, crc32 } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const r = (...p) => join(root, ...p);
const readJSON = (p) => JSON.parse(readFileSync(r(p), "utf8"));

const pkg = readJSON("package.json");
const listing = readJSON("store/listing.json");
const ext = pkg.extension;
const version = pkg.version;
const slug = "return-youtube-subscribers";

const errors = [];
const limit = (label, text, max) => {
    if ([...text].length > max) errors.push(`${label} is ${[...text].length} chars (max ${max})`);
};

// ---------- manifests ----------

const DEV_FIREFOX_ID = "return-youtube-subscribers@dev.invalid";
if (!ext.firefoxId) {
    console.warn(
        `! package.json extension.firefoxId is empty; using placeholder "${DEV_FIREFOX_ID}" for local builds.\n` +
        "  Copy the add-on's real ID from the AMO Developer Hub before publishing to Firefox."
    );
}

const manifestSource = readFileSync(r("src/manifest.json"), "utf8")
    .replaceAll("__NAME__", ext.name)
    .replaceAll("__SHORT_NAME__", ext.shortName)
    .replaceAll("__DESCRIPTION__", listing.summary)
    .replaceAll("__VERSION__", version)
    .replaceAll("__HOMEPAGE__", listing.urls.homepage)
    .replaceAll("__FIREFOX_ID__", ext.firefoxId || DEV_FIREFOX_ID);

limit("summary (manifest description, Chrome limit)", listing.summary, 132);
if (!/^\d+(\.\d+){0,3}$/.test(version)) errors.push(`version "${version}" is not a valid extension version`);

const targets = {
    chrome(m) {
        delete m.browser_specific_settings;
        return m;
    },
    firefox(m) {
        delete m.browser_specific_settings.safari;
        return m;
    },
    safari(m) {
        delete m.browser_specific_settings.gecko;
        return m;
    },
};

// ---------- zip (store method for PNGs, deflate for text) ----------

function zip(files) {
    const DOS_TIME = 0, DOS_DATE = (1 << 5) | 1 | ((2020 - 1980) << 9); // 2020-01-01 00:00
    const locals = [], centrals = [];
    let offset = 0;
    for (const { name, data } of files) {
        const nameBuf = Buffer.from(name);
        const compress = !name.endsWith(".png");
        const body = compress ? deflateRawSync(data, { level: 9 }) : data;
        const crc = crc32(data);
        const head = Buffer.alloc(30);
        head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6);
        head.writeUInt16LE(compress ? 8 : 0, 8); head.writeUInt16LE(DOS_TIME, 10); head.writeUInt16LE(DOS_DATE, 12);
        head.writeUInt32LE(crc, 14); head.writeUInt32LE(body.length, 18); head.writeUInt32LE(data.length, 22);
        head.writeUInt16LE(nameBuf.length, 26); head.writeUInt16LE(0, 28);
        const cen = Buffer.alloc(46);
        cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8);
        cen.writeUInt16LE(compress ? 8 : 0, 10); cen.writeUInt16LE(DOS_TIME, 12); cen.writeUInt16LE(DOS_DATE, 14);
        cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(body.length, 20); cen.writeUInt32LE(data.length, 24);
        cen.writeUInt16LE(nameBuf.length, 28); cen.writeUInt32LE(offset, 42);
        locals.push(head, nameBuf, body);
        centrals.push(cen, nameBuf);
        offset += 30 + nameBuf.length + body.length;
    }
    const cenSize = centrals.reduce((n, b) => n + b.length, 0);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(cenSize, 12); end.writeUInt32LE(offset, 16);
    return Buffer.concat([...locals, ...centrals, end]);
}

// ---------- extension packages ----------

const mainJs = readFileSync(r("src/main.js"), "utf8");
const icons = readdirSync(r("src/icons")).filter((f) => /^icon-\d+\.png$/.test(f)).sort();

rmSync(r("dist"), { recursive: true, force: true });
for (const [target, transform] of Object.entries(targets)) {
    const manifest = transform(JSON.parse(manifestSource));
    for (const file of Object.values(manifest.icons)) {
        if (!icons.includes(file.replace("icons/", ""))) errors.push(`${target}: missing ${file} (run npm run assets)`);
    }
    const files = [
        { name: "manifest.json", data: Buffer.from(JSON.stringify(manifest, null, 2) + "\n") },
        { name: "main.js", data: Buffer.from(mainJs) },
        ...icons.map((f) => ({ name: `icons/${f}`, data: readFileSync(r("src/icons", f)) })),
    ];
    const dir = r("dist", target);
    mkdirSync(join(dir, "icons"), { recursive: true });
    for (const f of files) writeFileSync(join(dir, f.name), f.data);
    writeFileSync(r("dist", `${slug}-${version}-${target}.zip`), zip(files));
}

// ---------- userscript ----------

const rawBase = "https://raw.githubusercontent.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/main";
const userscript = `// ==UserScript==
// @name         ${ext.name}
// @namespace    ryts.mgcounts.com
// @version      ${version}
// @description  ${listing.summary}
// @author       @ok_aj
// @homepageURL  ${listing.urls.homepage}
// @supportURL   ${listing.urls.support}
// @match        *://*.youtube.com/*
// @icon         ${rawBase}/src/icons/icon-128.png
// @downloadURL  ${rawBase}/${slug}.user.js
// @updateURL    ${rawBase}/${slug}.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==
// Generated from src/main.js by scripts/build.mjs. Do not edit by hand.

${mainJs}`;
// userscript.js is kept for people who installed from the old URL.
writeFileSync(r("userscript.js"), userscript);
writeFileSync(r(`${slug}.user.js`), userscript);
copyFileSync(r(`${slug}.user.js`), r("dist", `${slug}-${version}.user.js`));

// ---------- store listings ----------

const L = listing;
const description = L.description.join("\n");
const shots = L.screenshots.map((s, i) => `${i + 1}. \`store/assets/${s.file}\`: ${s.caption}`).join("\n");
const header = (store) =>
    `<!-- Generated from store/listing.json by scripts/build.mjs. Edit that file, not this one. -->\n# ${store} listing\n\nVersion ${version}. Paste each field into the dashboard as-is.\n`;
const field = (label, value, max) => {
    if (max) limit(`${label}`, value, max);
    const count = max ? ` (${[...value].length}/${max})` : "";
    return `## ${label}${count}\n\n\`\`\`text\n${value}\n\`\`\`\n`;
};
const assetsTable = (rows) =>
    "## Images\n\n| Field | File |\n| --- | --- |\n" + rows.map(([a, b]) => `| ${a} | \`store/assets/${b}\` |`).join("\n") + `\n\nScreenshots, in order:\n\n${shots}\n`;
const linksBlock = `## Links\n\n- Homepage: ${L.urls.homepage}\n- Support: ${L.urls.support}\n- Privacy policy: ${L.urls.privacy}\n`;

limit("AMO summary", L.summary, 250);
limit("Safari subtitle", L.safariSubtitle, 30);
limit("Safari promotional text", L.safariPromotionalText, 170);
limit("Safari keywords", L.keywords.join(","), 100);
limit("Chrome/Edge description", description, 10000);

const listings = {
    "chrome-web-store.md": [
        header("Chrome Web Store"),
        field("Name", L.name, 75),
        field("Summary", L.summary, 132),
        field("Description", description, 16000),
        `## Category\n\n${L.categories.chrome}\n`,
        assetsTable([
            ["Store icon (128x128)", "icon-128.png"],
            ["Small promo tile (440x280)", "promo-small-440x280.png"],
            ["Marquee promo tile (1400x560)", "promo-marquee-1400x560.png"],
            ["Screenshots (1280x800)", "screenshot-*.png"],
        ]),
        "## Privacy practices tab\n",
        field("Single purpose", L.dataDisclosure.singlePurpose),
        field("Host permission justification", L.dataDisclosure.hostPermissionJustification),
        `Data usage: tick only **${L.dataDisclosure.chromeDataTypes.join(", ")}**, then tick all three certifications (not sold, not used for unrelated purposes, not used for creditworthiness).\n\nRemote code: **No**.\n`,
        linksBlock,
    ],
    "edge-add-ons.md": [
        header("Microsoft Edge Add-ons"),
        field("Name", L.name, 45),
        field("Short description", L.summary, 250),
        field("Description", description, 10000),
        `## Category\n\n${L.categories.edge}\n`,
        field("Search terms (max 7)", L.keywords.slice(0, 7).join(", ")),
        assetsTable([
            ["Extension logo (300x300)", "logo-300.png"],
            ["Small promotional tile (440x280)", "promo-small-440x280.png"],
            ["Large promotional tile (1400x560)", "promo-marquee-1400x560.png"],
            ["Screenshots (1280x800)", "screenshot-*.png"],
        ]),
        field("Notes for certification", L.dataDisclosure.reviewerNotes),
        linksBlock,
    ],
    "firefox-amo.md": [
        header("Firefox Add-ons (AMO)"),
        "Name, summary, description, homepage, support URL and category are pushed automatically by the release workflow (`store/listings/amo-metadata.json`). Upload images by hand.\n",
        field("Name", L.name, 50),
        field("Summary", L.summary, 250),
        field("Description", description, 15000),
        `## Category\n\n${L.categories.firefox}\n`,
        assetsTable([
            ["Icon (128x128)", "icon-128.png"],
            ["Screenshots (1280x800)", "screenshot-*.png"],
        ]),
        field("Notes to reviewer", L.dataDisclosure.reviewerNotes),
        linksBlock,
    ],
    "opera-add-ons.md": [
        header("Opera Add-ons"),
        "Upload `dist/return-youtube-subscribers-<version>-chrome.zip`. Opera has no publishing API, so updates are manual.\n",
        field("Name", L.name),
        field("Summary", L.summary),
        field("Description", description),
        `## Category\n\n${L.categories.opera}\n`,
        assetsTable([
            ["Icon (128x128)", "icon-128.png"],
            ["Screenshots (1280x800)", "screenshot-*.png"],
        ]),
        linksBlock,
    ],
    "safari-app-store.md": [
        header("Safari (Mac App Store)"),
        "Builds are uploaded to App Store Connect by `.github/workflows/safari.yml`. Fill these fields in App Store Connect once.\n",
        field("Name", L.name, 30),
        field("Subtitle", L.safariSubtitle, 30),
        field("Promotional text", L.safariPromotionalText, 170),
        field("Description", description, 4000),
        field("Keywords", L.keywords.join(","), 100),
        `## Categories\n\nPrimary: ${L.categories.safariPrimary}. Secondary: ${L.categories.safariSecondary}.\n`,
        assetsTable([
            ["App icon (1024x1024, set by the workflow)", "app-icon-1024.png"],
            ["macOS screenshots (1280x800)", "screenshot-*.png"],
        ]),
        "## App Privacy\n\nData collected: **Browsing History** (the YouTube channel being viewed), not linked to identity, not used for tracking. Purpose: App Functionality.\n",
        field("App Review notes", L.dataDisclosure.reviewerNotes),
        `## URLs\n\n- Marketing URL: ${L.urls.homepage}\n- Support URL: ${L.urls.support}\n- Privacy policy URL: ${L.urls.privacy}\n`,
    ],
};

const amoMetadata = {
    categories: [L.categories.firefox],
    summary: { "en-US": L.summary },
    description: { "en-US": description },
    homepage: { "en-US": L.urls.homepage },
    support_url: { "en-US": L.urls.support },
    version: { approval_notes: L.dataDisclosure.reviewerNotes },
};

if (errors.length) {
    console.error("Build failed:\n  - " + errors.join("\n  - "));
    process.exit(1);
}

mkdirSync(r("store/listings"), { recursive: true });
for (const [file, parts] of Object.entries(listings)) writeFileSync(r("store/listings", file), parts.join("\n"));
writeFileSync(r("store/listings/amo-metadata.json"), JSON.stringify(amoMetadata, null, 2) + "\n");

console.log(`Built v${version}:`);
for (const f of readdirSync(r("dist")).filter((f) => !f.includes("/"))) console.log("  dist/" + f);
