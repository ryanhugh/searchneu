import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';

import Keys from '../../common/classModels/Keys'
import DataLib from '../../common/classModels/DataLib'
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
        console.log(result, result.ref)
        console.log('hfidjfalksjlk')
        let hash = Keys.create(result.class).getHash()
        if (this.constructor.loadedClassObjects[hash]) {
          aClass = this.constructor.loadedClassObjects[hash]
        }
        else {
          aClass = DataLib.createClassFromSearchResult(result);
          this.constructor.loadedClassObjects[hash] = aClass;
        }

        newObjects.push({
          type: 'class',
          data: aClass,
        });
      } else if (result.type === 'employee') {
        newObjects.push({
          type: 'employee',
          data: result.employee,
        });
      } else {
        console.error('wtf is type', result.type);
      }
    });

    for (const a of newObjects) {
      console.log("New object:", a.subject,a.classUid)
    }

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
                return <ClassPanel key={ Keys.create(obj.data).getHash() } aClass={ obj.data } />;
              }
              else if (obj.type === 'employee') {
                return <EmployeePanel key = {obj.data.id} employee = {obj.data} />
              }
              else {
                console.log('Unknown type', obj.type)
                return null;
              }
            })}
          </div>
        </div>
      </div>
    );
  }
}

// Keep a cache of class objects that are already instantiated. 
// Don't need something similar for employees because there is no object that takes a couple ms to instantiate. 
ResultsLoader.loadedClassObjects = {}

ResultsLoader.propTypes = {
  results: PropTypes.array.isRequired
}


export default CSSModules(ResultsLoader, css);
