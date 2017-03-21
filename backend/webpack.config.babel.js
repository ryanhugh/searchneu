import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

import macros from './macros';

const rootDir = path.join(__dirname, '..');

export default {
  devtool: macros.PROD ? 'source-map' : 'cheap-modules-eval-source-map',

  entry: [
    'babel-polyfill',
    ...macros.DEV ? [
      'react-hot-loader/patch',
      'webpack-hot-middleware/client',
    ] : [],
    path.join(rootDir, 'frontend/index.js'),
  ],

  output: {
    path: path.join(rootDir, '/'),
    filename: '[id]-[hash].js',
    chunkFilename: '[id]-[hash].js',
    publicPath: macros.host,
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './frontend/index.html',
      inject: 'body',
      filename: 'index.html',
    }),
    ...macros.DEV ? [
      new webpack.HotModuleReplacementPlugin(),
    ] : [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"',
        },
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false,
      }),
      new webpack.optimize.UglifyJsPlugin({
        beautify: false,
        mangle: {
          screw_ie8: true,
          keep_fnames: true,
        },
        compress: {
          warnings: false,
          screw_ie8: true,
        },
        comments: false,
        sourceMap: true,
      }),
    ],
  ],

  resolve: {
    extensions: ['.js', '.scss', '.css'],
    modules: ['frontend', 'node_modules'],
  },

  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      include: path.join(rootDir, 'frontend'),
    }, {
      test: /\.scss$/,
      include: [
        path.join(rootDir, 'frontend'),
      ],
      loaders: [
        'style-loader',
        'css-loader?sourceMap',
        'resolve-url-loader',
        'sass-loader?sourceMap',
      ],
    }, {
      test: /\.css$/,
      include: [
        path.join(rootDir, 'frontend', 'lib'),
      ],
      loaders: [
        'style-loader',
        'css-loader?localIdentName=[path]___[name]__[local]___[hash:base64:5]',
      ],
    }, {
      test: /\.css$/,
      include: [
        path.join(rootDir, 'frontend', 'components'),
      ],
      loaders: [
        'style-loader',
        'css-loader?modules&importLoaders=1&localIdentName=[path]___[name]__[local]___[hash:base64:5]',
      ],
    }, {
      test: /\.css$/,
      include: [
        path.join(rootDir, 'node_modules'),
      ],
      loaders: [
        'style-loader',
        'css-loader?localIdentName=[path]___[name]__[local]___[hash:base64:5]',
      ],
    }, {
      test: /\.(jpe?g|png|gif|svg)$/i,
      loaders: [
        'file-loader?name=[path][name].[ext]',
      ],
    }, {
      test: /\.(eot|ttf|woff|woff2)$/i,
      loaders: [
        'file-loader?name=[name].[ext]&mimetype=application/x-font-truetype',
      ],
    }],
  },
};
