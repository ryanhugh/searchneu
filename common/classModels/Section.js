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
var _ = require('lodash')
var moment = require('moment')


var Meeting = require('./Meeting')

function Section(config) {

	//loading status is done if any sign that has data
	if (config.dataStatus !== undefined) {
		this.dataStatus = config.dataStatus
	}
	else if (this.lastUpdateTime !== undefined || this.meetings) {
		this.dataStatus = macros.DATASTATUS_DONE
	}

	//seperate reasons to meet: eg Lecture or Lab.
	//each of these then has times, and days
	//instances of Meeting
	this.meetings = []
}


Section.requiredPath = ['host', 'termId', 'subject', 'classUid']
Section.optionalPath = ['crn']
Section.API_ENDPOINT = '/listSections'


Section.create = function (config) {
	var instance = new this(config);
	instance.updateWithData(config);
	return instance
}

Section.prototype.meetsOnWeekends = function () {

	for (var i = 0; i < this.meetings.length; i++) {
		var meeting = this.meetings[i];

		if (meeting.getMeetsOnWeekends()) {
			return true;
		};
	}
	return false;
}

Section.prototype.getAllMeetingMoments = function (ignoreExams = true) {

	var retVal = [];
	this.meetings.forEach(function (meeting) {
		if (ignoreExams && meeting.getIsExam()) {
			return;
		}

		retVal = retVal.concat(_.flatten(meeting.times));
	}.bind(this))

	retVal.sort(function (a, b) {
		if (a.start.unix() > b.start.unix()) {
			return 1;
		}
		else if (a.start.unix() < b.start.unix()) {
			return -1;
		}
		else {
			return 0;
		}
	}.bind(this))

	return retVal;
};

//returns [false,true,false,true,false,true,false] if meeting mon, wed, fri
Section.prototype.getWeekDaysAsBooleans = function () {

	var retVal = [false, false, false, false, false, false, false];


	this.getAllMeetingMoments().forEach(function (time) {
		retVal[time.start.day()] = true;
	}.bind(this))

	return retVal;
};

Section.prototype.getWeekDaysAsStringArray = function () {

	var retVal = [];

	this.getAllMeetingMoments().forEach(function (time) {
		var day = time.start.format('dddd');
		if (_(retVal).includes(day)) {
			return;
		}
		retVal.push(day);
	}.bind(this))

	return retVal;
};

//returns true if has exam, else false
Section.prototype.getHasExam = function () {
	for (var i = 0; i < this.meetings.length; i++) {
		if (this.meetings[i].getIsExam()) {
			return true;
		}
	}
	return false;
};

//returns the {start:end:} moment object of the first exam found
//else returns null
Section.prototype.getExamMeeting = function () {
	for (var i = 0; i < this.meetings.length; i++) {
		var meeting = this.meetings[i]
		if (meeting.getIsExam()) {
			if (meeting.times.length > 0) {
				return meeting;
			};
		};
	};
	return null;
};

// Unique list of all professors in all meetings, sorted alphabetically
Section.prototype.getProfs = function () {
	var retVal = [];
	this.meetings.forEach(function (meeting) {
		meeting.profs.forEach(function (prof) {
			if (!_(retVal).includes(prof)) {
				retVal.push(prof);
			};
		}.bind(this))
	}.bind(this))

	retVal.sort();

	return retVal;
};

Section.prototype.getLocations = function (ignoreExams) {
	if (ignoreExams === undefined) {
		ignoreExams = true;
	};

	var retVal = [];
	this.meetings.forEach(function (meeting) {
		if (ignoreExams && meeting.getIsExam()) {
			return;
		};

		var where = meeting.where;
		if (!_(retVal).includes(where)) {
			retVal.push(where);
		};
	}.bind(this))

	// If it is at least 1 long with TBAs remove, return the array without any TBAs
	var noTBAs = _.pull(retVal.slice(0), 'TBA');
	if (noTBAs.length > 0) {
		return noTBAs
	}
	else {
		return retVal;
	}
};

Section.prototype.getUniqueStartTimes = function (ignoreExams) {
	if (ignoreExams === undefined) {
		ignoreExams = true;
	};

	var retVal = [];

	this.getAllMeetingMoments(ignoreExams).forEach(function (time) {
		var string = time.start.format('h:mm a');
		if (!_(retVal).includes(string)) {
			retVal.push(string)
		};
	}.bind(this))

	return retVal;
};

Section.prototype.getUniqueEndTimes = function (ignoreExams) {
	if (ignoreExams === undefined) {
		ignoreExams = true;
	};

	var retVal = [];

	this.getAllMeetingMoments(ignoreExams).forEach(function (time) {
		var string = time.end.format('h:mm a');
		if (!_(retVal).includes(string)) {
			retVal.push(string)
		};
	}.bind(this))

	return retVal;
};

Section.prototype.getHasWaitList = function () {
	if (this.waitCapacity > 0 || this.waitRemaining > 0) {
		return true;
	}
	else {
		return false;
	}
}


Section.prototype.updateWithData = function (data) {
	for (var attrName in data) {
		if ((typeof data[attrName]) == 'function') {
			elog('given fn??', data, this, this.constructor.name);
			continue;
		}
		this[attrName] = data[attrName]
	}

	if (data.meetings) {
		var newMeetings = []

		data.meetings.forEach(function (serverData) {
			newMeetings.push(new Meeting(serverData))
		}.bind(this))

		this.meetings = newMeetings;
	}

};


Section.prototype.compareTo = function (other) {

	if (this.online && !other.online) {
		return 1;
	}
	if (other.online && !this.online) {
		return -1;
	}

	if (this.meetings.length == 0 && other.meetings.length === 0) {
		return 0;
	}
	if (this.meetings.length > 0 && other.meetings.length == 0) {
		return -1
	}
	else if (this.meetings.length === 0 && other.meetings.length > 0) {
		return 1
	}

	// If both sections have meetings, then sort alphabetically by professor.
	const thisProfs = this.getProfs()
	const otherProfs = other.getProfs()
	const thisOnlyTBA = thisProfs.length === 1 && thisProfs[0] === 'TBA';
	const otherOnlyTBA = otherProfs.length === 1 && otherProfs[0] === 'TBA';

	if (thisProfs.length > 0 || otherProfs.length > 0) {

		if (thisProfs.length === 0) {
			return -1;
		}
		if (otherProfs.length === 0) {
			return 1
		}

		if (thisOnlyTBA && !otherOnlyTBA) {
			return 1;
		}
		if (!thisOnlyTBA && otherOnlyTBA) {
			return -1;
		}

		if (thisProfs[0] > otherProfs[0]) {
			return 1;
		}
		if (otherProfs[0] > thisProfs[0]) {
			return -1;
		}
	}

	// Then, sort by the starting time of the section.
	if (this.meetings[0].times.length === 0) {
		return 1;
	}
	if (other.meetings[0].times.length === 0) {
		return -1;
	}
	if (this.meetings[0].times[0][0].start.unix() < other.meetings[0].times[0][0].start.unix()) {
		return -1;
	}
	if (this.meetings[0].times[0][0].start.unix() > other.meetings[0].times[0][0].start.unix()) {
		return 1;
	}
	else {
		return 0;
	}
};



module.exports = Section;
