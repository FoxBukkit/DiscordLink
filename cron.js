'use strict';

const config = require('./config');
const Promise = require('bluebird');
const Discord = require('@doridian/discord.js');
const redis = require('./redis');
const util = require('./util');

const bot = Promise.promisifyAll(new Discord.Client({
	autoReconnect: true,
	compress: true,
	forceFetchUsers: true,
}));

util._setBot(bot);

bot.loginWithToken(config.botToken);
bot.on('ready', () => {
	const server = bot.servers[0];
	server.members.forEach(member => {
		return util.syncMCRolesForUser(member, server)
		.catch(err => console.error(err, err.stack));
	});
});
