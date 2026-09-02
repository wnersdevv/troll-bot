'use strict';

const { createCanvas, loadImage } = require('canvas');

/**
 * @param {{isim: string, deger: number, avatarURL: string}[]} siralama
 */
async function liderlikKartiOlustur(siralama, baslik = 'SIRALAMA') {
  const satirYukseklik = 76;
  const genislik = 800;
  const yukseklik = 100 + satirYukseklik * siralama.length;

  const canvas = createCanvas(genislik, yukseklik);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f0a1f';
  ctx.fillRect(0, 0, genislik, yukseklik);

  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(`🏆 ${baslik}`, 30, 50);

  let y = 100;
  const madalyalar = ['🥇', '🥈', '🥉'];

  for (let i = 0; i < siralama.length; i += 1) {
    const kisi = siralama[i];
    const satirY = y + i * satirYukseklik;

    ctx.fillStyle = i % 2 === 0 ? '#1e1533' : '#150e29';
    ctx.fillRect(20, satirY, genislik - 40, satirYukseklik - 8);

    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#ffffff';
    const siraMetin = madalyalar[i] || `#${i + 1}`;
    ctx.fillText(siraMetin, 36, satirY + 46);

    try {
      const avatar = await loadImage(kisi.avatarURL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(150, satirY + 34, 28, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 122, satirY + 6, 56, 56);
      ctx.restore();
    } catch {
      /* avatar yuklenemezse atla */
    }

    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText(kirp(kisi.isim, 22), 200, satirY + 42);

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#a78bfa';
    ctx.textAlign = 'right';
    ctx.fillText(String(kisi.deger), genislik - 40, satirY + 42);
    ctx.textAlign = 'left';
  }

  return canvas.toBuffer('image/png');
}

function kirp(metin, maxUzunluk) {
  if (metin.length <= maxUzunluk) return metin;
  return `${metin.slice(0, maxUzunluk - 1)}…`;
}

module.exports = { liderlikKartiOlustur };
