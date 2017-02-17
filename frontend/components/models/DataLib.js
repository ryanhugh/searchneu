import Class from './Class'
import Section from './Section'
import Keys from './Keys'

export default class DataLib {

	constructor(termDump) {
		this.termDump = termDump
	}


	// Possibly add a downloadData() method here
	// that downloads the data from github pages with superagent (http library that works in frontend and backend)


	static loadData(termDump) {
		if (!termDump.classMap || !termDump.sectionMap) {
			console.error('invalid termDump')
			return;
		}

		return new this(termDump)
	}


	// Right now only the class that is created and its prereqs are loaded. Need to add loading on demand later for times when you go prereq.prereq.prereq...
	// That is not needed for this project, however. 
	createClass(config) {
		var keys = Keys.createWithHash(config)
		if (!keys) {
			console.error('broooo')
		}
		var hash = keys.getHash()

		var serverData = this.termDump.classMap[hash];

		if (!serverData) {
			console.error('wtf')
			return;
		}

		var aClass = Class.create(serverData, this.termDump)

		return aClass
	}

}


// console.log(module.exports.default.loadData({}))