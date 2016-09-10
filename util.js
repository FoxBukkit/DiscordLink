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

let guild;

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

function getDiscordIDForUser (uuid) {
	return redis.hgetAsync('discordlinks:mc-to-discord', uuid);
}
module.exports.getDiscordIDForUser = getDiscordIDForUser;

function getMCUUIDForUser (user) {
	return redis.hgetAsync('discordlinks:discord-to-mc', user.id ? user.id : user);
}
module.exports.getMCUUIDForUser = getMCUUIDForUser;

function getMCRoleForUser (user) {
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
}
module.exports.getMCRoleForUser = getMCRoleForUser;

function syncMCRolesForUser (userId) {
	return getMCRoleForUser(userId)
	.then(redisMCRole => {
		const correctDiscordRole = ROLE_MAPPING[redisMCRole];

		const user = guild.members.get(userId);

		const roles = user.roles.array();

		console.log(roles.length, roles, correctDiscordRole);

		if (correctDiscordRole) {
			if (roles.length === 1 && roles[0].id === correctDiscordRole) {
				return;
			}
			return user.setRoles([correctDiscordRole]);
		} else {
			if (roles.length === 0) {
				return;
			}
			return user.setRoles([]);
		}
	});
}
module.exports.syncMCRolesForUser = syncMCRolesForUser;

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

module.exports._setGuild = function (_guild) {
	guild = _guild;
};

const subRedis = redis.newClient();
subRedis.on('message', (channel, message) => {
	getDiscordIDForUser(message)
	.then(id => {
		if (!guild) {
			return;
		}

		if (id) {
			return syncMCRolesForUser(id, guild);
		}
	})
	.catch(err => console.error(err));
});
subRedis.subscribe('playerRankUpdate');