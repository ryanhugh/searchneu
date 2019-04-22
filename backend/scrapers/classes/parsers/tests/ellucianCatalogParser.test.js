/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import URI from 'urijs';
import fs from 'fs-extra';

import ellucianCatalogParser from '../ellucianCatalogParser';


it('parse DESCRIPTION', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianCatalogParser', '5.html'), 'utf8');

  const url = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201610&subj_code_in=MATH&crse_numb_in=2331';

  const classURL = 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=MATH&crse_in=2331&schd_in=%25';

  expect(true).toBe(ellucianCatalogParser.supportsPage(url));

  const catalogParsed = ellucianCatalogParser.parse(body, url);

  expect(catalogParsed.desc).toBe('Uses the Gauss-Jordan elimination algorithm to analyze and find bases for subspaces such as the image and kernel of a linear transformation. Covers the geometry of linear transformations: orthogonality, the Gram-Schmidt process, rotation matrices, and least squares fit. Examines diagonalization and similarity, and the spectral theorem and the singular value decomposition. Is primarily for math and science majors; applications are drawn from many technical fields. Computation is aided by the use of software such as Maple or MATLAB, and graphing calculators. Prereq. MATH 1242, MATH 1252, MATH 1342, or CS 2800. 4.000 Lecture hours');
  expect(catalogParsed.classId).toBe('2331');
  expect(new URI(catalogParsed.url).equals(new URI(classURL))).toBe(true);
  expect(catalogParsed.classAttributes).toEqual(['NU Core Math/Anly Think Lvl 2', 'UG College of Science']);
  done();
});


// it('can add to existing dep', async function(done) {

//  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianCatalogParser', '1.html'), 'utf8');

//  const url = 'https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_disp_course_detail?cat_term_in=201503&subj_code_in=AIRF&crse_numb_in=522';

//  const classURL = "https://ssb.ccsu.edu/pls/ssb_cPROD/bwckctlg.p_disp_listcrse?term_in=201503&subj_in=AIRF&crse_in=522&schd_in=%25";

//  expect(true).toBe(ellucianCatalogParser.supportsPage(url));

//  const catalogParsed = ellucianCatalogParser.parse(body, url);


//  expect(catalogParsed.desc).toBe("Topics in Poetry and Prosody Irregular Prereqs.: None Detailed and systematic study of poetic form, including versification, rhetorical tropes, diction, and tone. May be organized by period, subject matter, genre, or critical method. May be repeated with different topics for up to 6 credits. 3.000 Lecture hours", catalogParsed.desc);
//  expect(catalogParsed.url).toBe(classURL);
//  expect(new URI(catalogParsed.url).equals(new URI(classURL))).toBe(true)
//  expect(catalogParsed.classId).toBe("522");
//  expect(catalogParsed.prettyUrl).toBe(url);
//  expect(new URI(catalogParsed.prettyUrl).equals(new URI(url))).toBe(true);
//  done()

// });


// it('can parse desc', async function(done) {

//  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianCatalogParser', '2.html'), 'utf8');

//  const url = 'https://bannerweb.upstate.edu/isis/bwckctlg.p_disp_course_detail?cat_term_in=201580&subj_code_in=MDCN&crse_numb_in=2064';

//  const classURL = "https://bannerweb.upstate.edu/isis/bwckctlg.p_disp_listcrse?term_in=201580&subj_in=MDCN&crse_in=2064&schd_in=%25";

//  expect(true).toBe(ellucianCatalogParser.supportsPage(url));

//  const catalogParsed = ellucianCatalogParser.parse(body, url);

//  expect(catalogParsed.desc).toBe('ELECTIVE DESCRIPTION: Physical exams are provided to newly resettled refugees by care teams comprised of students, residents, and faculty physicians. For many refugees, the care is their first encounter with mainstream medicine. MS-2 coordinators manage clinic operations while MS 1-4 volunteers provide the care service and gain experience in physical exam skills and cross-cultural communication. 0.000 Lab hours');
//  expect(catalogParsed.classId).toBe("2064");

//  expect(new URI(catalogParsed.url).equals(new URI('https://bannerweb.upstate.edu/isis/bwckctlg.p_disp_listcrse?term_in=201580&subj_in=MDCN&crse_in=2064&schd_in=%25'))).toBe(true);
//  done()

// });

// it('should behave...', async function(done) {


//  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianCatalogParser', '3.html'), 'utf8');

//  const url = 'https://genisys.regent.edu/pls/prod/bwckctlg.p_disp_course_detail?cat_term_in=201610&subj_code_in=COM&crse_numb_in=507';

//  const classURL = "https://genisys.regent.edu/pls/prod/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=COM&crse_in=507&schd_in=%25";


//  expect(true, ellucianCatalogParser.supportsPage(url));


//  console.log(body, url)
//  const catalogParsed = ellucianCatalogParser.parse(body, url);

//  expect(catalogParsed.desc).toBe('Current internet, social media, and mobile media marketing theories , strategies, tools and practices. Includes study of communication methods used by professionals in journalism, film, television, advertising, public relations, and related professions to brand, promote, and distribute products and services. Web-based production lab included. Cross-listed with JRN 507.')
//  expect(catalogParsed.classId).toBe('507');
//  expect(new URI(catalogParsed.url).equals(new URI(classURL)).toBe(true));
//  done()
// });
