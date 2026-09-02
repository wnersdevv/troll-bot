'use strict';

const { createCanvas, loadImage } = require('canvas');

/**
 * Kullanicinin profil kartini olusturur ve PNG Buffer dondurur.
 */
async function profilKartiOlustur({ username, avatarURL, level, xp, gerekliXp, coin, trollPuan, badgeSayisi }) {
  const genislik = 900;
  const yukseklik = 300;
  const canvas = createCanvas(genislik, yukseklik);
  const ctx = canvas.getContext('2d');

  // Arkaplan gradyan
  const gradyan = ctx.createLinearGradient(0, 0, genislik, yukseklik);
  gradyan.addColorStop(0, '#1e1b4b');
  gradyan.addColorStop(1, '#5b21b6');
  ctx.fillStyle = gradyan;
  roundRect(ctx, 0, 0, genislik, yukseklik, 24);
  ctx.fill();

  // Avatar cercevesi
  const avatarBoyut = 180;
  const avatarX = 60;
  const avatarY = (yukseklik - avatarBoyut) / 2;

  try {
    const avatar = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarBoyut / 2, avatarY + avatarBoyut / 2, avatarBoyut / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarBoyut, avatarBoyut);
    ctx.restore();
  } catch (err) {
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.arc(avatarX + avatarBoyut / 2, avatarY + avatarBoyut / 2, avatarBoyut / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineWidth = 6;
  ctx.strokeStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(avatarX + avatarBoyut / 2, avatarY + avatarBoyut / 2, avatarBoyut / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Kullanici adi
  const metinX = avatarX + avatarBoyut + 40;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(kirp(username, 18), metinX, 80);

  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText(`Seviye ${level}`, metinX, 118);

  // XP bar
  const barX = metinX;
  const barY = 140;
  const barGenislik = genislik - metinX - 60;
  const barYukseklik = 22;
  const oran = Math.min(xp / gerekliXp, 1);

  ctx.fillStyle = '#312e81';
  roundRect(ctx, barX, barY, barGenislik, barYukseklik, 11);
  ctx.fill();

  ctx.fillStyle = '#a78bfa';
  roundRect(ctx, barX, barY, Math.max(barGenislik * oran, 10), barYukseklik, 11);
  ctx.fill();

  ctx.fillStyle = '#e0e7ff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`${xp} / ${gerekliXp} XP`, barX, barY + 40);

  // Istatistik satiri
  const istatistikY = 220;
  ctx.font = 'bold 22px sans-serif';

  ctx.fillStyle = '#fde047';
  ctx.fillText(`🪙 ${coin}`, metinX, istatistikY);

  ctx.fillStyle = '#f87171';
  ctx.fillText(`🤡 ${trollPuan}`, metinX + 160, istatistikY);

  ctx.fillStyle = '#5eead4';
  ctx.fillText(`🏅 ${badgeSayisi}`, metinX + 320, istatistikY);

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, genislik, yukseklik, yaricap) {
  ctx.beginPath();
  ctx.moveTo(x + yaricap, y);
  ctx.arcTo(x + genislik, y, x + genislik, y + yukseklik, yaricap);
  ctx.arcTo(x + genislik, y + yukseklik, x, y + yukseklik, yaricap);
  ctx.arcTo(x, y + yukseklik, x, y, yaricap);
  ctx.arcTo(x, y, x + genislik, y, yaricap);
  ctx.closePath();
}

function kirp(metin, maxUzunluk) {
  if (metin.length <= maxUzunluk) return metin;
  return `${metin.slice(0, maxUzunluk - 1)}…`;
}

module.exports = { profilKartiOlustur };
