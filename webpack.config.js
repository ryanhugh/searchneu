// http://webpack.github.io/docs/configuration.html
// http://webpack.github.io/docs/webpack-dev-server.html
var path = require('path');
module.exports = {
    entry: [
        // http://gaearon.github.io/react-hot-loader/getstarted/
        'webpack-dev-server/client?http://localhost:8080',
        'webpack/hot/only-dev-server',
        __dirname + '/src/index.js',
    ],
    output: {
        path: __dirname + '/public/js',
        publicPath: 'js/',
        filename: 'bundle.js',
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel',
                exclude: /node_modules/,
            },
            {
                // https://github.com/jtangelder/sass-loader
                test: /\.scss$/,
                loaders: ['style', 'css', 'sass'],
            }
        ],
    },
    devServer: {
        contentBase: __dirname + '/public',
    },
    plugins: [],
};