import React from 'react';
import CSSModules from 'react-css-modules';
import elasticlunr from 'elasticlunr';
import 'semantic-ui-css/semantic.min.css';
import request from 'superagent';

import '../lib/base.css';
import css from './home.css';

import ResultsLoader from './ResultsLoader';
import CourseProData from './models/DataLib';
import Keys from './models/Keys';


const searchConfig = {
  fields: {
    classId: {
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
    locations: {
      boost: 1,
    },
    crns: {
      boost: 1,
    },
  },
  expand: true,
};


// Home page component
class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      results: [],
    };

    this.dataPromise = null;

    this.searchIndex = null;
    this.termData = null;
    this.employeeMap = null;
    this.employeesSearchIndex = null;

    this.onClick = this.onClick.bind(this);

    this.loadData();
  }

  async loadData() {
    const promises = [];

    promises.push(request('/getSearchIndex/neu.edu/201730').then((res) => {
      this.searchIndex = elasticlunr.Index.load(JSON.parse(res.text));
    }));

    promises.push(request('/getTermDump/neu.edu/201730').then((res) => {
      this.termData = CourseProData.loadData(JSON.parse(res.text));
    }));

    promises.push(request('/employeeMap.json').then((res) => {
      this.employeeMap = JSON.parse(res.text);
    }));

    promises.push(request('/employeesSearchIndex.json').then((res) => {
      this.employeesSearchIndex = elasticlunr.Index.load(JSON.parse(res.text));
    }));

    this.dataPromise = Promise.all(promises).then((argument) => {
      // TODO remove
      // test go through classes and make sure they are all in sections?
      // 3 invalid crns (or missing sections?) were found with this code
      Object.values(this.termData.termDump.classMap).forEach((aClass) => {
        if (!aClass.crns) {
          return;
        }

        aClass.crns.forEach((crn) => {
          const keys = Keys.create({
            host: aClass.host,
            termId: aClass.termId,
            subject: aClass.subject,
            classUid: aClass.classUid,
            crn: crn,
          });

          if (!keys) {
            console.error('lol', aClass, crn);
          }

          const sectionServerData = this.termData.termDump.sectionMap[keys.getHash()];
          if (!sectionServerData) {
            console.error('wtf', aClass, crn);
          }
        });
      });
    });
  }

  // TODO This is just for testing
  async componentDidMount() {
    await this.dataPromise;
    this.search('huntington');
  }


  async search(searchTerm) {
    // Ensure that the data has loaded
    await this.dataPromise;

    // This is O(n), but because there are so few subjects it usually takes < 1ms
    // If the search term starts with a subject (eg cs2500), put a space after the subject
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const subjects = this.termData.getSubjects();

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      if (lowerCaseSearchTerm.startsWith(subject.subject.toLowerCase())) {
        const remainingSearch = searchTerm.slice(subject.subject.length);

        // Only rewrite the search if the rest of the query has a high probability of being a classId.
        if (remainingSearch.length > 5) {
          break;
        }
        const match = remainingSearch.match(/\d/g);

        if (!match || match.length < 3) {
          break;
        } else {
          searchTerm = `${searchTerm.slice(0, subject.subject.length)} ${searchTerm.slice(subject.subject.length)}`;
        }
        break;
      }
    }


    // Returns an array of objects that has a .ref and a .score
    // The array is sorted by score (with the highest matching closest to the beginning)
    // eg {ref:"neu.edu/201710/ARTF/1123_1835962771", score: 3.1094880801464573}
    let classResults = this.searchIndex.search(searchTerm, searchConfig);

    const employeeResults = this.employeesSearchIndex.search(searchTerm, {});

    const output = [];

    // This takes no time at all, never more than 2ms and usally <1ms
    while (true) {
      if (classResults.length == 0 && employeeResults.length === 0) {
        break;
      }

      if (classResults.length == 0) {
        output.push({
          ref: employeeResults[0].ref,
          type: 'employee'
        });
        employeeResults.splice(0, 1);
        continue;
      }

      if (employeeResults.length == 0) {

        output.push({
          type: 'class',
          ref: classResults[0].ref
        });

        classResults.splice(0, 1);
        continue;
      }

      if (classResults[0].score > employeeResults[0].score) {
        output.push({
          type: 'class',
          ref: classResults[0].ref
        });
        classResults.splice(0, 1);
        continue;
      }

      if (classResults[0].score <= employeeResults[0].score) {
         output.push({
          ref: employeeResults[0].ref,
          type: 'employee'
        });
        employeeResults.splice(0, 1);
      }
    }

    this.setState({
      results: output,
    });
  }


  onClick(event) {
    if (!event.target.value) {
      this.setState({
        searchResults: [],
      });
      return;
    }

    this.search(event.target.value);
  }


  render() {
    return (
      <div>
        <div id='top-header' className='ui center aligned icon header'>
          <h1 className={ css.title }> 
            Class Search 
          </h1>
          <h3 className={ css.subtitle }>
           For Northeastern
          </h3>
          <div id='search-wrapper' className='sub header'>
            <label>
              <i className='search icon' />
            </label> 
            <input
              autoFocus type='search'
              id='seach_id'
              placeholder='Search Classes, Professors, and Employees'
              autoComplete='off'
              spellCheck='false'
              tabIndex='0'
              onChange={ this.onClick }
            /> 
          </div>
        </div>
        <ResultsLoader 
          results = {this.state.results }
          termData = {this.termData}
          employeeMap = {this.employeeMap}
        />
      </div>
    );
  }
}

export default CSSModules(Home, css);
