#!/usr/bin/env node
// Renders every image (extension icons, store icons, screenshots, promo tiles,
// social card, website images) from branding/*.svg and store/templates/scenes.html.
// Needs Playwright with Chromium and the Inter font installed. Outputs are
// committed, so CI never needs to run this.
//
//   npm run assets

import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// createRequire so a globally installed Playwright (NODE_PATH) also works.
const { chromium } = createRequire(import.meta.url)("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const scenes = pathToFileURL(join(root, "store/templates/scenes.html")).href;

// [scene, width, height, output paths relative to repo root, extra params]
const jobs = [
    // Extension icons. 16/32 use the heavier small-size drawing; 128 keeps the
    // 16px transparent margin the Chrome Web Store asks for.
    ["icon-small", 16, 16, ["src/icons/icon-16.png"]],
    ["icon-small", 32, 32, ["src/icons/icon-32.png"]],
    ["icon", 48, 48, ["src/icons/icon-48.png"], { pad: 0 }],
    ["icon", 96, 96, ["src/icons/icon-96.png"], { pad: 4 }],
    ["icon", 128, 128, ["src/icons/icon-128.png", "store/assets/icon-128.png"], { pad: 16 }],
    ["icon", 300, 300, ["store/assets/logo-300.png"]],
    ["icon", 512, 512, ["assets/logo-512.png"]],
    ["icon", 180, 180, ["assets/apple-touch-icon.png"]],
    ["icon-small", 32, 32, ["assets/favicon-32.png"]],
    // macOS app icon: artwork inset to Apple's 824/1024 grid with a soft shadow.
    ...[16, 32, 64, 128, 256, 512, 1024].map((s) => ["mac-icon", s, s, [`store/assets/safari-appicon/icon_${s}.png`], { pad: Math.round(s * 100 / 1024) }]),
    ["mac-icon", 1024, 1024, ["store/assets/app-icon-1024.png"], { pad: 100 }],
    // Screenshots: 1280x800 is accepted by Chrome, Edge, Opera, AMO and the Mac App Store.
    ["channel", 1280, 800, ["store/assets/screenshot-1-channel.png"]],
    ["watch", 1280, 800, ["store/assets/screenshot-2-watch.png"]],
    ["search", 1280, 800, ["store/assets/screenshot-3-search.png"]],
    ["before-after", 1280, 800, ["store/assets/screenshot-4-before-after.png"]],
    ["privacy", 1280, 800, ["store/assets/screenshot-5-privacy.png"]],
    // Promo tiles and social card.
    ["promo-small", 440, 280, ["store/assets/promo-small-440x280.png"]],
    ["promo-wide", 1400, 560, ["store/assets/promo-marquee-1400x560.png"], { hs: 64, cs: 96 }],
    ["promo-wide", 1200, 630, ["assets/og-image.png"], { pad: 72, hs: 56, cs: 76 }],
];

const browser = await chromium.launch();
for (const [scene, w, h, outs, params = {}] of jobs) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const qs = new URLSearchParams({ scene, w, h, ...params });
    await page.goto(`${scenes}?${qs}`);
    await page.evaluate(() => Promise.all([document.fonts.ready, window.avatarsReady]));
    const transparent = scene.includes("icon");
    for (const out of outs) {
        const file = join(root, out);
        mkdirSync(dirname(file), { recursive: true });
        await page.screenshot({ path: file, omitBackground: transparent });
        // Store screenshots must be 24-bit (no alpha channel).
        if (!transparent) execFileSync("python3", ["-c", "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[1],optimize=True)", file]);
        console.log(`${out} (${w}x${h})`);
    }
    await page.close();
}
await browser.close();

// Website copies of the screenshots as WebP.
execFileSync("python3", ["-c", `
import glob, os
from PIL import Image
os.makedirs("assets/screens", exist_ok=True)
for f in sorted(glob.glob("store/assets/screenshot-*.png")):
    out = "assets/screens/" + os.path.basename(f)[:-4] + ".webp"
    Image.open(f).save(out, quality=86, method=6)
    print(out)
`], { cwd: root, stdio: "inherit" });
