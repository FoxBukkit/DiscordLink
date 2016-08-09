'use strict';

module.exports = {
	channels: {
		normal: '202948351027707905',
		staff: '202948384422756353'
	},
	guildId: '93446384836939776',
	botToken: '[REDACTED]',
	roles: {
		member: '202947245417431040',
		regular: '202947369308782593',
		trusted: '202947456537722880',
		trainee: '212645755666694144',
		admin: '202947498342350848',
		superadmin: '202947541598339072',
		doridian: '202947572090929152',
	},
	zeromq: {
		serverToBroker: [
			{
				mode: 'connect',
				uri: 'tcp://127.0.0.1:5557',
			},
		],
		brokerToServer: [
			{
				mode: 'connect',
				uri: 'tcp://127.0.0.1:5558',
			},
		],
	},
	hashSecret: '[REDACTED]',
	redis: {
		host: '127.0.0.1',
		port: 6379,
		db: 1,
		password: '[REDACTED]',
	},
};
