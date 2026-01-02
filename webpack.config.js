const path = require('path')
const webpack = require('webpack')

module.exports = (env = {}) => ({
  target: 'node',
  entry: './src/index.ts',
  context: __dirname,
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    pathinfo: true,
    libraryTarget: 'umd',
    publicPath: 'auto',
  },
  resolve: {
    modules: ['.', 'src', 'node_modules'],
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
          },
        },
      },
      {
        test: /\.pug$/,
        use: ['apply-loader', 'pug-loader'],
      },
      {
        test: /\.scss$/,
        use: ['to-string-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['to-string-loader', 'css-loader'],
      },
    ],
  },
  externals: [
    'fs',
    'path',
    'electron',
    /^rxjs/,
    /^@angular/,
    /^@ng-bootstrap/,
    /^tabby-/,
    /^zone\.js/,
  ],
  plugins: [
    new webpack.DefinePlugin({
      __CONFIG_KEY__: JSON.stringify(env.dev ? 'tabbyspaces_dev' : 'tabbyspaces'),
      __DISPLAY_NAME__: JSON.stringify(env.dev ? 'TabbySpaces DEV' : 'TabbySpaces'),
      __IS_DEV__: env.dev ? 'true' : 'false',
    }),
  ],
})
