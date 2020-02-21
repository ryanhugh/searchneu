import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path='/:termId'>
          <Home />
        </Route>
        <Route path='/:termId/:query'>
          <Results />
        </Route>
      </Switch>
    </Router>
  );
}
