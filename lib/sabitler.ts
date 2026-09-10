/**
 * Uygulamanın ortak sözlüğü.
 *
 * Belge / ön koşul / durum alanları serbest metin DEĞİL, buradaki kodlardan
 * seçilir. Sebep: filtreleme ancak yazım birliği varsa çalışır. "IELTS",
 * "ielts 6.5", "İngilizce sınavı" üç ayrı satır olsaydı "IELTS isteyen
 * programlar" diye süzemezdin.
 *
 * Yeni bir kod eklemek serbest — tek yer burası. Eklerken `esanlam`
 * listesine hem Türkçe hem İngilizce karşılıkları yaz; metin ayrıştırıcı
 * (lib/ayristir.ts, Aşama 10) doğrudan bu listeyi okur. Eşanlamlar küçük
 * harfe çevrilip aksanları atılarak karşılaştırılır, o yüzden buraya sade
 * yaz ("İngilizce" değil "ingilizce").
 *
 * BURSTAKIP'TEN TAŞINMAYANLAR: `KAPSAMLAR` (bursun neyi karşıladığı) —
 * yerini maliyet alanları aldı. `BURS_KAYNAKLARI` (Türkiye çıkışlı / global)
 * — burs kavramı, programda karşılığı yok. `SEVIYELER` — burada her kayıt
 * zaten yüksek lisans.
 */

export type Secenek = {
  kod: string
  ad: string
  /** Metin ayrıştırıcının aradığı kalıplar. */
  esanlam: string[]
  /** Listelerde ve rozetlerde gösterilen kısa simge. */
  simge?: string
  aciklama?: string
}

/* ═══════════════════════════════════════════════════════ UYGUNLUK KAPISI */

/**
 * Programın ön koşulları — "başvurmadan önce elenir miyim".
 *
 * Belge takvimiyle aynı ağırlıkta bir özellik: ikisi de "sonradan öğrenmek
 * yerine şimdi gör" işi yapıyor.
 *
 * Liste kullanıcının alanına (istatistik × sosyal bilimler) göre seçilmiş;
 * genel bir "her programın her koşulu" listesi değil.
 */
export const ON_KOSULLAR: Secenek[] = [
  {
    kod: 'matematik_ects', ad: 'Matematik ECTS/kredi şartı', simge: '➗',
    aciklama: 'Çoğu nicel program lisanstan belli sayıda matematik kredisi ister.',
    esanlam: ['ects in mathematics', 'mathematics credits', 'credits in mathematics',
      'calculus', 'linear algebra', 'mathematical background', 'quantitative background',
      'matematik kredisi', 'matematik ects', 'lineer cebir'],
  },
  {
    kod: 'istatistik_dersi', ad: 'İstatistik / olasılık dersi', simge: '📊',
    esanlam: ['statistics course', 'course in statistics', 'probability',
      'statistical methods', 'introductory statistics', 'inferential statistics',
      'istatistik dersi', 'olasilik'],
  },
  {
    kod: 'programlama', ad: 'Programlama bilgisi', simge: '💻',
    aciklama: 'Genelde Python ya da R isteniyor; bazen ders, bazen kanıtlanmış deneyim.',
    esanlam: ['programming', 'programming experience', 'proficiency in programming',
      'python', 'stata', 'spss', 'coding experience', 'computer programming',
      'programlama', 'kodlama', 'yazilim bilgisi'],
  },
  {
    kod: 'ekonometri', ad: 'Ekonometri', simge: '📈',
    esanlam: ['econometrics', 'econometric methods', 'regression analysis',
      'multivariate analysis', 'ekonometri', 'regresyon analizi'],
  },
  {
    kod: 'arastirma_yontem', ad: 'Araştırma yöntemleri dersi', simge: '🔬',
    esanlam: ['research methods', 'research design', 'methodology course',
      'social research methods', 'arastirma yontemleri', 'arastirma tasarimi',
      'yontem dersi'],
  },
  {
    kod: 'lisans_alani', ad: 'Belirli lisans alanı şartı', simge: '🎓',
    aciklama: 'Kabul edilen lisans alanları sayılıyorsa detayı uygunluk notuna yaz.',
    esanlam: ['bachelor in', 'degree in a related field', 'relevant bachelor',
      'related discipline', 'social sciences background', 'academic background in',
      'ilgili lisans', 'lisans alani', 'ilgili bir alanda lisans'],
  },
  {
    kod: 'lisans_tezi', ad: 'Lisans tezi şartı', simge: '📝',
    esanlam: ['bachelor thesis', 'bachelor\'s thesis', 'written thesis',
      'thesis requirement', 'lisans tezi', 'bitirme projesi', 'bitirme tezi'],
  },
  {
    kod: 'is_deneyimi', ad: 'İş deneyimi şartı', simge: '🏢',
    esanlam: ['work experience required', 'professional experience',
      'years of relevant experience', 'is deneyimi sarti', 'mesleki deneyim'],
  },
  {
    kod: 'gre_gmat', ad: 'GRE / GMAT', simge: '🧮',
    aciklama: 'Belge listesindeki `gre`/`gmat` ile birlikte işaretlenir: biri koşul, diğeri hazırlanacak evrak.',
    esanlam: ['gre', 'gmat', 'gre general test', 'graduate record examination',
      'gre scores', 'gmat score'],
  },
  {
    kod: 'mulakat', ad: 'Mülakat', simge: '🎙️',
    esanlam: ['interview', 'admission interview', 'online interview',
      'selection interview', 'mulakat', 'sozlu degerlendirme'],
  },
  {
    kod: 'on_odev', ad: 'Giriş sınavı / ön ödev', simge: '✍️',
    esanlam: ['entrance exam', 'admission test', 'entrance examination',
      'written assignment', 'pre-assignment', 'assessment task', 'admission assignment',
      'giris sinavi', 'on odev', 'yazili degerlendirme'],
  },
  {
    kod: 'ulke_dili', ad: 'Ülke dili şartı', simge: '🗣️',
    aciklama: 'Hollandaca/Danca gibi. İngilizce program olsa bile bazı derslerde ya da stajda isteniyor.',
    esanlam: ['dutch language', 'danish language', 'swedish language',
      'norwegian language', 'german language proficiency', 'french language proficiency',
      'proficiency in dutch', 'hollandaca', 'danca', 'isvecce', 'almanca yeterlilik',
      'ulke dili'],
  },
]

/**
 * Uygunluk ışığı — üç durum + "bakmadım".
 *
 * ELLE işaretlenir, hesaplanmaz. Ön koşulun tutup tutmadığına ancak
 * transkripte bakarak karar verilebilir; uygulamanın tahmin etmesi yanlış
 * güven verir. Uygulamanın işi kararı görünür ve süzülebilir tutmak.
 */
export type Uygunluk = 'uygun' | 'supheli' | 'uygun_degil' | 'bilinmiyor'

export const UYGUNLUKLAR: {
  kod: Uygunluk
  ad: string
  simge: string
  renk: DurumRengi
  aciklama: string
}[] = [
  { kod: 'uygun', ad: 'Uygun', simge: '🟢', renk: 'yesil',
    aciklama: 'Ön koşulları kontrol ettin, tutuyor.' },
  { kod: 'supheli', ad: 'Şüpheli', simge: '🟡', renk: 'sari',
    aciklama: 'Bir koşul sınırda ya da belirsiz — transkriptine bakman gerekiyor.' },
  { kod: 'uygun_degil', ad: 'Uygun değil', simge: '🔴', renk: 'kirmizi',
    aciklama: 'Elendin. Kayıt silinmiyor, sebebi uygunluk notunda kalıyor.' },
  { kod: 'bilinmiyor', ad: 'Bakılmadı', simge: '⚪', renk: 'notr',
    aciklama: 'Henüz koşullara bakmadın.' },
]

/* ═════════════════════════════════════════════════════ SENDEN İSTENENLER */

/**
 * `kalicilik` alanı "Belgeler" ekranının bel kemiği:
 *  - 'havuz' → bir kere alırsın, tüm başvurularda aynısını kullanırsın (IELTS,
 *              transkript, pasaport). Global bir durum takibi anlamlı.
 *  - 'ozel'  → her program için yeniden yapılır (motivasyon mektubu, başvuru
 *              ücreti ödemesi). Global "hazır" demek yanıltıcı olur.
 */
export type BelgeKalicilik = 'havuz' | 'ozel'

export type BelgeSecenek = Secenek & {
  kalicilik: BelgeKalicilik
  /** Sıfırdan hazırlamak kabaca kaç gün sürer — "ne zaman başlamalıyım" uyarısını besler. */
  hazirlikGun: number
}

export const BELGELER: BelgeSecenek[] = [
  /* ------------------------------------------------------------ kimlik */
  {
    kod: 'pasaport', ad: 'Pasaport', simge: '🛂', kalicilik: 'havuz', hazirlikGun: 30,
    aciklama: 'Başvuru sırasında genelde en az 6 ay geçerli olması istenir.',
    esanlam: ['passport', 'valid passport', 'passport copy', 'pasaport', 'pasaport fotokopisi'],
  },
  {
    kod: 'kimlik', ad: 'Kimlik / nüfus kaydı', simge: '🪪', kalicilik: 'havuz', hazirlikGun: 3,
    esanlam: ['national id', 'identity card', 'id card', 'birth certificate',
      'kimlik fotokopisi', 'nufus cuzdani', 'dogum belgesi', 'nufus kayit ornegi'],
  },

  /* ---------------------------------------------------------- akademik */
  {
    kod: 'diploma', ad: 'Lisans diploması', simge: '🎓', kalicilik: 'havuz', hazirlikGun: 14,
    aciklama: 'Genelde onaylı çevirisi de istenir.',
    esanlam: ['bachelor degree', 'degree certificate', 'diploma', 'graduation certificate',
      'certified copy of degree', 'lisans diplomasi', 'mezuniyet belgesi'],
  },
  {
    kod: 'transkript', ad: 'Transkript', simge: '📊', kalicilik: 'havuz', hazirlikGun: 10,
    aciklama: 'Resmî, ıslak imzalı ve çoğu zaman İngilizce isteniyor.',
    esanlam: ['transcript', 'transcript of records', 'academic transcript', 'grade transcript',
      'transkript', 'not dokumu', 'ders dokumu'],
  },
  {
    kod: 'denklik', ad: 'Diploma denklik / tanınma (AB)', simge: '⚖️', kalicilik: 'havuz', hazirlikGun: 60,
    aciklama: 'Almanya (uni-assist / VPD), İtalya (DoV) gibi ülkeler ister. Uzun sürer, erken başla.',
    // 'apostille'/'apostil' BİLEREK burada değil, `apostil_tercume` kodunda:
    // ikisi ayrı iş ve ayrı süre. Aynı eşanlam iki kodda olsaydı ayrıştırıcı
    // her apostil geçen sayfada iki belge birden işaretlerdi.
    esanlam: ['recognition of degree', 'degree equivalence', 'uni-assist', 'vpd',
      'declaration of value', 'denklik belgesi', 'taninma belgesi'],
  },
  {
    // ── PROJE.md §4.8 ile eklenen üç kalemden biri ──
    kod: 'diploma_denklik_yurtdisi', ad: 'Yurt dışı diploma değerlendirmesi', simge: '🌐',
    kalicilik: 'havuz', hazirlikGun: 90,
    aciklama: 'WES / IQAS / Nuffic. Kanada ve Hollanda\'da şart, 8–12 hafta sürüyor. Geri sayım programın son tarihinden değil BU belgenin süresinden yapılmalı.',
    esanlam: ['wes', 'world education services', 'iqas', 'ices', 'ece',
      'credential evaluation', 'educational credential assessment', 'eca',
      'nuffic', 'idw', 'diploma evaluation', 'diploma degerlendirme'],
  },
  {
    // ── §4.8 ile eklenen ──
    kod: 'apostil_tercume', ad: 'Apostil + yeminli tercüme', simge: '🏛️',
    kalicilik: 'havuz', hazirlikGun: 14,
    aciklama: 'Diplomanın ve transkriptin resmî çevirisi + kaymakamlıktan apostil şerhi.',
    esanlam: ['apostille', 'apostilled', 'legalisation', 'legalization',
      'apostil', 'apostil serhi', 'yeminli tercume'],
  },
  {
    kod: 'yayin_listesi', ad: 'Yayın listesi', simge: '📑', kalicilik: 'havuz', hazirlikGun: 3,
    esanlam: ['list of publications', 'publication list', 'yayin listesi', 'akademik yayinlar'],
  },

  /* -------------------------------------------------------- dil / sınav */
  {
    kod: 'ielts', ad: 'IELTS', simge: '🇬🇧', kalicilik: 'havuz', hazirlikGun: 90,
    aciklama: 'Randevu + sonuç 3-6 hafta. Sonuç 2 yıl geçerli.',
    esanlam: ['ielts', 'ielts academic'],
  },
  {
    kod: 'toefl', ad: 'TOEFL', simge: '🇺🇸', kalicilik: 'havuz', hazirlikGun: 90,
    aciklama: 'Sonuç 2 yıl geçerli.',
    esanlam: ['toefl', 'toefl ibt'],
  },
  {
    kod: 'duolingo', ad: 'Duolingo English Test', simge: '🦉', kalicilik: 'havuz', hazirlikGun: 21,
    esanlam: ['duolingo', 'duolingo english test'],
  },
  {
    kod: 'yokdil_yds', ad: 'YDS / YÖKDİL / e-YDS', simge: '📝', kalicilik: 'havuz', hazirlikGun: 60,
    esanlam: ['yds', 'yokdil', 'e-yds'],
  },
  {
    kod: 'dil_sertifikasi_diger', ad: 'Diğer dil sertifikası', simge: '🗣️', kalicilik: 'havuz', hazirlikGun: 90,
    aciklama: 'TestDaF, DELF/DALF, DELE, Nederlands als tweede taal, Studieprøven…',
    esanlam: ['testdaf', 'dsh', 'goethe zertifikat', 'telc', 'delf', 'dalf', 'dele', 'topik',
      'jlpt', 'hsk', 'cils', 'celi', 'nt2', 'studieprøven', 'studieproven',
      'language certificate', 'proof of language proficiency',
      'dil sertifikasi', 'dil belgesi', 'dil yeterlilik'],
  },
  {
    kod: 'gre', ad: 'GRE', simge: '🧮', kalicilik: 'havuz', hazirlikGun: 90,
    esanlam: ['gre general test', 'gre score'],
  },
  {
    kod: 'gmat', ad: 'GMAT', simge: '📈', kalicilik: 'havuz', hazirlikGun: 90,
    esanlam: ['gmat', 'gmat score'],
  },
  {
    kod: 'ales', ad: 'ALES', simge: '📝', kalicilik: 'havuz', hazirlikGun: 60,
    esanlam: ['ales'],
  },

  /* -------------------------------------------------- program özelinde */
  {
    kod: 'motivasyon_mektubu', ad: 'Motivasyon mektubu / SOP', simge: '✍️', kalicilik: 'ozel', hazirlikGun: 14,
    aciklama: 'Her program için baştan yazılır — kopyala-yapıştır hemen fark ediliyor.',
    esanlam: ['motivation letter', 'letter of motivation', 'statement of purpose',
      'personal statement', 'personal essay', 'motivasyon mektubu', 'niyet mektubu',
      'amac beyani', 'kisisel beyan'],
  },
  {
    kod: 'referans_mektubu', ad: 'Referans mektubu', simge: '📮', kalicilik: 'ozel', hazirlikGun: 30,
    aciklama: 'Hocandan istemek zaman alır — en erken başlaman gereken kalem.',
    esanlam: ['letters of recommendation', 'letter of recommendation', 'recommendation letter',
      'reference letter', 'letters of reference', 'academic reference', 'referee',
      'referans mektubu', 'tavsiye mektubu'],
  },
  {
    kod: 'arastirma_onerisi', ad: 'Araştırma önerisi', simge: '🔬', kalicilik: 'ozel', hazirlikGun: 30,
    aciklama: 'Tezli programlarda sık isteniyor.',
    esanlam: ['research proposal', 'project proposal', 'research plan', 'study plan',
      'arastirma onerisi', 'arastirma plani', 'proje onerisi', 'calisma plani'],
  },
  {
    kod: 'cv', ad: 'CV / Özgeçmiş', simge: '📄', kalicilik: 'havuz', hazirlikGun: 5,
    aciklama: 'Avrupa programları çoğunlukla Europass biçimi ister.',
    esanlam: ['curriculum vitae', 'europass', 'academic cv', 'resume', 'ozgecmis', 'cv'],
  },
  {
    kod: 'yazma_ornegi', ad: 'Yazma örneği', simge: '📝', kalicilik: 'ozel', hazirlikGun: 10,
    esanlam: ['writing sample', 'academic writing sample', 'yazma ornegi', 'makale ornegi'],
  },
  {
    kod: 'portfolyo', ad: 'Portfolyo', simge: '🎨', kalicilik: 'ozel', hazirlikGun: 21,
    esanlam: ['portfolio', 'design portfolio', 'work samples', 'portfolyo'],
  },
  {
    kod: 'danisman_kabul', ad: 'Danışman kabul yazısı', simge: '🤝', kalicilik: 'ozel', hazirlikGun: 45,
    aciklama: 'Hocayla yazışma + kabul aylar sürebilir.',
    esanlam: ['supervisor', 'letter of acceptance from a professor', 'supervision agreement',
      'host professor', 'academic supervisor', 'danisman kabul', 'akademik danisman'],
  },
  {
    kod: 'basvuru_formu', ad: 'Çevrimiçi başvuru formu', simge: '🖥️', kalicilik: 'ozel', hazirlikGun: 3,
    aciklama: 'Studielink, DreamApply ya da okulun kendi portalı.',
    esanlam: ['application form', 'online application', 'apply online', 'application portal',
      'studielink', 'dreamapply', 'basvuru formu', 'cevrimici basvuru'],
  },
  {
    // ── §4.8 ile eklenen ──
    kod: 'basvuru_ucreti_odeme', ad: 'Başvuru ücreti ödemesi', simge: '💳',
    kalicilik: 'ozel', hazirlikGun: 3,
    aciklama: 'Bazı portallarda ödeme yapılmadan başvuru "gönderilmiş" sayılmıyor. Tutarı üniversite katmanında.',
    esanlam: ['application fee', 'non-refundable fee', 'processing fee', 'payment of the fee',
      'basvuru ucreti', 'basvuru bedeli'],
  },

  /* ------------------------------------------------------------- diğer */
  {
    kod: 'is_deneyim_belgesi', ad: 'İş deneyimi belgesi', simge: '🏢', kalicilik: 'havuz', hazirlikGun: 14,
    esanlam: ['employment certificate', 'proof of employment',
      'work reference', 'calisma belgesi', 'hizmet dokumu', 'sgk dokumu'],
  },
  {
    kod: 'gelir_belgesi', ad: 'Gelir / banka belgesi', simge: '🏦', kalicilik: 'havuz', hazirlikGun: 7,
    aciklama: 'Vize aşamasında bloke hesap istenen ülkeler için de bu kalem.',
    esanlam: ['proof of funds', 'bank statement', 'financial statement', 'income statement',
      'proof of financial need', 'blocked account', 'sperrkonto',
      'gelir belgesi', 'banka hesap dokumu', 'maddi durum belgesi', 'gelir beyani'],
  },
  {
    kod: 'foto', ad: 'Biyometrik fotoğraf', simge: '📷', kalicilik: 'havuz', hazirlikGun: 2,
    esanlam: ['passport photo', 'biometric photo', 'photograph', 'vesikalik', 'biyometrik fotograf'],
  },
  {
    kod: 'saglik_raporu', ad: 'Sağlık raporu', simge: '🏥', kalicilik: 'havuz', hazirlikGun: 10,
    esanlam: ['medical certificate', 'health certificate', 'medical examination',
      'saglik raporu', 'saglik belgesi'],
  },
  {
    kod: 'adli_sicil', ad: 'Adli sicil kaydı', simge: '📜', kalicilik: 'havuz', hazirlikGun: 5,
    esanlam: ['criminal record', 'police clearance', 'certificate of good conduct',
      'adli sicil', 'sabika kaydi'],
  },
  {
    kod: 'ikametgah', ad: 'İkametgâh belgesi', simge: '📍', kalicilik: 'havuz', hazirlikGun: 2,
    esanlam: ['proof of residence', 'residence certificate', 'ikametgah', 'yerlesim yeri belgesi'],
  },
  {
    kod: 'askerlik', ad: 'Askerlik durum belgesi', simge: '🎖️', kalicilik: 'havuz', hazirlikGun: 5,
    esanlam: ['military service', 'askerlik durum belgesi', 'askerlik tecil'],
  },
  {
    kod: 'ceviri_noter', ad: 'Noter onaylı çeviri', simge: '🖊️', kalicilik: 'havuz', hazirlikGun: 10,
    aciklama: 'Apostil gerekmeyen, sadece onaylı çeviri istenen belgeler için.',
    esanlam: ['certified translation', 'sworn translation', 'notarised', 'notarized',
      'noter onayli', 'onayli ceviri'],
  },
  {
    kod: 'mulakat', ad: 'Mülakat', simge: '🎙️', kalicilik: 'ozel', hazirlikGun: 14,
    aciklama: 'Belge değil ama takvimde yer kaplar — kısa listeye kalırsan gelir.',
    esanlam: ['panel interview', 'assessment centre', 'sozlu sinav'],
  },
]

/* ═══════════════════════════════════════════════════════ SÜREÇ DURUMLARI */

export type DurumRengi = 'notr' | 'mavi' | 'mor' | 'sari' | 'yesil' | 'kirmizi'

export type DurumSecenek = {
  kod: string
  ad: string
  simge: string
  /** Rozet rengi — globals.css'teki `.rozet-<renk>` sınıflarıyla eşleşir. */
  renk: DurumRengi
  /** Bu durumdaki kayıtlar için son tarih geri sayımı anlamını yitirir. */
  kapali: boolean
  /**
   * Bu durumdayken hâlâ belge toplanıyor mu?
   *
   * Belge takvimi yalnızca bunlara bakar. Başvurusu gönderilmiş bir programın
   * belgelerini "hazırlaman gerekenler" listesinde göstermek yanlış alarm
   * üretir — o iş bitmiştir, geriye kalan beklemektir.
   */
  belgeBekliyor: boolean
  aciklama: string
}

export const DURUMLAR: DurumSecenek[] = [
  { kod: 'arastiriliyor', ad: 'Araştırılıyor', simge: '🔍', renk: 'notr', kapali: false, belgeBekliyor: true,
    aciklama: 'Not aldın, henüz karar vermedin.' },
  { kod: 'kisa_liste', ad: 'Kısa listede', simge: '⭐', renk: 'mavi', kapali: false, belgeBekliyor: true,
    aciklama: 'Başvurmaya karar verdin, sıra belgelerde.' },
  { kod: 'hazirlaniyor', ad: 'Belgeler hazırlanıyor', simge: '📋', renk: 'mor', kapali: false, belgeBekliyor: true,
    aciklama: 'Aktif olarak evrak topluyorsun.' },
  { kod: 'basvuruldu', ad: 'Başvuruldu', simge: '📤', renk: 'sari', kapali: false, belgeBekliyor: false,
    aciklama: 'Gönderildi, sonuç bekleniyor.' },
  { kod: 'mulakat', ad: 'Mülakat aşaması', simge: '🎙️', renk: 'sari', kapali: false, belgeBekliyor: false,
    aciklama: 'Kısa listeye kaldın.' },
  { kod: 'bekleme', ad: 'Bekleme listesinde', simge: '🕐', renk: 'sari', kapali: false, belgeBekliyor: false,
    aciklama: 'Yedektesin — yer açılırsa çağrılacaksın.' },
  { kod: 'kabul', ad: 'Kabul edildi', simge: '🎉', renk: 'yesil', kapali: true, belgeBekliyor: false,
    aciklama: 'Kabul aldın. Kayıt kararı ayrı bir durum.' },
  { kod: 'kayit', ad: 'Kayıt yaptım', simge: '🏫', renk: 'yesil', kapali: true, belgeBekliyor: false,
    aciklama: 'Gideceğin program bu.' },
  { kod: 'red', ad: 'Reddedildi', simge: '✖️', renk: 'kirmizi', kapali: true, belgeBekliyor: false,
    aciklama: 'Olumsuz sonuçlandı.' },
  { kod: 'uygun_degil', ad: 'Uygun değil', simge: '🚫', renk: 'kirmizi', kapali: true, belgeBekliyor: false,
    aciklama: 'Ön koşulları tutmuyor. Kayıt silinmiyor, sebebi uygunluk notunda kalıyor.' },
  { kod: 'kacirildi', ad: 'Süresi geçti', simge: '⏳', renk: 'kirmizi', kapali: true, belgeBekliyor: false,
    aciklama: 'Son tarihi kaçırdın.' },
  { kod: 'vazgectim', ad: 'Vazgeçtim', simge: '🙅', renk: 'notr', kapali: true, belgeBekliyor: false,
    aciklama: 'Başvurabilirdin ama istemedin — sebebi notlarda dursun.' },
]

/** Panelde ve listede varsayılan olarak gizlenen, "işi bitmiş" durumlar. */
export const KAPALI_DURUMLAR: string[] = DURUMLAR.filter((d) => d.kapali).map((d) => d.kod)

/** Belge takviminin ve "son tarihi geçti" uyarısının kapsadığı durumlar. */
export const BELGE_BEKLEYEN_DURUMLAR: string[] =
  DURUMLAR.filter((d) => d.belgeBekliyor).map((d) => d.kod)

export const VARSAYILAN_DURUM = 'arastiriliyor'

/* ═════════════════════════════════════════════════════════ SON TARİH TİPİ */

export const SON_TARIH_TIPLERI = [
  { kod: 'kesin', ad: 'Kesin tarih', aciklama: 'Gün belli: 15 Ocak 2027' },
  { kod: 'aralik', ad: 'Tarih aralığı', aciklama: 'Başvuru penceresi ya da "Ekim başı – Aralık ortası" gibi tahmin' },
  { kod: 'surekli', ad: 'Sürekli açık', aciklama: 'Rolling / yıl boyu başvuru alınıyor' },
  { kod: 'bilinmiyor', ad: 'Henüz açıklanmadı', aciklama: 'Tarih belirsiz — takip etmen gerekiyor' },
] as const

export type SonTarihTipi = (typeof SON_TARIH_TIPLERI)[number]['kod']

/**
 * Başvuru turunun kime açık olduğu.
 *
 * Kullanıcı AB DIŞI. 'ab' turları arayüzde görünür ama soluk çizilir ve geri
 * sayımı belirlemez — o tarihe bakmak bir yıl kaybettirir.
 */
export const TUR_KIMIN_ICIN = [
  { kod: 'ab_disi', ad: 'AB/AEA dışı', simge: '🌍', seninTurun: true,
    aciklama: 'Senin turun. Türkiye pasaportu bu gruba giriyor.' },
  { kod: 'herkes', ad: 'Herkes', simge: '👥', seninTurun: true,
    aciklama: 'Ayrım yapılmıyor, tek tarih.' },
  { kod: 'ab', ad: 'AB/AEA vatandaşı', simge: '🇪🇺', seninTurun: false,
    aciklama: 'Sana kapalı. Bilgi olsun diye kayda giriyor; sayfada büyük yazan tarih genelde budur.' },
] as const

export type TurKiminIcin = (typeof TUR_KIMIN_ICIN)[number]['kod']

/** Kullanıcıya açık tur kodları — `siradakiTur()` bunlara bakar (Aşama 4). */
export const SANA_ACIK_TURLAR: string[] =
  TUR_KIMIN_ICIN.filter((t) => t.seninTurun).map((t) => t.kod)

/* ═══════════════════════════════════════════════════════════════ MALİYET */

export const UCRET_DONEMLERI = [
  { kod: 'yillik', ad: 'Yıllık', aciklama: 'Her akademik yıl için bu tutar' },
  { kod: 'toplam', ad: 'Programın tamamı', aciklama: 'Tüm program için tek tutar' },
  { kod: 'ects', ad: 'ECTS başına', aciklama: 'Kredi başına ücret — toplam için ECTS ile çarpılıyor' },
] as const

export type UcretDonem = (typeof UCRET_DONEMLERI)[number]['kod']

/**
 * Form açılır listelerindeki para birimleri.
 *
 * Kısa tutuldu: Kullanıcının baktığı ülkeler + Türkiye. Listede olmayan bir
 * para birimi gerekirse buraya eklenir; kur değeri `ayarlar` tablosundan
 * geliyor (Aşama 7), burada sadece ad ve simge var.
 */
export const PARA_BIRIMLERI: { kod: string; ad: string; simge: string }[] = [
  { kod: 'EUR', ad: 'Euro', simge: '€' },
  { kod: 'DKK', ad: 'Danimarka kronu', simge: 'kr' },
  { kod: 'SEK', ad: 'İsveç kronu', simge: 'kr' },
  { kod: 'NOK', ad: 'Norveç kronu', simge: 'kr' },
  { kod: 'GBP', ad: 'İngiliz sterlini', simge: '£' },
  { kod: 'CHF', ad: 'İsviçre frangı', simge: 'CHF' },
  { kod: 'CAD', ad: 'Kanada doları', simge: 'C$' },
  { kod: 'USD', ad: 'ABD doları', simge: '$' },
  { kod: 'PLN', ad: 'Polonya zlotisi', simge: 'zł' },
  { kod: 'CZK', ad: 'Çek korunası', simge: 'Kč' },
  { kod: 'HUF', ad: 'Macar forinti', simge: 'Ft' },
  { kod: 'TRY', ad: 'Türk lirası', simge: '₺' },
]

/* ═══════════════════════════════════════════════════════ PROGRAM NİTELİKLERİ */

export const ONCELIKLER = [
  { kod: 1, ad: 'Yüksek', simge: '🔴' },
  { kod: 2, ad: 'Orta', simge: '🟡' },
  { kod: 3, ad: 'Düşük', simge: '⚪' },
] as const

export const KAMPUS_TIPLERI = [
  { kod: 'yuz_yuze', ad: 'Yüz yüze', simge: '🏫' },
  { kod: 'hibrit', ad: 'Hibrit', simge: '🔀' },
  { kod: 'online', ad: 'Çevrimiçi', simge: '💻' },
] as const

/**
 * Başlangıç dönemleri.
 *
 * Bahar dönemi başlangıcı olan program AB dışına çoğunlukla kapalı — ama
 * kural değil, o yüzden ayrı bir uyarı alanı değil sadece bir seçenek.
 */
export const BASLANGIC_DONEMLERI = [
  { kod: 'guz', ad: 'Güz (Eylül/Ekim)', simge: '🍂' },
  { kod: 'bahar', ad: 'Bahar (Şubat)', simge: '🌱' },
  { kod: 'yaz', ad: 'Yaz', simge: '☀️' },
] as const

export const UNIVERSITE_TURLERI = [
  { kod: 'devlet', ad: 'Devlet' },
  { kod: 'vakif', ad: 'Vakıf' },
  { kod: 'ozel', ad: 'Özel' },
] as const

/** Derece kısaltmaları — serbest metin ama forma öneri olarak veriliyor. */
export const DERECELER = ['MSc', 'MA', 'MEng', 'MASc', 'MPhil', 'MRes', 'MPP', 'MPA'] as const

/* ═══════════════════════════════════════════════════════════ YARDIMCILAR */

const belgeHarita = new Map(BELGELER.map((b) => [b.kod, b]))
const kosulHarita = new Map(ON_KOSULLAR.map((k) => [k.kod, k]))
const durumHarita = new Map(DURUMLAR.map((d) => [d.kod, d]))
const uygunlukHarita = new Map<string, (typeof UYGUNLUKLAR)[number]>(
  UYGUNLUKLAR.map((u) => [u.kod, u]),
)
const paraHarita = new Map(PARA_BIRIMLERI.map((p) => [p.kod, p]))

export const belgeBul = (kod: string) => belgeHarita.get(kod)
export const kosulBul = (kod: string) => kosulHarita.get(kod)
export const durumBul = (kod: string) => durumHarita.get(kod)
export const uygunlukBul = (kod: string) => uygunlukHarita.get(kod)
export const paraBul = (kod: string) => paraHarita.get(kod)

/** Bilinmeyen kod gelirse kodu ham göster — veriyi yutmaktansa çirkin göstermek yeğ. */
export const belgeAdi = (kod: string) => belgeHarita.get(kod)?.ad ?? kod
export const kosulAdi = (kod: string) => kosulHarita.get(kod)?.ad ?? kod
export const durumAdi = (kod: string) => durumHarita.get(kod)?.ad ?? kod
export const uygunlukAdi = (kod: string) => uygunlukHarita.get(kod)?.ad ?? kod
