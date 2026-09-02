'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { bakiyeGetir, coinTransferEt, hesapGetirVeyaOlustur } = require('../../services/ekonomiServisi');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('troll-coin')
    .setDescription('Sanal wnersdev coin sistemi (gercek para degeri yoktur)')
    .addSubcommand((s) => s.setName('bakiye').setDescription('Coin bakiyeni goster'))
    .addSubcommand((s) =>
      s
        .setName('gonder')
        .setDescription('Baska bir kullaniciya coin gonder')
        .addUserOption((o) => o.setName('kullanici').setDescription('Alici').setRequired(true))
        .addIntegerOption((o) => o.setName('miktar').setDescription('Gonderilecek miktar').setRequired(true).setMinValue(1))
    ),

  async execute(interaction) {
    const alt = interaction.options.getSubcommand();

    if (alt === 'bakiye') {
      const hesap = await hesapGetirVeyaOlustur(interaction.user.id);
      const container = metinContainerOlustur([
        `# ${emoji('coin')} Coin Bakiyen`,
        `**Bakiye:** ${hesap.bakiye}\n**Toplam Kazanilan:** ${hesap.toplamKazanilan}\n**Toplam Harcanan:** ${hesap.toplamHarcanan}`,
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'gonder') {
      const alici = interaction.options.getUser('kullanici');
      const miktar = interaction.options.getInteger('miktar');

      if (alici.bot) {
        return interaction.reply({ content: `${emoji('error')} Botlara coin gonderemezsin.`, ephemeral: true });
      }

      const sonuc = await coinTransferEt(interaction.user.id, alici.id, miktar);

      if (!sonuc.basarili && sonuc.sebep === 'kendine') {
        return interaction.reply({ content: `${emoji('error')} Kendine coin gonderemezsin.`, ephemeral: true });
      }
      if (!sonuc.basarili && sonuc.sebep === 'yetersiz_bakiye') {
        return interaction.reply({ content: `${emoji('error')} Yeterli coin'in yok. Bakiye: ${sonuc.bakiye}`, ephemeral: true });
      }

      const container = metinContainerOlustur([
        `# ${emoji('coin')} Transfer Basarili`,
        `<@${interaction.user.id}> → <@${alici.id}> : **${miktar}** ${emoji('coin')}`,
      ], 0x22c55e);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
    }
  },
};
