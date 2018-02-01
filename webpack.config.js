var webpack = require('webpack');
var path    = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var BUILD_DIR = path.resolve(__dirname, 'dist');
var APP_DIR   = path.resolve(__dirname);

module.exports = {
  entry: ['babel-polyfill', APP_DIR + '/app.jsx'],
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js'
  },
  module : {
    rules: [
      {
        test : /\.jsx?/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_compontents)/,
        query: {
            presets: ['react', 'env']
        }
      },
      {
        test: /\.s?css$/,
        use: [ 'style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      },
    ]
  },
  plugins: [
    new UglifyJSPlugin()
  ]
};
