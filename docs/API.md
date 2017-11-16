

# API

All the data used on the site is available to download! There are two different endpoints - one for downloading all the class data and another for downloading all the employee data. The data is updated [daily on Travis](https://travis-ci.org/ryanhugh/searchneu/builds). There are no endpoints for downloading a specific class or employee, you have to download everything or nothing.  Note that the class url contains the termId of the semester of data you want to download (201810 = Fall 2017, 201830 = Spring 2018).

### Class data links
https://searchneu.com/data/getTermDump/neu.edu/201810.json (Fall 2017)
https://searchneu.com/data/getTermDump/neu.edu/201830.json (Spring 2018)

### Employee data link
https://searchneu.com/data/employees.json

If you have any questions or are interested in using the API let me know! I'd be happy to help and/or change some things around so it is easier to use. 

Search NEU is also published as a NPM module [here!](https://www.npmjs.com/package/searchneu). This module includes all the scrapers behind Search NEU. Use this module instead of hitting the API if you want to only depend on the code behind Search NEU and don't want to rely on the site itself being up. 

### The search endpoint

If you want to, you can also hit the search endpoint directly. All the calls to the search endpoint are HTTP GET requests. Please don't send more than 100 requests to the search endpoint per hour. For example:

```
https://searchneu.com/search?query=cs&termId=201810&minIndex=0&maxIndex=5
```

#### The parts of this query

The query parameter is the query itself. This is case-insensitive. 
```
query=cs
```

Which term to search over. This will only affect the class results and does not affect the employee results. 
```
termId=201830
```

The lower and upper bound of the results to return. When a search is performed on the server the search library returns 100s of results. Sending all of these results to the frontend for every query would be unnecessary, so only a few are sent. For example, if the `minIndex` is set to `0` and the `maxIndex` is set to `5` only the top five results will be sent. If `minIndex` is set to `15` and `maxIndex` is set to `20` only results 15 through 20 will be returned. 

```
minIndex=0&maxIndex=5
```

## Sample return value

```json
[
{
    "score": 12.883877334273933,
    "employee":
    {
        "name": "Leena Razzaq",
        "firstName": "Leena",
        "lastName": "Razzaq",
        "id": "001130930",
        "phone": "6173735797",
        "emails": ["l.razzaq@northeastern.edu", "lrazzaq@ccs.neu.edu"],
        "primaryRole": "Assistant Teaching Professor",
        "primaryDepartment": "CCIS",
        "url": "https://www.ccis.northeastern.edu/people/leena-razzaq/",
        "officeRoom": "132C Nightingale Hall",
        "officeStreetAddress": "105-107 Forsyth Street",
        "personalSite": "http://www.ccs.neu.edu/home/lrazzaq/",
        "bigPictureUrl": "https://www.ccis.northeastern.edu/wp-content/uploads/2016/02/Leena-Razzaq-hero-image.jpg"
    },
    "type": "employee"
},
{
    "score": 4.877671508066469,
    "type": "class",
    "class":
    {
        "lastUpdateTime": 1510519074966,
        "name": "Lab for CS 2510",
        "url": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201810&subj_in=CS&crse_in=2511&schd_in=%",
        "crns": ["11424", "12579", "13916", "14347"],
        "honors": false,
        "coreqs":
        {
            "type": "or",
            "values": [
            {
                "subject": "CS",
                "classUid": "2510_699845912",
                "classId": "2510"
            }]
        },
        "maxCredits": 1,
        "minCredits": 1,
        "desc": "Accompanies CS 2510. Covers topics from the course through various experiments. 1.000 Lab hours",
        "classId": "2511",
        "prettyUrl": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201810&subj_code_in=CS&crse_numb_in=2511",
        "termId": "201810",
        "host": "neu.edu",
        "subject": "CS",
        "classUid": "2511_803118792"
    },
    "sections": [
    {
        "seatsCapacity": 45,
        "seatsRemaining": 0,
        "waitCapacity": 0,
        "waitRemaining": 0,
        "online": false,
        "url": "https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=11424",
        "crn": "11424",
        "meetings": [
        {
            "startDate": 17415,
            "endDate": 17506,
            "profs": ["Leena Razzaq"],
            "where": "West Village H 212",
            "type": "Class",
            "times":
            {
                "5": [
                {
                    "start": 42300,
                    "end": 48300
                }]
            },
            "allProfs": ["Leena Razzaq"]
        }],
        "lastUpdateTime": 1510519290251,
        "termId": "201810",
        "host": "neu.edu",
        "subject": "CS",
        "classId": "2511",
        "classUid": "2511_803118792"
    },
    {
        "seatsCapacity": 45,
        "seatsRemaining": 1,
        "waitCapacity": 0,
        "waitRemaining": 0,
        "online": false,
        "url": "https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=12579",
        "crn": "12579",
        "meetings": [
        {
            "startDate": 17415,
            "endDate": 17506,
            "profs": ["Leena Razzaq"],
            "where": "West Village H 212",
            "type": "Class",
            "times":
            {
                "5": [
                {
                    "start": 35400,
                    "end": 41400
                }]
            },
            "allProfs": ["Leena Razzaq"]
        }],
        "lastUpdateTime": 1510519290243,
        "termId": "201810",
        "host": "neu.edu",
        "subject": "CS",
        "classId": "2511",
        "classUid": "2511_803118792"
    },
    {
        "seatsCapacity": 50,
        "seatsRemaining": 21,
        "waitCapacity": 0,
        "waitRemaining": 0,
        "online": false,
        "url": "https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=13916",
        "crn": "13916",
        "meetings": [
        {
            "startDate": 17415,
            "endDate": 17506,
            "profs": ["Leena Razzaq"],
            "where": "West Village H 210",
            "type": "Class",
            "times":
            {
                "5": [
                {
                    "start": 48900,
                    "end": 54900
                }]
            },
            "allProfs": ["Leena Razzaq"]
        }],
        "lastUpdateTime": 1510519290247,
        "termId": "201810",
        "host": "neu.edu",
        "subject": "CS",
        "classId": "2511",
        "classUid": "2511_803118792"
    },
    {
        "seatsCapacity": 50,
        "seatsRemaining": 30,
        "waitCapacity": 0,
        "waitRemaining": 0,
        "online": false,
        "url": "https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&crn_in=14347",
        "crn": "14347",
        "meetings": [
        {
            "startDate": 17415,
            "endDate": 17506,
            "profs": ["Leena Razzaq"],
            "where": "West Village H 210",
            "type": "Class",
            "times":
            {
                "5": [
                {
                    "start": 55500,
                    "end": 61500
                }]
            },
            "allProfs": ["Leena Razzaq"]
        }],
        "lastUpdateTime": 1510519290249,
        "termId": "201810",
        "host": "neu.edu",
        "subject": "CS",
        "classId": "2511",
        "classUid": "2511_803118792"
    }]
}]
```
