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
var queue = require('d3-queue').queue
var mkdirp = require('mkdirp');
var fs = require('fs')
var elasticlunr = require('elasticlunr');
var path = require('path')

var macros = require('../macros')
var BaseProcessor = require('./baseProcessor').BaseProcessor;
var classesDB = require('../databases/classesDB');
var sectionsDB = require('../databases/sectionsDB');
var Keys = require('../../common/Keys')



function CreateSearchIndex() {
	BaseProcessor.prototype.constructor.apply(this, arguments);

	this.dumpEndpoints = [macros.GET_SEARCH_INDEX];
}


CreateSearchIndex.prototype = Object.create(BaseProcessor.prototype);
CreateSearchIndex.prototype.constructor = CreateSearchIndex;


CreateSearchIndex.prototype.go = function (queries, callback) {
	if (!this.isUpdatingEntireTerm(queries)) {
		return callback()
	}

	var errorCount = 0;

	this.getClassesAndSections(queries, function (err, classes, sections) {
		if (err) {
			return callback(err)
		}

		var classLists = {};

		classes.forEach(function (aClass) {

			var termHash = Keys.create({
				host: aClass.host,
				termId: aClass.termId
			}).getHash()

			var classHash = Keys.create(aClass).getHash()

			if (!classLists[termHash]) {
				classLists[termHash] = {
					classHash: {},
					host: aClass.host,
					termId: aClass.termId
				}
			}

			classLists[termHash].classHash[classHash] = {
				class: aClass,
				sections: []
			}
		}.bind(this));


		sections.forEach(function (section) {

			var termHash = Keys.create({
				host: section.host,
				termId: section.termId
			}).getHash()

			var classHash = Keys.create({
				host: section.host,
				termId: section.termId,
				subject: section.subject,
				classUid: section.classUid,
			}).getHash()


			if (!classLists[termHash]) {
				// The objects should all have been created when looping over the classes. 
				elog('dont have obj in section for loop?', termHash, classHash, section)
				errorCount++;
				return;
			}

			if (!classLists[termHash].classHash[classHash]) {
				elog('no class exists with same data?', classHash, section.url)
				errorCount++;
				return;
			}

			classLists[termHash].classHash[classHash].sections.push(section)
		}.bind(this))


		var q = queue(1);

		for (var attrName in classLists) {
			q.defer(function (attrName, callback) {

				var termData = classLists[attrName]
				var keys = Keys.create(termData)

				var index = elasticlunr();

				index.saveDocument(false)

				index.setRef('key');
				index.addField('desc');
				index.addField('name');
				index.addField('classId');
				index.addField('subject');
				index.addField('profs');
				index.addField('locations');
				index.addField('crns')

				for (var attrName2 in termData.classHash) {
					var searchResultData = termData.classHash[attrName2];

					var toIndex = {
						classId: searchResultData.class.classId,
						desc: searchResultData.class.desc,
						subject: searchResultData.class.subject,
						name: searchResultData.class.name,
						key: Keys.create(searchResultData.class).getHash(),
					}

					var profs = [];
					var locations = [];
					searchResultData.sections.forEach(function (section) {
						if (section.meetings) {
							section.meetings.forEach(function (meeting) {
								if (meeting.profs) {
									profs = profs.concat(meeting.profs)
								}
								if (meeting.where) {
									locations.push(meeting.where)
								}
							}.bind(this))
						}
					}.bind(this))


					toIndex.profs = profs.join(' ')
					toIndex.locations = locations.join(' ')
					if (searchResultData.class.crns) {
						toIndex.crns = searchResultData.class.crns.join(' ')
					}
					index.addDoc(toIndex)
				}

				var searchIndexString = JSON.stringify(index.toJSON());

				var fileName = path.join('.', 'dist', keys.getHashWithEndpoint(macros.GET_SEARCH_INDEX));
				var folderName = path.dirname(fileName);

				mkdirp(folderName, function (err) {
					if (err) {
						return callback(err);
					}

					fs.writeFile(fileName, searchIndexString, function (err) {
						if (err) {
							return callback(err);
						}

						console.log("Successfully saved", fileName, 'errorCount:', errorCount);

						classLists[attrName] = null

						return callback()
					}.bind(this));
				}.bind(this));
			}.bind(this, attrName))
		}

		q.awaitAll(function (err) {
			callback(err)
		}.bind(this))
	}.bind(this))
};

CreateSearchIndex.prototype.CreateSearchIndex = CreateSearchIndex;
module.exports = new CreateSearchIndex();

if (require.main === module) {
	module.exports.go([{
		// host: 'neu.edu',
		// termId: "201710"
	}], function (err, results) {
		console.log(err, results);

	}.bind(this));

	// module.exports.go({
	// 	host: 'swarthmore.edu'
	// }, function (err, results) {
	// 	console.log(err, results);

	// }.bind(this));
}
