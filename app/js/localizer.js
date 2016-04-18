/*
 * Copyright (c) 2012, Intel Corporation.
 *
 * This program is licensed under the terms and conditions of the
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

/* exported Localizer */

/**
 * class to encapsulate methods to do with localisation.
 * @return {object} instance of Localizer.
 */
function Localizer() {
  /**
   * When adding new locale to the application, DO NOT to forget to add its english translation
   * to this array, as this array is being used to provide default translation text
   */
  var LOCALE = {
    memoryClearallText: 'Clear All',
    memoryCloseText: 'Close',
    dialogHeadingText: 'Clear All Memory slots',
    dialogContentText: 'All memory slots will be cleared.',
    dialogOKButtonText: 'OK',
    dialogCancelButtonText: 'Cancel',
    mneSaveText: 'Save',
    mneCancelText: 'Cancel',
    malformedExpressionText: 'Malformed Expression'
  };

  /**
   * Returns translated strings
   *
   * @param {string} key The key of the message.
   * @return {string} The translation.
   *
   * if the application is installed the translation string is fetched from the
   * application translation file. If not (just opening index.html), it is assumed that
   * English is the default language and the associated translated strings are
   * returned from the array named LOCALE.
   */
  this.getTranslation = function(key) {
    var text = '';
    if (window.chrome && window.chrome.i18n) {
      text = chrome.i18n.getMessage(key);
    } else {
      return LOCALE[key];
    }
    return text;
  };

  this.localizeHtmlElements = function() {
    var keys = {
      memoryclearall: 'memoryClearallText',
      memoryClose: 'memoryCloseText',
      dialogheading: 'dialogHeadingText',
      dialogcontenttext: 'dialogContentText',
      dialogokbutton: 'dialogOKButtonText',
      dialogcancelbutton: 'dialogCancelButtonText',
      mnesave: 'mneSaveText',
      mnecancel: 'mneCancelText'
    };
    var ids = Object.keys(keys);

    ids.forEach(
      id => {
        document.querySelector(`#${id}`).textContent =
          this.getTranslation(keys[id]);
      }
    );
  };

  return this;
}

