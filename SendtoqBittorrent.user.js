// ==UserScript==
// @name         Send to qBittorrent
// @namespace    acf.me.uk
// @description  Send torrents to qBittorrent via the right click context menu. TamperMonkey only!
// @author       ACF, MSerj
// @version      0.3
// @downloadURL  https://github.com/acffordyce973/UserScripts/raw/refs/heads/main/SendtoqBittorrent.user.js
// @updateURL    https://github.com/acffordyce973/UserScripts/raw/refs/heads/main/SendtoqBittorrent.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=qbittorrent.org
// @include      *
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

// Set up the qBittorrent configuration prompts
async function setUpQBittorrentSettings() {
    const qBittorrentUrl = prompt("Enter qBittorrent WEB UI address:", GM_getValue("qBittorrentUrl", ""));
    const username = prompt("Enter qBittorrent WEB UI username:", GM_getValue("username", ""));
    const password = prompt("Enter qBittorrent WEB UI password:", GM_getValue("password", ""));
    const categories = prompt("Enter comma separated categories:", GM_getValue("categories", []));

    GM_setValue("qBittorrentUrl", qBittorrentUrl);
    GM_setValue("username", username);
    GM_setValue("password", password);
    GM_setValue("categories", categories.replace(/\s+/g, '').split(","));
    alert("qBittorrent settings saved.");
}

// Function to send download link to qBittorrent WEB UI
function sendToQBittorrent(downloadUrl, category) {
    const qBittorrentUrl = GM_getValue("qBittorrentUrl");
    const username = GM_getValue("username");
    const password = GM_getValue("password");

    if (!qBittorrentUrl || !username || !password) {
        alert("Please configure your qBittorrent settings first.");
        setUpQBittorrentSettings();
        return;
    }

    // Authenticate with QNAP to get a session token
    GM_xmlhttpRequest({
        method: "POST",
        url: `${qBittorrentUrl}/api/v2/auth/login`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        onload: function(response) {
            if (response.status === 200 && response.responseText === "Ok.") {
                GM_xmlhttpRequest({
                    method: "POST",
                    url: `${qBittorrentUrl}/api/v2/torrents/add`,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    data: `urls=${encodeURIComponent(downloadUrl)}&category=${category}`,
                    onload: function(response) {
                        if (response.status === 200) {
                            if (category == "") { category="Default"; }
                            GM_notification({text: downloadUrl, title: `Torrent Added to ${category}`, url: qBittorrentUrl, onclick: (event) =>
                                {
                                    console.log("Notification was clicked.");
                                },
                            });
                        } else {
                            alert(`Failed to add torrent: ${response.responseText}`);
                        }
                    },
                    onerror: function(error) {
                        console.error(error)
                        alert(`Add torrent request failed: ${error}`);
                    }
                });
            } else {
                console.warn(response)
                alert("Failed to authenticate in qBittorrent. Please check your credentials.");
            }
        },
        onerror: function(error) {
            console.error(error)
            alert("Error connecting to qBittorrent for authentication.");
        }
    });
}

let clickedEl = null;

document.addEventListener("contextmenu", function(event) {
    clickedEl = event.target;
});

GM_registerMenuCommand("Default Download", () => {
    if (clickedEl) {
        console.log(`the clicked element is :`)
        console.log(clickedEl)
        const target = clickedEl.closest("a");
        sendToQBittorrent(target.href, "");
    }
});

let categories = GM_getValue("categories", []);
for (const category of categories) {
    GM_registerMenuCommand(category + " Download", () => {
        if (clickedEl) {
            console.log(`the clicked element is :`)
            console.log(clickedEl)
            const target = clickedEl.closest("a");
            sendToQBittorrent(target.href, category);
        }
    });
}

// Menu command to configure qBittorrent settings
GM_registerMenuCommand("Configure qBittorrent Settings", setUpQBittorrentSettings);
