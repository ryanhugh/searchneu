
# The Scrapers

This is where the entire process starts: getting the data. All the code for the scrapers live in `searchneu/backend/scrapers`. Node.js works really well for high-performance web scraping because it can handle a very large number of simultaneous connections. All of the scraping is done with raw HTTP requests using the [requests](https://www.npmjs.com/package/request) library. The requests library is a lot faster than using a headless browser to scrape because it doesn’t load or process the CSS, images, or any other files on the sites. [Cheerio](https://cheerio.js.org/) is used to parse the HTML. Cheerio has a API that is pretty similar to jQuery which lets us quickly scan through HTML elements and parse info from them. Some of the older parsers use domutils and htmlparser2. Right now, there are two main data sources - employees and classes. All of the current data sources are public on the internet and don't require any log credentials to view them. 

The scrapers run daily on [Travis](https://travis-ci.org/ryanhugh/searchneu/builds). All the ones with the cron tag that took about 17 minutes to run are the scrapers. The scrapers download just over 1GB of HTML and send out just over 100,000 HTTP requests. There are about 6,000 sections and 7,000 scraped every day. 

More documentation about specific scrapers below:

- [Classes](Classes.md)
- [Employees](Employees.md)

# The cache

In order to speed up the development of the scrapers we added a cache to save the HTTP response for every request made in the Search NEU scrapers. In production mode, the cache is skipped and all the requests will always be sent to the server. There is a small wrapper around the npm [request](https://github.com/request/request) library that checks to see if the response already exists locally on your computer. The code for this is [here](https://github.com/ryanhugh/searchneu/blob/master/backend/scrapers/cache.js). If it does, the code just returns the cached content of the request. If it doesn’t, the request is made, saved locally, and returned to the code that made the request. Loading from the files is a lot faster than hitting the server which helps a lot when developing/making tweaks to the scrapers. When the cache is present, all the data from Northeastern's site can be processed in about 4 or 5 minutes vs the 17-18 minutes it takes to in production mode. Additionally, using the cache means it is possible to develop the scrapers without internet.  Right now it will run in development mode when running locally and production mode if `process.env.CI` or `process.env.PROD` are present. Overall it works really well, the only gotcha is if you are running it with cache enabled and are wondering why it isn't downloading the latest data from the server. If this happens, just delete the cache and try again. 


# Other data sources

We are definitely open to adding new data sources and have started scrapers for a few others. Scrapers for 
 buildings and student organizations at northeastern have been started but are not finished. Eventually these may be added to Search NEU. 

