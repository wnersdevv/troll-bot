'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { GuildSettings } = require('../../database/models');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayarlar')
    .setDescription('Sunucu ayarlarini goruntule/degistir')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('genel').setDescription('Genel sunucu ayarlarini goster'))
    .addSubcommand((s) =>
      s
        .setName('troll')
        .setDescription('Troll sistemini ac/kapat')
        .addBooleanOption((o) => o.setName('durum').setDescription('Aktif mi?').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('oyun')
        .setDescription('Oyun sistemini ac/kapat')
        .addBooleanOption((o) => o.setName('durum').setDescription('Aktif mi?').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('log')
        .setDescription('Log kanalini ayarla')
        .addChannelOption((o) => o.setName('kanal').setDescription('Log kanali').setRequired(true))
    )
    .addSubcommand((s) => s.setName('sifirla').setDescription('Sunucu ayarlarini varsayilana dondur')),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: `${emoji('error')} Bu komut sadece sunucularda kullanilabilir.`, ephemeral: true });
    }

    const alt = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (alt === 'genel') {
      const ayar = (await GuildSettings.findOne({ guildId })) || {};
      const container = metinContainerOlustur([
        '# ⚙️ Sunucu Ayarlari',
        `🤡 Troll: ${ayar.trollEnabled !== false ? '✅' : '❌'}\n🎮 Oyun: ${ayar.gamesEnabled !== false ? '✅' : '❌'}\n🪙 Ekonomi: ${ayar.economyEnabled !== false ? '✅' : '❌'}\n📜 Log: ${ayar.logEnabled ? `✅ <#${ayar.logChannelId}>` : '❌'}`,
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'troll' || alt === 'oyun') {
      const durum = interaction.options.getBoolean('durum');
      const alan = alt === 'troll' ? 'trollEnabled' : 'gamesEnabled';
      await GuildSettings.findOneAndUpdate({ guildId }, { $set: { [alan]: durum } }, { upsert: true });
      return interaction.reply({ content: `${emoji('success')} Ayar guncellendi.`, ephemeral: true });
    }

    if (alt === 'log') {
      const kanal = interaction.options.getChannel('kanal');
      await GuildSettings.findOneAndUpdate(
        { guildId },
        { $set: { logChannelId: kanal.id, logEnabled: true } },
        { upsert: true }
      );
      return interaction.reply({ content: `${emoji('success')} Log kanali <#${kanal.id}> olarak ayarlandi.`, ephemeral: true });
    }

    if (alt === 'sifirla') {
      await GuildSettings.findOneAndDelete({ guildId });
      return interaction.reply({ content: `${emoji('success')} Sunucu ayarlari varsayilana donduruldu.`, ephemeral: true });
    }
  },
};
