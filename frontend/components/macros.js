import isMobile from 'is-mobile';
import ReactTooltip from 'react-tooltip';
import commonMacros from '../../common/macros';

class Macros extends commonMacros {

}


window.elog = function elog() {
  console.error.apply(console.error, arguments);
};


let tooltipTimer = null;

Macros.debounceTooltipRebuild = function debounceTooltipRebuild() {
	clearTimeout(tooltipTimer);
	tooltipTimer = setTimeout(ReactTooltip.rebuild.bind(ReactTooltip), 20)
}

// True if is a Phone or other mobile device (iPod). Will be false for iPads.
Macros.isMobile = isMobile()

// XXX: This is stuff that is hardcoded for now, need to change when expanding to other schools.
Macros.collegeName = 'Northeastern University';

export default Macros;