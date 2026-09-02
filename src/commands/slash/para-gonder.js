'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { coinTransferEt } = require('../../services/ekonomiServisi');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('para-gonder')
    .setDescription('Baska bir kullaniciya coin gonder')
    .addUserOption((o) => o.setName('kullanici').setDescription('Alici').setRequired(true))
    .addIntegerOption((o) => o.setName('miktar').setDescription('Gonderilecek miktar').setRequired(true).setMinValue(1)),

  async execute(interaction) {
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
      return interaction.reply({ content: `${emoji('error')} Yeterli coinin yok. Cep bakiyen: ${sonuc.bakiye}`, ephemeral: true });
    }

    const container = metinContainerOlustur([
      `# ${emoji('coin')} Transfer Basarili`,
      `<@${interaction.user.id}> → <@${alici.id}> : **${miktar}** ${emoji('coin')}`,
    ], 0x22c55e);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  },
};
