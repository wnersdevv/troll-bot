'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');

function deterministikYuzdeUret(tohum, uzantı) {
  let toplam = 0;
  const metin = `${tohum}:${uzantı}`;
  for (const c of metin) toplam += c.charCodeAt(0);
  return toplam % 101; // 0-100
}

function sonucUret(userId) {
  const kaos = deterministikYuzdeUret(userId, 'kaos');
  const ciddiyet = 100 - deterministikYuzdeUret(userId, 'ciddiyet');
  const sans = deterministikYuzdeUret(userId, 'sans');
  const trollYuzdesi = Math.round((kaos + (100 - ciddiyet) + sans) / 3);
  return { kaos, ciddiyet, sans, trollYuzdesi };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('troll-testi')
    .setDescription('Eglence amacli troll testi (gercek bir psikolojik degerlendirme degildir)')
    .addSubcommand((s) => s.setName('hizli').setDescription('Hizli sonuc'))
    .addSubcommand((s) => s.setName('normal').setDescription('Standart sonuc'))
    .addSubcommand((s) => s.setName('detay').setDescription('Detayli sonuc'))
    .addSubcommand((s) =>
      s
        .setName('kullanici')
        .setDescription('Baska bir kullanicinin (eglence amacli) sonucunu goster')
        .addUserOption((o) => o.setName('kullanici').setDescription('Kullanici').setRequired(true))
    ),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const hedef = alt === 'kullanici' ? interaction.options.getUser('kullanici') : interaction.user;
    const { kaos, ciddiyet, sans, trollYuzdesi } = sonucUret(hedef.id);

    const satirlar = [`Kaos: %${kaos}`, `Ciddiyet: %${ciddiyet}`, `Sans: %${sans}`, '', `**GENEL: %${trollYuzdesi} TROLL**`];

    if (alt === 'detay') {
      satirlar.push(
        '',
        '-# Bu sonuc tamamen rastgele/eglence amaclidir, gercek bir kisilik veya psikolojik degerlendirme degildir.'
      );
    }

    const container = metinContainerOlustur([`# 🤡 Troll Testi — <@${hedef.id}>`, satirlar.join('\n')], 0xf59e0b);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  },
};
