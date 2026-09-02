'use strict';

const chalk = require('chalk');
const { Events, ActivityType } = require('discord.js');
const { ayarlar } = require('../../utils/ayarlar');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    const a = ayarlar();
    console.log(chalk.green(`[hazir] ${client.user.tag} olarak giris yapildi.`));
    console.log(chalk.gray(`[hazir] ${client.guilds.cache.size} sunucuda aktif.`));

    client.user.setPresence({
      activities: [{ name: `${a.bot.name} • /yardim`, type: ActivityType.Playing }],
      status: 'online',
    });
  },
};
