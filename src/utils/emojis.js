'use strict';

/**
 * Butun emoji kullanimlari bu dosyadan gelir.
 * "ayarlar.json" -> "emojis" alanindan kullanici kendi custom emoji ID'lerini
 * girerek varsayilanlarin uzerine yazabilir (ornek: "<:coin:123456789012345678>").
 */

const { ayarlar } = require('./ayarlar');

const VARSAYILAN = {
  troll: '🤡',
  coin: '🪙',
  success: '✅',
  error: '❌',
  loading: '⏳',
  star: '⭐',
  fire: '🔥',
  trophy: '🏆',
  dice: '🎲',
  target: '🎯',
  game: '🎮',
  chart: '📊',
  badge: '🏅',
  quest: '🎯',
  heart: '❤️',
  crystalBall: '🔮',
  clap: '👏',
  wave: '👋',
  gear: '⚙️',
  lock: '🔒',
  link: '🔗',
};

function emoji(key) {
  const a = ayarlar();
  return (a.emojis && a.emojis[key]) || VARSAYILAN[key] || '❔';
}

module.exports = { emoji, VARSAYILAN };
