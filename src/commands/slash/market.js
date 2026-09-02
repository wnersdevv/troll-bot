'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { Item, Envanter } = require('../../database/models');
const { coinCikar, coinEkle } = require('../../services/ekonomiServisi');
const { itemEkle, itemCikar } = require('../../services/kasaServisi');
const { nadirlikAdi, nadirlikEmojisi } = require('../../utils/nadirlik');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Item marketi')
    .addSubcommand((s) => s.setName('listele').setDescription('Markette satilan itemleri goster'))
    .addSubcommand((s) =>
      s
        .setName('satin-al')
        .setDescription('Bir item satin al')
        .addStringOption((o) => o.setName('item').setDescription('Item anahtari (\'/market listele\' ile gorebilirsin)').setRequired(true))
        .addIntegerOption((o) => o.setName('adet').setDescription('Adet (varsayilan 1)').setRequired(false).setMinValue(1))
    )
    .addSubcommand((s) =>
      s
        .setName('sat')
        .setDescription('Envanterindeki bir itemi sat')
        .addStringOption((o) => o.setName('item').setDescription('Item anahtari').setRequired(true))
        .addIntegerOption((o) => o.setName('adet').setDescription('Adet (varsayilan 1)').setRequired(false).setMinValue(1))
    ),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();

    if (alt === 'listele') {
      const itemler = await Item.find({ marketteSatilir: true }).sort({ fiyat: 1 }).lean();
      if (!itemler.length) {
        return interaction.reply({ content: `${emoji('loading')} Markette su an satilan item yok.`, ephemeral: true });
      }
      const satirlar = itemler.map(
        (i) => `${i.emoji} **${i.isim}** \`${i.key}\` — ${nadirlikEmojisi(i.rarity)} ${nadirlikAdi(i.rarity)} — ${emoji('coin')} ${i.fiyat}`
      );
      const container = metinContainerOlustur(['# 🏪 Market', satirlar.join('\n')]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    const itemKey = interaction.options.getString('item');
    const adet = interaction.options.getInteger('adet') || 1;
    const item = await Item.findOne({ key: itemKey });

    if (!item) {
      return interaction.reply({ content: `${emoji('error')} Bu anahtarla bir item bulunamadi. \`/market listele\` ile kontrol et.`, ephemeral: true });
    }

    if (alt === 'satin-al') {
      if (!item.marketteSatilir) {
        return interaction.reply({ content: `${emoji('error')} Bu item markette satilmiyor (sadece kasalardan cikar).`, ephemeral: true });
      }
      const toplamFiyat = item.fiyat * adet;
      const cikarSonuc = await coinCikar(interaction.user.id, toplamFiyat);

      if (!cikarSonuc.basarili) {
        return interaction.reply({ content: `${emoji('error')} Yeterli coinin yok. Gerekli: ${toplamFiyat}, mevcut: ${cikarSonuc.bakiye}`, ephemeral: true });
      }

      await itemEkle(interaction.user.id, item.key, adet);

      const container = metinContainerOlustur([
        '# 🏪 Satin Alma Basarili',
        `${item.emoji} **${item.isim}** x${adet} — ${emoji('coin')} ${toplamFiyat} harcandi.`,
      ], 0x22c55e);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'sat') {
      const envanterKaydi = await Envanter.findOne({ userId: interaction.user.id, itemKey });
      if (!envanterKaydi || envanterKaydi.adet < adet) {
        return interaction.reply({ content: `${emoji('error')} Bu itemden yeterli sayida sahip degilsin.`, ephemeral: true });
      }

      const basariliMi = await itemCikar(interaction.user.id, itemKey, adet);
      if (!basariliMi) {
        return interaction.reply({ content: `${emoji('error')} Satis sirasinda bir sorun olustu.`, ephemeral: true });
      }

      const kazanc = item.satisFiyati * adet;
      await coinEkle(interaction.user.id, kazanc);

      const container = metinContainerOlustur([
        '# 🏪 Satis Basarili',
        `${item.emoji} **${item.isim}** x${adet} satildi — ${emoji('coin')} ${kazanc} kazandin.`,
      ], 0x22c55e);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }
  },
};
