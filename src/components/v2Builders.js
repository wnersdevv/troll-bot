'use strict';

/**
 * Discord.js v14.16+ Components V2 helper'lari.
 * MessageFlags.IsComponentsV2 ile birlikte kullanilmalidir.
 *
 * Bu dosya, ham ContainerBuilder/TextDisplayBuilder API'sini
 * proje genelinde tutarli bir sekilde kullanmak icin kucuk sarmalayicilar sunar.
 */

const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  MessageFlags,
} = require('discord.js');

/**
 * Basit bir metin bloklu container olusturur.
 * @param {string[]} metinler
 * @param {number} renk hex renk (varsayilan wnersdev mor tonu)
 */
function metinContainerOlustur(metinler, renk = 0x8b5cf6) {
  const container = new ContainerBuilder().setAccentColor(renk);

  metinler.forEach((metin, index) => {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(metin));
    if (index < metinler.length - 1) {
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
    }
  });

  return container;
}

/**
 * Metin + yanina buton olan bir Section olusturur (ornek: panel menu satiri).
 */
function butonluSectionOlustur(metin, buton) {
  return new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(metin))
    .setButtonAccessory(buton);
}

function ayiraciEkle(container, boyut = SeparatorSpacingSize.Small) {
  return container.addSeparatorComponents(new SeparatorBuilder().setSpacing(boyut).setDivider(true));
}

const COMPONENTS_V2_FLAG = MessageFlags.IsComponentsV2;

module.exports = {
  metinContainerOlustur,
  butonluSectionOlustur,
  ayiraciEkle,
  COMPONENTS_V2_FLAG,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ButtonBuilder,
  ActionRowBuilder,
};
