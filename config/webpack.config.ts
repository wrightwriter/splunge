const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')

const SveltePreprocess = require('svelte-preprocess')
const Webpack = require('webpack')
const WebpackDev = require('webpack-dev-server')
const SvelteCheckPlugin = require('svelte-check-plugin')

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
// const isProduction = mode === 'production';
const isProduction = false
const isDevelopment = !isProduction

// export default {
module.exports = {}
module.exports.default = {
	entry: './src/index.ts',
	//entry: "./src/tests.ts",
	output: {
		path: path.resolve(__dirname, '../dist'),
		filename: 'bundle.js',
		// clean: true,
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
				test: /\.svg$/,
				loader: 'svg-inline-loader',
			},
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
							// alert("amog")
							// console.log("AMOOOOOOOOOOOOG")
							// console.log(code)
							// console.log(warning)
							// console.log(handler)

							handler(warning)
						},

						// hotOptions: {
						// 	// List of options and defaults: https://www.npmjs.com/package/svelte-loader-hot#usage
						// 	noPreserveState: false,
						// 	optimistic: true,
						// },
						// preprocess: SveltePreprocess({
						// 	scss: true,
						// 	sass: true,
						// 	// postcss: {
						// 	// 	plugins: [
						// 	// 		// Autoprefixer
						// 	// 	]
						// 	// }
						// })
					},
				},
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
			// {
			//   test: /\.(glsl|vs|fs|vert|frag)$/,
			//   exclude: /node_modules/,
			//   use: ["raw-loader"],
			// },
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
			// minify: true,
		}),
		// new CompressionPlugin()
	],
	optimization: {
		minimize: false,
	},
}
