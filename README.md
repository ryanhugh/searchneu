# React Redux minimal boilerplate (starter kit)

Redux-Minimal is a minimalist react-redux starter kit (boilerplate) which let's you build rich real world apps.

This boilerplate (starter kit) contains the minimum packages you need to have installed in order to build a react redux real-world app containing:
* a file/folder structure for your app
* pages (routes)
* forms with validation
* real-world API async requests
* unit tests
* bootstrap react components
* sass
* hot loader for ease of development
* redux tools
* js and css bundle files built for development or production

There are a lot of other boilerplate (starter kits) for react redux, but this one focuses on providing only the absolute necessary packages you need without the extra fluff.

The code and implementation is minimal, which lets you focus on the real app, not the webpack, babel, gulp etc boilerplate files, which honestly you shouldn't even bother with.

# App Demo 

This boilerplate also contains a small app which can be found here:

[http://react-redux-minimal-starter.catalin-luntraru.com](http://react-redux-minimal-starter.catalin-luntraru.com)

# Start

To start using it, you first need to run this in the terminal:

```sh
npm install
npm start
```

Then open [http://localhost:8080/](http://localhost:8080/) to see your app.

Alternatively, if you use [Webstorm](https://www.jetbrains.com/webstorm/) you can create npm scripts for starting, testing, building, etc. Each script in package.json > scripts can be used and run.

<img src="https://i.gyazo.com/c0e0cb4b77be8f55b0bea25a6532b302.png">

For more productivity you can install Chrome's [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) and [Redux Dev Tools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)

# Packages

This boilerplate (starter kit) will let you be more productive and, but if you really want to understand what's going on, here's a list with what is installed and why:

* production
    * react, react-dom
        * These are the packages that are necessary to work with react
    * redux, react-redux
        * These are the packages that are necessary to work with redux and to integrate react with redux
    * react-router, react-router-redux
        * These are the packages that give you the ability to have pages in your app
    * react-bootstrap, react-router-bootstrap
        * These are the packages that provide you with bootstrap react components
    * redux-form
        * This is the package that is necessary to work with forms
    * redux-saga
        * This is the package that is necessary to work with async API requests. If you want to fetch a real API, then you need to also install isomorphic-fetch
* dev
    * babel-core, babel-preset-es2015, babel-preset-react, babel-loader, babel-plugin-transform-regenerator, babel-plugin-transform-runtime
        * These are the babel packages that allow you to use react JSX syntax, ES6 new syntax, ES6 generators
    * webpack, webpack-dev-server, extract-text-webpack-plugin, style-loader, css-loader, sass-loader
        * These are the webpack packages that allow you create the js and css bundle files and also start a service at [http://localhost:8080/](http://localhost:8080/) which let's you test your app
    * react-hot-loader
        * This package let's you see instant changes to you app without the need to refresh the page after you changed the code
    * node-sass
        * This package let's you use sass and write your own scss files
    * mocha
        * This package is used to create unit tests. To do asserts you just use node.js assert(), so there's no need for chai.js

# App

This boilerplate (starter kit) also contains a simple starting app that let's you manage users with the following features:
* a list of users with pagination
* add a new user
* edit an existing user
* delete a user

This little app contains basically most of the things you will need when building a new real-world app.

The demo for the app can be found here: [http://react-redux-minimal-starter.catalin-luntraru.com](http://react-redux-minimal-starter.catalin-luntraru.com)
