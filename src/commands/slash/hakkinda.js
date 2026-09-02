'use strict';

const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { ayarlar } = require('../../utils/ayarlar');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hakkinda')
    .setDescription('Bot hakkinda bilgi al')
    .addSubcommand((s) => s.setName('bot').setDescription('Bot hakkinda genel bilgi'))
    .addSubcommand((s) => s.setName('gelistirici').setDescription('Gelistirici bilgisi')),

  async execute(interaction) {
    const a = ayarlar();
    const alt = interaction.options.getSubcommand();

    const icerik =
      alt === 'gelistirici'
        ? [`# 👤 Gelistirici`, `Bu bot **${a.bot.developer}** tarafindan gelistirilmistir.`]
        : [
            `# 🤡 ${a.bot.name}`,
            `Surum: **${a.bot.version}**\nGelistirici: **${a.bot.developer}**\nDil: Turkce (yerellestirme destekli)\n\nSunucunun ciddiyet seviyesini dusurmek icin profesyonel bir eglence cozumu. 😂`,
          ];

    const container = metinContainerOlustur(icerik);
    const buton = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('💬 Destek Sunucusu').setStyle(ButtonStyle.Link).setURL(a.discord.supportServer)
    );

    await interaction.reply({ components: [container, buton], flags: COMPONENTS_V2_FLAG });
  },
};
