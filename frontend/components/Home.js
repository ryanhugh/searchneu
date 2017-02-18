import React from "react"
import CSSModules from 'react-css-modules'
import he from 'he'
import elasticlunr from 'elasticlunr'
import 'semantic-ui-css/semantic.min.css'
import request from 'superagent'

import '../lib/base.css'
import css from './home.css'

import Results from './Results.js'
import Class from './models/Class'
import CourseProData from './models/DataLib'
import Keys from './models/Keys'


var searchConfig = {
	 fields: {
        classId: {boost: 4},
        subject: {boost: 2},
        desc: {boost: 1},
		name: {boost: 1},
		profs: {boost: 1},
		locations: {boost: 1},
		crns: {boost: 1},
    },
	expand: true
}



// Home page component
class Home extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			searchValue: '',
			searchResults: []
		}

		this.dataPromise = null;

		this.loadData();
	}

	async loadData() {

		var promises = []

		promises.push(request('/getSearchIndex/neu.edu/201730').then((res) => {
			this.searchIndex = elasticlunr.Index.load(JSON.parse(res.text))
		}))

		promises.push(request('/getTermDump/neu.edu/201730').then((res) => {
			this.termData = CourseProData.loadData(JSON.parse(res.text))
		}))

		this.dataPromise = Promise.all(promises).then(function(argument) {
			


			// XXX test go through classes and make sure they are all in sections?
			Object.values(this.termData.termDump.classMap).forEach(function (aClass) {
				
				if (!aClass.crns) {
					return;
				}

				aClass.crns.forEach(function(crn) {
					var keys = Keys.create({
						host:aClass.host,
						termId:aClass.termId,
						subject:aClass.subject,
						classUid:aClass.classUid,
						crn: crn
					})

					if (!keys) {
						console.error('lol', aClass,crn)
					}

					var sectionServerData = this.termData.termDump.sectionMap[keys.getHash()]

					if (!sectionServerData) {
						console.error('wtf',aClass,crn)
					}
					
				}.bind(this))
			}.bind(this))
		}.bind(this))
	}

	// TODO This is just for testing
	async componentDidMount() {
		await this.dataPromise
		this.search('da')
	}

	
	async search(searchTerm) {

		// Ensure that the data has loaded
		await this.dataPromise

		// This is O(n), but because there are so few subjects it usually takes < 1ms
		// If the search term starts with a subject (eg cs2500), put a space after the subject
		var lowerCaseSearchTerm = searchTerm.toLowerCase()
		var subjects = this.termData.getSubjects()

		for (var i = 0; i < subjects.length; i++) {
			var subject = subjects[i]
			if (lowerCaseSearchTerm.startsWith(subject.subject.toLowerCase())) {
				var remainingSearch = searchTerm.slice(subject.subject.length);

				// Only rewrite the search if the rest of the query has a high probability of being a classId.
				if (remainingSearch.length > 5) {
					break;
				}
				var match = remainingSearch.match(/\d/g)

				if (!match || match.length < 3) {
					break;
				}
				else {
					searchTerm = searchTerm.slice(0, subject.subject.length) + ' ' + searchTerm.slice(subject.subject.length)
				}
				break;
			}
		}


		// Returns an array of objects that has a .ref and a .score
		// The array is sorted by score (with the highest matching closest to the beginning)
		// eg {ref:"neu.edu/201710/ARTF/1123_1835962771", score: 3.1094880801464573}
		var results = this.searchIndex.search(searchTerm, searchConfig)
		results = results.slice(0, 100)

		var classes = []

		results.forEach(function(result) {

			classes.push(this.termData.createClass({
				hash: result.ref,
				host: 'neu.edu',
				termId: '201710'
			}))
		}.bind(this))

		this.setState({
			classes: classes
		})
	}


	onClick(event) {
		if (!event.target.value) {
			this.setState({
				searchResults: []
			})
			return;
		}

		this.search(event.target.value)
	}


    render() {

    	var resultsContainer = null
    	if (this.state.classes && this.state.classes.length > 0) {
    		resultsContainer = (
    			<div className={"ui container " + css.resultsContainer}>
			        <div className="five column row">
				        <div className="page-home">
					        <Results classes={this.state.classes} termData = {this.termData}/>
			            </div>
			        </div>
			    </div>
    		)
    	}


	    return (
	    	<div>
			    <div id="top-header" className="ui center aligned icon header">
			        <h1 className={css.title}>Class Search</h1>
			        <h3 className={css.subtitle}>For Northeastern</h3>
			        
			        <div id="search-wrapper" className="sub header">
			            <label>
			                <i className="search icon"></i>
			            </label>
			            <input autoFocus type="search" id="seach_id" placeholder="Search Professors and Employees" autoComplete="off" spellCheck="false" tabIndex="0" onChange={this.onClick.bind(this)}/>
			        </div>
			    </div>
			    {resultsContainer}
		    </div>
	    );
    }
}

export default CSSModules(Home, css);
