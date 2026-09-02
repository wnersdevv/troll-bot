'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { SAKALAR, KATEGORILER, rastgeleSec } = require('../../utils/icerikHavuzu');
const { emoji } = require('../../utils/emojis');

const KATEGORI_ISIMLERI = {
  discord: 'Discord',
  oyun: 'Oyun',
  teknoloji: 'Teknoloji',
  arkadas: 'Arkadas',
  okul: 'Okul',
  is: 'Is',
  gunluk_hayat: 'Gunluk Hayat',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saka')
    .setDescription('Eglenceli sakalar')
    .addSubcommand((s) => s.setName('rastgele').setDescription('Rastgele bir saka gonderir'))
    .addSubcommand((s) =>
      s
        .setName('kategori')
        .setDescription('Belirli bir kategoriden saka gonderir')
        .addStringOption((opt) =>
          opt
            .setName('secim')
            .setDescription('Kategori sec')
            .setRequired(true)
            .addChoices(...KATEGORILER.map((k) => ({ name: KATEGORI_ISIMLERI[k] || k, value: k })))
        )
    )
    .addSubcommand((s) => s.setName('gunluk').setDescription('Gunun sakasini gosterir')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    let kategori;
    let saka;

    if (alt === 'kategori') {
      kategori = interaction.options.getString('secim');
      saka = rastgeleSec(SAKALAR[kategori]);
    } else if (alt === 'gunluk') {
      // Gune gore sabit bir "gunun sakasi" (herkes ayni gun ayni sakayi gorur)
      const gunIndex = Math.floor(Date.now() / 86400000);
      const tumSakalar = KATEGORILER.flatMap((k) => SAKALAR[k]);
      saka = tumSakalar[gunIndex % tumSakalar.length];
      kategori = 'gunluk';
    } else {
      kategori = rastgeleSec(KATEGORILER);
      saka = rastgeleSec(SAKALAR[kategori]);
    }

    const container = metinContainerOlustur([
      `# ${emoji('star')} ${alt === 'gunluk' ? 'Gunun Sakasi' : `Saka — ${KATEGORI_ISIMLERI[kategori] || kategori}`}`,
      saka,
    ]);

    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  },
};
