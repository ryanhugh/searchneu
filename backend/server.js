import path from 'path';
import express from 'express';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import wrap from 'express-async-wrap';
import fs from 'fs-promise';

import search from '../common/search';
import webpackConfig from './webpack.config.babel';
import macros from './macros';

const compiler = webpack(webpackConfig);
const app = express();


const middleware = webpackMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath,
  stats: {
    colors: true,
    timings: true,
    hash: false,
    chunksM: false,
    chunkModules: false,
    modules: false,
  },
});


app.use(middleware);
app.use(webpackHotMiddleware(compiler));

app.get('/', (req, res) => {
  res.write(middleware.fileSystem.readFileSync(path.join(webpackConfig.output.path, 'index.html')));
  res.end();
});

let searchPromise = null;

async function getSearch() {
  if (searchPromise) {
    return searchPromise;
  }

  const termDumpPromise = fs.readFile('./public/data/getTermDump/neu.edu/201810.json').then((body) => {
    return JSON.parse(body);
  });

  const searchIndexPromise = fs.readFile('./public/data/getSearchIndex/neu.edu/201810.json').then((body) => {
    return JSON.parse(body);
  });


  const employeeMapPromise = fs.readFile('./public/data/employeeMap.json').then((body) => {
    return JSON.parse(body);
  });

  const employeesSearchIndexPromise = fs.readFile('./public/data/employeesSearchIndex.json').then((body) => {
    return JSON.parse(body);
  });

  try {
    searchPromise = Promise.all([termDumpPromise, searchIndexPromise, employeeMapPromise, employeesSearchIndexPromise]).then((...args) => {
      return search.create(...args[0]);
    });
  }
  catch (e) {
    console.error("Error:", e)
    console.error('Not starting search backend.')
    return null;
  }

  return searchPromise;
}

app.get('/search', wrap(async (req, res) => {
  if (!req.query.query || typeof req.query.query !== 'string' || req.query.query.length > 100) {
    console.error('Need query.');
    res.send('Need query param.');
    return;
  }

  let minIndex = 0;
  if (req.query.minIndex) {
    minIndex = req.query.minIndex;
  }

  let maxIndex = 10;
  if (req.query.maxIndex) {
    maxIndex = req.query.maxIndex;
  }


  const index = await getSearch();

  if (!index) {
    res.send('Could not start backend. No data found.')
    return;
  }

  const startTime = Date.now();
  const results = index.search(req.query.query, minIndex, maxIndex);
  const midTime = Date.now();
  const string = JSON.stringify(results)
  console.log('Search for', req.query.query, 'took ', midTime-startTime, 'ms and stringify took', Date.now()-midTime);

  res.send(string);
}));

app.use(express.static('public'));

app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'sw.js'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', '404.html'));
});


app.listen(macros.port, '0.0.0.0', (err) => {
  if (err) console.log(err);
  console.info(`Listening on port ${macros.port}.`);
});
