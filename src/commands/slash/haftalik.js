'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { haftalikOduluTalepEt } = require('../../services/ekonomiServisi');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder().setName('haftalik').setDescription('Haftalik odulunu al'),

  async execute(interaction) {
    const sonuc = await haftalikOduluTalepEt(interaction.user.id);

    if (!sonuc.basarili) {
      const gun = Math.floor(sonuc.kalanSaat / 24);
      const saat = sonuc.kalanSaat % 24;
      const container = metinContainerOlustur([
        `# ${emoji('loading')} Haftalik Odulunu Zaten Aldin`,
        `Tekrar **${gun} gun ${saat} saat** sonra gel.`,
      ], 0xf59e0b);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    const container = metinContainerOlustur([
      `# ${emoji('coin')} Haftalik Odul Alindi!`,
      `**+${sonuc.miktar}** ${emoji('coin')} kazandin.`,
    ], 0x22c55e);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  },
};
