// import "babel-core/register"
// import "babel-polyfill"
import path from 'path'
import express from 'express'
import webpack from 'webpack'
import webpackMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import wrap from 'express-async-wrap'

import webpackConfig from './webpack.config.babel'
import macros from './macros'

const compiler = webpack(webpackConfig)
const app = express()


const middleware = webpackMiddleware(compiler, {
	publicPath: webpackConfig.output.publicPath,
	contentBase: 'src',
	stats: {
		colors: true,
		hash: false,
		timings: true,
		chunks: false,
		chunkModules: false,
		modules: false,
	},
})


app.use(express.static('compiled_frontend'))


app.use(middleware)
app.use(webpackHotMiddleware(compiler))

app.get('*', (req, res) => {
	res.write(middleware.fileSystem.readFileSync(path.join(webpackConfig.output.path, 'index.html')))
	res.end()
})

app.listen(macros.port, (err) => {
	if (err) console.log(err);
	console.info(`Listening on port ${macros.port}.`);
});
