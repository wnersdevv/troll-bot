'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { gunlukOduluTalepEt } = require('../../services/ekonomiServisi');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder().setName('gunluk').setDescription('Gunluk odulunu al (streak sistemiyle)'),

  async execute(interaction) {
    const sonuc = await gunlukOduluTalepEt(interaction.user.id);

    if (!sonuc.basarili) {
      const container = metinContainerOlustur([
        `# ${emoji('loading')} Bugunku Odulunu Zaten Aldin`,
        `Tekrar **${sonuc.kalanSaat} saat** sonra gel.`,
      ], 0xf59e0b);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    const container = metinContainerOlustur([
      `# ${emoji('coin')} Gunluk Odul Alindi!`,
      `**+${sonuc.miktar}** ${emoji('coin')} kazandin.\n🔥 Streak: **${sonuc.streak}** gun`,
    ], 0x22c55e);
    await interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG });
  },
};
