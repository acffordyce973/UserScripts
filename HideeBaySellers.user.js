// ==UserScript==
// @name         Hide eBay Sellers
// @namespace    https://www.ebay.co.uk/
// @version      0.7
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
let userFeedback = GM_getValue("feedback", 80);
let userRatings = GM_getValue("ratings", 30);

//Create the settings box and load the style from above
let newBox = document.createElement("div");
newBox.innerHTML = `
<div id="eBSBOuterDiv">
    <span id="eBSBToggleButton" title="Hide eBay Sellers"><b>Stats:</b><br>Inactive</span>
        <div id="eBSBInnerDiv" class="hidden">
            <br><b>Hide eBay Sellers - Settings</b><br>
            Hide sellers with a feedback percentage less than:<br>
            <input type="number" id="eBSBFeedbackPercentage" min="0" max="100" value="${userFeedback}"><br>
            Hide sellers with a feedback total less than:<br>
            <input type="number" id="eBSBFeedbackAmount" min="0" max="500" value="${userRatings}"><br>
            Comma-separated list of blacklisted sellers:<br>
            <textarea id="eBSBBlacklistArea" rows="45" cols="264">${userBlacklist}</textarea><br>
            <input type="button" value="Save & Reload" id="eBSBSaveButton">
        <div>
    </div>
`;
//Add the box to the start of the page
document.body.append(newBox);
//Handle when the user saves the options
document.getElementById("eBSBSaveButton").onclick = function() {
    GM_setValue("blacklist", document.getElementById("eBSBBlacklistArea").value.replace(/\s+/g, '').split(","));
    GM_setValue("feedback", parseInt(document.getElementById("eBSBFeedbackPercentage").value));
    GM_setValue("ratings", parseInt(document.getElementById("eBSBFeedbackAmount").value));
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

function highlightSeller(sellerElement) {
    sellerElement.style.color = "red";
    sellerElement.style.fontWeight = "bold";
    sellerElement.innerHTML = sellerElement.innerHTML + " (Blacklisted!)";
}

function layoutOne(sellerElements)
{
    //First half of 2025
    var blCount = 0;
    var fbCount = 0;
    var frCount = 0;
    for(let i = 0; i < sellerElements.length; i++) {

        let seller = "";
        try{
            //Regex to find the seller name
            seller = sellerElements[i].innerHTML.match(/^([^ ]+) .*/)[1];
        } catch (error) {
            console.error("Could not find seller name - element " + i + ": " + error);
        }

        let percent = "100";
        try{
            //Regex to find the seller feedback percentage
            percent = sellerElements[i].innerHTML.match(/(\d+(\.\d+)?%)/)[0];
        } catch (error) {
            console.error("Could not find seller percent - element " + i + ": " + error);
        }

        let ratings = "100";
        try{
            //Regex to find the seller feedback amount
            ratings = sellerElements[i].innerHTML.match(/\(([^)]+)\)/)[1];
        } catch (error) {
            console.error("Could not find seller amount - element " + i + ": " + error);
        }

        //If we have the seller's name then do
        if(seller) {
            //If seller is in the blacklist then do
            for (const blacklistedUser of userBlacklist) {
                if (matchesRule(seller,blacklistedUser)) {
                    //Add our hidden style
                    sellerElements[i].closest("li.s-item").classList.add("hidden");
                    blCount++;
                }
            }
        }
        //If we have the feedback percent then do
        if (percent) {
            let feedback = parseFloat(percent);
            //If feedback is low then do
            if (feedback < userFeedback) {
                //Add our hidden style
                sellerElements[i].closest("li.s-item").classList.add("hidden");
                fbCount++;
            }
        }

        //If we have the feedback amount then do
        if (ratings) {
            //If amount is low then do
            if (ratings < userRatings) {
                //Add our hidden style
                sellerElements[i].closest("li.s-item").classList.add("hidden");
                frCount++;
            }
        }
    }

    document.getElementById("eBSBToggleButton").innerHTML="<b>Stats (Layout One):</b><br>" + blCount + " Blacklisted<br>" + fbCount + " Low Feedback<br>" + frCount + " Low Ratings";
}

function layoutTwo(sellerElements)
{
    //Second half of 2025
    var blCount = 0;
    var fbCount = 0;
    var frCount = 0;
    for(let i = 0; i < sellerElements.length; i++) {
        let primarySpans = sellerElements[i].getElementsByClassName("PRIMARY");

        let seller = "";
        try{
            //Regex to find the seller name
            seller = primarySpans[0].innerText.trim();
        } catch (error) {
            console.error("Could not find seller name - element " + i + ": " + error);
        }

        let percent = "100";
        try{
            //Regex to find the seller feedback percentage
            percent = sellerElements[i].innerHTML.match(/(\d+(\.\d+)?%)/)[0];
        } catch (error) {
            console.error("Could not find seller percent - element " + i + ": " + error);
        }

        let ratings = "100";
        try{
            //Regex to find the seller feedback amount
            ratings = sellerElements[i].innerHTML.match(/\(([^)]+)\)/)[1];
        } catch (error) {
            console.error("Could not find seller amount - element " + i + ": " + error);
        }

        //primarySpans[0].innerText = seller + "!";
        //If we have the seller's name then do
        if(seller) {
            //If seller is in the blacklist then do
            for (const blacklistedUser of userBlacklist) {
                if (matchesRule(seller,blacklistedUser)) {
                    //Add our hidden style
                    sellerElements[i].closest("li.s-item").classList.add("hidden");
                    blCount++;
                }
            }
        }
        //If we have the feedback percent then do
        if (percent) {
            let feedback = parseFloat(percent);
            //If feedback is low then do
            if (feedback < userFeedback) {
                //Add our hidden style
                sellerElements[i].closest("li.s-item").classList.add("hidden");
                fbCount++;
            }
        }

        //If we have the feedback amount then do
        if (ratings) {
            //If amount is low then do
            if (ratings < userRatings) {
                //Add our hidden style
                sellerElements[i].closest("li.s-item").classList.add("hidden");
                frCount++;
            }
        }
    }

    document.getElementById("eBSBToggleButton").innerHTML="<b> Stats (Layout Two):</b><br>" + blCount + " Blacklisted<br>" + fbCount + " Low Feedback<br>" + frCount + " Low Ratings";
}

function layoutThree(sellerElements)
{
    //Second half of 2025 - some card layout
    var blCount = 0;
    var fbCount = 0;
    var frCount = 0;

    document.getElementById("eBSBToggleButton").innerHTML="<b> Stats (Layout Three):</b><br>"

    for(let i = 0; i < sellerElements.length; i++) {
        //document.getElementById("eBSBToggleButton").innerHTML+="Info: "//Debug

        if (!sellerElements[i].innerHTML.includes("su-styled-text primary large")) {
            //document.getElementById("eBSBToggleButton").innerHTML+="0<br>";//Debug
            continue;
        }
        let infoSpans = sellerElements[i].getElementsByClassName("su-styled-text");

        //document.getElementById("eBSBToggleButton").innerHTML+=infoSpans.length + "<br>";//Debug

        let seller = "";
        try {
        //Regex to find the seller name
            seller = infoSpans[0].innerText.trim();
        } catch (error) {
            console.error("Could not find seller name - element " + i + ": " + error);
        }

        let percent = "100";
        try{
        //Regex to find the seller feedback percentage
            percent = sellerElements[i].innerHTML.match(/(\d+(\.\d+)?%)/)[0];
        } catch (error) {
            console.error("Could not find seller percentage - element " + i + ": " + error);
        }

        let ratings = "100";
        try{
        //Regex to find the seller feedback amount
            ratings = sellerElements[i].innerHTML.match(/\(([^)]+)\)/)[1];
        } catch (error) {
            console.error("Could not find seller amount - element " + i + ": " + error);
        }

        //infoSpans[0].innerText = seller + "! ";//Debug

        //If we have the seller's name then do
        if(seller) {
            //If seller is in the blacklist then do
            for (const blacklistedUser of userBlacklist) {
                if (matchesRule(seller,blacklistedUser)) {
                    //Add our hidden style
                    sellerElements[i].closest("li.s-card").classList.add("hidden");
                    blCount++;
                }
            }
        }
        //If we have the feedback percent then do
        if (percent) {
            let feedback = parseFloat(percent);
            //If feedback is low then do
            if (feedback < userFeedback) {
                //Add our hidden style
                sellerElements[i].closest("li.s-card").classList.add("hidden");
                fbCount++;
            }
        }

        //If we have the feedback amount then do
        if (ratings) {
            //If amount is low then do
            if (ratings < userRatings) {
                //Add our hidden style
                sellerElements[i].closest("li.s-card").classList.add("hidden");
                frCount++;
            }
        }
    }

    document.getElementById("eBSBToggleButton").innerHTML="<b> Stats (Layout Three):</b><br>" + blCount + " Blacklisted<br>" + fbCount + " Low Feedback<br>" + frCount + " Low Ratings";
}

//Do on the search page
if(window.location.href.includes("/sch/")) {
    //Use the class that holds the seller name to find each eBay listing in the results
    let oneElements = document.querySelectorAll("span.s-item__seller-info-text");
    let twoElements = document.querySelectorAll("span.s-item__etrs-text");
    let threeElements = document.querySelectorAll("div.s-card__attribute-row");

    document.getElementById("eBSBToggleButton").innerHTML="Layout One: " + oneElements.length + "<br>Layout Two: " + twoElements.length + "<br>Layout Three: " + threeElements.length;

    //If there are listings then do
    if(oneElements.length > 0)
    {
        layoutOne(oneElements);
    }
    else if (twoElements.length > 0)
    {
        layoutTwo(twoElements);
    }
    else if (threeElements.length > 0)
    {
        layoutThree(threeElements);
    }
}
