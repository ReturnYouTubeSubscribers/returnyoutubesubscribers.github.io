#!/usr/bin/env node
// End-to-end smoke test with no real network access:
//   * youtube.com and backend.mixerno.space are intercepted and served from fixtures
//   * the built Chrome package (dist/chrome) is loaded as a real unpacked extension
//   * the generated userscript is injected into Firefox and WebKit (Safari's engine)
// Each run checks that the rounded count is replaced with the exact one.
//
//   npm run build && npm run test:smoke

import { createRequire } from "node:module";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const pw = createRequire(import.meta.url)("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANNEL_ID = "UCsmokeTest000000000000";
const EXPECTED = "1,284,519 subscribers";

const watchPage = `<!doctype html><html><head><title>Fixture</title>
<script>var ytInitialData = {"externalId":"${CHANNEL_ID}"};</script></head>
<body><div id="owner"><a>Northwind Studio</a><div id="owner-sub-count">1.28M subscribers</div></div></body></html>`;

async function route(context) {
    await context.route("https://www.youtube.com/**", (r) => r.fulfill({ contentType: "text/html", body: watchPage }));
    await context.route("https://backend.mixerno.space/**", (r) => {
        const ok = r.request().url().endsWith(CHANNEL_ID);
        r.fulfill({
            status: ok ? 200 : 404,
            contentType: "application/json",
            headers: { "access-control-allow-origin": "*" },
            body: JSON.stringify(ok ? { items: [{ statistics: { subscriberCount: 1284519 } }] } : {}),
        });
    });
}

async function expectExact(page, label) {
    await page.goto("https://www.youtube.com/watch?v=smoke");
    try {
        await page.waitForFunction(
            (want) => document.querySelector("#owner-sub-count")?.textContent === want,
            EXPECTED,
            { timeout: 15000 }
        );
        console.log(`ok   ${label}`);
        return true;
    } catch {
        const got = await page.locator("#owner-sub-count").textContent().catch(() => "?");
        console.error(`FAIL ${label}: expected "${EXPECTED}", got "${got}"`);
        return false;
    }
}

let pass = true;

// Chrome / Edge / Opera package, loaded as a real extension.
{
    const profile = mkdtempSync(join(tmpdir(), "ryts-"));
    const ext = join(root, "dist/chrome");
    const context = await pw.chromium.launchPersistentContext(profile, {
        channel: "chromium",
        args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
    });
    await route(context);
    pass = (await expectExact(await context.newPage(), "chromium: extension package")) && pass;
    await context.close();
    rmSync(profile, { recursive: true, force: true });
}

// Userscript in each engine (WebKit stands in for Safari).
const userscript = readFileSync(join(root, "return-youtube-subscribers.user.js"), "utf8");
for (const name of ["chromium", "firefox", "webkit"]) {
    let browser;
    try {
        browser = await pw[name].launch();
    } catch (e) {
        // Locally a missing engine is skipped; in CI every engine must run.
        console[process.env.CI ? "error" : "warn"](`${process.env.CI ? "FAIL" : "skip"} ${name}: ${e.message.split("\n")[0]}`);
        if (process.env.CI) pass = false;
        continue;
    }
    const context = await browser.newContext();
    await route(context);
    await context.addInitScript(userscript);
    pass = (await expectExact(await context.newPage(), `${name}: userscript`)) && pass;
    await browser.close();
}

process.exit(pass ? 0 : 1);
