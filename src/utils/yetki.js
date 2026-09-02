'use strict';

const { ayarlar } = require('./ayarlar');

function gelistiriciMi(userId) {
  const gelistiriciler = ayarlar().developers || [];
  return gelistiriciler.includes(userId);
}

module.exports = { gelistiriciMi };
