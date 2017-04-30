import React, { PropTypes } from 'react';
import CSSModules from 'react-css-modules';

import EmployeePanel from './EmployeePanel';
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

    // Keep a cache of class objects that are already instantiated. 
    // Don't need something similar for employees because there is no object that takes a couple ms to instantiate. 
    this.loadedClassObjects = {}

    // Number of results that were loaded when handleInfiniteLoad was called.
    // If handleInfiniteLoad is called two different times and the number of components is the same for both,
    // Assume that the first call is still processing and we can safety ignore the second call.
    // This prevents loading twice the number of elements in this case. 
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

        let aClass;
        if (this.loadedClassObjects[result.ref]) {
          aClass = this.loadedClassObjects[result.ref]
        }
        else {
          console.log('resusing ', result.ref)
          aClass = this.props.termData.createClass({
            hash: result.ref,
            host: 'neu.edu',
            termId: '201810',
          });
          this.loadedClassObjects[result.ref] = aClass;
        }

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
                return <ClassPanel key={ obj.data._id } aClass={ obj.data } />;
              }
              else if (obj.type === 'employee') {
                return <EmployeePanel key = {obj.data.id} employee = {obj.data} />
              }
              else {
                console.log('Uknown type', obj.type)
                return null;
              }
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
