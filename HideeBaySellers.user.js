// ==UserScript==
// @name         Hide eBay Sellers
// @namespace    https://www.ebay.co.uk/
// @version      0.8.1
// @description  Adds a blacklist for sellers on eBay that will remove their results. Name blacklist should be comma-separated (no spaces) and supports * as a wildcard for one or more characters.
// @author       xdpirate, ACF
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

//Styles the box for the user to enter their blacklisted sellers
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

//Load the user options
let userBlacklist = GM_getValue("blacklist", []);
let keywordBlacklist = GM_getValue("keywords", []);
let userFeedback = GM_getValue("feedback", 80);
let userRatings = GM_getValue("ratings", 30);

//Create the settings box and load the style from above
//Using a 1080p viewport as default cause no idea how to make it grow or shrink
let newBox = document.createElement("div");
newBox.innerHTML = `
<div id="eBSBOuterDiv">
    <span id="eBSBToggleButton" title="Hide eBay Sellers"><b>Stats:</b><br>Inactive</span>
        <div id="eBSBInnerDiv" class="hidden">
            <br><b>Userscript Settings</b><br>
            Hide sellers with a feedback percentage less than:<br>
            <input type="number" id="intFeedbackPercentage" min="0" max="100" value="${userFeedback}"><br>
            Hide sellers with a feedback total less than:<br>
            <input type="number" id="intFeedbackAmount" min="0" max="500" value="${userRatings}"><br>
            Comma-separated list of blacklisted keywords:<br>
            <textarea id="txtKeywordBlacklist" rows="15" cols="176">${keywordBlacklist}</textarea><br>
            Comma-separated list of blacklisted sellers:<br>
            <textarea id="txtUserBlacklist" rows="15" cols="176">${userBlacklist}</textarea><br>
            <i>Star (*) is supported as a basic wildcard.</i><br>
            <input type="button" value="Save & Reload" id="eBSBSaveButton">
        <div>
    </div>
`;
//Add the box to the start of the page
document.body.append(newBox);
//Handle when the user saves the options
document.getElementById("eBSBSaveButton").onclick = function() {
    GM_setValue("blacklist", document.getElementById("txtUserBlacklist").value.replace(/\s+/g, '').split(","));
    GM_setValue("keywords", document.getElementById("txtKeywordBlacklist").value.split(","));
    GM_setValue("feedback", parseInt(document.getElementById("intFeedbackAmount").value));
    GM_setValue("ratings", parseInt(document.getElementById("intFeedbackPercentage").value));
    location.reload();
};
//Handle when the user wants to open or close the settings
document.getElementById("eBSBToggleButton").onclick = function() {
    document.getElementById('eBSBInnerDiv').classList.toggle('hidden');
};

function matchesRule(str, rule) {
    var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}

function currentLayout(listingElements)
{
    var countSellers = 0;
    var countKeywords = 0
    var countPercentages = 0;
    var countRatings = 0;

    for(let countListing = 0; countListing < listingElements.length; countListing++) {
        //Check the listing title against our keyword blacklist
        let listingTitleElements = listingElements[countListing].querySelector("div.s-card__title").getElementsByClassName("su-styled-text");
        if (listingTitleElements.length > 0) {
            let listingTitle = listingTitleElements[0].innerText.trim();
            if (listingTitle) {
                console.info("Checking if listing title '" + listingTitle + "' for listing " + countListing + " contains a blacklisted keyword...");
                for (const blacklistedKeyword of keywordBlacklist) {
                    if (matchesRule(listingTitle.toLowerCase(), blacklistedKeyword.toLowerCase())) {
                        //Add our hidden style
                        listingElements[countListing].classList.add("hidden");
                        countKeywords++;
                        console.info("Hiding listing due to title match of " + blacklistedKeyword + "...")
                        //Bail from this for loop
                        break;
                    }
                }
            }
        }

        //Get the price, listing type/bids, delivery, country (sometimes), datetime, and seller information
        let listingInfoElements = listingElements[countListing].querySelectorAll("div.s-card__attribute-row");
        console.info("Found " + listingInfoElements.length + " info elements for listing " + countListing + ":");
        console.info(listingInfoElements);
        //Check the seller information against our seller blacklist and ratings
        for(let countInfoElement = 0; countInfoElement < listingInfoElements.length; countInfoElement++) {
            //Bail if we can't find our style
            if (!listingInfoElements[countInfoElement].innerHTML.includes("su-styled-text primary large")) {
                //console.info("Couldn't find our style in seller element " + countInfoElement + "...");
                continue;
            }
            let infoSpans = listingInfoElements[countInfoElement].getElementsByClassName("su-styled-text");

            let seller = "";
            try {
                //Regex to find the seller name if in this element
                seller = infoSpans[0].innerText.trim();
            } catch (error) {
                console.error("Could not find seller name - element " + countInfoElement + ": " + error);
            }

            let percent = "100";
            try{
                //Regex to find the seller feedback percentage if in this element
                percent = listingInfoElements[countInfoElement].innerHTML.match(/(\d+(\.\d+)?%)/)[0];
            } catch (error) {
                console.error("Could not find seller percentage - element " + countInfoElement + ": " + error);
            }

            let ratings = "100";
            try{
                //Regex to find the seller feedback amount if in this element
                ratings = listingInfoElements[countInfoElement].innerHTML.match(/\(([^)]+)\)/)[1];
            } catch (error) {
                console.error("Could not find seller amount - element " + countInfoElement + ": " + error);
            }

            //infoSpans[0].innerText = seller + "! ";//Debug to add an exclamation next to seller name

            //If we have the seller's name then do
            if(seller) {
                //If seller is in the blacklist then do
                for (const blacklistedUser of userBlacklist) {
                    if (matchesRule(seller, blacklistedUser)) {
                        //Add our hidden style
                        listingElements[countListing].classList.add("hidden");
                        countSellers++;
                        console.info("Hiding listing due to seller name match of " + seller + "...")
                        //Bail from this loop and the seller element loop
                        countInfoElement = listingInfoElements.length;
                        break;
                    }
                }
            }
            //If we have the feedback percent then do
            if (percent) {
                let feedback = parseFloat(percent);
                //If feedback is low then do
                if (feedback < userFeedback) {
                    //Add our hidden style
                    listingElements[countListing].classList.add("hidden");
                    countPercentages++;
                    console.info("Hiding listing due to low percentage match of " + feedback + "...")
                    //Bail from the seller element loop
                    countInfoElement = listingInfoElements.length;
                }
            }

            //If we have the feedback amount then do
            if (ratings) {
                //If amount is low then do
                if (ratings < userRatings) {
                    //Add our hidden style
                    listingElements[countListing].classList.add("hidden");
                    countRatings++;
                    console.info("Hiding listing due to low rating match of " + ratings + "...")
                    //Bail from the seller element loop
                    countInfoElement = listingInfoElements.length;
                }
            }
        }
    }

    document.getElementById("eBSBToggleButton").innerHTML="<b>Hide Stats:</b><br>" + countSellers + " Seller Name<br>" + countKeywords + " Title Keyword<br>" + countPercentages + " Low Feedback<br>" + countRatings + " Low Ratings";
}

//Do on the search page
if(window.location.href.includes("/sch/")) {
    //Use the class that holds each listing
    //let oneElements = document.querySelectorAll("span.s-item__seller-info-text");
    //let twoElements = document.querySelectorAll("span.s-item__etrs-text");
    //let threeElements = document.querySelectorAll("div.s-card__attribute-row");
    let listingElements = document.querySelectorAll("li.s-card");
    console.info("Found " + listingElements.length + " item listings...");

    //If there are listings then do
    if(listingElements.length > 0)
    {
        currentLayout(listingElements);
    }
}
