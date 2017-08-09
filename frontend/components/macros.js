import isMobile from 'is-mobile';
import ReactTooltip from 'react-tooltip';
import commonMacros from '../../common/macros';


// Macros and other utility constants and things that are just relevant in the frontend. 


// Used for debounceTooltipRebuild
let tooltipTimer = null;

class Macros extends commonMacros {

  // Call this to reload the tooltip rendering on the entire page.
  // Feel free to call as often as you want, this has internal debouncing so it will only rebuild the tooltips 20ms after the last update call.
  // Currently used in just ClassPanel.js.
  static debounceTooltipRebuild() {
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(ReactTooltip.rebuild.bind(ReactTooltip), 20);
  };
}

// How many sections to show in a class panel by default.
Macros.sectionsShownByDefault = 3;

// How many sections to add when the user clicks the show more button. 
Macros.sectionsAddedWhenShowMoreClicked = 5;

Macros.searchEvent = 'customSearch';

// True if is a Phone or other mobile device (iPod). Will be false for iPads.
Macros.isMobile = isMobile();

export default Macros;
