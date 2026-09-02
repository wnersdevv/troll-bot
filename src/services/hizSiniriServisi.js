'use strict';

/**
 * Rate limit / cooldown servisi.
 * Redis varsa (REDIS_URL env) onu kullanmaya calisir; yoksa guvenli bir
 * in-memory Map fallback'ine duser. Bot tek instance calisirken bu yeterlidir.
 */

let redisClient = null;
let redisDeneniyor = false;

async function redisBaglantisiniDene() {
  if (redisDeneniyor) return;
  redisDeneniyor = true;
  const url = process.env.REDIS_URL;
  if (!url) return;

  try {
    // Opsiyonel bagimlilik: yuklu degilse sessizce memory fallback kullanilir.
    // eslint-disable-next-line global-require
    const { createClient } = require('redis');
    const client = createClient({ url });
    client.on('error', () => {
      redisClient = null;
    });
    await client.connect();
    redisClient = client;
    console.log('[hizSiniri] Redis baglantisi aktif.');
  } catch (err) {
    console.warn('[hizSiniri] Redis kullanilamiyor, memory fallback aktif:', err.message);
    redisClient = null;
  }
}

redisBaglantisiniDene();

const memoryDeposu = new Map(); // key -> { sayac, sifirlanmaZamani }
const cooldownDeposu = new Map(); // key -> bitisZamani (ms epoch)

/**
 * Sabit pencereli rate limit kontrolu.
 * @returns {Promise<{izinVerildi: boolean, kalanSaniye: number}>}
 */
async function hizSiniriKontrolEt(anahtar, maxIstek, pencereMs) {
  const simdi = Date.now();

  if (redisClient) {
    const redisAnahtar = `hizsiniri:${anahtar}`;
    const sayac = await redisClient.incr(redisAnahtar);
    if (sayac === 1) {
      await redisClient.pExpire(redisAnahtar, pencereMs);
    }
    if (sayac > maxIstek) {
      const kalanMs = await redisClient.pTTL(redisAnahtar);
      return { izinVerildi: false, kalanSaniye: Math.ceil(Math.max(kalanMs, 0) / 1000) };
    }
    return { izinVerildi: true, kalanSaniye: 0 };
  }

  let kayit = memoryDeposu.get(anahtar);
  if (!kayit || kayit.sifirlanmaZamani <= simdi) {
    kayit = { sayac: 0, sifirlanmaZamani: simdi + pencereMs };
    memoryDeposu.set(anahtar, kayit);
  }
  kayit.sayac += 1;

  if (kayit.sayac > maxIstek) {
    return { izinVerildi: false, kalanSaniye: Math.ceil((kayit.sifirlanmaZamani - simdi) / 1000) };
  }
  return { izinVerildi: true, kalanSaniye: 0 };
}

/**
 * Basit komut cooldown kontrolu (kullanici+komut bazli).
 */
function cooldundaMi(anahtar, saniyeSuresi) {
  const simdi = Date.now();
  const bitis = cooldownDeposu.get(anahtar);

  if (bitis && bitis > simdi) {
    return { aktif: true, kalanSaniye: Math.ceil((bitis - simdi) / 1000) };
  }

  cooldownDeposu.set(anahtar, simdi + saniyeSuresi * 1000);
  return { aktif: false, kalanSaniye: 0 };
}

module.exports = { hizSiniriKontrolEt, cooldundaMi };
