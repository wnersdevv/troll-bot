'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function eventleriYukle(client) {
  const eventKlasoru = path.join(__dirname, '..', 'events');
  const dosyalar = fs.readdirSync(eventKlasoru).filter((f) => f.endsWith('.js'));

  for (const dosya of dosyalar) {
    const event = require(path.join(eventKlasoru, dosya));
    if (!event?.name || typeof event.execute !== 'function') continue;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }

  console.log(chalk.cyan(`[eventYukleyici] ${dosyalar.length} event yuklendi.`));
}

module.exports = { eventleriYukle };
