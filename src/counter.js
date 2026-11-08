// Full-screen live counter for one channel, or a race between two.
//   counter.html?c=<channelId>&n=<name>[&vs=<channelId>&vn=<name>]

(async () => {
    const R = RYTS;
    const REFRESH_MS = 5000;
    const params = new URLSearchParams(location.search);
    const history = await R.getHistory();
    const nameOf = (id, given) => given || history[id]?.name || history[id]?.handle || id;

    const sides = [{ id: params.get("c"), name: nameOf(params.get("c"), params.get("n")) }];
    if (params.get("vs")) sides.push({ id: params.get("vs"), name: nameOf(params.get("vs"), params.get("vn")) });

    const board = document.getElementById("board");
    const status = document.getElementById("status");
    if (!sides[0].id) {
        status.textContent = "No channel chosen. Open this page from a channel page or the toolbar popup.";
        return;
    }

    // Layout
    board.classList.toggle("race", sides.length > 1);
    for (const side of sides) {
        const section = document.createElement("section");
        section.className = "side";
        const h1 = document.createElement("h1");
        h1.textContent = side.name;
        side.number = Object.assign(document.createElement("div"), { className: "big", textContent: "–" });
        const sub = Object.assign(document.createElement("p"), { textContent: "subscribers" });
        section.append(h1, side.number, sub);
        side.section = section;
        board.append(section);
    }
    const gap = Object.assign(document.createElement("p"), { className: "gap" });
    if (sides.length > 1) board.append(gap);
    document.title = sides.map((s) => s.name).join(" vs ") + " live subscriber count";

    // "Race against" menu
    const vs = document.getElementById("vs");
    Object.entries(history)
        .filter(([id]) => id !== sides[0].id)
        .sort((a, b) => (b[1].points.at(-1)?.[1] || 0) - (a[1].points.at(-1)?.[1] || 0))
        .forEach(([id, h]) => vs.add(new Option(h.name || h.handle || id, id)));
    vs.value = sides[1]?.id || "";
    vs.addEventListener("change", () => {
        const next = new URLSearchParams({ c: sides[0].id, n: sides[0].name });
        if (vs.value) next.set("vs", vs.value), next.set("vn", nameOf(vs.value));
        location.search = next;
    });

    // Refresh loop
    async function refresh() {
        const counts = await Promise.all(sides.map((s) => R.fetchCount(s.id, { fresh: true })));
        if (counts.some((c) => c === null)) {
            status.textContent = `Couldn't reach ${R.SOURCE}. Trying again in ${REFRESH_MS / 1000} seconds.`;
            return;
        }
        sides.forEach((side, i) => {
            const text = R.exact(counts[i]);
            const animate = side.count !== undefined && side.count !== counts[i];
            if (R.canRoll()) R.roll(side.number, text, side.text, animate);
            else side.number.textContent = text;
            side.count = counts[i];
            side.text = text;
            R.observe(side.id, counts[i], { name: side.name });
        });
        if (sides.length > 1) {
            const [a, b] = sides;
            const lead = a.count >= b.count ? a : b;
            const other = lead === a ? b : a;
            sides.forEach((s) => s.section.classList.toggle("leader", s === lead));
            gap.replaceChildren(`${lead.name} leads by `, Object.assign(document.createElement("strong"), { textContent: R.exact(lead.count - other.count) }), " subscribers");
        }
        status.textContent = `Estimated by ${R.SOURCE}. Updated ${R.time(Date.now())}, refreshes every ${REFRESH_MS / 1000} seconds.`;
    }
    await refresh();
    setInterval(refresh, REFRESH_MS);

    // Full screen
    const fs = document.getElementById("fullscreen");
    fs.addEventListener("click", () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()));
    document.addEventListener("fullscreenchange", () => { fs.textContent = document.fullscreenElement ? "Exit full screen" : "Full screen"; });

    // Shareable image
    document.getElementById("save").addEventListener("click", async () => {
        const W = 1200, H = 630, canvas = Object.assign(document.createElement("canvas"), { width: W, height: H });
        const ctx = canvas.getContext("2d");
        const font = (weight, size) => `${weight} ${size}px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = "#F5F6FA"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#E0262F"; ctx.fillRect(0, H - 14, W, 14);
        const logo = new Image();
        logo.src = "icons/icon-128.png";
        await logo.decode().catch(() => {});
        ctx.drawImage(logo, 64, 52, 64, 64);
        ctx.fillStyle = "#1A1C2E"; ctx.font = font(800, 28); ctx.fillText("Return YouTube Subscribers", 140, 94);
        const fit = (text, weight, size, max) => {
            while (size > 12) { ctx.font = font(weight, size); if (ctx.measureText(text).width <= max) break; size -= 2; }
            return size;
        };
        if (sides.length === 1) {
            const s = sides[0];
            ctx.fillStyle = "#1A1C2E"; fit(s.name, 700, 52, W - 128); ctx.fillText(s.name, 64, 250);
            fit(s.text, 800, 170, W - 128); ctx.fillText(s.text, 60, 420);
            ctx.fillStyle = "#5D6178"; ctx.font = font(500, 30); ctx.fillText("subscribers", 64, 475);
        } else {
            sides.forEach((s, i) => {
                const x = 64 + i * 560;
                ctx.fillStyle = "#1A1C2E"; fit(s.name, 700, 40, 500); ctx.fillText(s.name, x, 240);
                fit(s.text, 800, 84, 480); ctx.fillText(s.text, x - 2, 350);
            });
            const lead = sides[0].count >= sides[1].count ? sides[0] : sides[1];
            const diff = R.exact(Math.abs(sides[0].count - sides[1].count));
            ctx.fillStyle = "#5D6178"; ctx.font = font(500, 30); ctx.fillText(`${lead.name} leads by ${diff}`, 64, 460);
        }
        ctx.fillStyle = "#5D6178"; ctx.font = font(500, 22);
        ctx.fillText(`Estimated live count, ${new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}. ryts.mgcounts.com`, 64, H - 52);
        const link = document.createElement("a");
        link.download = `${sides.map((s) => s.name).join("-vs-").replace(/[^\w-]+/g, "_")}-subscribers.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
})();
