'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { komutlariYukle } = require('../../handlers/komutYukleyici');
const { gelistiriciMi } = require('../../utils/yetki');
const { emoji } = require('../../utils/emojis');

let bakimModuAktif = false;

module.exports = {
  bakimModuGetir: () => bakimModuAktif,
  data: new SlashCommandBuilder()
    .setName('yonetim')
    .setDescription('Bot yonetim komutlari (sadece gelistiriciler)')
    .addSubcommand((s) => s.setName('bakim').setDescription('Bakim modunu ac'))
    .addSubcommand((s) => s.setName('bakim-kapat').setDescription('Bakim modunu kapat'))
    .addSubcommand((s) => s.setName('reload').setDescription('Slash komutlarini yeniden yukle'))
    .addSubcommand((s) => s.setName('cache').setDescription('Cache/istatistik bilgisini goster'))
    .addSubcommand((s) => s.setName('komutlar').setDescription('Yuklu komut sayisini goster')),

  async execute(interaction) {
    if (!gelistiriciMi(interaction.user.id)) {
      return interaction.reply({ content: `${emoji('error')} Bu komut sadece bot gelistiricileri tarafindan kullanilabilir.`, ephemeral: true });
    }

    const alt = interaction.options.getSubcommand();

    if (alt === 'bakim') {
      bakimModuAktif = true;
      return interaction.reply({ content: `${emoji('success')} Bakim modu acildi.`, ephemeral: true });
    }

    if (alt === 'bakim-kapat') {
      bakimModuAktif = false;
      return interaction.reply({ content: `${emoji('success')} Bakim modu kapatildi.`, ephemeral: true });
    }

    if (alt === 'reload') {
      const sayi = komutlariYukle(interaction.client);
      return interaction.reply({ content: `${emoji('success')} ${sayi} komut yeniden yuklendi.`, ephemeral: true });
    }

    if (alt === 'cache') {
      const hafiza = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      const container = metinContainerOlustur([
        '# 🗂️ Cache / Bellek Bilgisi',
        `Bellek Kullanimi: ${hafiza}MB\nYuklu Komut: ${interaction.client.commands.size}\nSunucu Sayisi: ${interaction.client.guilds.cache.size}`,
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'komutlar') {
      const isimler = [...interaction.client.commands.keys()].map((k) => `\`/${k}\``).join(', ');
      const container = metinContainerOlustur(['# 📝 Yuklu Komutlar', isimler]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }
  },
};
