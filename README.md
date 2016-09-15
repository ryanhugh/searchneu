# React Redux minimal starter kit (boilerplate)

Redux-Minimal is a minimalist react-redux starter kit (boilerplate) which let's you build rich real world apps. 
It's not as light as some starter kits which only let you write a simple hello world app and then you have to struggle with installing all the other stuff yourself. 
And it's also not as packed as other starter kits which then confuses you massively with its folder/file structure and arcane scripts.

Redux-Minimal contains the bare minimum to develop a real world complex app and it also comes with a small users app that will show you how to code certain features.
A demo of the app can be seen here: [http://redux-minimal-app.catalin-luntraru.com](http://redux-minimal-app.catalin-luntraru.com)

# Getting started

1) Before you start working with redux-minimal, you first need to setup your environment. Make sure you have the following installed:
* [Git](https://git-scm.com/downloads)
* [NodeJs](https://nodejs.org/en/download/current/)
* an IDE to write js code in, for example [Webstorm](https://www.jetbrains.com/webstorm/download/)

2) Once your environment is prepared, open a terminal and type in the following

```sh
cd C:\js\node\apps
git clone https://github.com/catalin-luntraru/redux-minimal.git hello-world
cd hello-world
npm install
npm start
```

3) Then open [http://localhost:8080/](http://localhost:8080/) to see the included small users app. 
Congratulations! You can now write react redux code.

4) For more productivity you can install Chrome's [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en) and [Redux Dev Tools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en)

# What you get

Redux-Minimal contains the minimum npm packages you need to have installed in order to build a react redux real-world app containing:
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

The code and implementation is minimal, which lets you focus on the real app, not the webpack, babel, gulp etc boilerplate files, which honestly you shouldn't even bother with.

# Installed packages

Here are the npm packages that redux-minimal installs:

|Feature|Packages|Benefits|
|-------|--------|--------|
|React|[`react`]((https://github.com/facebook/react))|A declarative, efficient, and flexible JavaScript library for building user interfaces|
||[`react-dom`](https://www.npmjs.com/package/react-dom)|Serves as the entry point of the DOM-related rendering paths|
||[`react-hot-loader`](https://github.com/gaearon/react-hot-loader)|Tweak React components in real time when developing|
|Redux|[`redux`]((https://github.com/reactjs/redux))|A predictable state container for JavaScript apps|
||[`react-redux`](https://github.com/reactjs/react-redux)|React bindings for Redux|
|Router|[`react-router`](https://github.com/ReactTraining/react-router)|Declarative routing for React. Your app has pages now|
||[`react-router-redux`](https://github.com/reactjs/react-router-redux)|Simple bindings to keep react-router and redux in sync|
|Bootstrap|[`react-bootstrap`](https://github.com/react-bootstrap/react-bootstrap)|Bootstrap 3 components built with React|
||[`react-router-bootstrap`](https://github.com/react-bootstrap/react-router-bootstrap)|Integration between React Router and React-Bootstrap|
|Forms|[`redux-form`](https://github.com/erikras/redux-form)|A Higher Order Component using react-redux to keep form state in a Redux store|
|Asynchronous|[`redux-saga`](https://github.com/yelouafi/redux-saga)|Asynchronous API calls made easy with Saga|
|Unit tests|[`mocha`](https://github.com/mochajs/mocha)|Simple javascript test framework|
|Sass|[`node-sass`](https://github.com/sass/node-sass)|Mature, stable, and powerful CSS extension language|
|Webpack|[`webpack`](https://github.com/webpack/webpack)|A bundler for javascript, css and others|
||[`webpack-dev-server`](https://github.com/webpack/webpack-dev-server)|Serves the app at http://localhost:8080/|
||[`extract-text-webpack-plugin`](https://github.com/webpack/extract-text-webpack-plugin)|Webpack plugin that builds the css bundle file|
||[`style-loader`](https://github.com/webpack/style-loader)|Webpack module to load styles|
||[`css-loader`](https://github.com/webpack/css-loader)|Webpack module to load css styles|
||[`sass-loader`](https://github.com/jtangelder/sass-loader)|Webpack module to load sass styles|
|Babel|[`babel-preset-es2015`](http://babeljs.io/docs/plugins/preset-es2015/)|Let's you can use [ES2015 Javascript syntax](http://www.ecma-international.org/ecma-262/6.0/ECMA-262.pdf)|
||[`babel-preset-react`](http://babeljs.io/docs/plugins/preset-react/)|Let's you can use React's [JSX syntax](https://facebook.github.io/jsx/)|
||[`babel-core`](https://github.com/babel/babel/tree/master/packages/babel-core)|Compiler that helps webpack to compile the new javascript syntax|
||[`babel-loader`](https://github.com/babel/babel-loader)|Plugin that helps webpack to compile the new javascript syntax|
||[`babel-plugin-transform-regenerator`](https://babeljs.io/docs/plugins/transform-regenerator/)|Let's you use ES2015 generator functions which you need for redux-saga|
||[`babel-plugin-transform-runtime`](https://babeljs.io/docs/plugins/transform-runtime/)|Automatically polyfils your code without polluting globals, needed for the ES2015 generator functions|

# Sample app

Redux-Minimal also contains a small sample app that let's you manage some users with the following features:
* a list of users with pagination
* add a new user
* edit an existing user
* delete a user

The sample app provides you with basically most of the things you will need when building a new real-world app.

The demo for the app can be found here: 
[http://redux-minimal-app.catalin-luntraru.com](http://redux-minimal-app.catalin-luntraru.com)
