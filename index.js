'use strict';

const bot = require('./bot');
const chat = require('./chat');

bot.setChat(chat);
chat.setBot(bot);

bot.start()
.then(() => chat.start())
.then(() => console.log('Bot online'));
