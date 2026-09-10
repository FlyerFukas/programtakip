import type { UlkeGirdi, UniversiteGirdi, ProgramGirdi, BasvuruTuru } from './tipler'
import {
  DURUMLAR, SON_TARIH_TIPLERI, BELGELER, ON_KOSULLAR, UYGUNLUKLAR,
  UCRET_DONEMLERI, TUR_KIMIN_ICIN, PARA_BIRIMLERI,
  KAMPUS_TIPLERI, BASLANGIC_DONEMLERI, UNIVERSITE_TURLERI,
} from './sabitler'
import { ULKELER } from './ulkeler'
import { tarihOku } from './tarih'

/**
 * Kayıt doğrulama — sunucu tarafının son savunma hattı.
 *
 * Form zaten çoğunu engelliyor ama server action doğrudan çağrılabilir, içe
 * aktarılan JSON bozuk olabilir, ayrıştırıcı saçmalayabilir. Buradan
 * geçmeyen hiçbir şey veritabanına gitmez.
 *
 * Dönen `hatalar` alan adına göre anahtarlanır ki form ilgili kutunun
 * altında gösterebilsin.
 *
 * TASARIM: tanınmayan KOD sessizce atılır (kullanıcı yanlış bir şey seçemez,
 * bozuk kod ancak makineden gelir), eksik ZORUNLU alan hata döndürür
 * (kullanıcının düzeltmesi gereken bir şey var).
 */

export type DogrulamaSonucu<T> =
  | { gecerli: true; veri: T }
  | { gecerli: false; hatalar: Record<string, string> }

const kodlar = {
  durum: new Set(DURUMLAR.map((d) => d.kod)),
  sonTarihTipi: new Set<string>(SON_TARIH_TIPLERI.map((t) => t.kod)),
  belge: new Set(BELGELER.map((b) => b.kod)),
  kosul: new Set(ON_KOSULLAR.map((k) => k.kod)),
  uygunluk: new Set<string>(UYGUNLUKLAR.map((u) => u.kod)),
  ucretDonem: new Set<string>(UCRET_DONEMLERI.map((u) => u.kod)),
  kiminIcin: new Set<string>(TUR_KIMIN_ICIN.map((t) => t.kod)),
  para: new Set(PARA_BIRIMLERI.map((p) => p.kod)),
  kampus: new Set<string>(KAMPUS_TIPLERI.map((k) => k.kod)),
  donem: new Set<string>(BASLANGIC_DONEMLERI.map((d) => d.kod)),
  universiteTur: new Set<string>(UNIVERSITE_TURLERI.map((t) => t.kod)),
  ulke: new Set(ULKELER.map((u) => u.kod)),
}

/* ═══════════════════════════════════════════════════════════ küçük yardımcılar */

/** Boş metni null'a çevir — veritabanında '' ile null karışmasın. */
function metin(d: unknown, enFazla = 2000): string | null {
  if (typeof d !== 'string') return null
  const t = d.trim()
  if (!t) return null
  return t.slice(0, enFazla)
}

/** Bilinmeyen kodları sessizce at; kalanları tekilleştir. */
function kodDizisi(d: unknown, gecerli: Set<string>): string[] {
  if (!Array.isArray(d)) return []
  return [...new Set(d.filter((k): k is string => typeof k === 'string' && gecerli.has(k)))]
}

/** Serbest metin dizisi (alanlar, etiketler) — kırp, boşları at, tekilleştir. */
function metinDizisi(d: unknown, enFazlaAdet = 25, enFazlaUzunluk = 60): string[] {
  if (!Array.isArray(d)) return []
  const temiz = d
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim().slice(0, enFazlaUzunluk))
    .filter(Boolean)
  return [...new Set(temiz)].slice(0, enFazlaAdet)
}

/** Sayı ya da null. Aralık dışı ve anlamsız değerler null olur — 0 "bilinmiyor" değildir. */
function sayi(d: unknown, { enAz = 0, enFazla = 1e9, tam = false } = {}): number | null {
  if (d === null || d === undefined || d === '') return null
  const n = Number(d)
  if (!Number.isFinite(n)) return null
  if (tam && !Number.isInteger(n)) return null
  if (n < enAz || n > enFazla) return null
  return n
}

/**
 * Üç durumlu onay kutusu: evet / hayır / bilinmiyor.
 *
 * `tezli`, `ucret_muafiyeti`, `cifte_vatandaslik` gibi alanlarda false ile
 * "bakmadım" farklı şeyler — ikisini birden false'a ezmek veriyi bozar.
 */
function ucluBool(d: unknown): boolean | null {
  if (d === true || d === 'true' || d === 'evet' || d === 'on') return true
  if (d === false || d === 'false' || d === 'hayir') return false
  return null
}

/** 'YYYY-MM-DD' ya da null. Geçersiz biçim null döner (hata değil — alan boş sayılır). */
function tarih(d: unknown): string | null {
  if (typeof d !== 'string' || !d.trim()) return null
  return tarihOku(d.trim()) ? d.trim() : null
}

function urlTemiz(d: unknown): string | null {
  const t = metin(d, 500)
  if (!t) return null
  // Protokolsüz yapıştırmalar çok yaygın: "uva.nl/..." → "https://uva.nl/..."
  const tam = /^https?:\/\//i.test(t) ? t : `https://${t}`
  try {
    const u = new URL(tam)
    // javascript: gibi şemalar URL() tarafından kabul edilebilir; izin verme.
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

function durumSec(d: unknown): string {
  return typeof d === 'string' && kodlar.durum.has(d) ? d : 'arastiriliyor'
}

function oncelikSec(d: unknown): number {
  const n = Number(d)
  return [1, 2, 3].includes(n) ? n : 2
}

/* ═════════════════════════════════════════════════════════════════════ ülke */

export function dogrulaUlke(girdi: Record<string, unknown>): DogrulamaSonucu<UlkeGirdi> {
  const hatalar: Record<string, string> = {}

  const kod = typeof girdi.kod === 'string' ? girdi.kod.trim().toUpperCase() : ''
  if (!kod) hatalar.kod = 'Ülke seç.'
  else if (!kodlar.ulke.has(kod)) hatalar.kod = 'Tanınmayan ülke kodu.'

  // Ad kataloğdan geliyor ama kullanıcı değiştirmiş olabilir (ör. "Hollanda
  // (Randstad)"), o yüzden serbest bırakılıp yalnızca boşluğu engelleniyor.
  const ad = metin(girdi.ad, 120) ?? ULKELER.find((u) => u.kod === kod)?.ad ?? null
  if (!ad) hatalar.ad = 'Ülke adı gerekli.'

  if (Object.keys(hatalar).length > 0) return { gecerli: false, hatalar }

  const veri: UlkeGirdi = {
    kod,
    ad: ad!,

    mezuniyet_sonrasi_izin: metin(girdi.mezuniyet_sonrasi_izin, 300),
    mezuniyet_sonrasi_ay: sayi(girdi.mezuniyet_sonrasi_ay, { enAz: 0, enFazla: 240, tam: true }),
    oturum_yolu: metin(girdi.oturum_yolu, 2000),
    oturum_yil: sayi(girdi.oturum_yil, { enAz: 0, enFazla: 60 }),
    oturum_dil_sarti: metin(girdi.oturum_dil_sarti, 300),
    vatandaslik_yil: sayi(girdi.vatandaslik_yil, { enAz: 0, enFazla: 60 }),
    cifte_vatandaslik: ucluBool(girdi.cifte_vatandaslik),
    mulk_kisiti: metin(girdi.mulk_kisiti, 1000),
    ogrenci_calisma: metin(girdi.ogrenci_calisma, 300),
    donus_yukumlulugu: metin(girdi.donus_yukumlulugu, 1000),

    para_birimi: typeof girdi.para_birimi === 'string' && kodlar.para.has(girdi.para_birimi)
      ? girdi.para_birimi : null,
    aylik_yasam_gideri: sayi(girdi.aylik_yasam_gideri, { enAz: 0, enFazla: 1e7 }),
    yasam_gideri_not: metin(girdi.yasam_gideri_not, 1000),
    blokeli_hesap: sayi(girdi.blokeli_hesap, { enAz: 0, enFazla: 1e8 }),

    vize_sureci: metin(girdi.vize_sureci, 2000),
    vize_maliyet: metin(girdi.vize_maliyet, 300),
    ogretim_dili_not: metin(girdi.ogretim_dili_not, 1000),

    durum: durumSec(girdi.durum),
    oncelik: oncelikSec(girdi.oncelik),
    elenme_sebebi: metin(girdi.elenme_sebebi, 1000),
    notlar: metin(girdi.notlar, 5000),
    kaynak_link: urlTemiz(girdi.kaynak_link),
    etiketler: metinDizisi(girdi.etiketler, 15, 40),
  }

  return { gecerli: true, veri }
}

/* ══════════════════════════════════════════════════════════════ üniversite */

export function dogrulaUniversite(
  girdi: Record<string, unknown>,
): DogrulamaSonucu<UniversiteGirdi> {
  const hatalar: Record<string, string> = {}

  const ad = metin(girdi.ad, 200)
  if (!ad) hatalar.ad = 'Üniversite adı gerekli.'

  const ulke = typeof girdi.ulke_kodu === 'string' ? girdi.ulke_kodu.trim().toUpperCase() : ''
  if (!ulke) hatalar.ulke_kodu = 'Ülke seç.'
  else if (!kodlar.ulke.has(ulke)) hatalar.ulke_kodu = 'Tanınmayan ülke kodu.'

  if (Object.keys(hatalar).length > 0) return { gecerli: false, hatalar }

  const veri: UniversiteGirdi = {
    ad: ad!,
    ulke_kodu: ulke,
    sehir: metin(girdi.sehir, 120),
    tur: typeof girdi.tur === 'string' && kodlar.universiteTur.has(girdi.tur) ? girdi.tur : null,

    qs_sirasi: sayi(girdi.qs_sirasi, { enAz: 1, enFazla: 5000, tam: true }),
    the_sirasi: sayi(girdi.the_sirasi, { enAz: 1, enFazla: 5000, tam: true }),
    alan_sirasi: sayi(girdi.alan_sirasi, { enAz: 1, enFazla: 5000, tam: true }),
    siralama_not: metin(girdi.siralama_not, 500),

    basvuru_platformu: metin(girdi.basvuru_platformu, 200),
    basvuru_ucreti: sayi(girdi.basvuru_ucreti, { enAz: 0, enFazla: 1e6 }),
    basvuru_ucreti_para: typeof girdi.basvuru_ucreti_para === 'string'
      && kodlar.para.has(girdi.basvuru_ucreti_para) ? girdi.basvuru_ucreti_para : null,
    depozito: sayi(girdi.depozito, { enAz: 0, enFazla: 1e7 }),
    depozito_para: typeof girdi.depozito_para === 'string'
      && kodlar.para.has(girdi.depozito_para) ? girdi.depozito_para : null,
    depozito_not: metin(girdi.depozito_not, 1000),

    ogretim_dili: metinDizisi(girdi.ogretim_dili, 10, 40),

    burs_var: ucluBool(girdi.burs_var),
    burs_notu: metin(girdi.burs_notu, 2000),
    burs_link: urlTemiz(girdi.burs_link),

    site_link: urlTemiz(girdi.site_link),
    basvuru_link: urlTemiz(girdi.basvuru_link),

    durum: durumSec(girdi.durum),
    oncelik: oncelikSec(girdi.oncelik),
    notlar: metin(girdi.notlar, 5000),
    ham_metin: metin(girdi.ham_metin, 60_000),
    etiketler: metinDizisi(girdi.etiketler, 15, 40),
  }

  return { gecerli: true, veri }
}

/* ═════════════════════════════════════════════════════════════════ program */

/**
 * Başvuru turları.
 *
 * Adı olmayan satır atılır — kullanıcı boş bir satır bırakmış demektir.
 * `kimin_icin` tanınmıyorsa null olur; null tur "herkes" gibi davranmaz,
 * `siradakiTur()` (Aşama 4) onu bağlayıcı saymaz. Bilinçli: yanlış turu
 * bağlayıcı saymak bir yıl kaybettirir, göstermemek yalnızca bir uyarı
 * kaybettirir.
 */
function basvuruTurlari(d: unknown): BasvuruTuru[] {
  if (!Array.isArray(d)) return []

  return d
    .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
    .map((x) => ({
      ad: metin(x.ad, 120) ?? '',
      son_tarih: tarih(x.son_tarih),
      kimin_icin: (typeof x.kimin_icin === 'string' && kodlar.kiminIcin.has(x.kimin_icin)
        ? x.kimin_icin : null) as BasvuruTuru['kimin_icin'],
      baslangic: metin(x.baslangic, 60),
      sonuc_tarihi: tarih(x.sonuc_tarihi),
      not: metin(x.not, 500),
    }))
    .filter((t) => t.ad.length > 0)
    .slice(0, 20)
}

export function dogrulaProgram(girdi: Record<string, unknown>): DogrulamaSonucu<ProgramGirdi> {
  const hatalar: Record<string, string> = {}

  const ad = metin(girdi.ad, 250)
  if (!ad) hatalar.ad = 'Program adı gerekli.'

  const universiteId = metin(girdi.universite_id, 40)
  if (!universiteId) {
    hatalar.universite_id = 'Üniversite seç. Listede yoksa önce üniversiteyi ekle.'
  } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(universiteId)) {
    hatalar.universite_id = 'Geçersiz üniversite kaydı.'
  }

  /* ── son tarih ── */
  const tipi = typeof girdi.son_tarih_tipi === 'string' ? girdi.son_tarih_tipi : ''
  if (!kodlar.sonTarihTipi.has(tipi)) hatalar.son_tarih_tipi = 'Son tarih tipi seç.'

  const sonTarih = tarih(girdi.son_tarih)
  const bas = tarih(girdi.son_tarih_baslangic)
  const bit = tarih(girdi.son_tarih_bitis)

  if (tipi === 'kesin' && !sonTarih) {
    hatalar.son_tarih =
      'Kesin tarih seçtin — günü de gir. Tarih belli değilse "Tarih aralığı" ya da "Henüz açıklanmadı" kullan.'
  }
  if (tipi === 'aralik') {
    if (!bas && !bit) hatalar.son_tarih_baslangic = 'Aralığın en az bir ucunu gir.'
    else if (bas && bit && bas > bit) hatalar.son_tarih_bitis = 'Bitiş tarihi başlangıçtan önce olamaz.'
  }

  const acilis = tarih(girdi.acilis_tarihi)
  const kapanis = tipi === 'kesin' ? sonTarih : bit ?? bas
  if (acilis && kapanis && acilis > kapanis) {
    hatalar.acilis_tarihi = 'Başvuru açılışı, kapanışından sonra olamaz.'
  }

  /* ── maliyet ── */
  const ucret = sayi(girdi.ogrenim_ucreti, { enAz: 0, enFazla: 1e7 })
  const ucretDonem = typeof girdi.ogrenim_ucreti_donem === 'string'
    && kodlar.ucretDonem.has(girdi.ogrenim_ucreti_donem) ? girdi.ogrenim_ucreti_donem : null
  const paraBirimi = typeof girdi.para_birimi === 'string' && kodlar.para.has(girdi.para_birimi)
    ? girdi.para_birimi : null

  // Para birimsiz tutar karşılaştırılamaz; "40000" tek başına DKK mı EUR mu
  // belli değil ve toplam maliyet hesabı bunu sessizce EUR sayarsa yalan söyler.
  if (ucret !== null && !paraBirimi) {
    hatalar.para_birimi = 'Öğrenim ücreti girdin — para birimini de seç, yoksa karşılaştırılamaz.'
  }
  if (ucret !== null && !ucretDonem) {
    hatalar.ogrenim_ucreti_donem = 'Ücretin yıllık mı, programın tamamı mı, ECTS başına mı olduğunu seç.'
  }

  // Burs tutarı da para birimsiz karşılaştırılamaz — toplam maliyetten
  // düşüleceği için birimi bilinmeyen bir tutar hesabı sessizce bozar.
  const bursTutari = sayi(girdi.burs_tahmini, { enAz: 0, enFazla: 1e7 })
  const bursPara = typeof girdi.burs_tahmini_para === 'string'
    && kodlar.para.has(girdi.burs_tahmini_para) ? girdi.burs_tahmini_para : null
  if (bursTutari !== null && !bursPara) {
    hatalar.burs_tahmini_para = 'Burs tutarı girdin — para birimini de seç.'
  }

  if (Object.keys(hatalar).length > 0) return { gecerli: false, hatalar }

  const veri: ProgramGirdi = {
    ad: ad!,
    universite_id: universiteId!,
    bolum: metin(girdi.bolum, 200),
    derece: metin(girdi.derece, 40),
    alanlar: metinDizisi(girdi.alanlar),

    sure_ay: sayi(girdi.sure_ay, { enAz: 1, enFazla: 120, tam: true }),
    ects: sayi(girdi.ects, { enAz: 1, enFazla: 600, tam: true }),
    tezli: ucluBool(girdi.tezli),
    ogretim_dili: metin(girdi.ogretim_dili, 120),
    kampus: typeof girdi.kampus === 'string' && kodlar.kampus.has(girdi.kampus)
      ? girdi.kampus : null,
    baslangic_donemleri: kodDizisi(girdi.baslangic_donemleri, kodlar.donem),

    son_tarih_tipi: tipi as ProgramGirdi['son_tarih_tipi'],
    // Tipe uymayan tarih alanlarını sıfırla: Kullanıcı "kesin"den "sürekli"ye
    // geçtiğinde eski tarih hayalet gibi kalmasın. Veritabanındaki CHECK de
    // aynı şeyi söylüyor; buradan geçmeyen zaten oraya çarpardı.
    son_tarih: tipi === 'kesin' ? sonTarih : null,
    son_tarih_baslangic: tipi === 'aralik' ? bas : null,
    son_tarih_bitis: tipi === 'aralik' ? bit : null,
    son_tarih_not: metin(girdi.son_tarih_not, 500),
    acilis_tarihi: acilis,
    basvuru_turlari: basvuruTurlari(girdi.basvuru_turlari),

    ogrenim_ucreti: ucret,
    para_birimi: paraBirimi,
    ogrenim_ucreti_donem: ucretDonem as ProgramGirdi['ogrenim_ucreti_donem'],
    ucret_muafiyeti: ucluBool(girdi.ucret_muafiyeti),
    ucret_not: metin(girdi.ucret_not, 1000),

    uygunluk: (typeof girdi.uygunluk === 'string' && kodlar.uygunluk.has(girdi.uygunluk)
      ? girdi.uygunluk : 'bilinmiyor') as ProgramGirdi['uygunluk'],
    uygunluk_not: metin(girdi.uygunluk_not, 2000),
    on_kosullar: kodDizisi(girdi.on_kosullar, kodlar.kosul),
    on_kosul_detay: metin(girdi.on_kosul_detay, 3000),
    dil_sarti: metin(girdi.dil_sarti, 300),
    not_ortalamasi: metin(girdi.not_ortalamasi, 200),
    is_deneyimi: metin(girdi.is_deneyimi, 300),

    belgeler: kodDizisi(girdi.belgeler, kodlar.belge),
    belge_detay: metin(girdi.belge_detay, 3000),

    kontenjan: sayi(girdi.kontenjan, { enAz: 1, enFazla: 100_000, tam: true }),
    kabul_orani: metin(girdi.kabul_orani, 120),
    rekabet_not: metin(girdi.rekabet_not, 1000),

    ilgili_burslar: metinDizisi(girdi.ilgili_burslar, 20, 120),
    burs_notu: metin(girdi.burs_notu, 2000),
    burs_tahmini: sayi(girdi.burs_tahmini, { enAz: 0, enFazla: 1e7 }),
    burs_tahmini_para: typeof girdi.burs_tahmini_para === 'string'
      && kodlar.para.has(girdi.burs_tahmini_para) ? girdi.burs_tahmini_para : null,

    mezun_istihdam: metin(girdi.mezun_istihdam, 2000),
    staj_zorunlu: ucluBool(girdi.staj_zorunlu),
    kariyer_not: metin(girdi.kariyer_not, 2000),

    durum: durumSec(girdi.durum),
    oncelik: oncelikSec(girdi.oncelik),
    basvuru_link: urlTemiz(girdi.basvuru_link),
    kaynak_link: urlTemiz(girdi.kaynak_link),
    mufredat_link: urlTemiz(girdi.mufredat_link),
    notlar: metin(girdi.notlar, 5000),
    ham_metin: metin(girdi.ham_metin, 60_000),
    etiketler: metinDizisi(girdi.etiketler, 15, 40),
  }

  return { gecerli: true, veri }
}

/* ════════════════════════════════════════════════════════ FormData okuma */

/** Hangi alanlar çoklu seçim — `fd.getAll()` ile toplanmalı. */
const COKLU: Record<string, string[]> = {
  ulke: ['etiketler'],
  universite: ['ogretim_dili', 'etiketler'],
  program: [
    'alanlar', 'baslangic_donemleri', 'on_kosullar', 'belgeler',
    'ilgili_burslar', 'etiketler',
  ],
}

/** Formdan JSON dizgesi olarak gelen dinamik satırlı alanlar. */
const JSON_ALANLAR = ['basvuru_turlari']

/**
 * FormData → düz nesne.
 *
 * `basvuru_turlari` gizli bir JSON alanı olarak geliyor: satır sayısı
 * değişken olduğu için düz FormData alan adlarıyla temsil etmek kırılgan
 * olurdu (satır silince indeksler kayar). Kalıbın çalışan örneği
 * `bilesenler/BasvuruTurlari.tsx` (Aşama 4).
 */
export function formVerisiniOku(
  fd: FormData,
  tip: 'ulke' | 'universite' | 'program',
): Record<string, unknown> {
  const cok = COKLU[tip]
  const nesne: Record<string, unknown> = {}

  for (const ad of cok) {
    nesne[ad] = fd.getAll(ad).filter((d): d is string => typeof d === 'string')
  }
  for (const [ad, deger] of fd.entries()) {
    if (cok.includes(ad)) continue
    nesne[ad] = deger
  }

  for (const ad of JSON_ALANLAR) {
    const ham = nesne[ad]
    if (typeof ham === 'string') {
      try {
        nesne[ad] = JSON.parse(ham)
      } catch {
        nesne[ad] = []
      }
    }
  }

  // Virgülle yazılmış serbest listeleri de kabul et: "Demografi, Göç"
  for (const ad of ['alanlar', 'etiketler', 'ilgili_burslar', 'ogretim_dili']) {
    const d = nesne[ad]
    if (Array.isArray(d) && d.length === 1 && typeof d[0] === 'string' && d[0].includes(',')) {
      nesne[ad] = d[0].split(',').map((x) => x.trim()).filter(Boolean)
    }
  }

  return nesne
}
