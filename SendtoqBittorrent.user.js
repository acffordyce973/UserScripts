// ==UserScript==
// @name			Send to qBittorrent
// @namespace		acf.me.uk
// @description		Send torrents to qBittorrent via the right click context menu. TamperMonkey and API Key only!
// @author			ACF, MSerj
// @version			0.6
// @downloadURL		https://github.com/acffordyce973/UserScripts/raw/refs/heads/main/SendtoqBittorrent.user.js
// @updateURL		https://github.com/acffordyce973/UserScripts/raw/refs/heads/main/SendtoqBittorrent.user.js
// @icon			https://www.google.com/s2/favicons?sz=64&domain=qbittorrent.org
// @include			*
// @grant			GM_registerMenuCommand
// @grant			GM_notification
// @grant			GM_setValue
// @grant			GM_getValue
// @grant			GM_xmlhttpRequest
// @run-at			document-start
// ==/UserScript==

async function setUpQBittorrentSettings() {
	let strUrl = prompt("Enter qBittorrent WEB UI address and port (e.g. http://192.168.1.50:8080):", GM_getValue("url", "")) || "";
	if (strUrl && !strUrl.startsWith("http")) strUrl = "http://" + strUrl;
	GM_setValue("url", strUrl);
	GM_setValue("apiKey", prompt("Enter qBittorrent API Key (e.g. qbt_...):", GM_getValue("apiKey", "")) || "");
	GM_setValue("categories", (prompt("Enter comma separated categories (e.g. music,videos):", GM_getValue("categories", [])) || "").replace(/\s+/g, '').split(","));
	alert("qBittorrent settings saved.");
}

function sendToQBittorrent(strDownloadUrl, strCategory) {
	let strUrl = GM_getValue("url");
	const strApiKey = GM_getValue("apiKey");

	if (!strUrl || !strApiKey) {
		alert("Please configure your qBittorrent settings first.");
		setUpQBittorrentSettings();
		return;
	}

	if (!strUrl.startsWith("http")) strUrl = "http://" + strUrl;

	GM_xmlhttpRequest({
		method: "POST",
		url: `${strUrl}/api/v2/torrents/add`,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Authorization": `Bearer ${strApiKey}`
		},
		data: `urls=${encodeURIComponent(strDownloadUrl)}&category=${strCategory}`,
		onload: (objResponse) => {
			if (objResponse.status >= 200 && objResponse.status < 300) {
				if (strCategory == "") strCategory = "Default";
				GM_notification({text: strDownloadUrl, title: `Torrent Added to ${strCategory}`, url: strUrl, onclick: (objEvent) => console.log("Notification was clicked.")});
			} else {
				alert(`Failed to add torrent. HTTP ${objResponse.status}: ${objResponse.statusText || objResponse.responseText}`);
			}
		},
		onerror: (objError) => {
			console.error("qBittorrent Request Error:", objError);
			alert("Add torrent request failed. Check the browser console for more details.");
		}
	});
}

let objClickedEl = null;

document.addEventListener("contextmenu", (objEvent) => objClickedEl = objEvent.target);

GM_registerMenuCommand("Default Download", () => { if (objClickedEl) sendToQBittorrent(objClickedEl.closest("a").href, ""); });

for (const strCategory of GM_getValue("categories", [])) {
	GM_registerMenuCommand(strCategory + " Download", () => { if (objClickedEl) sendToQBittorrent(objClickedEl.closest("a").href, strCategory); });
}

GM_registerMenuCommand("Configure qBittorrent Settings", setUpQBittorrentSettings);
