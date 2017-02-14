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


var searchConfig = {
	"desc": {
		"boost": 1,
		"bool": "OR",
		"expand": false
	},
	"name": {
		"boost": 1,
		"bool": "OR",
		"expand": true
	},
	"classId": {
		"boost": 1,
		"bool": "OR",
		"expand": true
	},
	"subject": {
		"boost": 1,
		"bool": "OR",
		"expand": true
	},
	"profs": {
		"boost": 1,
		"bool": "OR",
		"expand": true
	},
	"locations": {
		"boost": 1,
		"bool": "OR",
		"expand": true
	},
	"crns": {
		"boost": 1,
		"bool": "OR",
		"expand": false
	},
	expand: true
}



// Home page component
class Home extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			searchValue: 'ad',
			searchResults: []
		}
		console.log('running constructor')

		this.loadData();
	}

	async loadData() {

		// TODO: parallize this shizz
		this.searchIndex = elasticlunr.Index.load(JSON.parse((await request('/getSearchIndex/neu.edu/201730')).text))
		Class.load(JSON.parse((await request('/getTermDump/neu.edu/201730')).text))
		// console.log(this.classMap)

		this.search('da')
	}

	// TODO: if data has not been loaded, wait for it to load
	search(searchTerm) {

		// Returns an array of objects that has a .ref and a .score
		// The array is sorted by score (with the highest matching closest to the beginning)
		// eg {ref:"neu.edu/201710/ARTF/1123_1835962771", score: 3.1094880801464573}
		var results = this.searchIndex.search(searchTerm, searchConfig)

		results = results.slice(0, 50)

		var classes = []

		results.forEach(function(result) {




			classes.push(this.termDump.classMap[result.ref])
		}.bind(this))

		console.log(classes.length, 'results')

		if (classes.length != 0) {
			console.log('first one is ',classes[0].name)
		}



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
	    return (
	    	<div>
			    <div id="top-header" className="ui center aligned icon header">
			        <h1 className={css.title}>Employee Directory</h1>
			        <h3 className={css.subtitle}>For Northeastern</h3>
			        
			        <div id="search-wrapper" className="sub header">
			            <label>
			                <i className="search icon"></i>
			            </label>
			            <input autoFocus type="search" id="seach_id" placeholder="Search Professors and Employees" autoComplete="off" spellCheck="false" tabIndex="0" onChange={this.onClick.bind(this)}/>
			        </div>
			    </div>

			    <div className={"ui container " + css.resultsContainer}>
			        <div className="five column row">
				        <div className="page-home">
					        <Results classes={this.state.classes} sectionMap = {this.sectionMap}/>
			            </div>
			        </div>
			    </div>
		    </div>
	    );
    }
}

export default CSSModules(Home, css);
