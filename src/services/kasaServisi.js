'use strict';

const { Item, Envanter } = require('../database/models');

/**
 * Agirlikli (weighted) rastgele rarity secimi.
 * Guvenli RNG: Math.random() burada yeterlidir cunku sonuc parasal
 * bir "kumar" degil, kozmetik/eglence amacli bir odul dagitimidir;
 * yine de agirliklar toplamina gore adil ve tutarli sekilde secim yapilir.
 */
function rastgeleRarity(agirliklar) {
  const girisler = Object.entries(agirliklar.toObject ? agirliklar.toObject() : agirliklar);
  const toplam = girisler.reduce((s, [, w]) => s + w, 0);
  let rastgele = Math.random() * toplam;

  for (const [rarity, agirlik] of girisler) {
    rastgele -= agirlik;
    if (rastgele <= 0) return rarity;
  }
  return girisler[0][0];
}

/**
 * Bir kasa acar: rarity'i RNG ile secer, o rarity'deki itemlerden birini
 * rastgele dondurur ve kullanicinin envanterine ekler.
 */
async function kasaAc(userId, kasaBelgesi) {
  const secilenRarity = rastgeleRarity(kasaBelgesi.agirliklar);
  const adaylar = await Item.find({ rarity: secilenRarity });

  if (!adaylar.length) {
    // Bu rarity'de tanimli item yoksa bir alt rarity'e dus (kullaniciyi bos elle birakma)
    const tumRarityler = ['secret', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
    const baslangicIndex = tumRarityler.indexOf(secilenRarity);
    for (let i = baslangicIndex + 1; i < tumRarityler.length; i += 1) {
      const yedekAdaylar = await Item.find({ rarity: tumRarityler[i] });
      if (yedekAdaylar.length) {
        const secilenItem = yedekAdaylar[Math.floor(Math.random() * yedekAdaylar.length)];
        await itemEkle(userId, secilenItem.key);
        return secilenItem;
      }
    }
    return null;
  }

  const secilenItem = adaylar[Math.floor(Math.random() * adaylar.length)];
  await itemEkle(userId, secilenItem.key);
  return secilenItem;
}

async function itemEkle(userId, itemKey, adet = 1) {
  await Envanter.findOneAndUpdate(
    { userId, itemKey },
    { $inc: { adet } },
    { upsert: true }
  );
}

async function itemCikar(userId, itemKey, adet = 1) {
  const kayit = await Envanter.findOneAndUpdate(
    { userId, itemKey, adet: { $gte: adet } },
    { $inc: { adet: -adet } },
    { new: true }
  );
  return Boolean(kayit);
}

module.exports = { kasaAc, itemEkle, itemCikar, rastgeleRarity };
