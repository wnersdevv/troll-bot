'use strict';

const { Schema, model } = require('mongoose');

const gameStatsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    guncelSeri: { type: Number, default: 0 },
    enUzunSeri: { type: Number, default: 0 },
    oyunlar: {
      type: Map,
      of: new Schema(
        {
          oynanan: { type: Number, default: 0 },
          kazanilan: { type: Number, default: 0 },
          kaybedilen: { type: Number, default: 0 },
          beraberlik: { type: Number, default: 0 },
          enIyiSkor: { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = model('GameStats', gameStatsSchema);
