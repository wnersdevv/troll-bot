'use strict';

const { Schema, model } = require('mongoose');

const userProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 200 },
    favoriteColor: { type: String, default: '#5865F2' },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    prestij: { type: Number, default: 0 },
    badges: [{ type: String }],

    seciliUnvan: { type: String, default: null },
    kazanilanUnvanlar: [{ type: String }],

    ozellestirme: {
      tema: { type: String, default: 'discord' },
      banner: { type: String, default: null },
      cerceve: { type: String, default: null },
      arkaplan: { type: String, default: null },
    },

    settings: {
      dmNotifications: { type: Boolean, default: true },
      publicProfile: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userProfileSchema.methods.xpEkle = function xpEkle(miktar) {
  this.xp += miktar;
  const gerekliXp = (this.level + this.prestij * 10) * 100;
  if (this.xp >= gerekliXp) {
    this.xp -= gerekliXp;
    this.level += 1;
    return true; // seviye atladi
  }
  return false;
};

/** Seviye 100'e ulasan oyuncu prestij atlayip 1. seviyeye donebilir. */
userProfileSchema.methods.prestijAtla = function prestijAtla() {
  if (this.level < 100) return false;
  this.prestij += 1;
  this.level = 1;
  this.xp = 0;
  return true;
};

module.exports = model('UserProfile', userProfileSchema);
