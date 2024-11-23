// ==UserScript==
// @name         Return YouTube Subscribers
// @namespace    ryts.mgcounts.com
// @version      4.0
// @description  Returns the full unabbreviated subscriber count to channels, videos, and search results on YouTube.
// @author       @ok_aj
// @match        *://*.youtube.com/*
// @icon         https://raw.githubusercontent.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/main/assets/icon.png
// @run-at document-start
// @grant        none
// ==/UserScript==

let currentURL = window.location.href;
const apiLink = "https://axern.space/api/get?platform=youtube&type=channel&id=";
const apiPath = "data.estSubCount";
const strType = "en-US";
const possibleSubCounters = [
    "#owner-sub-count",
    "#page-header > yt-page-header-renderer > yt-page-header-view-model > div > div.page-header-view-model-wiz__page-header-headline > div > yt-content-metadata-view-model > div:nth-child(3) > span:nth-child(1)",
];
const possibleSources = [
    ["https://axern.space/api/get?platform=youtube&type=channel&id=", "estSubCount"]
];

function getValueFromJson(json, path) {
    const keys = path.split(/[\.\[\]\'\"]/).filter(Boolean);
    let result = json;

    for (let key of keys) {
        if (Array.isArray(result)) {
            const index = parseInt(key, 10);
            if (index >= 0 && index < result.length) {
                result = result[index];
            } else {
                return undefined;
            }
        } else if (result && result[key] !== undefined) {
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
        searchResults();
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
        const apiUrl = possibleSources[targetSelectorIndex][0];
        const apiPath = possibleSources[targetSelectorIndex][1];

        const response = await fetch(apiUrl + channelId);
        const data = await response.json();

        if (data) {

            let subscriberText = getValueFromJson(data, apiPath);

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
            console.error("Error fetching subscriber data:", data);
        }

    } catch (error) {
        console.error("Error fetching subscriber data:", error);
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

    console.log("Browse ID:", browseIdMatch?.[1]);
    console.log("Channel ID:", channelIdMatch?.[1]);
    console.log("External ID:", externalIdMatch?.[1]);

    return externalIdMatch?.[1] || browseIdMatch?.[1] || channelIdMatch?.[1] || null;
}

setInterval(() => {
    const url = window.location.href;
    if (currentURL !== url) {
        currentURL = url;
        console.log("URL changed:", url);
        if (url.includes("/results?search_query=")) {
            setTimeout(searchResults, 1000);
        } else if (/\/channel\/|\/c\/|\/user\/|\/watch\?v=|\/@/.test(url)) {
            const subscriberCount = document.querySelector(possibleSubCounters[1]);
            const isWatchPage = url.includes("/watch?v=");

            console.log(isWatchPage ? "Watch page" : "Channel page");
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
    try {
        let children = document.querySelector("#contents").children[0].children[2].children || [];
        while (children.length === 0) {
            children = document.querySelector("#contents").children[0].children[2].children;
        }
        let channelRenderers = document.querySelectorAll("ytd-channel-renderer");
        for (const channelRenderer of channelRenderers) {
            let link = channelRenderer.querySelector("#main-link").href;
            if (link) {
                if (link.includes("@")) {
                    fetch("https://www.youtube.com/@" + link.split("@")[1])
                        .then((response) => response.text())
                        .then(async (data) => {
                            let channelId = data.split('"externalId":"')[1].split('"')[0];
                            fetchSubscriberData(channelId, 0, channelRenderer.querySelector("#video-count"));
                        });
                } else {

                }
            }
        }
    } catch (error) {
        console.error("Error fetching search results:", error);
        setTimeout(searchResults, 1000);
    }
}

check();