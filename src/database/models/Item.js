'use strict';

const { Schema, model } = require('mongoose');

/**
 * Rarity ic degerleri Ingilizce tutulur (kod tutarliligi icin),
 * ancak kullaniciya HER ZAMAN Turkce karsiligi gosterilir.
 * Bkz: src/utils/nadirlik.js -> RARITY_TURKCE
 */
const itemSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // ornek: "altin_kilic"
    isim: { type: String, required: true },
    aciklama: { type: String, default: '' },
    emoji: { type: String, default: '📦' },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'secret'],
      default: 'common',
    },
    fiyat: { type: Number, default: 100 },
    satisFiyati: { type: Number, default: 40 }, // geri satista alinan miktar
    marketteSatilir: { type: Boolean, default: true },
    kullanimEtkisi: { type: String, default: null }, // ornek: "xp_bonus_10", "coin_bonus_5" - basit metin etiketi
  },
  { timestamps: true }
);

module.exports = model('Item', itemSchema);
