'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { hesapGetirVeyaOlustur } = require('../../services/ekonomiServisi');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bakiye')
    .setDescription('Cep ve banka bakiyeni goster')
    .addUserOption((o) => o.setName('kullanici').setDescription('Baska bir kullanici (bos birakirsan kendin)').setRequired(false)),

  async execute(interaction) {
    const hedef = interaction.options.getUser('kullanici') || interaction.user;
    const hesap = await hesapGetirVeyaOlustur(hedef.id);

    const container = metinContainerOlustur([
      `# ${emoji('coin')} ${hedef.username} — Bakiye`,
      [
        `💵 Cep: **${hesap.bakiye}** ${emoji('coin')}`,
        `🏦 Banka: **${hesap.banka}** / ${hesap.bankaKapasitesi} ${emoji('coin')}`,
        `📈 Toplam: **${hesap.bakiye + hesap.banka}** ${emoji('coin')}`,
      ].join('\n'),
    ]);

    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
  },
};
