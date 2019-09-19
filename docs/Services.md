# Services

Search NEU uses the folling 3rd party services. The site depends on most of these being up to run correctly. Some are just used for analytics. 

### Amazon AWS

For running the server on an EC2 instance. Costs $20 a month for 1CPU 2GB ram server (t2.small). 

### Amplitude

For keeping track of most of the analytics on the site. Mostly event data, such as how many searches occur. 

Right now (5/29/19), the following graphs are on Amplitude:

 - Searches per day 
 - Search timings per day 
 - Times people clicked links in the prerequisite or corequisite section, per day
 - Searches per hour
 - Searches per session on desktop
 - Searches per session on mobile (much less, as expected :P)
 - Searches with no results
 - User ping time/How long it took to perform a search
 - Avg sessions per user per week
 - Avg session lengh
 - Device breakdown (Mac vs Windows vs iPhone etc)
 - Browser breakdown (Chrome vs Firefox etc)
 - Dropoff rate
 - Adblock rate
 - Updater duration (eg how long it took to check if any seats opened up)
 - Most common searches per week
 - Number of FB messenges that are sent out
 - Number of times the backend server was started 
 - Total search count, all time 
 - API requests
 
 ### Google Analytics
 
Used to keep track of user sessions over time, and some other stuff. 

### Google Search Console

Used to keep track of the sites performance in Google search results. Can tell you which queries brought up searchneu.com, and which position searchneu.com was. 
https://search.google.com/search-console
  
### Fullstory
  
Used to get very detailed insights of what users do on the site. Great for fixing small bugs and making optimizations. We exceed the monthly free limit in just a few days, so it is often disabled (either due ot limit exceeded or just manually disabled).

### Datadog

Used to monitor some system metrics. We could use it for other metrics too. It looks like it can do everything Amplitude can do and more (including alerts and much finer granularity - which we could use for monitoring scraping).

### Facebook

Manages the Search NEU Facebook bot. http://m.me/searchneu Also the Search NEU page. http://fb.com/searchneu

### Firebase

Stores data about users. If you sign up for notifications for when seats open up, your data (who you are, what classes you are watching) is stored in firebase. 

### Travis CI

Runs CI for the site. Also, the scrapers run on Travis once per day and re-scrape everything. 
https://travis-ci.org/ryanhugh/searchneu/builds

### Gandi

The domain. https://www.gandi.net/en

### Cloudflare

Manages DNS and caches some stuff which makes the site faster. 

### Rollbar

Manages errors in the frontend and the backend. Will send off emails if things break. 

### Github

For the code. 

### Lets Encrypt

The https certificate. https://letsencrypt.org/ 

### Typeform

The form for recruiting new team members. 

### Coveralls

For code coverage 
https://coveralls.io/github/ryanhugh/searchneu



