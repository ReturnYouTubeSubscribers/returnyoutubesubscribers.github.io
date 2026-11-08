#!/usr/bin/env node
// Feature tests for the built Chrome extension, against fixture pages that copy
// YouTube's structure (no network needed). Optionally saves screenshots.
//
//   npm run build && node scripts/e2e.mjs [--screenshots <dir>]

import { createRequire } from "node:module";
import { readFileSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const shotsArg = process.argv.indexOf("--screenshots");
const shotsDir = shotsArg > 0 ? resolve(process.argv[shotsArg + 1]) : null;
if (shotsDir) mkdirSync(shotsDir, { recursive: true });

// ---------- fixture data ----------

const CH = {
    mrbeast: { id: "UCX6OQ3DkcsbYNE6H8uQQuVA", name: "MrBeast", handle: "@MrBeast", count: 452318906, rounded: "452M", color: "#3A7BD5,#6C5CE7", initials: "MB" },
    gaming: { id: "UCIPPMRA040LQr5QPyJEbmXA", name: "MrBeast Gaming", handle: "@MrBeastGaming", count: 51872340, rounded: "51.8M", color: "#00B894,#3A7BD5", initials: "MG" },
    philanthropy: { id: "UCAiLfjNXkNv24uhpzUgPa6A", name: "Beast Philanthropy", handle: "@BeastPhilanthropy", count: 28406915, rounded: "28.4M", color: "#F7B267,#E0262F", initials: "BP" },
    sfmg: { id: "UCsfmgFixture00000000000", name: "Straight From MG", handle: "@sfmg", count: 34010, rounded: "34K", avatar: "https://yt3.ggpht.com/fixture/sfmg.png" },
};
const byId = Object.fromEntries(Object.values(CH).map((c) => [c.id, c]));
const byHandle = Object.fromEntries(Object.values(CH).map((c) => [c.handle.toLowerCase(), c]));
let liveTicks = 0, liveMode = false; // during the live test MrBeast gains subscribers on every request

const avatar = (c, size) => c.avatar
    ? `<img src="${c.avatar}" width="${size}" height="${size}" style="border-radius:50%;object-fit:cover" alt="">`
    : `<div style="width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:${size / 2.6}px;background:linear-gradient(135deg,${c.color})">${c.initials}</div>`;

const shell = (body, { dark = false, data = "" } = {}) => `<!doctype html><html ${dark ? "dark" : ""}><head><meta charset="utf-8"><title>YouTube</title>
<script>${data}</script>
<style>
html { --yt-spec-base-background:#fff; --yt-spec-text-primary:#0f0f0f; --yt-spec-text-secondary:#606060; --yt-spec-badge-chip-background:rgba(0,0,0,.05);
  --yt-spec-10-percent-layer:rgba(0,0,0,.1); --yt-spec-button-chip-background-hover:rgba(0,0,0,.1); --yt-spec-text-primary-inverse:#fff; }
html[dark] { --yt-spec-base-background:#0f0f0f; --yt-spec-text-primary:#f1f1f1; --yt-spec-text-secondary:#aaa; --yt-spec-badge-chip-background:rgba(255,255,255,.1);
  --yt-spec-10-percent-layer:rgba(255,255,255,.2); --yt-spec-button-chip-background-hover:rgba(255,255,255,.2); --yt-spec-text-primary-inverse:#0f0f0f; }
body { margin:0; background:var(--yt-spec-base-background); color:var(--yt-spec-text-primary); font:14px/20px Roboto, Inter, Arial, sans-serif; }
.mast { height:56px; display:flex; align-items:center; gap:16px; padding:0 24px; }
.logo { font-weight:800; letter-spacing:-.04em; font-size:20px; }
.search { flex:0 1 560px; margin:0 auto; height:40px; border:1px solid var(--yt-spec-10-percent-layer); border-radius:20px; padding:0 16px; display:flex; align-items:center; color:var(--yt-spec-text-secondary); }
.muted { color:var(--yt-spec-text-secondary); }
.btn { display:inline-flex; align-items:center; height:36px; padding:0 16px; border-radius:18px; font-weight:500; background:var(--yt-spec-text-primary); color:var(--yt-spec-base-background); }
.btn.ghost { background:var(--yt-spec-badge-chip-background); color:var(--yt-spec-text-primary); }
ytd-page-manager { display:block; max-width:1284px; margin:0 auto; padding:0 24px 40px; }
</style></head><body><div class="mast"><span class="logo">▶ YouTube</span><div class="search">${body.query || "Search"}</div></div>
<ytd-page-manager>${body.html}</ytd-page-manager></body></html>`;

function searchPage() {
    const row = (c) => `<ytd-channel-renderer style="display:flex;gap:32px;align-items:center;padding:16px 0">
      <a id="main-link" href="https://www.youtube.com/${c.handle}" style="display:flex;gap:120px;align-items:center;text-decoration:none;color:inherit;flex:1;padding-left:100px">
        ${avatar(c, 136)}
        <div><div id="channel-title" style="font-size:18px;line-height:26px"><span id="text">${c.name}</span></div>
        <div class="muted" style="font-size:12px"><span id="subscribers">${c.handle}</span> • <span id="video-count">${c.rounded} subscribers</span></div>
        <div class="muted" style="font-size:12px;margin-top:6px">Official ${c.name} channel.</div></div></a>
      <span class="btn">Subscribe</span></ytd-channel-renderer>`;
    return shell({ query: "mrbeast", html: `<div style="padding-top:8px">${[CH.philanthropy, CH.mrbeast, CH.gaming].map(row).join("")}</div>` });
}

function channelPage(c, { dark = false } = {}) {
    const featured = [CH.mrbeast, CH.gaming, CH.philanthropy].map((f) => `<ytd-grid-channel-renderer style="display:block;text-align:center;width:210px">
      <a href="/${f.handle}" style="display:grid;justify-items:center;gap:10px;text-decoration:none;color:inherit">${avatar(f, 104)}
      <span style="font-weight:500">${f.name}</span></a><span id="subscribers" class="muted" style="font-size:12px">${f.rounded} subscribers</span></ytd-grid-channel-renderer>`).join("");
    return shell({ html: `
      <div style="height:170px;border-radius:16px;margin-top:4px;background:linear-gradient(120deg,#2A1B3D,#7B2D5B 55%,#F4845F)"></div>
      <div id="page-header"><yt-page-header-renderer><yt-page-header-view-model><div style="display:flex;gap:24px;align-items:center;padding:24px 0 8px">
        ${avatar(c, 160)}
        <div class="ytPageHeaderViewModelHeadline"><div>
          <h1 style="font-size:36px;line-height:44px;margin:0 0 8px">${c.name}</h1>
          <yt-content-metadata-view-model>
            <div style="font-weight:500">${c.handle}</div>
            <div class="muted">113 videos</div>
            <div class="muted"><span>${c.rounded} subscribers</span></div>
          </yt-content-metadata-view-model>
          <div style="display:flex;gap:8px;margin-top:12px"><a class="btn ghost" href="https://studio.youtube.com/channel/${c.id}/editing/profile" style="text-decoration:none">Customize channel</a><a class="btn ghost" href="https://studio.youtube.com/channel/${c.id}/videos" style="text-decoration:none">Manage videos</a></div>
        </div></div></div></yt-page-header-view-model></yt-page-header-renderer></div>
      <div class="muted" style="display:flex;gap:24px;font-weight:500;border-bottom:1px solid var(--yt-spec-10-percent-layer);padding:8px 0 12px"><span style="color:var(--yt-spec-text-primary)">Home</span><span>Videos</span><span>Shorts</span><span>Playlists</span></div>
      <h2 style="font-size:20px;margin:24px 0 16px">Featured channels</h2>
      <div style="display:flex;gap:24px">${featured}</div>`,
    }, { dark, data: `var ytInitialData={"externalId":"${c.id}"};` });
}

function watchPage(c, { live = false, dark = true } = {}) {
    const chat = live ? `<div style="width:380px;border:1px solid var(--yt-spec-10-percent-layer);border-radius:12px;padding:12px 16px;display:grid;gap:12px;align-content:start">
      <b>Live chat</b>${["LET'S GOOO", "GG", "who's here from shorts", "W stream", "first time catching it live!"].map((m, i) => `<div><span class="muted">viewer${i + 7}</span>&nbsp; ${m}</div>`).join("")}</div>` : "";
    return shell({ html: `<div style="display:flex;gap:24px;padding-top:8px"><div style="flex:1">
      <div id="movie_player" class="html5-video-player${live ? " ytp-live" : ""}" style="aspect-ratio:16/9;border-radius:12px;position:relative;background:linear-gradient(160deg,#F7B267,#F4845F 35%,#7B2D5B 75%,#2A1B3D)">
        ${live ? '<span style="position:absolute;left:16px;bottom:14px;background:#ff0033;color:#fff;font-weight:700;font-size:12px;padding:2px 8px;border-radius:4px">LIVE</span>' : ""}</div>
      <h1 style="font-size:20px;line-height:28px;margin:12px 0">${live ? "$1,000,000 Live Giveaway Countdown" : "I Spent 100 Days In The Wilderness"}</h1>
      <div id="owner" style="display:flex;align-items:center;gap:12px">${avatar(c, 40)}
        <div><div id="channel-name"><a href="/${c.handle}" style="color:inherit;text-decoration:none;font-weight:500;font-size:16px">${c.name}</a></div>
        <div id="upload-info"><yt-formatted-string id="owner-sub-count" class="muted" style="font-size:12px;display:block">${c.rounded} subscribers</yt-formatted-string></div></div>
        <span class="btn" style="margin-left:12px">Subscribe</span></div>
    </div>${chat}</div>`,
    }, { dark, data: `var ytInitialPlayerResponse={"videoDetails":{"channelId":"${c.id}"}};` });
}

// ---------- browser ----------

const ext = join(root, "dist/chrome");
// Chrome derives an unpacked extension's ID from its path.
const extId = [...createHash("sha256").update(ext).digest("hex").slice(0, 32)].map((h) => String.fromCharCode(97 + parseInt(h, 16))).join("");
const profile = mkdtempSync(join(tmpdir(), "ryts-e2e-"));
const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: shotsDir ? 2 : 1,
    acceptDownloads: true,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});

await context.route("https://backend.mixerno.space/**", (route) => {
    const id = decodeURIComponent(route.request().url().split("/").pop());
    const c = byId[id];
    let count = c?.count;
    if (c === CH.mrbeast && liveMode) count += liveTicks++ * 1873;
    route.fulfill({
        status: c ? 200 : 404, contentType: "application/json", headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(c ? { items: [{ statistics: { subscriberCount: count } }] } : {}),
    });
});
await context.route("https://yt3.ggpht.com/**", (route) => route.fulfill({ contentType: "image/png", body: readFileSync(join(root, "store/templates/avatars/sfmg.png")) }));
let pageFor = () => "";
await context.route("https://www.youtube.com/**", (route) => {
    const url = new URL(route.request().url());
    const c = byHandle[decodeURIComponent(url.pathname.slice(1)).toLowerCase()];
    // Handle lookups (fetch of /@handle) return that channel's page; navigations use the current fixture.
    const body = route.request().resourceType() === "document" ? pageFor(url) : c ? channelPage(c) : pageFor(url);
    route.fulfill({ contentType: "text/html", body });
});

let failures = 0;
const check = async (name, fn) => {
    try { await fn(); console.log(`ok   ${name}`); } catch (e) { failures++; console.error(`FAIL ${name}: ${e.message.split("\n")[0]}`); }
};
const shot = async (page, file, opts = {}) => { if (shotsDir) await page.screenshot({ path: join(shotsDir, file), ...opts }); };
const text = (page, sel) => page.locator(sel).first().evaluate((el) => el.querySelector(".ryts-sr")?.textContent ?? el.textContent);
const until = (page, fn, arg, timeout = 15000) => page.waitForFunction(fn, arg, { timeout });

// Seed some history so growth, projections and the popup have data.
const ext0 = await context.newPage();
await ext0.goto(`chrome-extension://${extId}/popup.html`);
const hourAgo = Date.now() - 6 * 3600_000;
await ext0.evaluate(([CH, hourAgo]) => chrome.storage.local.set({
    history: Object.fromEntries(Object.values(CH).map((c, i) => [c.id, {
        name: c.name, handle: c.handle, seen: hourAgo,
        points: [[hourAgo, c.count - [9400, 1210, 3020, 3][i]], [hourAgo + 3600_000, c.count - [7400, 1000, 2400, 2][i]]],
    }])),
}), [CH, hourAgo]);
await ext0.close();

// 1. Search: exact counts + sort by subscribers
await check("search: exact counts and sort by subscribers", async () => {
    pageFor = () => searchPage();
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/results?search_query=mrbeast");
    await until(page, () => document.querySelectorAll("[data-ryts-value]").length >= 3);
    await page.getByRole("button", { name: "Sort channels by subscribers" }).click();
    await until(page, () => document.querySelector(".ryts-chip")?.getAttribute("aria-pressed") === "true");
    const order = await page.$$eval("ytd-channel-renderer #text", (els) => els.map((e) => e.textContent));
    if (order.join() !== "MrBeast,MrBeast Gaming,Beast Philanthropy") throw new Error("order was " + order.join());
    if ((await text(page, "ytd-channel-renderer #video-count")) !== "452,318,906 subscribers") throw new Error("count not exact");
    await page.locator("ytd-channel-renderer #video-count").first().hover();
    await page.waitForSelector(".ryts-tip:not([hidden])");
    await shot(page, "1-search-sorted.png");
    await page.close();
});

// 2. Own channel: header roll, milestone panel, featured channels, counter link
for (const dark of [false, true]) {
    await check(`own channel page (${dark ? "dark" : "light"} theme): panel, featured channels, counter link`, async () => {
        pageFor = () => channelPage(CH.sfmg, { dark });
        const page = await context.newPage();
        await page.goto("https://www.youtube.com/@sfmg");
        await until(page, () => document.querySelector(".ryts-panel"));
        const header = await text(page, "yt-content-metadata-view-model > div:nth-child(3) > span");
        if (header !== "34,010 subscribers") throw new Error("header was " + header);
        await until(page, () => [...document.querySelectorAll("ytd-grid-channel-renderer #subscribers")].every((e) => e.dataset.rytsValue));
        const featured = await page.$$eval("ytd-grid-channel-renderer #subscribers", (els) => els.map((e) => e.textContent));
        if (featured[0] !== "452,318,906 subscribers") throw new Error("featured was " + featured[0]);
        const panel = await page.locator(".ryts-panel").innerText();
        if (!/Next milestone: 35,000/.test(panel) || !/990\s*to go/.test(panel) || !/per day/.test(panel)) throw new Error("panel: " + panel.replace(/\n/g, " | "));
        if (!(await page.locator(".ryts-open").count())) throw new Error("no counter link");
        if (await page.evaluate(() => getComputedStyle(document.querySelector(".ryts-panel b")).color) !== (dark ? "rgb(241, 241, 241)" : "rgb(15, 15, 15)")) throw new Error("panel ignores theme");
        await shot(page, `2-own-channel-${dark ? "dark" : "light"}.png`);
        await page.close();
    });
}

// 3. Live stream: count refreshes and rolls
await check("live stream: count refreshes with a digit roll", async () => {
    liveTicks = 0;
    liveMode = true;
    pageFor = () => watchPage(CH.mrbeast, { live: true });
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/watch?v=live");
    await until(page, () => document.querySelector("#owner-sub-count.ryts-live"));
    const first = await text(page, "#owner-sub-count");
    await until(page, (f) => document.querySelector("#owner-sub-count .ryts-sr")?.textContent !== f, first, 20000);
    await page.waitForTimeout(300);
    await shot(page, "3a-live-mid-roll.png", { clip: { x: 0, y: 540, width: 640, height: 120 } });
    await page.waitForTimeout(1200);
    await page.locator("#owner-sub-count").hover();
    await shot(page, "3-live.png");
    const second = await text(page, "#owner-sub-count");
    if (first === second) throw new Error("count did not change");
    const tip = await page.locator(".ryts-tip").textContent();
    if (!/Estimated by Mixerno\.space/.test(tip) || !/YouTube shows 452M/.test(tip) || !/Live/.test(tip)) throw new Error("tooltip: " + tip);
    liveMode = false;
    await page.close();
});

// 4. Compact format, switched from the popup's setting
await check("compact number format", async () => {
    pageFor = () => watchPage(CH.mrbeast, { dark: false });
    const page = await context.newPage();
    await page.goto("https://www.youtube.com/watch?v=compact");
    await until(page, () => document.querySelector("#owner-sub-count[data-ryts-value]"));
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extId}/popup.html`);
    await popup.getByLabel("Compact").check();
    await until(page, () => document.querySelector("#owner-sub-count")?.dataset.rytsValue?.startsWith("452.3M"));
    await page.bringToFront();
    const y = await page.evaluate(() => document.querySelector("#owner").getBoundingClientRect().top + scrollY);
    await shot(page, "4-compact-format.png", { fullPage: true, clip: { x: 0, y: y - 60, width: 760, height: 150 } });
    await popup.getByLabel("Exact").check();
    await popup.close();
    await page.close();
});

// 5. Popup: fastest growing
await check("popup: fastest growing ranking", async () => {
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 392, height: 640 });
    await popup.goto(`chrome-extension://${extId}/popup.html`);
    const names = await popup.$$eval(".list .name", (els) => els.map((e) => e.textContent));
    if (names[0] !== "MrBeast") throw new Error("ranking was " + names.join());
    await shot(popup, "5-popup.png", { fullPage: true });
    await popup.close();
});

// 6. Counter page and race, plus the share image
await check("live counter, race mode and share image", async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extId}/counter.html?c=${CH.mrbeast.id}&n=MrBeast`);
    await page.waitForFunction(() => document.querySelector(".big .ryts-sr"));
    await shot(page, "6-big-counter.png");
    await page.goto(`chrome-extension://${extId}/counter.html?c=${CH.mrbeast.id}&n=MrBeast&vs=${CH.gaming.id}&vn=MrBeast%20Gaming`);
    await page.waitForFunction(() => /leads by/.test(document.querySelector(".gap")?.textContent || ""));
    const gap = await page.locator(".gap").textContent();
    if (!/MrBeast leads by [\d,]+ subscribers/.test(gap)) throw new Error("gap: " + gap);
    await shot(page, "7-race.png");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Save image" }).click()]);
    if (!download.suggestedFilename().endsWith(".png")) throw new Error("download was " + download.suggestedFilename());
    if (shotsDir) await download.saveAs(join(shotsDir, "8-share-image.png"));
    await page.close();
});

await context.close();
rmSync(profile, { recursive: true, force: true });
console.log(failures ? `${failures} failed` : "all passed");
process.exit(failures ? 1 : 0);
