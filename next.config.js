require('dotenv').config();

const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

module.exports = {
    webpack: ( config, { dev } ) => {
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.FIREBASE_SENDER': JSON.stringify(process.env.FIREBASE_SENDER),
                'process.env.FIREBASE_PROJECT': JSON.stringify(process.env.FIREBASE_PROJECT),
                'process.env.FIREBASE_STORAGE': JSON.stringify(process.env.FIREBASE_STORAGE),
                'process.env.FIREBASE_DOMAIN': JSON.stringify(process.env.FIREBASE_DOMAIN),
                'process.env.FIREBASE_API': JSON.stringify(process.env.FIREBASE_API),
                'process.env.FIREBASE_DATABASE': JSON.stringify(process.env.FIREBASE_DATABASE)
            }) 
        );

        console.log( config.plugins);
      
        return config;
    }
}

