-- ============================================================================
--  Bölüm Takip — veritabanı şeması  (Neon / PostgreSQL)
--
--  UYGULAMA:  npm run sema
--  Betik .env.local'deki DATABASE_URL'i okuyup bu dosyayı çalıştırır.
--  Tamamı `if not exists` — tekrar tekrar çalıştırmak güvenli.
--
--  ── GÜVENLİK MODELİ ───────────────────────────────────────────────────────
--  Veritabanına halka açık bir HTTP API'si YOK. Tek erişim yolu
--  `DATABASE_URL` bağlantı dizgesi ve o dizge yalnızca sunucu tarafında
--  okunuyor (lib/veritabani.ts, `server-only` işaretli). Tarayıcıya hiçbir
--  veritabanı kimlik bilgisi gitmiyor.
--
--  Bu yüzden burada RLS YOK. BursTakip'te "RLS açık + hiçbir politika yok"
--  numarası vardı; sebebi Supabase'in PostgREST'i anon anahtarıyla internete
--  açmasıydı — kapatılması gereken bir kapı vardı. Neon'da o kapı hiç
--  açılmıyor, dolayısıyla kapatacak bir şey de yok. Tek savunma hattı
--  uygulama katmanı: yazan her server action `oturumZorunlu()` ile başlar.
--
--  ── SIRA ÖNEMLİ ───────────────────────────────────────────────────────────
--  Sonradan sütun ekleyeceğin zaman `alter table ... add column if not exists`
--  bloğunu İNDEKSLERDEN ÖNCE koy. BursTakip'te bu blok dosya sonundayken,
--  var olan bir veritabanında `create table if not exists` tabloyu atladığı
--  için `column ... does not exist` hatası alındı.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────── ülkeler
create table if not exists public.ulkeler (
  kod  text primary key check (kod ~ '^[A-Z]{2}$'),
  ad   text not null,

  -- ── göç yolu: asıl karar ekseni ──
  -- Kullanıcının hedefi diploma değil, o ülkede kalabilmek.
  mezuniyet_sonrasi_izin  text,     -- "PGWP 3 yıl", "zoekjaar 1 yıl"
  mezuniyet_sonrasi_ay    integer,  -- 36 — sıralanabilir olsun diye ayrı
  oturum_yolu             text,     -- serbest anlatım
  oturum_yil              numeric,  -- daimî oturuma kaç yıl
  oturum_dil_sarti        text,     -- "B1 Hollandaca"
  vatandaslik_yil         numeric,
  cifte_vatandaslik       boolean,  -- Türkiye izin veriyor; karşı taraf?
  mulk_kisiti             text,     -- yabancı mülk alabilir mi
  ogrenci_calisma         text,     -- "haftada 20 saat"
  -- Geri dönüş yükümlülüğü kullanıcı için KIRMIZI ÇİZGİ.
  donus_yukumlulugu       text,

  -- ── para ──
  para_birimi             text,     -- EUR, DKK, SEK, GBP, CAD, NOK
  aylik_yasam_gideri      numeric,  -- para_birimi cinsinden
  yasam_gideri_not        text,
  blokeli_hesap           numeric,  -- Almanya gibi ülkelerde vize şartı

  -- ── vize / dil ──
  vize_sureci             text,
  vize_maliyet            text,
  ogretim_dili_not        text,     -- "master İngilizce, günlük hayat Danca"

  -- ── süreç ──
  durum         text not null default 'arastiriliyor',
  oncelik       smallint not null default 2 check (oncelik between 1 and 3),
  elenme_sebebi text,               -- "devlet bursu yok + tam ücret"
  notlar        text,
  kaynak_link   text,
  etiketler     text[] not null default '{}',

  olusturma  timestamptz not null default now(),
  guncelleme timestamptz not null default now()
);

comment on table public.ulkeler is
  'Hedef ülkeler ve göç yolu bilgisi. Program değil ÜLKE seçimi burada kararlaşıyor.';

-- ────────────────────────────────────────────────────────────── üniversiteler
create table if not exists public.universiteler (
  id         uuid primary key default gen_random_uuid(),
  ad         text not null check (length(trim(ad)) > 0),
  ulke_kodu  text not null references public.ulkeler(kod) on delete restrict,
  sehir      text,
  tur        text,   -- 'devlet' | 'vakif' | 'ozel'

  -- ── sıralama ──
  qs_sirasi      integer,
  the_sirasi     integer,
  alan_sirasi    integer,   -- alan bazlı sıralama (istatistik, sosyoloji…)
  siralama_not   text,

  -- ── başvuru ──
  basvuru_platformu    text,     -- "Studielink", "DreamApply", "kendi portalı"
  basvuru_ucreti       numeric,
  basvuru_ucreti_para  text,
  depozito             numeric,  -- kabul sonrası peşin ödeme
  depozito_para        text,
  depozito_not         text,

  ogretim_dili   text[] not null default '{}',

  -- ── burs ──
  -- Ayrıntı burs uygulamasında; burada sadece "var mı, nereye bakılır".
  burs_var    boolean,
  burs_notu   text,
  burs_link   text,

  site_link      text,
  basvuru_link   text,

  durum      text not null default 'arastiriliyor',
  oncelik    smallint not null default 2 check (oncelik between 1 and 3),
  notlar     text,
  ham_metin  text,
  etiketler  text[] not null default '{}',

  olusturma  timestamptz not null default now(),
  guncelleme timestamptz not null default now(),

  -- Aynı üniversiteyi iki kez girmeyi engelle.
  unique (ad, ulke_kodu)
);

comment on table public.universiteler is
  'Üniversite katmanı. Şehir, sıralama, başvuru platformu ve ücretler o üniversitedeki BÜTÜN programlar için ortak — düz tabloda her programda tekrar yazılırdı.';

-- ───────────────────────────────────────────────────────────────── programlar
create table if not exists public.programlar (
  id             uuid primary key default gen_random_uuid(),
  ad             text not null check (length(trim(ad)) > 0),
  universite_id  uuid not null references public.universiteler(id) on delete cascade,
  bolum          text,     -- "Department of Sociology"
  derece         text,     -- MSc | MA | MEng | MASc
  alanlar        text[] not null default '{}',

  -- ── yapı ──
  sure_ay              integer,
  ects                 integer,
  -- Kanada'da finansman buna bağlı: tezli MASc fonlanır, ders bazlı MEng
  -- fonlanmaz (UofT: MEng CAD 68.670 vs MASc CAD 30.800).
  tezli                boolean,
  ogretim_dili         text,
  kampus               text,     -- 'yuz_yuze' | 'hibrit' | 'online'
  baslangic_donemleri  text[] not null default '{}',  -- ['guz','bahar']

  -- ── son tarih: BursTakip ile birebir aynı dört tipli yapı ──
  son_tarih_tipi      text not null default 'bilinmiyor'
                        check (son_tarih_tipi in ('kesin','aralik','surekli','bilinmiyor')),
  son_tarih           date,
  son_tarih_baslangic date,
  son_tarih_bitis     date,
  son_tarih_not       text,
  acilis_tarihi       date,

  -- ── başvuru turları ──
  -- Merkezî tek tarih yerine turlar varsa buraya. AB dışı / AB ayrımı KRİTİK:
  -- Danimarka'da AB dışı 15 Ocak, AB 15 Mart kapanıyor. Kullanıcı AB dışı.
  -- [{ad, son_tarih, kimin_icin, baslangic, sonuc_tarihi, not}]
  basvuru_turlari  jsonb not null default '[]'::jsonb,

  -- ── maliyet ──
  ogrenim_ucreti        numeric,
  para_birimi           text,
  ogrenim_ucreti_donem  text check (ogrenim_ucreti_donem in ('yillik','toplam','ects')),
  ucret_muafiyeti       boolean,   -- AB dışına muafiyet ihtimali var mı
  ucret_not             text,

  -- ── uygunluk kapısı ──
  -- Kullanıcı ELLE işaretler; otomatik hesaplanmıyor. Ön koşulun tutup
  -- tutmadığına ancak transkriptine bakarak karar verebilir.
  uygunluk        text not null default 'bilinmiyor'
                    check (uygunluk in ('uygun','supheli','uygun_degil','bilinmiyor')),
  uygunluk_not    text,
  on_kosullar     text[] not null default '{}',   -- ON_KOSULLAR kodları
  on_kosul_detay  text,
  dil_sarti       text,     -- "IELTS 6.5, her bölümden en az 6.0"
  not_ortalamasi  text,
  is_deneyimi     text,

  -- ── istenen belgeler ──
  belgeler     text[] not null default '{}',      -- BELGELER kodları
  belge_detay  text,

  -- ── rekabet ──
  kontenjan    integer check (kontenjan is null or kontenjan > 0),
  kabul_orani  text,
  rekabet_not  text,

  -- ── burs bağlantısı ──
  -- Burs uygulaması AYRI bir veritabanı; buraya sadece adları yazılıyor.
  ilgili_burslar  text[] not null default '{}',
  burs_notu       text,

  -- ── kariyer / göç ──
  mezun_istihdam  text,
  staj_zorunlu    boolean,
  kariyer_not     text,

  -- ── süreç ──
  durum         text not null default 'arastiriliyor',
  oncelik       smallint not null default 2 check (oncelik between 1 and 3),
  basvuru_link  text,
  kaynak_link   text,
  mufredat_link text,
  notlar        text,
  ham_metin     text,
  etiketler     text[] not null default '{}',

  olusturma  timestamptz not null default now(),
  guncelleme timestamptz not null default now(),

  -- Tarih alanları tipiyle tutarlı olmalı. Uygulama katmanı da doğruluyor
  -- ama veritabanı son sözü söylesin.
  constraint prg_son_tarih_tutarli check (
    case son_tarih_tipi
      when 'kesin'  then son_tarih is not null
                        and son_tarih_baslangic is null and son_tarih_bitis is null
      when 'aralik' then son_tarih is null
                        and (son_tarih_baslangic is not null or son_tarih_bitis is not null)
      else               son_tarih is null
                        and son_tarih_baslangic is null and son_tarih_bitis is null
    end
  ),
  constraint prg_aralik_sirali check (
    son_tarih_baslangic is null or son_tarih_bitis is null
    or son_tarih_baslangic <= son_tarih_bitis
  )
);

comment on table public.programlar is
  'BAŞVURU BİRİMİ. ulke_kodu buraya KOPYALANMIYOR — üniversiteden join ile geliyor; kopyalanan alan er geç sapar.';

-- ─────────────────────────────────────────── sonradan eklenen sütunlar (geçiş)
-- Yeni sütunları BURAYA ekle, indekslerden önce.

-- Aşama 7 (2026-08-31) — ŞARTNAMEDE EKSİKTİ.
-- PROJE.md §4.6 toplam maliyetten "ilgili burs (varsa, elle girilen tahmini
-- tutar)" düşülmesini istiyor ama §4.2'deki şemada sayısal bir burs alanı
-- yoktu; yalnızca `ilgili_burslar text[]` (isim listesi) ve `burs_notu` vardı.
-- İsimden tutar çıkarılamayacağı için iki sütun eklendi.
--
-- Para birimi AYRI: burs çoğu zaman öğrenim ücretinden farklı para biriminde
-- açıklanıyor (Danimarka programına Türkiye çıkışlı EUR bursu gibi).
alter table public.programlar add column if not exists burs_tahmini numeric;
alter table public.programlar add column if not exists burs_tahmini_para text;

create index if not exists universiteler_ulke_idx  on public.universiteler (ulke_kodu);
create index if not exists programlar_univ_idx     on public.programlar (universite_id);
create index if not exists programlar_durum_idx    on public.programlar (durum);
create index if not exists programlar_uygunluk_idx on public.programlar (uygunluk);
create index if not exists programlar_tarih_idx    on public.programlar (son_tarih);
create index if not exists programlar_belgeler_idx on public.programlar using gin (belgeler);
create index if not exists programlar_kosul_idx    on public.programlar using gin (on_kosullar);

-- ──────────────────────────────────────────── program bazlı belge durumu
create table if not exists public.program_belgeler (
  program_id  uuid not null references public.programlar(id) on delete cascade,
  belge_kodu  text not null,
  hazir       boolean not null default false,
  notlar      text,
  guncelleme  timestamptz not null default now(),
  primary key (program_id, belge_kodu)
);

create index if not exists program_belgeler_kod_idx on public.program_belgeler (belge_kodu);

-- ──────────────────────────────────────────────────────── kalıcı belge havuzu
create table if not exists public.havuz_belgeler (
  belge_kodu       text primary key,
  durum            text not null default 'yok' check (durum in ('yok','hazirlaniyor','hazir')),
  gecerlilik_bitis date,     -- IELTS/TOEFL 2 yıl geçerli
  notlar           text,
  guncelleme       timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────── ayarlar
--
-- ŞARTNAMEDE YOKTU, EKLENDİ. PROJE.md §4.6 kur oranları için "Kullanıcı Ayarlar
-- ekranından güncelleyebiliyor; değer veritabanında saklanıyor, kod dağıtımı
-- gerekmiyor" diyor ama §4.2'deki şemada bunu tutacak tablo yoktu. Aşama 7'de
-- şemayı yeniden açmak yerine buraya kondu.
--
-- Anahtar-değer, `jsonb`: kur tablosu tek satırda duruyor
-- ('kurlar' → {"EUR":1,"DKK":0.134,...}), ileride başka ayar gerekirse
-- yeni sütun değil yeni satır açılıyor.
create table if not exists public.ayarlar (
  anahtar    text primary key,
  deger      jsonb not null,
  guncelleme timestamptz not null default now()
);

-- ────────────────────────────────────────────── guncelleme damgası tetikleri
create or replace function public.damga_guncelle()
returns trigger language plpgsql as $$
begin new.guncelleme = now(); return new; end;
$$;

drop trigger if exists ulkeler_damga on public.ulkeler;
create trigger ulkeler_damga before update on public.ulkeler
  for each row execute function public.damga_guncelle();

drop trigger if exists universiteler_damga on public.universiteler;
create trigger universiteler_damga before update on public.universiteler
  for each row execute function public.damga_guncelle();

drop trigger if exists programlar_damga on public.programlar;
create trigger programlar_damga before update on public.programlar
  for each row execute function public.damga_guncelle();

drop trigger if exists program_belgeler_damga on public.program_belgeler;
create trigger program_belgeler_damga before update on public.program_belgeler
  for each row execute function public.damga_guncelle();

drop trigger if exists havuz_belgeler_damga on public.havuz_belgeler;
create trigger havuz_belgeler_damga before update on public.havuz_belgeler
  for each row execute function public.damga_guncelle();

drop trigger if exists ayarlar_damga on public.ayarlar;
create trigger ayarlar_damga before update on public.ayarlar
  for each row execute function public.damga_guncelle();

-- ── Kurulum sonrası kontrol ────────────────────────────────────────────────
--   select table_name from information_schema.tables
--    where table_schema = 'public' order by table_name;
--   → ayarlar, havuz_belgeler, program_belgeler, programlar, ulkeler, universiteler
