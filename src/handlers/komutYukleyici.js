'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * "src/commands/slash" altindaki her komut dosyasini yukler.
 * Her dosya { data: SlashCommandBuilder, execute: fn, ... } export etmelidir.
 */
function komutlariYukle(client) {
  const komutlarKlasoru = path.join(__dirname, '..', 'commands', 'slash');
  const dosyalar = fs.readdirSync(komutlarKlasoru).filter((f) => f.endsWith('.js'));

  let yuklenen = 0;

  for (const dosya of dosyalar) {
    const komutYolu = path.join(komutlarKlasoru, dosya);
    delete require.cache[require.resolve(komutYolu)];
    const komut = require(komutYolu);

    if (!komut?.data?.name || typeof komut.execute !== 'function') {
      console.warn(chalk.yellow(`[komutYukleyici] Gecersiz komut atlaniyor: ${dosya}`));
      continue;
    }

    client.commands.set(komut.data.name, komut);
    yuklenen += 1;
  }

  console.log(chalk.cyan(`[komutYukleyici] ${yuklenen} slash komutu yuklendi.`));
  return yuklenen;
}

module.exports = { komutlariYukle };
