const path = require('path')
const webpack = require('webpack')

module.exports = {
  //mode: "development",
  mode: "production",
  entry: './renderer.js',
  output: {
    path: path.join(__dirname, 'dest'),
    filename: 'bundle.js'
  },
  devtool: 'inline-source-map'
}
