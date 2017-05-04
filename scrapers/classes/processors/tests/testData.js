import fs from 'fs-promise';
import path from 'path';

// This file loads the test data from disk once, and then clones it in RAM for each test

const filePromise = fs.readFile(path.join(__dirname, 'data', 'termDump.json'));

exports.loadTermDump = async function loadTermDump() {
	
	var string = await filePromise
	return JSON.parse(string);
}