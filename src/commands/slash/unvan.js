'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { UserProfile } = require('../../database/models');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unvan')
    .setDescription('Kazandigin unvanlari yonet')
    .addSubcommand((s) => s.setName('liste').setDescription('Kazandigin unvanlari goster'))
    .addSubcommand((s) =>
      s
        .setName('sec')
        .setDescription('Profilinde gosterilecek unvani sec')
        .addStringOption((o) => o.setName('unvan').setDescription('Kazandigin bir unvan').setRequired(true))
    )
    .addSubcommand((s) => s.setName('kaldir').setDescription('Secili unvani kaldir')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    let profil = await UserProfile.findOne({ userId });
    if (!profil) profil = await UserProfile.create({ userId, username: interaction.user.username });

    if (alt === 'liste') {
      if (!profil.kazanilanUnvanlar.length) {
        return interaction.reply({ content: `${emoji('loading')} Henuz bir unvan kazanmadin.`, ephemeral: true });
      }
      const satirlar = profil.kazanilanUnvanlar.map((u) => (u === profil.seciliUnvan ? `✅ **${u}** (secili)` : `🔲 ${u}`));
      const container = metinContainerOlustur(['# 🏷️ Unvanlarin', satirlar.join('\n')]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'sec') {
      const unvan = interaction.options.getString('unvan');
      if (!profil.kazanilanUnvanlar.includes(unvan)) {
        return interaction.reply({ content: `${emoji('error')} Bu unvana sahip degilsin. \`/unvan liste\` ile kazandiklarini gorebilirsin.`, ephemeral: true });
      }
      profil.seciliUnvan = unvan;
      await profil.save();
      return interaction.reply({ content: `${emoji('success')} Unvanin **${unvan}** olarak ayarlandi.`, ephemeral: true });
    }

    if (alt === 'kaldir') {
      profil.seciliUnvan = null;
      await profil.save();
      return interaction.reply({ content: `${emoji('success')} Secili unvan kaldirildi.`, ephemeral: true });
    }
  },
};
