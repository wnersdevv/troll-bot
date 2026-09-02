'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { UserProfile, TrollStats, Achievement } = require('../../database/models');
const { bakiyeGetir } = require('../../services/ekonomiServisi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kullanici')
    .setDescription('Bir kullanici hakkinda bilgi al')
    .addSubcommand((s) =>
      s
        .setName('bilgi')
        .setDescription('Genel kullanici bilgisi')
        .addUserOption((o) => o.setName('kullanici').setDescription('Kullanici').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('istatistik')
        .setDescription('Kullanicinin troll/oyun istatistigi')
        .addUserOption((o) => o.setName('kullanici').setDescription('Kullanici').setRequired(false))
    ),

  async execute(interaction) {
    const hedef = interaction.options.getUser('kullanici') || interaction.user;
    const alt = interaction.options.getSubcommand();

    if (alt === 'bilgi') {
      const uye = interaction.guild ? await interaction.guild.members.fetch(hedef.id).catch(() => null) : null;
      const katilmaTarihi = uye?.joinedAt ? `<t:${Math.floor(uye.joinedAt.getTime() / 1000)}:D>` : 'Bilinmiyor';
      const hesapOlusturma = `<t:${Math.floor(hedef.createdTimestamp / 1000)}:D>`;

      const container = metinContainerOlustur([
        `# 👤 ${hedef.username}`,
        `**ID:** ${hedef.id}\n**Hesap Olusturma:** ${hesapOlusturma}\n**Sunucuya Katilma:** ${katilmaTarihi}\n**Bot mu:** ${hedef.bot ? 'Evet' : 'Hayir'}`,
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    // istatistik
    const [coin, troll, basariSayisi] = await Promise.all([
      bakiyeGetir(hedef.id),
      TrollStats.findOne({ userId: hedef.id }).lean(),
      Achievement.countDocuments({ userId: hedef.id, tamamlandi: true }),
    ]);

    const container = metinContainerOlustur([
      `# 📊 ${hedef.username} — Istatistik`,
      [
        `🪙 Coin: ${coin}`,
        `🤡 Troll Puani: ${troll?.puan ?? 0}`,
        `🎯 Yapilan Troll: ${troll?.trollYapilan ?? 0}`,
        `🏆 Tamamlanan Basari: ${basariSayisi}`,
      ].join('\n'),
    ]);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
  },
};
