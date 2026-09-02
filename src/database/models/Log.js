'use strict';

const { Schema, model } = require('mongoose');

const logSchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    tur: {
      type: String,
      enum: ['komut', 'hata', 'yonetim', 'ekonomi', 'oyun', 'troll'],
      required: true,
    },
    aktorId: { type: String, default: null },
    mesaj: { type: String, required: true },
    detay: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

logSchema.index({ guildId: 1, createdAt: -1 });

module.exports = model('Log', logSchema);
