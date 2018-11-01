const CopyWebpackPlugin = require('copy-webpack-plugin')
const less = require('less')

const pluginName = 'hhzWxPlugin'

class WxAppPlugin {
    constructor(options = {}) {
        this.options = options
    }

    apply(compiler) {
        if (!compiler.hooks) {
            throw new Error('您的webpack版本过低，请升级到webpack4以上')
        }
        compiler.options.optimization.runtimeChunk = {
            name: 'common'
        }
        compiler.options.optimization.splitChunks = {
            ...compiler.options.optimization.splitChunks,
            name: 'common',
            filename: 'common.js',
            minChunks: 2,
            chunks: 'all',
        }
        new CopyWebpackPlugin([
            {
                context: 'src/',
                from: '**/*.!(js|less)',
            },
            {
                context: 'src/',
                from: '**/*.less',
                to: '[path][name].wxss',
                transform(content, path) {
                    return less.render(content.toString('utf-8')).then(
                        (output) => {
                            return output.css
                        }
                    )
                },
            }
        ]).apply(compiler)
        compiler.hooks.compilation.tap(pluginName, this.toModifyTemplate.bind(this))
    }

    toModifyTemplate(compilation) {

        compilation.mainTemplate.hooks.render.tap(pluginName, (core, {name}) => {
            return core.source().replace(/window/g, 'wx')
        })

        compilation.chunkTemplate.hooks.render.tap(pluginName, (core, {name}) => {
            let injectContent = ''
            if (name === 'app') {
                injectContent = `require('./common');`
            }
            return injectContent + core.source().replace(/window/g, 'wx')
        })
    }
}

module.exports = WxAppPlugin
