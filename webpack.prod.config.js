import webpack from "webpack";
import path from "path";
import CompressionPlugin from "compression-webpack-plugin";

export default {
  module: {
    rules: [
      {
        test: /\.((png)|(eot)|(woff)|(woff2)|(ttf)|(svg)|(gif))(\?v=\d+\.\d+\.\d+)?$/,
        loader: "file-loader?name=/[hash].[ext]"
      },
      {test: /\.json$/, loader: "json-loader"},
      {
        loader: "babel-loader",
        test: /\.js?$/,
        exclude: /node_modules/,
        query: {cacheDirectory: true}
      }
    ]
  },

  plugins: [
    new webpack.ProvidePlugin({
      "fetch": "imports-loader?this=>global!exports?global.fetch!whatwg-fetch"
    }),
    new webpack.optimize.UglifyJsPlugin({
      parallel: true,
      sourceMap: true,
      uglifyOptions: {
        output: {
          comments: false
        }
      }
    }),
    new CompressionPlugin({
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
      minRatio: 0.8
    })
  ],

  context: path.join(__dirname, "src"),
  entry: {
    app: ["./js/app"],
    blog: ["./js/blog"],
    404: ["./js/404"]
  },
  output: {
    path: path.join(__dirname, "public/js"),
    publicPath: "/",
    filename: "[name].js",
    sourceMapFilename: 'bundle.map'
  },
  externals:  [/^vendor\/.+\.js$/]
};