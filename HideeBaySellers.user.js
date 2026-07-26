// ==UserScript==
// @name         Hide eBay Sellers
// @namespace    https://www.ebay.co.uk/
// @version      0.9.1
// @description  Adds a blacklist for sellers on eBay that will remove their results. Name blacklist should be comma-separated (no spaces) and supports * as a wildcard for one or more characters.
// @author       ACF
// @license      GPLv3
// @updateURL    https://github.com/acffordyce973/UserScripts/raw/refs/heads/main/HideeBaySellers.user.js
// @downloadURL  https://github.com/acffordyce973/UserScripts/raw/refs/heads/main/HideeBaySellers.user.js
// @include      /^https:\/\/www\.ebay\.(co\.uk|com)\/(itm|sch|usr)\/.*/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ebay.co.uk
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
	#eBSBToggleButton {
		cursor: pointer;
	}

	#eBSBBlacklistArea {
		background-color: black;
		color: white;
		font-family: monospace;
	}

	#eBSBOuterDiv {
		float: left;
		background-color: black;
		color: white;
		padding: 5px;
		border: 1px solid white;
		border-radius: 10px;
		z-index: 2147483647;
		display: block;
		position: absolute;
		top: 5px;
		left: 5px;
	}

	.hidden {
		display: none;
	}
`);

let arrUserBlacklist = GM_getValue("blacklist", []);
let arrKeywordBlacklist = GM_getValue("keywords", []);
let intUserFeedback = GM_getValue("feedback", 80);
let intUserRatings = GM_getValue("ratings", 30);

let nodeNewBox = document.createElement("div");
nodeNewBox.innerHTML = `
<div id="eBSBOuterDiv">
	<span id="eBSBToggleButton" title="Hide eBay Sellers"><b>Stats:</b><br>Inactive</span>
		<div id="eBSBInnerDiv" class="hidden">
			<br><b>Userscript Settings</b><br>
			Hide sellers with a feedback percentage less than:<br>
			<input type="number" id="intFeedbackPercentage" min="0" max="100" value="${intUserFeedback}"><br>
			Hide sellers with a feedback total less than:<br>
			<input type="number" id="intFeedbackAmount" min="0" max="500" value="${intUserRatings}"><br>
			Comma-separated list of blacklisted keywords:<br>
			<textarea id="txtKeywordBlacklist" rows="15" cols="176">${arrKeywordBlacklist}</textarea><br>
			Comma-separated list of blacklisted sellers:<br>
			<textarea id="txtUserBlacklist" rows="15" cols="176">${arrUserBlacklist}</textarea><br>
			<i>Star (*) is supported as a basic wildcard.</i><br>
			<input type="button" value="Save & Reload" id="eBSBSaveButton">
		<div>
	</div>
`;
document.body.append(nodeNewBox);

document.getElementById("eBSBSaveButton").onclick = function() {
	GM_setValue("blacklist", document.getElementById("txtUserBlacklist").value.replace(/\s+/g, '').split(","));
	GM_setValue("keywords", document.getElementById("txtKeywordBlacklist").value.split(","));
	GM_setValue("feedback", parseInt(document.getElementById("intFeedbackPercentage").value));
	GM_setValue("ratings", parseInt(document.getElementById("intFeedbackAmount").value));
	location.reload();
};

document.getElementById("eBSBToggleButton").onclick = function() {
	document.getElementById('eBSBInnerDiv').classList.toggle('hidden');
};

function matchesRule(strString, strRule) { return new RegExp("^" + strRule.split("*").map((strMatch) => strMatch.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")).join(".*") + "$").test(strString); }

function currentLayout(nodeListElements, strTitleSelector, strTitleClass, strInfoSelector) {
	let intCountSellers = 0;
	let intCountKeywords = 0;
	let intCountPercentages = 0;
	let intCountRatings = 0;

	for(let intCountListing = 0; intCountListing < nodeListElements.length; intCountListing++) {
		let boolListingHidden = false;

		try {
			let nodeListTitleElements = nodeListElements[intCountListing].querySelector(strTitleSelector).getElementsByClassName(strTitleClass);
			if (nodeListTitleElements.length > 0 && nodeListTitleElements[0].innerText.trim()) {
				console.info("Checking if listing title '" + nodeListTitleElements[0].innerText.trim() + "' for listing " + intCountListing + " contains a blacklisted keyword...");
				for (const strBlacklistedKeyword of arrKeywordBlacklist) {
					if (matchesRule(nodeListTitleElements[0].innerText.trim().toLowerCase(), strBlacklistedKeyword.toLowerCase())) {
						nodeListElements[intCountListing].classList.add("hidden");
						boolListingHidden = true;
						intCountKeywords++;
						console.info("Hiding listing due to title match of " + strBlacklistedKeyword + "...");
						break;
					}
				}
			}
		} catch (error) { console.error("Could not find title - listing " + intCountListing + ": " + error); }

		if (boolListingHidden) continue;

		let nodeListInfoElements = nodeListElements[intCountListing].querySelectorAll(strInfoSelector);

		for(let intCountInfoElement = 0; intCountInfoElement < nodeListInfoElements.length; intCountInfoElement++) {
			if (!nodeListInfoElements[intCountInfoElement].innerHTML.includes("su-styled-text")) continue;

			let nodeInfoSpans = nodeListInfoElements[intCountInfoElement].getElementsByClassName("su-styled-text");
			console.info("Found " + nodeInfoSpans.length + " info spans for listing " + intCountListing + ":");

			let strSeller = "";
			let strPercent = "100";
			let strRatings = "100";

			for(let intCountInfoSpan = 0; intCountInfoSpan < nodeInfoSpans.length; intCountInfoSpan++) {
				let strSpanText = nodeInfoSpans[intCountInfoSpan].textContent;

				if (!strSpanText.includes("%") || !strSpanText.includes("(") || !strSpanText.includes(")")) continue;

				try { strPercent = strSpanText.match(/(\d+(\.\d+)?%)/)[0]; } catch (error) { console.error("Could not find seller percentage - span " + intCountInfoSpan + ": " + error); }
				try { strRatings = strSpanText.match(/\(([^)]+)\)/)[1]; } catch (error) { console.error("Could not find seller amount - span " + intCountInfoSpan + ": " + error); }

				if (intCountInfoSpan > 0) {
					try { strSeller = nodeInfoSpans[intCountInfoSpan - 1].textContent.trim(); } catch (error) { console.error("Could not find seller name - span " + (intCountInfoSpan - 1) + ": " + error); }
				}
			}

			if(strSeller) {
				for (const strBlacklistedUser of arrUserBlacklist) {
					if (matchesRule(strSeller, strBlacklistedUser)) {
						nodeListElements[intCountListing].classList.add("hidden");
						intCountSellers++;
						boolListingHidden = true;
						console.info("Hiding listing due to seller name match of " + strSeller + "...");
						break;
					}
				}
			}

			if (boolListingHidden) break;

			if (strPercent && parseFloat(strPercent) < intUserFeedback) {
				nodeListElements[intCountListing].classList.add("hidden");
				intCountPercentages++;
				boolListingHidden = true;
				console.info("Hiding listing due to low percentage match of " + parseFloat(strPercent) + "...");
				break;
			}

			if (strRatings) {
				let intParsedRatings = strRatings.includes('K') ? parseFloat(strRatings) * 1000 : parseInt(strRatings);
				if (intParsedRatings < intUserRatings) {
					nodeListElements[intCountListing].classList.add("hidden");
					intCountRatings++;
					console.info("Hiding listing due to low rating match of " + strRatings + "...");
					break;
				}
			}
		}
	}

	document.getElementById("eBSBToggleButton").innerHTML="<b>Hide Stats:</b><br>" + intCountSellers + " Seller Name<br>" + intCountKeywords + " Title Keyword<br>" + intCountPercentages + " Low Feedback<br>" + intCountRatings + " Low Ratings";
}

if(window.location.href.includes("/sch/")) {
	const objSelectors = {
		"li.s-card": ["div.s-card__title", "su-styled-text", "div.s-card__attribute-row"],
		"li.su-grid__item": ["a.su-item-card__title", "su-styled-text", "div.su-card-container__attributes"]
	};

	for (const [strSelector, arrArguments] of Object.entries(objSelectors)) {
		let nodeListElements = document.querySelectorAll(strSelector);
		console.info("Found " + nodeListElements.length + " item listings using `" + strSelector + "`...");
		if (nodeListElements.length > 0) currentLayout(nodeListElements, ...arrArguments);
	}
}
