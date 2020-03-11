/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import webpack from 'webpack';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
import notifier from 'node-notifier';

import macros from './macros';

const rootDir = path.join(__dirname, '..');

const fbMessengerId = macros.getEnvVariable('fbMessengerId');

export default {
  // https://webpack.js.org/configuration/devtool/
  devtool: macros.PROD ? 'source-map' : 'cheap-module-eval-source-map',
  mode: macros.PROD ? 'production' : 'development',
  entry: [
    'regenerator-runtime/runtime',
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
    new FriendlyErrorsWebpackPlugin({

      // Don't clear on windows because the terminal dosen't have great support for it
      clearConsole: (process.env.OS !== 'Windows_NT'),

      onErrors: (severity, errors) => {
        if (severity !== 'error') {
          return;
        }
        const error = errors[0];
        notifier.notify({
          title: error.name,
          message: error.file || '',
        });
      },
    }),


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
          fbMessengerId: String(fbMessengerId),
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
    // Make moment not include the locale files. Makes the output bundle smaller
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],

  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.css'],
    modules: ['frontend', 'node_modules', 'common'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
      },
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre',
      },
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

        include: [path.join(rootDir, 'frontend'), path.join(rootDir, 'common')],
        options: {
          cacheDirectory: true,
        },
      },

      // This css loader is for 3rd party css files. Load them globally.
      {
        test: /\.css$/,
        include: [
          path.join(rootDir, 'node_modules'),
        ],

        loaders: [
          'style-loader',
          'css-loader',
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
  externals: {
    '../backend/macros': 'empty',
  },
  node: {
    fs: 'empty',
  },
};
