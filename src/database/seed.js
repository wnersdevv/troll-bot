'use strict';

const chalk = require('chalk');
const { Item, Kasa, Badge } = require('./models');

/**
 * Market/kasa/rozet KATALOGLARI icin baslangic verisi.
 * Bu, kullanici verisi degildir - bir e-ticaret sitesinin urun listesi gibi
 * botun kendi statik konfigurasyonudur. Idempotent calisir: zaten varsa dokunmaz.
 */
const VARSAYILAN_ITEMLER = [
  { key: 'bronz_madalya', isim: 'Bronz Madalya', aciklama: 'Mutevazi ama gururlu bir baslangic.', emoji: '🥉', rarity: 'common', fiyat: 50, satisFiyati: 15 },
  { key: 'sanslı_nal', isim: 'Sansli Nal', aciklama: 'Oyunlarda biraz sans getirdigine inanilir.', emoji: '🍀', rarity: 'uncommon', fiyat: 200, satisFiyati: 70 },
  { key: 'gumus_kupa', isim: 'Gumus Kupa', aciklama: 'Rakiplerine gosteris yapmak icin ideal.', emoji: '🥈', rarity: 'rare', fiyat: 750, satisFiyati: 250 },
  { key: 'altin_tac', isim: 'Altin Tac', aciklama: 'Sunucunun troll krali/kralicesi oldugunu kanitlar.', emoji: '👑', rarity: 'epic', fiyat: 2500, satisFiyati: 900 },
  { key: 'efsanevi_pelerin', isim: 'Efsanevi Pelerin', aciklama: 'Gizemli ve etkileyici bir gorunum.', emoji: '🧥', rarity: 'legendary', fiyat: 8000, satisFiyati: 3000 },
  { key: 'mitik_yildiz', isim: 'Mitik Yildiz', aciklama: 'Cok az kisi buna sahip.', emoji: '🌟', rarity: 'mythic', fiyat: 25000, satisFiyati: 10000, marketteSatilir: false },
  { key: 'gizli_amblem', isim: 'Gizli Amblem', aciklama: 'Sadece kasalardan cikar, marketten alinamaz.', emoji: '🕶️', rarity: 'secret', fiyat: 0, satisFiyati: 15000, marketteSatilir: false },
];

const VARSAYILAN_KASALAR = [
  { key: 'normal', isim: 'Normal Kasa', fiyat: 150, agirliklar: { common: 60, uncommon: 28, rare: 10, epic: 1.7, legendary: 0.25, mythic: 0.04, secret: 0.01 } },
  { key: 'nadir', isim: 'Nadir Kasa', fiyat: 500, agirliklar: { common: 30, uncommon: 35, rare: 25, epic: 8, legendary: 1.7, mythic: 0.25, secret: 0.05 } },
  { key: 'destansi', isim: 'Destansi Kasa', fiyat: 1500, agirliklar: { common: 10, uncommon: 20, rare: 30, epic: 30, legendary: 8, mythic: 1.7, secret: 0.3 } },
  { key: 'efsanevi', isim: 'Efsanevi Kasa', fiyat: 5000, agirliklar: { common: 2, uncommon: 8, rare: 20, epic: 35, legendary: 28, mythic: 6, secret: 1 } },
  { key: 'mitik', isim: 'Mitik Kasa', fiyat: 15000, agirliklar: { common: 0, uncommon: 2, rare: 10, epic: 28, legendary: 35, mythic: 20, secret: 5 } },
  { key: 'etkinlik', isim: 'Etkinlik Kasasi', fiyat: 0, satinAlinabilir: false, agirliklar: { common: 20, uncommon: 25, rare: 25, epic: 18, legendary: 8, mythic: 3, secret: 1 } },
];

const VARSAYILAN_ROZETLER = [
  { key: 'ilk_adim', isim: 'Ilk Adim', aciklama: 'Botla ilk etkilesimini kurdun.', emoji: '👣', nadirlik: 'yaygin' },
  { key: 'sansli', isim: 'Sansli', aciklama: 'Mitik bir kasa actin.', emoji: '🍀', nadirlik: 'epik' },
  { key: 'koleksiyoncu', isim: 'Koleksiyoncu', aciklama: '10 farkli item topladin.', emoji: '📦', nadirlik: 'nadir' },
  { key: 'efsane', isim: 'Efsane', aciklama: 'Prestij atladin.', emoji: '⭐', nadirlik: 'efsanevi' },
];

async function kataloglariTohumla() {
  let eklenenItem = 0;
  for (const item of VARSAYILAN_ITEMLER) {
    const sonuc = await Item.findOneAndUpdate({ key: item.key }, { $setOnInsert: item }, { upsert: true, new: false });
    if (!sonuc) eklenenItem += 1;
  }

  let eklenenKasa = 0;
  for (const kasa of VARSAYILAN_KASALAR) {
    const sonuc = await Kasa.findOneAndUpdate({ key: kasa.key }, { $setOnInsert: kasa }, { upsert: true, new: false });
    if (!sonuc) eklenenKasa += 1;
  }

  let eklenenRozet = 0;
  for (const rozet of VARSAYILAN_ROZETLER) {
    const sonuc = await Badge.findOneAndUpdate({ key: rozet.key }, { $setOnInsert: rozet }, { upsert: true, new: false });
    if (!sonuc) eklenenRozet += 1;
  }

  if (eklenenItem || eklenenKasa || eklenenRozet) {
    console.log(chalk.cyan(`[seed] Katalog tohumlandi: ${eklenenItem} item, ${eklenenKasa} kasa, ${eklenenRozet} rozet eklendi.`));
  }
}

module.exports = { kataloglariTohumla };
