'use strict';

const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { Envanter, Item, UserProfile, KullaniciKasasi, Badge } = require('../../database/models');
const { nadirlikAdi, nadirlikEmojisi } = require('../../utils/nadirlik');

const SAYFA_BOYUTU = 6;

async function envanterSatirlariGetir(userId) {
  const [itemKayitlari, kasaKayitlari, profil] = await Promise.all([
    Envanter.find({ userId, adet: { $gt: 0 } }).lean(),
    KullaniciKasasi.find({ userId, adet: { $gt: 0 } }).lean(),
    UserProfile.findOne({ userId }).lean(),
  ]);

  const satirlar = [];

  if (itemKayitlari.length) {
    const itemKeyleri = itemKayitlari.map((k) => k.itemKey);
    const itemDetaylari = await Item.find({ key: { $in: itemKeyleri } }).lean();
    const itemHaritasi = new Map(itemDetaylari.map((i) => [i.key, i]));

    for (const kayit of itemKayitlari) {
      const detay = itemHaritasi.get(kayit.itemKey);
      if (!detay) continue;
      satirlar.push(`${detay.emoji} **${detay.isim}** x${kayit.adet} — ${nadirlikEmojisi(detay.rarity)} ${nadirlikAdi(detay.rarity)}`);
    }
  }

  for (const kasa of kasaKayitlari) {
    satirlar.push(`📦 **${kasa.kasaKey}** kasasi x${kasa.adet}`);
  }

  if (profil?.badges?.length) {
    const rozetDetaylari = await Badge.find({ key: { $in: profil.badges } }).lean();
    for (const rozet of rozetDetaylari) {
      satirlar.push(`${rozet.emoji} **${rozet.isim}** (rozet)`);
    }
  }

  return satirlar;
}

function sayfaHazirla(satirlar, sayfa) {
  const baslangic = sayfa * SAYFA_BOYUTU;
  const dilim = satirlar.slice(baslangic, baslangic + SAYFA_BOYUTU);
  const toplamSayfa = Math.max(1, Math.ceil(satirlar.length / SAYFA_BOYUTU));
  return { icerik: dilim.join('\n') || 'Envanterin bos.', toplamSayfa };
}

module.exports = {
  data: new SlashCommandBuilder().setName('envanter').setDescription('Envanterini goruntule (itemler, kasalar, rozetler)'),

  async execute(interaction) {
    const tumSatirlar = await envanterSatirlariGetir(interaction.user.id);
    let sayfa = 0;
    const { icerik, toplamSayfa } = sayfaHazirla(tumSatirlar, sayfa);

    const butonlar = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('envanter:geri').setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('envanter:ileri').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(toplamSayfa <= 1)
    );

    const container = metinContainerOlustur([`# 🎒 Envanterin (Sayfa ${sayfa + 1}/${toplamSayfa})`, icerik]);

    const yanit = await interaction.reply({
      components: [container, butonlar],
      flags: COMPONENTS_V2_FLAG,
      ephemeral: true,
      withResponse: true,
    });

    const mesaj = yanit.resource?.message || (await interaction.fetchReply());
    const toplayici = mesaj.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 60000 });

    toplayici.on('collect', async (i) => {
      if (i.customId === 'envanter:ileri') sayfa += 1;
      if (i.customId === 'envanter:geri') sayfa -= 1;

      const { icerik: yeniIcerik, toplamSayfa: yeniToplam } = sayfaHazirla(tumSatirlar, sayfa);
      const yeniButonlar = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('envanter:geri').setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(sayfa <= 0),
        new ButtonBuilder().setCustomId('envanter:ileri').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(sayfa >= yeniToplam - 1)
      );
      const yeniContainer = metinContainerOlustur([`# 🎒 Envanterin (Sayfa ${sayfa + 1}/${yeniToplam})`, yeniIcerik]);

      await i.update({ components: [yeniContainer, yeniButonlar], flags: COMPONENTS_V2_FLAG });
    });
  },
};
