'use strict';

const chalk = require('chalk');
const mongoose = require('mongoose');

function hataYonetimiKur(client) {
  process.on('unhandledRejection', (hata) => {
    console.error(chalk.red('[hataYoneticisi] Islenmemis Promise reddi:'), hata);
  });

  process.on('uncaughtException', (hata) => {
    console.error(chalk.red('[hataYoneticisi] Yakalanmamis istisna:'), hata);
  });

  client.on('error', (hata) => {
    console.error(chalk.red('[discord] Client hatasi:'), hata);
  });

  client.on('shardError', (hata) => {
    console.error(chalk.red('[discord] Shard hatasi:'), hata);
  });

  const kapatiliyorMu = { deger: false };

  async function zarifKapat(sinyal) {
    if (kapatiliyorMu.deger) return;
    kapatiliyorMu.deger = true;

    console.log(chalk.yellow(`\n[kapatma] ${sinyal} alindi, bot kapatiliyor...`));

    try {
      client.destroy();
      console.log(chalk.gray('[kapatma] Discord baglantisi kapatildi.'));
    } catch (err) {
      console.error(chalk.red('[kapatma] Discord baglantisi kapatilirken hata:'), err.message);
    }

    try {
      await mongoose.connection.close();
      console.log(chalk.gray('[kapatma] MongoDB baglantisi kapatildi.'));
    } catch (err) {
      console.error(chalk.red('[kapatma] MongoDB kapatilirken hata:'), err.message);
    }

    process.exit(0);
  }

  process.on('SIGINT', () => zarifKapat('SIGINT'));
  process.on('SIGTERM', () => zarifKapat('SIGTERM'));
}

module.exports = { hataYonetimiKur };
