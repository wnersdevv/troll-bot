'use strict';

const { Schema, model } = require('mongoose');

const questSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    questKey: { type: String, required: true }, // ornek: "gunluk_3_oyun"
    baslik: { type: String, required: true },
    aciklama: { type: String, default: '' },
    hedefSayi: { type: Number, default: 1 },
    ilerleme: { type: Number, default: 0 },
    odulCoin: { type: Number, default: 25 },
    tamamlandi: { type: Boolean, default: false },
    odulAlindi: { type: Boolean, default: false },
    tur: { type: String, enum: ['gunluk', 'rastgele'], default: 'gunluk' },
    sonGecerlilik: { type: Date, required: true },
  },
  { timestamps: true }
);

questSchema.index({ userId: 1, questKey: 1, sonGecerlilik: 1 }, { unique: true });

module.exports = model('Quest', questSchema);
