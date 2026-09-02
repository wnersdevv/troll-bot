'use strict';

const path = require('path');
const fs = require('fs');
const { ayarlar } = require('./ayarlar');

const YUKLU_DILLER = {};

function dilYukle(kod) {
  if (YUKLU_DILLER[kod]) return YUKLU_DILLER[kod];
  const dosyaYolu = path.join(__dirname, '..', 'locales', `${kod}.json`);
  if (!fs.existsSync(dosyaYolu)) return null;
  const veri = JSON.parse(fs.readFileSync(dosyaYolu, 'utf-8'));
  YUKLU_DILLER[kod] = veri;
  return veri;
}

function t(anahtar, degiskenler = {}, dilKodu) {
  const kod = dilKodu || ayarlar().bot.language || 'tr';
  const dil = dilYukle(kod) || dilYukle('tr');
  const parcalar = anahtar.split('.');
  let deger = dil;
  for (const p of parcalar) {
    deger = deger && deger[p];
  }
  if (typeof deger !== 'string') return anahtar;

  return deger.replace(/\{(\w+)\}/g, (_, isim) =>
    Object.prototype.hasOwnProperty.call(degiskenler, isim) ? String(degiskenler[isim]) : `{${isim}}`
  );
}

module.exports = { t };
