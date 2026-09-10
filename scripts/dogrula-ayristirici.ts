/**
 * Ayrıştırıcının süzme katmanı testleri.
 *
 *   npm run dogrula:ayristirici
 *
 * NEDEN VAR: `taslagaCevir` uygulamanın YZ'ye karşı tek savunma hattı.
 * Model uydurulmuş bir belge kodu, olmayan bir tarih (31 Şubat) ya da
 * kendiyle çelişen bir son tarih tipi döndürebilir. Bunlar süzülmezse:
 *  - uydurma kod süzgeçleri sessizce bozar (lib/sabitler.ts'in varlık sebebi),
 *  - tutarsız son tarih tipi veritabanındaki CHECK'e çarpar ve hata formda
 *    değil veri katmanında görünür.
 *
 * Testler AĞA ÇIKMIYOR: girdi, modelin döndürdüğü ham nesnenin taklidi.
 * Modelin ne kadar iyi okuduğunu değil, kötü okuduğunda ne olduğunu sınıyor.
 */

import { taslagaCevir } from '../lib/ayristir-taslak'

let gecti = 0
const kalanlar: string[] = []

function kontrol(ad: string, kosul: boolean, ayrinti = ''): void {
  if (kosul) { gecti++; console.log(`    ✓ ${ad}`) }
  else { kalanlar.push(ad); console.log(`    ✗ ${ad}${ayrinti ? ` — ${ayrinti}` : ''}`) }
}

function esit(ad: string, gelen: unknown, beklenen: unknown): void {
  const a = JSON.stringify(gelen)
  const b = JSON.stringify(beklenen)
  kontrol(ad, a === b, `gelen ${a}, beklenen ${b}`)
}

/** Testlerin çoğu metnin içeriğiyle ilgilenmiyor; yeter uzunlukta bir dolgu. */
const METIN = 'x'.repeat(200)

const cevir = (ham: Record<string, unknown>, kesildi = false) =>
  taslagaCevir(ham, METIN, kesildi)

/** Bir uyarının belirli bir kelimeyi içerip içermediği. */
const uyariVar = (uyarilar: string[], parca: string) =>
  uyarilar.some((u) => u.toLowerCase().includes(parca.toLowerCase()))

/* ═════════════════════════════════════════════════ katalog dışı kodlar */

console.log('\n  Katalog dışı kodlar')
{
  const r = cevir({ belgeler: ['pasaport', 'uydurma_belge', 'cv'] })
  esit('tanınan belge kodları kalıyor', r.taslak.belgeler?.deger, ['pasaport', 'cv'])
  kontrol('tanınmayan belge kodu uyarıya düşüyor', uyariVar(r.uyarilar, 'uydurma_belge'))

  const hepsiKotu = cevir({ belgeler: ['abc', 'def'] })
  esit('hiçbiri tutmazsa alan boş kalıyor', hepsiKotu.taslak.belgeler, undefined)

  const ulke = cevir({ ulke_kodu: 'XX' })
  esit('geçersiz ülke kodu düşüyor', ulke.taslak.ulke_kodu, undefined)
  kontrol('geçersiz ülke kodu uyarıya düşüyor', uyariVar(ulke.uyarilar, 'XX'))
  esit('geçerli ülke kodu kalıyor', cevir({ ulke_kodu: 'DK' }).taslak.ulke_kodu?.deger, 'DK')

  const para = cevir({ ogrenim_ucreti: 15000, para_birimi: 'XYZ', ogrenim_ucreti_donem: 'yillik' })
  esit('geçersiz para birimi düşüyor', para.taslak.para_birimi, undefined)
  esit('ücretin kendisi kalıyor', para.taslak.ogrenim_ucreti?.deger, 15000)

  const kosul = cevir({ on_kosullar: ['programlama', 'yok_boyle_bir_kosul'] })
  esit('tanınan ön koşul kalıyor', kosul.taslak.on_kosullar?.deger, ['programlama'])
}

/* ══════════════════════════════════════════════════════════ tarihler */

console.log('\n  Tarihler')
{
  esit('geçerli tarih kabul',
    cevir({ son_tarih_tipi: 'kesin', son_tarih: '2027-01-15' }).taslak.son_tarih?.deger,
    '2027-01-15')

  /* 31 Şubat: biçim doğru, gün yok. `new Date` bunu 3 Mart'a kaydırır —
     sessiz kayma yanlış geri sayım demek, o yüzden reddediliyor. */
  const olmayanGun = cevir({ son_tarih_tipi: 'kesin', son_tarih: '2027-02-31' })
  esit('olmayan gün reddediliyor', olmayanGun.taslak.son_tarih, undefined)
  esit('tarih okunamayınca tip belirsize çekiliyor',
    olmayanGun.taslak.son_tarih_tipi?.deger, 'bilinmiyor')
  kontrol('tip değişimi kullanıcıya söyleniyor', uyariVar(olmayanGun.uyarilar, 'kesin'))

  esit('biçimsiz tarih reddediliyor',
    cevir({ acilis_tarihi: '15 Ocak 2027' }).taslak.acilis_tarihi, undefined)
  esit('ISO damgası reddediliyor',
    cevir({ acilis_tarihi: '2027-01-15T00:00:00Z' }).taslak.acilis_tarihi, undefined)

  const araliksiz = cevir({ son_tarih_tipi: 'aralik' })
  esit('sınırsız aralık belirsize çekiliyor',
    araliksiz.taslak.son_tarih_tipi?.deger, 'bilinmiyor')

  const tekSinir = cevir({ son_tarih_tipi: 'aralik', son_tarih_baslangic: '2027-10-01' })
  esit('tek sınırlı aralık geçerli', tekSinir.taslak.son_tarih_tipi?.deger, 'aralik')
  esit('aralık başlangıcı taşınıyor', tekSinir.taslak.son_tarih_baslangic?.deger, '2027-10-01')

  /* Tip 'kesin' değilken gelen gün, tipiyle çelişmesin diye taşınmıyor. */
  esit('sürekli tipte son tarih taşınmıyor',
    cevir({ son_tarih_tipi: 'surekli', son_tarih: '2027-01-15' }).taslak.son_tarih, undefined)
}

/* ═══════════════════════════════════════════════════════ başvuru turları */

console.log('\n  Başvuru turları')
{
  const r = cevir({
    basvuru_turlari: [
      { ad: 'Tur 1 — AB dışı', son_tarih: '2027-01-15', kimin_icin: 'ab_disi' },
      { ad: 'Tur 2 — AB', son_tarih: '2027-03-15', kimin_icin: 'ab' },
    ],
  })
  esit('iki tur da taşınıyor', r.taslak.basvuru_turlari?.deger.length, 2)
  esit('kimin_icin korunuyor', r.taslak.basvuru_turlari?.deger[0].kimin_icin, 'ab_disi')
  esit('sana açık tur varken uyarı yok', r.uyarilar.length, 0)

  const sadeceAb = cevir({
    basvuru_turlari: [{ ad: 'AB turu', son_tarih: '2027-03-15', kimin_icin: 'ab' }],
  })
  kontrol('yalnızca AB turu varken uyarılıyor', uyariVar(sadeceAb.uyarilar, 'senin turun'))

  const bozuk = cevir({
    basvuru_turlari: [
      { son_tarih: '2027-01-15' },
      { ad: 'Geçerli', kimin_icin: 'uzayli', son_tarih: '31-01-2027' },
    ],
  })
  esit('adsız tur atlanıyor', bozuk.taslak.basvuru_turlari?.deger.length, 1)
  esit('tanınmayan kimin_icin null oluyor',
    bozuk.taslak.basvuru_turlari?.deger[0].kimin_icin, null)
  esit('turdaki biçimsiz tarih null oluyor',
    bozuk.taslak.basvuru_turlari?.deger[0].son_tarih, null)

  esit('hiç geçerli tur yoksa alan boş',
    cevir({ basvuru_turlari: [{ son_tarih: '2027-01-15' }] }).taslak.basvuru_turlari, undefined)
}

/* ════════════════════════════════════════════════════════════ değer tipleri */

console.log('\n  Değer tipleri')
{
  /* false ve 0 "boş" DEĞİL — `if (deger)` ile süzülse ders bazlı program
     tezli bilgisini, ücretsiz program da ücretini kaybederdi. */
  esit('tezli=false korunuyor', cevir({ tezli: false }).taslak.tezli?.deger, false)
  esit('ücret 0 korunuyor', cevir({ ogrenim_ucreti: 0 }).taslak.ogrenim_ucreti?.deger, 0)
  esit('muafiyet=false korunuyor',
    cevir({ ucret_muafiyeti: false }).taslak.ucret_muafiyeti?.deger, false)

  esit('boş dizge alan açmıyor', cevir({ ad: '   ' }).taslak.ad, undefined)
  esit('dizge kırpılıyor', cevir({ ad: '  MSc Statistics  ' }).taslak.ad?.deger, 'MSc Statistics')
  esit('sayı yerine dizge gelirse çevriliyor', cevir({ sure_ay: '24' }).taslak.sure_ay?.deger, 24)
  esit('sayı olmayan metin reddediliyor', cevir({ sure_ay: 'iki yıl' }).taslak.sure_ay, undefined)
  esit('negatif süre reddediliyor', cevir({ sure_ay: -12 }).taslak.sure_ay, undefined)
  esit('sıfır süre reddediliyor', cevir({ sure_ay: 0 }).taslak.sure_ay, undefined)
  esit('boolean yerine dizge reddediliyor', cevir({ tezli: 'evet' }).taslak.tezli, undefined)
  esit('dizi yerine dizge reddediliyor', cevir({ belgeler: 'pasaport' }).taslak.belgeler, undefined)
  esit('dizideki boş metinler atılıyor',
    cevir({ alanlar: ['İstatistik', '', '  '] }).taslak.alanlar?.deger, ['İstatistik'])
}

/* ══════════════════════════════════════════════════════════ güven ve kanıt */

console.log('\n  Güven ve kanıt')
{
  const r = cevir({
    ad: 'MSc Social Data Science',
    ogrenim_ucreti: 15000,
    ogrenim_ucreti_donem: 'yillik',
    dusuk_guven: ['ogrenim_ucreti'],
    kanit: [
      { alan: 'ad', parca: 'MSc in Social Data Science' },
      { alan: 'ogrenim_ucreti', parca: 'Tuition: EUR 15,000' },
    ],
  })
  esit('işaretlenmeyen alan yüksek güvenli', r.taslak.ad?.guven, 'yuksek')
  esit('işaretlenen alan düşük güvenli', r.taslak.ogrenim_ucreti?.guven, 'dusuk')
  esit('kanıt alana bağlanıyor', r.taslak.ad?.kanit, 'MSc in Social Data Science')

  const uzun = cevir({
    ad: 'Program', kanit: [{ alan: 'ad', parca: 'y'.repeat(300) }],
  })
  esit('uzun kanıt 120 karaktere kırpılıyor', uzun.taslak.ad?.kanit?.length, 120)

  esit('bozuk kanıt girişi çökertmiyor',
    cevir({ ad: 'Program', kanit: [null, { alan: 'ad' }, 'metin'] }).taslak.ad?.kanit, undefined)
  esit('dizi olmayan dusuk_guven yok sayılıyor',
    cevir({ ad: 'Program', dusuk_guven: 'ad' }).taslak.ad?.guven, 'yuksek')
}

/* ═══════════════════════════════════════════════════════════════ uyarılar */

console.log('\n  Uyarılar ve özet')
{
  const donemsiz = cevir({ ogrenim_ucreti: 20000, para_birimi: 'EUR' })
  kontrol('dönemsiz ücret uyarılıyor', uyariVar(donemsiz.uyarilar, 'yıllık mı toplam mı'))

  const donemli = cevir({
    ogrenim_ucreti: 20000, para_birimi: 'EUR', ogrenim_ucreti_donem: 'toplam',
  })
  esit('dönem varken ücret uyarısı yok', donemli.uyarilar.length, 0)

  const kesik = cevir({ ad: 'Program' }, true)
  kontrol('kesilen metin söyleniyor', uyariVar(kesik.uyarilar, 'uzundu'))

  const bos = cevir({})
  esit('boş çıktı çökertmiyor', Object.keys(bos.taslak).length, 0)
  esit('boş çıktının özeti var', bos.ozet, '0 alan dolduruldu')

  const dolu = cevir({
    ad: 'MSc Statistics',
    belgeler: ['pasaport', 'cv'],
    on_kosullar: ['programlama'],
    basvuru_turlari: [{ ad: 'Tur 1', kimin_icin: 'herkes', son_tarih: '2027-01-15' }],
    dusuk_guven: ['ad'],
  })
  kontrol('özet tur sayısını söylüyor', dolu.ozet.includes('1 başvuru turu'), dolu.ozet)
  kontrol('özet belge sayısını söylüyor', dolu.ozet.includes('2 belge'), dolu.ozet)
  kontrol('özet şüpheli sayısını söylüyor', dolu.ozet.includes('1 tanesi şüpheli'), dolu.ozet)
  esit('ham metin olduğu gibi taşınıyor', dolu.hamMetin, METIN)
  esit('yöntem işaretleniyor', dolu.yontem, 'yapay-zeka')
}

/* ════════════════════════════════════════════════════════════════ özet */
console.log(`\n  ${gecti} geçti, ${kalanlar.length} kaldı.\n`)
if (kalanlar.length > 0) {
  for (const k of kalanlar) console.log(`    ✗ ${k}`)
  console.log('')
  process.exit(1)
}
