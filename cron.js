'use strict';

const config = require('./config');
const Promise = require('bluebird');
const Discord = require('@doridian/discord.js');
const redis = require('./redis');
const util = require('./util');

const bot = Promise.promisifyAll(new Discord.Client(
	autoReconnect: true,
	compress: true,
	forceFetchUsers: true,
));

bot.loginWithToken(config.botToken);
bot.on('ready', () => {
	bot.servers[0].members.forEach(member => {
		return util.syncMCRolesForUser(member)
		.catch(err => console.error(err));
	});
});
