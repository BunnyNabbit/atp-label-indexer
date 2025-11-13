"use strict"

const path = require("path")
const autoprefixer = require("autoprefixer")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
	mode: "development",
	entry: "./web/js/index.mjs",
	output: {
		filename: "index.[hash].mjs",
		path: path.resolve(__dirname, "dist"),
		assetModuleFilename: "[path][name][ext]",
	},
	devServer: {
		static: path.resolve(__dirname, "dist"),
		port: 8080,
		hot: true,
	},
	plugins: [new HtmlWebpackPlugin({ template: "./web/index.html" })],
	module: {
		rules: [
			{
				test: /\.(scss)$/,
				use: [
					{
						// Adds CSS to the DOM by injecting a `<style>` tag
						loader: "style-loader",
					},
					{
						// Interprets `@import` and `url()` like `import/require()` and will resolve them
						loader: "css-loader",
					},
					{
						// Loader for webpack to process CSS with PostCSS
						loader: "postcss-loader",
						options: {
							postcssOptions: {
								plugins: [autoprefixer],
							},
						},
					},
					{
						// Loads a SASS/SCSS file and compiles it to CSS
						loader: "sass-loader",
					},
				],
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: "asset/resource",
			},
		],
	},
}
