const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, "src", "index.js"),
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: [/\.js$/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/env'],
            exclude: /(node_modules)/,
          }
        },
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ],
      },
    ]
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.js']
  }
};