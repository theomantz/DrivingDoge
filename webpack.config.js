const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, "public", "index.js"),
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.ProgressPlugin()
  ],
  devtool: 'source-map',
  resolve: {
    extensions: ['.js']
  }
};