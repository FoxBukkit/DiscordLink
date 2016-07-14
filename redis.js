'use strict';

const config = require('./config');

const Promise = require('bluebird');
const redis = require('redis');

function createClient () {
	return Promise.promisifyAll(redis
	.createClient(config.redis.port, config.redis.host, {
	    password: config.redis.password,
	    db: config.redis.db,
	}));
}

module.exports = createClient();
module.exports.newClient = createClient;
