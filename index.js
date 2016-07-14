'use strict';

const bot = require('./bot');
const chat = require('./chat');

bot.start().then(() => {
	chat.setBot(bot);
	chat.start();
});
