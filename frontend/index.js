import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import URI from 'urijs';

import macros from './components/macros';
import Home from './components/Home';

if (window.location.hash === '#notrack') {
  console.log('Turning on no track.')
  window.localStorage.noTrack = true;
}

// Segment tracket. This includes trackers for Rollbar, Google Analytics, and Fullstory. 
// These are only used on prod and only used if the user has not opted out of tracking. 
if (macros.PROD && !window.localStorage.noTrack) {
  !function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on"];analytics.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);analytics.push(e);return analytics}};for(var t=0;t<analytics.methods.length;t++){var e=analytics.methods[t];analytics[e]=analytics.factory(e)}analytics.load=function(t){var e=document.createElement("script");e.type="text/javascript";e.async=!0;e.src=("https:"===document.location.protocol?"https://":"http://")+"cdn.segment.com/analytics.js/v1/"+t+"/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)};analytics.SNIPPET_VERSION="4.0.0";
  analytics.load("VWqkionywHZjd2YI3Ds8AE7uLW3DuR19");
  analytics.page();
  }}();
}
else {
  window.ga = function(...args){
    // console.log('GA called:', args)
  }
}


// Register the Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(function (reg) {
   // Registration worked.
   console.log('Registration succeeded. Scope is', reg.scope);
  }).catch(function (error) {
   // Registration failed.
   elog('Service worker registration failed with ', error);
  });
}
else {
  console.log("Browser does not support Service Worker.")
}


const root = document.getElementById('app');
function createApp() {
  return (
    <Home />
  );
}


if (process.env.NODE_ENV === 'production') {
  ReactDOM.render(createApp(), root);
} else {
  ReactDOM.render((
    <AppContainer>
      { createApp() }
    </AppContainer>
  ), root);

  if (module.hot) {
    module.hot.accept(() => {
      ReactDOM.render((
        <AppContainer>
          { createApp() }
        </AppContainer>
      ), root);
    });
  }
}