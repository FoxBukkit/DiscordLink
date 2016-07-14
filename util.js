'use strict';

const uuid = require('uuid');
const Long = require('long');

const redis = require('./redis');
const config = require('./config');

const ROLE_MAPPING = config.roles;

const MANAGED_ROLES = {};
for (const i in ROLE_MAPPING) {
	MANAGED_ROLES[ROLE_MAPPING[i]] = true;
}

let bot;

module.exports._setBot = function (newBot) {
	bot = newBot;
};

module.exports.loadZMQConfig = function loadZMQConfig (config, socket) {
	config.forEach(function (srv) {
		switch (srv.mode.toLowerCase()) {
			case 'bind':
				socket.bind(srv.uri);
				break;
			case 'connect':
				socket.connect(srv.uri);
				break;
		}
	});
};

module.exports.getMCUUIDForUser = function getMCUUIDForUser (user) {
	return redis.hgetAsync('discordlinks:discord-to-mc', user.id);
};

module.exports.getMCRoleForUser = function getMCRoleForUser (user) {
	return getMCUUIDForUser(user)
	.then(uuid => {
		if (uuid) {
			return redis.hgetAsync('playergroups', uuid);
		}
		return null;
	})
	.then(role => {
		if (role && ROLE_MAPPING[role]) {
			return role;
		}
		return null;
	});
};

module.exports.syncMCRolesForUser = function syncMCRolesForUser (user) {
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
};


module.exports.writeProtobufUUID = function writeProtobufUUID (uuidUuid) {
	var buffer = new ArrayBuffer(16); // 16 bytes = 128 bits
	var view = new Uint8Array(buffer);
	uuid.parse(uuidUuid, view, 0);
	var dataview = new DataView(buffer);
	return {
		msb: new Long(dataview.getInt32(4), dataview.getInt32(0)),
		lsb: new Long(dataview.getInt32(12), dataview.getInt32(8))
	};
};

module.exports.getUnixTime = function () {
	return Math.floor(Date.now() / 1000);
};
