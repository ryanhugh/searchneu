import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';
import Home from './pages/Home';
import Results from './pages/Results';
import '../css/base.scss';
import 'semantic-ui-css/semantic.min.css';


export default function App() {
  return (
    <Router>
      <Switch>
        <Route path='/'>
          <Home />
        </Route>
        <Route path='/:termId/:query'>
          <Results />
        </Route>
      </Switch>
    </Router>
  );
}
