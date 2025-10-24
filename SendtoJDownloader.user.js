// ==UserScript==
// @name         Send to JDownloader
// @namespace    acf.me.uk
// @description  Send URLs to JDownloader via the right click context menu. TamperMonkey only!
// @author       ACF
// @version      0.2
// @updateURL    https://github.com/acffordyce973/UserScripts/raw/refs/heads/main/SendtoJDownloader.user.js
// @include      *
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    function sendToJDownloader(downloadUrl) {
        var jdownloaderUrl = 'http://127.0.0.1:9666/flash/add?urls=' + downloadUrl;

        GM.xmlHttpRequest({
            method: 'POST',
            url: jdownloaderUrl,
            headers: {
                Referer: "http://localhost/"
            },
            data: 'urls=' + downloadUrl,
            onload: function(response) {
                GM_notification({
                    text: downloadUrl,
                    title: "Link Sent to JDownloader",
                    url: "https://jdownloader.org/",
                    onclick: (event) => {
                        console.log("Notification was clicked.");
                    },
                });
            },
            onerror: function(error) {
                alert(`Error sending URL to JDownloader: ${error}`);
            }
        });
    }

    let clickedEl = null;

    document.addEventListener("contextmenu", function(event) {
        clickedEl = event.target;
    });

    GM_registerMenuCommand("Grab Link", () => {
        if (clickedEl) {
            console.log(`the clicked element is :`)
            console.log(clickedEl)
            const target = clickedEl.closest("a");
            sendToJDownloader(target.href);
        }
    });
})();
