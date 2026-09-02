'use strict';

const { Schema, model } = require('mongoose');

const envanterSatiriSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    itemKey: { type: String, required: true },
    adet: { type: Number, default: 1 },
  },
  { timestamps: true }
);

envanterSatiriSchema.index({ userId: 1, itemKey: 1 }, { unique: true });

module.exports = model('Envanter', envanterSatiriSchema);
