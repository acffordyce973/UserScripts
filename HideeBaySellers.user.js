// ==UserScript==
// @name         Hide eBay Sellers
// @namespace    https://www.ebay.co.uk/
// @version      0.9.3
// @description  Adds a blacklist for both listing sellers and titles. Each blacklist should be comma-separated (no spaces) and supports * as a wildcard for one or more characters.
// @author       ACF
// @license      GPLv3
// @updateURL    https://github.com/acffordyce973/UserScripts/raw/refs/heads/main/HideeBaySellers.user.js
// @downloadURL  https://github.com/acffordyce973/UserScripts/raw/refs/heads/main/HideeBaySellers.user.js
// @match        *://www.ebay.co.uk/sch/*
// @match        *://www.ebay.com/sch/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ebay.co.uk
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

//Save the script name to use later
let strScriptName = GM_info.script.name;

//Styles the box for the user to enter their blacklisted words or phrases
GM_addStyle(`
	#btnToggleBlacklistArea {
		cursor: pointer;
		display: block;
		margin-bottom: 5px;
	}

	#areaBlacklist {
		background-color: black;
		color: white;
		font-family: monospace;
	}

	#divOuterAreaBlacklist {
		background-color: black;
		color: white;
		padding: 10px;
		border: 1px solid white;
		border-radius: 10px;
		z-index: 2147483647;
		position: fixed;
		top: 5px;
		left: 5px;
		box-sizing: border-box;
	}

	#divOuterAreaBlacklist.fullscreen {
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		border-radius: 0;
		display: flex;
		flex-direction: column;
	}

	#divInnerAreaBlacklist {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		width: 100%;
		gap: 10px;
		margin-top: 10px;
	}

	.hidden {
		display: none !important;
	}

	#divInnerAreaBlacklist textarea {
		flex-grow: 1;
		width: 100%;
		resize: none;
		box-sizing: border-box;
		background-color: #222;
		color: white;
		border: 1px solid #555;
	}

	#divInnerAreaBlacklist input[type="number"], #divInnerAreaBlacklist input[type="button"] {
		width: 100%;
		box-sizing: border-box;
		padding: 5px;
	}
`);

//Load the user options
let arrUserBlacklist = GM_getValue("blacklist", []);
let arrKeywordBlacklist = GM_getValue("keywords", []);
let intUserFeedback = GM_getValue("feedback", 80);
let intUserRatings = GM_getValue("ratings", 30);

//Create the settings box and load the style from above
let nodeNewBox = document.createElement("div");
nodeNewBox.innerHTML = `
<div id="divOuterAreaBlacklist">
	<span id="btnToggleBlacklistArea" title="${strScriptName}"><b>Stats:</b><br>Inactive</span>
	<div id="divInnerAreaBlacklist" class="hidden">
		<b>Userscript Settings</b>
		<label>Hide sellers with a feedback percentage less than:</label>
		<input type="number" id="intFeedbackPercentage" min="0" max="100" value="${intUserFeedback}">
		<label>Hide sellers with a feedback total less than:</label>
		<input type="number" id="intFeedbackAmount" min="0" max="500" value="${intUserRatings}">
		<label>Comma-separated list of blacklisted keywords (Star '*' is supported as a basic wildcard):</label>
		<textarea id="txtKeywordBlacklist">${arrKeywordBlacklist}</textarea>
		<label>Comma-separated list of blacklisted sellers (Star '*' is supported as a basic wildcard):</label>
		<textarea id="txtUserBlacklist">${arrUserBlacklist}</textarea>
		<input type="button" value="Save & Reload" id="btnSaveBlacklist">
	</div>
</div>
`;
//Add the box to the start of the page
document.body.append(nodeNewBox);

//Handle when the user saves the options
document.getElementById("btnSaveBlacklist").onclick = function() {
	GM_setValue("blacklist", document.getElementById("txtUserBlacklist").value.replace(/\s+/g, '').split(","));
	GM_setValue("keywords", document.getElementById("txtKeywordBlacklist").value.split(","));
	GM_setValue("feedback", parseInt(document.getElementById("intFeedbackPercentage").value));
	GM_setValue("ratings", parseInt(document.getElementById("intFeedbackAmount").value));
	location.reload();
};

//Handle when the user wants to open or close the settings
document.getElementById("btnToggleBlacklistArea").onclick = function() {
	document.getElementById('divInnerAreaBlacklist').classList.toggle('hidden');
	document.getElementById('divOuterAreaBlacklist').classList.toggle('fullscreen');
};

function matchesRule(str, rule) {
    //If input string or rule are blank then ignore
    if (str.trim().length === 0 || rule.trim().length === 0) { return false; }

    var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}

function currentLayout(nodeListElements, strTitleSelector, strTitleClass, strInfoSelector) {
	let intCountSellers = 0;
	let intCountKeywords = 0;
	let intCountPercentages = 0;
	let intCountRatings = 0;

    //Loop through each found element
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

	document.getElementById("btnToggleBlacklistArea").innerHTML="<b>Hide Stats:</b><br>" + intCountSellers + " Seller Name<br>" + intCountKeywords + " Title Keyword<br>" + intCountPercentages + " Low Feedback<br>" + intCountRatings + " Low Ratings";
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
