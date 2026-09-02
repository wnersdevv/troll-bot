'use strict';

const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const mongoose = require('mongoose');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { profilKartiOlustur } = require('../../canvas/profilKarti');
const { gelistiriciMi } = require('../../utils/yetki');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Sistem tanilama testleri (sadece gelistiriciler)')
    .addSubcommand((s) => s.setName('database').setDescription('MongoDB baglantisini test et'))
    .addSubcommand((s) => s.setName('canvas').setDescription('Canvas render testini calistir'))
    .addSubcommand((s) => s.setName('components').setDescription('Components V2 render testini calistir')),

  async execute(interaction) {
    if (!gelistiriciMi(interaction.user.id)) {
      return interaction.reply({ content: `${emoji('error')} Bu komut sadece bot gelistiricileri tarafindan kullanilabilir.`, ephemeral: true });
    }

    const alt = interaction.options.getSubcommand();

    if (alt === 'database') {
      const durum = mongoose.connection.readyState;
      const durumMetni = { 0: '🔴 Baglantisiz', 1: '🟢 Bagli', 2: '🟡 Baglaniyor', 3: '🟡 Baglanti kesiliyor' }[durum] || 'Bilinmiyor';

      let pingSuresi = null;
      if (durum === 1) {
        const baslangic = Date.now();
        await mongoose.connection.db.admin().ping();
        pingSuresi = Date.now() - baslangic;
      }

      const container = metinContainerOlustur([
        '# 🧪 Database Testi',
        `Durum: ${durumMetni}${pingSuresi !== null ? `\nPing: ${pingSuresi}ms` : ''}`,
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'canvas') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const buffer = await profilKartiOlustur({
          username: interaction.user.username,
          avatarURL: interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
          level: 1,
          xp: 0,
          gerekliXp: 100,
          coin: 0,
          trollPuan: 0,
          badgeSayisi: 0,
        });
        const ek = new AttachmentBuilder(buffer, { name: 'canvas-test.png' });
        return interaction.editReply({ content: `${emoji('success')} Canvas render basarili.`, files: [ek] });
      } catch (err) {
        return interaction.editReply({ content: `${emoji('error')} Canvas render basarisiz: ${err.message}` });
      }
    }

    if (alt === 'components') {
      const container = metinContainerOlustur(['# 🧪 Components V2 Testi', 'Bu mesaj basariyla goruntulendiyse Components V2 calisiyor demektir.']);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }
  },
};
