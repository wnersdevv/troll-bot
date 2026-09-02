'use strict';

const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const {
  UserProfile,
  TrollStats,
  TrollHistory,
  GameStats,
  GameHistory,
  Currency,
  DailyReward,
  Quest,
  Achievement,
} = require('../../database/models');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('veri')
    .setDescription('Kendi verilerini yonet (KVKK/GDPR uyumlu)')
    .addSubcommand((s) => s.setName('goruntule').setDescription('Kayitli verilerinin ozetini goster'))
    .addSubcommand((s) => s.setName('disa-aktar').setDescription('Tum verilerini JSON dosyasi olarak indir'))
    .addSubcommand((s) => s.setName('sil').setDescription('Tum verilerini kalici olarak sil')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (alt === 'goruntule') {
      const [profil, troll, coin, gunluk] = await Promise.all([
        UserProfile.findOne({ userId }).lean(),
        TrollStats.findOne({ userId }).lean(),
        Currency.findOne({ userId }).lean(),
        DailyReward.findOne({ userId }).lean(),
      ]);

      const container = metinContainerOlustur([
        `# 🧹 Kayitli Verilerin`,
        [
          `Profil kaydi: ${profil ? '✅' : '❌'}`,
          `Troll istatistigi: ${troll ? '✅' : '❌'}`,
          `Coin hesabi: ${coin ? `✅ (${coin.bakiye} coin)` : '❌'}`,
          `Gunluk odul kaydi: ${gunluk ? `✅ (streak: ${gunluk.streak})` : '❌'}`,
        ].join('\n'),
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'disa-aktar') {
      await interaction.deferReply({ ephemeral: true });

      const [profil, troll, trollGecmis, oyunIstatistik, oyunGecmis, coin, gunluk, gorevler, basarimlar] = await Promise.all([
        UserProfile.findOne({ userId }).lean(),
        TrollStats.findOne({ userId }).lean(),
        TrollHistory.find({ $or: [{ kaynakUserId: userId }, { hedefUserId: userId }] }).lean(),
        GameStats.findOne({ userId }).lean(),
        GameHistory.find({ userId }).lean(),
        Currency.findOne({ userId }).lean(),
        DailyReward.findOne({ userId }).lean(),
        Quest.find({ userId }).lean(),
        Achievement.find({ userId }).lean(),
      ]);

      const veriPaketi = {
        userId,
        disaAktarmaTarihi: new Date().toISOString(),
        profil,
        troll,
        trollGecmis,
        oyunIstatistik,
        oyunGecmis,
        coin,
        gunluk,
        gorevler,
        basarimlar,
      };

      const ek = new AttachmentBuilder(Buffer.from(JSON.stringify(veriPaketi, null, 2)), {
        name: `wnersdev-veri-${userId}.json`,
      });

      return interaction.editReply({ content: `${emoji('success')} Verilerin hazir.`, files: [ek] });
    }

    if (alt === 'sil') {
      await Promise.all([
        UserProfile.deleteOne({ userId }),
        TrollStats.deleteOne({ userId }),
        TrollHistory.deleteMany({ $or: [{ kaynakUserId: userId }, { hedefUserId: userId }] }),
        GameStats.deleteOne({ userId }),
        GameHistory.deleteMany({ userId }),
        Currency.deleteOne({ userId }),
        DailyReward.deleteOne({ userId }),
        Quest.deleteMany({ userId }),
        Achievement.deleteMany({ userId }),
      ]);

      return interaction.reply({ content: `${emoji('success')} Tum verilerin kalici olarak silindi.`, ephemeral: true });
    }
  },
};
