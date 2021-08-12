
const mongoose = require('mongoose');
const { MONGO } = require('./src/config/config');

const connectMongoose = () => {
    mongoose.connect(MONGO.url, MONGO.options);

    mongoose.connection.on('connecting', () => console.info('database connecting'));
    mongoose.connection.on('connected', () =>
        console.log('database connected'),
    );
    mongoose.connection.on('disconnecting', () =>
        console.info('database disconnecting'),
    );
    mongoose.connection.on('disconnected', () =>
        console.info('database disconnected'),
    );
    mongoose.connection.on('error', () => console.error('database error'));
}


module.exports = connectMongoose
