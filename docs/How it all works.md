# Search NEU

One of the big beliefs with adding new features, designs, and functionality to Search NEU is that everything should be super simple, easy to understand, and "Just Work". This enables more people to understand the site, the codebase, and just get up to speed with everything in general!

# The stack

React is used for the Frontend and Node.js is used on the backend. The site itself runs on Amazon Web Services. The scrapers run as a daily cron job on Travis-CI and scrape a lot of data from many different parts of Northeastern's website. The data is first stored as static files on Travis ([Build History](https://travis-ci.org/ryanhugh/searchneu/builds)). After the scrapers run, the files are uploaded to the AWS instance and the production server is updated. The production server itself is lightweight, and only does two things: serve static files (build frontend code and the data files) and process search queries. The server itself is sitting behind CloudFlare which provides free https and helps with caching. The frontend is built with React and Webpack, and follow the standard React development patterns. Redux isn't used yet but may be added in the future. 

# Git branches and deploying to production

The master branch is the main branch for all the development. When you push master, or any other branch, travis will build the code for production, run the unit tests, and send you an email if anything fails. When making a PR, request to merge it into the master branch. 

When changes are pushed to the `prod` branch, Travis will also deploy the code to the production server and update the searchneu npm package [here](https://www.npmjs.com/package/searchneu). 

