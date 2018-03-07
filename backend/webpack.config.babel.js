/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';

import macros from './macros';

const rootDir = path.join(__dirname, '..');

export default {
  devtool: macros.PROD ? 'source-map' : 'cheap-modules-eval-source-map',
  mode: macros.PROD ? 'production' : 'development',
  entry: [
    'babel-polyfill',
    ...macros.DEV ? [
      'react-hot-loader/patch',
      'webpack-hot-middleware/client',
    ] : [],
    path.join(rootDir, 'frontend/index.js'),
  ],

  output: {
    path: path.join(rootDir, '/public/'),
    filename: '[id]-[hash].js',
    chunkFilename: '[id]-[hash].js',
    publicPath: '/',
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './frontend/index.html',
      inject: 'body',
      filename: 'index.html',
    }),
    ...macros.DEV ? [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          PROD: 'false',
          DEV: 'true',
          TESTS: 'false',
        },
      }),
    ] : [
      new webpack.DefinePlugin({
        'process.env': {
          PROD: 'true',
          DEV: 'false',
          TESTS: 'false',

          // This is needed so the production version of react is used.
          NODE_ENV: '"production"',
        },
      }),
      new webpack.LoaderOptionsPlugin({
        debug: false,
        minimize: true,
      }),
    ],
  ],

  resolve: {
    extensions: ['.js', '.css'],
    modules: ['frontend', 'node_modules', 'common'],
  },

  module: {
    rules: [

    // Ensure that everything passes eslint.
      // {
      //   enforce: 'pre',
      //   test: /\.js$/,
      //   exclude: /node_modules/,
      //   use: [
      //     'babel-loader',
      //     'eslint-loader',
      //   ],
      // },
      {
        test: /\.js$/,
        loader: 'babel-loader',

        include: path.join(rootDir, 'frontend'),
      },

      {
        test: /\.js$/,
        loader: 'babel-loader',

        include: path.join(rootDir, 'common'),
      },

      // This css loader is for 3rd party css files. Load them globally.
      {
        test: /\.css$/,
        include: [
          path.join(rootDir, 'node_modules'),
        ],
        loaders: [
          'style-loader',
          'css-loader?localIdentName=[path]___[name]__[local]___[hash:base64:5]',
        ],
      },

      // Sass
      {
        test: /\.scss$/,
        loaders: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },


      // Load other stuff as static files.
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'file-loader?name=[path][name].[ext]',
        ],
      }, {
        test: /\.(eot|ttf|woff|woff2)$/i,
        loaders: [
          'file-loader?name=[name].[ext]&mimetype=application/x-font-truetype',
        ],
      },
    ],
  },
};
