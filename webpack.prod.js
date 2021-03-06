/* global __dirname: false */

const webpack = require('webpack');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const {VueLoaderPlugin} = require('vue-loader');

module.exports = {
	entry: './src/ui.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: 'dist/'
	},
	mode: 'production',
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: {
					hotReload: false
				}
			},
			{
				test: /\.css$/,
				use: [
					'vue-style-loader',
					'css-loader'
				]
			},
			{
				test: /\.(js|vue)$/,
				exclude: [/node_modules/, /dialog\.js/],
				loader: 'eslint-loader',
				options: {
					failOnWarning: true,
					failOnError: true
				}
			}
		]
	},
	plugins: [
		new VueLoaderPlugin(),
		new UglifyJSPlugin({
			sourceMap: false
		}),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production')
		})
	]
};
