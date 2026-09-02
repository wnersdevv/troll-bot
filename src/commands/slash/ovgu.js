'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { OVGULER, rastgeleSec } = require('../../utils/icerikHavuzu');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ovgu')
    .setDescription('Birine (veya kendine) guzel bir ovgu gonder')
    .addSubcommand((s) =>
      s
        .setName('kullanici')
        .setDescription('Bir kullaniciya ovgu gonder')
        .addUserOption((o) => o.setName('hedef').setDescription('Hedef kullanici').setRequired(true))
    )
    .addSubcommand((s) => s.setName('rastgele').setDescription('Rastgele bir uyeye ovgu gonder')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const hedef = alt === 'kullanici' ? interaction.options.getUser('hedef') : interaction.guild?.members.cache.random()?.user || interaction.user;

    const sablon = rastgeleSec(OVGULER.genel);
    const mesaj = sablon.replace('{hedef}', `<@${hedef.id}>`);

    const container = metinContainerOlustur([`# ${emoji('heart')} Ovgu`, mesaj], 0xec4899);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  },
};
