'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { KADERLER, rastgeleSec } = require('../../utils/icerikHavuzu');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kader')
    .setDescription('Bugunku (tamamen eglence amacli) kaderine bak')
    .addSubcommand((s) => s.setName('bugun').setDescription('Bugunku kaderin'))
    .addSubcommand((s) => s.setName('rastgele').setDescription('Rastgele bir kader mesaji')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    let mesaj;

    if (alt === 'bugun') {
      // Kullaniciya ve gune ozel deterministik secim -> ayni gun tekrar sorunca ayni sonuc
      const gunIndex = Math.floor(Date.now() / 86400000);
      let toplam = 0;
      for (const c of interaction.user.id) toplam += c.charCodeAt(0);
      mesaj = KADERLER[(toplam + gunIndex) % KADERLER.length];
    } else {
      mesaj = rastgeleSec(KADERLER);
    }

    const container = metinContainerOlustur([`# ${emoji('crystalBall')} Kader`, mesaj, '-# Sadece eglence amaclidir.'], 0x7c3aed);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  },
};
