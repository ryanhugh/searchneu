# React Redux minimal starter kit (boilerplate)


<br><a href="http://redux-minimal.js.org/"><img src="http://redux-minimal.js.org/logo/redux-minimal-logo-blue.svg"></a><br><br>


[![Join the chat at https://gitter.im/catalin-luntraru/redux-minimal](https://badges.gitter.im/catalin-luntraru/redux-minimal.svg)](https://gitter.im/catalin-luntraru/redux-minimal?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/catalin-luntraru/redux-minimal.svg?branch=master)](https://travis-ci.org/catalin-luntraru/redux-minimal?branch=master)
[![dependencies](https://david-dm.org/catalin-luntraru/redux-minimal.svg)](https://david-dm.org/catalin-luntraru/redux-minimal)
[![devDependency Status](https://david-dm.org/catalin-luntraru/redux-minimal/dev-status.svg)](https://david-dm.org/catalin-luntraru/redux-minimal?type=dev)

Redux-Minimal is a minimalist react-redux starter kit (boilerplate) which let's you build rich real world apps. 
It's not as light as some starter kits which only let you write a simple hello world app and then you have to struggle with installing all the other stuff yourself. 
And it's also not as packed as other starter kits which confuse you massively with its folder/file structure and arcane scripts.

Redux-Minimal contains the bare minimum to develop a real world complex app and it also comes with a small users app that will show you how to code certain features.
A demo of the app can be seen here: [http://redux-minimal-app.catalin-luntraru.com](http://redux-minimal-app.catalin-luntraru.com)


# Getting started

1. Before you start working with redux-minimal, you first need to setup your environment. Make sure you have the following installed:
    * [Git](https://git-scm.com/downloads)
    * [NodeJs and Npm](https://nodejs.org/en/download/current/)
    * an IDE to write js code in, for example [Webstorm](https://www.jetbrains.com/webstorm/download/)

2. Once your environment is prepared, open a command prompt (terminal) and type in the following:

    ```sh
    cd C:\js\node\apps
    git clone https://github.com/catalin-luntraru/redux-minimal.git hello-world
    cd hello-world
    npm install
    npm start
    ```

3. Then open your [http://localhost:8080/](http://localhost:8080/) to see the included small users app. 
Congratulations! You can now write react redux code.

4. For more productivity you can install Chrome's [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) and [Redux Dev Tools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)


# Video tutorial

I made a video tutorial series, to help people out getting started with react and redux. It covers the basics, like what is react, redux, etc, and also setting up the environment with redux-minimal and guiding you step by step with creating the demo users app. You will also understand why code was written this way, where refactoring was needed, etc.

[Let's learn React and Redux with Javascript's new ES6 syntax, from Beginner to Intermediate to Advanced](https://www.youtube.com/watch?v=d0oUGmSE6IY&list=PLJBrYU54JD2pTblB20OmV7GL6H5J-p2g8)

# Why use this?

Redux-Minimal contains the minimum npm packages you need to have installed in order to build a react redux real-world app containing:
* a proper file/folder structure
* pages (routes)
* forms with validation
* real-world API asynchronous requests
* unit tests
* bootstrap react components
* sass
* hot loader for ease of development
* redux tools
* js and css bundle files built for development or production

The code and implementation are minimal, which lets you focus on the real app, not the webpack, babel, gulp etc boilerplate files, which honestly you shouldn't even bother with.


# Installed packages

Here are the npm packages that redux-minimal installs:

|Feature|Packages|Benefits|
|-------|--------|--------|
|React|[`react`](https://github.com/facebook/react)|A declarative, efficient, and flexible JavaScript library for building user interfaces|
||[`react-dom`](https://www.npmjs.com/package/react-dom)|Serves as the entry point of the DOM-related rendering paths|
||[`react-hot-loader`](https://github.com/gaearon/react-hot-loader)|Tweak React components in real time when developing|
|Redux|[`redux`](https://github.com/reactjs/redux)|A predictable state container for JavaScript apps|
||[`react-redux`](https://github.com/reactjs/react-redux)|React bindings for Redux|
||[`redux-freeze`](https://github.com/buunguyen/redux-freeze)|Redux middleware that prevents state from being mutated anywhere in the app|
|Router|[`react-router`](https://github.com/ReactTraining/react-router)|Declarative routing for React. Your app has pages now|
||[`react-router-redux`](https://github.com/reactjs/react-router-redux)|Simple bindings to keep react-router and redux in sync|
|Bootstrap|[`react-bootstrap`](https://github.com/react-bootstrap/react-bootstrap)|Bootstrap 3 components built with React|
||[`react-router-bootstrap`](https://github.com/react-bootstrap/react-router-bootstrap)|Integration between React Router and React-Bootstrap|
|Forms|[`redux-form`](https://github.com/erikras/redux-form)|A Higher Order Component using react-redux to keep form state in a Redux store|
|Asynchronous|[`redux-saga`](https://github.com/yelouafi/redux-saga)|Asynchronous API calls made easy with Saga|
|Unit tests|[`mocha`](https://github.com/mochajs/mocha)|Simple javascript test framework|
||[`enzyme`](https://github.com/airbnb/enzyme)|JavaScript Testing utilities for React components|
||[`react-addons-test-utils`](https://facebook.github.io/react/docs/test-utils.html)|Required by enzyme. Makes it easy to test React components|
||[`ignore-styles`](https://www.npmjs.com/package/ignore-styles)|Ignore imported style files when running in Node|
|Sass|[`node-sass`](https://github.com/sass/node-sass)|Mature, stable, and powerful CSS extension language|
|Webpack|[`webpack`](https://github.com/webpack/webpack)|A bundler for javascript, css and others|
||[`webpack-dev-server`](https://github.com/webpack/webpack-dev-server)|Serves the app at [http://localhost:8080/](http://localhost:8080/)|
||[`extract-text-webpack-plugin`](https://github.com/webpack/extract-text-webpack-plugin)|Webpack plugin that builds the css bundle file|
||[`style-loader`](https://github.com/webpack/style-loader)|Webpack module that loads styles|
||[`css-loader`](https://github.com/webpack/css-loader)|Webpack module that loads css styles|
||[`sass-loader`](https://github.com/jtangelder/sass-loader)|Webpack module that loads sass styles|
||[`clean-webpack-plugin`](https://github.com/johnagan/clean-webpack-plugin)|Webpack module to remove previous build files|
|Babel|[`babel-core`](https://github.com/babel/babel/tree/master/packages/babel-core)|Compiler that helps node.js and the browser to understand the new js syntax|
||[`babel-runtime`](https://www.npmjs.com/package/babel-runtime)|Helps node.js to understand the new js syntax|
||[`babel-preset-es2015`](http://babeljs.io/docs/plugins/preset-es2015/)|Helps node.js to use [ES2015 Javascript syntax](http://www.ecma-international.org/ecma-262/6.0/ECMA-262.pdf)|
||[`babel-preset-react`](http://babeljs.io/docs/plugins/preset-react/)|Helps node.js to use React's [JSX syntax](https://facebook.github.io/jsx/)|
||[`babel-preset-stage-3`](https://babeljs.io/docs/plugins/preset-stage-0/)|Helps node.js to use the spread operator|
||[`babel-loader`](https://github.com/babel/babel-loader)|Helps webpack to compile the new javascript syntax|
||[`babel-polyfill`](https://babeljs.io/docs/usage/polyfill/)|Helps the browser to understand the new js syntax|
||[`whatwg-fetch`](https://github.com/github/fetch)|Helps the browser to use fetch|


# Express branch

You can use the [express branch](https://github.com/catalin-luntraru/redux-minimal/tree/express) if you want to use express instead of webpack-dev-server.


# Change host and/or port

If you don't want to use localhost on port 8080, you can change it in `package.json` and `webpack.config.js`.


# Sample app

Redux-Minimal also contains a small sample app that let's you manage some users with the following features:
* a list of users with pagination
* add a new user
* edit an existing user
* delete a user

The sample app provides you with basically most of the things you will need when building a new real-world app.

The demo for the app can be found here: 
[http://redux-minimal-app.catalin-luntraru.com](http://redux-minimal-app.catalin-luntraru.com)


# Build your own app

1. Open `webpack.config.js` and change the `app_root` value from `src_users` to `src`

2. Run `npm start`

3. Congratulations! You now have a blank `Hello world` starting app


# Scripts

Besides the `start` script, there are also other scripts

|`npm run <script>`|What it does|
|------------------|------------|
|`start`|Starts the app at [http://localhost:8080/](http://localhost:8080/). The bundle js/css files are stored in memory|
|`test`|Starts the unit testing using all the files found in the `test` folder|
|`test-watch`| Starts the unit testing and watches for changes to re-run the tests|
|`build-dev`|Builds the js/css bundle files in the `public` folder. Adds debugging code for development|
|`build-prod`|Builds the js/css bundle minified files in the `public` folder|


# License

This project is licensed under the MIT license, Copyright (c) 2016 Catalin Luntraru.
