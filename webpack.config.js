const Path = require('path');

module.exports = {
	devtool: 'source-map',
	entry: {
		app: './src/client/app.tsx',
		preview: './src/preview/preview.tsx'
	},
	mode: 'development',
	resolve: {
		extensions: ['.ts', '.tsx', '.js']
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				options: {
					transpileOnly: true
				}
			}
		]
	},
	output: {
		filename: '[name].js',
		library: '[name]',
		libraryTarget: 'window',
		path: Path.resolve(__dirname, './build')
	}
};
