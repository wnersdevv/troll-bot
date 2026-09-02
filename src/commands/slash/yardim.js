'use strict';

const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { ayarlar } = require('../../utils/ayarlar');

const KATEGORILER = {
  troll: { etiket: '🤡 Troll', komutlar: ['/troll panel', '/troll rastgele', '/hedef sec', '/troll-testi', '/troll-iq'] },
  eglence: { etiket: '😂 Eglence', komutlar: ['/saka rastgele', '/roast kullanici', '/ovgu kullanici', '/kader bugun'] },
  oyun: { etiket: '🎮 Oyun', komutlar: ['/oyun yazi-tura', '/oyun zar', '/oyun tas-kagit-makas', '/oyun sayi-tahmin', '/oyun hizli-tikla', '/oyun hafiza', '/oyun kelime', '/oyun duello'] },
  ekonomi: { etiket: '🪙 Ekonomi', komutlar: ['/bakiye', '/banka yatir', '/banka cek', '/para-gonder', '/gunluk', '/haftalik'] },
  market: { etiket: '🏪 Market & Envanter', komutlar: ['/market listele', '/market satin-al', '/market sat', '/envanter', '/kasa listele', '/kasa satin-al', '/kasa ac'] },
  profil: { etiket: '🎨 Profil', komutlar: ['/profil goruntule', '/unvan liste', '/unvan sec', '/siralama coin', '/siralama troll'] },
  gorevler: { etiket: '🎯 Gorevler & Basarilar', komutlar: ['/gorev gunluk', '/gorev odul', '/basari liste', '/rozet liste'] },
  yonetim: { etiket: '⚙️ Yonetim', komutlar: ['/sistem durum', '/hakkinda bot', '/destek sunucu'] },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yardim')
    .setDescription('Butun komutlari ve kategorileri goster')
    .addSubcommand((s) => s.setName('komutlar').setDescription('Tum komutlari listele'))
    .addSubcommand((s) =>
      s
        .setName('kategori')
        .setDescription('Belirli bir kategoriyi goster')
        .addStringOption((o) =>
          o
            .setName('secim')
            .setDescription('Kategori')
            .setRequired(true)
            .addChoices(...Object.entries(KATEGORILER).map(([key, val]) => ({ name: val.etiket, value: key })))
        )
    ),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const a = ayarlar();

    if (alt === 'kategori') {
      const key = interaction.options.getString('secim');
      const kategori = KATEGORILER[key];
      const container = metinContainerOlustur([`# ${kategori.etiket}`, kategori.komutlar.map((k) => `\`${k}\``).join('\n')]);
      const destekButon = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('💬 Destek Sunucusu').setStyle(ButtonStyle.Link).setURL(a.discord.supportServer)
      );
      return interaction.reply({ components: [container, destekButon], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    const secmen = new StringSelectMenuBuilder()
      .setCustomId('yardim:kategori-sec')
      .setPlaceholder('Bir kategori sec')
      .addOptions(Object.entries(KATEGORILER).map(([key, val]) => ({ label: val.etiket, value: key })));

    const container = metinContainerOlustur([
      `# 🆘 ${a.bot.name} — Yardim`,
      'Asagidaki menuden bir kategori sec, ya da `/yardim kategori` komutunu kullan.',
    ]);
    const secmenSatiri = new ActionRowBuilder().addComponents(secmen);
    const destekButon = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('💬 Destek Sunucusu').setStyle(ButtonStyle.Link).setURL(a.discord.supportServer)
    );

    const yanit = await interaction.reply({
      components: [container, secmenSatiri, destekButon],
      flags: COMPONENTS_V2_FLAG,
      withResponse: true,
    });

    const mesaj = yanit.resource?.message || (await interaction.fetchReply());
    const toplayici = mesaj.createMessageComponentCollector({ filter: (i) => i.user.id === interaction.user.id, time: 60000 });

    toplayici.on('collect', async (i) => {
      const key = i.values[0];
      const kategori = KATEGORILER[key];
      const yeniContainer = metinContainerOlustur([`# ${kategori.etiket}`, kategori.komutlar.map((k) => `\`${k}\``).join('\n')]);
      await i.update({ components: [yeniContainer, secmenSatiri, destekButon], flags: COMPONENTS_V2_FLAG });
    });
  },
};
