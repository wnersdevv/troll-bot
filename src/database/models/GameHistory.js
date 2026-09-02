'use strict';

const { Schema, model } = require('mongoose');

const gameHistorySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    guildId: { type: String, required: true },
    oyunAdi: { type: String, required: true },
    sonuc: { type: String, enum: ['kazandi', 'kaybetti', 'berabere'], required: true },
    skor: { type: Number, default: 0 },
    detay: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

gameHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = model('GameHistory', gameHistorySchema);
