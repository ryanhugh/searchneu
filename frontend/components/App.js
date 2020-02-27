import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';
import Home from './pages/Home';
import Results from './pages/Results';
import 'semantic-ui-css/semantic.min.css';
import '../css/base.scss';


export default function App() {
  return (
    <Router>
      <Switch>
        <Route path='/:termId/:query'>
          <Results />
        </Route>
        <Route path='/:termId?'>
          <Home />
        </Route>
      </Switch>
    </Router>
  );
}
