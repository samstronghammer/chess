const path = require('path');
const host = process.env.HOST || 'localhost';

module.exports = {
    entry: path.resolve(__dirname, 'src', 'index.tsx'),
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js', '.scss', '.css'],
    },
    module: {
        rules: [
            // support for scss
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Translates CSS into CommonJS
                    {
                        loader: 'css-loader',
                        options: {
                           modules: true,
                        }
                    },
                    // Compiles Sass to CSS
                    'sass-loader',
                ],
            },
            // support for typescript
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    devServer: {
        historyApiFallback: true,
        // Serve index.html as the base
        contentBase: path.resolve(__dirname, 'build'),
        // Enable compression
        compress: true,
        // Enable hot reloading
        hot: true,
        host,
        port: 3000,
        watchOptions: {
            aggregateTimeout: 500,
            poll: true
        },
    },
};
