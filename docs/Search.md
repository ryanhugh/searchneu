# Search

The search itself has undergone many different iterations since the first prototype was working. Currently, the search itself is powered  by [elasticlunr.js](http://elasticlunr.com). Elasticlunr is a JavaScript npm modules that works great in both the frontend and the backend. For Search NEU it is being used in the backend. When the server first starts up, it loads two search indexes: one for the classes (7MB) and one for the employees (3MB). It also loads all the data for the classes (another 7MB) and employees (2MB) from files on the filesystem. The search indexes take some time to build (5 seconds or so), but once built, can be used to search for anything very quickly. Under the hood, elasticlunr uses a [Trie](https://en.wikipedia.org/wiki/Trie) to process the searches. The search indexes and the data are all stored in RAM which makes searches very fast. Each semester at NEU is about 7MB of data and a 7MB search index so they don't take up too much memory. When a user types something into the search box, it is immediately sent to the server, where the search is processed. The server merges the results from the employees and the classes and then send the results to the client. 

Log in Chrome Dev tools of the searches being sent to the server:

![](https://i.imgur.com/UZorFlV.png)


When you are typing something into the box, it just loads the first 5 results. More results are loaded as the user is scrolling down the page. 

# Scoring

All of the different fields on classes, section, and employees that you can search are ranked at different scores.  As of this writing, the scoring is:

```javascript
{
  // Id of the class. Ex 2510
  classId: 4,

  // Acronym of the name of the class. 
  // This is calculated dynamically based on the name of the class.
  // Ex. OOD, AI, ML, PL, etc
  acronym: 4,

  // Subject of the class. Ex CS, Math, etc
  subject: 2,

  // The description of the class.
  desc: 1,

  // The name of the class. 
  // Ex Fundamentals of Computer Science
  name: 1.1,

  // The list of professors who are teaching different sections of the class. 
  // Eg Michael Dilip Shah, Nathaniel Tuck
  profs: 1,

  // The list of CRNs of sections that are a part of this class
  crns: 1
}
```

The scoring for employees
```javascript
{
  // This employee's name
  // Leena Razzaq
  name: 2,

  // The role of this employee
  // Ex. Assistant Teaching Professor
  primaryRole: .4,

  // The department that this employee is a part of
  // Ex. CCIS
  primaryDepartment: .4,

  // The email address on file for this employee.
  // l.razzaq@northeastern.edu, lrazzaq@ccs.neu.edu
  emails: 1,

  // The phone number of this employee
  phone: 1,
}
```

# Optimizations

#### Subject Matching

When a user types in a subject code (`CS`, `CHEM`, etc.) or a subject name (`Computer Science`, `Physics`, etc.) all the classes in that subject are returned, in order. Before the search query is sent to elasticlunr.js, it is checked against a list of all the subjects in the term that the user is searching over. If any match, the list of classes is returned and the query is not sent to elasticlunr.js

#### Subject space adding

If a query starts with a subject and does not include a space, such as `CS2500`, a space will automatically be added after the subject before it is processed with elasticlunr.js (`CS2500` -> `CS 2500`). Without this change, there would not be any results. This occurs in `searchneu/common/search.js`.

#### Acronyms 

It is also possible to search for classes by their acronym (`OOD`, `ML`, `AI`, etc.). When the classes are being added to the search index, the acronym of the class name is calculated and added to the search index. For instance, `OOD` is calculated from `Object-Oriented Design` and `SVS` is calculated from `Software Vulnerabilities and Security`. This occurs in `searchneu/backend/scrapers/classes/searchIndex.js`. 

#### Ties

Sometimes two different results will have the exact same score. This commonly happens when users search for acronyms and multiple classes have the exact same acronym (e.g., `Music Lessons` and `Machine Learning`). When this happens, these classes are sorted by general student interest in the classes so the class more likely to be relevant is on top. This occurs in `searchneu/common/search.js` and was inspired by Algolia's business scoring. 

#### Hardcoded queries

Some slang, such as `fundies`, is used all the time at NEU to refer to Fundamentals of Computer Science but is not found anywhere in the description or name of the Fundamentals of Computer Science classes. These exceptions are hardcoded in `searchneu/common/search.js`. 
