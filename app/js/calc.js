/*
 * Copyright (c) 2012, Intel Corporation.
 *
 * This program is licensed under the terms and conditions of the
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

var Calculator = {};

(function() {
  'use strict';

  Calculator = new function() {
    this.localizer = null;
    this.parser = '';
    this.currentKey = '';
    this.cssAppendix = '_portrait.css';

    /**
     * formula that has been computed already and its shown in the current formula area
     */
    this.currentFormula = '';

    // The below two stacks are maintained to do consistent backspace operation
    /**
     * Stack of elements that has been pressed after '=' press && which are shown
     * in mainEntry area.
     *
     * This stack is used to undo user's button presses until the previous
     * valid calculation ('=' press)
     */
    this.mainEntryStack = [];

    /**
     * Stack of elements that has been pressed after '=' press && which are shown
     * in current formula area (except already computed formula).
     *
     * This stack is used to undo user's button presses until the previous
     * valid calculation ('=' press)
     */
    this.currentFormulaStack = [];
    this.currentPage = 'calculationpane';

    /**
     * number of decimal digits to be preserved on trigonometric calculations
     */
    this.trigPrecision = 10000000000;

    //
    // Functions
    //
    var _classChanges = [];
    var _styleChanges = [];

    var _setClass = function(selectorOrElement, classToSet) {
      var newChange = {
        selectorOrElement: selectorOrElement,
        classToSet: classToSet
      };

      _classChanges.push(newChange);
    };

    var _setStyle = function(selector, property, value) {
      var newChange = {
        selector: selector,
        property: property,
        value: value
      };

      _styleChanges.push(newChange);
    };

    var _setClassesAndStyles = function() {
      let numClassChanges = _classChanges.length;
      for (let i = 0; i < numClassChanges; i++ ) {
        let classChange = _classChanges.pop();
        _reallySetClass(
          classChange.selectorOrElement,
          classChange.classToSet
        );
      }

      let numStyleChanges = _styleChanges.length;
      for (let i = 0; i < numStyleChanges; i++ ) {
        let styleChange = _styleChanges.pop();
        _reallySetStyle(
          styleChange.selector,
          styleChange.property,
          styleChange.value
        );
      }

      window.requestAnimationFrame(_setClassesAndStyles);
    };

    window.requestAnimationFrame(_setClassesAndStyles);

    var _reallySetClass = function(selectorOrElement, classToSet) {
      let elements = [];
      if (typeof selectorOrElement === 'string') {
        elements = document.querySelectorAll(selectorOrElement);
      } else {
        elements.push(selectorOrElement);
      }

      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];

        element.className = '';
        element.classList.add(classToSet);
      }
    };

    var _reallySetStyle = function(selector, property, value) {
      let elements = document.querySelectorAll(selector);

      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];

        element.style[property] = value;
      }
    };

    // Functions for transitioning between states.
    //
    this.transitionToDegrees = function() {
      let classes = {
        '#degradswitch': 'switchleftactive',
        '#buttondeg': 'buttontogglebackgroundB',
        '#buttonrad': 'buttontogglebackgroundA'
      };

      Object.keys(classes).forEach(id => _setClass(id, classes[id]));

      Calculator.angleDivisor = 180 / Math.PI;
    };

    this.transitionToRadians = function() {
      let classes = {
        '#degradswitch': 'switchrightactive',
        '#buttondeg': 'buttontogglebackgroundA',
        '#buttonrad': 'buttontogglebackgroundB'
      };

      Object.keys(classes).forEach(id => _setClass(id, classes[id]));

      Calculator.angleDivisor = 1;
    };

    this.transitionToTrigonometricFunctions = function() {
      let classes = {
        '#traghypswitch': 'switchleftactive',
        '#buttontrig': 'buttontogglebackgroundB',
        '#buttonhyp': 'buttontogglebackgroundA'
      };

      Object.keys(classes).forEach(id => _setClass(id, classes[id]));

      _setStyle('#trigonometric', 'display', 'inherit');
      _setStyle('#hyperbolic', 'display', 'none');
    };

    this.transitionToHyperbolicFunctions = function() {
      let classes = {
        '#traghypswitch': 'switchrightactive',
        '#buttontrig': 'buttontogglebackgroundA',
        '#buttonhyp': 'buttontogglebackgroundB'
      };

      Object.keys(classes).forEach(id => _setClass(id, classes[id]));

      _setStyle('#trigonometric', 'display', 'none');
      _setStyle('#hyperbolic', 'display', 'inherit');
    };

    // Helper function for clearing main entry and current formula as needed.
    //
    this.handleClearOnNumberButtonClick = function() {
      if (Calculator.clearMainEntryOnNextNumberButton) {
        Calculator.setMainEntry('');
        Calculator.mainEntryStack.splice(0, Calculator.mainEntryStack.length);
      }

      if (Calculator.clearCurrentFormulaOnNextNumberButton) {
        Calculator.setCurrentFormula('');
        Calculator.currentFormulaStack.splice(
          0,
          Calculator.currentFormulaStack.length
        );
      }
    };

    this.handleClearOnFunctionButtonClick = function() {
      if (Calculator.clearMainEntryOnNextFunctionButton) {
        Calculator.setMainEntry('');
        Calculator.mainEntryStack.splice(0, Calculator.mainEntryStack.length);
      }

      if (Calculator.clearCurrentFormulaOnNextFunctionButton) {
        Calculator.setCurrentFormula('');
        Calculator.mainEntryStack.splice(
          0,
          Calculator.currentFormulaStack.length
        );
      }
    };

    // Functions for handling button presses.
    //
    this.onFunctionButtonClick = function() {
      Calculator.buttonClickAudio.play();
      Calculator.handleClearOnFunctionButtonClick();

      let operator = this.getAttribute('data-operator');

      if (!operator) {
        operator = this.innerHTML;
      }

      // move mainEntryStack content to currentFormulaStack
      for (let i = 0; i < Calculator.mainEntryStack.length; i++) {
        Calculator.currentFormulaStack.push(Calculator.mainEntryStack[i]);
      }

      // clear mainEntryStack
      Calculator.mainEntryStack.splice(0, Calculator.mainEntryStack.length);

      // append main entry and the operator to current formula
      document.querySelector('#currentformula').innerHTML =
        document.querySelector('#currentformula').innerHTML +
        Calculator.getMainEntry() +
        operator;
      Calculator.setMainEntry('');

      // push the recent operator to currentFormulaStack
      Calculator.currentFormulaStack.push(operator);

      Calculator.clearMainEntryOnNextNumberButton = false;
      Calculator.clearMainEntryOnNextFunctionButton = false;
      Calculator.clearCurrentFormulaOnNextNumberButton = false;
    };

    this.onNumericalButtonClick = function() {
      Calculator.buttonClickAudio.play();
      Calculator.handleClearOnNumberButtonClick();

      let value = this.innerHTML;
      let mainEntry = Calculator.getMainEntry();

      if (mainEntry.length >= 22) {
        return;
      }

      if (value === '0') {
        if (mainEntry === '0') {
          return;
        }
      } else if (value === '00') {
        if (mainEntry === '0' || mainEntry === '') {
          return;
        }
      } else if (value === '.') {
        if (mainEntry === '') {
          Calculator.appendToMainEntry('0');
          Calculator.mainEntryStack.push('0');
        } else if (mainEntry.indexOf(value) !== -1) {
          return;
        }
      } else if (value === '+/–') {
        // 'Plus/minus' sign.

        if (mainEntry === '' || mainEntry === '0') {
          return;
        }
        Calculator.setMainEntry('');

        if (mainEntry.charAt(0) === '-') {
          Calculator.appendToMainEntry(mainEntry.substring(1));
        } else {
          Calculator.appendToMainEntry(`-${mainEntry}`);
        }
        value = '';
      }
      // push into mainEntryStack
      Calculator.mainEntryStack.push(value);

      Calculator.appendToMainEntry(value);
      Calculator.setClearButtonMode('C');
      Calculator.clearMainEntryOnNextNumberButton = false;
      Calculator.clearMainEntryOnNextFunctionButton = false;
      Calculator.clearCurrentFormulaOnNextNumberButton = false;
    };

    this.onClearButtonClick = function() {
      Calculator.buttonClickAudio.play();
      let clearButtonText = document.querySelector('#buttonclear').innerHTML;

      if (clearButtonText === 'C') {
        Calculator.setMainEntry('');
      } else if (clearButtonText === 'AC') {
        Calculator.setCurrentFormula('');
        Calculator.currentFormula = '';
      }
      // clear stacks
      let len = Calculator.mainEntryStack.length;
      Calculator.mainEntryStack.splice(0, len);
      len = Calculator.currentFormulaStack.length;
      Calculator.currentFormulaStack.splice(0, len);

      // update the currentformula area
      document.querySelector('#currentformula').innerHTML =
        Calculator.currentFormula;
    };

    this.onDeleteButtonClick = function() {
      Calculator.buttonClickAudio.play();
      let mainEntry = Calculator.getMainEntry();

      if (
        Calculator.currentFormulaStack.length <= 0 &&
        Calculator.mainEntryStack.length <= 0) {
        return;
      }

      let malformedExpressionText =
        Calculator.localizer.getTranslation('malformedExpressionText');
      if (malformedExpressionText === mainEntry) {
        Calculator.setMainEntry('');
        return;
      }

      let len = 0;
      // first delete mainEntry then currentFormula
      if (Calculator.mainEntryStack.length > 0) {
        // splice one element
        len = Calculator.mainEntryStack.length;
        Calculator.mainEntryStack.splice(len - 1, 1);

        // update the remaining elements
        mainEntry = '';
        for (let i = 0; i < Calculator.mainEntryStack.length; i++) {
          mainEntry += Calculator.mainEntryStack[i];
        }
        Calculator.setMainEntry(mainEntry);
      } else {
        // splice one element
        len = Calculator.currentFormulaStack.length;
        Calculator.currentFormulaStack.splice(len - 1, 1);

        // update the remaining elements
        let text = '';
        for (let j = 0; j < Calculator.currentFormulaStack.length; j++) {
          text += Calculator.currentFormulaStack[j];
        }
        document.querySelector('#currentformula').innerHTML =
          Calculator.currentFormula + text;
      }
    };

    this.onEqualButtonClick = function() {
      Calculator.equalClickAudio.play();
      Calculator.handleClearOnFunctionButtonClick();

      let mainEntry = Calculator.getMainEntry();
      let prevFormula = Calculator.currentFormula;
      Calculator.currentFormulaStack.push(mainEntry);
      Calculator.appendToCurrentFormula(mainEntry);

      let formula = Calculator.getCurrentFormula();

      // replace ^ with x for unambiguous parsing.
      formula = formula.replace('e<sup>^</sup>', 'e<sup>x</sup>');

      let entry = '';
      if (formula !== '') {
        try {
          entry = Calculator.parser.parse(formula);
          if (isNaN(entry)) {
            entry =
              Calculator.localizer.getTranslation('malformedExpressionText');
          } else if (mainEntry !== '') {
            Calculator.appendEntryToCalculationHistory(
              Calculator.formHistoryEntry(formula, entry)
            );
            Calculator.createHistoryEntryInLocalStorage(formula, entry);
          }
        } catch (err) {
          entry =
            Calculator.localizer.getTranslation('malformedExpressionText');
        }

        Calculator.setMainEntry(entry);
      }

      Calculator.clearMainEntryOnNextNumberButton = true;
      Calculator.clearMainEntryOnNextFunctionButton = true;
      Calculator.clearCurrentFormulaOnNextNumberButton = true;

      let len = 0;
      // clear undo stacks
      let malformedExpressionText =
        Calculator.localizer.getTranslation('malformedExpressionText');
      if (entry === malformedExpressionText) {
        // restore previous formula on error cases
        Calculator.currentFormula = prevFormula;
        Calculator.clearCurrentFormulaOnNextNumberButton = false;
      } else {
        // clear current formula stack only on valid computation
        len = Calculator.currentFormulaStack.length;
        Calculator.currentFormulaStack.splice(0, len);

        // To maintain operator precedence, enclose the formula that has been already computed
        Calculator.setCurrentFormula(entry);
      }
      len = Calculator.mainEntryStack.length;
      Calculator.mainEntryStack.splice(0, len);
    };

    this.setClearButtonMode = function(mode) {
      document.querySelector('#buttonclear').innerHTML = mode;
    };

    // Function for adding a result history entry.
    //
    this.formHistoryEntry = function(formula, entry) {
      let historyEntry = `\
<div class="thickdivisor"></div>\
<div class="calculationpane">\
  <div class="calculation">\
    <div class="calculationtext">${formula}</div>\
  </div>\
</div>\
<div class="thindivisor"></div>\
<div class="resultpane">\
  <div class="result">\
    <div class="resulttext">${entry}</div>\
  </div>\
</div>`;

      return historyEntry;
    };

    this.setCalculationHistoryEntries = function(historyEntries) {
      document.querySelector('#calculationhistory').innerHTML = historyEntries;
    };

    this.appendEntryToCalculationHistory = function(historyEntry) {
      let calculationHistory = document.querySelector('#calculationhistory');
      calculationHistory.innerHTML =
        calculationHistory.innerHtml +
        historyEntry;
    };

    // Functions for manipulating history persistent storage data.
    //
    this.createHistoryEntryInLocalStorage = function(formula, result) {
      let historyEntry = {
        formula: formula,
        result: result,
        timestamp: new Date().getTime()
      };

      localStorage.setItem(
        `history${Calculator.nexthistoryindex}`,
        JSON.stringify(historyEntry)
      );
      Calculator.nexthistoryindex++;
    };

    this.populateHistoryPaneFromLocalStorage = function() {
      let firsthistoryindex = localStorage.getItem('firsthistoryindex');

      if (firsthistoryindex === null) {
        // Initialize history local storage if not used yet.
        Calculator.nexthistoryindex = 0;
        localStorage.setItem('firsthistoryindex', 0);
      } else {
        // If history local storage is used, then populate the history
        // list with stored items that are less than a week old.
        let time = new Date().getTime();
        let historyEntries = '';

        let i = firsthistoryindex;
        let historyitemstr = localStorage.getItem(`history${i}`);
        while (historyitemstr !== null) {
          try {
            let historyitem = JSON.parse(historyitemstr);

            let oneWeek = 604800000; /* One week in milliseconds */
            if (time - historyitem.timestamp > oneWeek) {
              localStorage.removeItem(`history${i}`);
              firsthistoryindex = i + 1;
            } else {
              historyEntries += Calculator.formHistoryEntry(
                historyitem.formula,
                historyitem.result
              );
            }
          } catch (err) {
            localStorage.removeItem(`history${i}`);
          }

          i++;
          historyitemstr = localStorage.getItem(`history${i}`);
        }
        Calculator.setCalculationHistoryEntries(historyEntries);
        localStorage.setItem('firsthistoryindex', firsthistoryindex);
      }
    };

    // Functions for manipulating entries.
    //
    this.getMainEntry = function() {
      return document.querySelector('#mainentry').innerHTML;
    };

    this.setMainEntry = function(string) {
      let mainentryelement = document.querySelector('#mainentry');

      mainentryelement.innerHTML = string;
      document.querySelector('#mpmainentry').innerHTML = string;

      if (string === '') {
        document.querySelector('#buttonclear').innerHTML = 'AC';
      } else {
        document.querySelector('#buttonclear').innerHTML = 'C';
      }

      _setClass(mainentryelement, 'mainentryshort');
      if (mainentryelement.offsetWidth < mainentryelement.scrollWidth) {
        _setClass(mainentryelement, 'mainentrylong');
      }
    };

    this.appendToMainEntry = function(string) {
      Calculator.setMainEntry(
        document.querySelector('#mainentry').innerHTML +
        string
      );
    };

    this.getCurrentFormula = function() {
      return document.querySelector('#currentformula').innerHTML;
    };

    this.setCurrentFormula = function(string) {
      let currentformulaelement = document.querySelector('#currentformula');

      currentformulaelement.innerHTML = string;
      _setClass(currentformulaelement, 'currentformulashort');
      let thisOffsetWidth = currentformulaelement.offsetWidth;
      let thisScrollWidth = currentformulaelement.scrollWidth;
      if (thisOffsetWidth < thisScrollWidth) {
        _setClass(currentformulaelement, 'currentformulalong');
      }
      Calculator.currentFormula = string;
    };

    this.appendToCurrentFormula = function(string) {
      let newstring =
        document.querySelector('#currentformula').innerHTML +
        string;
      Calculator.currentFormula = newstring;
      Calculator.setCurrentFormula(newstring);
    };

    // Functions for handling arrow button click events.
    //
    this.onButtonMainEntryToMemoryClick = function() {
      let value = Calculator.getMainEntry();

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
      if (value !== '') {
        // Try to find an empty memory entry.
        let i = Calculator.getNextEmptyMemorySlot();

        if (i <= 8) {
          // Empty memory entry found, store entry.
          let mplusi = `M${i}`;
          localStorage.setItem(mplusi, `${value}##`);
          Calculator.setMemoryEntry(mplusi, value, '');
          _setStyle(document.querySelector(`#button${mplusi}`), 'color', '#d9e2d0');
        }
      }
    };

    this.getNextEmptyMemorySlot = function() {
      let i = 1;
      while (i <= 8) {
        if (localStorage.getItem(`M${i}`) === null) {
          break;
        }

        i++;
      }
      return i;
    };

    this.setMemoryEntry = function(key, value, description) {
      let buttonkey = `#button${key}`;
      let hashkey = `#${key}`;
      let children = document.querySelector(buttonkey).children;
      children[0].setAttribute('src', 'images/ico_arrow_white.png');
      _setClass(`${buttonkey}edit`, 'buttonmemoryeditenabled');
      _setClass(`${buttonkey}close`, 'buttonmemorycloseenabled');
      document.querySelector(`${hashkey}text`).innerHTML = value;
      document.querySelector(`${hashkey}description`).textContent =
        description;
      _setStyle(document.querySelector(buttonkey), 'color', '#d9e2d0');
    };

    this.setMemoryDescription = function(key, description) {
      let memoryitemstr = localStorage.getItem(key);

      if (!(memoryitemstr === null)) {
        let memoryitem = memoryitemstr.split('##');

        Calculator.setMemoryEntry(key, memoryitem[0], description);
        localStorage.setItem(key, `${memoryitem[0]}##${description}`);
      }
    };

    this.onButtonMemoryEditClick = function(key) {
      let keyElement = document.querySelector(`#button${key}edit`);
      if (!keyElement.classList.contains('buttonmemoryeditenabled')) {
        return;
      }

      Calculator.currentKey = key;
      _setStyle(document.querySelector('#memorynoteeditor'), 'display', 'block');
      let hashkey = `#${key}`;
      let memoryitemstr = document.querySelector(`${hashkey}text`).textContent;
      let description =
        document.querySelector(`${hashkey}description`).textContent;
      document.querySelector('#mnebutton').textContent = key;
      document.querySelector('#mnetext').textContent = memoryitemstr;

      let input = document.querySelector('#mnedescriptioninput');
      let text = document.querySelector('#mnedescription');

      if (
        input.style.display === '' ||
        input.style.display === 'none' ||
        input.style.visibility !== 'visible'
      ) {
        input.style.display = 'inline';
        text.style.display = '';
        document.querySelector('#mnedescriptioninput').focus();
      } else {
        input.style.display = '';
        text.style.display = 'inline';
      }

      input.value = description;
    };

    this.onMemoryDescriptionInputFocusOut = function(key) {
      let keydescription = `#${key}`;
      let input = document.querySelector(`${keydescription}input`);
      let value = input.value;
      let description = document.querySelector(keydescription);

      description.textContent = value;
      Calculator.setMemoryDescription(key, value);
      input.style.display = '';
      _setStyle(description, 'display', 'inline');
    };

    this.onButtonMemoryClick = function(key) {
      Calculator.handleClearOnNumberButtonClick();

      let value = document.querySelector(`#${key}text`).textContent;

      if (value !== null) {
        Calculator.setMainEntry(value);
        Calculator.clearMainEntryOnNextNumberButton = true;
        Calculator.clearMainEntryOnNextFunctionButton = false;
      }
    };

    this.onButtonMemoryCloseClick = function(key) {
      let hashkey = `#${key}`;
      let buttonkey = `#button${key}`;
      let children = document.querySelector(buttonkey).children;
      children[0].setAttribute('src', 'images/ico_arrow_black.png');
      _setClass(`${buttonkey}edit`, 'buttonmemoryedit');
      _setClass(`${buttonkey}close`, 'buttonmemoryclose');
      _setClass(`${buttonkey}close`, 'buttonmemoryclose');
      localStorage.removeItem(key);
      document.querySelector(`${hashkey}descriptioninput`).value = '';
      document.querySelector(`${hashkey}text`).textContent = '';
      _setStyle(buttonkey, 'color', '#727272');
      document.querySelector(`${hashkey}description`).textContent = '';
    };

    this.populateMemoryPaneFromLocalStorage = function() {
      for (let i = 0; i < 9; i++) {
        let memoryitemstr = localStorage.getItem(`M${i}`);

        if (!(memoryitemstr === null)) {
          let memoryitem = memoryitemstr.split('##');

          Calculator.setMemoryEntry(`M${i}`, memoryitem[0], memoryitem[1]);
        }
      }
    };

    this.onButtonMemoryListClick = function() {
      _setStyle('#memorypage', 'display', 'block');
      Calculator.currentPage = 'memorypage';
      document.querySelector('#mpmainentry').innerHTML =
        Calculator.getMainEntry();
    };

    this.onButtonMemoryClearAll = function() {
      _setStyle('#clearconfirmationdialog', 'visibility', 'visible');
    };

    this.clearAllMemorySlots = function() {
      _setStyle('#clearconfirmationdialog', 'visibility', 'hidden');
      for (let i = 1; i <= 8; i++) {
        Calculator.onButtonMemoryCloseClick(`M${i}`);
      }
      Calculator.setFreeMemorySlot();
    };

    this.cancelClearAllDialog = function() {
      _setStyle('#clearconfirmationdialog', 'visibility', 'hidden');
    };

    this.onButtonMemoryClose = function() {
      Calculator.setFreeMemorySlot();
      _setStyle('#memorypage', 'display', '');
      Calculator.currentPage = 'calculationpane';
    };

    // Function for initializing the UI buttons.
    //
    this.initButtons = function() {
      let buttons = document.querySelectorAll(`\
.buttonblackshort,\
.buttonyellow,\
.buttonblack,\
.buttonblue\
`
      );
      for (let i = 0; i < buttons.length; i++) {
        let button = buttons[i];
        button.addEventListener(
          'mousedown',
          Calculator.onFunctionButtonClick
        );
      }

      buttons = document.querySelectorAll('.buttonwhite');
      for (let i = 0; i < buttons.length; i++) {
        let thisButton = buttons[i];

        thisButton.addEventListener(
          'mousedown',
          Calculator.onNumericalButtonClick
        );
      }

      // Initialize memorize button
      Calculator.setFreeMemorySlot();

      // Initialize button special cases.
      let handlerMap = {
        '#buttonclear': Calculator.onClearButtonClick,
        '#buttondelete': Calculator.onDeleteButtonClick,
        '#buttondot': Calculator.onNumericalButtonClick,
        '#buttonplusminus': Calculator.onNumericalButtonClick,
        '#buttonequal': Calculator.onEqualButtonClick
      };
      let keys = Object.keys(handlerMap);

      for (let i = 0; i < keys.length; i++) {
        let thisKey = keys[i];
        let thisElement = document.querySelector(thisKey);
        thisElement.addEventListener(
          'mousedown',
          handlerMap[thisKey]
        );
      }

      Calculator.initAudio();
    };

    /**
     * initializes the audio files and assigns audio for various button presses
     */
    this.initAudio = function() {
      Calculator.buttonClickAudio = new Audio();
      Calculator.buttonClickAudio.src = './audio/GeneralButtonPress_R2.ogg';
      Calculator.equalClickAudio = new Audio();
      Calculator.equalClickAudio.src = './audio/EqualitySign_R2.ogg';

      let buttons = document.querySelectorAll(`\
#closehistorybutton,\
.historybutton,\
.buttonclose,\
.switchleftactive,\
.buttonpurple,\
.dialogAbuttonPurple,\
.dialogAbuttonBlack,\
.dialogBpurplebutton,\
.dialogBblackbutton,\
.buttonmemory,\
.buttonmemoryedit,\
.buttonmemoryclose\
`
      );

      var _addListener = function(button) {
        button.addEventListener(
          'mousedown',
          () => Calculator.buttonClickAudio.play()
        );
      };

      for (let i = 0; i < buttons.length; i++) {
        let button = buttons[i];

        _addListener(button);
      }
    };

    this.openHistory = function() {
      _setStyle('#LCD_Upper', 'display', 'block');
      _setStyle('#licensebtnl', 'display', '');
    };

    this.closeHistory = function() {
      _setStyle('#LCD_Upper', 'display', '');
      _setStyle('#licensebtnl', 'display', 'block');
      _setStyle(`#${Calculator.currentPage}`, 'display', 'block');
      Calculator.historyScrollbar.refresh();
      return false;
    };

    this.setFreeMemorySlot = function() {
      let i = Calculator.getNextEmptyMemorySlot();
      if (i <= 8) {
        document.querySelector('#buttonmemorizetext').innerHTML = `M${i}`;
      } else {
        document.querySelector('#buttonmemorizetext').innerHTML = 'Mx';
      }
    };

    this.registerInlineHandlers = function() {
      let handlers = {
        click: {
          '#closehistorybutton': Calculator.closeHistory,
          '#openhistorybutton': Calculator.openHistory,
          '#buttondeg': Calculator.transitionToDegrees,
          '#buttonrad': Calculator.transitionToRadians,
          '#buttontrig': Calculator.transitionToTrigonometricFunctions,
          '#buttonhyp': Calculator.transitionToHyperbolicFunctions,
          '#buttonmemorylist': Calculator.onButtonMemoryListClick,
          '#buttonmemorize': Calculator.onButtonMainEntryToMemoryClick,
          '#memoryclearall': Calculator.onButtonMemoryClearAll,
          '#memoryClose': Calculator.onButtonMemoryClose,
          '#dialogokbutton': Calculator.clearAllMemorySlots,
          '#dialogcancelbutton': Calculator.cancelClearAllDialog,
          '#mpopenhistorybutton': Calculator.openHistory,

          '#buttonclosecurrentformula': function() {
            Calculator.setCurrentFormula('');
          },
          '#buttonclosemainentry, #mplcdbuttonclose': function() {
            Calculator.setMainEntry('');
          },
          '#buttonM1': function() {
            Calculator.onButtonMemoryClick('M1');
          },
          '#buttonM1edit': function() {
            Calculator.onButtonMemoryEditClick('M1');
          },
          '#buttonM1close': function() {
            Calculator.onButtonMemoryCloseClick('M1');
          },
          '#buttonM2': function() {
            Calculator.onButtonMemoryClick('M2');
          },
          '#buttonM2edit': function() {
            Calculator.onButtonMemoryEditClick('M2');
          },
          '#buttonM2close': function() {
            Calculator.onButtonMemoryCloseClick('M2');
          },
          '#buttonM3': function() {
            Calculator.onButtonMemoryClick('M3');
          },
          '#buttonM3edit': function() {
            Calculator.onButtonMemoryEditClick('M3');
          },
          '#buttonM3close': function() {
            Calculator.onButtonMemoryCloseClick('M3');
          },
          '#buttonM4': function() {
            Calculator.onButtonMemoryClick('M4');
          },
          '#buttonM4edit': function() {
            Calculator.onButtonMemoryEditClick('M4');
          },
          '#buttonM4close': function() {
            Calculator.onButtonMemoryCloseClick('M4');
          },
          '#buttonM5': function() {
            Calculator.onButtonMemoryClick('M5');
          },
          '#buttonM5edit': function() {
            Calculator.onButtonMemoryEditClick('M5');
          },
          '#buttonM5close': function() {
            Calculator.onButtonMemoryCloseClick('M5');
          },
          '#buttonM6': function() {
            Calculator.onButtonMemoryClick('M6');
          },
          '#buttonM6edit': function() {
            Calculator.onButtonMemoryEditClick('M6');
          },
          '#buttonM6close': function() {
            Calculator.onButtonMemoryCloseClick('M6');
          },
          '#buttonM7': function() {
            Calculator.onButtonMemoryClick('M7');
          },
          '#buttonM7edit': function() {
            Calculator.onButtonMemoryEditClick('M7');
          },
          '#buttonM7close': function() {
            Calculator.onButtonMemoryCloseClick('M7');
          },
          '#buttonM8': function() {
            Calculator.onButtonMemoryClick('M8');
          },
          '#buttonM8edit': function() {
            Calculator.onButtonMemoryEditClick('M8');
          },
          '#buttonM8close': function() {
            Calculator.onButtonMemoryCloseClick('M8');
          }
        },
        focusout: {
          '#M1descriptioninput': function() {
            Calculator.onMemoryDescriptionInputFocusOut('M1');
          },
          '#M2descriptioninput': function() {
            Calculator.onMemoryDescriptionInputFocusOut('M2');
          },
          '#M3descriptioninput': function() {
            Calculator.onMemoryDescriptionInputFocusOut('M3');
          },
          '#M4descriptioninput': function() {
            Calculator.onMemoryDescriptionInputFocusOut('M4');
          },
          '#M5descriptioninput': function() {
            Calculator.onMemoryDescriptionInputFocusOut('M5');
          },
          '#M6descriptioninput': function() {
            Calculator.saveMemoryDescription('M6');
          },
          '#M7descriptioninput': function() {
            Calculator.onMemoryDescriptionInputFocusOut('M7');
          },
          '#M8descriptioninput': function() {
            Calculator.saveMemoryDescription('M8');
          }
        }
      };

      let events = Object.keys(handlers);
      events.forEach(function(event) {
        let selectors = Object.keys(handlers[event]);

        selectors.forEach(function(selector) {
          let handler = handlers[event][selector];
          let elements = document.querySelectorAll(selector);

          for (let i = 0; i < elements.length; i++) {
            var element = elements[i];
            element.addEventListener(event, handler);
          }
        });
      });
    };

    this.registerMneClickHandlers = function() {
      document.querySelector('#mnecancel').addEventListener(
        'click',
        function() {
          _setStyle(document.querySelector('#memorynoteeditor'), 'display', 'none');
        }
      );

      document.querySelector('#mnesave').addEventListener(
        'click',
        function() {
          _setStyle('#memorynoteeditor', 'display', '');
          let mnedescriptioninputval =
            document.querySelector('#mnedescriptioninput').value = '';
          document.querySelector(
            `#${Calculator.currentKey}description`
          ).textContent = mnedescriptioninputval;
          Calculator.setMemoryDescription(
            Calculator.currentKey,
            mnedescriptioninputval
          );
        }
      );

      document.querySelector(
        '#mnedescriptiondelete'
      ).addEventListener(
        'click',
        function() {
          document.querySelector('#mnedescriptioninput').value = '';
        }
      );
    };

    /**
     * register for the orientation event changes
     * changing layout is handled by @media, but resize is done manually
     */
    this.registerOrientationChange = function() {
      // on page create
      document.addEventListener('pagecreate', function() {
        Calculator.maximiseBody();
      });

      if ('onorientationchange' in window) {
        window.onorientationchange = function() {
          Calculator.maximiseBody();
        };
      } else {
        window.onresize = function() {
          if (window.innerHeight > window.innerWidth) {
            window.orientation = 0;
          } else {
            window.orientation = 90;
          }
          Calculator.maximiseBody();
        };
        window.onresize();
      }
    };

    /**
     * creates scroll bar for the history page
     */
    this.createScrollbars = function() {
      Calculator.historyScrollbar = new IScroll('#wrapper',
        {
          scrollbarClass: 'customScrollbar',
          hScrollbar: true, vScrollbar: true,
          hideScrollbar: true,
          checkDOMChanges: true
        });
    };

    this.maximiseBody = function() {
      // add to event queue
      setTimeout(function() {
        // apply scaling transform
        let docWidth = document.documentElement.clientWidth;
        let docHeight = document.documentElement.clientHeight;
        let body = document.querySelector('body');
        let bodyWidth = body.clientWidth;
        let bodyHeight = body.clientHeight;

        _setStyle('body', '-webkit-transform',
          `translate(-50%, -50%) \
           scale(${docWidth / bodyWidth}, ${docHeight / bodyHeight})`
        );
      }, 0);
    };
  };

  // grey-out all the buttons
  let buttons = document.querySelectorAll('button');
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].disabled = true;
  }

  window.addEventListener('pageshow', function() {
    let link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('media', 'all and (orientation:landscape)');
    link.setAttribute('href', 'css/lazy.css');

    document.querySelector('head').appendChild(link);

    link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('media', 'all and (orientation:portrait)');
    link.setAttribute('href', 'css/lazy_portrait.css');

    document.querySelector('head').appendChild(link);

    Calculator.registerOrientationChange();

    fetch('lazy.html').then(function(response) {
      return response.text();
    }).then(function(body) {
      // inject rest of js files
      // and run Calculator init code that depends on them

      let lazyScripts = [
        {
          script: 'lib/pegjs/peg-0.9.0.min.js',
          success: function(resolve) {
            fetch('data/peg-code.txt').then(function(response) {
              return response.text();
            }).then(function(data) {
              try {
                Calculator.parser = PEG.buildParser(data);
                resolve();
              } catch (err) {
                console.log(err.message);
              }
            });
          }
        },
        {
          script: 'js/license.js',
          success: function(resolve) {
            licenseInit('license', 'background');
            document.querySelector(
              '#licensebtnl'
            ).addEventListener('mousedown', function() {
              Calculator.buttonClickAudio.play();
            });
            document.querySelector(
              '#licensebtnq'
            ).addEventListener('mousedown', function() {
              Calculator.buttonClickAudio.play();
            });
            resolve();
          }
        },
        {
          script: 'js/help.js',
          success: function(resolve) {
            helpInit('home_help', 'help_');
            document.querySelector(
              '#home_help'
            ).addEventListener('mousedown', function() {
              Calculator.buttonClickAudio.play();
            });
            document.querySelector(
              '#help_close'
            ).addEventListener('mousedown', function() {
              Calculator.buttonClickAudio.play();
            });
            resolve();
          }
        },
        {
          script: 'js/localizer.js',
          success: function(resolve) {
            Calculator.localizer = new Localizer();
            Calculator.localizer.localizeHtmlElements();
            resolve();
          }
        },
        {
          script: 'lib/iscroll/dist/iscroll-min.js',
          success: function(resolve) {
            Calculator.createScrollbars();
            resolve();
          }
        }
      ];
      let promises = [];

      // complete body
      document.querySelector('body').innerHTML += body;

      Calculator.registerMneClickHandlers();

      let makeSuccessScript = function(success, resolve) {
        return function() {
          success(resolve);
        };
      };

      // inject js files
      for (let index = 0; index < lazyScripts.length; index++) {
        promises.push(new Promise(function(resolve) {
          let jqTag = document.createElement('script');
          jqTag.onload = makeSuccessScript(
            lazyScripts[index].success,
            resolve
          );
          jqTag.setAttribute('src', lazyScripts[index].script);
          document.body.appendChild(jqTag);
        }));
      }

      // once all js files have been loaded and initialised/etc, do the rest
      Promise.all(promises).then(function() {
        Calculator.initButtons();
        Calculator.setMainEntry('');
        Calculator.setCurrentFormula('');
        Calculator.transitionToDegrees();
        Calculator.transitionToTrigonometricFunctions();
        Calculator.equalPressed = false;
        Calculator.populateMemoryPaneFromLocalStorage();
        Calculator.populateHistoryPaneFromLocalStorage();
        Calculator.registerInlineHandlers();
        let buttons = document.querySelectorAll('button');
        for (let i = 0; i < buttons.length; i++) {
          buttons[i].disabled = false;
        }
        Calculator.maximiseBody();
      }, function() {
        console.error('something wrong with promises');
      });
    });
  }, false);
})();
