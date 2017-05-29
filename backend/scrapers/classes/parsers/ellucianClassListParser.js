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

var _ = require('lodash');
var he = require('he');
var fs = require('fs');
var URI = require('urijs');

var EllucianBaseParser = require('./ellucianBaseParser').EllucianBaseParser;
var ellucianCatalogParser = require('./ellucianCatalogParser');


function EllucianClassListParser() {
	EllucianBaseParser.prototype.constructor.apply(this, arguments);
	this.name = "EllucianClassListParser"
	this.requiredAttrs = [];
}


//prototype constructor
EllucianClassListParser.prototype = Object.create(EllucianBaseParser.prototype);
EllucianClassListParser.prototype.constructor = EllucianClassListParser;



EllucianClassListParser.prototype.supportsPage = function (url) {
	return url.indexOf('bwckctlg.p_display_courses') > -1;
}

EllucianClassListParser.prototype.getDatabase = function (pageData) {
	return null;
};


EllucianClassListParser.prototype.parseElement = function (pageData, element) {
	if (!pageData.dbData.termId) {
		console.log('error!!! in EllucianClassListParser but dont have a terid', pageData)
		return;
	};

	if (element.type != 'tag') {
		return;
	}

	if (element.name == 'a' && element.attribs.href) {
		var url = he.decode(element.attribs.href);


		var baseURL = this.getBaseURL(pageData.dbData.url);
		if (!baseURL) {
			console.log('could not find base url', pageData.dbData.url)
			return
		};

		if (url.startsWith('javascript') || url.startsWith('mailto')) {
			return;
		};

		url = new URI(url).absoluteTo(baseURL).toString()
		if (!url) {
			console.log('unable to find url for ', element)
			return
		};

		if (ellucianCatalogParser.supportsPage(url)) {

			var dep = pageData.addDep({
				url: url
			})
			dep.setParser(ellucianCatalogParser)
		};
	}
};



EllucianClassListParser.prototype.EllucianClassListParser = EllucianClassListParser;
module.exports = new EllucianClassListParser();

if (require.main === module) {
	module.exports.tests();
}
