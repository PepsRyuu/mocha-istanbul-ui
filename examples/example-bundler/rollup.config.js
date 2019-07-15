let node_resolve = require('rollup-plugin-node-resolve');
let babel = require('rollup-plugin-babel');
let css = require('rollup-plugin-hot-css');
let glob_import = require('rollup-plugin-glob-import');
let jsx = require('acorn-jsx');

let scss = (code, id) => {
    return require('node-sass').renderSync({
        data: code,
        compressed: true,
        includePaths: [ require('path').dirname(id) ]
    }).css.toString();
};

let config = {
    input: process.env.MAIN || './src/main.js',
    output: {
        dir: './dist',
        format: 'esm',
        assetFileNames: '[name].[hash][extname]',
        entryFileNames: '[name].[hash].js'
    },
    plugins: [
        css({
            filename: 'styles.css',
            hot: process.env.NODE_ENV === 'development',
            transform: scss
        }),
        node_resolve(),
        babel(),
        glob_import()
    ],
    acornInjectPlugins: [
        jsx()
    ]
};

module.exports = config;