'use strict';

const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { ayarlar } = require('../../utils/ayarlar');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('destek')
    .setDescription('Destek sunucusuna ulas')
    .addSubcommand((s) => s.setName('sunucu').setDescription('Destek sunucusu davetini gonderir')),

  async execute(interaction) {
    const a = ayarlar();
    const container = metinContainerOlustur([
      '# 💬 Destek',
      'Sorularin veya geri bildirimlerin icin destek sunucumuza katilabilirsin.',
    ]);
    const buton = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('💬 Destek Sunucusuna Katil').setStyle(ButtonStyle.Link).setURL(a.discord.supportServer)
    );
    await interaction.reply({ components: [container, buton], flags: COMPONENTS_V2_FLAG, ephemeral: true });
  },
};
