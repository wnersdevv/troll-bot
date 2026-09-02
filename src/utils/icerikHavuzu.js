'use strict';

/**
 * Tum eglence icerikleri (saka, roast, ovgu, kader) burada tutulur.
 * Nefret soylemi, tehdit, hassas kisisel ozelliklere saldiri veya
 * gercek taciz iceren hicbir metin BULUNMAZ. Bkz: proje kurallari #11.
 */

const SAKALAR = {
  discord: [
    "Discord'ta en cok kullanilan komut hangisi? /ban ama kendine.",
    'Bir moderator neden hep uykusuz? Cunku "sadece 5 dakika" diyen biri hep var.',
    'Discord sunucusu kurmak kolay, aktif tutmak "online" gorunup hicbir sey yazmayan 40 kisiyle savas.',
  ],
  oyun: [
    'Rakip "ez" yazdi ama skor tablosunda hala kaybediyor.',
    'En zor seviye hangisi? Arkadasinin sana "kolay" dedigi seviye.',
    'Oyun icinde en guclu esya: arkadasinin sabri.',
  ],
  teknoloji: [
    "Bilgisayar neden uzgun? Cunku RAM'i dolu ama kimse onu dinlemiyor.",
    'Yazilimci "5 dakikaya biter" der, saat 5 dakika sonra hala calisiyor.',
    'Wi-Fi sifresi unutulunca aile toplantisi baslar.',
  ],
  arkadas: [
    "Iyi arkadas, gece 3'te \"uyuyor musun\" diye mesaj atip cevap bekleyen kisidir.",
    'En guvenilir arkadas, borcunu hatirlayan degil hatirlatmayandir... simdi hatirladin degil mi?',
  ],
  okul: [
    'Ogretmen "telefonlari kapatin" dedi, herkes sessiz moda aldi.',
    'Sinavdan once herkes cok calismis gibi konusur, sinav sonrasi kimse konusmaz.',
  ],
  is: [
    "Toplanti \"5 dakika surer\" dendi, 1 saat sonra hala gundem maddesi 1'deyiz.",
    'Is e-postasinda "saygilarimla" yazip aslinda hic saygi kalmamis olabilir.',
  ],
  gunluk_hayat: [
    'Sabah alarmi "5 dakika daha" dedirtmek icin ozel olarak tasarlanmis olmali.',
    'Market listesi yapip listeyi evde birakmak bir spor dali olmali.',
  ],
};

const KATEGORILER = Object.keys(SAKALAR);

const ROASTLAR = {
  hafif: [
    '{hedef} o kadar yavas ki yukleme cubugu ona moral veriyor.',
    '{hedef} bugun de "az kaldi" diyerek gunu gecirdi.',
  ],
  normal: [
    '{hedef} kararsizlikta o kadar iyi ki menude ne oldugunu hala secemiyor.',
    '{hedef} plan yapmakta cok iyi, uygulamakta ise plan yapmayi tercih ediyor.',
  ],
  sert: [
    '{hedef} o kadar erteliyor ki yarinlar bile ondan kaciyor.',
    '{hedef} "hemen geliyorum" dedigi andan itibaren zaman farkli akiyor sanki.',
  ],
};

const OVGULER = {
  genel: [
    '{hedef} bugun de ortami guzellestirdi, bunu bilsin.',
    '{hedef} ile calismak/konusmak gercekten keyifli.',
    '{hedef}, fark edilmeyen ama cok deger katan bir enerjiye sahip.',
  ],
};

const KADERLER = [
  'Bugun kucuk bir sans seni bulacak, gozunu ac.',
  'Sabirli ol, bu hafta beklenen haber gelebilir.',
  'Bugun aldigin bir karar ileride sana tesekkur ettirecek.',
  'Enerjini dogru yere harca, dagitirsan yorulursun.',
  'Bugun "hayir" demek de bir basari sayilir.',
];

function rastgeleSec(dizi) {
  return dizi[Math.floor(Math.random() * dizi.length)];
}

module.exports = { SAKALAR, KATEGORILER, ROASTLAR, OVGULER, KADERLER, rastgeleSec };
