'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { TrollHistory } = require('../../database/models');
const { emoji } = require('../../utils/emojis');

// Kullanicinin sunucu bazli aktif hedefini bellekte tutariz (basit, kalici olmasi gerekmez).
const AKTIF_HEDEFLER = new Map(); // key: `${guildId}:${userId}` -> hedefUserId

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hedef')
    .setDescription('Eglence amacli bir hedef sec ve takip et')
    .addSubcommand((s) =>
      s
        .setName('sec')
        .setDescription('Bir kullaniciyi hedef olarak sec')
        .addUserOption((o) => o.setName('kullanici').setDescription('Hedef kullanici').setRequired(true))
    )
    .addSubcommand((s) => s.setName('rastgele').setDescription('Rastgele bir hedef sec'))
    .addSubcommand((s) => s.setName('bilgi').setDescription('Su anki hedefini goster'))
    .addSubcommand((s) =>
      s
        .setName('degistir')
        .setDescription('Hedefini degistir')
        .addUserOption((o) => o.setName('kullanici').setDescription('Yeni hedef').setRequired(true))
    )
    .addSubcommand((s) => s.setName('gecmis').setDescription('Gecmis hedeflerini goster')),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const anahtar = `${interaction.guildId || 'dm'}:${interaction.user.id}`;

    if (alt === 'sec' || alt === 'degistir') {
      const hedef = interaction.options.getUser('kullanici');

      if (hedef.id === interaction.user.id) {
        return interaction.reply({ content: `${emoji('error')} Kendini hedef secemezsin, en azindan bunu boyle secme :)`, ephemeral: true });
      }
      if (hedef.bot) {
        return interaction.reply({ content: `${emoji('error')} Botlar hedef olamaz.`, ephemeral: true });
      }

      AKTIF_HEDEFLER.set(anahtar, hedef.id);

      const container = metinContainerOlustur([
        `# ${emoji('target')} Hedef ${alt === 'degistir' ? 'Degistirildi' : 'Secildi'}`,
        `Yeni hedefin: <@${hedef.id}>\n\`/troll hedef\` ile ona troll gonderebilirsin.`,
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'rastgele') {
      const uyeler = interaction.guild?.members.cache.filter((m) => !m.user.bot && m.id !== interaction.user.id);
      const secilen = uyeler?.random();

      if (!secilen) {
        return interaction.reply({ content: `${emoji('error')} Rastgele secilecek uygun bir uye bulunamadi.`, ephemeral: true });
      }

      AKTIF_HEDEFLER.set(anahtar, secilen.id);

      const container = metinContainerOlustur([
        `# ${emoji('target')} Rastgele Hedef Secildi`,
        `Hedefin: <@${secilen.id}>`,
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'bilgi') {
      const hedefId = AKTIF_HEDEFLER.get(anahtar);
      if (!hedefId) {
        return interaction.reply({ content: `${emoji('loading')} Henuz bir hedef secmedin. \`/hedef sec\` ile secebilirsin.`, ephemeral: true });
      }
      const container = metinContainerOlustur([`# ${emoji('target')} Aktif Hedefin`, `<@${hedefId}>`]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'gecmis') {
      const gecmis = await TrollHistory.find({ kaynakUserId: interaction.user.id, tur: 'ozel' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      if (!gecmis.length) {
        return interaction.reply({ content: `${emoji('loading')} Henuz ozel hedef gecmisin yok.`, ephemeral: true });
      }

      const satirlar = gecmis.map((g) => `<@${g.hedefUserId}> — ${g.icerik}`);
      const container = metinContainerOlustur([`# 📜 Hedef Gecmisin`, satirlar.join('\n\n')]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }
  },
};
