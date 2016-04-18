/*
 * Copyright (c) 2012, Intel Corporation.
 *
 * This program is licensed under the terms and conditions of the
 * Apache License, version 2.0.  The full text of the Apache License is at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 */

/* exported helpInit */

/**
 * Add click handlers for the help dialog.
 * @param {string} btnid The id of the help button.
 * @param {string} prefix The prefix of the help elements.
 */
function helpInit(btnid, prefix) {
  var btn = document.getElementById(btnid);
  var dialog = document.getElementById(`${prefix}dialog`);
  var close = document.getElementById(`${prefix}close`);

  btn.addEventListener('click', function() {
    dialog.className = 'helpdialog shown';
  });

  close.addEventListener('click', function() {
    dialog.className = 'helpdialog';
  });
}
