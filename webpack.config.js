module.exports = {
    mode: 'development',
    devtool: "source-map",

    entry: './src/Main.ts',
    output: {
        path: require('path').join(__dirname, './dist/'),
        filename: 'babylondev.js',
    },

    externals: {
        'babylonjs': 'BABYLON',
        'babylonjs-loaders': 'BABYLON',
        'jquery': 'jQuery',
        'pako': 'pako',
    },

    module: {
        rules: [
            { test: /\.ts$/, use: [{ loader: 'ts-loader' }], exclude: /node_modules/ },
        ]
    },

    resolve: {
        extensions: ['.ts']
    },

    devServer: {
        compress: false,
        port: 9000,
        contentBase: ['./'],
        filename: 'babylondev.js',
        publicPath: '/dist/',
        hot: false,
        inline: false,
        liveReload: false
    }
}