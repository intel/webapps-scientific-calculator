/*
 * Copyright (c) 2012, Intel Corporation.
 *
 * This program is licensed under the terms and conditions of the 
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

var Calculator = {};

$(function() {
    "use strict";

    Calculator = new function() {


        this.localizer = null;
        this.parser = "";
        this.currentKey = "";
        this.cssAppendix = "_portrait.css";

        /**
         * changes the orientation css file based on the current window size
         */
        this.setOrientation = function() {
            var lazy = $("#lazystylesheet");

            Calculator.cssAppendix = ((window.orientation == 90)||(window.orientation == -90))?".css":"_portrait.css";

            $("#stylesheet").attr("href","css/calc"+Calculator.cssAppendix);
            if (lazy.length>0) {
              lazy.attr("href","css/lazy"+Calculator.cssAppendix);
            }

            setTimeout(function() {
                $("body").css("-webkit-transform",
                    "translate(-50%, -50%)"+
                    "scale("+
                    document.documentElement.clientWidth/$("body").width()+
                    ","+
                    document.documentElement.clientHeight/$("body").height()+
                    ")"
                );
            }, 0);

        };

        /**
         * formula that has been computed already and its shown in the current formula area
         */
        this.currentFormula = "";

        //The below two stacks are maintained to do consistent backspace operation
        /**
         * Stack of elements that has been pressed after "=" press && which are shown
         * in mainEntry area.
         *
         * This stack is used to undo user's button presses until the previous
         * valid calculation ("=" press)
         */
        this.mainEntryStack = [];

        /**
         * Stack of elements that has been pressed after "=" press && which are shown
         * in current formula area (except already computed formula).
         *
         * This stack is used to undo user's button presses until the previous
         * valid calculation ("=" press)
         */
        this.currentFormulaStack = [];
        this.currentPage = "calculationpane";

        /**
         * number of decimal digits to be preserved on trigonometric calculations
         */
        this.trigPrecision = 10000000000;
        //
        // Functions
        //

        // Functions for transitioning between states.
        //
        this.transitionToDegrees = function() {
            $("#degradswitch").attr("class","switchleftactive");
            $("#buttondeg").attr("class","buttontogglebackgroundB");
            $("#buttonrad").attr("class","buttontogglebackgroundA");
            Calculator.angleDivisor = 180/Math.PI;
        };

        this.transitionToRadians = function() {
            $("#degradswitch").attr("class","switchrightactive");
            $("#buttondeg").attr("class","buttontogglebackgroundA");
            $("#buttonrad").attr("class","buttontogglebackgroundB");
            Calculator.angleDivisor = 1;
        };

        this.transitionToTrigonometricFunctions = function() {
            $("#traghypswitch").attr("class","switchleftactive");
            $("#buttontrig").attr("class","buttontogglebackgroundB");
            $("#buttonhyp").attr("class","buttontogglebackgroundA");
            $("#trigonometric").css("display", "inherit");
            $("#hyperbolic").css("display", "none");
        };

        this.transitionToHyperbolicFunctions = function() {
            $("#traghypswitch").attr("class","switchrightactive");
            $("#buttontrig").attr("class","buttontogglebackgroundA");
            $("#buttonhyp").attr("class","buttontogglebackgroundB");
            $("#trigonometric").css("display", "none");
            $("#hyperbolic").css("display", "inherit");
        };

        // Helper function for clearing main entry and current formula as needed.
        //
        this.handleClearOnNumberButtonClick = function() {
            if (Calculator.clearMainEntryOnNextNumberButton) {
                Calculator.setMainEntry("");
                Calculator.mainEntryStack.splice(0, Calculator.mainEntryStack.len);
            }
            if (Calculator.clearCurrentFormulaOnNextNumberButton) {
                Calculator.setCurrentFormula("");
                Calculator.currentFormulaStack.splice(0, Calculator.currentFormulaStack.len);
            }
        };

        this.handleClearOnFunctionButtonClick = function() {
            if (Calculator.clearMainEntryOnNextFunctionButton) {
                Calculator.setMainEntry("");
                Calculator.mainEntryStack.splice(0, Calculator.mainEntryStack.len);
            }
            if (Calculator.clearCurrentFormulaOnNextFunctionButton) {
                Calculator.setCurrentFormula("");
                Calculator.mainEntryStack.splice(0, Calculator.currentFormulaStack.len);
            }
        };

        // Functions for handling button presses.
        //
        this.onFunctionButtonClick = function() {
            var $this = $(this);
            Calculator.buttonClickAudio.play();
            Calculator.handleClearOnFunctionButtonClick();

            var operator = $this.attr("data-operator");

            if (operator===null) {
                operator = $this.html();
            }

            //move mainEntryStack content to currentFormulaStack
            for(var i = 0; i < Calculator.mainEntryStack.length; i++){
                Calculator.currentFormulaStack.push(Calculator.mainEntryStack[i]);
            }
            //clear mainEntryStack
            Calculator.mainEntryStack.splice(0, Calculator.mainEntryStack.length);

            // append main entry and the operator to current formula
            $("#currentformula").html( Calculator.getMainEntry() + operator );
            Calculator.setMainEntry("");

            //push the recent operator to currentFormulaStack
            Calculator.currentFormulaStack.push(operator);

            Calculator.clearMainEntryOnNextNumberButton = false;
            Calculator.clearMainEntryOnNextFunctionButton = false;
            Calculator.clearCurrentFormulaOnNextNumberButton = false;
        };

        this.onNumericalButtonClick = function() {
            Calculator.buttonClickAudio.play();
            Calculator.handleClearOnNumberButtonClick();

            var value = $(this).html();
            var mainEntry = Calculator.getMainEntry();

            if (mainEntry.length >= 22) {
                return;
            }

            if (value === "0") {
                if (mainEntry === "0") {
                    return;
                }
            } else if (value === "00") {
                if (mainEntry === "0" || mainEntry === "") {
                    return;
                }
            } else if (value === ".") {
                if (mainEntry === "") {
                    Calculator.appendToMainEntry("0");
                    Calculator.mainEntryStack.push("0");
                }
                else if (mainEntry.indexOf(value) != -1) {
                    return;
                }
            } else if (value === "+/\u2212") {
                // "Plus/minus" sign.

                if (mainEntry === "" || mainEntry === "0") {
                    return;
                }
                Calculator.setMainEntry("");

                if (mainEntry.charAt( 0 ) === "-") {
                    Calculator.appendToMainEntry(mainEntry.substring(1));
                } else {
                    Calculator.appendToMainEntry("-" + mainEntry);
                }
                value = "";
            }
            // push into mainEntryStack
            Calculator.mainEntryStack.push(value);

            Calculator.appendToMainEntry(value);
            Calculator.setClearButtonMode("C");
            Calculator.clearMainEntryOnNextNumberButton = false;
            Calculator.clearMainEntryOnNextFunctionButton = false;
            Calculator.clearCurrentFormulaOnNextNumberButton = false;
        };

        this.onClearButtonClick = function() {
            Calculator.buttonClickAudio.play();
            var clearButtonText = $("#buttonclear").html();

            if (clearButtonText === "C") {
                Calculator.setMainEntry("");
            } else if (clearButtonText === "AC") {
                Calculator.setCurrentFormula("");
                Calculator.currentFormula = "";
            }
            //clear stacks
            var len = Calculator.mainEntryStack.length;
            Calculator.mainEntryStack.splice(0,len);
            len = Calculator.currentFormulaStack.length;
            Calculator.currentFormulaStack.splice(0,len);

            //update the currentformula area
            $("#currentformula").html(Calculator.currentFormula);
        };

        this.onDeleteButtonClick = function() {
            Calculator.buttonClickAudio.play();
            var mainEntry = Calculator.getMainEntry();

            if ( (Calculator.currentFormulaStack.length <= 0 && Calculator.mainEntryStack.length <= 0) ){
                return;
            }
            if(mainEntry === Calculator.localizer.getTranslation("malformedexpression_text")){
                Calculator.setMainEntry("");
                return;
            }

            var len = 0;
            //first delete mainEntry then currentFormula
            if(Calculator.mainEntryStack.length > 0){
                // splice one element
                len = Calculator.mainEntryStack.length;
                Calculator.mainEntryStack.splice(len-1,1);

                // update the remaining elements
                mainEntry = "";
                for(var i = 0; i < Calculator.mainEntryStack.length; i++){
                    mainEntry += Calculator.mainEntryStack[i];
                }
                Calculator.setMainEntry(mainEntry);
            }else{
                // splice one element
                len = Calculator.currentFormulaStack.length;
                Calculator.currentFormulaStack.splice(len-1,1);

                // update the remaining elements
                var text = "";
                for(var j = 0; j < Calculator.currentFormulaStack.length; j++){
                    text += Calculator.currentFormulaStack[j];
                }
                $("#currentformula").html(Calculator.currentFormula + text);
            }
        };

        this.onEqualButtonClick = function() {
            Calculator.equalClickAudio.play();
            Calculator.handleClearOnFunctionButtonClick();

            var mainEntry = Calculator.getMainEntry();
            var prevFormula = Calculator.currentFormula;
            Calculator.currentFormulaStack.push(mainEntry);
            Calculator.appendToCurrentFormula(mainEntry);

            var formula = Calculator.getCurrentFormula();

            // replace ^ with x for unambiguous parsing.
            formula = formula.replace("e<sup>^</sup>", "e<sup>x</sup>");

            var entry = "";
            if (formula != "") {
                try {
                    entry = Calculator.parser.parse(formula);
                    if(isNaN(entry)){
                        entry = Calculator.localizer.getTranslation("malformedexpression_text");
                    }
                    else if(mainEntry != ""){
                        Calculator.appendEntryToCalculationHistory(Calculator.formHistoryEntry(formula, entry));
                        Calculator.createHistoryEntryInLocalStorage(formula, entry);
                    }
                } catch (err) {
                    entry = Calculator.localizer.getTranslation("malformedexpression_text");
                }

                Calculator.setMainEntry(entry);
            }

            Calculator.clearMainEntryOnNextNumberButton = true;
            Calculator.clearMainEntryOnNextFunctionButton = true;
            Calculator.clearCurrentFormulaOnNextNumberButton = true;

            var len = 0;
            //clear undo stacks
            if(entry != Calculator.localizer.getTranslation("malformedexpression_text")){
                // clear current formula stack only on valid computation
                len = Calculator.currentFormulaStack.length;
                Calculator.currentFormulaStack.splice(0,len);

                // To maintain operator precedence, enclose the formula that has been already computed
                Calculator.setCurrentFormula(entry);
            }
            else{ // restore previous formula on error cases
                Calculator.currentFormula = prevFormula;
                Calculator.clearCurrentFormulaOnNextNumberButton = false;
            }
            len = Calculator.mainEntryStack.length;
            Calculator.mainEntryStack.splice(0,len);
        };

        this.setClearButtonMode = function(mode) {
            $("#buttonclear").html(mode);
        };

        // Function for adding a result history entry.
        //
        this.formHistoryEntry = function(formula, entry) {
            var historyEntry = " \
                <div class='thickdivisor'></div> \
                <div class='calculationpane'> \
                    <div class='calculation'> \
                        <div class='calculationtext'>" + formula + "</div> \
                    </div> \
                </div> \
                <div class='thindivisor'></div> \
                <div class='resultpane'> \
                    <div class='result'> \
                        <div class='resulttext'>" + entry + "</div> \
                    </div> \
                </div> \
            ";

            return historyEntry;
        };

        this.setCalculationHistoryEntries = function(historyEntries) {
            $("#calculationhistory").html(historyEntries);
        };

        this.appendEntryToCalculationHistory = function(historyEntry) {
            var calculationHistory = $("#calculationhistory");
            calculationHistory.html(calculationHistory.html() + historyEntry);
        };

        // Functions for manipulating history persistent storage data.
        //
        this.createHistoryEntryInLocalStorage = function(formula, result) {
            var historyEntry = {
                formula: formula,
                result: result,
                timestamp: new Date().getTime()
            };

            localStorage.setItem("history" + Calculator.nexthistoryindex, JSON.stringify(historyEntry));
            Calculator.nexthistoryindex++;
        };

        this.populateHistoryPaneFromLocalStorage = function() {
            var firsthistoryindex = localStorage.getItem("firsthistoryindex");

            if (firsthistoryindex === null) {
                // Initialize history local storage if not used yet.
                Calculator.nexthistoryindex = 0;
                localStorage.setItem("firsthistoryindex", 0);
            } else {
                // If history local storage is used, then populate the history list with stored items that are less than a week old.
                var time = new Date().getTime();
                var historyEntries = "";

                for (var i = firsthistoryindex; true; ++i) {
                    var historyitemstr = localStorage.getItem("history" + i);

                    if (historyitemstr === null) {
                        Calculator.nexthistoryindex = i;
                        break;
                    } else {
                        try {
                            var historyitem = JSON.parse(historyitemstr);

                            if (time - historyitem.timestamp > 604800000 /* One week in milliseconds */) {
                                localStorage.removeItem("history" + i);
                                firsthistoryindex = i + 1;
                            } else {
                                historyEntries += Calculator.formHistoryEntry(historyitem.formula, historyitem.result);
                            }
                        } catch (err) {
                            localStorage.removeItem("history" + i);
                        }
                    }
                }
                Calculator.setCalculationHistoryEntries(historyEntries);
                localStorage.setItem("firsthistoryindex", firsthistoryindex);
            }
        };

        // Functions for manipulating entries.
        //
        this.getMainEntry = function() {
            return $("#mainentry").html();
        };

        this.setMainEntry = function(string) {
            var mainentryelement = $("#mainentry");

            mainentryelement.html(string);
            $("#mpmainentry").html(string);

            if (string === "") {
                $("#buttonclear").html("AC");
            } else {
                $("#buttonclear").html("C");
            }

            mainentryelement.attr("class","mainentryshort");
            if (mainentryelement[0].offsetWidth < mainentryelement[0].scrollWidth) {
                mainentryelement.attr("class","mainentrylong");
            }
        };

        this.appendToMainEntry = function(string) {
            Calculator.setMainEntry($("#mainentry").html() + string);
        };

        this.getCurrentFormula = function() {
            return $("#currentformula").html();
        };

        this.setCurrentFormula = function(string) {
            var currentformulaelement = $("#currentformula");

            currentformulaelement.html(string);
            currentformulaelement.attr("class","currentformulashort");
            if (currentformulaelement[0].offsetWidth < currentformulaelement[0].scrollWidth) {
                currentformulaelement.attr("class","currentformulalong");
            }
            Calculator.currentFormula = string;
        };

        this.appendToCurrentFormula = function(string) {
            var newstring = $("#currentformula").html() + string;
            Calculator.currentFormula = newstring;
            Calculator.setCurrentFormula(newstring);
        };

        // Functions for handling arrow button click events.
        //
        this.onButtonMainEntryToMemoryClick = function() {
            var value = Calculator.getMainEntry();

            Calculator.addValueToEmptyMemoryEntry(value);
            Calculator.setFreeMemorySlot();
        };

        this.onButtonHistoryResultToMemoryClick = function(value) {
            Calculator.addValueToEmptyMemoryEntry(value);
        };

        this.onButtonHistoryResultToMainEntryClick = function(value) {
            Calculator.handleClearOnNumberButtonClick();

            Calculator.setMainEntry(value);
            Calculator.clearMainEntryOnNextNumberButton = true;
            Calculator.clearMainEntryOnNextFunctionButton = false;
        };

        // Functions for manipulating memory entries.
        //
        this.addValueToEmptyMemoryEntry = function(value) {
            if (value != "") {
                // Try to find an empty memory entry.
                var i = Calculator.getNextEmptyMemorySlot();

                if (i <= 8) {
                    // Empty memory entry found, store entry.
                    var mplusi = "M" + i;
                    localStorage.setItem(mplusi, value + "##");
                    Calculator.setMemoryEntry(mplusi, value, "");
                    $("#button" + mplusi).css("color","#d9e2d0");
                }
            }
        };

        this.getNextEmptyMemorySlot = function(){
            for (var i = 1; i <= 8; ++i) {
                if (localStorage.getItem("M" + i) === null) {
                    break;
                }
            }
            return i;
        };

        this.setMemoryEntry = function(key, value, description) {
            var buttonkey = "#button"+key;
            var hashkey = "#"+key;
            $(buttonkey).children().eq(0).attr("src", "images/ico_arrow_white.png");
            $(buttonkey+"edit").attr("class", "buttonmemoryeditenabled");
            $(buttonkey+"close").attr("class", "buttonmemorycloseenabled");
            $(hashkey+"text").html(value);
            $(hashkey+"description").text(description);
            $(buttonkey).css("color","#d9e2d0");
        };

        this.setMemoryDescription = function(key, description) {
            var memoryitemstr = localStorage.getItem(key);

            if (!(memoryitemstr === null)) {
                var memoryitem = memoryitemstr.split("##");

                Calculator.setMemoryEntry(key, memoryitem[0], description);
                localStorage.setItem(key, memoryitem[0] + "##" + description);
            }
        };

        this.onButtonMemoryEditClick = function(key) {
            if($("#button"+key+"edit").attr("class") != "buttonmemoryeditenabled"){
               return;
            }

            Calculator.currentKey = key;
            $("#memorynoteeditor").show();
            var hashkey="#"+key;
            var memoryitemstr = $(hashkey+"text").text();
            var description = $(hashkey+"description").text();
            $("#mnebutton").text(key);
            $("#mnetext").text(memoryitemstr);

            var input = $("#mnedescriptioninput");
            var text = $("#mnedescription");

            if (input.css("display") === "none" || input.css("visibility") === "visible" ) {
                input.css("display","inline");
                text.css("display","none");
                input.trigger("focus");
            } else {
                input.css("display","none");
                text.css("display","inline");
            }
            input.val(description);
        };

        this.onMemoryDescriptionInputFocusOut = function(key) {
            var keydescription = "#"+key+description;
            var input = $(keydescription+"input");
            var value = input.val();
            var description = $(keydescription);

            description.text(value);
            Calculator.setMemoryDescription(key,value);
            input.css("display","none");
            description.css("display","inline");
        };

        this.onButtonMemoryClick = function(key) {
            Calculator.handleClearOnNumberButtonClick();

            var value = $("#"+key+"text").text();

            if (value != null) {
                Calculator.setMainEntry(value);
                Calculator.clearMainEntryOnNextNumberButton = true;
                Calculator.clearMainEntryOnNextFunctionButton = false;
            }
        };

        this.onButtonMemoryCloseClick = function(key) {
            var hashkey = "#"+key;
            var buttonkey = "#button"+key;
            var keydescription = hashkey+"description";
            $(buttonkey).children().eq(0).attr("src", "images/ico_arrow_black.png");
            $(buttonkey+"edit").attr("class", "buttonmemoryedit");
            $(buttonkey+"close").attr("class", "buttonmemoryclose");
            localStorage.removeItem(key);
            $(hashkey+"descriptioninput").val("");
            $(hashkey+"text").text("");
            $(buttonkey).css("color","#727272");
            $(hashkey+"description").text("");
        };

        this.populateMemoryPaneFromLocalStorage = function() {
            for (var i = 0; i < 9; ++i) {
                var memoryitemstr = localStorage.getItem("M" + i);

                if (!(memoryitemstr === null)) {
                    var memoryitem = memoryitemstr.split("##");

                    Calculator.setMemoryEntry("M"+i, memoryitem[0], memoryitem[1]);
                }
            }
        };

        this.onButtonMemoryListClick = function() {
            $("#memorypage").show();
            Calculator.currentPage = "memorypage";
            $("#mpmainentry").html(Calculator.getMainEntry());
        };

        this.onButtonMemoryClearAll = function() {
             $("#clearconfirmationdialog").css("visibility","visible");
        };

        this.clearAllMemorySlots = function(){
            $("#clearconfirmationdialog").css("visibility","hidden");
            for(var i = 1; i <= 8; i++){
                Calculator.onButtonMemoryCloseClick("M"+i);
            }
            Calculator.setFreeMemorySlot();
        };

        this.cancelClearAllDialog = function(){
            $("#clearconfirmationdialog").css("visibility","hidden");
        };

        this.onButtonMemoryClose = function() {
            Calculator.setFreeMemorySlot();
            $("#memorypage").hide();
            Calculator.currentPage = "calculationpane";
        };

        // Function for initializing the UI buttons.
        //
        this.initButtons = function() {
            $(".buttonblackshort, .buttonyellow, .buttonblack, .buttonblue").on("mousedown",Calculator.onFunctionButtonClick);

            $(".buttonwhite").on("mousedown",Calculator.onNumericalButtonClick);

            // Initialize memorize button
            Calculator.setFreeMemorySlot();

            // Initialize button special cases.
            for(
                var handlerMap = {
                    "#buttonclear": Calculator.onClearButtonClick,
                    "#buttondelete": Calculator.onDeleteButtonClick,
                    "#buttondot": Calculator.onNumericalButtonClick,
                    "#buttonplusminus": Calculator.onNumericalButtonClick,
                    "#buttonequal": Calculator.onEqualButtonClick
                },
                keys=Object.keys(handlerMap),
                i=0;
                i<keys.length; ++i ) {
                var thisKey = keys[i];
                $(thisKey).off("mousedown").on("mousedown",handlerMap[thisKey]);
            }

            Calculator.initAudio();
        };

        /**
         * initializes the audio files and assigns audio for various button presses
         */
        this.initAudio = function(){
            Calculator.buttonClickAudio = new Audio();
            Calculator.buttonClickAudio.src = "./audio/GeneralButtonPress_R2.ogg";
            Calculator.equalClickAudio = new Audio();
            Calculator.equalClickAudio.src = "./audio/EqualitySign_R2.ogg";
            $("#closehistorybutton, .historybutton, .buttonclose, .switchleftactive, .buttonpurple, .dialogAbuttonPurple, .dialogAbuttonBlack, .dialogBpurplebutton, .dialogBblackbutton, .buttonmemory, .buttonmemoryedit, .buttonmemoryclose")
                .on("mousedown",function(e){
                Calculator.buttonClickAudio.play();
            });
        };

        this.openHistory = function() {
            $("#LCD_Upper").show();
            $("#licensebtnl").hide();
        };
        this.closeHistory = function() {
            $("#LCD_Upper").hide();
            $("#licensebtnl").show();
            $("#"+Calculator.currentPage).show();
            Calculator.historyScrollbar.refresh();
            return false;
        };

        this.setFreeMemorySlot = function(){
            var i = Calculator.getNextEmptyMemorySlot();
            if (i <= 8){
                $("#buttonmemorizetext").html("M"+ i);
            }
            else {
                $("#buttonmemorizetext").html("Mx");
            }
        };

        this.registerInlineHandlers = function(){
            $("#closehistorybutton").on("click",Calculator.closeHistory);
            $("#openhistorybutton").on("click",Calculator.openHistory);
            $("#buttondeg").on("click",Calculator.transitionToDegrees);
            $("#buttonrad").on("click",Calculator.transitionToRadians);
            $("#buttontrig").on("click",Calculator.transitionToTrigonometricFunctions);
            $("#buttonhyp").on("click",Calculator.transitionToHyperbolicFunctions);
            $("#buttonmemorylist").on("click",Calculator.onButtonMemoryListClick);
            $("#buttonmemorize").on("click",Calculator.onButtonMainEntryToMemoryClick);
            $("#memoryclearall").on("click",Calculator.onButtonMemoryClearAll);
            $("#memoryClose").on("click",Calculator.onButtonMemoryClose);
            $("#dialogokbutton").on("click",Calculator.clearAllMemorySlots);
            $("#dialogcancelbutton").on("click",Calculator.cancelClearAllDialog);
            $("#mpopenhistorybutton").on("click",Calculator.openHistory);

            $("#buttonclosecurrentformula").on("click",function(){Calculator.setCurrentFormula('');});
            $("#buttonclosemainentry,#mplcdbuttonclose").on("click",function(){Calculator.setMainEntry('');});
            $("#buttonM1").on("click",function(){Calculator.onButtonMemoryClick('M1');});
            $("#buttonM1edit").on("click",function(){Calculator.onButtonMemoryEditClick('M1');});
            $("#buttonM1close").on("click",function(){Calculator.onButtonMemoryCloseClick('M1');});
            $("#buttonM2").on("click",function(){Calculator.onButtonMemoryClick('M2');});
            $("#buttonM2edit").on("click",function(){Calculator.onButtonMemoryEditClick('M2');});
            $("#buttonM2close").on("click",function(){Calculator.onButtonMemoryCloseClick('M2');});
            $("#buttonM3").on("click",function(){Calculator.onButtonMemoryClick('M3');});
            $("#buttonM3edit").on("click",function(){Calculator.onButtonMemoryEditClick('M3');});
            $("#buttonM3close").on("click",function(){Calculator.onButtonMemoryCloseClick('M3');});
            $("#buttonM4").on("click",function(){Calculator.onButtonMemoryClick('M4');});
            $("#buttonM4edit").on("click",function(){Calculator.onButtonMemoryEditClick('M4');});
            $("#buttonM4close").on("click",function(){Calculator.onButtonMemoryCloseClick('M4');});
            $("#buttonM5").on("click",function(){Calculator.onButtonMemoryClick('M5');});
            $("#buttonM5edit").on("click",function(){Calculator.onButtonMemoryEditClick('M5');});
            $("#buttonM5close").on("click",function(){Calculator.onButtonMemoryCloseClick('M5');});
            $("#buttonM6").on("click",function(){Calculator.onButtonMemoryClick('M6');});
            $("#buttonM6edit").on("click",function(){Calculator.onButtonMemoryEditClick('M6');});
            $("#buttonM6close").on("click",function(){Calculator.onButtonMemoryCloseClick('M6');});
            $("#buttonM7").on("click",function(){Calculator.onButtonMemoryClick('M7');});
            $("#buttonM7edit").on("click",function(){Calculator.onButtonMemoryEditClick('M7');});
            $("#buttonM7close").on("click",function(){Calculator.onButtonMemoryCloseClick('M7');});
            $("#buttonM8").on("click",function(){Calculator.onButtonMemoryClick('M8');});
            $("#buttonM8edit").on("click",function(){Calculator.onButtonMemoryEditClick('M8');});
            $("#buttonM8close").on("click",function(){Calculator.onButtonMemoryCloseClick('M8');});

            $("#M1descriptioninput").on("focusout",function(){Calculator.onMemoryDescriptionInputFocusOut('M1');});
            $("#M2descriptioninput").on("focusout",function(){Calculator.onMemoryDescriptionInputFocusOut('M2');});
            $("#M3descriptioninput").on("focusout",function(){Calculator.onMemoryDescriptionInputFocusOut('M3');});
            $("#M4descriptioninput").on("focusout",function(){Calculator.onMemoryDescriptionInputFocusOut('M4');});
            $("#M5descriptioninput").on("focusout",function(){Calculator.onMemoryDescriptionInputFocusOut('M5');});
            $("#M6descriptioninput").on("focusout",function(){Calculator.saveMemoryDescription('M6');});
            $("#M7descriptioninput").on("focusout",function(){Calculator.onMemoryDescriptionInputFocusOut('M7');});
            $("#M8descriptioninput").on("focusout",function(){Calculator.saveMemoryDescription('M8');});

        };

        this.registerMneClickHandlers = function(){
            $("#mnecancel").click(function(){
                $("#memorynoteeditor").hide();
            });

            $("#mnesave").click(function(){
                $("#memorynoteeditor").hide();
                var mnedescriptioninputval= $("#mnedescriptioninput").val();
                $("#"+Calculator.currentKey+"description").text(mnedescriptioninputval);
                Calculator.setMemoryDescription(Calculator.currentKey, mnedescriptioninputval);
            });

            $("#mnedescriptiondelete").click(function(){
                $("#mnedescriptioninput").val("");
            });
        };

        /**
         * register for the orientation event changes
         */
        this.registerOrientationChange = function(){
            //on page create
            $(document).bind("pagecreate create", Calculator.setOrientation());

            if("onorientationchange" in window)
            {
                window.onorientationchange = Calculator.setOrientation;
            }
            else
            {
                window.onresize = function() {
                    if($(window).height() > $(window).width())
                    {
                        window.orientation = 0;
                    }
                    else
                    {
                        window.orientation = 90;
                    }
                    Calculator.setOrientation();
                }
                window.onresize();
            }
        };

        /**
         * creates scroll bar for the history page
         */
        this.createScrollbars = function(){
            Calculator.historyScrollbar = new IScroll("#wrapper", {scrollbarClass: "customScrollbar",
                hScrollbar: true, vScrollbar: true,
                hideScrollbar: true, checkDOMChanges: true});
        };
    };

    $("button").prop("disabled",true);

    window.addEventListener('pageshow', function () {
        Calculator.registerOrientationChange();
        $("head").append("<link rel='stylesheet' id='lazystylesheet' type='text/css' href='css/lazy"+Calculator.cssAppendix+"'/>");

        $.get("lazy.html", function(result){
            // inject rest of js files
            // and run Calculator init code that depends on them

            var lazyScripts = [
                {
                    script: "lib/peg-0.7.0.min/index.js",
                    success: function(resolve) {
                        $.get("js/peg-code.txt",function(data) {
                            try {
                                Calculator.parser = PEG.buildParser(data);
                                resolve();
                            } catch(err) {
                                console.log(err.message);
                            }
                        });
                    }
                },
                {
                    script: "js/license.js",
                    success: function(resolve) {
                        license_init("license", "background");
                        $("#licensebtnl").on("mousedown",function(){
                          Calculator.buttonClickAudio.play();
                        });
                        $("#licensebtnq").on("mousedown",function() {
                          Calculator.buttonClickAudio.play();
                        });
                        resolve();
                    }
                },
                {
                    script: "js/help.js",
                    success: function(resolve) {
                        help_init("home_help", "help_");
                        $("#home_help").on("mousedown",function(){
                          Calculator.buttonClickAudio.play();
                        });
                        $("#help_close").on("mousedown",function(){
                          Calculator.buttonClickAudio.play();
                        });
                        resolve();
                    }
                },
                {
                    script: "js/localizer.js",
                    success: function(resolve) {
                        Calculator.localizer = new Localizer();
                        Calculator.localizer.localizeHtmlElements();
                        resolve();
                    }
                },
                {
                    script: "lib/iscroll/dist/iscroll-min.js",
                    success: function(resolve) {
                        Calculator.createScrollbars();
                        resolve();
                    }
                }
            ];
            var promises = [];

            // complete body
            $("body").append(result);

            Calculator.registerMneClickHandlers();

            function makeSuccessScript(success, resolve) {
                return function() {
                    success(resolve);
                };
            }

            // inject js files
            for (var index=0; index<lazyScripts.length; index++) {
                var jqTag = document.createElement("script");
                var dfd = Q.defer();
                promises.push(dfd.promise);
                jqTag.onload=makeSuccessScript(lazyScripts[index].success, dfd.resolve);
                jqTag.setAttribute("src",lazyScripts[index].script);
                document.body.appendChild(jqTag);
            }

            // once all js files have been loaded and initialised/etc, do the rest
            Q.all(promises).then(function() {
                Calculator.initButtons();
                Calculator.setMainEntry("");
                Calculator.setCurrentFormula("");
                Calculator.transitionToDegrees();
                Calculator.transitionToTrigonometricFunctions();
                Calculator.equalPressed = false;
                Calculator.populateMemoryPaneFromLocalStorage();
                Calculator.populateHistoryPaneFromLocalStorage();
                Calculator.registerInlineHandlers();
                $("button").prop("disabled",false);
            },function() {
                console.error("something wrong with promises");
            });
        });
    }, false);
});
