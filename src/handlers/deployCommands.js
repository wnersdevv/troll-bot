'use strict';

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const chalk = require('chalk');
const { ayarlar, dogrula } = require('../utils/ayarlar');

async function komutlariYayinla() {
  const eksikler = dogrula();
  if (eksikler.length) {
    console.error(chalk.red('[deploy] Eksik ayarlar:'), eksikler.join(', '));
    process.exit(1);
  }

  const a = ayarlar();
  const komutlarKlasoru = path.join(__dirname, '..', 'commands', 'slash');
  const dosyalar = fs.readdirSync(komutlarKlasoru).filter((f) => f.endsWith('.js'));

  const govdeler = [];
  for (const dosya of dosyalar) {
    const komut = require(path.join(komutlarKlasoru, dosya));
    if (komut?.data) {
      govdeler.push(komut.data.toJSON());
    }
  }

  const rest = new REST({ version: '10' }).setToken(a.discord.token);

  try {
    console.log(chalk.cyan(`[deploy] ${govdeler.length} komut yayinlaniyor...`));

    const hedefRota = a.discord.guildId
      ? Routes.applicationGuildCommands(a.discord.clientId, a.discord.guildId)
      : Routes.applicationCommands(a.discord.clientId);

    await rest.put(hedefRota, { body: govdeler });

    console.log(
      chalk.green(
        `[deploy] Basarili. Hedef: ${a.discord.guildId ? 'Sunucu (aninda)' : 'Global (guncelleme ~1 saat surebilir)'}`
      )
    );
  } catch (err) {
    console.error(chalk.red('[deploy] Hata:'), err);
    process.exit(1);
  }
}

if (require.main === module) {
  komutlariYayinla();
}

module.exports = { komutlariYayinla };
