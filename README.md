# searchneu [![Travis CI Builds](https://travis-ci.org/ryanhugh/searchneu.svg?branch=master)](https://travis-ci.org/ryanhugh/searchneu/) [![Sublime Text Badge](https://cdn.rawgit.com/aleen42/badges/master/src/sublime_text.svg)](#) [![Webpack Badge](https://cdn.rawgit.com/aleen42/badges/master/src/webpack.svg)](#) [![React Badge](https://cdn.rawgit.com/aleen42/badges/master/src/react.svg)](#)  [![Node.js](https://cdn.rawgit.com/aleen42/badges/master/src/node.svg)](#)  [![GitHub license](https://img.shields.io/badge/license-AGPLv3-blue.svg)](#) [![Website](https://img.shields.io/website/https/searchneu.com.svg)](https://searchneu.com)


Search over classes, professors, sections and more!


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


