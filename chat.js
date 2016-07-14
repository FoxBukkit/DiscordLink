'use strict';

const zmq = require('zmq');
const config = require('./config');
const proto = require('./proto');

const COLOR_CODES = /\u00a7./g;
const XML_TAGS = /<[^>]>/g;

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
			} else if(decoded.to.type === proto.TargetType_PERMISSION) {
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

			const filteredMessage = decoded.contents.replace(XML_TAGS, '').replace(COLOR_CODES, '');
			discordBot.sendMessage(targetChannel, filteredMessage);
		});

		zmqSocket.subscribe('CMO');
	},
	setBot (bot) {
		discordBot = bot;
	}
};