'use strict';

const { Events } = require('discord.js');
const { GuildSettings } = require('../../database/models');
const { logKaydet } = require('../../services/logServisi');

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    await GuildSettings.findOneAndUpdate(
      { guildId: guild.id },
      { $setOnInsert: { guildId: guild.id } },
      { upsert: true }
    );

    await logKaydet({
      guildId: guild.id,
      tur: 'yonetim',
      mesaj: `Bot "${guild.name}" sunucusuna eklendi.`,
    });
  },
};
