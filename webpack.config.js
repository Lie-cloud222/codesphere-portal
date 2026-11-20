// How the production bundle is built
const path = require("path");

module.exports = {
    // the entry point. Webpack follows the imports from here
    entry: "./src/main.js",

    // Where the finished bundle is written: dist/bundle.js
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js"
    },

    // Production mode minifies the code and removes what is not used
    mode: "production",

    module: {
        rules: [
            {
                // Every .js file (except node_modules) goes through Babel
                test: /\.js$/,
                exclude: /node_modules/,
                use: "babel-loader"
            }
        ]
    }
};