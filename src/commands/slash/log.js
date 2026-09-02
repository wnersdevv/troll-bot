'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { metinContainerOlustur, COMPONENTS_V2_FLAG } = require('../../components/v2Builders');
const { GuildSettings, Log } = require('../../database/models');
const { emoji } = require('../../utils/emojis');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Sunucu log kanalini yonet')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) =>
      s
        .setName('ayarla')
        .setDescription('Log kanalini belirle')
        .addChannelOption((o) => o.setName('kanal').setDescription('Log kanali').setRequired(true))
    )
    .addSubcommand((s) => s.setName('durum').setDescription('Log sisteminin durumunu goster'))
    .addSubcommand((s) => s.setName('test').setDescription('Log kanaline test mesaji gonder'))
    .addSubcommand((s) => s.setName('kapat').setDescription('Log sistemini kapat')),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: `${emoji('error')} Bu komut sadece sunucularda kullanilabilir.`, ephemeral: true });
    }

    const alt = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (alt === 'ayarla') {
      const kanal = interaction.options.getChannel('kanal');
      await GuildSettings.findOneAndUpdate(
        { guildId },
        { $set: { logChannelId: kanal.id, logEnabled: true } },
        { upsert: true }
      );
      return interaction.reply({ content: `${emoji('success')} Log kanali <#${kanal.id}> olarak ayarlandi.`, ephemeral: true });
    }

    if (alt === 'durum') {
      const ayar = await GuildSettings.findOne({ guildId }).lean();
      const kayitSayisi = await Log.countDocuments({ guildId });
      const container = metinContainerOlustur([
        '# 📜 Log Durumu',
        `Aktif: ${ayar?.logEnabled ? '✅' : '❌'}\nKanal: ${ayar?.logChannelId ? `<#${ayar.logChannelId}>` : 'Ayarlanmadi'}\nToplam Kayit: ${kayitSayisi}`,
      ]);
      return interaction.reply({ components: [container], flags: COMPONENTS_V2_FLAG, ephemeral: true });
    }

    if (alt === 'test') {
      const ayar = await GuildSettings.findOne({ guildId });
      if (!ayar?.logEnabled || !ayar.logChannelId) {
        return interaction.reply({ content: `${emoji('error')} Once bir log kanali ayarlamalisin (\`/log ayarla\`).`, ephemeral: true });
      }
      const kanal = await interaction.guild.channels.fetch(ayar.logChannelId).catch(() => null);
      if (!kanal || !kanal.isTextBased()) {
        return interaction.reply({ content: `${emoji('error')} Log kanali bulunamadi veya metin kanali degil.`, ephemeral: true });
      }
      await kanal.send('🧪 Bu bir test log mesajidir — wnersdev Troll log sistemi calisiyor.');
      return interaction.reply({ content: `${emoji('success')} Test mesaji gonderildi.`, ephemeral: true });
    }

    if (alt === 'kapat') {
      await GuildSettings.findOneAndUpdate({ guildId }, { $set: { logEnabled: false } }, { upsert: true });
      return interaction.reply({ content: `${emoji('success')} Log sistemi kapatildi.`, ephemeral: true });
    }
  },
};
