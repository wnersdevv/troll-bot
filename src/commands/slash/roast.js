'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { ROASTLAR, rastgeleSec } = require('../../utils/icerikHavuzu');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Zararsiz, eglence amacli takilma sozleri (nefret soylemi icermez)')
    .addSubcommand((s) =>
      s
        .setName('kullanici')
        .setDescription('Bir kullaniciya roast atar (o kisinin rizasiyla eglenmek icindir)')
        .addUserOption((o) => o.setName('hedef').setDescription('Hedef kullanici').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('seviye')
            .setDescription('Roast seviyesi')
            .addChoices(
              { name: '🙂 Hafif', value: 'hafif' },
              { name: '😂 Normal', value: 'normal' },
              { name: '🔥 Sert', value: 'sert' }
            )
        )
    )
    .addSubcommand((s) =>
      s
        .setName('kendim')
        .setDescription('Kendine roast atar')
        .addStringOption((o) =>
          o
            .setName('seviye')
            .setDescription('Roast seviyesi')
            .addChoices(
              { name: '🙂 Hafif', value: 'hafif' },
              { name: '😂 Normal', value: 'normal' },
              { name: '🔥 Sert', value: 'sert' }
            )
        )
    )
    .addSubcommand((s) => s.setName('rastgele').setDescription('Rastgele bir uyeye roast atar')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const seviye = interaction.options.getString('seviye') || 'normal';

    let hedef;
    if (alt === 'kullanici') hedef = interaction.options.getUser('hedef');
    else if (alt === 'kendim') hedef = interaction.user;
    else hedef = interaction.guild?.members.cache.random()?.user || interaction.user;

    if (hedef?.bot) {
      return interaction.reply({ content: `${emoji('error')} Botlara roast atmanin bir anlami yok, zaten umursamiyorlar.`, ephemeral: true });
    }

    const sablon = rastgeleSec(ROASTLAR[seviye] || ROASTLAR.normal);
    const mesaj = sablon.replace('{hedef}', `<@${hedef.id}>`);

    const container = metinContainerOlustur([`# 🔥 Roast`, mesaj, '-# Tamamen eglence amaclidir.'], 0xdc2626);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  },
};
