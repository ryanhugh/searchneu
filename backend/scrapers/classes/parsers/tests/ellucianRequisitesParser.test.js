/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import cheerio from 'cheerio';
import fs from 'fs-extra';

import ellucianRequisitesParser from '../ellucianRequisitesParser';


it('should load a bunch of string prereqs from many on linked.html', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', 'many non linked.html'), 'utf8');

  const $ = cheerio.load(body);

  // Get the root dom node.
  // Cheerio adds a "root" node on top of everything, so the element we are looking for is the root nodes first child.
  // In this case it is a table.
  const rootNode = $.root()[0].children;

  const url = 'http://test.hostname.com/PROD/';

  const prereqs = ellucianRequisitesParser.parseRequirementSection(url, rootNode, 'prerequisites');

  expect(prereqs).toMatchSnapshot();

  done();
});

it('should load coreqs on different lines as "and"', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', 'coreqs on diff lines.html'), 'utf8');

  const $ = cheerio.load(body);

  // Get the root dom node.
  // Cheerio adds a "root" node on top of everything, so the element we are looking for is the root nodes first child.
  // In this case it is a table.
  const rootNode = $.root()[0].children;

  const url = 'http://test.hostname.com/PROD/';

  const coreqs = ellucianRequisitesParser.parseRequirementSection(url, rootNode, 'corequisites');

  expect(coreqs).toMatchSnapshot();

  done();
});


it('should filter out prereqs that just say they are prereqs', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianSectionParser', 'blacklistedstring.html'), 'utf8');

  const $ = cheerio.load(body);

  // Get the root dom node.
  // Cheerio adds a "root" node on top of everything, so the element we are looking for is the root nodes first child.
  // In this case it is a table.
  const rootNode = $.root()[0].children;

  const url = 'http://test.hostname.com/PROD/';

  const prereqs = ellucianRequisitesParser.parseRequirementSection(url, rootNode, 'prerequisites');

  expect(prereqs).toMatchSnapshot();
  done();
});


// it('formatRequirements should work', function () {


//  expect(ellucianRequisitesParser.formatRequirements([
//    ["https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WELD&crse_in=1152&schd_in=%25", "or", "https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WLD&crse_in=152&schd_in=%25"], "or", ["https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WELD&crse_in=1152&schd_in=%25", "or", "https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WLD&crse_in=152&schd_in=%25"]
//  ])).toEqual({
//    "type": "or",
//    "values": [{
//      "type": "or",
//      "values": ["https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WELD&crse_in=1152&schd_in=%25", "https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WLD&crse_in=152&schd_in=%25"]
//    }, {
//      "type": "or",
//      "values": ["https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WELD&crse_in=1152&schd_in=%25", "https://www2.augustatech.edu/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201614&subj_in=WLD&crse_in=152&schd_in=%25"]
//    }]
//  });


// });

it('simplifyRequirements shoudl work', () => {
  expect(ellucianRequisitesParser.simplifyRequirements({
    type: 'or',
    values: [{
      type: 'or',
      values: ['1', {
        type: 'or',
        values: ['6'],
      }],
    }, {
      type: 'or',
      values: ['1', {
        type: 'or',
        values: [{
          type: 'or',
          values: ['1', {
            type: 'or',
            values: ['6'],
          }],
        }, {
          type: 'or',
          values: ['1', {
            type: 'or',
            values: ['6'],
          }],
        }],
      }],
    }],
  })).toEqual({
    type: 'or',
    values: ['1', '6', '1', '1', '6', '1', '6'],
  });
});


it('simplifyRequirements shoudl work', () => {
  expect(ellucianRequisitesParser.simplifyRequirements({
    type: 'and',
    values: [{
      type: 'or',
      values: [{
        subject: 'PHYS',
        classId: '1148',
      }, {
        subject: 'PHYS',
        classId: '1148',
      }],
    }],
  })).toEqual({
    type: 'or',
    values: [{
      subject: 'PHYS',
      classId: '1148',
    }, {
      subject: 'PHYS',
      classId: '1148',
    }],
  });
});


// it('groupRequirementsByAnd', function () {


//  expect(ellucianRequisitesParser.groupRequirementsByAnd(
//    ['https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1011&schd_in=%25',
//      'or',
//      'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCH&crse_in=101&schd_in=%25',
//      'and',
//      'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1012&schd_in=%25',
//      'or',
//      'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1012&schd_in=%25', 'or', 'link here'
//    ])).toEqual(

//    ['https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1011&schd_in=%25',
//      'or', ['https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCH&crse_in=101&schd_in=%25',
//        'and',
//        'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1012&schd_in=%25'
//      ],
//      'or',
//      'https://google.com/pls/ban8/bwckctlg.p_disp_listcrse?term_in=201516&subj_in=MCHT&crse_in=1012&schd_in=%25',
//      'or',
//      'link here'
//    ]);
// });


// it('removeBlacklistedStrings', function () {


//  expect(ellucianRequisitesParser.removeBlacklistedStrings({
//    type: 'and',
//    values: [
//      'hi', 'Pre-req for Math 015 1'
//    ]
//  })).toEqual({
//    type: 'and',
//    values: ['hi']
//  })

// });


it('works with double close paren ))', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianRequisitesParser', '1.html'), 'utf8');


  const $ = cheerio.load(body);

  // Get the root dom node.
  // Cheerio adds a "root" node on top of everything, so the element we are looking for is the root nodes first child.
  // In this case it is a table.
  const rootNode = $.root()[0].children;

  const url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201555&subj_code_in=PMC&crse_numb_in=6212';

  const prereqs = ellucianRequisitesParser.parseRequirementSection(url, rootNode[0].children, 'prerequisites');

  expect(prereqs).toMatchSnapshot();
  done();
});


// note that this site has a lot of options for classes to take under the catalog listing and then only 3 under the section page
it('works with a ton of ors 1', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianRequisitesParser', '2.html'), 'utf8');

  const url = 'https://myswat.swarthmore.edu/pls/bwckctlg.p_disp_course_detail?cat_term_in=201604&subj_code_in=MATH&crse_numb_in=033';

  const $ = cheerio.load(body);

  // Get the root dom node.
  // Cheerio adds a "root" node on top of everything, so the element we are looking for is the root nodes first child.
  // In this case it is a table.
  const rootNode = $.root()[0].children;

  const prereqs = ellucianRequisitesParser.parseRequirementSection(url, rootNode[0].children, 'prerequisites');

  expect(prereqs).toMatchSnapshot();
  done();
});

// it('removeBlacklistedStrings should work', function () {
//  var a = ellucianRequisitesParser.removeBlacklistedStrings({
//    values: ['Pre-req for Math 033 1', 'Pre-req for Math 025S 1', 'hi']
//  })
//  macros.log(a);


//  expect(a).toEqual({
//    values: ['hi']
//  })
// });


// note that this site has a lot of options for classes to take under the catalog listing and then only 3 under the section page
it('works with a ton of ors 2', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianRequisitesParser', 'coreqs on diff lines.html'), 'utf8');
  const url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201710&subj_code_in=PHYS&crse_numb_in=1161';

  const $ = cheerio.load(body);

  // Get the root dom node.
  // Cheerio adds a "root" node on top of everything, so the element we are looking for is the root nodes first child.
  // In this case it is a table.
  const rootNode = $.root()[0].children;

  const coreqs = ellucianRequisitesParser.parseRequirementSection(url, rootNode[0].children, 'corequisites');

  expect(coreqs).toMatchSnapshot();
  done();
});

// note that this site has a lot of options for classes to take under the catalog listing and then only 3 under the section page
it('3 levels', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianRequisitesParser', '3 levels.html'), 'utf8');

  const url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201660&subj_code_in=BIOE&crse_numb_in=5410';

  const $ = cheerio.load(body);

  // Get the root dom node.
  // Cheerio adds a "root" node on top of everything, so the element we are looking for is the root nodes first child.
  // In this case it is a table.
  const rootNode = $.root()[0].children;

  const prereqs = ellucianRequisitesParser.parseRequirementSection(url, rootNode, 'prerequisites');

  expect(prereqs).toMatchSnapshot();
  done();
});

// note that this site has a lot of options for classes to take under the catalog listing and then only 3 under the section page
it('missing and', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianRequisitesParser', 'missing and.html'), 'utf8');

  const url = 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201935&crn_in=81089';

  const $ = cheerio.load(body);

  const rootNode = $.root()[0].children;

  const prereqs = ellucianRequisitesParser.parseRequirementSection(url, rootNode, 'prerequisites');
  expect(prereqs).toMatchSnapshot();
  done();
});


// Unsure exacly how we should handle this case.
// it('mismatched_dividers', function (done) {

//  fs.readFile('backend/parsers/tests/data/ellucianRequisitesParser/mismatched_dividers.html', 'utf8', function (err, body) {
//    expect(err).toBe(null);

//    var url = 'https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_course_detail?cat_term_in=201605&subj_code_in=APPH&crse_numb_in=4238'

//    var pageData = PageData.create({
//      dbData: {
//        url: url
//      }
//    });

//    request.handleRequestResponce(body, function (err, dom) {
//      expect(err).toBe(null);

//      macros.log(dom)
//      debugger

//      var prereqs = ellucianRequisitesParser.parseRequirementSection(pageData, dom, 'prerequisites');
//      macros.log(prereqs);

//      expect(prereqs).toEqual(Object({
//        type: 'or',
//        values: [Object({
//          type: 'and',
//          values: [Object({
//            type: 'or',
//            values: [Object({
//              classId: '1115',
//              subject: 'BIOL'
//            }), Object({
//              classId: '1111',
//              subject: 'BIOL'
//            })]
//          }), Object({
//            classId: '1342',
//            subject: 'MATH'
//          }), Object({
//            classId: '2311',
//            subject: 'CHEM'
//          })]
//        }), 'Graduate Admission REQ']
//      }))
//      done()
//    })
//  });
// });
