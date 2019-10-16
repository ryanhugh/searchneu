/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// import macros from './macros';

class ClassCache {
  constructor() {
    // Keep a cache of class objects that are already instantiated.
    // Don't need something similar for employees because there is no object that takes a couple ms to instantiate.
    this.loadedClassObjects = [];
  }

  getClassInstance(classHash) {
    return this.loadedClassObjects[classHash];
  }

  setClassInstance(classHash, classInstance) {
    this.loadedClassObjects[classHash] = classInstance;
  }
}


export default new ClassCache();
