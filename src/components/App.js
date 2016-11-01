import React from "react";
import "../stylesheets/main.scss";

// app component
export default class App extends React.Component {
    // render
    render() {
        return (
            <div className="container">
                {this.props.children}
            </div>
        );
    }
}