import React from 'react';
import CSSModules from 'react-css-modules';
import elasticlunr from 'elasticlunr';
import 'semantic-ui-css/semantic.min.css';

import '../css/base.css';
import '../css/pace.css';
import css from './home.css';

import request from './request';
import Pace from './pace';
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


    const classesSearchIndexUrl = 'data/getSearchIndex/neu.edu/201810';
    const classesDataUrl = 'data/getTermDump/neu.edu/201810'

    const employeesDataUrl = 'data/employeeMap.json'
    const employeesSearchIndexUrl = 'data/employeesSearchIndex.json'

    this.loadingFromCache = request.cacheIsUpdatedForKeys([classesSearchIndexUrl, classesDataUrl, employeesDataUrl, employeesSearchIndexUrl]);

    promises.push(request.get({
      url:classesSearchIndexUrl,
      useCache: true
    }).then((res) => {
      this.searchIndex = elasticlunr.Index.load(res);
    }));

    promises.push(request.get({
      url:classesDataUrl,
      useCache:true
    }).then((res) => {
      this.termData = CourseProData.loadData(res);
    }));

    promises.push(request.get({
      url: employeesDataUrl,
      useCache: true
    }).then((res) => {
      this.employeeMap = (res);
    }));

    promises.push(request.get({
      url:employeesSearchIndexUrl,
      useCache: true
    }).then((res) => {
      this.employeesSearchIndex = elasticlunr.Index.load((res));
    }));

    this.dataPromise = Promise.all(promises).then(() => {

      console.log('Loadedd everything!')
      this.loadingFromCache = false;
      Pace.stop();
      this.forceUpdate();

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
   
    this.search('cs');
  }


  async search(searchTerm) {
    // Ensure that the data has loaded
    await this.dataPromise;

    // This is O(n), but because there are so few subjects it usually takes < 1ms
    // If the search term starts with a subject (eg cs2500), put a space after the subject
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    const subjects = this.termData.getSubjects();

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const lowerCaseSubject = subject.subject.toLowerCase();
      const lowerCaseText = subject.text.toLowerCase();

      // Perfect match for a subject, list all the classes in the subject
      if (lowerCaseSubject === lowerCaseSearchTerm || lowerCaseSearchTerm === lowerCaseText) {
        console.log('Perfect match for subject!', subject.subject)

        let results = this.termData.getClassesInSubject(subject.subject);

        let output = []
        results.forEach(function(result) {
          output.push({
            ref: result,
            type: 'class'
          })
        })

        this.setState({
          results: output
        })
        return;
      }


      if (lowerCaseSearchTerm.startsWith(subject.subject)) {
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
    const classResults = this.searchIndex.search(searchTerm, searchConfig);

    const employeeResults = this.employeesSearchIndex.search(searchTerm, {});

    const output = [];

    // This takes no time at all, never more than 2ms and usally <1ms
    while (true) {
      if (classResults.length === 0 && employeeResults.length === 0) {
        break;
      }

      if (classResults.length === 0) {
        output.push({
          ref: employeeResults[0].ref,
          type: 'employee',
        });
        employeeResults.splice(0, 1);
        continue;
      }

      if (employeeResults.length === 0) {
        output.push({
          type: 'class',
          ref: classResults[0].ref,
        });

        classResults.splice(0, 1);
        continue;
      }

      if (classResults[0].score > employeeResults[0].score) {
        output.push({
          type: 'class',
          ref: classResults[0].ref,
        });
        classResults.splice(0, 1);
        continue;
      }

      if (classResults[0].score <= employeeResults[0].score) {
        output.push({
          ref: employeeResults[0].ref,
          type: 'employee',
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
    // If we are loading from AJAX show nothing on the screen here.
    // Pace.js will show a loading bar until the AJAX requests are done. 
    if (!this.loadingFromCache && (!this.termData || !this.employeeMap || !this.state.results)) {
      return null;
    }

    let resultsLoader = null;

    if (this.termData && this.state.results && this.employeeMap) {
      resultsLoader = (<ResultsLoader
          results={ this.state.results }
          termData={ this.termData }
          employeeMap={ this.employeeMap }
        />)
    }

    return (
      <div>

        <a href="https://github.com/ryanhugh/neusearch" className = "github-corner">
          <svg width="80" height="80" viewBox="0 0 250 250" className = { css.githubCornerIcon } >
            <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
            <path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" className = {css.octopusArm + " octo-arm"}></path>
            <path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" className = "octo-body"></path>
          </svg>
        </a>

        <div className={ css.topPadding } />
        <div>
          <div id='top-header' className='ui center aligned icon header'>
            <h1 className={ css.title }>
            Search
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
          {resultsLoader}
        </div>
        <div className={ css.botttomPadding } />


        <div className='ui divider' />

        <div className='footer ui basic center aligned segment'>
          See an issue or want to add to this website? Fork it or create an issue on
          <a href='https://github.com/ryanhugh/neusearch'>
            &nbsp;GitHub
          </a>.
        </div>

        <div className='ui divider' />

        <div className='footer ui basic center aligned segment'>
          Made with 
          <i className='rocket circular small icon' />
          &nbsp;by&nbsp; 
          <a href='http://github.com/ryanhugh'>
            Ryan Hughes
          </a>
          &nbsp;and UI borrowed from&nbsp;
          <a href='https://github.com/2factorauth/twofactorauth'>
            Two Factor Authenticaton
          </a>.
        </div>
        
      </div>
    );
  }
}

export default CSSModules(Home, css);
