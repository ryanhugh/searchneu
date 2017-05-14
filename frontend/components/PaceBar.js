import '../css/pace.css';

// This was taken from this project
// http://github.hubspot.com/pace/docs/welcome/

// The full pace.js project intercepts network connections 
// and other reporters and tries to automatically determine when to appear, how much progress to show, and when to go away

// This is just the rendering part from that, and the progress is set to the progress of the four xhr requests in Home.js

function Bar() {
  this.progress = 0;
}

Bar.prototype.getElement = function () {
  var targetElement;
  if (this.el == null) {
    targetElement = document.querySelector('body');
    if (!targetElement) {
      throw new NoTargetError;
    }
    this.el = document.createElement('div');
    this.el.className = "pace pace-active";
    document.body.className = document.body.className.replace(/pace-done/g, '');
    document.body.className += ' pace-running';
    this.el.innerHTML = '<div class="pace-progress">\n  <div class="pace-progress-inner"></div>\n</div>\n<div class="pace-activity"></div>';
    if (targetElement.firstChild != null) {
      targetElement.insertBefore(this.el, targetElement.firstChild);
    }
    else {
      targetElement.appendChild(this.el);
    }
  }
  return this.el;
};

Bar.prototype.finish = function () {
  var el;
  el = this.getElement();
  el.className = el.className.replace('pace-active', '');
  el.className += ' pace-inactive';
  document.body.className = document.body.className.replace('pace-running', '');
  return document.body.className += ' pace-done';
};

Bar.prototype.update = function (prog) {
  this.progress = prog;
  return this.render();
};

Bar.prototype.destroy = function () {
  try {
    this.getElement().parentNode.removeChild(this.getElement());
  }
  catch (_error) {
    NoTargetError = _error;
  }
  return this.el = void 0;
};

Bar.prototype.render = function () {
  var el, key, progressStr, transform, _j, _len1, _ref2;
  el = this.getElement();
  transform = "translate3d(" + this.progress + "%, 0, 0)";
  _ref2 = ['webkitTransform', 'msTransform', 'transform'];
  for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
    key = _ref2[_j];
    el.children[0].style[key] = transform;
  }
  if (!this.lastRenderedProgress || this.lastRenderedProgress | 0 !== this.progress | 0) {
    el.children[0].setAttribute('data-progress-text', "" + (this.progress | 0) + "%");
    if (this.progress >= 100) {
      progressStr = '99';
    }
    else {
      progressStr = this.progress < 10 ? "0" : "";
      progressStr += this.progress | 0;
    }
    el.children[0].setAttribute('data-progress', "" + progressStr);
  }
  return this.lastRenderedProgress = this.progress;
};

Bar.prototype.done = function () {
  return this.progress >= 100;
};

export default new Bar();