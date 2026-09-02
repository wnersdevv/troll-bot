'use strict';

const { Schema, model } = require('mongoose');

const dailyRewardSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    streak: { type: Number, default: 0 },
    enUzunStreak: { type: Number, default: 0 },
    sonAlinmaTarihi: { type: Date, default: null },
    haftalikSonAlinma: { type: Date, default: null },
    toplamAlinan: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model('DailyReward', dailyRewardSchema);
