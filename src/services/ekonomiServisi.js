'use strict';

const { Currency, DailyReward } = require('../database/models');
const { ayarlar } = require('../utils/ayarlar');

async function hesapGetirVeyaOlustur(userId) {
  const baslangic = ayarlar().economy?.startingBalance ?? 100;
  // upsert atomik oldugu icin ayni anda iki istek gelse bile tek kayit olusur.
  const hesap = await Currency.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, bakiye: baslangic, toplamKazanilan: baslangic } },
    { upsert: true, new: true }
  );
  return hesap;
}

async function bakiyeGetir(userId) {
  const hesap = await hesapGetirVeyaOlustur(userId);
  return hesap.bakiye;
}

/**
 * Atomik coin ekleme. Read-modify-write yerine dogrudan $inc kullanir,
 * boylece ayni anda gelen birden fazla istekte veri kaybi (race condition) olmaz.
 */
async function coinEkle(userId, miktar) {
  if (miktar <= 0) throw new Error('Eklenecek miktar pozitif olmalidir.');
  await hesapGetirVeyaOlustur(userId); // hesabin var oldugundan emin ol
  const hesap = await Currency.findOneAndUpdate(
    { userId },
    { $inc: { bakiye: miktar, toplamKazanilan: miktar } },
    { new: true }
  );
  return hesap.bakiye;
}

/**
 * Atomik coin cikarma. Bakiye yetersizse tek sorguda basarisiz olur
 * (once oku sonra yaz mantigindaki cift harcama riskini ortadan kaldirir).
 */
async function coinCikar(userId, miktar) {
  if (miktar <= 0) throw new Error('Cikarilacak miktar pozitif olmalidir.');
  await hesapGetirVeyaOlustur(userId);

  const hesap = await Currency.findOneAndUpdate(
    { userId, bakiye: { $gte: miktar } },
    { $inc: { bakiye: -miktar, toplamHarcanan: miktar } },
    { new: true }
  );

  if (!hesap) {
    const guncelHesap = await hesapGetirVeyaOlustur(userId);
    return { basarili: false, bakiye: guncelHesap.bakiye };
  }
  return { basarili: true, bakiye: hesap.bakiye };
}

async function coinTransferEt(gonderenId, aliciId, miktar) {
  if (gonderenId === aliciId) {
    return { basarili: false, sebep: 'kendine' };
  }
  const cikarSonuc = await coinCikar(gonderenId, miktar);
  if (!cikarSonuc.basarili) {
    return { basarili: false, sebep: 'yetersiz_bakiye', bakiye: cikarSonuc.bakiye };
  }
  await coinEkle(aliciId, miktar);
  return { basarili: true };
}

/** Cepteki coin'i bankaya yatirir (banka kapasitesi ile sinirli). */
async function bankayaYatir(userId, miktar) {
  if (miktar <= 0) throw new Error('Yatirilacak miktar pozitif olmalidir.');
  const hesap = await hesapGetirVeyaOlustur(userId);

  if (hesap.bakiye < miktar) {
    return { basarili: false, sebep: 'yetersiz_bakiye' };
  }
  if (hesap.banka + miktar > hesap.bankaKapasitesi) {
    return { basarili: false, sebep: 'kapasite_asimi', kalanKapasite: hesap.bankaKapasitesi - hesap.banka };
  }

  const guncel = await Currency.findOneAndUpdate(
    { userId, bakiye: { $gte: miktar } },
    { $inc: { bakiye: -miktar, banka: miktar } },
    { new: true }
  );

  if (!guncel) return { basarili: false, sebep: 'yetersiz_bakiye' };
  return { basarili: true, bakiye: guncel.bakiye, banka: guncel.banka };
}

/** Bankadaki coin'i cepe ceker. */
async function bankadanCek(userId, miktar) {
  if (miktar <= 0) throw new Error('Cekilecek miktar pozitif olmalidir.');

  const guncel = await Currency.findOneAndUpdate(
    { userId, banka: { $gte: miktar } },
    { $inc: { bakiye: miktar, banka: -miktar } },
    { new: true }
  );

  if (!guncel) {
    const hesap = await hesapGetirVeyaOlustur(userId);
    return { basarili: false, sebep: 'yetersiz_banka', banka: hesap.banka };
  }
  return { basarili: true, bakiye: guncel.bakiye, banka: guncel.banka };
}

async function gunlukOduluTalepEt(userId) {
  const ayar = ayarlar().economy || {};
  const minMiktar = ayar.dailyMin ?? 50;
  const maxMiktar = ayar.dailyMax ?? 150;
  const streakBonus = ayar.dailyStreakBonus ?? 10;
  const bekleSaat = 24;

  let kayit = await DailyReward.findOne({ userId });
  if (!kayit) {
    kayit = await DailyReward.create({ userId });
  }

  const simdi = new Date();

  if (kayit.sonAlinmaTarihi) {
    const gecenSaat = (simdi - kayit.sonAlinmaTarihi) / (1000 * 60 * 60);
    if (gecenSaat < bekleSaat) {
      const kalanSaat = Math.ceil(bekleSaat - gecenSaat);
      return { basarili: false, kalanSaat };
    }
    // 48 saatten fazla ara verildiyse streak sifirlanir
    if (gecenSaat > bekleSaat * 2) {
      kayit.streak = 0;
    }
  }

  const rastgeleMiktar = Math.floor(Math.random() * (maxMiktar - minMiktar + 1)) + minMiktar;
  const bonus = kayit.streak * streakBonus;
  const toplamMiktar = rastgeleMiktar + bonus;

  kayit.streak += 1;
  kayit.enUzunStreak = Math.max(kayit.enUzunStreak, kayit.streak);
  kayit.sonAlinmaTarihi = simdi;
  kayit.toplamAlinan += toplamMiktar;
  await kayit.save();

  await coinEkle(userId, toplamMiktar);

  return { basarili: true, miktar: toplamMiktar, streak: kayit.streak };
}

/** Haftalik odul - DailyReward modelindeki ayri bir "haftalikSonAlinma" alaniyla yonetilir. */
async function haftalikOduluTalepEt(userId) {
  const ayar = ayarlar().economy || {};
  const minMiktar = ayar.weeklyMin ?? 300;
  const maxMiktar = ayar.weeklyMax ?? 800;
  const bekleSaat = 24 * 7;

  let kayit = await DailyReward.findOne({ userId });
  if (!kayit) kayit = await DailyReward.create({ userId });

  const simdi = new Date();
  if (kayit.haftalikSonAlinma) {
    const gecenSaat = (simdi - kayit.haftalikSonAlinma) / (1000 * 60 * 60);
    if (gecenSaat < bekleSaat) {
      return { basarili: false, kalanSaat: Math.ceil(bekleSaat - gecenSaat) };
    }
  }

  const miktar = Math.floor(Math.random() * (maxMiktar - minMiktar + 1)) + minMiktar;
  kayit.haftalikSonAlinma = simdi;
  await kayit.save();
  await coinEkle(userId, miktar);

  return { basarili: true, miktar };
}

async function liderlikTablosuGetir(limit = 10) {
  return Currency.find().sort({ bakiye: -1 }).limit(limit).lean();
}

module.exports = {
  hesapGetirVeyaOlustur,
  bakiyeGetir,
  coinEkle,
  coinCikar,
  coinTransferEt,
  bankayaYatir,
  bankadanCek,
  gunlukOduluTalepEt,
  haftalikOduluTalepEt,
  liderlikTablosuGetir,
};
