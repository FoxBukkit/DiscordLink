'use strict';

const config = require('./config');

module.exports = require('bluebird').promisifyAll(require('redis')
.createClient(config.redis.port, config.redis.host, {
    password: config.redis.password,
    db: config.redis.db,
}));
