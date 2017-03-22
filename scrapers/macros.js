import path from 'path'

exports.PUBLIC_DIR = path.join('..', 'data')
exports.DEV_DATA_DIR = path.join('..', 'dev_data_dir')

// For iterating over every letter in a couple different places in the code
exports.ALPHABET = 'qwertyuiopasdfghjklzxcvbnm';

// whether the scrapers are running in prod mode or not. 
// When in dev mode, each file will save its outputs to a file
// so can run the step after it without scraping each time
exports.PROD = !!process.env.PROD
exports.DEV = !exports.PROD