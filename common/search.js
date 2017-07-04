import elasticlunr from 'elasticlunr';

import Keys from './Keys';
import CourseProData from './classModels/DataLib';

// The plan is to use this in both the frontend and the backend.
// Right now it is only in use in the backend.


const classSearchConfig = {
  fields: {
    classId: {
      boost: 4,
    },
    acronym: {
      boost: 4,
    },
    subject: {
      boost: 2,
    },
    desc: {
      boost: 1,
    },
    name: {
      boost: 1,
    },
    profs: {
      boost: 1,
    },

    // Enable this again if this is added to the index.

    // locations: {
    //   boost: 1,
    // },
    crns: {
      boost: 1,
    },
  },
  expand: true,
};

const employeeSearchConfig = {
  fields: {
    name: {
      boost: 2,
    },
    primaryRole: {
      boost: 1,
    },
    primaryDepartment: {
      boost: 1,
    },
    emails: {
      boost: 1,
    },
    phone: {
      boost: 1,
    },
    // officeRoom: {
    //   boost: 1,
    // },
  },
  expand: true,
};


class Search {

  constructor(termDump, classSearchIndex, employeeMap, employeeSearchIndex) {
    this.termDump = CourseProData.loadData(termDump);
    this.classSearchIndex = elasticlunr.Index.load(classSearchIndex);
    this.employeeMap = employeeMap;
    this.employeeSearchIndex = elasticlunr.Index.load(employeeSearchIndex);

    // Save the refs for each query. This is a map from the query to a object like this: {refs: [...], time: Date.now()}
    // These are purged every so often.
    this.refCache = {};


    this.onInterval = this.onInterval.bind(this);

    // 24 HR in ms
    setInterval(this.onInterval, 86400000);
  }

  // Use this to create a search intance
  // All of these arguments should already be JSON.parsed(). (Eg, they should be objects, not strings).
  static create(termDump, classSearchIndex, employeeMap, employeeSearchIndex) {
    // Some sanitiy checking
    if (!termDump || !classSearchIndex || !employeeMap || !employeeSearchIndex) {
      console.error('Error, missing arguments.', termDump, classSearchIndex, employeeMap, employeeSearchIndex);
      return null;
    }


    return new this(termDump, classSearchIndex, employeeMap, employeeSearchIndex);
  }

  onInterval() {
    const dayAgo = Date.now() - 86400000;

    const keys = Object.keys(this.refCache);

    // Clear out any cache that has not been used in over a day.
    for (const key of keys) {
      if (this.refCache[key].time < dayAgo) {
        this.refCache[key] = undefined;
      }
    }
  }


  // Main search function. The min and max index are used for pagenation.
  // Eg, if you want results 10 through 20, call search('hi there', 10, 20)
  search(searchTerm, minIndex = 0, maxIndex = 1000) {
    // Searches are case insensitive.
    searchTerm = searchTerm.trim().toLowerCase();

    // Cache the refs.
    let refs;
    if (this.refCache[searchTerm]) {
      refs = this.refCache[searchTerm].refs;

      // Update the timestamp of this cache item.
      this.refCache[searchTerm].time = Date.now();
    } else {
      refs = this.getRefs(searchTerm);

      this.refCache[searchTerm] = {
        refs: refs,
        time: Date.now(),
      };
    }

    // console.log(JSON.stringify(refs, null, 4))


    const objects = [];
    refs = refs.slice(minIndex, maxIndex);
    for (const ref of refs) {
      if (ref.type === 'class') {
        const aClass = this.termDump.getClassServerDataFromHash(ref.ref);

        if (!aClass) {
          console.error('yoooooo omg', ref);
        }

        const sections = [];

        if (aClass.crns) {
          for (const crn of aClass.crns) {
            const sectionKey = Keys.create({
              host: aClass.host,
              termId: aClass.termId,
              subject: aClass.subject,
              classUid: aClass.classUid,
              crn: crn,
            }).getHash();

            if (!sectionKey) {
              console.error('Error no hash', crn, aClass);
            }

            sections.push(this.termDump.getSectionServerDataFromHash(sectionKey));
          }
        }


        objects.push({
          type: ref.type,
          class: aClass,
          sections: sections,
        });
      } else if (ref.type === 'employee') {
        objects.push({
          employee: this.employeeMap[ref.ref],
          type: ref.type,
        });
      } else {
        console.error('unknown type!');
      }
    }

    return objects;
  }


  // This returns an object like {ref: 'neu.edu/201810/CS/...' , type: 'class'}
  getRefs(searchTerm) {

    // This is O(n), but because there are so few subjects it usually takes < 1ms
    // If the search term starts with a subject (eg cs2500), put a space after the subject
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    const subjects = this.termDump.getSubjects();

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const lowerCaseSubject = subject.subject.toLowerCase();
      const lowerCaseText = subject.text.toLowerCase();

      // Perfect match for a subject, list all the classes in the subject
      if (lowerCaseSubject === lowerCaseSearchTerm || lowerCaseSearchTerm === lowerCaseText) {
        console.log('Perfect match for subject!', subject.subject);

        const results = this.termDump.getClassesInSubject(subject.subject);

        const output = [];
        results.forEach((result) => {
          output.push({
            ref: result,
            type: 'class',
          });
        });

        return output;
      }


      if (lowerCaseSearchTerm.startsWith(lowerCaseSubject)) {
        const remainingSearch = searchTerm.slice(lowerCaseSubject.length);

        // Only rewrite the search if the rest of the query has a high probability of being a classId.
        if (remainingSearch.length > 5) {
          break;
        }
        const match = remainingSearch.match(/\d/g);

        if (!match || match.length < 3) {
          break;
        } else {
          searchTerm = `${searchTerm.slice(0, lowerCaseSubject.length)} ${searchTerm.slice(lowerCaseSubject.length)}`;
        }
        break;
      }
    }

    // Check to see if the search is for an email, and if so remove the @northeastern.edu and @neu.edu
    searchTerm = searchTerm.replace(/@northeastern\.edu/gi, '').replace(/@neu\.edu/gi, '');


    // Measure how long it takes to search. Usually this is very small (< 20ms)
    // const startTime = Date.now();

    // Returns an array of objects that has a .ref and a .score
    // The array is sorted by score (with the highest matching closest to the beginning)
    // eg {ref:"neu.edu/201710/ARTF/1123_1835962771", score: 3.1094880801464573}
    // console.log(searchTerm)
    const classResults = this.classSearchIndex.search(searchTerm, classSearchConfig);

    const employeeResults = this.employeeSearchIndex.search(searchTerm, employeeSearchConfig);

    // console.log('send', 'timing', `search ${searchTerm.length}`, 'search', Date.now() - startTime);

    const output = [];

    console.log(JSON.stringify(classResults, null, 4))

    // This takes no time at all, never more than 2ms and usually <1ms
    while (true) {
      if (classResults.length === 0 && employeeResults.length === 0) {
        break;
      }

      if (classResults.length === 0) {
        output.push({
          type: 'employee',
          ref: employeeResults[0].ref,
          score: employeeResults[0].score
        });
        employeeResults.splice(0, 1);
        continue;
      }

      if (employeeResults.length === 0) {
        output.push({
          type: 'class',
          ref: classResults[0].ref,
          score: classResults[0].score
        });

        classResults.splice(0, 1);
        continue;
      }

      if (classResults[0].score > employeeResults[0].score) {
        output.push({
          type: 'class',
          ref: classResults[0].ref,
          score: classResults[0].score
        });
        classResults.splice(0, 1);
        continue;
      }

      if (classResults[0].score <= employeeResults[0].score) {
        output.push({
          type: 'employee',
          ref: employeeResults[0].ref,
          score: employeeResults[0].score
        });
        employeeResults.splice(0, 1);
      }
    }

    return output;
  }

}

export default Search;
