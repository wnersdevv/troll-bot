'use strict';

/**
 * Item/rozet rarity degerleri kod icinde Ingilizce tutulur (tutarlilik icin),
 * ancak kullaniciya HER ZAMAN bu Turkce karsiliklar gosterilir.
 */
const RARITY_TURKCE = {
  common: 'Yaygin',
  uncommon: 'Sira Disi',
  rare: 'Nadir',
  epic: 'Destansi',
  legendary: 'Efsanevi',
  mythic: 'Mitik',
  secret: 'Gizli',
};

const RARITY_RENK = {
  common: 0x9ca3af,
  uncommon: 0x22c55e,
  rare: 0x3b82f6,
  epic: 0xa855f7,
  legendary: 0xf59e0b,
  mythic: 0xef4444,
  secret: 0x000000,
};

const RARITY_EMOJI = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  epic: '🟣',
  legendary: '🟠',
  mythic: '🔴',
  secret: '⚫',
};

function nadirlikAdi(rarity) {
  return RARITY_TURKCE[rarity] || rarity;
}

function nadirlikRengi(rarity) {
  return RARITY_RENK[rarity] || 0x64748b;
}

function nadirlikEmojisi(rarity) {
  return RARITY_EMOJI[rarity] || '⚪';
}

module.exports = { RARITY_TURKCE, RARITY_RENK, RARITY_EMOJI, nadirlikAdi, nadirlikRengi, nadirlikEmojisi };
