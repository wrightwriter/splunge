let path = require('path')
let webpack = require('webpack')
let HtmlWebpackPlugin = require('html-webpack-plugin')
let CompressionPlugin = require('compression-webpack-plugin')
let CopyWebpackPlugin = require('copy-webpack-plugin')

let SveltePreprocess = require('svelte-preprocess')
let Webpack = require('webpack')
let WebpackDev = require('webpack-dev-server')
let SvelteCheckPlugin = require('svelte-check-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const fs = require('fs')
const WatchExternalFilesPlugin = require('webpack-watch-files-plugin')

const fs_ = require('node:fs/promises')

const mode = process.env.NODE_ENV ?? 'development'
let isProduction = mode === 'production'
let isDevelopment = !isProduction

const MagicString = require('magic-string').default
const Bundle = require('magic-string').Bundle

/* Make `@import "./whatever.css" scoped;` statements import CSS into the component's CSS scope */
function importCSSPreprocess() {
	async function importCSS({content, filename}) {
		function matchAllImports(str) {
			const globalRegex = /@import\s+(".*"|'.*')\s+scoped\s*;/g
			const matches = []
			let match
			while ((match = globalRegex.exec(str)) !== null) {
				const start = match.index
				const end = start + match[0].length
				// @ts-ignore
				matches.push({start, end, file: match[1].substring(1, match[1].length - 1)})
			}
			return matches
		}

		const imports = matchAllImports(content)
		if (imports.length > 0) {
			let lastStart = null
			const state = new MagicString(content, {filename})
			const remove = (start, end) => state.clone().remove(start, end)
			let out = []
			const deps = []
			for (const {start, end, file} of imports.reverse()) {
				// Right
				if (lastStart != null) {
					// @ts-ignore
					out.push(remove(lastStart, content.length).remove(0, end))
				} else {
					// @ts-ignore
					out.push(remove(0, end))
				}
				const absPath = path.join(path.dirname(filename), file)
				// @ts-ignore
				deps.push(absPath)
				const text = (await fs_.readFile(absPath)).toString()
				// @ts-ignore
				out.push(new MagicString(text, {filename: absPath}))
				lastStart = start
			}
			// Left
			const first = remove(lastStart, content.length)
			const bundle = new Bundle()
			bundle.addSource(first)
			for (let i = out.length - 1; i >= 0; i--) {
				bundle.addSource(out[i])
			}

			return {
				code: bundle.toString(),
				map: bundle.generateMap(),
				dependencies: deps,
			}
		} else {
			return {code: content}
		}
	}
	return {style: importCSS}
}

// export default {
module.exports = {}
module.exports.default = {
	entry: './src/index.ts',
	output: {
		path: path.resolve(__dirname, '../dist'),
		filename: 'bundle.js',
		publicPath: '/',
	},
	devtool: 'source-map',
	resolve: {
		roots: [path.resolve(__dirname, '../src')],
		extensions: ['.js', '.ts', '.svelte'],
		modules: [path.resolve('./src'), path.resolve('./node_modules')],
		alias: {
			svelte: path.resolve('node_modules', 'svelte/src/runtime'),
			src: path.resolve('src'),
		},
		mainFields: ['svelte', 'browser', 'module', 'main'],
		conditionNames: ['svelte', 'browser', 'import'],
		fallback: {
			os: false,
			fs: false,
			crypto: false,
			util: false,
			http: false,
			querystring: false,
		},
	},
	ignoreWarnings: [/Failed to parse source map/],
	module: {
		noParse: [/typescript/, /eslint/],
		rules: [
			{
				test: /\.svelte$/,
				use: {
					loader: 'svelte-loader',
					options: {
						compilerOptions: {
							dev: isDevelopment,
						},
						emitCss: isProduction,
						hotReload: false,
						preprocess: [
							// @ts-ignore
							importCSSPreprocess(),
							SveltePreprocess({
								sass: true,
								scss: true, // <--
							}),
						],
						onwarn: (warning, handler) => {
							const {code, frame} = warning
							if (code === 'css-unused-selector' || code === 'unused-export-let' || code.startsWith('a11y')) return
							handler(warning)
						},
					},
				},
			},
			{
				test: /\.svg$/,
				loader: 'svg-inline-loader',
			},
			{
				test: /node_modules\/svelte\/.*\.mjs$/,
				resolve: {
					fullySpecified: false,
				},
			},
			{test: /\.ts$/, loader: 'ts-loader', exclude: /node_modules/},
			{test: /\.js$/, loader: 'source-map-loader'},
			{test: /\.css$/i, use: ['style-loader', 'css-loader']},
			{test: /\.(png|jpe?g|gif)$/i, type: 'asset/resource'},
			{
				test: /\.webp$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							limit: false, // Disable base64 encoding
							fallback: 'file-loader',
							outputPath: 'images', // Output directory for the images
							publicPath: './images', // Public URL path for the images
						},
					},
				],
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				type: 'asset/resource',
				// options: {
				generator: {
					outputPath: './', // Output directory for the images
					publicPath: './', // Public URL path for the images
				},
				// },
			},
			{
				test: /\.(glsl|vs|fs|vert|frag)$/,
				exclude: /node_modules/,
				type: 'asset/source',
				// type: 'javascript/auto',
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
}
if (isDevelopment) {
	// console.log('AMOGUS')
	// console.log(WatchExternalFilesPlugin)
	module.exports.default.plugins.push(
		new WatchExternalFilesPlugin.default({
			files: ['./src/**/*.glsl', '!./src/*.test.glsl'],
		}),
	)
}

if (isProduction) {
	// module.exports.default.plugins.push(new BundleAnalyzerPlugin())
	module.exports.default.plugins.push(new CompressionPlugin())
	module.exports.default.optimization.minimize = true
}
