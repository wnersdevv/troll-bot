'use strict';

const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { UserProfile, TrollStats, GameStats, Currency } = require('../../database/models');
const { hesapGetirVeyaOlustur } = require('../../services/ekonomiServisi');
const { profilKartiOlustur } = require('../../canvas/profilKarti');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');

function kazanmaOraniHesapla(oyunlarMap) {
  if (!oyunlarMap) return 0;
  let toplamOynanan = 0;
  let toplamKazanilan = 0;
  for (const istatistik of oyunlarMap.values()) {
    toplamOynanan += istatistik.oynanan;
    toplamKazanilan += istatistik.kazanilan;
  }
  if (toplamOynanan === 0) return 0;
  return Math.round((toplamKazanilan / toplamOynanan) * 100);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Profil kartini goruntule')
    .addSubcommand((s) =>
      s
        .setName('goruntule')
        .setDescription('Bir kullanicinin profil kartini goster')
        .addUserOption((o) => o.setName('kullanici').setDescription('Kullanici (bos birakirsan kendin)').setRequired(false))
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const hedef = interaction.options.getUser('kullanici') || interaction.user;

    let profil = await UserProfile.findOne({ userId: hedef.id });
    if (!profil) {
      profil = await UserProfile.create({ userId: hedef.id, username: hedef.username });
    }

    const [hesap, trollIstatistik, oyunIstatistik] = await Promise.all([
      hesapGetirVeyaOlustur(hedef.id),
      TrollStats.findOne({ userId: hedef.id }),
      GameStats.findOne({ userId: hedef.id }),
    ]);

    const gerekliXp = (profil.level + profil.prestij * 10) * 100;
    const kazanmaOrani = kazanmaOraniHesapla(oyunIstatistik?.oyunlar);

    const buffer = await profilKartiOlustur({
      username: hedef.username,
      avatarURL: hedef.displayAvatarURL({ extension: 'png', size: 256 }),
      level: profil.level,
      xp: profil.xp,
      gerekliXp,
      coin: hesap.bakiye,
      trollPuan: trollIstatistik?.puan ?? 0,
      badgeSayisi: profil.badges?.length ?? 0,
    });

    const ek = new AttachmentBuilder(buffer, { name: 'profil-karti.png' });

    const detayContainer = metinContainerOlustur([
      `# ${profil.seciliUnvan ? `「${profil.seciliUnvan}」 ` : ''}${hedef.username}`,
      [
        `⭐ Prestij: ${profil.prestij}`,
        `🏦 Banka: ${hesap.banka}`,
        `🎮 Guncel Seri: ${oyunIstatistik?.guncelSeri ?? 0} | En Uzun Seri: ${oyunIstatistik?.enUzunSeri ?? 0}`,
        `📊 Kazanma Orani: %${kazanmaOrani}`,
      ].join('\n'),
    ]);

    await interaction.editReply({ files: [ek], components: [detayContainer], flags: COMPONENTS_V2_FLAG });
  },
};
