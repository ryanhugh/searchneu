
# Setting up Search NEU 

We recommend that you use yarn to install and manage the npm packages. Yarn is an alternate to the npm client that was developed by Facebook. Follow the instructions here to install yarn: https://yarnpkg.com/lang/en/docs/install/

```bash
git clone git@github.com:ryanhugh/searchneu.git
cd searchneu
yarn global add eslint jest # If you want to run the linters or unit tests
yarn
```

Or if you want to use npm to install the node.js packages:
```bash
git clone git@github.com:ryanhugh/searchneu.git
cd searchneu
npm -g install eslint jest
npm install
```

Also, install the React Developer tools browser extension ([Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)). This helps a lot with debugging the frontend React code. More about debugging below.

### Start the server

This will start Search NEU in development mode locally. It will listen on port 5000. If you make any changes to the frontend code while the server is running, webpack will automatically recompile the code and send the updates to the browser. Most of the time, the changes should appear in the browser without needing to reload the page ([More info about Hot Module Reloading](https://webpack.js.org/concepts/hot-module-replacement/)). Sometimes this will fail and a message will appear in Chrome's developer tools asking you to reload the page to see the changes. 

```bash
yarn start # or npm run start
```

### Debugging

Chrome dev tools are great for debugging both Node.js code and JavaScript code in a browser. You can debug a Node.js script by running `babel-node` (or `node`) with these arguments:

```bash
babel-node --debug --inspect-brk filename.js
```

If Node.js ever runs out of memory and crashes, run either `babel-node` or `node` with `--max_old_space_size=8192`. This will let Node.js use up to 8GB of RAM. Example:

```bash
babel-node --max_old_space_size=8192 --debug-brk --inspect main
```

If Node.js ever unexpectedly exits and en error appears that says `Killed`, it means that the Operating System is out of memory. Try closing other programs to free up memory or using a different computer with more RAM. The only part of the code that uses a lot of memory is the scrapers, which, as of November of 2017, around 4GB of RAM.

### Run the tests

There is halfway decent code coverage in the codebase. The scrapers in the backend have a lot of tests and the frontend tests are still under development. Jest works great for tests and has an awesome feature called Snapshot testing that is used all throughout Search NEU. This allows us to test a function by specifying that the output of the function should be the same as the output was when the test was written. [More details here](http://facebook.github.io/jest/docs/en/snapshot-testing.html).

```bash
jest # Run the tests once and exit
jest --watch # Run just the files that have changed since the last git commit
jest --watchAll # Run all the tests
jest backend # Run only tests where backend is mentioned in their filepath
```

### Run the scrapers

Running this command will run all the scrapers. 
```bash
yarn scrape
```
If you want to run an individual scraper file, you can directly run any file in `searchneu/backend/scrapers` with `babel-node`. Many of the files in the backend will have small pieces of code at the bottom of them that is used for testing and will only run if that file is ran directly. For instance:

```bash
babel-node ellucianTermsParser.js
# or
babel-node prereqClassUids.js
```


### Build the code for production

This command will build the frontend and backend for production. This will transform the ES6 to ES5 so it will run in `node` directly, (without `babel-node`) and in many different browsers. When you push a branch, travis will make sure that `yarn build` works. 

```bash
yarn build
yarn build_frontend # build only the frontend
yarn build_backend # build only the backend

```

### Linting

Some of the code follows the ESLint config. All the code in the codebase should pass these linting checks. 

```bash
yarn lint
```

It is also possible to lint all the files in a folder or just an individual folder with 
```bash
eslint frontend
eslint backend/scrapers/employees/employees.js
```

Eslint has an autofix flag (`--fix`) that will fix many of the errors it finds. Examples:

```bash
eslint --fix frontend
eslint --fix backend/scrapers/employees/employees.js
```

