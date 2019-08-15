// This was the beginning of some script to run Chrome's lighthouse auditing thing on Search NEU
// It would be cool if we could run this over the site in some extended testing mode, but it does require that we fire up a chrome headless 
// to run. 

// add lighthouse and chrome-launcher to package.json

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

function launchChromeAndRunLighthouse(url, opts, config = null) {
  return chromeLauncher.launch({chromeFlags: opts.chromeFlags}).then(chrome => {
    opts.port = chrome.port;
    return lighthouse(url, opts, config).then(results => {
      // use results.lhr for the JS-consumeable output
      // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
      // use results.report for the HTML/JSON/CSV output as a string
      // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
      return chrome.kill().then(() => results.report)
    });
  });
}

const opts = {
  chromeFlags: ['--show-paint-rects', '--headless']
};

// Usage:
launchChromeAndRunLighthouse('https://searchneu.com', opts).then(results => {
  // Use results!
  console.log(results)
});
