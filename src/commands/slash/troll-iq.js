'use strict';

const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');

const SORULAR = [
  {
    soru: 'Bir arkadasin "5 dakikaya gelirim" dedi. Gercekte ne kadar surer?',
    secenekler: [
      { etiket: '5 dakika', puan: 0 },
      { etiket: '30 dakika', puan: 5 },
      { etiket: 'Belirsiz sure', puan: 10 },
    ],
  },
  {
    soru: 'Grup sohbetinde biri "kim online" diye sorunca ne yaparsin?',
    secenekler: [
      { etiket: 'Cevap veririm', puan: 0 },
      { etiket: 'Görmezden gelirim', puan: 5 },
      { etiket: 'Yanlis cevap veririm', puan: 10 },
    ],
  },
  {
    soru: 'Bir oyun kaybettiginde tepkin nedir?',
    secenekler: [
      { etiket: 'Sakin kalirim', puan: 0 },
      { etiket: 'Biraz sinirlenirim', puan: 5 },
      { etiket: '"Lag vardi" derim', puan: 10 },
    ],
  },
];

module.exports = {
  data: new SlashCommandBuilder().setName('troll-iq').setDescription('Interaktif troll IQ testi (eglence amaclidir)'),

  async execute(interaction) {
    let toplamPuan = 0;
    let soruIndex = 0;

    const soruGoster = async (ilkYanit = true) => {
      const soru = SORULAR[soruIndex];
      const satir = new ActionRowBuilder().addComponents(
        soru.secenekler.map((secenek, i) =>
          new ButtonBuilder().setCustomId(`iq:${i}`).setLabel(secenek.etiket).setStyle(ButtonStyle.Secondary)
        )
      );

      const container = metinContainerOlustur([
        `# 🧠 Troll IQ — Soru ${soruIndex + 1}/${SORULAR.length}`,
        soru.soru,
      ]);

      if (ilkYanit) {
        return interaction.reply({ components: [container, satir], flags: COMPONENTS_V2_FLAG, withResponse: true });
      }
      return interaction.editReply({ components: [container, satir], flags: COMPONENTS_V2_FLAG });
    };

    await soruGoster(true);
    const mesaj = await interaction.fetchReply();

    const toplayici = mesaj.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id && i.customId.startsWith('iq:'),
      time: 60000,
    });

    toplayici.on('collect', async (i) => {
      const secilenIndex = Number(i.customId.split(':')[1]);
      toplamPuan += SORULAR[soruIndex].secenekler[secilenIndex].puan;
      soruIndex += 1;

      if (soruIndex < SORULAR.length) {
        const soru = SORULAR[soruIndex];
        const satir = new ActionRowBuilder().addComponents(
          soru.secenekler.map((secenek, idx) =>
            new ButtonBuilder().setCustomId(`iq:${idx}`).setLabel(secenek.etiket).setStyle(ButtonStyle.Secondary)
          )
        );
        const container = metinContainerOlustur([`# 🧠 Troll IQ — Soru ${soruIndex + 1}/${SORULAR.length}`, soru.soru]);
        await i.update({ components: [container, satir], flags: COMPONENTS_V2_FLAG });
      } else {
        const maxPuan = SORULAR.length * 10;
        const yuzde = Math.round((toplamPuan / maxPuan) * 100);
        const sonucContainer = metinContainerOlustur([
          '# 🧠 Troll IQ Sonucun',
          `**Troll IQ: %${yuzde}**\n\n-# Bu sonuc tamamen eglence amaclidir.`,
        ], 0x8b5cf6);
        await i.update({ components: [sonucContainer], flags: COMPONENTS_V2_FLAG });
        toplayici.stop();
      }
    });

    toplayici.on('end', async (koleksiyon) => {
      if (koleksiyon.size === 0) {
        await interaction.editReply({
          components: [metinContainerOlustur(['# 🧠 Troll IQ', 'Sure doldu, testi tamamlamadin.'])],
          flags: COMPONENTS_V2_FLAG,
        }).catch(() => {});
      }
    });
  },
};
