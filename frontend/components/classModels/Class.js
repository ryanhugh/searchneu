/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';
import he from 'he';
import moment from 'moment';

import Keys from '../../../common/Keys';
import macros from '../macros';
import Section from './Section';
import RequisiteBranch from './RequisiteBranch';

// This file used to have an equals method as part of coursepro, but then it was removed.
// It might still be in the git history, or you can just ask Ryan if you ever find that you need an equals method.

class Class {
  constructor() {
    //true, if for instance "AP placement exam, etc"
    this.isString = false;

    // A class that is listed as a prereq for another class on the site, but this class dosen't actually exist
    // Currently, missing prereqs are not even added as prereqs for classes because I can't think of any reason to list classes
    // that don't exist anywhere on the site. Could be changed in future, the fitlter is in this file.
    // this.missing = false;

    //instances of Section()
    this.sections = [];

    this.prereqs = {
      type: 'or',
      values: [],
    };

    this.coreqs = {
      type: 'or',
      values: [],
    };

    this.prereqsFor = {
      values: [],
    };

    this.optPrereqsFor = {
      values: [],
    };
  }

  static create(config) {
    if (!config) {
      macros.error('Passed null config?', config);
      return null;
    }
    const instance = new this(config);
    instance.updateWithData(config);
    return instance;
  }

  // Returns a hash of this object used for referencing this instance - eg neu.edu/201910/CS/2500
  getHash() {
    return Keys.getClassHash(this);
  }

  loadFromClassMap(classMap) {
    this.updateWithData(classMap[this.getHash()]);
  }

  convertServerRequisites(data) {
    let retVal = {};

    //already processed node, just process the prereqs and coreqs
    if (data instanceof Class) {
      retVal = data;

      const newCoreqs = [];
      data.coreqs.values.forEach((subTree) => {
        newCoreqs.push(this.convertServerRequisites(subTree));
      });

      data.coreqs.values = newCoreqs;


      const newPrereqs = [];
      data.prereqs.values.forEach((subTree) => {
        newPrereqs.push(this.convertServerRequisites(subTree));
      });

      data.prereqs.values = newPrereqs;

    // Given a branch in the prereqs
    } else if (data.values && data.type) {
      const newValues = [];
      data.values.forEach((subTree) => {
        newValues.push(this.convertServerRequisites(subTree));
      });


      retVal = new RequisiteBranch({
        type: data.type,
        values: newValues,
      });

    // Need to create a new Class()
    } else {
      //basic string
      if ((typeof data) === 'string') {
        data = {
          isString: true,
          desc: data,

        };
      }
      // else data is a normal class that has a .subject and a .classId


      //the leafs of the prereq trees returned from the server dosent have host or termId,
      //but it is the same as the class that returned it,
      //so copy over the values
      if (!data.host) {
        data.host = this.host;
      }
      if (!data.termId) {
        data.termId = this.termId;
      }


      retVal = this.constructor.create(data, {}, false);
    }

    if (!retVal) {
      macros.error('ERROR creating jawn', retVal, data, retVal === data);
      return null;
    }

    return retVal;
  }

  removeMissingClasses(data) {
    if (data.values) {
      const retVal = [];
      const subClassesHash = {};
      data.values.forEach((subData) => {
        if (subData.missing) {
          return;
        }

        // Check to see if it duplicates any classes already found in this data.values
        if (subData.subject && subData.classId) {
          const key = subData.subject + subData.classId;
          if (subClassesHash[key]) {
            return;
          }
          subClassesHash[key] = true;
        }


        subData = this.removeMissingClasses(subData);

        if (subData.values && subData.type) {
          // If all the prereqs are missing and were all removed, don't add
          if (subData.values.length > 0) {
            retVal.push(subData);
          }
        } else {
          retVal.push(subData);
        }
      });

      return {
        type: data.type,
        values: retVal,
      };
    }
    return data;
  }

  flattenCoreqs() {
    let stack = this.coreqs.values.slice(0);
    let curr;
    const classes = [];

    while ((curr = stack.pop())) {
      if (curr instanceof Class) {
        classes.push(curr);
      } else {
        // If it is a requisite branch, the classes needed are under prereqs...
        stack = stack.concat(curr.prereqs.values.slice(0));
      }
    }

    this.coreqs.values = classes;
  }


  // called once
  updateWithData(config) {
    if (config instanceof Class) {
      macros.error('wtf', config);
    }

    if (config.title || config.allParents || config.missing || config.updateWithData) {
      macros.error();
    }

    //copy over all other attr given
    for (const attrName in config) {
      //dont copy over some attr
      //these are copied below and processed a bit
      if (_(['coreqs', 'prereqs', 'download']).includes(attrName) || config[attrName] === undefined) {
        continue;
      } else {
        this[attrName] = config[attrName];
      }
    }

    // Remove any prereqs or coreqs that are missing
    if (config.prereqs) {
      config.prereqs = this.removeMissingClasses(config.prereqs);
    }
    if (config.coreqs) {
      config.coreqs = this.removeMissingClasses(config.coreqs);
    }

    if (config.prereqs) {
      if (!config.prereqs.values || !config.prereqs.type) {
        macros.error('prereqs need values ad type');
      } else {
        this.prereqs.type = config.prereqs.type;
        this.prereqs.values = [];

        //add the prereqs to this node, and convert server data
        config.prereqs.values.forEach((subTree) => {
          this.prereqs.values.push(this.convertServerRequisites(_.cloneDeep(subTree)));
        });

        this.prereqs.values.sort((a, b) => {
          return a.compareTo(b);
        });
      }
    }

    if (config.coreqs) {
      if (!config.coreqs.values || !config.coreqs.type) {
        macros.error('coreqs need values ad type');
      } else {
        this.coreqs.type = config.coreqs.type;
        this.coreqs.values = [];

        //add the coreqs to this node, and convert server data
        config.coreqs.values.forEach((subTree) => {
          this.coreqs.values.push(this.convertServerRequisites(_.cloneDeep(subTree)));
        });

        this.flattenCoreqs();

        this.coreqs.values.sort((a, b) => {
          return a.compareTo(b);
        });
      }
    }


    //name and description could have HTML entities in them, like &#x2260;, which we need to convert to actuall text
    //setting the innerHTML instead of innerText will work too, but this is better
    if (config.desc) {
      this.desc = he.decode(config.desc);
    }
    if (config.name) {
      this.name = he.decode(config.name);
    }


    if (!config.prettyUrl && config.url) {
      this.prettyUrl = config.url;
    }
  }


  //this is used for panels i think and for class list (settings)
  //sort by classId, if it exists, and then subject
  compareTo(otherClass) {
    if (this.isString && otherClass.isString) {
      return 0;
    }

    if (this.isString) {
      return -1;
    }
    if (otherClass.isString) {
      return 1;
    }

    const aId = parseInt(this.classId, 10);
    const bId = parseInt(otherClass.classId, 10);

    if (aId > bId) {
      return 1;
    }

    if (aId < bId) {
      return -1;
    }

    // If ids are the same, sort by subject
    if (this.subject > otherClass.subject) {
      return 1;
    }
    if (this.subject < otherClass.subject) {
      return -1;
    }
    if (this.name > otherClass.name) {
      return 1;
    }
    if (this.name < otherClass.name) {
      return -1;
    }
    if (this.classId > otherClass.classId) {
      return 1;
    }
    if (this.classId < otherClass.classId) {
      return -1;
    }
    return 0;
  }


  getHeighestProfCount() {
    let count = 0;

    this.sections.forEach((section) => {
      if (section.profs) {
        count = Math.max(section.profs.length, count);
      }
    });
    return count;
  }

  getPrettyClassId() {
    if (!this.classId) {
      return null;
    }

    let prettyClassId = this.classId;
    while (prettyClassId.startsWith('0') && prettyClassId.length > 1) {
      prettyClassId = prettyClassId.slice(1);
    }
    return prettyClassId;
  }

  getLastUpdateString() {
    if (this.lastUpdateTime) {
      return moment(this.lastUpdateTime).fromNow();
    }

    return null;
  }

  //returns true if any sections have an exam, else false
  sectionsHaveExam() {
    return this.sections.some((section) => { return section.getHasExam(); });
  }

  isAtLeastOneSectionFull() {
    for (let i = 0; i < this.sections.length; i++) {
      if (this.sections[i].seatsRemaining <= 0 && this.sections[i].seatsCapacity > 0) {
        return true;
      }
    }
    return false;
  }

  // Use this function to load sections from a list of server data of sections.
  // The given sections must all have crns in the class
  loadSectionsFromServerList(serverList) {
    this.sections = [];

    for (const serverData of serverList) {
      const section = Section.create(serverData);
      if (!section) {
        macros.error('Error could not make section!', serverData);
        continue;
      }
      this.sections.push(section);
    }

    this.finishLoadingSections();
  }

  // This runs when just after the sections are done loading. This would be at the bottom of this.loadSections*, but was moved to a separate function
  // so code is not duplicated.
  finishLoadingSections() {
    let hasWaitList = 0;
    this.sections.forEach((section) => {
      hasWaitList += section.hasWaitList;
    });

    if (hasWaitList > this.sections.length / 2) {
      this.hasWaitList = true;
    } else {
      this.hasWaitList = false;
    }


    //sort sections
    this.sections.sort((a, b) => {
      return a.compareTo(b);
    });
  }

  getHasWaitList() {
    for (let i = this.sections.length - 1; i >= 0; i--) {
      if (this.sections[i].getHasWaitList()) {
        return true;
      }
    }
    return false;
  }

  getHasOnlineSections() {
    for (let i = this.sections.length - 1; i >= 0; i--) {
      if (this.sections[i].online) {
        return true;
      }
    }
    return false;
  }

  getHasHonorsSections() {
    for (let i = this.sections.length - 1; i >= 0; i--) {
      if (this.sections[i].honors) {
        return true;
      }
    }
    return false;
  }

  // Downloads the first layer of prereqs
  async loadPrereqs(classMap) {
    this.prereqs.values.forEach((childBranch) => {
      if (childBranch instanceof RequisiteBranch) {
        childBranch.loadPrereqs(classMap);
      } else if (!childBranch.isString) {
        childBranch.loadFromClassMap(classMap);
      }
    });
  }


  // Downloads the first layer of prereqs
  async loadCoreqs(classMap) {
    this.coreqs.values.forEach((childBranch) => {
      if (childBranch instanceof RequisiteBranch) {
        macros.error('meh');
      } else if (!childBranch.isString) {
        childBranch.loadFromClassMap(classMap);
      }
    });
  }
}


Class.requiredPath = ['host', 'termId', 'subject'];
Class.optionalPath = ['classId'];
Class.API_ENDPOINT = '/listClasses';


export default Class;
