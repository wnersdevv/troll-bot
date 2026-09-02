'use strict';

const { Schema, model } = require('mongoose');

const guildSettingsSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    language: { type: String, default: 'tr' },
    trollEnabled: { type: Boolean, default: true },
    gamesEnabled: { type: Boolean, default: true },
    economyEnabled: { type: Boolean, default: true },
    questsEnabled: { type: Boolean, default: true },
    logChannelId: { type: String, default: null },
    logEnabled: { type: Boolean, default: false },
    notifyChannelId: { type: String, default: null },
    trollCooldownSeconds: { type: Number, default: 10 },
    gameCooldownSeconds: { type: Number, default: 8 },
  },
  { timestamps: true }
);

module.exports = model('GuildSettings', guildSettingsSchema);
