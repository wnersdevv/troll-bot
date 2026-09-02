'use strict';

const { Schema, model } = require('mongoose');

const badgeSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    isim: { type: String, required: true },
    aciklama: { type: String, default: '' },
    emoji: { type: String, default: '🏅' },
    nadirlik: { type: String, enum: ['yaygin', 'nadir', 'epik', 'efsanevi'], default: 'yaygin' },
  },
  { timestamps: true }
);

module.exports = model('Badge', badgeSchema);
