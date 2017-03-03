import neuEmployees from './neuEmployees'
import courseproData from './courseproData'



if (process.env.TRAVIS_EVENT_TYPE != 'cron' && process.env.TRAVIS) {
	console.log('not running on travis event', process.env.TRAVIS_EVENT_TYPE)
	process.exit(0);
}


