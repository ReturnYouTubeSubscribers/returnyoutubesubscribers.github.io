// ==UserScript==
// @name         Return YouTube Subscribers
// @namespace    returnyoutubesubscribers.github.io
// @version      0.4
// @description  Fixes YouTube's Subscriber Counts On Channel/Video Pages.
// @author       AJ
// @match        *://*.youtube.com/*
// @icon         https://raw.githubusercontent.com/returnyoutubesubscribers/returnyoutubesubscribers.github.io/main/assets/icon.png
// @run-at document-start
// @grant        none
// ==/UserScript==

var currentURL = window.location.href;

check()
function check() {
    if (document.getElementById("subscriber-count")) {
        if (document.getElementById('edit-buttons').childElementCount == 2) {
            stats()
        } else {
            stats()
        }
    } else if (document.getElementById("owner-sub-count")) {
        stats2()
    } else {
        setTimeout(function () {
            check()
        }, 100)
    }
}

function stats() {
    var req = new XMLHttpRequest();
    req.open('GET', currentURL, false);
    req.send(null);
    if (req.status == 200) {
        let res = req.responseText
        cid = res.split(`,{"key":"browse_id","value":"`)[1].split(`"},`)[0]
        getCount()
        async function getCount() {
            await fetch('https://api.mgcounts.com/' + cid + '')
                .then(response => response.json())
                .then(data => {
                    if (data) {
                        if (data.success == true) {
                            if (document.querySelector("#subscriber-count").getAttribute('is-empty') == "") {
                                document.querySelector("#subscriber-count").removeAttribute('is-empty')
                            }
                            if (data.verified == true) {
                                document.querySelector("#subscriber-count").innerText = data.count.toLocaleString() + " subscribers " + data.by + ""
                                document.querySelector("#subscriber-count").setAttribute("loaded", "true")
                            } else {
                                document.querySelector("#subscriber-count").innerText = data.count.toLocaleString() + " subscribers"
                                document.querySelector("#subscriber-count").setAttribute("loaded", "true")
                            }
                        } else if (data.count == null) {
                            document.querySelector("#subscriber-count").innerText = res.split(`,"subscriberCountText":{"accessibility":{"accessibilityData":{"label":"`)[1].split(' subscribers')[0] + " subscribers"
                            document.querySelector("#subscriber-count").setAttribute("loaded", "true")
                        }
                    }
                }).catch(err => {
                    console.log(err)
                })
        }
    }
}

function stats2() {
    var currentURL = window.location.href;
    var req = new XMLHttpRequest();
    req.open('GET', currentURL, false);
    req.send(null);
    if (req.status == 200) {
        let res = req.responseText
        if (res.includes(`,{"key":"browse_id","value":"`)) {
            cid = res.split(`,{"key":"browse_id","value":"`)[1].split(`"},`)[0]
        } else if (res.includes(`"channelId":"`)) {
            cid = res.split(`"channelId":"`)[1].split(`"`)[0]
        } else {
            cid = res.split(`"externalId":"`)[1].split(`"`)[0]
        }
        getCount()
        async function getCount() {
            await fetch('https://api.mgcounts.com/' + cid + '')
                .then(response => response.json()).then(data => {
                    if (data) {
                        console.log(data)
                        if (data.count == null) {
                            document.querySelector("#owner-sub-count").innerText = "failed to load subscriber count"
                            document.querySelector("#owner-sub-count").setAttribute("loaded", "true")
                        } else {
                            if (data.verified == true) {
                                document.querySelector("#owner-sub-count").innerText = data.count.toLocaleString() + " subscribers " + data.by + ""
                                document.querySelector("#owner-sub-count").setAttribute("loaded", "true")
                            } else {
                                document.querySelector("#owner-sub-count").innerText = data.count.toLocaleString() + " subscribers"
                                document.querySelector("#owner-sub-count").setAttribute("loaded", "true")
                            }
                        }
                        if (document.querySelector("#owner-sub-count").getAttribute('is-empty') == "") {
                            document.querySelector("#owner-sub-count").removeAttribute('is-empty')
                        }
                    }
                }).catch(err => {
                    console.log(err)
                })
        }
    }
}

setInterval(function () {
    const url = window.location.href
    if ((currentURL == window.location.href) == false) {
        if (url.includes("/channel/") || url.includes("/c/") || url.includes("/user/") || url.includes("/watch?v=") || url.includes("/@")) {
            if (url.includes("/channel/") || url.includes("/c/") || url.includes("/user/") || url.includes("/watch?v=") || url.includes("/@")) {
                currentURL = window.location.href;
            }
            if (url.includes("/watch?v=")) {
                stats2()
            } else if (url.includes("/channel/") || url.includes("/c/") || url.includes("/user/") || url.includes("/@")) {
                function thing() {
                    if (document.querySelector("#subscriber-count")) {
                        if (document.querySelector("#subscriber-count").getAttribute('is-empty') == "") {
                            document.querySelector("#subscriber-count").removeAttribute('is-empty')
                        }
                        if (document.getElementById('edit-buttons').childElementCount == 2) {
                            stats()
                        } else {
                            stats()
                        }
                    } else {
                        setTimeout(function () {
                            thing()
                        }, 500)
                    }
                }
                thing()
            }
        }
    }
}, 500)
