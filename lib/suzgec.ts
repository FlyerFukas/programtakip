import type { ProgramGenis } from './tipler'
import { sadelestir } from './metin'
import { durumBul } from './sabitler'
import { etkinTarih, siraSkoru, tarihOku, gunEkle, bugun } from './tarih'
import { euroyaCevir, VARSAYILAN_KURLAR } from './para'

/**
 * İstemci tarafı süzme ve sıralama — saf fonksiyonlar.
 *
 * NEDEN SUNUCUDA DEĞİL (PROJE.md §6.5): veri kişisel ölçekte (yüzlerce satır)
 * ve zaten tamamı çekiliyor. Her tık için sunucuya gitmek gecikme ekler,
 * çapraz koşulları SQL'de yazmak da okunmaz hâle getirir. Burada düz
 * TypeScript var ve test edilebiliyor.
 *
 * NEDEN URL'YE YAZILIYOR: filtreli görünüm paylaşılabilsin ve geri tuşu
 * çalışsın. "Danimarka'da IELTS isteyen, uygunluğu şüpheli olmayan
 * programlar" bir bağlantıya sığıyor.
 *
 * GÖRELİ TARİH: `?son=+30` bugünden 30 gün sonrası demek ve HER GÜN doğru.
 * Mutlak tarih yazsaydık ("2026-09-28") kaydedilen bağlantı yarın yanlış
 * olurdu.
 */

export const SIRALAMALAR = [
  { kod: 'tarih', ad: 'Son tarihe göre', aciklama: 'En yakın kapanan önce' },
  { kod: 'oncelik', ad: 'Önceliğe göre', aciklama: 'Yüksek öncelik önce, sonra tarih' },
  { kod: 'ucret', ad: 'Ücrete göre', aciklama: 'Ucuzdan pahalıya' },
  { kod: 'siralama', ad: 'Üniversite sırasına göre', aciklama: 'Alan sırası, yoksa QS' },
  { kod: 'ad', ad: 'Ada göre', aciklama: 'Alfabetik' },
  { kod: 'eklenme', ad: 'Eklenme sırasına göre', aciklama: 'En son eklenen önce' },
] as const

export type SiralamaKodu = (typeof SIRALAMALAR)[number]['kod']

export type Suzgec = {
  /** Serbest arama: ad, üniversite, şehir, bölüm, alanlar, notlar. */
  ara: string
  ulke: string[]
  uygunluk: string[]
  durum: string[]
  belge: string[]
  kosul: string[]
  /** Programın öğretim dili — serbest metin olduğu için sadeleştirilip eşleşiyor. */
  dil: string[]
  ucretMin: number | null
  ucretMax: number | null
  /** '+30' (bugünden 30 gün) ya da 'YYYY-MM-DD'. Bu tarihe kadar kapananlar. */
  son: string | null
  sirala: SiralamaKodu
  /** Kapanmış durumdakiler (kabul/red/vazgeçtim…) listede görünsün mü. */
  kapaliGoster: boolean
  /** `uygun_degil` işaretliler listede görünsün mü (PROJE.md §4.5). */
  uygunsuzGoster: boolean
}

export const BOS_SUZGEC: Suzgec = {
  ara: '',
  ulke: [], uygunluk: [], durum: [], belge: [], kosul: [], dil: [],
  ucretMin: null, ucretMax: null,
  son: null,
  sirala: 'tarih',
  kapaliGoster: false,
  uygunsuzGoster: false,
}

/* ═══════════════════════════════════════════════════════════ URL çevirisi */

function dizi(d: string | null): string[] {
  if (!d) return []
  return [...new Set(d.split(',').map((x) => x.trim()).filter(Boolean))]
}

function sayi(d: string | null): number | null {
  if (!d) return null
  const n = Number(d)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function urldenSuzgec(sp: URLSearchParams): Suzgec {
  const sirala = sp.get('sirala') as SiralamaKodu | null
  return {
    ara: sp.get('ara')?.trim() ?? '',
    ulke: dizi(sp.get('ulke')),
    uygunluk: dizi(sp.get('uygunluk')),
    durum: dizi(sp.get('durum')),
    belge: dizi(sp.get('belge')),
    kosul: dizi(sp.get('kosul')),
    dil: dizi(sp.get('dil')),
    ucretMin: sayi(sp.get('ucretMin')),
    ucretMax: sayi(sp.get('ucretMax')),
    son: sp.get('son'),
    sirala: SIRALAMALAR.some((s) => s.kod === sirala) ? sirala! : 'tarih',
    kapaliGoster: sp.get('kapali') === '1',
    uygunsuzGoster: sp.get('uygunsuz') === '1',
  }
}

/**
 * Süzgeci sorgu dizgesine çevir.
 *
 * Varsayılan değerler URL'ye YAZILMIYOR: adres çubuğu yalnızca gerçekten
 * değiştirdiğin şeyleri gösteriyor, paylaşılan bağlantı kısa kalıyor.
 */
export function suzgecSorgusu(s: Suzgec): string {
  const p = new URLSearchParams()
  if (s.ara) p.set('ara', s.ara)
  if (s.ulke.length) p.set('ulke', s.ulke.join(','))
  if (s.uygunluk.length) p.set('uygunluk', s.uygunluk.join(','))
  if (s.durum.length) p.set('durum', s.durum.join(','))
  if (s.belge.length) p.set('belge', s.belge.join(','))
  if (s.kosul.length) p.set('kosul', s.kosul.join(','))
  if (s.dil.length) p.set('dil', s.dil.join(','))
  if (s.ucretMin !== null) p.set('ucretMin', String(s.ucretMin))
  if (s.ucretMax !== null) p.set('ucretMax', String(s.ucretMax))
  if (s.son) p.set('son', s.son)
  if (s.sirala !== 'tarih') p.set('sirala', s.sirala)
  if (s.kapaliGoster) p.set('kapali', '1')
  if (s.uygunsuzGoster) p.set('uygunsuz', '1')
  return p.toString()
}

/**
 * `son` alanını mutlak tarihe çevir.
 *
 * '+30' → bugün + 30 gün. Göreli tutulması bilinçli: kaydedilen bağlantı
 * yarın da doğru olsun.
 */
export function sonTarihSiniri(son: string | null): string | null {
  if (!son) return null
  const t = son.trim()
  if (/^\+\d+$/.test(t)) return gunEkle(Number(t.slice(1)))
  if (/^-\d+$/.test(t)) return gunEkle(-Number(t.slice(1)))
  return tarihOku(t) ? t : null
}

/** Hazır tarih kısayolları — süzgeç panelindeki düğmeler. */
export const TARIH_KISAYOLLARI = [
  { kod: '+7', ad: '1 hafta' },
  { kod: '+30', ad: '1 ay' },
  { kod: '+90', ad: '3 ay' },
  { kod: '+180', ad: '6 ay' },
] as const

/* ═══════════════════════════════════════════════════════════════ süzme */

/** Programın arama için taranan bütün metni — bir kez üretilip eşleştiriliyor. */
function aranabilirMetin(p: ProgramGenis): string {
  return sadelestir([
    p.ad, p.bolum, p.derece, p.ogretim_dili,
    p.universite.ad, p.universite.sehir,
    ...p.alanlar, ...p.etiketler, ...p.ilgili_burslar,
    p.notlar, p.uygunluk_not, p.on_kosul_detay, p.belge_detay, p.ucret_not,
  ].filter(Boolean).join(' '))
}

/**
 * Çok kelimeli arama: her kelime ayrı ayrı geçmeli (VE mantığı).
 *
 * "aalborg veri" yazan biri hem Aalborg'da hem veri bilimiyle ilgili
 * programı arıyordur; kelimeleri tek bir dizge gibi aramak bunu bulamaz.
 */
function aramaEsliyor(metin: string, ara: string): boolean {
  const kelimeler = sadelestir(ara).split(' ').filter(Boolean)
  return kelimeler.every((k) => metin.includes(k))
}

export function suzgecUygula(
  liste: ProgramGenis[],
  s: Suzgec,
  kurlar: Record<string, number> = VARSAYILAN_KURLAR,
): ProgramGenis[] {
  const sinir = sonTarihSiniri(s.son)
  const bugunIso = bugun()

  return liste.filter((p) => {
    // ── kapalı / uygun değil ──
    if (!s.uygunsuzGoster && p.uygunluk === 'uygun_degil') return false
    if (!s.kapaliGoster && durumBul(p.durum)?.kapali) return false

    // ── kod listeleri: seçilenlerden EN AZ BİRİ tutmalı ──
    if (s.ulke.length && !s.ulke.includes(p.universite.ulke_kodu)) return false
    if (s.uygunluk.length && !s.uygunluk.includes(p.uygunluk)) return false
    if (s.durum.length && !s.durum.includes(p.durum)) return false

    /*
     * Belge ve ön koşulda ise HEPSİ tutmalı: "IELTS ve GRE isteyenler"
     * diye süzen biri ikisini birden isteyen programı arıyordur, birini
     * isteyeni değil.
     */
    if (s.belge.length && !s.belge.every((k) => p.belgeler.includes(k))) return false
    if (s.kosul.length && !s.kosul.every((k) => p.on_kosullar.includes(k))) return false

    if (s.dil.length) {
      const d = sadelestir(p.ogretim_dili ?? '')
      if (!s.dil.some((x) => d.includes(sadelestir(x)))) return false
    }

    /*
     * ── ücret: EUR ÜZERİNDEN ──
     *
     * Aşama 5'te ham sayı karşılaştırılıyordu ve 120.000 DKK, 15.000
     * EUR'dan büyük görünüyordu. Aşama 7'den beri ikisi de EUR'ya çevriliyor
     * (lib/para.ts). Para birimi ya da kuru bilinmeyen program aralığa
     * GİRMEZ — bilinmeyeni sıfır sayıp "ucuz" göstermek yalan olurdu.
     */
    if (s.ucretMin !== null || s.ucretMax !== null) {
      const euro = euroyaCevir(p.ogrenim_ucreti, p.para_birimi, kurlar)
      if (euro === null) return false
      if (s.ucretMin !== null && euro < s.ucretMin) return false
      if (s.ucretMax !== null && euro > s.ucretMax) return false
    }

    // ── son tarih penceresi ──
    if (sinir) {
      const t = etkinTarih(p)
      if (!t) return false            // tarihsiz program pencereye giremez
      if (t > sinir) return false
      if (t < bugunIso) return false  // geçmiş tarih "önümüzdeki 30 gün" değildir
    }

    // ── serbest arama ──
    if (s.ara && !aramaEsliyor(aranabilirMetin(p), s.ara)) return false

    return true
  })
}

/* ═════════════════════════════════════════════════════════════ sıralama */

/** Üniversitenin karşılaştırılabilir sıra numarası: alan sırası, yoksa QS/THE. */
function universiteSirasi(p: ProgramGenis): number {
  return p.universite.alan_sirasi
    ?? p.universite.qs_sirasi
    ?? p.universite.the_sirasi
    ?? Number.MAX_SAFE_INTEGER
}

export function siralamaUygula(
  liste: ProgramGenis[],
  kod: SiralamaKodu,
  kurlar: Record<string, number> = VARSAYILAN_KURLAR,
): ProgramGenis[] {
  const k = [...liste]
  switch (kod) {
    case 'ucret': {
      // EUR üzerinden: 120.000 DKK ile 15.000 EUR'yu ham sayı olarak
      // karşılaştırmak sıralamayı tersine çevirirdi.
      // Ücreti ya da kuru bilinmeyen SONA gider, sıfır sayılmaz (§4.6).
      const euro = (p: ProgramGenis) =>
        euroyaCevir(p.ogrenim_ucreti, p.para_birimi, kurlar) ?? Number.MAX_SAFE_INTEGER
      return k.sort((a, b) => euro(a) - euro(b))
    }

    case 'siralama':
      return k.sort((a, b) => universiteSirasi(a) - universiteSirasi(b))

    case 'ad':
      return k.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))

    case 'eklenme':
      return k.sort((a, b) => b.olusturma.localeCompare(a.olusturma))

    case 'oncelik':
      // Aynı öncelikteyse yakın tarihli önce — öncelik tek başına yeterli
      // bir sıra üretmiyor.
      return k.sort((a, b) => a.oncelik - b.oncelik || siraSkoru(a) - siraSkoru(b))

    case 'tarih':
    default:
      return k.sort((a, b) => siraSkoru(a) - siraSkoru(b))
  }
}

/* ═══════════════════════════════════════════════════════════════ özet */

/** Süzgeçte varsayılandan sapan bir şey var mı — "temizle" düğmesi buna bakıyor. */
export function suzgecAktif(s: Suzgec): boolean {
  return Boolean(
    s.ara || s.ulke.length || s.uygunluk.length || s.durum.length
    || s.belge.length || s.kosul.length || s.dil.length
    || s.ucretMin !== null || s.ucretMax !== null || s.son
    || s.sirala !== 'tarih' || s.kapaliGoster || s.uygunsuzGoster,
  )
}

/** Kaç ayrı süzgeç ölçütü etkin — düğmedeki sayaç. */
export function suzgecSayisi(s: Suzgec): number {
  let n = 0
  if (s.ara) n++
  n += s.ulke.length ? 1 : 0
  n += s.uygunluk.length ? 1 : 0
  n += s.durum.length ? 1 : 0
  n += s.belge.length ? 1 : 0
  n += s.kosul.length ? 1 : 0
  n += s.dil.length ? 1 : 0
  if (s.ucretMin !== null || s.ucretMax !== null) n++
  if (s.son) n++
  if (s.kapaliGoster) n++
  if (s.uygunsuzGoster) n++
  return n
}

/** Listedeki farklı para birimleri — ücret süzgecinin uyarısı için. */
export function paraBirimleri(liste: ProgramGenis[]): string[] {
  return [...new Set(
    liste.map((p) => p.para_birimi).filter((x): x is string => Boolean(x)),
  )].sort()
}

/** Listede geçen öğretim dilleri — süzgeç seçeneklerini veriden üretiyoruz. */
export function ogretimDilleri(liste: ProgramGenis[]): string[] {
  return [...new Set(
    liste.map((p) => p.ogretim_dili?.trim()).filter((x): x is string => Boolean(x)),
  )].sort((a, b) => a.localeCompare(b, 'tr'))
}
