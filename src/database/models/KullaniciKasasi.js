'use strict';

const { Schema, model } = require('mongoose');

const kullaniciKasasiSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    kasaKey: { type: String, required: true },
    adet: { type: Number, default: 1 },
  },
  { timestamps: true }
);

kullaniciKasasiSchema.index({ userId: 1, kasaKey: 1 }, { unique: true });

module.exports = model('KullaniciKasasi', kullaniciKasasiSchema);
