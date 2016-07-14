'use strict';

const config = require('./config');
const Promise = require('bluebird');
const Discord = require('@doridian/discord.js');
const crypto = require('crypto');
const redis = require('./redis');
const util = require('./util');

const bot = Promise.promisifyAll(new Discord.Client());

let chat;

bot.on('message', message => {
	if (message.author.id === bot.user.id) {
		return;
	}

	let translatedMessage = null;

	if (message.channel instanceof Discord.PMChannel) {
		if (message.content === '/discordlink') {
			const hash = crypto.createHash('md5')
				.update(message.author.id, 'utf8')
				.update(config.hashSecret, 'utf8')
				.update(new Date().toString(), 'utf8')
				.digest('hex');

			redis.setexAsync('discordlink:key:' + hash, 900, message.author.id)
			.then(() => 
				bot.sendMessageAsync(message.channel, 
					'Please paste this in Minecraft chat: ' +
					'`/discordlink ' + hash + '`'
				)
			);
		}
		return;
	}

	if (message.channel.id === config.channels.normal) {
		translatedMessage = message.content;
	} else if (message.channel.id === config.channels.staff) {
		translatedMessage = '/opchat ' + message.content;
	}

	if (!translatedMessage) {
		return;
	}

	util.getMCUUIDForUser(message.author)
	.then(uuid => {
		if (uuid) {
			return chat.sendMessage(uuid, translatedMessage);
		}
	})
	.then(() => bot.deleteMessageAsync(message));
});

util._setBot(bot);

module.exports = {
	start () {
		return new Promise((resolve, reject) => {
			bot.loginWithToken(config.botToken);
			bot.on('ready', resolve);
		});
	},
	sendMessage (channel, message) {
		return bot.sendMessageAsync(channel, message);
	},
	setChat (newChat) {
		chat = newChat;
	},
	bot: bot,
};
