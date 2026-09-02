'use strict';

/**
 * wnersdev.js — wnersdev Troll botunun ana giris dosyasi (bootstrap).
 *
 * Bu dosya SADECE baslangic sirasini yonetir:
 *   1) Ayarlari dogrula
 *   2) Discord Client'i olustur
 *   3) MongoDB'ye baglan
 *   4) Event ve komut handler'larini yukle
 *   5) Dashboard'u baslat (aktifse)
 *   6) Hata yonetimi / graceful shutdown kur
 *   7) Discord'a giris yap
 *
 * Calistirmak icin: node wnersdev.js
 */

const chalk = require('chalk');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const { ayarlar, dogrula } = require('./src/utils/ayarlar');
const { veritabaninaBaglan } = require('./src/database/connection/mongo');
const { eventleriYukle } = require('./src/handlers/eventYukleyici');
const { komutlariYukle } = require('./src/handlers/komutYukleyici');
const { hataYonetimiKur } = require('./src/handlers/hataYonetici');

async function basla() {
  console.log(chalk.magenta('╔══════════════════════════════════════╗'));
  console.log(chalk.magenta('║       🤡 wnersdev TROLL BASLIYOR      ║'));
  console.log(chalk.magenta('╚══════════════════════════════════════╝'));

  const eksikAyarlar = dogrula();
  if (eksikAyarlar.length) {
    console.error(chalk.red('[baslangic] Eksik zorunlu ayarlar:'));
    eksikAyarlar.forEach((eksik) => console.error(chalk.red(`  - ${eksik}`)));
    console.error(chalk.yellow('\nLutfen "ayarlar.json" dosyasini (veya .env) doldurup tekrar deneyin.'));
    process.exit(1);
  }

  const a = ayarlar();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  client.commands = new Collection();

  hataYonetimiKur(client);

  await veritabaninaBaglan();

  try {
    const { kataloglariTohumla } = require('./src/database/seed');
    await kataloglariTohumla();
  } catch (err) {
    console.error(chalk.red('[baslangic] Katalog tohumlama basarisiz:'), err.message);
  }

  komutlariYukle(client);
  eventleriYukle(client);

  await client.login(a.discord.token);
}

basla().catch((err) => {
  console.error(chalk.red('[baslangic] Kritik hata, bot baslatilamadi:'), err);
  process.exit(1);
});
