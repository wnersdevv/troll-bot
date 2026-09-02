'use strict';

const chalk = require('chalk');
const { Events, MessageFlags } = require('discord.js');
const { hizSiniriKontrolEt } = require('../../services/hizSiniriServisi');
const { logKaydet } = require('../../services/logServisi');
const { ayarlar } = require('../../utils/ayarlar');
const { gelistiriciMi } = require('../../utils/yetki');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      return komutCalistir(interaction);
    }
    // Butonlar ve select menuler kendi mesaj bazli collector'lari icinde
    // yonetildigi icin burada ekstra bir islem yapmaya gerek yok. Ancak
    // troll panel butonlari gibi global (mesaj disi) buton ID'lerini burada yakalayabiliriz.
    if (interaction.isButton() && interaction.customId.startsWith('troll:')) {
      return trollPanelButonuIsle(interaction);
    }
  },
};

async function komutCalistir(interaction) {
  const komut = interaction.client.commands.get(interaction.commandName);
  if (!komut) return;

  const { bakimModuGetir } = require('../commands/slash/yonetim');
  if (bakimModuGetir() && interaction.commandName !== 'yonetim' && !gelistiriciMi(interaction.user.id)) {
    return interaction.reply({
      content: '🛠️ Bot su anda bakim modunda. Lutfen daha sonra tekrar dene.',
      flags: MessageFlags.Ephemeral,
    });
  }

  const a = ayarlar();
  const hizSonuc = await hizSiniriKontrolEt(
    `komut:${interaction.user.id}`,
    a.limits?.rateLimitMaxRequests ?? 8,
    a.limits?.rateLimitWindowMs ?? 10000
  );

  if (!hizSonuc.izinVerildi) {
    return interaction.reply({
      content: `⏳ Cok hizli komut kullaniyorsun. **${hizSonuc.kalanSaniye} saniye** sonra tekrar dene.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    await komut.execute(interaction);

    await logKaydet({
      guildId: interaction.guildId || 'dm',
      tur: 'komut',
      aktorId: interaction.user.id,
      mesaj: `/${interaction.commandName}${interaction.options?.getSubcommand?.(false) ? ' ' + interaction.options.getSubcommand(false) : ''}`,
    });
  } catch (err) {
    console.error(chalk.red(`[komut] "/${interaction.commandName}" calistirilirken hata:`), err);

    await logKaydet({
      guildId: interaction.guildId || 'dm',
      tur: 'hata',
      aktorId: interaction.user.id,
      mesaj: `/${interaction.commandName} calistirilirken hata olustu.`,
      detay: { hata: err.message },
    });

    const hataMesaji = { content: '❌ Bu komutu calistirirken bir hata olustu. Sorun devam ederse destek sunucusuna ulasabilirsin.', flags: MessageFlags.Ephemeral };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(hataMesaji).catch(() => {});
    } else {
      await interaction.reply(hataMesaji).catch(() => {});
    }
  }
}

async function trollPanelButonuIsle(interaction) {
  const eylem = interaction.customId.split(':')[1];
  const yonlendirmeler = {
    rastgele: 'Rastgele troll icin `/troll rastgele` komutunu kullanabilirsin.',
    sans: 'Sans oyunlari icin `/kader bugun` komutunu kullanabilirsin.',
    oyunlar: 'Oyunlar icin `/oyun` komutunu kullanabilirsin.',
    siralama: 'Siralama icin `/siralama coin` veya `/siralama troll` komutunu kullanabilirsin.',
    profil: 'Profilini gormek icin `/profil goruntule` komutunu kullanabilirsin.',
    istatistik: 'Istatistiklerini gormek icin `/troll puan` komutunu kullanabilirsin.',
  };

  await interaction.reply({
    content: yonlendirmeler[eylem] || 'Bu ozellik icin ilgili slash komutunu kullanabilirsin.',
    flags: MessageFlags.Ephemeral,
  });
}
