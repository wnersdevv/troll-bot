'use strict';

const mongoose = require('mongoose');
const chalk = require('chalk');
const { ayarlar } = require('../../utils/ayarlar');

let baglaniyor = false;

async function veritabaninaBaglan() {
  if (baglaniyor) return;
  baglaniyor = true;

  const uri = ayarlar().database.mongodb;
  if (!uri) {
    console.warn(chalk.yellow('[mongo] "database.mongodb" (veya MONGODB_URI) tanimli degil. Veritabani baglantisi atlaniyor.'));
    baglaniyor = false;
    return;
  }

  mongoose.connection.on('connected', () => {
    console.log(chalk.green('[mongo] Veritabanina baglanildi.'));
  });

  mongoose.connection.on('error', (err) => {
    console.error(chalk.red('[mongo] Baglanti hatasi:'), err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn(chalk.yellow('[mongo] Baglanti koptu, yeniden denenecek...'));
    setTimeout(() => veritabaninaBaglan().catch(() => {}), 5000);
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
  } catch (err) {
    console.error(chalk.red('[mongo] Ilk baglanti denemesi basarisiz:'), err.message);
    setTimeout(() => {
      baglaniyor = false;
      veritabaninaBaglan().catch(() => {});
    }, 5000);
    return;
  }

  baglaniyor = false;
}

module.exports = { veritabaninaBaglan };
