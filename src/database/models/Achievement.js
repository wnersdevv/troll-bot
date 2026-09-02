'use strict';

const { Schema, model } = require('mongoose');

const achievementSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    achievementKey: { type: String, required: true },
    baslik: { type: String, required: true },
    aciklama: { type: String, default: '' },
    tamamlandi: { type: Boolean, default: false },
    ilerleme: { type: Number, default: 0 },
    hedefSayi: { type: Number, default: 1 },
    tamamlanmaTarihi: { type: Date, default: null },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });

module.exports = model('Achievement', achievementSchema);
