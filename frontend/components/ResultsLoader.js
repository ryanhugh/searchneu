/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';

import Keys from '../../common/Keys';
import macros from './macros';
import EmployeePanel from './panels/EmployeePanel';
import DesktopClassPanel from './panels/DesktopClassPanel';
import MobileClassPanel from './panels/MobileClassPanel';

import Class from './classModels/Class';

// The Home.js component now keeps track of how many to render.
// This component watches for scroll events and tells Home.js if more items need to be requested.

// Home page component
class ResultsLoader extends React.Component {
  // Keep a cache of class objects that are already instantiated.
  // Don't need something similar for employees because there is no object that takes a couple ms to instantiate.
  static loadedClassObjects = {};

  static propTypes = {
    results: PropTypes.array.isRequired,
    loadMore: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
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

  UNSAFE_componentWillReceiveProps() {
    this.alreadyLoadedAt = {};
  }

  componentDidUpdate(prevProps) {
    if (prevProps.results !== this.props.results) {
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

    const resultsBottom = this.elementsContainer.offsetHeight + this.elementsContainer.offsetTop;

    const diff = window.scrollY + 2000 + window.innerHeight - resultsBottom;

    // Assume about 300 px per class
    if (diff > 0 && !this.alreadyLoadedAt[this.state.visibleObjects.length]) {
      this.alreadyLoadedAt[this.state.visibleObjects.length] = true;

      this.props.loadMore();
    }
  }

  addMoreObjects() {
    const newObjects = [];

    macros.log('loading ', this.props.results.length);

    this.props.results.forEach((result) => {
      if (result.type === 'class') {
        let aClass;
        const hash = Keys.getClassHash(result.class);
        if (this.constructor.loadedClassObjects[hash]) {
          aClass = this.constructor.loadedClassObjects[hash];
        } else {
          aClass = Class.create(result.class);
          aClass.loadSectionsFromServerList(result.sections);
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
        macros.error('wtf is type', result.type);
      }
    });


    this.setState({
      visibleObjects: newObjects,
    });
  }


  render() {
    if (this.props.results.length === 0) {
      return null;
    }

    return (
      <div className='ui container results-loader-container'>
        <div className='five column row'>
          <div className='page-home' ref={ (c) => { this.elementsContainer = c; } }>
            {this.state.visibleObjects.map((obj) => {
              if (obj.type === 'class') {
                if (macros.isMobile) {
                  return <MobileClassPanel key={ obj.data.getHash() } aClass={ obj.data } />;
                }

                return <DesktopClassPanel key={ obj.data.getHash() } aClass={ obj.data } />;
              }
              if (obj.type === 'employee') {
                return <EmployeePanel key={ obj.data.id } employee={ obj.data } />;
              }

              macros.log('Unknown type', obj.type);
              return null;
            })}
          </div>
        </div>
      </div>
    );
  }
}


export default ResultsLoader;
