'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { Kasa, KullaniciKasasi } = require('../../database/models');
const { coinCikar } = require('../../services/ekonomiServisi');
const { kasaAc } = require('../../services/kasaServisi');
const { nadirlikAdi, nadirlikEmojisi } = require('../../utils/nadirlik');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kasa')
    .setDescription('Kasalari goruntule, satin al ve ac')
    .addSubcommand((s) => s.setName('listele').setDescription('Mevcut kasa turlerini goster'))
    .addSubcommand((s) =>
      s
        .setName('satin-al')
        .setDescription('Bir kasa satin al')
        .addStringOption((o) => o.setName('kasa').setDescription('Kasa anahtari').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('ac')
        .setDescription('Sahip oldugun bir kasayi ac')
        .addStringOption((o) => o.setName('kasa').setDescription('Kasa anahtari').setRequired(true))
    ),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();

    if (alt === 'listele') {
      const kasalar = await Kasa.find().lean();
      const satirlar = kasalar.map((k) =>
        `📦 **${k.isim}** \`${k.key}\` — ${k.satinAlinabilir ? `${emoji('coin')} ${k.fiyat}` : 'Sadece odul olarak kazanilir'}`
      );
      const container = metinContainerOlustur(['# 📦 Kasalar', satirlar.join('\n') || 'Kayitli kasa yok.']);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    const kasaKey = interaction.options.getString('kasa');
    const kasaBelgesi = await Kasa.findOne({ key: kasaKey });

    if (!kasaBelgesi) {
      return interaction.reply({ content: `${emoji('error')} Bu anahtarla bir kasa bulunamadi.`, ephemeral: true });
    }

    if (alt === 'satin-al') {
      if (!kasaBelgesi.satinAlinabilir) {
        return interaction.reply({ content: `${emoji('error')} Bu kasa satin alinamiyor, sadece odul olarak kazanilabilir.`, ephemeral: true });
      }

      const cikarSonuc = await coinCikar(interaction.user.id, kasaBelgesi.fiyat);
      if (!cikarSonuc.basarili) {
        return interaction.reply({ content: `${emoji('error')} Yeterli coinin yok. Gerekli: ${kasaBelgesi.fiyat}`, ephemeral: true });
      }

      await KullaniciKasasi.findOneAndUpdate({ userId: interaction.user.id, kasaKey }, { $inc: { adet: 1 } }, { upsert: true });

      const container = metinContainerOlustur(['# 📦 Kasa Satin Alindi', `**${kasaBelgesi.isim}** envanterine eklendi. \`/kasa ac kasa:${kasaKey}\` ile acabilirsin.`], 0x22c55e);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'ac') {
      const sahiplik = await KullaniciKasasi.findOneAndUpdate(
        { userId: interaction.user.id, kasaKey, adet: { $gte: 1 } },
        { $inc: { adet: -1 } },
        { new: true }
      );

      if (!sahiplik) {
        return interaction.reply({ content: `${emoji('error')} Bu kasadan sahip degilsin.`, ephemeral: true });
      }

      const kazanilanItem = await kasaAc(interaction.user.id, kasaBelgesi);

      if (!kazanilanItem) {
        return interaction.reply({ content: `${emoji('error')} Kasa acildi ama uygun bir item bulunamadi. Lutfen destek sunucusuna bildir.`, ephemeral: true });
      }

      const container = metinContainerOlustur([
        `# 📦 ${kasaBelgesi.isim} Acildi!`,
        `${nadirlikEmojisi(kazanilanItem.rarity)} **${nadirlikAdi(kazanilanItem.rarity)}**\n\n${kazanilanItem.emoji} **${kazanilanItem.isim}**\n-# ${kazanilanItem.aciklama}`,
      ], 0x8b5cf6);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
    }
  },
};
