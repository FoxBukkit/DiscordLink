'use strict';

const xmlEntities = new require('html-entities').XmlEntities;
const zmq = require('zmq');
const uuid = require('uuid');

const redis = require('./redis');
const config = require('./config');
const proto = require('./proto');
const util = require('./util');

const zmqSocket = zmq.socket('push');
util.loadZMQConfig(config.zeromq.serverToBroker, zmqSocket);

const COLOR_CODES = /\u00a7./g;
const XML_TAGS = /<[^>]*>/g;

let discordBot;

module.exports = {
	start() {
		const zmqSocket = zmq.socket('sub');
		util.loadZMQConfig(config.zeromq.brokerToServer, zmqSocket);

		zmqSocket.on('message', (topic, messageProto) => {
			var decoded = proto.ChatMessageOut.decode(messageProto);
			if (decoded.type !== proto.MessageType.TEXT) {
				return;
			}

			let targetChannel = null;
			if (!decoded.to || decoded.to.type === proto.TargetType.ALL) {
				targetChannel = config.channels.normal;
			} else if(decoded.to.type === proto.TargetType.PERMISSION) {
				decoded.to.filter.some(target => {
					if (target === 'foxbukkit.opchat') {
						targetChannel = config.channels.staff;
						return true;
					}
				});
			}

			if (!targetChannel) {
				return;
			}

			const filteredMessage = xmlEntities.decode(decoded.contents.replace(XML_TAGS, '').replace(COLOR_CODES, ''));
			discordBot.sendMessage(targetChannel, filteredMessage);
		});

		zmqSocket.subscribe('CMO');
	},
	setBot (bot) {
		discordBot = bot;
	},
	sendMessage (playerUuid, message) {
		const context = uuid.v4();

		return redis.hgetAsync('playerUUIDToName', playerUuid)
		.then(playerName =>
			zmqSocket.send((new proto.ChatMessageIn({
				server: 'Discord',
				from: {
					uuid: util.writeProtobufUUID(playerUuid),
					name: playerName,
				},
				timestamp: util.getUnixTime(),
				context: util.writeProtobufUUID(context),
				type: proto.MessageType.TEXT,
				contents: message,
			})).encode().toBuffer())
		)
		.thenReturn(context);
	},
};