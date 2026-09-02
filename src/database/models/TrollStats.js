'use strict';

const { Schema, model } = require('mongoose');

const trollStatsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    trollYapilan: { type: Number, default: 0 }, // baskasina troll yapti
    trollYenilen: { type: Number, default: 0 }, // hedef oldu
    puan: { type: Number, default: 0 },
    enSonTrollZamani: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = model('TrollStats', trollStatsSchema);
