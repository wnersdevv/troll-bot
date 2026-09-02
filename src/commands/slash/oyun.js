'use strict';

const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { GameStats, GameHistory, Quest } = require('../../database/models');
const { coinEkle } = require('../../services/ekonomiServisi');
const { cooldundaMi } = require('../../services/hizSiniriServisi');
const { emoji } = require('../../utils/emojis');
const { ayarlar } = require('../../utils/ayarlar');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oyun')
    .setDescription('Mini oyunlar oyna, coin kazan')
    .addSubcommand((s) => s.setName('yazi-tura').setDescription('Yazi mi tura mi?'))
    .addSubcommand((s) => s.setName('zar').setDescription('Zar at, botla yaris'))
    .addSubcommand((s) => s.setName('tas-kagit-makas').setDescription('Klasik tas-kagit-makas'))
    .addSubcommand((s) =>
      s
        .setName('sayi-tahmin')
        .setDescription('1-100 arasi bir sayi tahmin et')
        .addIntegerOption((o) => o.setName('tahmin').setDescription('Tahminin (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((s) => s.setName('hizli-tikla').setDescription('Ilk basan kazanir!'))
    .addSubcommand((s) =>
      s
        .setName('hafiza')
        .setDescription('Emoji dizisini ezberle ve tekrar sec')
        .addStringOption((o) =>
          o
            .setName('zorluk')
            .setDescription('Zorluk seviyesi')
            .addChoices(
              { name: 'Kolay', value: 'kolay' },
              { name: 'Normal', value: 'normal' },
              { name: 'Zor', value: 'zor' }
            )
        )
    )
    .addSubcommand((s) =>
      s
        .setName('kelime')
        .setDescription('Karisik harfleri dogru kelimeye cevir (15 saniye)')
    )
    .addSubcommand((s) =>
      s
        .setName('duello')
        .setDescription('Baska bir kullaniciyla tas-kagit-makas duellosu')
        .addUserOption((o) => o.setName('rakip').setDescription('Rakibin').setRequired(true))
    ),

  async execute(interaction) {
    const cd = cooldundaMi(`oyun:${interaction.user.id}`, ayarlar().cooldowns?.oyunSaniye ?? 8);
    if (cd.aktif) {
      return interaction.reply({ content: `${emoji('loading')} **${cd.kalanSaniye} saniye** sonra tekrar oyna.`, ephemeral: true });
    }

    const alt = interaction.options.getSubcommand();
    if (alt === 'yazi-tura') return yaziTura(interaction);
    if (alt === 'zar') return zarAt(interaction);
    if (alt === 'tas-kagit-makas') return tasKagitMakas(interaction);
    if (alt === 'sayi-tahmin') return sayiTahmin(interaction);
    if (alt === 'hizli-tikla') return hizliTikla(interaction);
    if (alt === 'hafiza') return hafizaOyunu(interaction);
    if (alt === 'kelime') return kelimeOyunu(interaction);
    if (alt === 'duello') return duello(interaction);
  },
};

async function sonucKaydet(interaction, oyunAdi, sonuc, skor = 0) {
  await GameHistory.create({
    userId: interaction.user.id,
    guildId: interaction.guildId || 'dm',
    oyunAdi,
    sonuc,
    skor,
  });

  const yol = `oyunlar.${oyunAdi}`;
  const inc = { [`${yol}.oynanan`]: 1 };
  if (sonuc === 'kazandi') inc[`${yol}.kazanilan`] = 1;
  if (sonuc === 'kaybetti') inc[`${yol}.kaybedilen`] = 1;
  if (sonuc === 'berabere') inc[`${yol}.beraberlik`] = 1;

  await GameStats.findOneAndUpdate({ userId: interaction.user.id }, { $inc: inc }, { upsert: true });

  if (sonuc === 'kazandi') {
    const guncelIstatistik = await GameStats.findOneAndUpdate(
      { userId: interaction.user.id },
      { $inc: { guncelSeri: 1 } },
      { upsert: true, new: true }
    );
    if (guncelIstatistik.guncelSeri > guncelIstatistik.enUzunSeri) {
      guncelIstatistik.enUzunSeri = guncelIstatistik.guncelSeri;
      await guncelIstatistik.save();
    }
    await coinEkle(interaction.user.id, 15);
    await gunlukGorevIlerlet(interaction.user.id);
  } else if (sonuc === 'kaybetti') {
    await GameStats.findOneAndUpdate({ userId: interaction.user.id }, { $set: { guncelSeri: 0 } }, { upsert: true });
  }
}

async function gunlukGorevIlerlet(userId) {
  const bugununSonu = new Date();
  bugununSonu.setHours(23, 59, 59, 999);

  const gorev = await Quest.findOneAndUpdate(
    { userId, questKey: 'gunluk_oyun_kazan', sonGecerlilik: { $gte: new Date() }, tamamlandi: false },
    { $inc: { ilerleme: 1 } },
    { new: true }
  );

  if (gorev && gorev.ilerleme >= gorev.hedefSayi) {
    gorev.tamamlandi = true;
    await gorev.save();
    // Odul, kullanicinin "/gorev odul" komutuyla kendi talep etmesiyle verilir.
  }
}

async function yaziTura(interaction) {
  const satir = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('yt:yazi').setLabel('🪙 Yazi').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('yt:tura').setLabel('🪙 Tura').setStyle(ButtonStyle.Primary)
  );

  const container = metinContainerOlustur(['# 🪙 Yazi mi Tura mi?', 'Tahminini sec!']);
  const yanit = await interaction.reply({ components: [container, satir], flags: COMPONENTS_V2_FLAG, withResponse: true });

  const mesaj = yanit.resource?.message || (await interaction.fetchReply());
  const toplayici = mesaj.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 15000, max: 1 });

  toplayici.on('collect', async (i) => {
    const sonucAtis = Math.random() < 0.5 ? 'yazi' : 'tura';
    const tahmin = i.customId.split(':')[1];
    const kazandi = tahmin === sonucAtis;

    const sonucContainer = metinContainerOlustur([
      '# 🪙 Sonuc',
      `Cikan: **${sonucAtis === 'yazi' ? 'Yazi' : 'Tura'}**\n${kazandi ? '🎉 Kazandin! +15 coin' : '😢 Kaybettin.'}`,
    ], kazandi ? 0x22c55e : 0xef4444);

    await i.update({ components: [sonucContainer], flags: COMPONENTS_V2_FLAG });
    await sonucKaydet(interaction, 'yazi_tura', kazandi ? 'kazandi' : 'kaybetti');
  });

  toplayici.on('end', async (koleksiyon) => {
    if (koleksiyon.size === 0) {
      await interaction.editReply({ components: [metinContainerOlustur(['# 🪙 Sure doldu', 'Kimse tahmin etmedi.'])], flags: COMPONENTS_V2_FLAG });
    }
  });
}

async function zarAt(interaction) {
  const kullaniciZar = Math.floor(Math.random() * 6) + 1;
  const botZar = Math.floor(Math.random() * 6) + 1;

  let sonuc;
  let mesaj;
  if (kullaniciZar > botZar) {
    sonuc = 'kazandi';
    mesaj = `🎲 Sen: **${kullaniciZar}** | Bot: **${botZar}**\n🎉 Kazandin! +15 coin`;
  } else if (kullaniciZar < botZar) {
    sonuc = 'kaybetti';
    mesaj = `🎲 Sen: **${kullaniciZar}** | Bot: **${botZar}**\n😢 Kaybettin.`;
  } else {
    sonuc = 'berabere';
    mesaj = `🎲 Sen: **${kullaniciZar}** | Bot: **${botZar}**\n🤝 Berabere.`;
  }

  const container = metinContainerOlustur(['# 🎲 Zar Oyunu', mesaj], sonuc === 'kazandi' ? 0x22c55e : sonuc === 'kaybetti' ? 0xef4444 : 0xf59e0b);
  await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  await sonucKaydet(interaction, 'zar', sonuc, kullaniciZar);
}

async function tasKagitMakas(interaction) {
  const satir = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tkm:tas').setLabel('🪨 Tas').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tkm:kagit').setLabel('📄 Kagit').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tkm:makas').setLabel('✂️ Makas').setStyle(ButtonStyle.Secondary)
  );

  const container = metinContainerOlustur(['# ✊ Tas-Kagit-Makas', 'Seçimini yap!']);
  await interaction.reply({ components: [container, satir], flags: COMPONENTS_V2_FLAG });

  const mesaj = await interaction.fetchReply();
  const toplayici = mesaj.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 15000, max: 1 });

  toplayici.on('collect', async (i) => {
    const secimler = ['tas', 'kagit', 'makas'];
    const botSecim = secimler[Math.floor(Math.random() * 3)];
    const kullaniciSecim = i.customId.split(':')[1];

    let sonuc;
    if (kullaniciSecim === botSecim) sonuc = 'berabere';
    else if (
      (kullaniciSecim === 'tas' && botSecim === 'makas') ||
      (kullaniciSecim === 'kagit' && botSecim === 'tas') ||
      (kullaniciSecim === 'makas' && botSecim === 'kagit')
    ) sonuc = 'kazandi';
    else sonuc = 'kaybetti';

    const emojiHarita = { tas: '🪨', kagit: '📄', makas: '✂️' };
    const renk = sonuc === 'kazandi' ? 0x22c55e : sonuc === 'kaybetti' ? 0xef4444 : 0xf59e0b;
    const sonucMetni = { kazandi: '🎉 Kazandin! +15 coin', kaybetti: '😢 Kaybettin.', berabere: '🤝 Berabere.' }[sonuc];

    const sonucContainer = metinContainerOlustur([
      '# ✊ Sonuc',
      `Sen: ${emojiHarita[kullaniciSecim]} | Bot: ${emojiHarita[botSecim]}\n${sonucMetni}`,
    ], renk);

    await i.update({ components: [sonucContainer], flags: COMPONENTS_V2_FLAG });
    await sonucKaydet(interaction, 'tas_kagit_makas', sonuc);
  });
}

async function sayiTahmin(interaction) {
  const tahmin = interaction.options.getInteger('tahmin');
  const gercekSayi = Math.floor(Math.random() * 100) + 1;
  const fark = Math.abs(tahmin - gercekSayi);

  let sicaklik;
  if (fark === 0) sicaklik = '🎯 Tam isabet!';
  else if (fark <= 5) sicaklik = '🔥 Cok sicak!';
  else if (fark <= 15) sicaklik = '🌤️ Iliman';
  else sicaklik = '❄️ Soguk';

  const kazandi = fark === 0;
  const mesaj = `Tuttugum sayi: **${gercekSayi}**\nSenin tahminin: **${tahmin}**\n${sicaklik}\n${kazandi ? '🎉 Tam isabet, +50 coin!' : 'Bir dahaki sefere!'}`;

  const container = metinContainerOlustur(['# 🔢 Sayi Tahmin', mesaj], kazandi ? 0x22c55e : 0x64748b);
  await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });

  await sonucKaydet(interaction, 'sayi_tahmin', kazandi ? 'kazandi' : 'kaybetti', fark);
  if (kazandi) await coinEkle(interaction.user.id, 35); // tam isabet ekstra bonus (toplam 50)
}

async function hizliTikla(interaction) {
  const gecikmeMs = Math.floor(Math.random() * 3000) + 1500; // 1.5-4.5sn sonra buton aktif olur
  const container = metinContainerOlustur(['# ⚡ Hizli Tikla', 'Hazir ol... buton birazdan aktif olacak!']);
  await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });

  setTimeout(async () => {
    const satir = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ht:bas').setLabel('⚡ BAS!').setStyle(ButtonStyle.Danger)
    );
    const yeniContainer = metinContainerOlustur(['# ⚡ SIMDI!', 'Ilk basan kazanir!']);
    await interaction.editReply({ components: [yeniContainer, satir], flags: COMPONENTS_V2_FLAG });

    const mesaj = await interaction.fetchReply();
    const baslangicZamani = Date.now();
    const toplayici = mesaj.createMessageComponentCollector({ time: 8000, max: 1 });

    toplayici.on('collect', async (i) => {
      const tepkiSuresi = Date.now() - baslangicZamani;
      const sonucContainer = metinContainerOlustur([
        '# ⚡ Sonuc',
        `<@${i.user.id}> kazandi! Tepki suresi: **${tepkiSuresi}ms**${i.user.id === interaction.user.id ? '\n+15 coin' : ''}`,
      ], 0x22c55e);
      await i.update({ components: [sonucContainer], flags: COMPONENTS_V2_FLAG });

      if (i.user.id === interaction.user.id) {
        await sonucKaydet(interaction, 'hizli_tikla', 'kazandi', tepkiSuresi);
      }
    });

    toplayici.on('end', async (koleksiyon) => {
      if (koleksiyon.size === 0) {
        await interaction.editReply({
          components: [metinContainerOlustur(['# ⚡ Sure Doldu', 'Kimse basmadi.'])],
          flags: COMPONENTS_V2_FLAG,
        }).catch(() => {});
      }
    });
  }, gecikmeMs);
}

const HAFIZA_EMOJILERI = ['🍎', '🍌', '🍇', '🍉', '🍊', '🍋', '🍓', '🍒', '🥝', '🍍'];
const HAFIZA_ZORLUK_UZUNLUGU = { kolay: 3, normal: 5, zor: 7 };

async function hafizaOyunu(interaction) {
  const zorluk = interaction.options.getString('zorluk') || 'normal';
  const uzunluk = HAFIZA_ZORLUK_UZUNLUGU[zorluk];

  const dizi = [];
  for (let i = 0; i < uzunluk; i += 1) {
    dizi.push(HAFIZA_EMOJILERI[Math.floor(Math.random() * HAFIZA_EMOJILERI.length)]);
  }

  const container = metinContainerOlustur([
    `# 🧠 Hafiza Oyunu (${zorluk})`,
    `Bu diziyi ezberle: ${dizi.join(' ')}\n\n5 saniye sonra dizi gizlenecek ve dogru sirayi yazman gerekecek.`,
  ]);
  await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });

  setTimeout(async () => {
    const gizliContainer = metinContainerOlustur([
      '# 🧠 Simdi Sira Sende',
      `Diziyi asagidaki formatta, mesaj olarak yaz (60 saniyen var):\n\`${HAFIZA_EMOJILERI.slice(0, uzunluk).join(' ')}\` gibi emojilerle sirayi yaz.`,
    ]);
    await interaction.editReply({ components: [gizliContainer], flags: COMPONENTS_V2_FLAG });

    if (!interaction.channel) return;
    const toplayici = interaction.channel.createMessageCollector({
      filter: (m) => m.author.id === interaction.user.id,
      time: 60000,
      max: 1,
    });

    toplayici.on('collect', async (mesaj) => {
      const kullaniciDizisi = dizi.filter((e) => mesaj.content.includes(e));
      const dogruMu = mesaj.content.replace(/\s+/g, '') === dizi.join('');

      await mesaj.reply(
        dogruMu
          ? '🎉 Dogru sira! +15 coin kazandin.'
          : `😢 Yanlis. Dogru sira: ${dizi.join(' ')}`
      );

      await sonucKaydet(interaction, 'hafiza', dogruMu ? 'kazandi' : 'kaybetti');
    });
  }, 5000);
}

const KELIME_HAVUZU = ['discord', 'troll', 'oyun', 'sunucu', 'kullanici', 'eglence', 'sohbet', 'yazilim'];

function karistir(kelime) {
  const harfler = kelime.split('');
  for (let i = harfler.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [harfler[i], harfler[j]] = [harfler[j], harfler[i]];
  }
  return harfler.join('');
}

async function kelimeOyunu(interaction) {
  const kelime = KELIME_HAVUZU[Math.floor(Math.random() * KELIME_HAVUZU.length)];
  const karisik = karistir(kelime);

  const container = metinContainerOlustur([
    '# 🔤 Kelime Oyunu',
    `Bu harfleri dogru kelimeye cevir: **${karisik.toUpperCase()}**\n15 saniyen var, cevabini mesaj olarak yaz.`,
  ]);
  await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });

  if (!interaction.channel) return;
  const toplayici = interaction.channel.createMessageCollector({
    filter: (m) => m.author.id === interaction.user.id,
    time: 15000,
    max: 1,
  });

  toplayici.on('collect', async (mesaj) => {
    const dogruMu = mesaj.content.trim().toLowerCase() === kelime;
    await mesaj.reply(dogruMu ? '🎉 Dogru! +15 coin kazandin.' : `😢 Yanlis. Dogru kelime: **${kelime}**`);
    await sonucKaydet(interaction, 'kelime', dogruMu ? 'kazandi' : 'kaybetti');
  });

  toplayici.on('end', async (koleksiyon) => {
    if (koleksiyon.size === 0) {
      await interaction.followUp({ content: `⏳ Sure doldu. Dogru kelime: **${kelime}**`, ephemeral: true }).catch(() => {});
    }
  });
}

async function duello(interaction) {
  const rakip = interaction.options.getUser('rakip');

  if (rakip.id === interaction.user.id) {
    return interaction.reply({ content: `${emoji('error')} Kendinle duello yapamazsin.`, ephemeral: true });
  }
  if (rakip.bot) {
    return interaction.reply({ content: `${emoji('error')} Botlarla duello yapamazsin.`, ephemeral: true });
  }

  const satir = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('duello:tas').setLabel('🪨 Tas').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('duello:kagit').setLabel('📄 Kagit').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('duello:makas').setLabel('✂️ Makas').setStyle(ButtonStyle.Secondary)
  );

  const container = metinContainerOlustur([
    '# 🎯 Duello',
    `<@${interaction.user.id}> vs <@${rakip.id}>\nHer iki taraf da asagidan secimini yapsin (30 saniye).`,
  ]);
  await interaction.reply({ components: [container, satir], flags: COMPONENTS_V2_FLAG });

  const mesaj = await interaction.fetchReply();
  const secimler = new Map();

  const toplayici = mesaj.createMessageComponentCollector({
    filter: (i) => [interaction.user.id, rakip.id].includes(i.user.id),
    time: 30000,
  });

  toplayici.on('collect', async (i) => {
    if (secimler.has(i.user.id)) {
      return i.reply({ content: 'Zaten secimini yaptin, rakibini bekle.', ephemeral: true });
    }
    secimler.set(i.user.id, i.customId.split(':')[1]);
    await i.reply({ content: `${emoji('success')} Secimin kaydedildi.`, ephemeral: true });

    if (secimler.size === 2) {
      const kazananlarHaritasi = { tas: 'makas', kagit: 'tas', makas: 'kagit' };
      const secim1 = secimler.get(interaction.user.id);
      const secim2 = secimler.get(rakip.id);

      const emojiHarita = { tas: '🪨', kagit: '📄', makas: '✂️' };
      let sonucMetni;

      if (secim1 === secim2) {
        sonucMetni = '🤝 Berabere!';
      } else if (kazananlarHaritasi[secim1] === secim2) {
        sonucMetni = `🎉 <@${interaction.user.id}> kazandi!`;
        await sonucKaydet(interaction, 'duello', 'kazandi');
      } else {
        sonucMetni = `🎉 <@${rakip.id}> kazandi!`;
      }

      const sonucContainer = metinContainerOlustur([
        '# 🎯 Duello Sonucu',
        `<@${interaction.user.id}>: ${emojiHarita[secim1]} | <@${rakip.id}>: ${emojiHarita[secim2]}\n\n${sonucMetni}`,
      ]);
      await interaction.editReply({ components: [sonucContainer], flags: COMPONENTS_V2_FLAG });
      toplayici.stop();
    }
  });

  toplayici.on('end', async (koleksiyon, sebep) => {
    if (secimler.size < 2 && sebep !== 'user') {
      await interaction.editReply({
        components: [metinContainerOlustur(['# 🎯 Duello Iptal', 'Her iki taraf da secim yapmadi.'])],
        flags: COMPONENTS_V2_FLAG,
      }).catch(() => {});
    }
  });
}
