import isMobile from 'is-mobile';



window.elog = function elog() {
  console.error.apply(console.error, arguments);
};

// True if is a Phone or other mobile device (iPod). Will be false for iPads.
exports.isMobile = isMobile()

// XXX: This is stuff that is hardcoded for now, need to change when expanding to other schools.
exports.collegeName = 'Northeastern University';
