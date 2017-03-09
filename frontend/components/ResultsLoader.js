import React, { PropTypes } from 'react';
import CSSModules from 'react-css-modules';

import ClassPanel from './ClassPanel';
import css from './ResultsLoader.css';

// Home page component
class ResultsLoader extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      show: 0,
      visibleObjects: [],
    };

    this.alreadyLoadedAt = {};

    this.handleInfiniteLoad = this.handleInfiniteLoad.bind(this);
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleInfiniteLoad);
    this.handleInfiniteLoad();
  }


  componentWillReceiveProps() {
    this.alreadyLoadedAt = {};
    this.setState({
      show: 0,
      visibleObjects: [],
    });
  }

  componentDidUpdate() {
    if (this.state.show === 0) {
      this.addMoreObjects();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleInfiniteLoad);
  }

  handleInfiniteLoad() {
    console.log('results loader handleInfiniteLoad', this.props.results.length, this.state.visibleObjects.length);
    if (this.props.results.length === 0) {
      return;
    }

    const resultsBottom = this.refs.elementsContainer.offsetHeight + this.refs.elementsContainer.offsetTop;

    const diff = window.scrollY + 2000 + window.innerHeight - resultsBottom;

    // Assume about 300 px per class
    if (diff > 0 && this.props.results.length > this.state.visibleObjects.length && !this.alreadyLoadedAt[this.state.visibleObjects.length]) {
      this.alreadyLoadedAt[this.state.visibleObjects.length] = true;
      console.log('triggered');

      this.addMoreObjects();
    }
  }

  addMoreObjects() {
    let delta;
    // When the user is typing in the search box we only need to render enough to go past the bottom of the screen
    // want to render as few as possible between key presses in the search box.
    if (this.state.show === 0) {
      delta = 4;
    } else {
      delta = 10;
    }

    const newObjects = [];

    const toLoad = this.props.results.slice(this.state.show, this.state.show + delta);


    toLoad.forEach((result) => {
      if (result.type === 'class') {
        const aClass = this.props.termData.createClass({
          hash: result.ref,
          host: 'neu.edu',
          termId: '201710',
        });

        newObjects.push({
          type: 'class',
          data: aClass,
        });
      } else if (result.type === 'employee') {
        const employee = this.props.employeeMap[result.ref];

        newObjects.push({
          type: 'employee',
          data: employee,
        });
      } else {
        console.error('wtf is type', result.type);
      }
    });

    // console.log('adding ', newObjects.length, 'now at ', this.state.show, toLoad.length, 'hi')

    this.setState({
      show: this.state.show + delta,
      visibleObjects: this.state.visibleObjects.concat(newObjects),
    });
  }


  render() {
    if (this.props.results.length === 0) {
      return null;
    }

    return (
      <div className={ `ui container ${css.resultsContainer}` }>
        <div className='five column row' >
          <div className='page-home' ref='elementsContainer'>
            {this.state.visibleObjects.map((obj) => {
              if (obj.type === 'class') {
                return <ClassPanel id={ obj.data._id } aClass={ obj.data } />;
              }
              // else if (obj.type === 'employee') {
              //   return <EmployeePanel id = {obj.data.id} employee = {obj.data} />
              // }

                // console.log('Uknown type', obj.type)
              return null;
            })}
          </div>
        </div>
      </div>
    );
  }
}

ResultsLoader.propTypes = {
  results: PropTypes.array.isRequired,
  employeeMap: PropTypes.object.isRequired,
  termData: PropTypes.object.isRequired,
};


export default CSSModules(ResultsLoader, css);
