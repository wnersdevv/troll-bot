'use strict';

const { Schema, model } = require('mongoose');

const trollHistorySchema = new Schema(
  {
    guildId: { type: String, required: true, index: true },
    kaynakUserId: { type: String, required: true },
    hedefUserId: { type: String, required: true },
    tur: { type: String, default: 'rastgele' }, // rastgele | ozel | ovgu | roast
    icerik: { type: String, default: '' },
  },
  { timestamps: true }
);

trollHistorySchema.index({ kaynakUserId: 1, createdAt: -1 });

module.exports = model('TrollHistory', trollHistorySchema);
