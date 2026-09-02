'use strict';

const { SlashCommandBuilder, version: djsVersion } = require('discord.js');
const mongoose = require('mongoose');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sistem')
    .setDescription('Bot sistem bilgilerini goster')
    .addSubcommand((s) => s.setName('durum').setDescription('Genel sistem durumu'))
    .addSubcommand((s) => s.setName('ping').setDescription('Gecikme (ping) bilgisi'))
    .addSubcommand((s) => s.setName('uptime').setDescription('Botun ne kadar suredir acik oldugu')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const client = interaction.client;

    if (alt === 'ping') {
      const baslangic = Date.now();
      await interaction.deferReply();
      const gecikme = Date.now() - baslangic;
      const container = metinContainerOlustur([
        '# 🏓 Ping',
        `Discord API: **${client.ws.ping}ms**\nIslem suresi: **${gecikme}ms**`,
      ]);
      return interaction.editReply({ components: [container], flags: COMPONENTS_V2_FLAG });
    }

    if (alt === 'uptime') {
      const saniye = Math.floor(client.uptime / 1000);
      const saat = Math.floor(saniye / 3600);
      const dakika = Math.floor((saniye % 3600) / 60);
      const container = metinContainerOlustur(['# ⏱️ Calisma Suresi', `**${saat} saat ${dakika} dakika**dir acik.`]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
    }

    // durum
    const mongoDurum = mongoose.connection.readyState === 1 ? '🟢 Bagli' : '🔴 Kopuk';
    const hafiza = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    const container = metinContainerOlustur([
      '# 🩺 Sistem Durumu',
      [
        `Discord API: 🟢 Online (${client.ws.ping}ms)`,
        `MongoDB: ${mongoDurum}`,
        `Sunucu Sayisi: ${client.guilds.cache.size}`,
        `Komut Sayisi: ${client.commands?.size ?? 0}`,
        `Node.js: ${process.version}`,
        `discord.js: v${djsVersion}`,
        `Bellek Kullanimi: ${hafiza}MB`,
      ].join('\n'),
    ]);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  },
};
