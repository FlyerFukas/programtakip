import {
  BELGELER, ON_KOSULLAR, PARA_BIRIMLERI, DERECELER, UCRET_DONEMLERI,
  SON_TARIH_TIPLERI, BASLANGIC_DONEMLERI, TUR_KIMIN_ICIN, KAMPUS_TIPLERI,
  type SonTarihTipi, type UcretDonem,
} from './sabitler'
import { ULKELER } from './ulkeler'
import type { AyristirmaSonucu, Taslak, Bulgu, BasvuruTuru } from './tipler'

/**
 * Ayrıştırıcının AĞSIZ yarısı: modele gönderilen istem ve modelden gelenin
 * süzülmesi.
 *
 * `lib/ayristir-yz.ts`ten ayrı duruyor çünkü o modül `server-only` işaretli
 * (API anahtarını okuyor) ve `server-only` düz Node altında fırlatıyor —
 * yani test edilemiyordu. Burada ağ yok, `process.env` yok, saf fonksiyon
 * var; `scripts/dogrula-ayristirici.ts` bunu kaydedilmiş model çıktılarıyla
 * sınıyor.
 */

/** Yaklaşık 15 bin jeton — bir program sayfası bunun çok altında kalıyor. */
export const EN_UZUN_METIN = 60_000

export type HamCikti = Record<string, unknown>

/* ══════════════════════════════════════════════════ katalog → istem metni */

/** Kod listelerini istemin içine basıyoruz; katalog değişince istem de değişir. */
function katalog(baslik: string, satirlar: string[]): string {
  return `${baslik}\n${satirlar.map((s) => `  ${s}`).join('\n')}`
}

export function sistemIstemi(bugun: string): string {
  return [
    'Sen bir yüksek lisans program sayfasını okuyup yapılandırılmış veriye',
    'çeviren bir ayrıştırıcısın. Kullanıcı AB/AEA DIŞI (Türkiye pasaportu)',
    'bir aday; bu yüzden AB dışı başvuru turu onun için kritik.',
    '',
    `BUGÜNÜN TARİHİ: ${bugun}. Yılı yazmayan tarihleri buna göre çöz — geçmiş`,
    'bir tarih üretme, başvuru dönemi gelecekte olmalı.',
    '',
    'KURALLAR:',
    '1. Metinde AÇIKÇA yazmayan hiçbir şeyi doldurma. Emin değilsen alanı boş',
    '   bırak. Boş alan zararsız, uydurulmuş alan yanlış karar verdirir.',
    '2. Tahmine dayanan her alanın adını `dusuk_guven` dizisine yaz.',
    '3. Her doldurduğun alan için `kanit` dizisine metinden aldığın kısa',
    '   parçayı (en fazla 120 karakter) ekle.',
    '4. Tarihler YYYY-MM-DD. Gün belli değilse o alanı doldurma.',
    '5. Kodlu alanlarda YALNIZCA aşağıdaki listelerden seç, yeni kod uydurma.',
    '6. Sayfada AB dışı ve AB için AYRI son tarih varsa ikisini de',
    '   `basvuru_turlari` içine yaz ve `kimin_icin` alanını doğru işaretle.',
    '   Sayfada büyük yazan tarih genelde AB turudur, dikkatli oku.',
    '7. Ücret sayısal; para birimini ve dönemini (yıllık/toplam/ECTS başına)',
    '   ayrı alanlara koy. "Yıllık mı toplam mı" belirsizse dönemi boş bırak',
    '   ve alanı `dusuk_guven`e ekle.',
    '',
    katalog('ÜLKE KODLARI (ulke_kodu):', ULKELER.map((u) => `${u.kod} = ${u.ingilizce}`)),
    '',
    katalog('BELGE KODLARI (belgeler):', BELGELER.map((b) => `${b.kod} = ${b.ad}`)),
    '',
    katalog('ÖN KOŞUL KODLARI (on_kosullar):', ON_KOSULLAR.map((k) => `${k.kod} = ${k.ad}`)),
    '',
    katalog('PARA BİRİMLERİ (para_birimi):', PARA_BIRIMLERI.map((p) => `${p.kod} = ${p.ad}`)),
    '',
    katalog('DERECELER (derece):', [DERECELER.join(', ')]),
    '',
    'Sonucu yalnızca `program_taslagi` aracını çağırarak ver.',
  ].join('\n')
}

/* ════════════════════════════════════════════════════════ araç şeması */

const dizi = (aciklama: string) => ({
  type: 'array', items: { type: 'string' }, description: aciklama,
})

export const SEMA = {
  type: 'object',
  properties: {
    ad: { type: 'string', description: 'Programın tam adı, örn. "MSc Social Data Science".' },
    universite_adi: { type: 'string', description: 'Üniversitenin adı.' },
    ulke_kodu: { type: 'string', description: 'İki harfli ülke kodu, listeden.' },
    sehir: { type: 'string' },
    bolum: { type: 'string', description: 'Bölüm/fakülte, örn. "Department of Sociology".' },
    derece: { type: 'string', description: 'MSc / MA / MEng gibi.' },
    alanlar: dizi('Konu alanları, serbest metin.'),
    sure_ay: { type: 'integer', description: 'Program süresi AY cinsinden (2 yıl = 24).' },
    ects: { type: 'integer' },
    tezli: { type: 'boolean', description: 'Tez zorunluysa true, ders bazlıysa false.' },
    ogretim_dili: { type: 'string' },
    kampus: { type: 'string', enum: KAMPUS_TIPLERI.map((k) => k.kod) },
    baslangic_donemleri: {
      type: 'array', items: { type: 'string', enum: BASLANGIC_DONEMLERI.map((d) => d.kod) },
    },
    son_tarih_tipi: { type: 'string', enum: SON_TARIH_TIPLERI.map((t) => t.kod) },
    son_tarih: { type: 'string', description: 'YYYY-MM-DD. Yalnızca tip "kesin" ise.' },
    son_tarih_baslangic: { type: 'string', description: 'YYYY-MM-DD. Tip "aralik" ise.' },
    son_tarih_bitis: { type: 'string', description: 'YYYY-MM-DD. Tip "aralik" ise.' },
    son_tarih_not: { type: 'string' },
    acilis_tarihi: { type: 'string', description: 'Başvurunun açıldığı gün, YYYY-MM-DD.' },
    basvuru_turlari: {
      type: 'array',
      description: 'Sayfada birden fazla son tarih varsa her biri ayrı tur.',
      items: {
        type: 'object',
        properties: {
          ad: { type: 'string', description: 'örn. "Tur 1 — AB dışı".' },
          son_tarih: { type: 'string', description: 'YYYY-MM-DD.' },
          kimin_icin: { type: 'string', enum: TUR_KIMIN_ICIN.map((t) => t.kod) },
          baslangic: { type: 'string', description: 'Hangi döneme, örn. "2027 Güz".' },
          sonuc_tarihi: { type: 'string', description: 'YYYY-MM-DD.' },
          not: { type: 'string' },
        },
        required: ['ad'],
      },
    },
    ogrenim_ucreti: { type: 'number', description: 'AB DIŞI öğrenci ücreti, sayı olarak.' },
    para_birimi: { type: 'string', enum: PARA_BIRIMLERI.map((p) => p.kod) },
    ogrenim_ucreti_donem: { type: 'string', enum: UCRET_DONEMLERI.map((d) => d.kod) },
    ucret_muafiyeti: { type: 'boolean', description: 'Ücretsiz/muaf ise true.' },
    ucret_not: { type: 'string' },
    on_kosullar: { type: 'array', items: { type: 'string', enum: ON_KOSULLAR.map((k) => k.kod) } },
    on_kosul_detay: { type: 'string' },
    dil_sarti: { type: 'string', description: 'örn. "IELTS 6.5 (yazma 6.0)".' },
    not_ortalamasi: { type: 'string' },
    is_deneyimi: { type: 'string' },
    belgeler: { type: 'array', items: { type: 'string', enum: BELGELER.map((b) => b.kod) } },
    belge_detay: { type: 'string' },
    kontenjan: { type: 'integer' },
    kabul_orani: { type: 'string' },
    basvuru_link: { type: 'string' },
    kaynak_link: { type: 'string' },
    mufredat_link: { type: 'string' },
    dusuk_guven: dizi('Tahmine dayanan alanların adları.'),
    kanit: {
      type: 'array',
      description: 'Her alan için metinden alınan kısa dayanak.',
      items: {
        type: 'object',
        properties: { alan: { type: 'string' }, parca: { type: 'string' } },
        required: ['alan', 'parca'],
      },
    },
  },
  required: [],
}

/* ══════════════════════════════════════════════════════════ süzme katmanı */

function gecerliTarih(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
  const [y, a, g] = d.split('-').map(Number)
  const t = new Date(Date.UTC(y, a - 1, g))
  return t.getUTCFullYear() === y && t.getUTCMonth() === a - 1 && t.getUTCDate() === g
}

function dizge(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t ? t : undefined
}

function sayi(v: unknown, enAz = 0): number | undefined {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n >= enAz ? n : undefined
}

function mantik(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined
}

function tarihAlani(v: unknown): string | undefined {
  const t = dizge(v)
  return t && gecerliTarih(t) ? t : undefined
}

/**
 * Modelin ham çıktısını taslağa çevirir.
 *
 * Ayrı `export`: API çağrısı olmadan test edilebilsin
 * (scripts/dogrula-ayristirici.ts kaydedilmiş çıktılarla bunu sınıyor).
 */
export function taslagaCevir(
  ham: HamCikti,
  hamMetin: string,
  kesildi = false,
): AyristirmaSonucu {
  const taslak: Taslak = {}
  const uyarilar: string[] = []
  if (kesildi) {
    uyarilar.push(
      `Metin çok uzundu, ilk ${EN_UZUN_METIN.toLocaleString('tr-TR')} karakteri okundu — sonrası atlandı.`,
    )
  }

  const dusuk = new Set(
    Array.isArray(ham.dusuk_guven)
      ? ham.dusuk_guven.filter((x): x is string => typeof x === 'string')
      : [],
  )

  const kanitlar = new Map<string, string>()
  if (Array.isArray(ham.kanit)) {
    for (const k of ham.kanit) {
      if (!k || typeof k !== 'object') continue
      const o = k as Record<string, unknown>
      const alan = dizge(o.alan)
      const parca = dizge(o.parca)
      if (alan && parca) kanitlar.set(alan, parca.slice(0, 120))
    }
  }

  function koy<K extends keyof Taslak>(alan: K, deger: unknown): void {
    if (deger === undefined) return
    const bulgu: Bulgu<unknown> = {
      deger,
      guven: dusuk.has(alan) ? 'dusuk' : 'yuksek',
      kanit: kanitlar.get(alan),
    }
    taslak[alan] = bulgu as Taslak[K]
  }

  /** Katalogda olmayan kodları eler ve eleneni kullanıcıya söyler. */
  function kodListesi(etiket: string, v: unknown, gecerli: string[]): string[] | undefined {
    if (!Array.isArray(v)) return undefined
    const gelen = v.filter((x): x is string => typeof x === 'string')
    const tutan = gelen.filter((k) => gecerli.includes(k))
    const elenen = gelen.filter((k) => !gecerli.includes(k))
    if (elenen.length) {
      uyarilar.push(`${etiket}: tanınmayan kod atlandı (${elenen.join(', ')}). Formdan elle seçebilirsin.`)
    }
    return tutan.length ? tutan : undefined
  }

  function tekKod(etiket: string, v: unknown, gecerli: string[]): string | undefined {
    const t = dizge(v)
    if (!t) return undefined
    if (gecerli.includes(t)) return t
    uyarilar.push(`${etiket}: "${t}" tanınmadı, boş bırakıldı.`)
    return undefined
  }

  /* ── kimlik ── */
  koy('ad', dizge(ham.ad))
  koy('universite_adi', dizge(ham.universite_adi))
  koy('ulke_kodu', tekKod('Ülke', ham.ulke_kodu, ULKELER.map((u) => u.kod)))
  koy('sehir', dizge(ham.sehir))
  koy('bolum', dizge(ham.bolum))
  koy('derece', dizge(ham.derece))
  koy('alanlar', Array.isArray(ham.alanlar)
    ? ham.alanlar.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
    : undefined)

  /* ── yapı ── */
  koy('sure_ay', sayi(ham.sure_ay, 1))
  koy('ects', sayi(ham.ects, 1))
  koy('tezli', mantik(ham.tezli))
  koy('ogretim_dili', dizge(ham.ogretim_dili))
  koy('baslangic_donemleri', kodListesi('Başlangıç dönemi', ham.baslangic_donemleri,
    BASLANGIC_DONEMLERI.map((d) => d.kod)))

  /* ── son tarih ──
     Tip ile alanların tutarlı olması ŞART: veritabanında CHECK var
     (prg_son_tarih_tutarli). Tutarsız taslak kaydedilirken patlardı ve
     hata formda değil veritabanı katmanında görünürdü. */
  const tip = tekKod('Son tarih tipi', ham.son_tarih_tipi,
    SON_TARIH_TIPLERI.map((t) => t.kod)) as SonTarihTipi | undefined
  const kesinGun = tarihAlani(ham.son_tarih)
  const araBas = tarihAlani(ham.son_tarih_baslangic)
  const araBit = tarihAlani(ham.son_tarih_bitis)

  if (tip === 'kesin' && !kesinGun) {
    uyarilar.push('Son tarih "kesin" işaretlendi ama okunabilir bir gün bulunamadı — tip "henüz açıklanmadı"ya çekildi.')
    koy('son_tarih_tipi', 'bilinmiyor')
  } else if (tip === 'aralik' && !araBas && !araBit) {
    uyarilar.push('Son tarih "aralık" işaretlendi ama sınırlar okunamadı — tip "henüz açıklanmadı"ya çekildi.')
    koy('son_tarih_tipi', 'bilinmiyor')
  } else {
    koy('son_tarih_tipi', tip)
    if (tip === 'kesin') koy('son_tarih', kesinGun)
    if (tip === 'aralik') {
      koy('son_tarih_baslangic', araBas)
      koy('son_tarih_bitis', araBit)
    }
  }
  koy('son_tarih_not', dizge(ham.son_tarih_not))
  koy('acilis_tarihi', tarihAlani(ham.acilis_tarihi))

  /* ── başvuru turları ── */
  const turler: BasvuruTuru[] = []
  if (Array.isArray(ham.basvuru_turlari)) {
    for (const t of ham.basvuru_turlari) {
      if (!t || typeof t !== 'object') continue
      const o = t as Record<string, unknown>
      const ad = dizge(o.ad)
      if (!ad) continue
      const kimin = dizge(o.kimin_icin)
      turler.push({
        ad,
        son_tarih: tarihAlani(o.son_tarih) ?? null,
        kimin_icin: kimin && TUR_KIMIN_ICIN.some((k) => k.kod === kimin)
          ? (kimin as BasvuruTuru['kimin_icin'])
          : null,
        baslangic: dizge(o.baslangic) ?? null,
        sonuc_tarihi: tarihAlani(o.sonuc_tarihi) ?? null,
        not: dizge(o.not) ?? null,
      })
    }
  }
  if (turler.length) {
    koy('basvuru_turlari', turler)
    if (!turler.some((t) => t.kimin_icin === 'ab_disi' || t.kimin_icin === 'herkes')) {
      uyarilar.push('Bulunan turların hiçbiri sana açık işaretlenmedi. Hangisi senin turun, kontrol et — geri sayım buna bakıyor.')
    }
  }

  /* ── maliyet ── */
  const ucret = sayi(ham.ogrenim_ucreti, 0)
  koy('ogrenim_ucreti', ucret)
  koy('para_birimi', tekKod('Para birimi', ham.para_birimi, PARA_BIRIMLERI.map((p) => p.kod)))
  const donem = tekKod('Ücret dönemi', ham.ogrenim_ucreti_donem,
    UCRET_DONEMLERI.map((d) => d.kod)) as UcretDonem | undefined
  koy('ogrenim_ucreti_donem', donem)
  koy('ucret_muafiyeti', mantik(ham.ucret_muafiyeti))
  koy('ucret_not', dizge(ham.ucret_not))
  if (ucret !== undefined && !donem) {
    uyarilar.push('Ücret bulundu ama yıllık mı toplam mı belli değil. Dönemi seçmeden toplam maliyet hesaplanmıyor.')
  }

  /* ── koşullar ve belgeler ── */
  koy('on_kosullar', kodListesi('Ön koşul', ham.on_kosullar, ON_KOSULLAR.map((k) => k.kod)))
  koy('on_kosul_detay', dizge(ham.on_kosul_detay))
  koy('dil_sarti', dizge(ham.dil_sarti))
  koy('not_ortalamasi', dizge(ham.not_ortalamasi))
  koy('is_deneyimi', dizge(ham.is_deneyimi))
  koy('belgeler', kodListesi('Belge', ham.belgeler, BELGELER.map((b) => b.kod)))
  koy('belge_detay', dizge(ham.belge_detay))

  /* ── diğer ── */
  koy('kontenjan', sayi(ham.kontenjan, 1))
  koy('kabul_orani', dizge(ham.kabul_orani))
  koy('basvuru_link', dizge(ham.basvuru_link))
  koy('kaynak_link', dizge(ham.kaynak_link))
  koy('mufredat_link', dizge(ham.mufredat_link))

  const alanSayisi = Object.keys(taslak).length
  const dusukSayisi = Object.values(taslak).filter((b) => b?.guven === 'dusuk').length
  const parcalar = [`${alanSayisi} alan dolduruldu`]
  if (turler.length) parcalar.push(`${turler.length} başvuru turu`)
  const belgeSayisi = taslak.belgeler?.deger.length ?? 0
  if (belgeSayisi) parcalar.push(`${belgeSayisi} belge`)
  const kosulSayisi = taslak.on_kosullar?.deger.length ?? 0
  if (kosulSayisi) parcalar.push(`${kosulSayisi} ön koşul`)
  if (dusukSayisi) parcalar.push(`${dusukSayisi} tanesi şüpheli`)

  return {
    taslak,
    ozet: parcalar.join(' · '),
    hamMetin,
    yontem: 'yapay-zeka',
    uyarilar,
  }
}

