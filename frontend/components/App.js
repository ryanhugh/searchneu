import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import Home from './pages/Home';
import Results from './pages/Results';
import 'semantic-ui-css/semantic.min.css';
import '../css/base.scss';


export default function App() {
  return (
    <Router>
      <QueryParamProvider ReactRouterRoute={ Route }>
        <Switch>
          <Route path='/:termId/:query?'>
            <Results />
          </Route>
          <Route path='/'>
            <Home />
          </Route>
        </Switch>
        <Route
          path='/'
          render={ ({ location }) => {
            if (typeof window.ga === 'function') {
              window.ga('set', 'page', location.pathname + location.search);
              window.ga('send', 'pageview');
            }
            return null;
          } }
        />
      </QueryParamProvider>
    </Router>
  );
}
