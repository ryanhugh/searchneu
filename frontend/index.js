import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import Home from './components/Home';

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
