// Shared helpers for the content script, the toolbar popup and the counter page.
// Plain script (no modules) so it also works as part of the userscript.

var RYTS = (() => {
    // Count sources, best first. NextCounts' Unabbreviated Project has the real count for
    // channels that connected YouTube Studio; everything else uses Mixerno's estimate.
    const MIXERNO = "https://backend.mixerno.space/api/youtube/estv3/";
    const NEXTCOUNTS_LIST = "https://api.nextcounts.com/api/youtube/studio/channels";
    const NEXTCOUNTS_V2 = "https://api-v2.nextcounts.com/api/youtube/channel/";
    const NEXTCOUNTS_REALTIME = (id) => `https://api.nextcounts.com/api/youtube/studio/channel/${encodeURIComponent(id)}/realtime`;
    const SOURCES = {
        nextcounts: {
            name: "NextCounts", exact: true,
            tooltip: "Real count from YouTube Studio, shared by the channel through NextCounts' Unabbreviated Project",
        },
        mixerno: { name: "Mixerno.space", exact: false, tooltip: "Estimated by Mixerno.space" },
    };
    const API = MIXERNO; // kept for older callers
    const SOURCE = SOURCES.mixerno.name;

    // Extension storage when running as an extension, localStorage in the userscript.
    const ext = globalThis.browser?.storage?.local ? globalThis.browser
        : globalThis.chrome?.storage?.local ? globalThis.chrome : null;

    const store = {
        async get(key, fallback) {
            try {
                if (ext) return (await ext.storage.local.get(key))[key] ?? fallback;
                const raw = localStorage.getItem("ryts:" + key);
                return raw ? JSON.parse(raw) : fallback;
            } catch {
                return fallback;
            }
        },
        async set(key, value) {
            try {
                if (ext) await ext.storage.local.set({ [key]: value });
                else localStorage.setItem("ryts:" + key, JSON.stringify(value));
            } catch { /* storage full or blocked: features degrade, counts still show */ }
        },
        onChange(key, callback) {
            ext?.storage?.onChanged?.addListener((changes, area) => {
                if (area === "local" && changes[key]) callback(changes[key].newValue);
            });
        },
    };

    // ---------- settings ----------

    const DEFAULT_SETTINGS = { format: "exact" };
    const getSettings = async () => ({ ...DEFAULT_SETTINGS, ...(await store.get("settings", {})) });
    const setSettings = async (patch) => store.set("settings", { ...(await getSettings()), ...patch });
    const onSettings = (callback) => store.onChange("settings", (s) => callback({ ...DEFAULT_SETTINGS, ...s }));

    // ---------- formatting ----------

    const exactFormat = new Intl.NumberFormat("en-US");
    // One more significant figure than YouTube's three: 452.3M, 1.284M, 34.01K.
    const compactFormat = new Intl.NumberFormat("en-US", {
        notation: "compact", maximumSignificantDigits: 4, roundingMode: "trunc",
    });
    const format = (n, mode = "exact") => (mode === "compact" && n >= 1000 ? compactFormat : exactFormat).format(n);
    const exact = (n) => exactFormat.format(n);
    const time = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    // ---------- counts ----------

    const cache = new Map(); // id -> { count, source, at, promise }
    const CACHE_MS = 60_000;
    const getJSON = (url) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))));
    const toCount = (v) => {
        const n = typeof v === "number" ? v : parseInt(v, 10);
        return Number.isFinite(n) && n >= 0 ? n : null;
    };

    // Channels in the Unabbreviated Project. Loaded at most once an hour, so lists of
    // channels (search, featured) never send NextCounts one request per channel.
    const LIST_MS = 60 * 60_000, LIST_RETRY_MS = 10 * 60_000;
    let studio = null; // { ids: Set | null, at }
    let studioLoading = null;
    async function studioChannels() {
        if (studio && Date.now() - studio.at < (studio.ids ? LIST_MS : LIST_RETRY_MS)) return studio.ids;
        if (!studioLoading) {
            studioLoading = (async () => {
                const saved = await store.get("nextcountsStudio", null);
                if (saved && Date.now() - saved.at < LIST_MS) return { ids: new Set(saved.ids), at: saved.at };
                try {
                    const body = await getJSON(NEXTCOUNTS_LIST);
                    const ids = (Array.isArray(body?.data) ? body.data : []).map((c) => c?.id).filter((id) => /^UC[\w-]{22}$/.test(id || ""));
                    if (!ids.length) throw new Error("empty list");
                    await store.set("nextcountsStudio", { ids, at: Date.now() });
                    return { ids: new Set(ids), at: Date.now() };
                } catch {
                    return { ids: null, at: Date.now() }; // unknown: try again in 10 minutes
                }
            })().finally(() => { studioLoading = null; });
        }
        studio = await studioLoading;
        return studio.ids;
    }

    // The verified Studio count, or null when the channel isn't in the project.
    async function nextcountsCount(id) {
        try {
            const v2 = await getJSON(NEXTCOUNTS_V2 + encodeURIComponent(id));
            if (v2?.verifiedSubCount === false) return null;
            if (v2?.verifiedSubCount === true && toCount(v2.subcount) !== null) return toCount(v2.subcount);
        } catch { /* fall through to the older endpoint */ }
        try {
            const old = await getJSON(NEXTCOUNTS_REALTIME(id));
            return old?.success === true ? toCount(old.data?.subscribers) : null;
        } catch {
            return null;
        }
    }

    async function mixernoCount(id) {
        try {
            return toCount((await getJSON(MIXERNO + encodeURIComponent(id)))?.items?.[0]?.statistics?.subscriberCount);
        } catch {
            return null;
        }
    }

    // `bulk` marks lookups for lists of channels: those only ask NextCounts when the
    // participant list confirms the channel is in the project.
    async function lookup(id, bulk) {
        const ids = await studioChannels();
        if (ids ? ids.has(id) : !bulk) {
            const count = await nextcountsCount(id);
            if (count !== null) return { count, source: "nextcounts" };
        }
        const count = await mixernoCount(id);
        return count === null ? null : { count, source: "mixerno" };
    }

    async function fetchCount(id, { fresh = false, bulk = false } = {}) {
        const hit = cache.get(id);
        if (hit?.promise) return hit.promise;
        if (!fresh && hit?.at && Date.now() - hit.at < CACHE_MS) return hit.count;
        const promise = lookup(id, bulk).then((result) => {
            if (result) cache.set(id, { ...result, at: Date.now() });
            else cache.delete(id);
            return result?.count ?? null;
        });
        cache.set(id, { ...hit, promise });
        return promise;
    }

    // Which source the latest count for `id` came from: SOURCES.nextcounts or SOURCES.mixerno.
    const sourceOf = (id) => SOURCES[cache.get(id)?.source] || SOURCES.mixerno;

    const updatedAt = (id) => cache.get(id)?.at ?? Date.now();

    // ---------- history (local only; powers growth, projections and the popup) ----------

    const MAX_POINTS = 240;
    const MIN_GAP_MS = 5 * 60_000;
    let historyWrite = Promise.resolve();

    function observe(id, count, meta = {}) {
        historyWrite = historyWrite.then(async () => {
            const history = await store.get("history", {});
            const entry = history[id] || { points: [] };
            if (meta.name) entry.name = meta.name;
            if (meta.handle) entry.handle = meta.handle;
            const now = Date.now();
            const last = entry.points[entry.points.length - 1];
            // Keep one point per five minutes; within that window just update the latest value.
            if (last && now - last[0] < MIN_GAP_MS && entry.points.length > 1) entry.points[entry.points.length - 1] = [now, count];
            else entry.points.push([now, count]);
            entry.points = entry.points.slice(-MAX_POINTS);
            entry.seen = now;
            history[id] = entry;
            await store.set("history", history);
        });
        return historyWrite;
    }

    const getHistory = () => store.get("history", {});

    // Subscribers per day across the stored points; needs at least 30 minutes of data.
    function growthPerDay(points = []) {
        if (points.length < 2) return null;
        const [t0, c0] = points[0];
        const [t1, c1] = points[points.length - 1];
        const days = (t1 - t0) / 86_400_000;
        return days >= 1 / 48 ? (c1 - c0) / days : null;
    }

    // Next "round" milestone two significant figures up: 34,010 -> 35,000; 452,318,906 -> 460,000,000.
    function nextMilestone(n) {
        const step = 10 ** Math.max(2, String(Math.floor(n)).length - 2);
        return (Math.floor(n / step) + 1) * step;
    }

    // ---------- digit roll ----------

    // Renders `text` into `el` as rolling digits. Digits are drawn by CSS from data
    // attributes, so the element's text stays clean; a visually hidden copy is what
    // screen readers read and what gets copied.
    const canRoll = () => typeof CSS !== "undefined" && CSS.supports("height", "1lh");

    function roll(el, text, prevText = "", animate = false) {
        const wrap = document.createElement("span");
        wrap.className = "ryts-roll";
        wrap.setAttribute("aria-hidden", "true");
        const chars = [...text];
        const offset = chars.length - [...prevText].length; // align digits from the right
        const moves = [];
        let run = null; // consecutive non-digits share one box, aligned like the digits
        chars.forEach((ch, i) => {
            if (!/\d/.test(ch)) {
                if (!run) wrap.append(run = Object.assign(document.createElement("span"), { className: "ryts-t" }));
                run.textContent += ch;
                return;
            }
            run = null;
            const to = +ch;
            const before = [...prevText][i - offset];
            const from = animate && /\d/.test(before || "") ? +before : to;
            const box = document.createElement("span");
            box.className = "ryts-d";
            const reel = document.createElement("span");
            reel.className = "ryts-reel";
            for (let d = 0; d < 10; d++) {
                const face = document.createElement("span");
                face.dataset.d = d;
                reel.append(face);
            }
            reel.style.transform = `translateY(calc(-1lh * ${from}))`;
            box.append(reel);
            wrap.append(box);
            if (from !== to) moves.push([reel, to]);
        });
        const sr = document.createElement("span");
        sr.className = "ryts-sr";
        sr.textContent = text;
        el.replaceChildren(wrap, sr);
        if (moves.length) {
            wrap.getBoundingClientRect(); // commit start positions
            requestAnimationFrame(() => moves.forEach(([reel, to]) => { reel.style.transform = `translateY(calc(-1lh * ${to}))`; }));
        }
    }

    // ---------- extension pages ----------

    const pageUrl = (page, params) => {
        const getURL = (globalThis.browser || globalThis.chrome)?.runtime?.getURL;
        if (!getURL || !ext) return null; // userscript: no extension pages
        return getURL(page) + "?" + new URLSearchParams(params);
    };

    return {
        API, SOURCE, SOURCES, store, getSettings, setSettings, onSettings,
        format, exact, time, canRoll, roll, fetchCount, sourceOf, updatedAt, observe, getHistory, growthPerDay, nextMilestone, pageUrl,
    };
})();
