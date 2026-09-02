'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { Achievement } = require('../../database/models');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('basari')
    .setDescription('Basarilarini goruntule')
    .addSubcommand((s) => s.setName('liste').setDescription('Tum basarilarini listele'))
    .addSubcommand((s) =>
      s
        .setName('kullanici')
        .setDescription('Bir kullanicinin basarilarini goster')
        .addUserOption((o) => o.setName('kullanici').setDescription('Kullanici').setRequired(true))
    )
    .addSubcommand((s) => s.setName('ilerleme').setDescription('Devam eden basarilarindaki ilerlemeni goster'))
    .addSubcommand((s) => s.setName('tamamlanan').setDescription('Tamamlanan basarilarini goster')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const hedef = alt === 'kullanici' ? interaction.options.getUser('kullanici') : interaction.user;

    let filtre = { userId: hedef.id };
    if (alt === 'tamamlanan') filtre.tamamlandi = true;
    if (alt === 'ilerleme') filtre.tamamlandi = false;

    const kayitlar = await Achievement.find(filtre).lean();

    if (!kayitlar.length) {
      return interaction.reply({ content: `${emoji('loading')} Gosterilecek bir basari kaydi bulunamadi.`, ephemeral: true });
    }

    const satirlar = kayitlar.map((b) => {
      const durum = b.tamamlandi ? '🏆' : `${b.ilerleme}/${b.hedefSayi}`;
      return `${b.tamamlandi ? '🏆' : '🔲'} **${b.baslik}** — ${durum}\n-# ${b.aciklama}`;
    });

    const container = metinContainerOlustur([`# 🏆 <@${hedef.id}> Basarilari`, satirlar.join('\n\n')]);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
  },
};
