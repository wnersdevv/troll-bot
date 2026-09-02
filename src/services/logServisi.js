'use strict';

const chalk = require('chalk');
const { Log, GuildSettings } = require('../database/models');

async function logKaydet({ guildId, tur, aktorId = null, mesaj, detay = {} }) {
  try {
    await Log.create({ guildId, tur, aktorId, mesaj, detay });
  } catch (err) {
    console.error(chalk.red('[log] Veritabanina yazilamadi:'), err.message);
  }
}

/**
 * Guild'in ayarli log kanalina, eger aktifse, embed gonderir.
 */
async function guildKanalinaLogGonder(client, guildId, embed) {
  try {
    const ayar = await GuildSettings.findOne({ guildId });
    if (!ayar || !ayar.logEnabled || !ayar.logChannelId) return;

    const kanal = await client.channels.fetch(ayar.logChannelId).catch(() => null);
    if (!kanal || !kanal.isTextBased()) return;

    await kanal.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    console.error(chalk.red('[log] Kanala gonderilemedi:'), err.message);
  }
}

module.exports = { logKaydet, guildKanalinaLogGonder };
