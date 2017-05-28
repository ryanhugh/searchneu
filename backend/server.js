import path from 'path';
import express from 'express';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

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

app.use(express.static('public'));

app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname , '..', 'frontend', "sw.js"));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname , '..', 'frontend', "404.html"));
});


app.listen(macros.port, '0.0.0.0', (err) => {
  if (err) console.log(err);
  console.info(`Listening on port ${macros.port}.`);
});
