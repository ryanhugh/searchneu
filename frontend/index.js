import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import Home from './components/Home';

// if ('serviceWorker' in navigator) {
//   if (!macros.UNIT_TESTS) {

//     navigator.serviceWorker.register('sw.js').then(function (reg) {
//      // registration worked
//      console.log('Registration succeeded. Scope is ' + reg.scope);
//     }).catch(function (error) {
//      // registration failed
//      console.error('Service worker registration failed with ', error);
//     });
//   }
// }
// else {
//   console.log('Service worker not supported')
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