/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import isMobile from 'is-mobile';
import ReactTooltip from 'react-tooltip';
import commonMacros from '../../common/abstractMacros';


// Macros and other utility constants and things that are just relevant in the frontend.


// Used for debounceTooltipRebuild
let tooltipTimer = null;

class Macros extends commonMacros {
  static log(...args) {
    // Don't log stuff in prod mode
    if (Macros.PROD) {
      return;
    }

    commonMacros.log(...args);
  }

  // Call this to reload the tooltip rendering on the entire page.
  // Feel free to call as often as you want, this has internal debouncing so it will only rebuild the tooltips 20ms after the last update call.
  // Currently used in just ClassPanel.js.
  static debounceTooltipRebuild() {
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(ReactTooltip.rebuild.bind(ReactTooltip), 20);
  }

  // Log an event to amplitude. Same function signature as the function for the backend/.
  // This call just uses the script included in index.js
  static async logAmplitudeEvent(type, event) {
    if (!Macros.PROD) {
      return;
    }

    if (!window.amplitude) {
      Macros.error("Can't log to amplitude without amplitude script!");
      return;
    }
    window.amplitude.logEvent(type, event);
  }
}

// The backtick on the third row and all the backslashes need to be escaped.
// This was generated with this site http://patorjk.com/software/taag/#p=display&f=Stacey&t=Search%20NEU
const searchneu = `
   ____                     _       _   _ _____ _   _
 / ___|  ___  __ _ _ __ ___| |__   | \\ | | ____| | | |
 \\___ \\ / _ \\/ _\` | '__/ __| '_ \\  |  \\| |  _| | | | |
  ___) |  __/ (_| | | | (__| | | | | |\\  | |___| |_| |
 |____/ \\___|\\__,_|_|  \\___|_| |_| |_| \\_|_____|\\___/



 Hi There!

 We're looking for talented individuals who want to build great products
 that impact thousands of student's lives. Interested? Help us build Search NEU!

 Contact us at hey@searchneu.com :)
 `;

if (Macros.PROD) {
  commonMacros.log(searchneu);
}


// How many sections to show in a class panel by default.
Macros.sectionsShownByDefault = 3;

// How many sections to add when the user clicks the show more button.
Macros.sectionsAddedWhenShowMoreClicked = 5;

// If this number of section is shown, the show more button will just show the rest of them instead of showing just a couple more.
Macros.sectionsShowAllThreshold = 15;

Macros.searchEvent = 'customSearch';

// True if is a Phone or other mobile device (iPod). Will be false for iPads.
Macros.isMobile = isMobile();


// Definition of some enums for our prerequsities
Macros.prereqTypes = Object.freeze({
  PREREQ: Symbol('prereq'),
  COREQ: Symbol('coreq'),
  PREREQ_FOR: Symbol('prereqFor'),
  OPT_PREREQ_FOR: Symbol('optPrereqFor'),
});

export default Macros;
