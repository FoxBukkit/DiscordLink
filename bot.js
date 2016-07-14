'use strict';

const config = require('./config');
const Promise = require('bluebird');
const Discord = require('discord.js');
const crypto = require('crypto');
const redis = Promise.promisifyAll(require('redis')
.createClient(config.redis.port, config.redis.host, {
    password: config.redis.password,
    db: config.redis.db,
}));
const bot = Promise.promisifyAll(new Discord.Client());

const ROLE_MAPPING = config.roles;

const MANAGED_ROLES = {};
for (const i in ROLE_MAPPING) {
	MANAGED_ROLES[ROLE_MAPPING[i]] = true;
}

function getMCUUIDForUser (user) {
	return redis.hgetAsync('discordlinks:discord-to-mc', user.id);
}

function getMCRoleForUser (user) {
	return getMCUUIDForUser(user)
	.then(uuid => {
		console.log(uuid);
		if (uuid) {
			return redis.hgetAsync('playergroups', uuid);
		}
		return null;
	})
	.then(role => {
		console.log(role);
		if (role && ROLE_MAPPING[role]) {
			return role;
		}
		return null;
	});
}

function syncMCRolesForUser (user) {
	return getMCRoleForUser(user)
	.then(redisMCRole => {
		const correctDiscordRole = ROLE_MAPPING[redisMCRole];
		const details = bot.servers[0].detailsOfUser(user);

		const rolesToRemove = [];
		let hasCorrectRole = false;
		details.roles.forEach(role => {
			if (role.id === correctDiscordRole) {
				hasCorrectRole = true;
			} else if(MANAGED_ROLES[role.id]) {
				rolesToRemove.push(role.id);
			}
		});

		let promise = Promise.resolve();

		if (!hasCorrectRole && correctDiscordRole) {
			promise = promise.then(() =>
				bot.addMemberToRoleAsync(user, correctDiscordRole));
		}

		if (rolesToRemove.length > 0) {
			promise = promise.then(() =>
				bot.removeMemberFromRoleAsync(user, rolesToRemove));
		}

		return promise;
	});
}

bot.on('message', message => {
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

	syncMCRolesForUser(message.author)
	.then(() => bot.deleteMessageAsync(message));
});

module.exports = {
	start () {
		return new Promise((resolve, reject) => {
			bot.loginWithToken(config.botToken);
			bot.on('ready', () => {
				resolve();
			});
		});
	},
	sendMessage (channel, message) {
		return bot.sendMessageAsync(channel, message);
	},
};
