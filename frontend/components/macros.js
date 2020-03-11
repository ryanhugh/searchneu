/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import isMobile from 'is-mobile';
import ReactTooltip from 'react-tooltip';
import commonMacros from '../../common/abstractMacros';


// This file contains a bunch of utility functions and constants that are used all throughout the frontend.
// It inherets from ../common/macros, so things there will also be here too


// Used for debounceTooltipRebuild
let tooltipTimer = null;

class Macros extends commonMacros {
  // Text area used for the copy method, below
  static copyTextArea = null;

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
    tooltipTimer = setTimeout(() => ReactTooltip.rebuild(), 20);
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
    window.amplitude.logEvent(type, event, (statusCode) => {
      if (statusCode !== 200) {
        Macros.log('Amplitude logging failed', statusCode);
      }
    });
  }

  // Takes in text to be copied to the clipboard.
  // This process is longer than it seems like it should be... (thanks JS)
  // There is a new APi
  // This code is gutted from the core of this module: https://github.com/zenorocha/clipboard.js#readme
  static copyToClipboard(input) {
    const suppotsNewAPI = navigator.clipboard && navigator.clipboard.writeText;

    this.logAmplitudeEvent('copy event', {
      text: input,
      suppotsNewAPI: suppotsNewAPI,
    });

    // Try to copy with the new API, if it exists
    if (suppotsNewAPI) {
      navigator.clipboard.writeText(input);
      return;
    }

    // If not, use a much longer process...
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

    if (!this.copyTextArea) {
      this.copyTextArea = document.createElement('textarea');
    }

    this.copyTextArea.style.display = '';


    // Prevent zooming on iOS
    this.copyTextArea.style.fontSize = '12pt';
    // Reset box model
    this.copyTextArea.style.border = '0';
    this.copyTextArea.style.padding = '0';
    this.copyTextArea.style.margin = '0';
    // Move element out of screen horizontally
    this.copyTextArea.style.position = 'absolute';
    this.copyTextArea.style[isRTL ? 'right' : 'left'] = '-9999px';
    // Move element to the same position vertically
    const yPosition = window.pageYOffset || document.documentElement.scrollTop;
    this.copyTextArea.style.top = `${yPosition}px`;

    this.copyTextArea.setAttribute('readonly', '');
    this.copyTextArea.value = input;

    if (!document.body.contains(this.copyTextArea)) {
      document.body.appendChild(this.copyTextArea);
    }

    this.copyTextArea.select();
    this.copyTextArea.setSelectionRange(0, this.copyTextArea.value.length);

    try {
      document.execCommand('copy');
    } catch (err) {
      this.error('Cannot copy', err);
    }

    this.copyTextArea.style.display = 'none';
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
