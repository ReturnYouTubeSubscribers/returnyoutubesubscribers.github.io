let currentURL = window.location.href;
const apiLink = "https://backend.mixerno.space/api/youtube/estv3/";
const apiPath = "items[0].statistics.subscriberCount";
const strType = "en-US";

const possibleSubCounters = [
    "#owner-sub-count",
    "#page-header > yt-page-header-renderer > yt-page-header-view-model > div > div.yt-page-header-view-model__page-header-headline > div > yt-content-metadata-view-model > div:nth-child(3) > span:nth-child(1)"
];

function getValueFromJson(json, path) {
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.'); // Converts [0] to .0 and splits on .
    let result = json;

    for (let key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return undefined;
        }
    }

    return result;
}

function check() {
    let url = window.location.href;
    if (url.includes("/results?search_query=")) {
        setTimeout(function () { searchResults(); }, 1000);
    } else {
        const subscriberCount = document.querySelector(possibleSubCounters[1]);
        const ownerSubCount = document.querySelector(possibleSubCounters[0]);

        if (subscriberCount) {
            stats();
        } else if (ownerSubCount) {
            stats2();
        } else {
            setTimeout(check, 100);
        }
    }
}

async function fetchSubscriberData(channelId, targetSelectorIndex, element) {
    try {
        const response = await fetch(apiLink + channelId);
        const data = await response.json();

        if (data) {

            let subscriberText = getValueFromJson(data, apiPath);
            console.log(subscriberText)

            if (element) {
                element.innerText = parseInt(subscriberText).toLocaleString(strType) + " subscribers";
            } else {
                const targetElement = document.querySelector(possibleSubCounters[targetSelectorIndex]);

                if (!targetElement) return;
                if (subscriberText !== undefined && subscriberText !== null) {
                    subscriberText = String(subscriberText).trim();
                    targetElement.innerText = parseInt(subscriberText).toLocaleString(strType) + " subscribers";
                    targetElement.setAttribute("loaded", "true");
                    targetElement.removeAttribute("is-empty");
                    subs = parseInt(subscriberText);
                }
            }
        } else {
            console.error("[RYTS] Error fetching subscriber data:", data);
        }

    } catch (error) {
        console.error("[RYTS] Error fetching subscriber data:", error);
    }
}

function stats() {
    const req = new XMLHttpRequest();
    req.open("GET", currentURL, false);
    req.send(null);

    if (req.status === 200) {
        const res = req.responseText;
        const channelId = extractChannelId(res);
        if (channelId) {
            fetchSubscriberData(channelId, 1);
        }
    }
}

function stats2() {
    const req = new XMLHttpRequest();
    req.open("GET", currentURL, false);
    req.send(null);

    if (req.status === 200) {
        const res = req.responseText;
        const channelId = extractChannelId(res);
        if (channelId) {
            fetchSubscriberData(channelId, 0);
        }
    }
}

function extractChannelId(responseText) {
    const browseIdMatch = responseText.match(/"browse_id":"(.*?)"/);
    const channelIdMatch = responseText.match(/"channelId":"(.*?)"/);
    const externalIdMatch = responseText.match(/"externalId":"(.*?)"/);

    console.log("[RYTS] Browse ID:", browseIdMatch?.[1]);
    console.log("[RYTS] Channel ID:", channelIdMatch?.[1]);
    console.log("[RYTS] External ID:", externalIdMatch?.[1]);

    return externalIdMatch?.[1] || browseIdMatch?.[1] || channelIdMatch?.[1] || null;
}

setInterval(() => {
    const url = window.location.href;
    if (currentURL !== url) {
        currentURL = url;
        console.log("[RYTS] URL changed:", url);
        if (url.includes("/results?search_query=")) {
            setTimeout(searchResults, 1000);
        } else if (/\/channel\/|\/c\/|\/user\/|\/watch\?v=|\/@/.test(url)) {
            const subscriberCount = document.querySelector(possibleSubCounters[1]);
            const isWatchPage = url.includes("/watch?v=");

            console.log("[RYTS]", isWatchPage ? "Watch page" : "Channel page");
            if (isWatchPage) {
                stats2();
            } else {
                const updateStats = () => {
                    if (subscriberCount && subscriberCount.getAttribute("is-empty") === null) {
                        stats();
                    } else {
                        setTimeout(updateStats, 500);
                    }
                };
                updateStats();
            }
        }
    }
}, 500);

async function searchResults() {
    console.log('[RYTS] Search Page')
    try {
        let channelRenderers = document.querySelectorAll("ytd-channel-renderer");
        for (const channelRenderer of channelRenderers) {
            try {
                let link = channelRenderer.querySelector("#main-link").href;
                console.log(link)
                if (link) {
                    if (link.includes("@")) {
                        fetch("https://www.youtube.com/@" + link.split("@")[1])
                            .then((response) => response.text())
                            .then(async (data) => {
                                if (data && data.includes('externalId')) {
                                    let channelId = data.split('"externalId":"')[1].split('"')[0];
                                    fetchSubscriberData(channelId, 0, channelRenderer.querySelector("#video-count"));
                                }
                            });
                    } else {

                    }
                }
            } catch (error) {
                console.error("[RYTS] Error fetching search results:", error);
            }
        }
    } catch (error) {
        console.error("[RYTS] Error fetching search results:", error);
        setTimeout(searchResults, 1000);
    }
}

check();