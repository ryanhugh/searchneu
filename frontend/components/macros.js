// XXX: This is stuff that is hardcoded for now, need to change when expanding to other schools.
export default {
  collegeName: 'Northeastern University',
};

window.elog = function elog() {
  console.error.apply(console.error, arguments);
};
