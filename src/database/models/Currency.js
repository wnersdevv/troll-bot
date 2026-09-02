'use strict';

const { Schema, model } = require('mongoose');

/**
 * NOT: Bu tamamen sanal, bot-ici bir puan sistemidir.
 * Gercek para veya kumar degeri tasimaz.
 */
const currencySchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    bakiye: { type: Number, default: 100 },
    banka: { type: Number, default: 0 },
    bankaKapasitesi: { type: Number, default: 5000 },
    toplamKazanilan: { type: Number, default: 100 },
    toplamHarcanan: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model('Currency', currencySchema);
