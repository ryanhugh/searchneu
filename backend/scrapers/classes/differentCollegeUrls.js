/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// How to find more sites.
// To find a specific college's site, the best way is probably use Google
// Just google search for ["Dynamic Schedule" site:neu.edu] or ["ellucian" site:neu.edu] and it will likely come up
// but not allways.

// Other way that is scalable is to rdns their main hostname (neu.edu -> 155.33.17.68)
// Then do a whois lookup on that ip (whois 155.33.17.68) to get the netrange (155.33.0.0/16)
// all of these IP addresses are owned by NEU
// Then scan all of them for any server that has port 443 open
// and check to see if it the server running the registration system
// can check for link to https://<ip here>/css/web_defaultapp.css
// which is the same for all the links
// Two ways to rdns: actual rdns, and then look at the https cert for the url it presented.
// Was able to go from dccc.edu to their site with this method. Will take longer for bigger schools.


// At one point there was a couple problems with hitting https sites on port other than 443, but I think the problem was something that
// all the sites had and not related to what the port number was. idk. Could make http requests to those sites from python and the browser and curl, but not node.

// Some other ways to find subdomains:
// Wolfram alpha, but idk if they have an free API and it is not a full list, idk where they are getting the data from
// https://github.com/faizann24/XssPy
//     Havent looked into this much.
//     They mentioned that they have some way of getting subdomains though. Looks like it just spiders the site, which can totally work.
//     Some sites have robots.txt set to deny so Google and Bing do not spider it.

// The spiders were re-written over the summer of 2017 and MongoDB is no longer involved. Any scraping should Summer 2017 now be at least 4x faster!

module.exports = ['https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_dyn_sched', //works
  'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_dyn_sched', //works
  'https://sisssb.clemson.edu/sisbnprd/bwckschd.p_disp_dyn_sched', //works
  'https://ssb.ccsu.edu/pls/ssb_cPROD/bwckschd.p_disp_dyn_sched', //works
  'https://ssb.cc.binghamton.edu/banner/bwckschd.p_disp_dyn_sched', //this one dosen't have this url (scroll right), figure out which parser needs this and if it would be a easy fix or naw https://ssb.cc.binghamton.edu/banner/bwckctlg.p_disp_listcrse?term_in=201510&subj_in=MDVL&crse_in=561B&schd_in=%25
  'https://tturedss1.tntech.edu/pls/PROD/bwckschd.p_disp_dyn_sched', //ran with bingham, and only got 1 term and 0 subjects... idk. will finish quick if ran again probably. Ran again in Aug 2016 and it looks like the term farthest in the future is added, but dosen't have any subjects. Other terms are valid.
  'https://prd-wlssb.temple.edu/prod8/bwckschd.p_disp_dyn_sched', //takes 3 hours and prereqs are not parsed correctly, but everything else works
  'https://bannerweb.upstate.edu/isis/bwckschd.p_disp_dyn_sched', //works
  'https://ssb.banner.usu.edu/zprod/bwckschd.p_disp_dyn_sched', //works
  'https://ssbprod11g.uncfsu.edu/pls/FSUPROD/bwckschd.p_disp_dyn_sched', // down atm?? down march 10, 2016. ports 80 and 443 closed, others filtered. looks like firewall still up but app down.
  'https://banner.uregina.ca/prod/sct/bwckschd.p_disp_dyn_sched', //takes 3 hours, works
  'https://banners.presby.edu/prod/bwckschd.p_disp_dyn_sched', // takes like 22 min, works
  'https://eagles.tamut.edu/texp/bwckschd.p_disp_dyn_sched', // collegeName capilization bug (fixed) and one subject dosent have any results, but works
  'https://ssb.sju.edu/pls/PRODSSB/bwckschd.p_disp_dyn_sched', //works
  'https://sail.oakland.edu/PROD/bwckschd.p_disp_dyn_sched', //works, takes 3 hours
  'https://genisys.regent.edu/pls/prod/bwckschd.p_disp_dyn_sched', //Error: Two urls found in one string? Feb 13, 2018
  'https://bappas2.gram.edu:9000/pls/gram/bwckschd.p_disp_dyn_sched', //dosent work in nodejs!!!!??? works in python, browser, etc
  'https://sail.oakland.edu/PROD/bwckschd.p_disp_dyn_sched', // works 8/31/16, some minor errors in trello spider but nothing major
  'https://banweb.wm.edu/pls/PROD/bwckschd.p_disp_dyn_sched', // thier site worked on 8/31/16, but need to update spider code before can use (fatal errors)
  'https://prod-ssb-01.dccc.edu/PROD/bwckschd.p_disp_dyn_sched', //worked in like dec 2015 and limited rate to about 100 connections at once.
  'https://selfservice.mypurdue.purdue.edu/prod/bwckschd.p_disp_dyn_sched', // i think i fixed the bug. need to test again. 8/31/16
  'https://xbss-prod.lasalle.edu/PROD/bwckschd.p_disp_dyn_sched', // works 8/31/16
  'https://myswat.swarthmore.edu/pls/bwckschd.p_disp_dyn_sched', //works
  'https://lewisweb.cc.lehigh.edu/PROD/bwckschd.p_disp_dyn_sched', //works 8/31/16, there are 3 classes that the prereq parser cant get because they have messed up parens.
  'https://myweb.du.edu/mdb/bwckschd.p_disp_dyn_sched', // 8/31/16 uhhhhhhhh not really sure, it was working and then i mucked with mongodb indexes and it stopped. have mucked with indexes during spidering before so it might be something on the site that caused the code to stop. need to retry.
  'https://ssbprod.rcgc.edu:9000/prod_ssb/bwckschd.p_disp_dyn_sched', // school aparently changed their hostname, it was gcc-ssbprod.gccnj.edu and now for the old domain dns fails now, wayback machine has it working in 2015: https://web.archive.org/web/20150316171359/https://gcc-ssbprod.gccnj.edu:9000/prod_ssb/bwckschd.p_disp_dyn_sched
  'https://pssb.stockton.edu/prod/bwckschd.p_disp_dyn_sched', //was port 9000, now is 443
  'https://www8.unm.edu/pls/banp/bwckschd.p_disp_dyn_sched', // took about 3 hours but it worked without any errors. 8/31/16
  'https://banssbprod.xavier.edu:8099/PROD/bwckschd.p_disp_dyn_sched', // works 9/1/16 took about 40 min
  'https://appprod.udayton.edu:9000/prod/bwckschd.p_disp_dyn_sched', // worked 9/1/16, 4 prereq parsing issues but besides that worked perfectly.
  'https://ui2web4.apps.uillinois.edu/BANPROD4/bwckschd.p_disp_dyn_sched', // worked 9/2/16 no errors
  'https://lpar2.jsu.edu/DADNormalPRO8/bwckschd.p_disp_dyn_sched', //  worked 9/2/16 no errors
  'https://ssb.isu.edu/bprod/bwckschd.p_disp_dyn_sched', //  worked 9/2/16 no errors
  'https://ssb.columbiastate.edu/PROD/bwckschd.p_disp_dyn_sched', // worked dec 27th, 2016
  'https://selfservice.brown.edu/ss/bwckschd.p_disp_dyn_sched', // uses 12GB RAM, works. Dec 28th.  Dec mongo inserting errors on 9/2/16, need to try again.
  'https://ssbprod.wichita.edu/PROD/bwckschd.p_disp_dyn_sched', // works Jan 17th, 2018. Bunch of prereq errors and online classes have location set to ONLINE (parsing needs to be updated to support)
  'https://prodssb.mscc.edu/PROD/bwckschd.p_disp_dyn_sched', // works. very fast. Jan 17th 2018
  'https://ssbprod11g.uncfsu.edu/pls/FSUPROD/bwckschd.p_disp_dyn_sched', // down. Jan 17th 2018
  'https://banner4.utm.edu/prod/bwckschd.p_disp_dyn_sched', // 479.29s. Feb 7th 2018. Some prereq discrepancies.
  'https://nssb-p.adm.fit.edu/prod/bwckschd.p_disp_dyn_sched', // ~400s Feb 7th 2018.
  'https://prodssb.ws.edu/pls/PROD/bwckschd.p_disp_dyn_sched', // ~1600s Feb 7th 2018.
  'https://oasis.farmingdale.edu/banner/bwckschd.p_disp_dyn_sched', // some mismatched types. 483s. Feb 7th 2018
  'https://oxford.blinn.edu:9010/PROD/bwckschd.p_disp_dyn_sched', // worked 394.84s. Feb 7th 2018 tons of warnings like this: Warning: changing from  Band Hall                      160 to Band Hall 160 at https://oxford.blinn.edu:9010/PROD/bwckctlg.p_disp_listcrse?term_in=201820&subj_in=MUEN&crse_in=2136&schd_in=%
  'https://ssb.ship.edu/prod/bwckschd.p_disp_dyn_sched', //Error: Table did not include seating string 0 8990
  'https://telaris.wlu.ca/ssb_prod/bwckschd.p_disp_dyn_sched', // DNS lookup fails for telaris.wlu.ca. Down
  'https://www2.augustatech.edu/pls/ban8/bwckschd.p_disp_dyn_sched', // DNS lookup fails Feb 7th 2018
  'https://banner.drexel.edu/pls/duprod/bwckschd.p_disp_dyn_sched', // a bug with parsing sections.
  'https://infobear.bridgew.edu/BANP/bwckschd.p_disp_dyn_sched', // a bug with parsing sections.
  'https://new-sis-app.sph.harvard.edu:9010/prod/bwckschd.p_disp_dyn_sched', // This is Harvard's School of public health, not the Undergraduate College.
  'https://novasis.villanova.edu/pls/bannerprd/bwckschd.p_disp_dyn_sched',
  'https://www.bannerssb.bucknell.edu/ERPPRD/bwckschd.p_disp_dyn_sched', // take 8 min. Sept 21st. 2017
  'https://banweb.gwu.edu/PRODCartridge/bwckschd.p_disp_dyn_sched', // Takes 18min Sept 22 2017
  'https://bannerselfservice.lafayette.edu/pls/bprod/bwckschd.p_disp_dyn_sched', // Takes like 4 min. Oct 29 2017
];

// https://ssb.vcu.edu/proddad/bwckschd.p_disp_dyn_sched

// This is the list of colleges on coursicle.com as of Dec 20th, 2016. Looks like they have the scrapers for the same types as sites I'm scraping here.
// Auburn University – Auburn
// Auburn University at Montgomery – AUM
// Samford University – Samford
// University of Alabama – UA
// University of Alabama at Birmingham – UAB
// University of Alabama in Huntsville – UAH
// University of Alaska Anchorage – UAA
// Arkansas State University – ASU
// Arkansas Tech University – ATU
// University of Central Arkansas – UCA
// City College of San Francisco – CCSF
// Carleton University – Carleton
// University of Regina – Regina
// University of Victoria – University of Victoria
// Wilfrid Laurier University – WLU
// Colorado School of Mines – Mines
// University of Denver – DU
// Delaware State University – DESU
// Georgetown University – Georgetown
// Howard University – HU
// Florida Atlantic University – FAU
// Florida SouthWestern State College – FSW
// Northwest Florida State College – NWFSC
// South Florida State College – SFSC
// University of North Florida – UNF
// University of West Florida – UWF
// Georgia Gwinnett College – GGC
// Georgia Institute of Technology – Georgia Tech
// Georgia Southern University – GS
// Morehouse College – Morehouse
// Savannah College of Art and Design – SCAD
// University of Georgia – UGA
// Idaho State University – ISU
// Illinois Institute of Technology – IIT
// Northeastern Illinois University – NIU
// Oakton Community College – Oakton
// Southern Illinois University – SIU
// Southern Illinois University Edwardsville – SIUE
// University of Illinois at Urbana-Champaign – UIUC
// University of Illinois Springfield – UIS
// Wheaton College – Wheaton
// Indiana State University – ISU
// Purdue University – Purdue
// Purdue University Northwest – PNW
// University of Notre Dame – Notre Dame
// Vincennes University – VU
// Drake University – Drake
// Emporia State University – Emporia https://ssb.emporia.edu/pls/prod/bwckschd.p_disp_dyn_sched
// Wichita State University – Wichita
// Delago Community College – DCC
// Northwestern State University – NSULA
// University of Louisiana Lafayette – UL Lafayette
// Morgan State University – Morgan
// University of Maryland The Founding Campus – UMaryland
// Emerson College – Emerson
// Framingham State University – Framingham
// Northeastern University – NEU
// Smith College – Smith
// Ferris State University – Ferris
// Grand Valley State University – GVSU
// Lansing Community College – LCC
// Oakland University – Oakland
// University of Michigan-Dearborn – UMDearborn
// University of Michigan-Flint – UMFlint
// Western Michigan University – WMich
// Concordia University Saint Paul – CSP
// University of St. Thomas – UST
// Mississippi College – MC
// Missouri Southern State University – MSSU
// Missouri State University – MSU
// Saint Louis University – SLU
// Southeast Missouri State University – SEMO
// Truman State University – Truman
// University of Central Missouri – UCMO
// Washington University in St. Louis – WashU
// University Of Montana – UM
// Creighton University – Creighton
// Dartmouth College – Dartmouth
// University of New Hampshire – UNH
// New Jersey Institute of Technology – NJIT
// Ramapo College – Ramapo
// Rowan College Gloucester County – RCGC
// Stockton University – Stockton
// William Paterson University – WPUNJ
// University of New Mexico – UNM
// Binghamton University – Binghamton
// Canisius College – Canisius
// Delhi State University – Delhi
// Farmingdale State College – Farmingdale
// Fashion Institute of Technology – FITNYC
// Fordham University – Fordham
// Hudson Valley Community College – HVCC
// Marist College – Marist
// Pace University – Pace
// Siena College – Siena
// St. Thomas Aquinas College – STAC
// Suffolk County Community College – SCCC
// The New School – Newschool
// Appalachian State University – App
// Duke University – Duke
// East Carolina University – ECU
// Elon University – Elon
// Guilford College – Guilford
// University of North Carolina at Chapel Hill – UNC
// University of North Carolina at Charlotte – UNCC
// University of North Carolina at Greensboro – UNCG
// University of North Carolina at Wilmington – UNCW
// Wake Forest University – WFU
// Western Carolina University – WCU
// University of Toledo – UT
// Cameron University – CU
// Northeastern State University – NSUOK
// Oklahoma State University – OKState
// University of Oklahoma – OU
// Portland State University – PDX
// University of Portland – UP
// California University of Pennsylvania – CalU
// Drexel University – Drexel
// East Stroudsburg University – ESU
// Edinboro University of Pennsylvania – Edinboro
// Lehigh University – Lehigh
// Shippensburg University of Pennsylvania – SHIP
// Slippery Rock University – SRU
// Swarthmore College – Swarthmore
// Temple University – Temple
// University of Pennsylvania – Penn
// University of Scranton – Scranton
// Villanova University – Villanova
// Brown University – Brown
// Johnson and Wales University – JWU
// Clemson University – Clemson
// College of Charleston – CofC
// Lander University – Lander
// University of South Carolina – USC
// Austin Peay State University – APSU
// Christian Brothers University – CBU
// Cleveland State Community College – CSCC
// East Tennessee State University – ETSU
// Pellissippi State Community College – PSTCC
// Rhodes College – Rhodes
// Sewanee: The University of the South – Sewanee
// Tennessee Technological University – TNTech
// University of Memphis – U of M
// University of Tennessee – UTK
// Walters State Community College – WSCC
// Alamo Colleges – Alamo
// Lamar University – Lamar
// Rice University – Rice
// South Texas College – STC
// St. Edward's University – St. Edward's
// St. Mary's University – St. Mary's
// Texas A&amp;M University – A&amp;M
// Texas A&amp;M University Central Texas – TAMU CT
// Texas Southern University – TSU
// University of Dallas – UDallas
// University of Texas at Austin – UT Austin
// University of Texas at El Paso – El Paso
// University of Texas Rio Grande Valley – UTRGV
// University of Texas San Antonio – UTSA
// Victoria College – VC
// Dixie State University – Dixie
// Southern Utah University – SUU
// Utah State University – USU
// Utah Valley University – UVU
// College of William &amp; Mary – W&amp;M
// George Mason University – GMU
// Longwood University – Longwood
// Old Dominion University – ODU
// Radford University – Radford
// Regent University – Regent
// Virginia Commonwealth University – VCU
// Virginia State University – VSU
// Eastern Washington University – EWU
// Marshall University – Marshall
// Mountwest Community &amp; Technical College – MCTC
// West Virginia University – WVU


// non -ellucian sites
// harvard https://courses.harvard.edu/search?sort=course_title+asc&start=0&submit=Search&rows=500000&q=0
// if you remove the q param from the url, 15000+ courses come up, but cs50 is not one of those. If you search for cs50, it comes up. how to get all classes?

//mit http://student.mit.edu/catalog/extsearch.cgi


// https://banners.presby.edu/prod/hzskschd.P_ViewSchedule
// uses an old version of the site - different parser needed (easy to write, add later)
// this specific college ^ either updated or has a newer version too and has already been scraped

// https://hofstraonline.hofstra.edu/pls/HPRO/bwckschd.p_disp_dyn_sched
// uses something similar to neu, but the page after the select subject page is a lot different... idk
//


// http://catalog.kettering.edu/coursesaz/undergrad/chem/
// kettering used to be this, "https://jweb.kettering.edu/cku1/bwckschd.p_disp_dyn_sched", but switched to ^^
