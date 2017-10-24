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

// Segment tracket. This includes trackers for Rollbar and Fullstory.
// These are only used on prod and only used if the user has not opted out of tracking.
if (macros.PROD && !window.localStorage.noTrack) {
  !function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on"];analytics.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);analytics.push(e);return analytics}};for(var t=0;t<analytics.methods.length;t++){var e=analytics.methods[t];analytics[e]=analytics.factory(e)}analytics.load=function(t){var e=document.createElement("script");e.type="text/javascript";e.async=!0;e.src=("https:"===document.location.protocol?"https://":"http://")+"cdn.segment.com/analytics.js/v1/"+t+"/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(e,n)};analytics.SNIPPET_VERSION="4.0.0";
  analytics.load("VWqkionywHZjd2YI3Ds8AE7uLW3DuR19");
  analytics.page();
  }}();

  // Tracker for Google Analytics.
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  // Don't log a page view here. A page view will be logged in Home.js when it loads. This will contain info about the search query.
  ga('create', 'UA-85376897-3', 'auto');

  // This tracker is from Amplitude. It will queue up calls to window.amplitude before it loaded, and then call when the script loads.
  // We could use Amplitude through Segment, but then window.amplitude will not be defined until amplitude.js loads if we did that.
  (function(e,t){var n=e.amplitude||{_q:[],_iq:{}};var r=t.createElement("script");r.type="text/javascript";
  r.async=true;r.src="https://d24n15hnbwhuhn.cloudfront.net/libs/amplitude-3.4.0-min.gz.js";
  r.onload=function(){e.amplitude.runQueuedFunctions()};var i=t.getElementsByTagName("script")[0];
  i.parentNode.insertBefore(r,i);function s(e,t){e.prototype[t]=function(){this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));
  return this}}var o=function(){this._q=[];return this};var a=["add","append","clearAll","prepend","set","setOnce","unset"];
  for(var u=0;u<a.length;u++){s(o,a[u])}n.Identify=o;var c=function(){this._q=[];return this;
  };var p=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"];
  for(var l=0;l<p.length;l++){s(c,p[l])}n.Revenue=c;var d=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","logEventWithTimestamp","logEventWithGroups"];
  function v(e){function t(t){e[t]=function(){e._q.push([t].concat(Array.prototype.slice.call(arguments,0)));
  }}for(var n=0;n<d.length;n++){t(d[n])}}v(n);n.getInstance=function(e){e=(!e||e.length===0?"$default_instance":e).toLowerCase();
  if(!n._iq.hasOwnProperty(e)){n._iq[e]={_q:[]};v(n._iq[e])}return n._iq[e]};e.amplitude=n;
  })(window,document);

  amplitude.getInstance().init(macros.amplitudeToken);
}
else {
  window.ga = function(...args){
    // console.log('GA called:', args)
  }
  window.amplitude = {
    logEvent: window.ga
  }
}

try {
   navigator.serviceWorker.getRegistrations().then(function(registrations) {
       registrations.forEach(function(registration) {
           console.log('removing registration', registration);
           registration.unregister();
       })
   })
}
catch (e) {
   console.log('failed to unregister all service workers', e);
}

// // Register the Service Worker
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('sw.js').then(function (reg) {
//    // Registration worked.
//    console.log('Registration succeeded. Scope is', reg.scope);
//   }).catch(function (error) {
//    // Registration failed.
//    macros.error('Service worker registration failed with ', error);
//   });
// }
// else {
//   console.log("Browser does not support Service Worker.")
// }


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
