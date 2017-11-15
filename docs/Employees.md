
# Overview

The employee information is scraped from a bunch of different data sources. All of these data sources are available to the public and don't require a login to access). The scraping code behind the scrapers for the employees lives in

```
searchneu/backend/scrapers/employees
```

Just like the scrapers for the classes, there are two main parts to scraping this data: the parsing and the processing. Currently information about employees are scraped from five different parts of Northeastern's website. Each one of these data sources provides different amounts of information about different amounts of Northeastern employees. 

- Employees
- CCIS
- COE
- CSSH
- CAMD

Many of the employees have information listed on multiple data sources. After all the information is scraped, the information from the different data sources is merged and de-duplicated. 

### Employees scrapers

This data source provides a little bit of information about every employee at Northeastern. The scraping code for the employee data source lives here.

```
searchneu\backend\scrapers\employees\employees.js
```

The data is scraped from here: https://prod-web.neu.edu/wasapp/employeelookup/public/main.action

As of November of 2017 it includes about 6363 people. The following information is saved for each person:

```javascript
{
  // Name of the employee
  name: "Ben Lerner",

  // The first name of the employee
  firstName: "Ben",

  // The last name of the employee
  lastName: "Lerner",

  // The id of the employee, according to Northeastern's system. 
  id: "001906884",
  
  // The phone number of the employee
  phone: "6173732462",

  // A list of the employee's emails
  emails: [
      "be.lerner@northeastern.edu"
  ],

  // The primary role of the employee
  primaryRole: "Assistant Teaching Professor",

  // The department that the employee works in
  primaryDepartment: "CCIS"
}
```

### CCIS Scrapers

This data source provides a lot of information about all the employees in CCIS. The scraping code for the employee data source lives here.

```
searchneu\backend\scrapers\employees\ccis.js
```

The data is scraped from here: http://www.ccis.northeastern.edu/people-view-all/

As of November of 2017 it includes about 379 people. The following information is saved for each person:

```javascript
{

  // The name of the employee. This may be slightly different than other data sources. 
  // See the name matching section for more details. 
  "name": "Benjamin Lerner",

  // The first name of the employee.
  "firstName": "Benjamin",

  // The last name of the employee.
  "lastName": "Lerner",

  // The URL to their CCIS profile. 
  "url": "http://www.ccis.northeastern.edu/people/benjamin-lerner/",

  // The primary role of this employee.
  "primaryRole": "Assistant Teaching Professor",

  // A list of the employee's emails
  "emails": [
      "blerner@ccs.neu.edu"
  ],

  // The phone number of the employee
  "phone": "6173732462",
  
  // The employee's office location
  "officeRoom": "314 West Village H",
  
  // The street address of the building. 
  "officeStreetAddress": "440 Huntington Avenue",
  
  // The employee's personal website. Not always present. 
  "personalSite": "http://www.ccs.neu.edu/home/blerner/",
  
  // The URL to the employee's picture. For CCIS employees, this is a large cover photo. 
  // The size and focus of the photos is different on different data sources. 
  // For example, the College of Engineering has smaller profile photos instead of larger cover photos.
  // As of November 2017, these URLs are not used in the frontend. 
  "bigPictureUrl": "http://www.ccis.northeastern.edu/wp-content/uploads/2016/02/Benjamin-Lerner-hero-image.jpg"
}
```



### COE Scrapers

This data source provides a lot of information about all the employees in COE. The scraping code for the employee data source lives here.

```
searchneu\backend\scrapers\employees\coe.js
```

The data is scraped from here: http://www.coe.neu.edu/connect/directory?field_faculty_type_value=faculty&letter=A

As of November of 2017 it includes about 169 people. The following information is saved for each person:

```javascript
{
  // Thumbnail picture of the employee. Much smaller than the CCIS photos. 
  "picThumbnail": "http://www.coe.neu.edu/sites/default/files/styles/user_photo/public/portraits/bioe/makowski-l.jpg?itok=GcFdXL97",
  
  // URL to the employee's profile page.
  "url": "http://www.bioe.neu.edu/people/makowski-lee",
  
  // Name of the employee
  "name": "Lee Makowski",
   
   // The first name of the employee.
  "firstName": "Lee",
   
   // The last name of the employee.
  "lastName": "Makowski",
  
  // The employee's interests. As of November 2017, this is not used anywhere. 
  "interests": "Image and signal processing as applied to biophysical data designed to answer fundamental questions about the molecular basis of living systems",
  
  // A list of the employee's emails.
  "emails": [
      "makowski@ece.neu.edu"
  ],
  
   // The phone number of the employee.
  "phone": "6173733006"
}
```


### CAMD Scrapers


This data source provides a lot of information about all the employees in CAMD. The scraping code for the employee data source lives here.

```
searchneu\backend\scrapers\employees\camd.js
```

The data is scraped from these URLs

https://camd.northeastern.edu/architecture/faculty-staff   
https://camd.northeastern.edu/artdesign/faculty-staff   
https://camd.northeastern.edu/commstudies/faculty-staff   
https://camd.northeastern.edu/gamedesign/faculty-staff   
https://camd.northeastern.edu/journalism/faculty-staff   
https://camd.northeastern.edu/mscr/faculty-staff   
https://camd.northeastern.edu/music/faculty-staff   
https://camd.northeastern.edu/theatre/faculty-staff   

As of November of 2017 it includes about 298 people. The following information is saved for each person:

```javascript
{
  // URL to the employee's profile page.
  url: "https://camd.northeastern.edu/architecture/people/dan-adams/",
  
  // Name of the employee.
  name: "Dan Adams",
  
  // The first name of the employee.
  firstName: "Dan",
  
  // The last name of the employee.
  lastName: "Adams",
  
  // Picture of the employee. Larger than the COE photos but smaller than the CCIS photos. 
  // As of November 2017 this is not used anywhere. 
  image: "https://camd.northeastern.edu/architecture/wp-content/uploads/sites/4/2013/03/Adams_Photo2_bw-392x307.jpg",
  
  // The primary role of this employee
  primaryRole: "Interim Director + Associate Professor",
  
  // A list of the employee's emails.
  emails: [
      "da.adams@northeastern.edu"
  ],
  
  // The phone number of the employee.
  phone: "6173734637",
  
  // The employee's office location
  officeRoom: "Ryder 151 C"
}

```


### CSSH Scrapers


This data source provides a lot of information about all the employees in CSSH. The scraping code for the employee data source lives here.

```
searchneu\backend\scrapers\employees\cssh.js
```

The data is scraped from here: https://www.northeastern.edu/cssh/faculty

As of November of 2017 it includes about 231 people. The following information is saved for each person:

```javascript
{
  // URL to the employee's profile page.
  url: "https://www.northeastern.edu/cssh/faculty/max-abrahms",
  
  // Name of the employee.
  name: "Max Abrahms",
  
  // The first name of the employee.
  firstName: "Max",
  
  // The last name of the employee.
  lastName: "Abrahms",
  
  // Picture of the employee. Also not the same size as any of the other departments. 
  // As of November 2017 this is not used anywhere. 
  image: "https://www.northeastern.edu/cssh/wp-content/uploads/2013/08/POLS-Max-Abrahms2-web1-414x522.jpg",
  
  // The primary role of this employee
  primaryRole: "Assistant Professor of Political Science",
  
  // A list of the employee's emails.
  emails: [
      "m.abrahms@northeastern.edu"
  ],
  
  // The employee's office location
  officeRoom: "215F RP",
  
  // The street address of the building. 
  officeStreetAddress: "360 Huntington Avenue"
}

```



# Matching the employees

After all the employee information is scraped it is matched and de-duplicated. Almost all of the employees in CCIS, CAMD, COE, and CSSH will also have an entry in the general employee data source. These different entries are first matched up with email addresses. Many employees will have the same email address(es) listed on multiple data sources. If there are no matches with email addresses, the entries are matched by name. Matching by name isn't the most accurate because employee's names can vary quite a bit between data sources. When two entries are matched, the objects are merged and properties present on both objects are overridden. After the entries are matched, they are saved to `public/data/employees.json`.
