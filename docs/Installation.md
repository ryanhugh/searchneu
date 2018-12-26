
# Setting up Search NEU 

#### Fork the repository

Head over to [Github's registration page](https://github.com/join) and create an account, if you don't already have one. Then, while logged into Github, fork the Search NEU repository by clicking on the fork button in the top right corner of this page. This will copy all of the Search NEU code to your personal github account and let you make any changes you want to. (Later, once you have made some changes, this will also let you easily merge the changes into the main repository.)

### Windows Computers 
If you are not on Windows, you can skip this section.

We recommend using [Bash on Windows](https://www.microsoft.com/en-us/p/ubuntu/9nblggh4msv6) to develop on Windows instead of cywin or the built in windows terminal. Head over to the Microsoft store and install it, if you don't already have it installed. After it is installed you can launch it by searching for bash in the start menu. From here on out, you should follow all of the Linux examples (eg. Follow the linux instructions and run `apt-get install nodejs` to install node.js instead of installing the `.exe` for windows instructions file from Node.js's website.)


### Node.js setup

First, you need to download and install Node.js by following the instructions [here](https://nodejs.org/en). This one installation package includes the commands `npm` and `node`, both of which are used later on.  If you are using Ubuntu on Windows, follow the instructions [here](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions-enterprise-linux-fedora-and-snap-packages) instead of using the Windows instructions for Node.js. 

We recommend that you use yarn to install and manage the npm packages. Yarn is an alternate to the npm client that was developed by Facebook. While not required, we stronlgy recommend everyone to use yarn. Follow the instructions [here](https://yarnpkg.com/lang/en/docs/install/) to install yarn. 


## Clone the repository

### Github Desktop

If you are not that familiar with using git from the command line, you can also use the desktop app. You can download that [here](https://desktop.github.com). Once you have it setup, download the searchneu repository you just cloned to your personal Github account. After this, open up the terminal and `cd` to the `searchneu` directory. Then, skip to the section below on installing the dependencies. 

### Git command line
If you want to, you can also use the command line to download the repository. Start by cloning the repo with `git clone`.
```bash
git clone git@github.com:<your username>/searchneu.git
```
For instance, if your username was `ryanhugh`, the command would be:
```
git clone git@github.com:ryanhugh/searchneu.git
```

If for some reason git is not installed, run this command to install it.

```
sudo apt install git
```

After you were able to download the repository, `cd` into the repository directory. 
```bash
cd searchneu
```

### Installing the dependencies
Almost every Node.js project has a lot of dependencies. These include React, Lodash, Webpack, and usually a bunch of other libraries. Lets install them. 

```bash
yarn global add eslint jest @babel/node  # Eslint is just for linting the code and jest is used for testing the code.
yarn
```

Or if you want to use npm to install the node.js packages:
```bash
npm -g install eslint jest @babel/node
npm install
```

If you get installation errors, try deleting the `node_modules` folder and running the install command again. If the problem continues, feel free to message us.

### Start the server

This will start Search NEU in development mode locally. It will listen on port 5000. If you make any changes to the frontend code while the server is running, webpack will automatically recompile the code and send the updates to the browser. Most of the time, the changes should appear in the browser without needing to reload the page ([More info about Hot Module Reloading](https://webpack.js.org/concepts/hot-module-replacement/)). Sometimes this will fail and a message will appear in Chrome's developer tools asking you to reload the page to see the changes. 

```bash
yarn start # or npm run start
```

### React Dev tools

Also, install the React Developer tools browser extension ([Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)). This helps a lot with debugging the frontend React code. More about debugging below.

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
# Run the tests once and exit
jest 

# Run just the files that have changed since the last git commit
jest --watch 

# Run all the tests
jest --watchAll 

# Run only tests where backend is mentioned in the test file's filepath.
jest backend 

# Run all the tests and generate a code coverage report. 
# An overview is shown in the termal and a more detailed report is saved in the coverage directory.
jest --coverage --watchAll 
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
babel-node simplifyProfList.js
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

