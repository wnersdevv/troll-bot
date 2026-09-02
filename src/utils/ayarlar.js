'use strict';

/**
 * Merkezi ayar okuyucu.
 * - "ayarlar.json" dosyasini okur.
 * - Eksik hassas alanlar icin (.env) ortam degiskenlerine dusme (fallback) uygular.
 * - Bu modul tek bir kez yuklenir ve cache'lenir (require cache).
 *
 * Onemli: token/URI gibi hassas alanlarda ENV degeri varsa ENV oncelikli olur.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const AYARLAR_PATH = path.join(process.cwd(), 'ayarlar.json');
const ORNEK_PATH = path.join(process.cwd(), 'ayarlar.example.json');

function dosyayiOku(hedefYol) {
  const raw = fs.readFileSync(hedefYol, 'utf-8');
  return JSON.parse(raw);
}

function ayarlariYukle() {
  let veri;

  if (fs.existsSync(AYARLAR_PATH)) {
    veri = dosyayiOku(AYARLAR_PATH);
  } else if (fs.existsSync(ORNEK_PATH)) {
    console.warn(
      '[ayarlar] "ayarlar.json" bulunamadi, "ayarlar.example.json" temel alinarak devam ediliyor. ' +
        'Lutfen "ayarlar.example.json" dosyasini "ayarlar.json" olarak kopyalayip doldurun.'
    );
    veri = dosyayiOku(ORNEK_PATH);
  } else {
    throw new Error('Ne "ayarlar.json" ne de "ayarlar.example.json" bulunamadi.');
  }

  // ENV fallback / override - hassas alanlar
  veri.discord = veri.discord || {};
  veri.database = veri.database || {};

  veri.discord.token = process.env.DISCORD_TOKEN || veri.discord.token || '';
  veri.discord.clientId = process.env.DISCORD_CLIENT_ID || veri.discord.clientId || '';
  veri.discord.guildId = process.env.DISCORD_GUILD_ID || veri.discord.guildId || '';

  veri.database.mongodb = process.env.MONGODB_URI || veri.database.mongodb || '';

  // Destek sunucusu her zaman merkezi ayardan gelir; kod icinde hard-code edilmez.
  if (!veri.discord.supportServer) {
    veri.discord.supportServer = 'https://discord.gg/wnerscode';
  }

  return veri;
}

let cache = null;

function ayarlar() {
  if (!cache) {
    cache = ayarlariYukle();
  }
  return cache;
}

function yenidenYukle() {
  cache = ayarlariYukle();
  return cache;
}

function dogrula() {
  const a = ayarlar();
  const eksikler = [];

  if (!a.discord.token) eksikler.push('discord.token (veya DISCORD_TOKEN)');
  if (!a.discord.clientId) eksikler.push('discord.clientId (veya DISCORD_CLIENT_ID)');
  if (!a.database.mongodb) eksikler.push('database.mongodb (veya MONGODB_URI)');

  return eksikler;
}

module.exports = { ayarlar, yenidenYukle, dogrula };
