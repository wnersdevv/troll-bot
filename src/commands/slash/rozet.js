'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { Badge, UserProfile } = require('../../database/models');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rozet')
    .setDescription('Rozetleri goruntule')
    .addSubcommand((s) => s.setName('liste').setDescription('Tum mevcut rozetleri listele'))
    .addSubcommand((s) =>
      s
        .setName('kullanici')
        .setDescription('Bir kullanicinin rozetlerini goster')
        .addUserOption((o) => o.setName('kullanici').setDescription('Kullanici (bos birakirsan kendin)').setRequired(false))
    )
    .addSubcommand((s) => s.setName('ilerleme').setDescription('Rozet ilerlemeni goster')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();

    if (alt === 'liste') {
      const rozetler = await Badge.find().lean();
      if (!rozetler.length) {
        return interaction.reply({ content: `${emoji('loading')} Henuz tanimli rozet yok.`, ephemeral: true });
      }
      const satirlar = rozetler.map((r) => `${r.emoji} **${r.isim}** (${r.nadirlik}) — ${r.aciklama}`);
      const container = metinContainerOlustur(['# 🏅 Tum Rozetler', satirlar.join('\n')]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'kullanici' || alt === 'ilerleme') {
      const hedef = interaction.options.getUser('kullanici') || interaction.user;
      const profil = await UserProfile.findOne({ userId: hedef.id }).lean();
      const kullanicininRozetleri = profil?.badges || [];

      if (!kullanicininRozetleri.length) {
        const container = metinContainerOlustur(['# 🏅 Rozetler', `<@${hedef.id}> henuz rozet kazanmadi.`]);
        return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
      }

      const rozetDetaylari = await Badge.find({ key: { $in: kullanicininRozetleri } }).lean();
      const satirlar = rozetDetaylari.map((r) => `${r.emoji} **${r.isim}** — ${r.aciklama}`);

      const container = metinContainerOlustur([`# 🏅 <@${hedef.id}> Rozetleri`, satirlar.join('\n') || 'Rozet detayi bulunamadi.']);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }
  },
};
