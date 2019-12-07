module.exports = {
    mode: 'development',
    devtool: "source-map",

    entry: './src/Main.ts',
    output: {
        path: require('path').join(__dirname, './dist/'),
        filename: 'babylondev.js',
    },

    externals: [{
        'babylonjs': 'BABYLON',
        'babylonjs-loaders': 'BABYLON',
        'jquery': 'jQuery',
        'pako': 'pako',
        'react': 'React',
        'react-dom': 'ReactDOM',
        '@material-ui/core': 'MaterialUI',
        '@material-ui/core/styles': 'MaterialUI',
        '@material-ui/core/colors': 'MaterialUI.colors'
    }],

    module: {
        rules: [
            { test: /\.tsx?$/, use: [{ loader: 'ts-loader' }], exclude: /node_modules/ },
        ]
    },

    resolve: {
        extensions: ['.ts', '.tsx']
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