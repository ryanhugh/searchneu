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
var macros = require('../macros')
var classesDB = require('../databases/classesDB')
var BaseProcessor = require('./baseProcessor').BaseProcessor
var queue = require('d3-queue').queue


// This find classes that are called "lab for " and "recitation for " and "Interactive Learning Seminar for PHYS 1155" 
// that don't have coreqs and marks them as having coreqs
// as of july 2016 there are abou 52 classes in each term in neu that this finds, and 0 at swarthmore
// 
// ALSO: make sure to remove any classes added to coreqs from prereqs. ENVR 1201 (lab for 1200) has 1200 as a prereq

function FindMissingLabs() {
	BaseProcessor.prototype.constructor.apply(this, arguments);
}


FindMissingLabs.prototype = Object.create(BaseProcessor.prototype);
FindMissingLabs.prototype.constructor = FindMissingLabs;



var count = 0;


FindMissingLabs.prototype.go = function(query, callback) {
	this.getClassHash(query, function (err, keyToRow) {

		for (var key in keyToRow) {
			var aClass = keyToRow[key]

			var name = aClass.name

			var match = name.match(/\s+for\s+([A-Z\d]+|[A-Z\d&]{2,})\s+([A-Z\d&]+)/g);
			if (match) {

				var coreqsArray = [];
				if (aClass.coreqs) {
					coreqsArray = aClass.coreqs.values
				}
				if (coreqsArray.length > 0) {
					continue;
				}

				console.warn(match,name,coreqsArray.length,aClass.desc)
			}

		}
		// console.log('done');
		return callback()
		
	}.bind(this))
};






FindMissingLabs.prototype.FindMissingLabs = FindMissingLabs;
module.exports = new FindMissingLabs();


if (require.main === module) {
	module.exports.go({host:'neu.edu',termId:"201630"},function (err, results) {
		




	}.bind(this))
}