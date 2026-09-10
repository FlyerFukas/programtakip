import type { SonTarihTipi, Uygunluk, UcretDonem } from './sabitler'

/**
 * Veri modeli.
 *
 * Alan adları veritabanı sütunlarıyla BİREBİR aynı — böylece sorgu sonucu
 * doğrudan bu tiplere oturuyor ve arada eşleme katmanı gerekmiyor.
 * Şema: veritabani/sema.sql
 *
 * Üç katman var ve sırası anlamlı:
 *
 *   ulkeler  →  universiteler  →  programlar
 *   göç yolu    sıralama/ücret    BAŞVURU BİRİMİ
 *
 * `ulke_kodu` programlara KOPYALANMIYOR; üniversiteden join ile geliyor
 * (bkz. `ProgramGenis`). Kopyalanan alan er geç sapar.
 */

/* ═════════════════════════════════════════════════════════ başvuru turları */

/**
 * Bir programın tek bir başvuru turu.
 *
 * NEDEN VAR: Kıta Avrupası'nda yaygın kalıp, AB dışı başvurunun AB
 * başvurusundan haftalar — çoğu zaman aylar — önce kapanması. Danimarka'da
 * AB/AEA dışı 15 Ocak, AB 15 Mart. Programın sayfasında büyük puntoyla yazan
 * tarih çoğunlukla AB tarihidir.
 *
 * KULLANICI AB DIŞI. Yanlış turu takip etmek bir yıl kaybettirir, o yüzden
 * turlar tek bir tarihe ezilmiyor; `kimin_icin` ile ayrı ayrı duruyorlar ve
 * `siradakiTur()` (lib/tarih.ts, Aşama 4) ona açık olanı seçiyor.
 *
 * `jsonb` sütunda dizi olarak duruyor: satır sayısı programdan programa
 * değişiyor, ayrı tablo açacak kadar da bağımsız bir varlık değil.
 */
export type BasvuruTuru = {
  /** "Tur 1 — AB dışı", "Erken başvuru". */
  ad: string
  /** YYYY-MM-DD. */
  son_tarih: string | null
  /** Bu tur kimin için açık. Kullanıcı AB DIŞI. */
  kimin_icin: 'ab_disi' | 'ab' | 'herkes' | null
  /** Hangi döneme başvuru: "2027 Güz". */
  baslangic: string | null
  /** Sonucun açıklanacağı gün — kabul beklerken takvim için. */
  sonuc_tarihi: string | null
  not: string | null
}

/* ═══════════════════════════════════════════════════════════════════ ülke */

/**
 * Hedef ülke ve göç yolu.
 *
 * Kullanıcının hedefi diploma değil: yüksek lisans → çalışma → oturum → mülk.
 * Bir program "iyi" olduğu için değil, o ülkede kalmanın yolunu açtığı için
 * değerli. Bu tablonun alanları o kararın verisi.
 */
export type Ulke = {
  /** ISO alpha-2. Birincil anahtar; lib/ulkeler.ts kataloğundan seçiliyor. */
  kod: string
  ad: string

  /* ── göç yolu ── */
  /** "PGWP 3 yıl", "zoekjaar 1 yıl" — serbest anlatım. */
  mezuniyet_sonrasi_izin: string | null
  /** Aynı bilginin ay cinsinden hâli. Sıralanabilsin diye ayrı sütun. */
  mezuniyet_sonrasi_ay: number | null
  oturum_yolu: string | null
  /** Daimî oturuma kaç yıl. */
  oturum_yil: number | null
  /** "B1 Hollandaca" — oturum için dil şartı. */
  oturum_dil_sarti: string | null
  vatandaslik_yil: number | null
  /** Türkiye izin veriyor; karşı taraf? */
  cifte_vatandaslik: boolean | null
  /** Yabancı mülk alabiliyor mu. */
  mulk_kisiti: string | null
  /** "haftada 20 saat". */
  ogrenci_calisma: string | null
  /** KIRMIZI ÇİZGİ: mezuniyetten sonra Türkiye'ye dönme zorunluluğu. */
  donus_yukumlulugu: string | null

  /* ── para ── */
  para_birimi: string | null
  /** `para_birimi` cinsinden aylık yaşam gideri. */
  aylik_yasam_gideri: number | null
  yasam_gideri_not: string | null
  /** Almanya gibi ülkelerde vize için bloke edilmesi gereken tutar. */
  blokeli_hesap: number | null

  /* ── vize / dil ── */
  vize_sureci: string | null
  vize_maliyet: string | null
  /** "master İngilizce, günlük hayat Danca". */
  ogretim_dili_not: string | null

  /* ── süreç ── */
  durum: string
  /** 1 yüksek, 2 orta, 3 düşük. */
  oncelik: number
  /** "devlet bursu yok + tam ücret" — neden elendiği kayıtta kalsın. */
  elenme_sebebi: string | null
  notlar: string | null
  kaynak_link: string | null
  etiketler: string[]

  olusturma: string
  guncelleme: string
}

/* ═════════════════════════════════════════════════════════════ üniversite */

export type Universite = {
  id: string
  ad: string
  /** `ulkeler.kod` yabancı anahtarı. */
  ulke_kodu: string
  sehir: string | null
  /** 'devlet' | 'vakif' | 'ozel' */
  tur: string | null

  /* ── sıralama ── */
  qs_sirasi: number | null
  the_sirasi: number | null
  /** Alan bazlı sıralama (istatistik, sosyoloji…) — genel sıralamadan önemli. */
  alan_sirasi: number | null
  siralama_not: string | null

  /* ── başvuru ── */
  /** "Studielink", "DreamApply", "kendi portalı". */
  basvuru_platformu: string | null
  basvuru_ucreti: number | null
  basvuru_ucreti_para: string | null
  /** Kabul sonrası istenen peşin ödeme. */
  depozito: number | null
  depozito_para: string | null
  depozito_not: string | null

  ogretim_dili: string[]

  /* ── burs ──
     Ayrıntı burs uygulamasında; burada sadece "var mı, nereye bakılır". */
  burs_var: boolean | null
  burs_notu: string | null
  burs_link: string | null

  site_link: string | null
  basvuru_link: string | null

  durum: string
  oncelik: number
  notlar: string | null
  ham_metin: string | null
  etiketler: string[]

  olusturma: string
  guncelleme: string
}

/* ════════════════════════════════════════════════════════════════ program */

export type Program = {
  id: string
  ad: string
  /** `universiteler.id` yabancı anahtarı. Ülke buradan geliyor. */
  universite_id: string
  /** "Department of Sociology". */
  bolum: string | null
  /** MSc | MA | MEng | MASc */
  derece: string | null
  alanlar: string[]

  /* ── yapı ── */
  sure_ay: number | null
  ects: number | null
  /**
   * Kanada'da finansman buna bağlı: tezli MASc fonlanır, ders bazlı MEng
   * fonlanmaz. Aynı okulda ücret farkı üç katı olabiliyor.
   */
  tezli: boolean | null
  ogretim_dili: string | null
  /** 'yuz_yuze' | 'hibrit' | 'online' */
  kampus: string | null
  /** ['guz', 'bahar'] */
  baslangic_donemleri: string[]

  /* ── son tarih ──
     Tip hangi alanların anlamlı olduğunu belirler:
       kesin      → son_tarih
       aralik     → son_tarih_baslangic .. son_tarih_bitis (biri boş olabilir)
       surekli    → hiçbiri
       bilinmiyor → hiçbiri, sadece son_tarih_not
     Doğrulama lib/dogrula.ts içinde; veritabanında da CHECK var. */
  son_tarih_tipi: SonTarihTipi
  son_tarih: string | null
  son_tarih_baslangic: string | null
  son_tarih_bitis: string | null
  son_tarih_not: string | null
  /** Başvurunun açıldığı gün — "daha açılmadı" uyarısını besler. */
  acilis_tarihi: string | null

  /** Merkezî tarih yerine turlar varsa. Bkz. `BasvuruTuru`. */
  basvuru_turlari: BasvuruTuru[]

  /* ── maliyet ── */
  ogrenim_ucreti: number | null
  para_birimi: string | null
  /** 'yillik' | 'toplam' | 'ects' — ücretin neye karşılık geldiği. */
  ogrenim_ucreti_donem: UcretDonem | null
  /** AB dışına ücret muafiyeti ihtimali var mı. */
  ucret_muafiyeti: boolean | null
  ucret_not: string | null

  /* ── uygunluk kapısı ──
     ELLE işaretlenir, hesaplanmaz: ön koşulun tutup tutmadığına ancak
     transkripte bakarak karar verilebilir, uygulamanın tahmin etmesi
     yanlış güven verir. */
  uygunluk: Uygunluk
  uygunluk_not: string | null
  /** ON_KOSULLAR kodları. */
  on_kosullar: string[]
  on_kosul_detay: string | null
  /** "IELTS 6.5, her bölümden en az 6.0". */
  dil_sarti: string | null
  not_ortalamasi: string | null
  is_deneyimi: string | null

  /* ── istenen belgeler ── */
  /** BELGELER kodları. "Hangi belgeler lazım" filtresinin çalıştığı alan. */
  belgeler: string[]
  belge_detay: string | null

  /* ── rekabet ── */
  kontenjan: number | null
  kabul_orani: string | null
  rekabet_not: string | null

  /* ── burs bağlantısı ──
     Burs uygulaması ayrı bir veritabanı; buraya sadece adları yazılıyor. */
  ilgili_burslar: string[]
  burs_notu: string | null
  /**
   * Beklenen burs tutarı — toplam maliyetten DÜŞÜLÜYOR (PROJE.md §4.6).
   *
   * Şartnamenin ilk şemasında yoktu: §4.6 "ilgili burs (elle girilen tahmini
   * tutar)" düşülmesini istiyordu ama tabloda yalnızca `ilgili_burslar`
   * (isim listesi) vardı ve isimden tutar çıkarılamıyor. Aşama 7'de eklendi.
   */
  burs_tahmini: number | null
  /** Burs çoğu zaman öğrenim ücretinden başka para biriminde açıklanıyor. */
  burs_tahmini_para: string | null

  /* ── kariyer / göç ── */
  mezun_istihdam: string | null
  staj_zorunlu: boolean | null
  kariyer_not: string | null

  /* ── süreç ── */
  durum: string
  oncelik: number
  basvuru_link: string | null
  kaynak_link: string | null
  mufredat_link: string | null
  notlar: string | null
  /**
   * Yapıştırılan/yüklenen orijinal metin. Ayrıştırıcı bir şeyi kaçırdıysa
   * ya da yanlış anladıysa asıl kaynağa dönebilmek için saklanıyor.
   */
  ham_metin: string | null
  etiketler: string[]

  olusturma: string
  guncelleme: string
}

/**
 * Liste ve detay sorgularının döndürdüğü, üniversitesi gömülü hâl.
 *
 * Program kartında üniversite adı, şehir, ülke bayrağı ve başvuru ücreti
 * gerekiyor; hepsi üniversite katmanında. `lib/sorgular.ts` bunları tek
 * sorguda join'liyor, kartlar N+1 istek atmıyor.
 */
export type ProgramGenis = Program & {
  universite: Pick<Universite,
    | 'id' | 'ad' | 'ulke_kodu' | 'sehir' | 'tur'
    | 'qs_sirasi' | 'the_sirasi' | 'alan_sirasi'
    | 'basvuru_platformu' | 'basvuru_ucreti' | 'basvuru_ucreti_para'
    | 'depozito' | 'depozito_para' | 'site_link'>
  /**
   * Ülkenin maliyet alanları — toplam maliyet hesabı yaşam giderini buradan
   * alıyor (PROJE.md §4.6). Aşama 7'de eklendi; onsuz her program için ayrı
   * ülke sorgusu gerekiyordu.
   */
  ulke: Pick<Ulke, 'kod' | 'ad' | 'para_birimi' | 'aylik_yasam_gideri'> | null
}

/** Üniversite + ülkesi — üniversite listesi ve karşılaştırma için. */
export type UniversiteGenis = Universite & {
  ulke: Pick<Ulke, 'kod' | 'ad' | 'para_birimi' | 'aylik_yasam_gideri'
    | 'mezuniyet_sonrasi_izin' | 'mezuniyet_sonrasi_ay'> | null
  /** Bu üniversiteye bağlı program sayısı — listede rozet olarak gösteriliyor. */
  program_sayisi: number
}

/* ═══════════════════════════════════════════════════════ giriş (yazma) tipleri */

/** Zaman damgaları veritabanında üretilir, kullanıcıdan gelmez. */
export type UlkeGirdi = Omit<Ulke, 'olusturma' | 'guncelleme'>
export type UniversiteGirdi = Omit<Universite, 'id' | 'olusturma' | 'guncelleme'>
export type ProgramGirdi = Omit<Program, 'id' | 'olusturma' | 'guncelleme'>

/* ═════════════════════════════════════════════════════════════════ belgeler */

/**
 * Bir programın tek bir belgesinin hazırlık durumu.
 *
 * 'ozel' belgeler (motivasyon mektubu) yalnızca burada anlamlı.
 * 'havuz' belgeler (IELTS) için global durum `HavuzBelge`de tutulur; burada
 * bir satır olması "bu program özelinde de işaretledim" demektir ve global
 * durumun üstüne yazar.
 */
export type ProgramBelge = {
  program_id: string
  belge_kodu: string
  hazir: boolean
  notlar: string | null
  guncelleme: string
}

/**
 * Elindeki kalıcı belgeler — bir kez alıp her başvuruda kullandıkların.
 * Belge takvimi ekranı buradan "IELTS'im var mı?" sorusunu cevaplıyor.
 */
export type HavuzBelge = {
  belge_kodu: string
  durum: HavuzDurum
  /** IELTS/TOEFL 2 yıl geçerli — süresi dolan belge yokla eşdeğer. */
  gecerlilik_bitis: string | null
  notlar: string | null
  guncelleme: string
}

export type HavuzDurum = 'yok' | 'hazirlaniyor' | 'hazir'

export const HAVUZ_DURUMLARI: { kod: HavuzDurum; ad: string; simge: string }[] = [
  { kod: 'yok', ad: 'Henüz yok', simge: '⬜' },
  { kod: 'hazirlaniyor', ad: 'Hazırlanıyor', simge: '🟡' },
  { kod: 'hazir', ad: 'Hazır', simge: '✅' },
]

/* ═══════════════════════════════════════════════════════════════════ ayarlar */

/**
 * Kur tablosu — `ayarlar` tablosunda 'kurlar' anahtarında duruyor.
 *
 * Canlı kur ÇEKİLMİYOR (PROJE.md §4.6): 6 ay sonraki bir karar için günlük
 * dalgalanma gürültü, ama çevrimdışı belirlilik değerli. Değer veritabanında
 * olduğu için güncellemek kod dağıtımı gerektirmiyor.
 */
export type KurAyari = {
  /** Para birimi → 1 birimin kaç EUR ettiği. */
  kurlar: Record<string, number>
  /** Bu kurların hangi güne ait olduğu (YYYY-MM-DD). */
  tarih: string
}

/* ══════════════════════════════════════════════ ayrıştırıcı çıktısı ══════════ */

/**
 * Metin ayrıştırıcının bir alan için bulduğu değer.
 *
 * `guven` alanı önizleme ekranında hangi alanların gözden geçirilmesi
 * gerektiğini işaretlemek için: 'yuksek' yeşil (kalıp net eşleşti),
 * 'dusuk' sarı (tahmin, kontrol et).
 */
export type Bulgu<T> = {
  deger: T
  guven: 'yuksek' | 'dusuk'
  /** Metinde bu değerin çıkarıldığı ham parça — önizlemede gösterilir. */
  kanit?: string
}

/** Ayrıştırıcının döndürdüğü, forma doldurulacak taslak. */
export type Taslak = {
  ad?: Bulgu<string>
  universite_adi?: Bulgu<string>
  ulke_kodu?: Bulgu<string>
  sehir?: Bulgu<string>
  bolum?: Bulgu<string>
  derece?: Bulgu<string>
  alanlar?: Bulgu<string[]>
  sure_ay?: Bulgu<number>
  ects?: Bulgu<number>
  tezli?: Bulgu<boolean>
  ogretim_dili?: Bulgu<string>
  baslangic_donemleri?: Bulgu<string[]>
  son_tarih_tipi?: Bulgu<SonTarihTipi>
  son_tarih?: Bulgu<string>
  son_tarih_baslangic?: Bulgu<string>
  son_tarih_bitis?: Bulgu<string>
  son_tarih_not?: Bulgu<string>
  acilis_tarihi?: Bulgu<string>
  basvuru_turlari?: Bulgu<BasvuruTuru[]>
  ogrenim_ucreti?: Bulgu<number>
  para_birimi?: Bulgu<string>
  ogrenim_ucreti_donem?: Bulgu<UcretDonem>
  ucret_muafiyeti?: Bulgu<boolean>
  ucret_not?: Bulgu<string>
  on_kosullar?: Bulgu<string[]>
  on_kosul_detay?: Bulgu<string>
  dil_sarti?: Bulgu<string>
  not_ortalamasi?: Bulgu<string>
  is_deneyimi?: Bulgu<string>
  belgeler?: Bulgu<string[]>
  belge_detay?: Bulgu<string>
  kontenjan?: Bulgu<number>
  kabul_orani?: Bulgu<string>
  basvuru_link?: Bulgu<string>
  kaynak_link?: Bulgu<string>
  mufredat_link?: Bulgu<string>
}

/** Metni okuyan dil modeli sağlayıcısı. */
export type Saglayici = 'claude' | 'gemini'

export type AyristirmaSonucu = {
  taslak: Taslak
  /** Kullanıcıya gösterilen özet: "2 tur, 5 belge ve 3 ön koşul bulundu." */
  ozet: string
  /** Ayrıştırıcının okuyamadığı ama kaydedilen ham metin. */
  hamMetin: string
  /** Hangi yolun kullanıldığı. */
  yontem: 'kural' | 'yapay-zeka'
  /** Kullanıcının bakması gereken noktalar. */
  uyarilar: string[]
  /** Hangi modelin okuduğu — sonuç ekranında yazıyor. */
  saglayici?: Saglayici
  model?: string
}
