// Toolbar popup: channels you've viewed, ranked by growth; race picker; number format.

(async () => {
    const R = RYTS;
    const history = await R.getHistory();
    const channels = Object.entries(history).map(([id, h]) => ({
        id,
        name: h.name || h.handle || id,
        count: h.points.at(-1)?.[1],
        perDay: R.growthPerDay(h.points),
        seen: h.seen || 0,
    })).filter((c) => c.count != null);

    const list = document.getElementById("list");
    const empty = document.getElementById("empty");
    const counterLink = (params) => R.pageUrl("counter.html", params);

    function render(view) {
        const rows = view === "growing"
            ? channels.filter((c) => c.perDay !== null).sort((a, b) => b.perDay - a.perDay)
            : [...channels].sort((a, b) => b.seen - a.seen);
        list.replaceChildren(...rows.slice(0, 10).map((c, i) => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = counterLink({ c: c.id, n: c.name });
            a.target = "_blank";
            const cell = (cls, text) => Object.assign(document.createElement("span"), { className: cls, textContent: text });
            const delta = c.perDay === null ? "" : `${c.perDay >= 0 ? "+" : "−"}${R.exact(Math.round(Math.abs(c.perDay)))}/day`;
            a.append(cell("rank", i + 1), cell("name", c.name), cell("delta" + (c.perDay < 0 ? " down" : ""), delta), cell("count", R.exact(c.count) + " subscribers"));
            li.append(a);
            return li;
        }));
        empty.hidden = rows.length > 0;
        empty.textContent = channels.length === 0
            ? "Open a few YouTube channels or videos. They'll appear here with their exact counts."
            : "Growth shows up once you've seen a channel twice, at least 30 minutes apart. Check Recently viewed for now.";
    }

    const tabs = [...document.querySelectorAll('[role="tab"]')];
    for (const tab of tabs) {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.setAttribute("aria-selected", t === tab));
            render(tab.dataset.view);
        });
    }
    render(channels.some((c) => c.perDay !== null) || channels.length === 0 ? "growing" : "recent");
    if (!channels.some((c) => c.perDay !== null) && channels.length) tabs.forEach((t) => t.setAttribute("aria-selected", t.dataset.view === "recent"));

    // Race picker
    const [a, b] = ["race-a", "race-b"].map((id) => document.getElementById(id));
    const byCount = [...channels].sort((x, y) => y.count - x.count);
    for (const select of [a, b]) {
        select.replaceChildren(...byCount.map((c) => new Option(c.name, c.id)));
    }
    if (byCount[1]) b.value = byCount[1].id;
    const raceButton = document.getElementById("race");
    raceButton.disabled = byCount.length < 2;
    if (byCount.length < 2) raceButton.title = "View at least two channels first";
    raceButton.addEventListener("click", () => {
        const name = (id) => channels.find((c) => c.id === id)?.name || "";
        open(counterLink({ c: a.value, n: name(a.value), vs: b.value, vn: name(b.value) }), "_blank");
    });

    // Number format
    const settings = await R.getSettings();
    for (const radio of document.querySelectorAll('input[name="format"]')) {
        radio.checked = radio.value === settings.format;
        radio.addEventListener("change", () => R.setSettings({ format: radio.value }));
    }
})();
