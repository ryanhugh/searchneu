import React from "react";
import CSSModules from 'react-css-modules';
import css from './home.css'
import Row from './Row.js'

// Home page component
class Home extends React.Component {
  // render
  render() {
    return (
      <div className="page-home">
      <Row/>
      </div>
    );
  }
}

export default CSSModules(Home, css);
