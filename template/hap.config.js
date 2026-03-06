const path = require('path');

const resolve = function (dir) {
    return path.join(__dirname, './', dir);
};

module.exports = {
    webpack: {
        resolve: {
            extensions: [' ', '.ux', '.js', '.json'],
            modules: [resolve('src'), resolve('node_modules')],
            alias: {
                '@src': resolve('src'),
                '@components': resolve('src/components'),
                '@constants': resolve('src/constants'),
                '@common': resolve('src/common'),
            }
        },
        module: {
            rules: [
                {
                    test: /\.less$/,
                    use: [
                        {
                            loader: 'less-loader',
                            options: {
                                lessOptions: {
                                    javascriptEnabled: true,
                                },
                            },
                        },
                    ],
                },
            ],
        },
    },
}
