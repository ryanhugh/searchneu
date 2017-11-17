/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import collegeNamesParser from '../collegeNamesParser';

it('standardizeNames', () => {
  expect(collegeNamesParser.standardizeNames([], [], 'Texas A&M University - Texarkana')).toBe('Texas A&M University - Texarkana');
});


describe('the retry is called in mock whois', () => {
  // Would use jasmine.clock, but it dosen't work with async.retry
  const originalSetTimeout = setTimeout;
  beforeEach(() => {
    global.setTimeout = function mockSetTimeout(func) {
      originalSetTimeout(func, 0);
    };
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
  });


  it('hit neu whois', async (done) => {
    const title = await collegeNamesParser.getTitle('neu.edu');
    expect(title).toBe('Northeastern University');
    done();
  });
});


// could add more tests for the other stuff too


//  collegeNamesParser.getTitle('https://wl11gp.neu.edu/udcprod8/twbkwbis.P_GenMenu?name=bmenu.P_MainMnu&msg=WELCOME+Welcome,+Ryan+Hughes,+to+the+WWW+Information+System!Jul+11,+201503%3A33+pm',function (err,title) {
//  collegeNamesParser.getTitle('https://eagles.tamut.edu/texp/bwckschd.p_disp_dyn_sched',function (err,title) {
//  collegeNamesParser.getTitle('https://ssb.cc.binghamton.edu/banner/bwckschd.p_disp_dyn_sched',function (err,title) {
// collegeNamesParser.getAll(function (stuff) {
//  console.log(stuff)
// })
// return;
// collegeNamesParser.hitPage('neu.edu',function (err,title) {
//  console.log(err,title)
// })

// return;


// //collegeNamesParser reads from the file and gets all the names
// fs.readFile('../tests/differentCollegeUrls.json','utf8',function (err,body) {

//  JSON.parse(body).forEach(function(url){

//    collegeNamesParser.getTitle(url,function (err,title) {
//      if  (err) {
//        console.log('TEST: ',err,title,url);
//      }
//      else {
//        console.log('GOOD:',title,url);
//      }


//    }.bind(collegeNamesParser));
//  }.bind(collegeNamesParser));
// }.bind(collegeNamesParser));


//
