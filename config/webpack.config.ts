let path = require('path')
let webpack = require('webpack')
let HtmlWebpackPlugin = require('html-webpack-plugin')
let CompressionPlugin = require('compression-webpack-plugin')

let SveltePreprocess = require('svelte-preprocess')
let Webpack = require('webpack')
let WebpackDev = require('webpack-dev-server')
let SvelteCheckPlugin = require('svelte-check-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const fs = require('fs')

/**
 * Change this to `true` to run svelte-check during hot reloads. This will impact build speeds but will show more
 * thorough errors and warnings.
 */
const svelteCheckInDevelopment = false

/**
 * Change this to `false` to disable svelte-check during production builds. Build speeds will be faster, but error
 * and warning checks will be less thorough.
 */
const svelteCheckInProduction = true

const mode = process.env.NODE_ENV ?? 'development'
const isProduction = mode === 'production'
// const isProduction = false
const isDevelopment = !isProduction

// export default {
module.exports = {}
module.exports.default = {
	entry: './src/index.ts',
	output: {
		path: path.resolve(__dirname, '../dist'),
		filename: 'bundle.js',
	},
	devtool: 'inline-source-map',
	resolve: {
		extensions: ['.js', '.ts', '.svelte'],
		modules: [path.resolve('./src'), path.resolve('./node_modules')],
		alias: {
			svelte: path.resolve('node_modules', 'svelte'),
			src: path.resolve('src'),
		},
		mainFields: ['svelte', 'browser', 'module', 'main'],
		conditionNames: ['svelte', 'browser'],
		fallback: {
			os: false,
			fs: false,
			crypto: false,
			util: false,
		},
	},
	ignoreWarnings: [/Failed to parse source map/],
	module: {
		noParse: [
			// require.resolve('typescript/lib/typescript.js'),
			/typescript/,
			/eslint/,
		],
		rules: [
			{
				test: /\.svelte$/,
				use: {
					loader: 'svelte-loader',
					options: {
						compilerOptions: {
							// Dev mode must be enabled for HMR to work!
							dev: isDevelopment,
						},
						emitCss: isProduction,
						// hotReload: isDevelopment,
						hotReload: false,
						preprocess: SveltePreprocess({
							sass: true,
							scss: true,
						}),
						// @ts-ignore
						onwarn: (warning, handler) => {
							const {code, frame} = warning
							if (code === 'css-unused-selector' || code === 'unused-export-let') return
							// console.log(code)
							// console.log(warning)
							// console.log(handler)
							handler(warning)
						},
					},
				},
			},
			{
				test: /\.svg$/,
				loader: 'svg-inline-loader',
			},
			// Required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
			// See: https://github.com/sveltejs/svelte-loader#usage
			{
				test: /node_modules\/svelte\/.*\.mjs$/,
				resolve: {
					fullySpecified: false,
				},
			},
			{test: /\.ts$/, loader: 'ts-loader', exclude: /node_modules/},
			{test: /\.js$/, loader: 'source-map-loader'},
			{test: /\.css$/i, use: ['style-loader', 'css-loader']},
			{test: /\.(png|jpe?g|gif)$/i, use: ['file-loader']},
			{
				test: /\.(glsl|vs|fs|vert|frag)$/,
				exclude: /node_modules/,
				type: 'asset/source',
				use: [
					'raw-loader',
					{
						loader: 'glslify-loader',
						options: {
							transform: ['glslify-import'],
						},
					},
				],
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				loader: 'file-loader',
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			favicon: false,
			template: './public/index.html',
			inject: 'body',
			publicPath: './',
			minify: false,
		}),
	],
	optimization: {
		minimize: false,
	},
	// devServer: {
	// 	http2: true,
	// 	https: {
	// 		key: fs.readFileSync('./MY_FILENAME.key'),
	// 		cert: fs.readFileSync('./MY_FILENAME.crt'),
	// 		ca: fs.readFileSync('./MY_FILENAME.pem'),
	// 	},
	// },
}

if (isProduction) {
	module.exports.default.plugins.push(new BundleAnalyzerPlugin())
	module.exports.default.plugins.push(new CompressionPlugin())
	module.exports.default.optimization.minimize = true
}
