'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { bankayaYatir, bankadanCek, hesapGetirVeyaOlustur } = require('../../services/ekonomiServisi');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banka')
    .setDescription('Banka islemleri - coininin bir kismini guvenceye al')
    .addSubcommand((s) => s.setName('bilgi').setDescription('Banka durumunu goster'))
    .addSubcommand((s) =>
      s
        .setName('yatir')
        .setDescription('Cepteki coini bankaya yatir')
        .addIntegerOption((o) => o.setName('miktar').setDescription('Yatirilacak miktar').setRequired(true).setMinValue(1))
    )
    .addSubcommand((s) =>
      s
        .setName('cek')
        .setDescription('Bankadaki coini cepe cek')
        .addIntegerOption((o) => o.setName('miktar').setDescription('Cekilecek miktar').setRequired(true).setMinValue(1))
    ),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (alt === 'bilgi') {
      const hesap = await hesapGetirVeyaOlustur(userId);
      const container = metinContainerOlustur([
        '# 🏦 Banka Bilgisi',
        `Bankadaki: **${hesap.banka}** / ${hesap.bankaKapasitesi} ${emoji('coin')}\nCepteki: **${hesap.bakiye}** ${emoji('coin')}`,
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    const miktar = interaction.options.getInteger('miktar');

    if (alt === 'yatir') {
      const sonuc = await bankayaYatir(userId, miktar);
      if (!sonuc.basarili) {
        const mesaj = sonuc.sebep === 'kapasite_asimi'
          ? `${emoji('error')} Banka kapasiten yetersiz. Kalan kapasite: ${sonuc.kalanKapasite}`
          : `${emoji('error')} Yeterli cep bakiyen yok.`;
        return interaction.reply({ content: mesaj, ephemeral: true });
      }
      const container = metinContainerOlustur(['# 🏦 Yatirma Basarili', `**${miktar}** ${emoji('coin')} bankaya yatirildi.\nBanka: ${sonuc.banka} | Cep: ${sonuc.bakiye}`], 0x22c55e);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'cek') {
      const sonuc = await bankadanCek(userId, miktar);
      if (!sonuc.basarili) {
        return interaction.reply({ content: `${emoji('error')} Bankada yeterli coin yok. Bankadaki: ${sonuc.banka}`, ephemeral: true });
      }
      const container = metinContainerOlustur(['# 🏦 Cekme Basarili', `**${miktar}** ${emoji('coin')} cepe cekildi.\nBanka: ${sonuc.banka} | Cep: ${sonuc.bakiye}`], 0x22c55e);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }
  },
};
