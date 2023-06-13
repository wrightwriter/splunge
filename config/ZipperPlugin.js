const path = require("path")
const AdmZip = require("adm-zip")


const defaultOptions = {
  outputPath: path.resolve(__dirname, "../dist-zipped/project.zip")
}

class ZipperPlugin {
  constructor(options = {}) {
    this.options = {
      ...defaultOptions,
      ...options
    }
  }

  apply(compiler) {
    // Specify the event hook to attach to
    compiler.hooks.done.tapAsync(
      "ZipperPlugin",
      (stats, callback) => {
        const outputPath = stats.compilation.outputOptions.path
        const zip = new AdmZip()
        zip.addLocalFolder(outputPath)
        zip.toBuffer()
        zip.writeZip(this.options.outputPath)
        callback()
      }
    )
  }
}

module.exports = ZipperPlugin