import isMobile from 'is-mobile';
import ReactTooltip from 'react-tooltip';


window.elog = function elog() {
  console.error.apply(console.error, arguments);
};


let tooltipTimer = null;

exports.debounceTooltipRebuild = function debounceTooltipRebuild() {
	clearTimeout(tooltipTimer);
	tooltipTimer = setTimeout(ReactTooltip.rebuild.bind(ReactTooltip), 20)
}

// True if is a Phone or other mobile device (iPod). Will be false for iPads.
exports.isMobile = isMobile()

// XXX: This is stuff that is hardcoded for now, need to change when expanding to other schools.
exports.collegeName = 'Northeastern University';

// These are setup in the webpack config
if (process.env.PROD) {
	exports.DEV = false;
	exports.PROD = true;
	exports.TESTS = false;
}
else if (process.env.DEV) {
	exports.DEV = true;
	exports.PROD = false;
	exports.TESTS = false;
}
else if (process.env.NODE_ENV === 'test') {
	exports.DEV = false;
	exports.PROD = false;
	exports.TESTS = true;
}
else {
	console.log('UNKNOWN env! Setting to dev.')
	console.log(process.env.NODE_ENV, process.env.PROD, process.env.TESTS, process.env.DEV,'env here')
	exports.DEV = false;
	exports.PROD = true;
	exports.TESTS = false;
}
