'use strict';

const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { TrollHistory, GameHistory, Quest, Achievement } = require('../../database/models');

const SAYFA_BOYUTU = 5;

async function veriGetir(tur, userId) {
  if (tur === 'troll') {
    const kayitlar = await TrollHistory.find({ $or: [{ kaynakUserId: userId }, { hedefUserId: userId }] }).sort({ createdAt: -1 }).lean();
    return kayitlar.map((k) => {
      const rol = k.kaynakUserId === userId ? '➡️ Gonderdin' : '⬅️ Aldin';
      return `${rol}: ${k.icerik}`;
    });
  }
  if (tur === 'oyun') {
    const kayitlar = await GameHistory.find({ userId }).sort({ createdAt: -1 }).lean();
    return kayitlar.map((k) => `🎮 ${k.oyunAdi} — ${k.sonuc}`);
  }
  if (tur === 'gorev') {
    const kayitlar = await Quest.find({ userId, tamamlandi: true }).sort({ updatedAt: -1 }).lean();
    return kayitlar.map((k) => `✅ ${k.baslik}`);
  }
  if (tur === 'basari') {
    const kayitlar = await Achievement.find({ userId, tamamlandi: true }).sort({ tamamlanmaTarihi: -1 }).lean();
    return kayitlar.map((k) => `🏆 ${k.baslik}`);
  }
  return [];
}

function sayfaGoster(satirlar, sayfa) {
  const baslangic = sayfa * SAYFA_BOYUTU;
  const dilim = satirlar.slice(baslangic, baslangic + SAYFA_BOYUTU);
  const toplamSayfa = Math.max(1, Math.ceil(satirlar.length / SAYFA_BOYUTU));
  return { icerik: dilim.join('\n\n') || 'Kayit bulunamadi.', toplamSayfa };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gecmis')
    .setDescription('Gecmis kayitlarini goruntule (sayfalanmis)')
    .addSubcommand((s) => s.setName('troll').setDescription('Troll gecmisin'))
    .addSubcommand((s) => s.setName('oyun').setDescription('Oyun gecmisin'))
    .addSubcommand((s) => s.setName('gorev').setDescription('Tamamlanan gorev gecmisin'))
    .addSubcommand((s) => s.setName('basari').setDescription('Tamamlanan basari gecmisin')),

  async execute(interaction) {
    const tur = interaction.options.getSubcommand();
    const tumSatirlar = await veriGetir(tur, interaction.user.id);

    let sayfa = 0;
    const { icerik, toplamSayfa } = sayfaGoster(tumSatirlar, sayfa);

    const satirButonlari = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('gecmis:geri').setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('gecmis:ileri').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(toplamSayfa <= 1)
    );

    const container = metinContainerOlustur([`# 📜 Gecmis — ${tur} (Sayfa ${sayfa + 1}/${toplamSayfa})`, icerik]);

    const yanit = await interaction.reply({
      components: [container, satirButonlari],
      flags: COMPONENTS_V2_FLAG,
      ephemeral: true,
      withResponse: true,
    });

    const mesaj = yanit.resource?.message || (await interaction.fetchReply());
    const toplayici = mesaj.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 60000 });

    toplayici.on('collect', async (i) => {
      if (i.customId === 'gecmis:ileri') sayfa += 1;
      if (i.customId === 'gecmis:geri') sayfa -= 1;

      const { icerik: yeniIcerik, toplamSayfa: yeniToplam } = sayfaGoster(tumSatirlar, sayfa);
      const yeniButonlar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('gecmis:geri').setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(sayfa <= 0),
        new ButtonBuilder().setCustomId('gecmis:ileri').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(sayfa >= yeniToplam - 1)
      );
      const yeniContainer = metinContainerOlustur([`# 📜 Gecmis — ${tur} (Sayfa ${sayfa + 1}/${yeniToplam})`, yeniIcerik]);

      await i.update({ components: [yeniContainer, yeniButonlar], flags: COMPONENTS_V2_FLAG });
    });
  },
};
