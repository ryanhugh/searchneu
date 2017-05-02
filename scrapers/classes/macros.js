/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>. 
 */

'use strict';
var fs = require('fs')



function Macros() {



	//change the current working directory to the directory with package.json
	//gulp does this automatically too, but it is not ran on 'node file.js'
	while (1) {
		try {
			fs.statSync('.git');
		}
		catch (e) {

			//cd .. until in the same dir as package.json, the root of the project
			process.chdir('..');
			continue;
		}
		break;
	}



	// set up elog
	global.elogWithoutStack = function () {
		console.log.apply(console, arguments)
	}.bind(this)

	global.elog = function () {
		console.log.apply(console, arguments)
		console.log(new Error('elog Trace').stack)
	}.bind(this)




	// Set up macros.PRODUCTION, macros.DEVELOPMENT, etc
	var mode;
	process.argv.slice(2).forEach(function (command) {
		if (!mode) {
			mode = command;
			return;
		}

		if (command.startsWith('-')) {
			return;
		}

		else if (_(mode).endsWith('test') && _(command).endsWith('test')) {
			return;
		}
		else {
			// cannot be both macros.PRODUCTION and macros.DEVELOPMENT, etc
			// run in mutltiple terminals (separate gulp processes) for this to work
			console.log(mode, command);
			elog('Cannot run multiple commands at the same time, cant be both macros.DEVELOPMENT and macros.UNIT_TESTS, etc!!!!')
			process.exit()
		}

	}.bind(this))

	//there are three modes this can be ran in
	//prod (macros.PRODUCTION and db = coursepro_prod) gulp prod
	//dev (macros.DEVELOPMENT and db = coursepro_dev) gulp dev and gulp spider
	//UNIT_TESTS (macros.UNIT_TESTS and db = coursepro_tests) gulp tests and node file.js
	if (process.title == 'gulp') {
		var command = process.argv[2];


		if (command === 'prod') {
			this.PRODUCTION = true;
		}
		else if (command === 'dev' || command === 'spider') {
			this.DEVELOPMENT = true;
			if (command == 'spider') {
				this.SPIDER = true;
			}
		}
		else if (command.includes('test') && command != 'testAllGraphs') {
			this.UNIT_TESTS = true;
		}
		else {
			console.log('WARNING Unknown GULP mode ', command, process.argv)
			console.log('this is from b macros.js')
			console.log('setting to DEVELOPMENT mode!')
			this.DEVELOPMENT = true;
		}
	}
	else {
		console.log("Not running from gulp, setting to dev mode")
		this.DEVELOPMENT = true;
	}


	//Set all the stuff that wasen't set to false
	if (this.PRODUCTION === undefined) {
		this.PRODUCTION = false
	}
	if (this.DEVELOPMENT === undefined) {
		this.DEVELOPMENT = false
	}
	if (this.SPIDER === undefined) {
		this.SPIDER = false
	}
	if (this.UNIT_TESTS === undefined) {
		this.UNIT_TESTS = false;
	}






	//setup database ip and mongo db name
	var databaseIp = '52.1.52.224'


	var databaseName = null;

	if (this.PRODUCTION) {
		databaseName = 'coursepro_prod'
	}
	else if (this.DEVELOPMENT) {
		databaseName = 'coursepro_dev'
	}
	else if (this.UNIT_TESTS) {
		databaseName = 'coursepro_tests'
		databaseName = 'coursepro_dev'
	}

	this.DATABASE_URL = databaseIp + '/' + databaseName;





	//if a page data is newer that this, there is a cache hit 
	//ms
	// this.OLD_PAGEDATA = 300000
	this.OLD_PAGEDATA = 1500


	//enable or disable sending emails
	//by default, only send if in PRODUCTION
	if (this.PRODUCTION) {
		this.SEND_EMAILS = true;
		this.QUIET_LOGGING = true;

		//so express dosent spit out trace backs to the user
		process.env.NODE_ENV = 'production';
	}
	else {
		this.SEND_EMAILS = false
		this.QUIET_LOGGING = false;
	}

	// don't spit out a lot of stuff in normal mode
	if (this.SPIDER) {
		this.QUIET_LOGGING = false;
	}
	else {
		this.QUIET_LOGGING = true;

	}



	// this.SEND_EMAILS = true;



	this.VERBOSE = false;

	if (this.PRODUCTION) {
		this.HTTP_PORT = 80;
		this.HTTPS_PORT = 443;
		this.START_HTTPS_SERVER = true;
	}
	else {
		// constants stored in user_config.js
		var userConfig = {}
		try {
			userConfig = require('/etc/coursepro/user_config');
		}
		catch (e) {

		}

		if (userConfig.http_dev_server_port) {
			this.HTTP_PORT = userConfig.http_dev_server_port
		}
		else {
			this.HTTP_PORT = 8080;	
		}

		if (userConfig.https_dev_server_port) {
			this.HTTPS_PORT = userConfig.https_dev_server_port
		}
		else {
			this.HTTPS_PORT = 8081;	
		}

		if (userConfig.start_https_server_in_dev !== undefined) {
			this.START_HTTPS_SERVER = userConfig.start_https_server_in_dev
		}
		else {
			this.START_HTTPS_SERVER = true;
		}
		
	}
}

Macros.prototype.inherent = function(Baseclass, Subclass) {

	//copy static methods
	for (var attrName in Baseclass) {
		Subclass[attrName] = Baseclass[attrName]
	}

	//prototype constructor
	Subclass.prototype = Object.create(Baseclass.prototype);
	Subclass.prototype.constructor = Subclass;
};


module.exports = new Macros();