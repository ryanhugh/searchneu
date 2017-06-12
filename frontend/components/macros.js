import isMobile from 'is-mobile';
import ReactTooltip from 'react-tooltip';
import commonMacros from '../../common/macros';

class Macros extends commonMacros {

}


window.elog = function elog(...args) {
  console.error.apply(console.error, args);
};


let tooltipTimer = null;

Macros.debounceTooltipRebuild = function debounceTooltipRebuild() {
  clearTimeout(tooltipTimer);
  tooltipTimer = setTimeout(ReactTooltip.rebuild.bind(ReactTooltip), 20);
};

// True if is a Phone or other mobile device (iPod). Will be false for iPads.
Macros.isMobile = isMobile() || 1;

// XXX: This is stuff that is hardcoded for now, need to change when expanding to other schools.
Macros.collegeName = 'Northeastern University';

export default Macros;
