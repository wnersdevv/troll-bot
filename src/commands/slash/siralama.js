'use strict';

const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { Currency, TrollStats } = require('../../database/models');
const { liderlikKartiOlustur } = require('../../canvas/liderlikKarti');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('siralama')
    .setDescription('Sunucu/genel siralamalarini goster')
    .addSubcommand((s) => s.setName('coin').setDescription('En cok coin sahibi olanlar'))
    .addSubcommand((s) => s.setName('troll').setDescription('En yuksek troll puanina sahip olanlar')),

  async execute(interaction) {
    await interaction.deferReply();
    const alt = interaction.options.getSubcommand();

    let kayitlar;
    let baslik;
    let degerAlaniAl;

    if (alt === 'coin') {
      kayitlar = await Currency.find().sort({ bakiye: -1 }).limit(10).lean();
      baslik = 'COIN SIRALAMASI';
      degerAlaniAl = (k) => k.bakiye;
    } else {
      kayitlar = await TrollStats.find().sort({ puan: -1 }).limit(10).lean();
      baslik = 'TROLL SIRALAMASI';
      degerAlaniAl = (k) => k.puan;
    }

    if (!kayitlar.length) {
      return interaction.editReply({ content: 'Henuz yeterli veri yok.' });
    }

    const siralamaVerisi = [];
    for (const kayit of kayitlar) {
      try {
        const kullanici = await interaction.client.users.fetch(kayit.userId);
        siralamaVerisi.push({
          isim: kullanici.username,
          deger: degerAlaniAl(kayit),
          avatarURL: kullanici.displayAvatarURL({ extension: 'png', size: 128 }),
        });
      } catch {
        siralamaVerisi.push({ isim: 'Bilinmeyen Kullanici', deger: degerAlaniAl(kayit), avatarURL: interaction.client.user.displayAvatarURL() });
      }
    }

    const buffer = await liderlikKartiOlustur(siralamaVerisi, baslik);
    const ek = new AttachmentBuilder(buffer, { name: 'siralama.png' });
    await interaction.editReply({ files: [ek] });
  },
};
