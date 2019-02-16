# Overview

To get all the data for classes we are scraping MyNEU's Banner system. This system is available to the public (students don't have to log in to access class information). The scraping code for the classes lives in:
 
```
searchneu/backend/scrapers/classes
```
 
There are two main steps in scraping this data: the parsing and the processing. The parsing takes the vast majority of the time and includes all of the HTTP requests and HTML parsing. The processing re-organizes and cleans up the data, and only takes a couple of seconds.
 
#### Really cool note about the class scrapers 
Thousands of colleges use the same registration system that Northeastern uses to keep track of classes (Banner). Because of this, these scrapers will work for any one of these colleges. For instance, Brown, Bucknell, GW, Swarthmore, Purdue, Drexel, Temple, Villanova, etc, can all easily be scraped with these scrapers. Many of these colleges' URLs are listed in [differentCollegeUrls.js](https://github.com/ryanhugh/searchneu/blob/master/backend/scrapers/classes/differentCollegeUrls.js).


# The data

There are five different pieces of data that are being parsed from the site. 
 
 - Colleges
 - Terms
 - Subjects
 - Classes
 - Sections
 
These are all stored hierarchically:  Sections are a part of a class, classes are a part of a subject, subjects are a part of a term, terms are a part of a college. There are a couple properties on each object to keep track of these relationships. More details about all of these objects are below.
 
### Properties on Colleges:
 
```javascript
{
  // The id of the college itself
  host: "neu.edu"
}
```
 
### Properties on Terms:
 
```javascript
{
  // Keep track of which college this term is a part of
  host: "neu.edu"
 
  // The id of the term itself
  termId: "201830"
}
```
 
### Properties on Subjects:
 
```javascript
{
  // Keep track of which college this subject is a part of
  host: "neu.edu"
 
  // Keep track of which term this subject is a part of
  termId: "201830"
 
  // The id of the subject itself
  subject: "CS"
}
```
 
 
### Properties on Classes:
 
```javascript
{
  // Keep track of which college this class is a part of
  host: "neu.edu"
 
  // Keep track of which term this class is a part of
  termId: "201830"
 
  // Keep track of which subject this class is a part of
  subject: "CS",
 
  // The id of the class itself. More details on this id below.
  classId: "2510"
 
}
```
 
 
### Properties on Sections:
 
```javascript
{
  // Keep track of which college this section is a part of
  host: "neu.edu"
 
  // Keep track of which term this section is a part of
  termId: "201830"
 
  // Keep track of which subject this section is a part of
  subject: "CS",
 
  // Keep track of which class this section is a part of
  classId: "2510",
 
  // The crn of the section itself
  crn: "30362"
}
```

 
 
# Terms
 
The first step of this process is to scrape the terms (Fall 2017, Spring 2018, etc). These terms are found on Northeastern’s site here. The file responsible for scraping these terms is `Elluciantermparser.js`. If the term ended more than four months ago is will not be scraped. The Ellucian term parser then calls into ellucianSubjectParser.js to scrape the subjects. 
 
Schema:
```javascript
{
  // Keep track of which college this term is a part of 
  host: "neu.edu",

  // The id of this term itself.
  termId: "201610",

  // The text of the spring term. This should be shown to the user.
  text: "Spring 2016",
}
```
 
# Subjects

The next step of the process is to scrape all of the subjects. The subjects are scraped from the page that appears if go here (https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_dyn_sched), select a term, and then click submit. 

Schema:
```javascript
{
  // The id of the subject itself
  "subject": "CS",

  // The text of the subject. This should be shown to the user
  "text": "Computer Science",

   // Keep track of which term this subject is a part of 
  "termId": "201830",

  // Keep track of which college this subject is a part of 
  "host": "neu.edu"
}
```


# Classes

The next step of the process is to scrape all of the classes.  A lot of the information for the classes are scraped from different pages. Some of the information comes from the catalog page found [here]( https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201610&one_subj=MATH&sel_crse_strt=2331&sel_crse_end=2331&sel_subj=&sel_levl=&sel_schd=&sel_coll=&sel_divs=&sel_dept=&sel_attr=), other pieces of information come from the section list page found [here]( https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=MATH&crse_in=2331&schd_in=LEC), and other pieces of information come from the section page itself, found [here]( https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=10787).

Schema:
```javascript
{
    // The UTC timestamp of when this class was last updated in milliseconds since epoch.  
    // A JS date object can be created with this value with new Date(1509472511740).
    "lastUpdateTime": 1509472511743,

    // The name of the class
    "name": "Fundamentals of Computer Science 2",

    // The url of the class. This is the url that lists all of the sections that are a part of the class. 
    // This URL will always be present on this object, but it is generally better to show the prettyUrl to the user instead.
    "url": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201830&subj_in=CS&crse_in=2510&schd_in=%",

    // The Url of the class’s catalog page. 
    // This is generally a better Url to take users to than the section listing url. 
    "prettyUrl": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201830&subj_code_in=CS&crse_numb_in=2510",

    // List of the CRNs that are a part of this class. 
    "crns": [
        "30311",
        "30312",
        "31805",
        "33272",
        "34586",
        "35183"
    ],

    // Whether this class is an honors class or not. 
    // This is determined if the section page includes the word "honors" anywhere on it
    "honors": false,

    // Prereqs for the class. More details on this in the Prerequisites and Corequisites section below
    "prereqs": {
        "type": "or",
        "values": [{
            "subject": "CS",
            "classId": "2500"
        }]
    },
    "coreqs": {
        "type": "or",
        "values": [{
            "subject": "CS",
            "classId": "2511"
        }]
    },

    // Maximum number of credits for the class. 
    // This is the same as minCredits 99% of the time. 
    // Decided the separate the two because there were some classes that had a credit range.
    "maxCredits": 4,
    
    // Mminimum credits the class offers.
    "minCredits": 4,
    
    // The class description. This is scraped from the Catalog page. 
    "desc": "Continues CS 2500. Examines object-oriented programming and associated algorithms using more complex data structures as the focus. Discusses nested structures and nonlinear structures including hash tables, trees, and graphs. Emphasizes abstraction, encapsulation, inheritance, polymorphism, recursion, and object-oriented design patterns. Applies these ideas to sample applications that illustrate the breadth of computer science. 4.000 Lecture hours",

    // The id of the class. 
    // This id is unique and no two classes will share the same id. 
    "classId": "2510",

    // The term that this class is a part of.
    "termId": "201830",

    // The college that this class is a part of.
    "host": "neu.edu",

    // The subject that this class is a part of.
    "subject": "CS"
}
```


# Sections
The next step of the process is to scrape all of the sections.  This information comes from the list section page [here](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201610&subj_in=MATH&crse_in=2331&schd_in=LEC) and the section detail page [here](https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201610&crn_in=10787).


```javascript
{

    // The maximum number of students that can fit in the class
    "seatsCapacity": 45,

    // The number of seats that are still available. 
    // If advisors override people into the class after it filled up this can be negative. 
    "seatsRemaining": 9,

    // The maximum number of students that can fit on the waitlist. 
    // Many classes have this set to 0 (aka there is no waitlist)
    "waitCapacity": 0,

    // The total number of spots available on the waitlist. 
    "waitRemaining": 0,

    // Whether the class is an online class or not. 
    // Online classes do not have meetings. 
    // Example: ENGW 3302 usually has a couple online sections each semester
    "online": false,

    // The section URL.
    "url": "https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201740&crn_in=40414",

    // The CRN of this section
    "crn": "40414",

    // The times when this section meets. 
    // There will be one row here for each meeting specified on Banner. 
    // Some parts of this schema are a little odd and may be changed soon.
    "meetings": [{

        // Date that the class starts at the beginning of the semester. 
        // For Fall 2017, this is going to be in early September. The integer itself is days since epoch. 
        // Check inside meeting.js for an example of how to convert this into a moment() object
        "startDate": 17294,

        // Date that classes end at the end of the semester. 
        "endDate": 17339,

        // List of the professors that are teaching this class. 
        // A single person’s name often varies a lot across different data sources. 
        // See the documentation about name matching section for more details
        "profs": ["Rebecca Wilks MacKenzie"],

        // The location of the class. 
        "where": "West Village H 210",

        // The type of this meeting. 
        // At Northeastern, this will be set to “Class” for all the classes and “Final Exam” for all the exams. 
        // Other colleges may vary. 
        "type": "Class",

        // List of all of the professors who teach the class and is the same as list that appears on Banner. 
        // This will often include other extraneous names, but is kept on this meeting object just in case it is ever needed somewhere. 
        "allProfs": ["Rebecca Wilks MacKenzie"],

        // Meeting times of this section. 
        // This schema is kindof odd and may be changed in the future. 
        // I would recommend creating an instance of Section.js in either the frontend or backend, which handles the parsing of this data structure. 
        "times": {

            // Meetings that occur on the second day of the week.   
            "2": [{
                // Start time of this meeting, in minutes since the beginning of the day. 
                "start": 42000,
                "end": 48000
            }],
            "4": [{
                "start": 42000,
                "end": 48000
            }]
        }
    }],
    // The last time this section was updated, in milliseconds since epoch. 
    "lastUpdateTime": 1508786349399,

    // The term that this section is a part of
    "termId": "201740",

    // The college that this section is a part of
    "host": "neu.edu",

    // The subject that this section is a part of
    "subject": "CS",

    // The class Id of the class that this section is a part of
    "classId": "2501"
}

```


# Prerequisites and Corequisites

The prerequisites and corequisites are parsed from Northeastern's site and converted into an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree). This is a complicated process and has undergone a couple iterations. The code behind this is in RequisiteParser.js. It parses the prerequisite and corequisite sections on both the catalog page and the section page. The input for this process looks like this:

------
##### Prerequisites:


(Undergraduate level [CHEM 2313](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2313&amp;sel_crse_end=2313&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) Minimum Grade of C- or Undergraduate level  [CHEM 2317](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2317&amp;sel_crse_end=2317&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) Minimum Grade of C-) and (Undergraduate level [CHEM 2321](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2321&amp;sel_crse_end=2321&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) Minimum Grade of C- or Undergraduate level [CHEM 2331](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2331&amp;sel_crse_end=2331&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) Minimum Grade of C-) and (Undergraduate level [CHEM 3401](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=3401&amp;sel_crse_end=3401&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) Minimum Grade of C- or Undergraduate level [CHEM 3421](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=3421&amp;sel_crse_end=3421&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) Minimum Grade of C- or Undergraduate level [CHEM 3431](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=3431&amp;sel_crse_end=3431&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) Minimum Grade of C-)

----
###### Simplified a bit: 


([CHEM 2313](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2313&amp;sel_crse_end=2313&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) or  [CHEM 2317](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2317&amp;sel_crse_end=2317&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=)) and ([CHEM 2321](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2321&amp;sel_crse_end=2321&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) or [CHEM 2331](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2331&amp;sel_crse_end=2331&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=)) and ([CHEM 3401](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=3401&amp;sel_crse_end=3401&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) or [CHEM 3421](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=3421&amp;sel_crse_end=3421&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=) or [CHEM 3431](https://wl11gp.neu.edu/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=3431&amp;sel_crse_end=3431&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=))

----

And the input HTML looks like this:


```html
<SPAN class="fieldlabeltext">Prerequisites: </SPAN>
<BR> 
(Undergraduate level
<A HREF="/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2313&amp;sel_crse_end=2313&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=">
  CHEM 2313
</A>
Minimum Grade of C- or Undergraduate level
<A HREF="/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2317&amp;sel_crse_end=2317&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=">
  CHEM 2317
</A>
Minimum Grade of C-) and (Undergraduate level
<A HREF="/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2321&amp;sel_crse_end=2321&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=">
  CHEM 2321
</A>
Minimum Grade of C- or Undergraduate level
<A HREF="/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=2331&amp;sel_crse_end=2331&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=">
  CHEM 2331
</A>
Minimum Grade of C-) and (Undergraduate level
<A HREF="/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=3401&amp;sel_crse_end=3401&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=">
  CHEM 3401
</A>
Minimum Grade of C- or Undergraduate level
<A HREF="/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=3421&amp;sel_crse_end=3421&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=">
  CHEM 3421
</A>
Minimum Grade of C- or Undergraduate level
<A HREF="/udcprod8/bwckctlg.p_display_courses?term_in=201830&amp;one_subj=CHEM&amp;sel_subj=&amp;sel_crse_strt=3431&amp;sel_crse_end=3431&amp;sel_levl=&amp;sel_schd=&amp;sel_coll=&amp;sel_divs=&amp;sel_dept=&amp;sel_attr=">
  CHEM 3431
</A>
Minimum Grade of C-)
<BR>
```


The first step in this process is to parse this HTML into an DOM with cheerio. Then, the important pieces of information are copied from the HTML DOM into another data structure. This happens in the `convertElementListToWideMode` method in `ellucianRequisiteParser.js`. Then, the AST is built. This process is similar to how math equations are parsed and what this code is based off of. Check out [this](https://medium.freecodecamp.org/parsing-math-expressions-with-javascript-7e8f5572276e) article for some information on how this works.

The output of this process looks like this:

```javascript
{
    "type": "and",
    "values": [{
            "type": "or",
            "values": [{
                    "subject": "CHEM",
                    "classId": "2313"
                },
                {
                    "subject": "CHEM",
                    "classId": "2313"
                },
                {
                    "subject": "CHEM",
                    "classId": "2317"
                }
            ]
        },
        {
            "type": "or",
            "values": [{
                    "classId": "2321",
                    "subject": "CHEM",
                },
                {
                    "subject": "CHEM",
                    "classId": "2331"
                }
            ]
        },
        {
            "type": "or",
            "values": [{
                    "classId": "3401",
                    "subject": "CHEM",
                },
                {
                    "classId": "3421",
                    "subject": "CHEM",
                },
                {
                    "subject": "CHEM",
                    "classId": "3431"
                }
            ]
        }
    ]
}
 ```

