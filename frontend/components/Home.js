import React from "react";
import CSSModules from 'react-css-modules';
import css from './home.css'

// Home page component
class Home extends React.Component {
  // render
  render() {
    return (
      <div className="page-home">
        <h4 className={css.test}>Hello world!</h4>
      </div>
    );
  }
}

export default CSSModules(Home, css);
