'use strict';

const { SlashCommandBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const {
  metinContainerOlustur,
  COMPONENTS_V2_FLAG,
} = require('../../components/v2Builders');
const { TrollStats, TrollHistory } = require('../../database/models');
const { rastgeleSec, OVGULER } = require('../../utils/icerikHavuzu');
const { cooldundaMi } = require('../../services/hizSiniriServisi');
const { emoji } = require('../../utils/emojis');
const { ayarlar } = require('../../utils/ayarlar');
const { logKaydet } = require('../../services/logServisi');

const TROLL_MESAJLARI = [
  '{hedef}, birisi seni dusunuyor... o kisi trol botu ama yine de dusunuyor.',
  '{hedef} icin bugun resmi troll gunu ilan edildi. Tebrikler!',
  '{hedef}, kimse fark etmedi ama ekran goruntun cok net.',
  '{hedef} bugun "5 dakikaya gelirim" diyecek, bunu simdiden biliyoruz.',
  '{hedef}, botun seni sectigini gordugunde suratindaki ifadeyi merak ediyoruz.',
];

module.exports = {
  cooldownSeconds: 10,
  data: new SlashCommandBuilder()
    .setName('troll')
    .setDescription('Eglence amacli troll merkezi')
    .addSubcommand((sub) => sub.setName('panel').setDescription('Troll merkezi panelini ac'))
    .addSubcommand((sub) =>
      sub
        .setName('rastgele')
        .setDescription('Rastgele bir troll mesaji gonder')
        .addUserOption((opt) => opt.setName('hedef').setDescription('Hedef kullanici').setRequired(false))
    )
    .addSubcommand((sub) =>
      sub
        .setName('hedef')
        .setDescription('Belirli bir kullaniciyi hedef al')
        .addUserOption((opt) => opt.setName('kullanici').setDescription('Hedef kullanici').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('puan').setDescription('Troll puanini goruntule'))
    .addSubcommand((sub) => sub.setName('gecmis').setDescription('Son troll gecmisini goruntule')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();

    if (alt === 'panel') return panelGoster(interaction);
    if (alt === 'rastgele') return trollGonder(interaction, interaction.options.getUser('hedef'));
    if (alt === 'hedef') return trollGonder(interaction, interaction.options.getUser('kullanici'));
    if (alt === 'puan') return puanGoster(interaction);
    if (alt === 'gecmis') return gecmisGoster(interaction);
  },
};

async function panelGoster(interaction) {
  const container = metinContainerOlustur([
    `# ${emoji('troll')} wnersdev TROLL MERKEZI`,
    'Asagidaki butonlarla eglenceye baslayabilirsin.',
  ]);

  const satir1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('troll:rastgele').setLabel('😂 Rastgele Troll').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('troll:sans').setLabel('🎲 Sans').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('troll:oyunlar').setLabel('🎮 Oyunlar').setStyle(ButtonStyle.Secondary)
  );

  const satir2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('troll:siralama').setLabel('🏆 Siralama').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('troll:profil').setLabel('🎨 Profil').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('troll:istatistik').setLabel('📊 Istatistik').setStyle(ButtonStyle.Success)
  );

  await interaction.reply({
    components: [container, satir1, satir2],
    flags: COMPONENTS_V2_FLAG,
  });
}

async function trollGonder(interaction, hedef) {
  if (hedef && hedef.id === interaction.user.id) {
    return interaction.reply({ content: `${emoji('error')} Kendini hedef alamazsin, en azindan boyle degil :)`, ephemeral: true });
  }
  if (hedef && hedef.bot) {
    return interaction.reply({ content: `${emoji('error')} Botlari trollemek pek eglenceli olmaz.`, ephemeral: true });
  }

  const cd = cooldundaMi(`troll:${interaction.user.id}`, ayarlar().cooldowns?.trollSaniye ?? 10);
  if (cd.aktif) {
    return interaction.reply({
      content: `${emoji('loading')} Bu komutu tekrar kullanmadan once **${cd.kalanSaniye} saniye** bekle.`,
      ephemeral: true,
    });
  }

  const hedefKullanici = hedef || interaction.guild?.members.cache.random()?.user || interaction.user;
  const sablon = rastgeleSec(TROLL_MESAJLARI);
  const mesaj = sablon.replace('{hedef}', `<@${hedefKullanici.id}>`);

  const container = metinContainerOlustur([`# ${emoji('troll')} TROLL!`, mesaj], 0xf59e0b);

  await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });

  await TrollStats.findOneAndUpdate(
    { userId: interaction.user.id },
    { $inc: { trollYapilan: 1, puan: 5 }, $set: { enSonTrollZamani: new Date() } },
    { upsert: true }
  );
  if (hedefKullanici.id !== interaction.user.id) {
    await TrollStats.findOneAndUpdate(
      { userId: hedefKullanici.id },
      { $inc: { trollYenilen: 1 } },
      { upsert: true }
    );
  }

  await TrollHistory.create({
    guildId: interaction.guildId || 'dm',
    kaynakUserId: interaction.user.id,
    hedefUserId: hedefKullanici.id,
    tur: hedef ? 'ozel' : 'rastgele',
    icerik: mesaj,
  });

  await logKaydet({
    guildId: interaction.guildId || 'dm',
    tur: 'troll',
    aktorId: interaction.user.id,
    mesaj: `${interaction.user.tag} -> ${hedefKullanici.tag} troll gonderdi.`,
  });
}

async function puanGoster(interaction) {
  const istatistik = await TrollStats.findOne({ userId: interaction.user.id });
  const container = metinContainerOlustur([
    `# ${emoji('trophy')} Troll Puanin`,
    `**Puan:** ${istatistik?.puan ?? 0}\n**Yapilan Troll:** ${istatistik?.trollYapilan ?? 0}\n**Hedef Olunan:** ${istatistik?.trollYenilen ?? 0}`,
  ]);
  await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
}

async function gecmisGoster(interaction) {
  const gecmis = await TrollHistory.find({
    $or: [{ kaynakUserId: interaction.user.id }, { hedefUserId: interaction.user.id }],
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  if (!gecmis.length) {
    return interaction.reply({ content: `${emoji('loading')} Henuz troll gecmisin yok.`, ephemeral: true });
  }

  const satirlar = gecmis.map((g) => {
    const rol = g.kaynakUserId === interaction.user.id ? '➡️ Gonderdin' : '⬅️ Aldin';
    return `${rol}: ${g.icerik}`;
  });

  const container = metinContainerOlustur([`# 📜 Son Troll Gecmisin`, satirlar.join('\n\n')]);
  await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
}
