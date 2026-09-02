'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { Quest } = require('../../database/models');
const { coinEkle } = require('../../services/ekonomiServisi');
const { emoji } = require('../../utils/emojis');

const GUNLUK_GOREV_SABLONLARI = [
  { questKey: 'gunluk_oyun_kazan', baslik: 'Bir oyun kazan', hedefSayi: 1, odulCoin: 25 },
  { questKey: 'gunluk_3_troll', baslik: '3 kere troll gonder', hedefSayi: 3, odulCoin: 20 },
  { questKey: 'gunluk_saka_oku', baslik: '2 saka oku', hedefSayi: 2, odulCoin: 15 },
];

function bugununSonu() {
  const tarih = new Date();
  tarih.setHours(23, 59, 59, 999);
  return tarih;
}

async function gunlukGorevleriGarantiEt(userId) {
  const sonGecerlilik = bugununSonu();
  for (const sablon of GUNLUK_GOREV_SABLONLARI) {
    await Quest.findOneAndUpdate(
      { userId, questKey: sablon.questKey, sonGecerlilik: { $gte: new Date() } },
      { $setOnInsert: { ...sablon, userId, sonGecerlilik, tur: 'gunluk', ilerleme: 0, tamamlandi: false } },
      { upsert: true }
    );
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gorev')
    .setDescription('Gunluk gorevlerini goruntule ve odul topla')
    .addSubcommand((s) => s.setName('gunluk').setDescription('Bugunku gorevlerini goster'))
    .addSubcommand((s) => s.setName('gecmis').setDescription('Tamamlanan gorev gecmisini goster'))
    .addSubcommand((s) => s.setName('odul').setDescription('Tamamlanan ama odulu alinmamis gorevleri kontrol et')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (alt === 'gunluk') {
      await gunlukGorevleriGarantiEt(userId);
      const gorevler = await Quest.find({ userId, tur: 'gunluk', sonGecerlilik: { $gte: new Date() } }).lean();

      const satirlar = gorevler.map((g) => {
        const durum = g.tamamlandi ? '✅' : `${g.ilerleme}/${g.hedefSayi}`;
        return `${g.tamamlandi ? '✅' : '🔲'} **${g.baslik}** — ${durum} (${emoji('coin')} ${g.odulCoin})`;
      });

      const container = metinContainerOlustur([`# ${emoji('quest')} Gunluk Gorevlerin`, satirlar.join('\n') || 'Gorev bulunamadi.'], 0x3b82f6);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'gecmis') {
      const tamamlananlar = await Quest.find({ userId, tamamlandi: true }).sort({ updatedAt: -1 }).limit(10).lean();
      if (!tamamlananlar.length) {
        return interaction.reply({ content: `${emoji('loading')} Henuz tamamlanmis bir gorev yok.`, ephemeral: true });
      }
      const satirlar = tamamlananlar.map((g) => `✅ ${g.baslik} — ${emoji('coin')} ${g.odulCoin}`);
      const container = metinContainerOlustur(['# 📜 Gorev Gecmisin', satirlar.join('\n')]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'odul') {
      const bekleyenler = await Quest.find({ userId, tamamlandi: true, odulAlindi: { $ne: true } });
      if (!bekleyenler.length) {
        return interaction.reply({ content: `${emoji('loading')} Alinacak yeni odul yok.`, ephemeral: true });
      }

      let toplamOdul = 0;
      for (const gorev of bekleyenler) {
        toplamOdul += gorev.odulCoin;
        gorev.odulAlindi = true;
        await gorev.save();
      }
      await coinEkle(userId, toplamOdul);

      const container = metinContainerOlustur([`# ${emoji('coin')} Odul Alindi`, `Toplam **${toplamOdul}** ${emoji('coin')} kazandin.`], 0x22c55e);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }
  },
};
