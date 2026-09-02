'use strict';

const { Schema, model } = require('mongoose');

/**
 * Kasa tanimi. Her kasa turu, hangi rarity'lerin ne agirlikla (weight)
 * cikabilecegini tanimlar. Gercek RNG hesaplamasi src/services/kasaServisi.js icinde.
 */
const kasaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // ornek: "normal", "nadir", "etkinlik"
    isim: { type: String, required: true },
    fiyat: { type: Number, default: 0 }, // 0 ise sadece odul olarak verilir, satin alinamaz
    satinAlinabilir: { type: Boolean, default: true },
    // Her agirlik girisi bir rarity'e karsilik gelir. Toplam agirliga gore RNG yapilir.
    agirliklar: {
      common: { type: Number, default: 50 },
      uncommon: { type: Number, default: 25 },
      rare: { type: Number, default: 15 },
      epic: { type: Number, default: 7 },
      legendary: { type: Number, default: 2.5 },
      mythic: { type: Number, default: 0.4 },
      secret: { type: Number, default: 0.1 },
    },
  },
  { timestamps: true }
);

module.exports = model('Kasa', kasaSchema);
