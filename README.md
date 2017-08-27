# Search NEU [![Travis CI Builds](https://travis-ci.org/ryanhugh/searchneu.svg?branch=master)](https://travis-ci.org/ryanhugh/searchneu/) [![Sublime Text Badge](https://cdn.rawgit.com/aleen42/badges/master/src/sublime_text.svg)](#) [![Webpack Badge](https://cdn.rawgit.com/aleen42/badges/master/src/webpack.svg)](#) [![React Badge](https://cdn.rawgit.com/aleen42/badges/master/src/react.svg)](#)  [![Node.js](https://cdn.rawgit.com/aleen42/badges/master/src/node.svg)](#)  [![GitHub license](https://img.shields.io/badge/license-AGPLv3-blue.svg)](#) [![Website](https://img.shields.io/website/https/searchneu.com.svg)](https://searchneu.com)


## Quick overview of the code and how it is setup. 
All the data shown on the site is scraped from various parts of Northeastern's website. All the scrapers are under the backend/scrapers folder. All of the scrapers are written in Node.js, use [request](https://github.com/request/request) for downloading the HTML and [cheerio](https://github.com/cheeriojs/cheerio) for parsing it. The scrapers run as a [daily cron job on Travis-CI](https://travis-ci.org/ryanhugh/searchneu/builds). All of data is then uploaded to the main AWS server which serves the site. The AWS server is running behind Cloudflare, which makes the site faster and more secure. Elasticlunr.js is used to search through all the data. Right now, all the data and the search index can easily fit into RAM so there is no need to use a bigger solution (AWS's CloudSearch, ElasticSearch, etc), but might switch over to one of them in the future. The search itself takes about ~4ms which is awesome. The frontend is made with React and Webpack.

# Setup


```
# Clone
git clone git@github.com:ryanhugh/searchneu.git

# If you want to use yarn:
npm i -g yarn
yarn 
yarn start

# Or if you want to use npm:
npm install
npm run start
```

# API

All the data used on the site is avalible to download! There are two different endpoints - one for downloading all the class data and another for downloading all the employee data. The data is updated [daily on travis](https://travis-ci.org/ryanhugh/searchneu/builds). There are no endpoints for downloading a specific class or employee, you have to download everything or nothing.  Note that the class url contains the termId of the semester of data you want to download (201810 = Fall 2017).

### Class data link
https://searchneu.com/data/getTermDump/neu.edu/201810.json

### Employee data link
https://searchneu.com/data/employees.json

If you have any questions or are interested in using the API let me know! I'd be happy to help and/or change some things around so it is easier to use. 


# Changelog

### Summer 2017
 - Added support for online classes ([Example](https://searchneu.com/engw3302))
 - Significantly improved the mobile site
 - Hyperlinked the classes in the Prereqs and Coreqs section
 - Redid the homepage
 - Refactored scraping code
 - Added feedback link
 - Bug fixes



