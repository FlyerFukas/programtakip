import type { ProgramGenis, KurAyari } from './tipler'
import { paraBul } from './sabitler'

/**
 * Para birimi çevrimi ve toplam maliyet.
 *
 * KARŞILAŞTIRMA BU PROJENİN VARLIK SEBEBİ (PROJE.md §3.2): asıl soru "DKK
 * cinsinden Aalborg mu, EUR cinsinden Leiden mi daha ucuz". Ücretin serbest
 * metin değil sayı + para birimi olarak saklanmasının tek sebebi bu dosya.
 */

/**
 * Karşılaştırma için SABİT kurlar — 1 birim X kaç EUR eder.
 *
 * CANLI KUR ÇEKMİYORUZ (PROJE.md §4.6): altı ay sonraki bir karar için günlük
 * dalgalanma gürültü, ama çevrimdışı belirlilik değerli. Ayrıca liste her
 * yenilendiğinde sıralamanın değişmesi, kararı değil kuru takip etmeye yol
 * açar.
 *
 * Kullanıcı Ayarlar ekranından güncelleyebiliyor; değer `ayarlar` tablosunda
 * saklanıyor, kod dağıtımı gerekmiyor. Buradaki değerler yalnızca hiç ayar
 * kaydedilmemişken kullanılan başlangıç değerleri.
 *
 * KAYNAK: Avrupa Merkez Bankası günlük referans kurları (frankfurter.dev),
 * 31 Ağustos 2026. Ters çevrilmiş hâlleri yorumda — kontrol etmek isteyen
 * bakabilsin diye.
 */
export const VARSAYILAN_KURLAR: Record<string, number> = {
  EUR: 1,                  // 1 EUR = 1 EUR
  DKK: 0.13377747,         // 1 EUR = 7,4751 DKK
  SEK: 0.090009001,        // 1 EUR = 11,11 SEK
  NOK: 0.092319055,        // 1 EUR = 10,832 NOK
  GBP: 1.1675696,          // 1 EUR = 0,85648 GBP
  CHF: 1.0665529,          // 1 EUR = 0,9376 CHF
  CAD: 0.62104086,         // 1 EUR = 1,6102 CAD
  USD: 0.86236633,         // 1 EUR = 1,1596 USD
  PLN: 0.2310536,          // 1 EUR = 4,328 PLN
  CZK: 0.041455932,        // 1 EUR = 24,122 CZK
  HUF: 0.0027446137,       // 1 EUR = 364,35 HUF
  TRY: 0.017868374,        // 1 EUR = 55,9648 TRY
}

/** Yukarıdaki kurların hangi güne ait olduğu. */
export const KUR_TARIHI = '2026-08-31'

/** `ayarlar` tablosundaki kur kaydının anahtarı. */
export const KUR_ANAHTARI = 'kurlar'

export const VARSAYILAN_KUR_AYARI: KurAyari = {
  kurlar: VARSAYILAN_KURLAR,
  tarih: KUR_TARIHI,
}

/* ═══════════════════════════════════════════════════════════════ çevrim */

/**
 * Tutarı EUR'ya çevir. Kur bilinmiyorsa null — 1'e varsaymak yerine
 * "çeviremedim" demek doğru cevap.
 */
export function euroyaCevir(
  tutar: number | null,
  birim: string | null,
  kurlar: Record<string, number> = VARSAYILAN_KURLAR,
): number | null {
  if (tutar === null || tutar === undefined || !birim) return null
  const k = kurlar[birim]
  if (!k || !Number.isFinite(k)) return null
  return tutar * k
}

/** EUR tutarını hedef para birimine çevir. */
export function eurodanCevir(
  euro: number | null,
  birim: string | null,
  kurlar: Record<string, number> = VARSAYILAN_KURLAR,
): number | null {
  if (euro === null || euro === undefined || !birim) return null
  const k = kurlar[birim]
  if (!k || !Number.isFinite(k)) return null
  return euro / k
}

/** İki para birimi arasında çevir. */
export function cevir(
  tutar: number | null,
  kaynak: string | null,
  hedef: string | null,
  kurlar: Record<string, number> = VARSAYILAN_KURLAR,
): number | null {
  return eurodanCevir(euroyaCevir(tutar, kaynak, kurlar), hedef, kurlar)
}

/** "18.500 €" — binlik ayracı Türkçe, kuruş yok (bu ölçekte gürültü). */
export function paraYaz(tutar: number | null, birim: string | null): string {
  if (tutar === null || tutar === undefined) return '—'
  const p = birim ? paraBul(birim) : undefined
  const sayi = Math.round(tutar).toLocaleString('tr-TR')
  return `${sayi} ${p?.simge ?? birim ?? ''}`.trim()
}

/* ═══════════════════════════════════════════════════════ toplam maliyet */

export type MaliyetKalemi = {
  ad: string
  /** Orijinal tutar ve para birimi — çevrilmemiş hâli de gösteriliyor. */
  tutar: number
  birim: string
  euro: number
  /** Bursa olduğu gibi eksi işaretli. */
  eksi?: boolean
  aciklama?: string
}

export type MaliyetSonucu = {
  /** Hesaplanabilen kalemlerin EUR toplamı. */
  euro: number
  kalemler: MaliyetKalemi[]
  /**
   * Hesaba GİREMEYEN kalemler ve sebepleri.
   *
   * PROJE.md §4.6: "Eksik veri varsa sıfır sayma, 'eksik' göster. 40.000
   * EUR'luk bir programı yaşam gideri girilmediği için 20.000 EUR diye
   * göstermek, kararı bozan bir yalandır."
   */
  eksikler: string[]
  /** Eksik kalem varsa toplam "en az bu kadar" demektir, kesin değil. */
  tamMi: boolean
}

/**
 * Programın toplam net maliyeti (PROJE.md §4.6).
 *
 *   öğrenim ücreti × yıl
 * + aylık yaşam gideri (ülkeden) × ay
 * + başvuru ücreti (üniversiteden)
 * + depozito (üniversiteden)
 * − ilgili burs (elle girilen tahmini tutar)
 * ─────────────────────────────────────────
 * = net maliyet
 *
 * Hesaplanamayan kalem TOPLAMA KATILMAZ ve `eksikler`e yazılır. Sonuç
 * "en az" değeridir; arayüz bunu açıkça söylemek zorunda.
 */
export function toplamMaliyet(
  p: ProgramGenis,
  kurlar: Record<string, number> = VARSAYILAN_KURLAR,
): MaliyetSonucu {
  const kalemler: MaliyetKalemi[] = []
  const eksikler: string[] = []

  const ekle = (
    ad: string,
    tutar: number | null,
    birim: string | null,
    eksikMesaj: string,
    aciklama?: string,
    eksi = false,
  ) => {
    if (tutar === null || tutar === undefined) { eksikler.push(eksikMesaj); return }
    if (!birim) { eksikler.push(`${ad}: para birimi girilmemiş`); return }
    const euro = euroyaCevir(tutar, birim, kurlar)
    if (euro === null) { eksikler.push(`${ad}: ${birim} için kur tanımlı değil`); return }
    kalemler.push({ ad, tutar, birim, euro, eksi, aciklama })
  }

  /* ── öğrenim ücreti ── */
  if (p.ogrenim_ucreti === null) {
    eksikler.push('Öğrenim ücreti girilmemiş')
  } else if (!p.ogrenim_ucreti_donem) {
    eksikler.push('Öğrenim ücretinin neye ait olduğu (yıllık/toplam/ECTS) seçilmemiş')
  } else {
    const { carpan, aciklama, eksik } = ucretCarpani(p)
    if (eksik) eksikler.push(eksik)
    else ekle('Öğrenim ücreti', p.ogrenim_ucreti * carpan, p.para_birimi,
      'Öğrenim ücreti girilmemiş', aciklama)
  }

  /* ── yaşam gideri: ülkeden × programın süresi ── */
  const aylik = p.ulke?.aylik_yasam_gideri ?? null
  if (aylik === null) {
    eksikler.push('Yaşam gideri girilmemiş (ülke kaydında)')
  } else if (p.sure_ay === null) {
    eksikler.push('Program süresi girilmemiş — yaşam gideri hesaplanamıyor')
  } else {
    ekle('Yaşam gideri', aylik * p.sure_ay, p.ulke?.para_birimi ?? null,
      'Yaşam gideri girilmemiş', `${p.sure_ay} ay × ${paraYaz(aylik, p.ulke?.para_birimi ?? null)}`)
  }

  /* ── üniversiteden gelen tek seferlik kalemler ── */
  if (p.universite.basvuru_ucreti !== null) {
    ekle('Başvuru ücreti', p.universite.basvuru_ucreti, p.universite.basvuru_ucreti_para,
      'Başvuru ücreti girilmemiş')
  }
  if (p.universite.depozito !== null) {
    ekle('Depozito', p.universite.depozito, p.universite.depozito_para,
      'Depozito girilmemiş', 'Kabul sonrası peşin ödeme')
  }

  /* ── burs: eksi kalem ── */
  if (p.burs_tahmini !== null && p.burs_tahmini !== undefined) {
    ekle('Burs (tahmini)', p.burs_tahmini, p.burs_tahmini_para,
      'Burs tutarı girilmemiş', p.ilgili_burslar.join(', ') || undefined, true)
  }

  const euro = kalemler.reduce((t, k) => t + (k.eksi ? -k.euro : k.euro), 0)

  return { euro, kalemler, eksikler, tamMi: eksikler.length === 0 }
}

/**
 * Öğrenim ücretinin toplam için kaçla çarpılacağı.
 *
 * 'yillik' → programın yıl sayısı. Süre bilinmiyorsa hesaplanamaz: 24 aylık
 * bir programın yıllık ücretini bir yıl sayarak göstermek maliyeti YARIYA
 * indirir ve kararı bozar.
 */
function ucretCarpani(p: ProgramGenis): {
  carpan: number
  aciklama?: string
  eksik?: string
} {
  switch (p.ogrenim_ucreti_donem) {
    case 'toplam':
      return { carpan: 1, aciklama: 'programın tamamı' }

    case 'ects':
      if (p.ects === null) {
        return { carpan: 0, eksik: 'ECTS başına ücret girilmiş ama programın ECTS sayısı yok' }
      }
      return { carpan: p.ects, aciklama: `${p.ects} ECTS × birim ücret` }

    case 'yillik':
    default: {
      if (p.sure_ay === null) {
        return { carpan: 0, eksik: 'Yıllık ücret girilmiş ama program süresi yok — kaç yıl ödeneceği belli değil' }
      }
      // Yarım yıllar yukarı yuvarlanıyor: 18 aylık program iki akademik yıl
      // ücreti ödetir, 1,5 yıl değil.
      const yil = Math.ceil(p.sure_ay / 12)
      return { carpan: yil, aciklama: `${yil} yıl × yıllık ücret` }
    }
  }
}

/* ═════════════════════════════════════════════════════════ kur yardımcıları */

/**
 * Kaydedilmiş kur ayarını doğrula.
 *
 * Bozuk/eksik kayıt sessizce kabul edilirse çevrim yanlış çalışır ve kimse
 * fark etmez. EUR her zaman 1 olmalı — taban o.
 */
export function kurAyariniDogrula(ham: unknown): KurAyari {
  if (typeof ham !== 'object' || ham === null) return VARSAYILAN_KUR_AYARI

  const o = ham as Partial<KurAyari>
  const gelen = typeof o.kurlar === 'object' && o.kurlar !== null ? o.kurlar : {}

  const kurlar: Record<string, number> = { ...VARSAYILAN_KURLAR }
  for (const [birim, deger] of Object.entries(gelen)) {
    const n = Number(deger)
    if (Number.isFinite(n) && n > 0) kurlar[birim] = n
  }
  kurlar.EUR = 1

  const tarih = typeof o.tarih === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.tarih)
    ? o.tarih
    : KUR_TARIHI

  return { kurlar, tarih }
}

/** Ayarlar ekranı için: "1 EUR = N birim" gösterimi. */
export function euroBasina(kur: number): number {
  return 1 / kur
}
