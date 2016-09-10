'use strict';

const config = require('./config');
const Promise = require('bluebird');
const Discord = require('@doridian/discord.js');
const redis = require('./redis');
const util = require('./util');

const bot = new Discord.Client({
	autoReconnect: true,
	compress: true,
	forceFetchUsers: true,
});

bot.loginWithToken(config.botToken);
bot.on('ready', () => {
	return Promise.each(bot.servers[0].members, member => {
		return util.syncMCRolesForUser(member.id, bot)
		.catch(err => console.error(err, err.stack));
	})
	.finally(() => process.exit(0));
});
