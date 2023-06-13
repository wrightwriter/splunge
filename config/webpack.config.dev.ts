// const config = require("./webpack.config")
const cfg = require("./webpack.config")
// import cfg from "./webpack.config"

// export default {
module.exports = {
  
}
module.exports.default = {
  ...cfg.default,
  mode: "development",
  devServer: {
    //   // disables the Hot Module Replacement feature because probably not ideal
    //   // in the context of generative art
    //   // https://webpack.js.org/concepts/hot-module-replacement/
    //   hot: true,
    //   port: 8080,
    //   open: true,
    //   client: {
    //     overlay: {
    //       errors: true,
    //       warnings: false,
    //     },
    //   },
    // },
    // inline: true,
    hot: true,
  },
}
