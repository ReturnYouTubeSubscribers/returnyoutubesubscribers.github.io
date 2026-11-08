// Return YouTube Subscribers content script. Needs shared.js loaded first.

(() => {
    const R = RYTS;
    const SEL = {
        owner: "#owner-sub-count",
        header: "#page-header > yt-page-header-renderer > yt-page-header-view-model > div > div.ytPageHeaderViewModelHeadline > div > yt-content-metadata-view-model > div:nth-child(3) > span:nth-child(1)",
        headerRoot: "#page-header",
        about: "#additional-info-container > table > tbody > tr:nth-child(6) > td:nth-child(2)",
        channelRenderer: "ytd-channel-renderer",
    };
    const ROUNDED = /^\s*[\d.,]+\s*[KMB]?\s+subscribers?\s*$/i;
    const CHANNEL_HREF = /\/(?:channel\/(UC[\w-]{22})|(@[^/?#]+))/;
    const LIVE_REFRESH_MS = 10_000;
    const log = (...a) => console.log("[RYTS]", ...a);

    let settings = { format: "exact" };
    let page = null; // { url, id, name, handle, count, live }
    const states = new Map(); // element -> { id, count, rounded, at, roll, live, prevText }

    // ---------- styles (YouTube's own colour variables, so light/dark/ambient all match) ----------

    const style = document.createElement("style");
    style.textContent = `
        .ryts-roll { white-space: pre; font-variant-numeric: tabular-nums; }
        .ryts-d, .ryts-t { display: inline-block; vertical-align: top; height: 1lh; }
        .ryts-d { overflow: hidden; }
        .ryts-reel { display: block; transition: transform .8s cubic-bezier(.2, .8, .2, 1); }
        .ryts-reel > span { display: block; height: 1lh; }
        .ryts-reel > span::before { content: attr(data-d); }
        .ryts-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
        .ryts-live::before { content: ""; display: inline-block; width: .5em; height: .5em; margin-right: .4em; border-radius: 50%;
            background: #ff0033; vertical-align: .1em; animation: ryts-pulse 1.6s ease-in-out infinite; }
        @keyframes ryts-pulse { 50% { opacity: .35; } }
        .ryts-open { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; margin-left: 6px;
            border-radius: 50%; vertical-align: middle; color: var(--yt-spec-text-secondary, #606060); text-decoration: none; }
        .ryts-open:hover { background: var(--yt-spec-10-percent-layer, rgba(0, 0, 0, .1)); color: var(--yt-spec-text-primary, #0f0f0f); }
        .ryts-open svg { width: 16px; height: 16px; fill: currentColor; }
        .ryts-chip { font: 500 14px/36px Roboto, Arial, sans-serif; height: 36px; padding: 0 16px; border: 0; border-radius: 18px;
            cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
            color: var(--yt-spec-text-primary, #0f0f0f); background: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, .05)); }
        .ryts-chip:hover { background: var(--yt-spec-button-chip-background-hover, rgba(0, 0, 0, .1)); }
        .ryts-chip[aria-pressed="true"] { color: var(--yt-spec-text-primary-inverse, #fff); background: var(--yt-spec-text-primary, #0f0f0f); }
        .ryts-chip:focus-visible, .ryts-open:focus-visible { outline: 2px solid var(--yt-spec-call-to-action, #065fd4); outline-offset: 2px; }
        .ryts-bar { display: flex; align-items: center; gap: 12px; margin: 12px 0 4px; font: 400 12px/18px Roboto, Arial, sans-serif;
            color: var(--yt-spec-text-secondary, #606060); }
        .ryts-panel { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 32px; margin: 16px 0 8px; padding: 16px 20px;
            border-radius: 12px; font: 400 14px/20px Roboto, Arial, sans-serif; color: var(--yt-spec-text-secondary, #606060);
            background: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, .05)); }
        .ryts-panel b { display: block; font-size: 16px; line-height: 22px; font-weight: 500; color: var(--yt-spec-text-primary, #0f0f0f); }
        .ryts-panel strong { display: block; font-size: 20px; line-height: 28px; font-weight: 700; color: var(--yt-spec-text-primary, #0f0f0f); }
        .ryts-panel .ryts-chip { margin-left: auto; }
        .ryts-tip { position: fixed; z-index: 9999; max-width: 280px; padding: 8px 10px; border-radius: 4px; pointer-events: none;
            font: 400 12px/16px Roboto, Arial, sans-serif; color: #fff; background: rgba(97, 97, 97, .95); }
        @media (prefers-reduced-motion: reduce) { .ryts-reel { transition: none; } .ryts-live::before { animation: none; } }
    `;
    // Added in start(): at document-start (userscripts) <html> may not exist yet.

    // Tiny DOM builder: h("div", { className: "x" }, child, "text", ...)
    const h = (tag, props = {}, ...children) => {
        const el = Object.assign(document.createElement(tag), props);
        el.append(...children.filter((c) => c != null));
        return el;
    };

    // ---------- rendering ----------

    const label = (s) => R.format(s.count, settings.format) + " subscribers";
    const tooltip = (s) =>
        `Estimated by ${R.SOURCE}, updated ${R.time(s.at)}.` +
        (s.rounded ? ` YouTube shows ${s.rounded.trim()}.` : "") +
        (s.live ? " Live: refreshes every 10 seconds." : "");

    function paint(el, s, animate = false) {
        const text = label(s);
        el.dataset.rytsTip = tooltip(s);
        el.setAttribute("aria-description", el.dataset.rytsTip);
        el.classList.toggle("ryts-live", !!s.live);
        el.dataset.rytsValue = text;
        el.removeAttribute("is-empty");
        if (s.roll && R.canRoll()) R.roll(el, text, s.prevText, animate);
        else if (el.textContent !== text) el.textContent = text;
        s.prevText = text;
    }

    function intact(el, s) {
        if (el.dataset.rytsValue !== label(s)) return false;
        return s.roll && R.canRoll() ? !!el.querySelector(":scope > .ryts-roll") : el.textContent === label(s);
    }

    // Shows a count in `el` and keeps it there when YouTube re-renders the element.
    function show(el, s) {
        const old = states.get(el);
        const state = { rounded: old?.rounded ?? el.textContent, prevText: old?.prevText, ...s, at: R.updatedAt(s.id) };
        states.set(el, state);
        paint(el, state, !!old && old.count !== state.count);
        if (!el.__rytsObserver) {
            el.__rytsObserver = new MutationObserver(() => {
                const st = states.get(el);
                if (st && !intact(el, st)) paint(el, st);
            });
            el.__rytsObserver.observe(el, { childList: true, characterData: true, subtree: true });
        }
        return state;
    }

    function forget(el) {
        el.__rytsObserver?.disconnect();
        delete el.__rytsObserver;
        states.delete(el);
    }

    // One tooltip, styled like YouTube's, explaining where a count comes from.
    const tip = h("div", { className: "ryts-tip", hidden: true });
    tip.setAttribute("role", "tooltip");
    document.addEventListener("mouseover", (e) => {
        const el = e.target instanceof Element && e.target.closest("[data-ryts-tip]");
        if (!el) return void (tip.hidden = true);
        if (!tip.isConnected) document.documentElement.append(tip);
        tip.textContent = el.dataset.rytsTip;
        tip.hidden = false;
        const box = el.getBoundingClientRect();
        tip.style.left = Math.max(8, Math.min(box.left, innerWidth - tip.offsetWidth - 8)) + "px";
        tip.style.top = (box.bottom + 8 + tip.offsetHeight > innerHeight ? box.top - tip.offsetHeight - 8 : box.bottom + 8) + "px";
    }, { passive: true });

    // ---------- channel IDs ----------

    const idByUrl = new Map();

    function extractChannelId(html) {
        const external = html.match(/"externalId":"(.*?)"/)?.[1];
        const browse = html.match(/"browse_id":"(.*?)"/)?.[1];
        const channel = html.match(/"channelId":"(.*?)"/)?.[1];
        return external || browse || channel || null;
    }

    function idForUrl(url) {
        if (!idByUrl.has(url)) {
            idByUrl.set(url, fetch(url, { credentials: "include" })
                .then((r) => r.text())
                .then(extractChannelId)
                .catch(() => null));
        }
        return idByUrl.get(url);
    }

    async function idForHref(href) {
        const m = href?.match(CHANNEL_HREF);
        if (!m) return null;
        if (m[1]) return m[1];
        return idForUrl("https://www.youtube.com/" + m[2]);
    }

    // At most four lookups at a time for lists (search results, featured channels).
    let active = 0;
    const waiting = [];
    function limited(task) {
        return new Promise((resolve) => {
            const run = async () => {
                active++;
                try { resolve(await task()); } catch { resolve(null); } finally {
                    active--;
                    waiting.shift()?.();
                }
            };
            active < 4 ? run() : waiting.push(run);
        });
    }

    // ---------- channel and watch pages ----------

    const waitFor = (find, ms = 15000) => new Promise((resolve) => {
        const start = Date.now();
        const tick = () => {
            const el = find();
            if (el || Date.now() - start > ms) resolve(el || null);
            else setTimeout(tick, 150);
        };
        tick();
    });

    function pageMeta(isChannel) {
        if (isChannel) {
            const name = document.querySelector(`${SEL.headerRoot} h1`)?.textContent.trim();
            return { name, handle: location.pathname.match(/@[^/]+/)?.[0] };
        }
        const link = document.querySelector("#owner #channel-name a, ytd-video-owner-renderer #channel-name a");
        return { name: link?.textContent.trim(), handle: decodeURIComponent(link?.getAttribute("href")?.match(/@[^/?#]+/)?.[0] || "") || undefined };
    }

    async function handlePage() {
        const url = location.href;
        stopLive();
        for (const el of [...states.keys()]) if (!el.closest(SEL.channelRenderer)) forget(el);
        document.querySelectorAll(".ryts-panel, .ryts-open").forEach((n) => n.remove());
        page = null;
        if (!/\/(channel\/|c\/|user\/|watch\?|@)/.test(url)) return;

        const target = await waitFor(() => document.querySelector(SEL.header) || document.querySelector(SEL.owner));
        if (!target || url !== location.href) return;
        const isChannel = target.matches(SEL.header);
        const id = await idForUrl(url);
        if (!id || url !== location.href) return;
        const count = await R.fetchCount(id);
        if (count === null || url !== location.href) return;

        page = { url, id, count, isChannel, ...pageMeta(isChannel) };
        log(isChannel ? "Channel page" : "Watch page", id, count);
        R.observe(id, count, page);
        show(target, { id, count, roll: true });
        if (isChannel) {
            addCounterLink(target); // inline in the header's stats row; watch pages have no inline spot
            ownChannelPanel();
        } else startLiveIfLive(target);
        decorate();
    }

    function addCounterLink(el) {
        const href = page && R.pageUrl("counter.html", { c: page.id, n: page.name || page.handle || "" });
        if (!href || el.nextElementSibling?.classList.contains("ryts-open")) return;
        const a = document.createElement("a");
        a.className = "ryts-open";
        a.href = href;
        a.target = "_blank";
        a.title = "Open the live counter";
        a.setAttribute("aria-label", "Open the live counter");
        const NS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", "M5 5h6v2H7v4H5V5zm8 0h6v6h-2V7h-4V5zM5 13h2v4h4v2H5v-6zm12 0h2v6h-6v-2h4v-4z");
        svg.append(path);
        a.append(svg);
        el.after(a);
    }

    // ---------- live streams: refresh the count while the stream is on ----------

    let liveTimer = null;
    const isLive = () =>
        !!document.querySelector("#movie_player.ytp-live, .html5-video-player.ytp-live") ||
        (!!document.querySelector('meta[itemprop="isLiveBroadcast"][content="True"]') && !document.querySelector('meta[itemprop="endDate"]'));

    function startLiveIfLive(el) {
        if (!isLive()) return;
        const url = location.href;
        const s = states.get(el);
        s.live = true;
        paint(el, s);
        liveTimer = setInterval(async () => {
            if (location.href !== url || !page) return stopLive();
            const count = await R.fetchCount(page.id, { fresh: true });
            if (count === null || location.href !== url) return;
            page.count = count;
            R.observe(page.id, count, page);
            show(el, { id: page.id, count, roll: true, live: true });
        }, LIVE_REFRESH_MS);
    }

    function stopLive() {
        clearInterval(liveTimer);
        liveTimer = null;
    }

    // ---------- your own channel: milestone panel ----------

    async function ownChannelPanel() {
        const root = document.querySelector(SEL.headerRoot);
        if (!page?.isChannel || !root || !root.querySelector('a[href*="studio.youtube.com"]')) return;
        const history = (await R.getHistory())[page.id];
        const perDay = R.growthPerDay(history?.points);
        const goal = R.nextMilestone(page.count);
        const togo = goal - page.count;
        const eta = perDay > 0 ? new Date(Date.now() + (togo / perDay) * 86_400_000) : null;
        if (!page?.isChannel || document.querySelector(".ryts-panel")) return;

        const panel = document.createElement("section");
        panel.className = "ryts-panel";
        panel.setAttribute("aria-label", "Your channel");
        const cell = (big, small) => h("div", {}, h("strong", { textContent: big }), small);
        panel.append(h("div", {}, h("b", { textContent: "Your channel" }), `Next milestone: ${R.exact(goal)}`), cell(R.exact(togo), "to go"));
        if (perDay !== null) {
            panel.append(
                cell(`${perDay >= 0 ? "+" : "−"}${R.exact(Math.round(Math.abs(perDay)))}`, "per day, recently"),
                cell(eta ? eta.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Not growing", "projected milestone date"),
            );
        } else {
            panel.append(h("div", { textContent: "Growth and a projected date appear after you've visited a few times." }));
        }
        const href = R.pageUrl("counter.html", { c: page.id, n: page.name || "" });
        if (href) {
            const open = document.createElement("a");
            Object.assign(open, { className: "ryts-chip", href, target: "_blank", textContent: "Open live counter" });
            panel.append(open);
        }
        root.after(panel);
    }

    // ---------- lists: search results, featured channels, About dialog ----------

    function decorate() {
        // Search results (existing behaviour: the count lives in #video-count).
        if (location.href.includes("/results?")) {
            for (const renderer of document.querySelectorAll(SEL.channelRenderer)) {
                const target = renderer.querySelector("#video-count");
                const href = renderer.querySelector("#main-link")?.href;
                if (!target || !href || renderer.__ryts) continue;
                renderer.__ryts = limited(async () => {
                    const id = await idForHref(href);
                    const count = id && await R.fetchCount(id);
                    if (count == null) return null;
                    R.observe(id, count, { name: renderer.querySelector("#channel-title #text, #text")?.textContent.trim(), handle: href.match(/@[^/?#]+/)?.[0] });
                    show(target, { id, count });
                    renderer.dataset.rytsCount = count;
                    return count;
                });
            }
            sortButton();
        }

        // Featured channels and channel lists: any "123K subscribers" text near a channel link.
        const walker = document.createTreeWalker(document.querySelector("ytd-page-manager") || document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: (n) => (ROUNDED.test(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
        });
        const found = [];
        while (walker.nextNode()) found.push(walker.currentNode.parentElement);
        for (const el of found) {
            if (!el || el.__ryts || states.has(el) || el.matches(SEL.owner) || el.closest(`${SEL.channelRenderer}, ${SEL.headerRoot}, #owner`)) continue;
            const card = el.closest("ytd-grid-channel-renderer, ytd-mini-channel-renderer, ytd-channel-renderer, yt-lockup-view-model, ytd-rich-item-renderer")
                || el.parentElement?.closest(":has(a[href*='/@'], a[href*='/channel/UC'])");
            const href = card?.querySelector("a[href*='/@'], a[href*='/channel/UC']")?.getAttribute("href");
            if (!href) continue;
            el.__ryts = limited(async () => {
                const id = await idForHref(href);
                const count = id && await R.fetchCount(id);
                if (count == null) return;
                show(el, { id, count });
            });
        }

        // The About dialog's table row.
        const about = page?.isChannel && document.querySelector(SEL.about);
        if (about && !states.has(about)) show(about, { id: page.id, count: page.count });
    }

    function sortButton() {
        const renderers = [...document.querySelectorAll(SEL.channelRenderer)];
        if (renderers.length < 2 || document.querySelector(".ryts-bar")) return;
        const bar = document.createElement("div");
        bar.className = "ryts-bar";
        const button = h("button", { type: "button", className: "ryts-chip", textContent: "Sort channels by subscribers" });
        button.setAttribute("aria-pressed", "false");
        bar.append(button, h("span", { textContent: "Exact counts by Return YouTube Subscribers" }));
        renderers[0].before(bar);
        button.addEventListener("click", async () => {
            button.textContent = "Sorting…";
            const list = [...document.querySelectorAll(SEL.channelRenderer)];
            await Promise.all(list.map((r) => r.__ryts));
            const marker = document.createComment("ryts");
            bar.after(marker);
            list.sort((a, b) => (+b.dataset.rytsCount || 0) - (+a.dataset.rytsCount || 0))
                .forEach((r) => marker.before(r));
            marker.remove();
            button.textContent = "Sorted by subscribers";
            button.setAttribute("aria-pressed", "true");
        });
    }

    // ---------- wiring ----------

    let scheduled = null;
    const pageObserver = new MutationObserver(() => {
        if (scheduled) return;
        scheduled = setTimeout(() => {
            scheduled = null;
            decorate();
        }, 400);
    });

    let lastUrl = null;
    const onNavigate = () => {
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        log("URL changed:", lastUrl);
        handlePage();
        decorate();
    };
    document.addEventListener("yt-navigate-finish", onNavigate);
    setInterval(() => document.body && onNavigate(), 1000); // fallback if YouTube renames its navigation event

    R.getSettings().then((s) => { settings = s; });
    R.onSettings((s) => {
        settings = s;
        for (const [el, st] of states) paint(el, st);
    });

    const start = () => {
        (document.head || document.documentElement).append(style);
        pageObserver.observe(document.documentElement, { childList: true, subtree: true });
        onNavigate();
    };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start, { once: true }) : start();
})();
