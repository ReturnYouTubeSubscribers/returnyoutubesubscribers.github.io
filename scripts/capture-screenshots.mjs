#!/usr/bin/env node
// Captures the store and website screenshots from real YouTube with the built Chrome
// extension loaded: real channels, real counts, nothing mocked. Needs network access.
// Ads are hidden so they don't end up in a store listing; nothing else on the page is changed.
//
//   npm run build && npm run screenshots
//
// Writes store/assets/screenshot-*.png (1280x800, 24-bit) and assets/screens/*.webp,
// and prints the counts it captured (the website's hero and alt texts quote them).

import { createRequire } from "node:module";
import { mkdtempSync, rmSync, readdirSync, writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ext = join(root, "dist/chrome");
const W = 1280, H = 800;
const HIDE_ADS = `ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-search-pyv-renderer, #player-ads, #masthead-ad,
  ytd-banner-promo-renderer, ytd-statement-banner-renderer, ytd-companion-slot-renderer, .ytp-ad-module, tp-yt-paper-dialog { display: none !important; }`;

const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "ryts-shots-")), {
    channel: "chromium", headless: false, viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: "en-US",
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
await context.addCookies([{ name: "PREF", value: "hl=en&gl=US&f6=40000000", domain: ".youtube.com", path: "/" }]);
await context.addInitScript((css) => {
    document.addEventListener("DOMContentLoaded", () => document.head.append(Object.assign(document.createElement("style"), { textContent: css })));
}, HIDE_ADS);

const out = (n) => join(root, "store/assets", n);
const captured = {};
const exactIn = (page, sel) => page.waitForFunction((sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.getClientRects().length && e.dataset.rytsValue);
    return el && /^\d{1,3}(,\d{3})+ subscribers$/.test(el.querySelector(".ryts-sr")?.textContent ?? el.textContent) && el;
}, sel, { timeout: 30000 });
const read = (page, sel) => page.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.getClientRects().length);
    return { exact: (el.querySelector(".ryts-sr") ?? el).textContent.trim(), tip: el.dataset.rytsTip };
}, sel);
const settle = (page, ms = 2500) => page.waitForTimeout(ms); // odometer roll and lazy images
const shoot = async (page, file) => { await page.mouse.move(W - 2, H - 2); await page.screenshot({ path: out(file) }); console.log(file); };
const HEADER = "#page-header [data-ryts-value]";
// The channel's avatar, name and stats row, the same size with and without the extension.
const CROP = { width: 1000, height: 230 };
const headerClip = async (page) => {
    const b = await page.locator("#page-header yt-page-header-view-model").first().boundingBox();
    return { x: b.x - 24, y: b.y - 24, ...CROP };
};

// 1. Channel page, with the source tooltip showing.
{
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/@MrBeast");
    await exactIn(page, HEADER);
    await settle(page);
    captured.channel = await read(page, HEADER);
    await shoot(page, "screenshot-1-channel.png");
    const box = await page.locator(HEADER).first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForSelector(".ryts-tip:not([hidden])");
    await page.screenshot({ path: out("screenshot-1-channel.png") });
    // Header crop for the before/after shot.
    await page.mouse.move(W - 2, H - 2);
    await page.screenshot({ path: join(tmpdir(), "ryts-after.png"), clip: await headerClip(page) });
    await page.close();
}

// 2. Search results, sorted by subscribers.
{
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/results?search_query=mrbeast");
    await page.waitForFunction(() => {
        const rs = document.querySelectorAll("ytd-channel-renderer");
        return rs.length > 1 && [...rs].every((r) => r.dataset.rytsCount) && document.querySelector(".ryts-bar");
    }, null, { timeout: 30000 });
    await page.locator(".ryts-bar button").click();
    await page.waitForSelector('.ryts-bar button[aria-pressed="true"]');
    await settle(page);
    captured.search = await page.$$eval("ytd-channel-renderer", (rs) => rs.map((r) => `${r.querySelector("#text").textContent.trim()} ${(r.querySelector("#video-count .ryts-sr") ?? r.querySelector("#video-count")).textContent.trim()}`));
    await shoot(page, "screenshot-2-search.png");
    await page.close();
}

// 3. Race between two channels (the extension's counter page, real counts).
let counterBase;
{
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/@MrBeast");
    await page.waitForSelector(".ryts-open", { timeout: 30000 });
    const href = await page.locator(".ryts-open").getAttribute("href");
    counterBase = href.split("/counter.html")[0];
    await page.goto(`${href}&vs=UC-lHJZR3Gqxm24_Vd_AJ5Yw&vn=PewDiePie`);
    await page.waitForFunction(() => /leads by/.test(document.querySelector(".gap")?.textContent || ""), null, { timeout: 30000 });
    await page.waitForTimeout(7000); // let one live refresh roll
    captured.race = (await page.locator(".gap").textContent()).trim();
    await shoot(page, "screenshot-3-race.png");
    await page.close();
}

// 4. Live stream: the count refreshes every 10 seconds.
{
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/@LofiGirl/live");
    await page.waitForSelector("#owner-sub-count.ryts-live", { timeout: 30000 });
    await page.waitForTimeout(12000); // one refresh
    captured.live = await read(page, "#owner-sub-count");
    await shoot(page, "screenshot-4-live.png");
    await page.close();
}

// 5. Before and after: the same channel header without and with the extension.
{
    const plain = await chromium.launch({ headless: false });
    const page = await plain.newPage({ viewport: { width: W, height: H }, locale: "en-US" });
    await page.context().addCookies([{ name: "PREF", value: "hl=en&gl=US&f6=40000000", domain: ".youtube.com", path: "/" }]);
    await page.goto("https://www.youtube.com/@MrBeast");
    const span = page.locator("#page-header yt-content-metadata-view-model span", { hasText: /subscribers/ }).first();
    await span.waitFor({ timeout: 30000 });
    await settle(page);
    captured.rounded = (await span.textContent()).trim();
    await page.addStyleTag({ content: HIDE_ADS });
    await page.screenshot({ path: join(tmpdir(), "ryts-before.png"), clip: await headerClip(page) });
    await plain.close();

    const img = (f) => "data:image/png;base64," + readFileSync(join(tmpdir(), f)).toString("base64");
    const board = await context.newPage();
    await board.setContent(`<!doctype html><body style="margin:0;width:${W}px;height:${H}px;background:#e9e9ec;font:600 22px/1.3 Roboto,Arial,sans-serif;color:#0f0f0f;display:grid;align-content:center;gap:36px">
      ${[["YouTube", "ryts-before.png"], ["With Return YouTube Subscribers", "ryts-after.png"]].map(([label, f]) =>
        `<figure style="margin:0 auto"><figcaption style="padding:0 0 12px">${label}</figcaption><img src="${img(f)}" width="${CROP.width}" height="${CROP.height}" style="display:block;border-radius:16px"></figure>`).join("")}
    </body>`);
    await board.screenshot({ path: out("screenshot-5-before-after.png") });
    console.log("screenshot-5-before-after.png");
    await board.close();
}

// 6. Watch page.
{
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/@MrBeast/videos");
    const first = page.locator("a[href^='/watch?v=']").first();
    await first.waitFor({ timeout: 30000 });
    await first.click(); // in-app navigation, like a viewer
    await exactIn(page, "#owner-sub-count");
    // Let any pre-roll finish, then pause on a frame.
    await page.waitForFunction(() => !document.querySelector(".ad-showing") && document.querySelector("video")?.currentTime > 4, null, { timeout: 90000 }).catch(() => {});
    // Play to a loaded frame well into the video, then pause there.
    await page.evaluate(() => { const v = document.querySelector("video"); if (v) { v.muted = true; v.play(); } });
    await page.waitForFunction(() => { const v = document.querySelector("video"); return !v || (!document.querySelector(".ad-showing") && v.currentTime > 25 && v.readyState >= 3); }, null, { timeout: 90000 }).catch(() => {});
    await page.evaluate(() => document.querySelector("video")?.pause());
    await settle(page, 1500);
    captured.watch = await read(page, "#owner-sub-count");
    await shoot(page, "screenshot-6-watch.png");
    await page.close();
}

// 7. Toolbar popup over the channel page it was opened from.
{
    const page = await context.newPage();
    await page.setViewportSize({ width: 392, height: 600 });
    await page.goto(`${counterBase}/popup.html`);
    await settle(page, 1500);
    await page.screenshot({ path: join(tmpdir(), "ryts-popup.png"), fullPage: true });
    await page.close();
    const bg = await context.newPage();
    await bg.goto("https://www.youtube.com/@PewDiePie");
    await exactIn(bg, HEADER);
    await settle(bg);
    await bg.screenshot({ path: join(tmpdir(), "ryts-popup-bg.png") });
    await bg.goto("about:blank"); // YouTube's Trusted Types would block setContent
    await bg.setContent(`<!doctype html><body style="margin:0;width:${W}px;height:${H}px;background:url(data:image/png;base64,${readFileSync(join(tmpdir(), "ryts-popup-bg.png")).toString("base64")})">
      <img src="data:image/png;base64,${readFileSync(join(tmpdir(), "ryts-popup.png")).toString("base64")}" style="position:absolute;right:24px;top:8px;width:392px;max-height:${H - 16}px;object-fit:cover;object-position:top;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.35)">
    </body>`);
    await bg.screenshot({ path: out("screenshot-7-popup.png") });
    console.log("screenshot-7-popup.png");
    await bg.close();
}

await context.close();

// Store screenshots must be 24-bit (no alpha); the website uses WebP copies.
for (const f of readdirSync(join(root, "assets/screens"))) if (f.startsWith("screenshot-")) rmSync(join(root, "assets/screens", f));
execFileSync("python3", ["-c", `
import glob, os
from PIL import Image
for f in sorted(glob.glob("store/assets/screenshot-*.png")):
    im = Image.open(f).convert("RGB")
    im.save(f, optimize=True)
    im.save("assets/screens/" + os.path.basename(f)[:-4] + ".webp", quality=86, method=6)
`], { cwd: root, stdio: "inherit" });
captured.at = new Date().toISOString();
writeFileSync(join(root, "assets/screens/captured.json"), JSON.stringify(captured, null, 2) + "\n");
console.log(JSON.stringify(captured, null, 2));
