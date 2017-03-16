import combineCCISandEmployees from './combineCCISandEmployees'
import courseproData from './courseproData'
import neuClubs from './neuClubs'



if (process.env.TRAVIS_EVENT_TYPE != 'cron' && process.env.TRAVIS) {
	console.log('not running on travis event', process.env.TRAVIS_EVENT_TYPE)
	process.exit(0);
}


async function main() {
	
	var promises = [combineCCISandEmployees(), courseproData(), neuClubs()]

	await Promise.all(promises)
	console.log('done')
}


main()