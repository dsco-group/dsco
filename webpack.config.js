const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HandlebarsPlugin = require("handlebars-webpack-plugin");
const autoprefixer = require('autoprefixer');
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

const paths = {
  src: {
    js: "./src/js/",
    scss: "./src/scss",
    img: "./src/images",
    video: "./src/video"
  },
  dist: {
    js: "assets/js",
    css: "assets/css",
    img: "assets/images",
    video: "assets/video"
  },
};

module.exports = {
  performance: {
    hints: false
  },
  entry: {
    libs: paths.src.scss + "/libs.scss",
    index: [paths.src.js + "/index.js", paths.src.scss + "/index.scss"],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `assets/js/[name].bundle.js`,
    publicPath: '/', // Uncomment if needed for asset URLs
  },
  mode: "development",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.m?js/,
        include: /node_modules/,
        resolve: {
          fullySpecified: false // Only disable for node_modules
        }
      },
      {
        test: /\.(sass|scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [['autoprefixer']],
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              api: 'modern-compiler', // For latest sass-loader compatibility
            }
          },
        ],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      },
      // Add other asset rules if needed
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]'
        }
      }
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/].+\.js$/,
          name: "vendor",
          chunks: "all",
        },
      },
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: paths.src.img, to: paths.dist.img },
        { from: paths.src.video, to: paths.dist.video }
      ],
    }),
    new HandlebarsPlugin({
      entry: path.join(process.cwd(), "src", "html", "**", "*.html"),
      output: path.join(process.cwd(), "dist", "[path]", "[name].html"),
      partials: [
        path.join(process.cwd(), "src", "partials", "**", "*.{html,svg}"),
      ],
      helpers: {
        root: function () {
          return "{{root}}";
        },
        equals: function (arg1, arg2, options) {
          return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
        },
        object: function ({ hash }) {
          return hash;
        },
        array: function () {
          return Array.from(arguments).slice(0, arguments.length - 1);
        },
      },
      onBeforeSave: function (Handlebars, resultHtml, filename) {
        const nestingLevels = filename.split("//").pop().split("/").length;
        const filePath = ".".repeat(nestingLevels);
        return resultHtml.split("{{root}}").join(filePath);
      },
    }),
    new RemoveEmptyScriptsPlugin(),
    new MiniCssExtractPlugin({
      filename: `${paths.dist.css}/[name].bundle.css`, // Fixed: template literal for consistency
    }),
    new BrowserSyncPlugin(
      {
        host: 'localhost',
        port: 3000,
        proxy: 'http://localhost:9000/'
      },
      {
        reload: false
      }
    )
  ],
  devServer: {
    client: {
      overlay: false,  // Disable all overlays completely
      logging: 'none'
    },
    static: {
      directory: path.join(__dirname, "dist"), // Fixed: contentBase -> static [web:1][web:6][web:21]
    },
    compress: true,
    port: 9000,
    hot: true, // Enable HMR if needed
    historyApiFallback: true,
  },
};
