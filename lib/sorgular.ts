import 'server-only'
import { db } from './veritabani'
import type {
  Ulke, UlkeGirdi,
  Universite, UniversiteGenis, UniversiteGirdi,
  Program, ProgramGenis, ProgramGirdi,
  ProgramBelge, HavuzBelge, HavuzDurum,
} from './tipler'

/**
 * Veri erişim katmanı. Veritabanına giden TEK yol burasıdır.
 *
 * Sayfalar ve server action'lar SQL bilmez; buradaki fonksiyonları çağırır.
 * `server-only` içe aktarımı, bu modülün yanlışlıkla bir istemci bileşenine
 * sızması hâlinde derlemeyi hata verdirir.
 *
 * ── SORGU BİÇİMİ ──────────────────────────────────────────────────────────
 * İki yol var, ikisi de parametreli:
 *  - Etiketli şablon (`sql`…${deger}…`) — sabit biçimli sorgular için.
 *  - `sql.query(metin, degerler)` — sütun sayısı çok olan ekleme/güncelleme
 *    için. Sütun adları BU DOSYADAKİ sabit dizilerden geliyor, kullanıcı
 *    girdisinden değil; değerler her zaman $1/$2 parametresi. Dizge
 *    birleştirerek sorgu kurma.
 */

/* ═══════════════════════════════════════════════════════════ hata çevirisi */

type PgHata = { code?: string; message?: string; detail?: string; constraint?: string }

/**
 * Postgres hata kodlarını anlaşılır Türkçeye çevir.
 *
 * `islem` ZATEN olumsuz bir cümle ("Üniversite kaydedilemedi"), o yüzden
 * sonuna "başarısız" eklenmiyor — ilk yazımda ekleniyordu ve kullanıcı
 * "Üniversite kaydedilemedi başarısız: …" gibi bozuk bir cümle görüyordu.
 *
 * Postgres'in kendi `detail` metni İngilizce; yaygın kodlarda kullanıcıya
 * onun yerine Türkçe açıklama veriliyor, SQLSTATE kodu ise parantez içinde
 * kalıyor — arama yapmak gerekirse elde tek tutamak o.
 */
function hata(islem: string, e: unknown): never {
  const p = e as PgHata
  const kod = p?.code ? ` (${p.code})` : ''

  if (p?.code === '42P01') {
    throw new Error(
      `${islem}: tablo bulunamadı${kod}. Şemayı uygulamadın — "npm run sema" çalıştır.`,
    )
  }
  if (p?.code === '23505') {
    // Şemadaki tek benzersizlik kısıtı `universiteler (ad, ulke_kodu)`.
    if (p.constraint?.includes('universiteler') || p.detail?.includes('ulke_kodu')) {
      throw new Error(
        `${islem}: bu ülkede aynı adla kayıtlı bir üniversite zaten var${kod}. ` +
        'Var olanı düzenle ya da adı ayırt edici hâle getir (ör. kampüs adını ekle).',
      )
    }
    throw new Error(`${islem}: bu kayıt zaten var${kod}.`)
  }
  /*
   * İKİ AYRI KOD, iki ayrı durum — ilkini atlamak kolay:
   *
   *  23001 restrict_violation      → `on delete restrict` engelledi. Silmeye
   *                                  çalıştığın satıra BAĞLI kayıt var.
   *  23503 foreign_key_violation   → gösterdiğin hedef satır YOK (ör. silinmiş
   *                                  bir üniversiteye program eklemek).
   *
   * `npm run sina` bunu yakaladı: yalnızca 23503 eşlenmişti ve ülke silme
   * denemesi ham İngilizce Postgres mesajıyla dönüyordu.
   */
  if (p?.code === '23001') {
    throw new Error(
      `${islem}: bu kayda bağlı başka kayıtlar var${kod}. ` +
      'Ülkeyi silmek için önce altındaki üniversiteleri sil ya da başka ülkeye taşı.',
    )
  }
  if (p?.code === '23503') {
    throw new Error(
      `${islem}: gösterilen kayıt bulunamadı${kod}. ` +
      'Seçtiğin üniversite ya da ülke bu arada silinmiş olabilir — sayfayı yenile.',
    )
  }
  if (p?.code === '23514') {
    const c = p.constraint ?? ''
    if (c.startsWith('prg_son_tarih')) {
      throw new Error(
        `${islem}: son tarih alanları seçilen tiple uyuşmuyor${kod}. ` +
        '"Kesin tarih" seçtiysen günü gir; "Sürekli açık"ta hiçbir tarih olmamalı.',
      )
    }
    throw new Error(`${islem}: değer kısıtı ihlal edildi${kod}${c ? ` — ${c}` : ''}.`)
  }
  throw new Error(`${islem}: ${p?.message ?? 'bilinmeyen hata'}${kod}`)
}

/* ══════════════════════════════════════════════ yazılabilir sütun listeleri */

/**
 * Bu diziler SQL'e doğrudan gömülüyor, o yüzden ASLA kullanıcı girdisinden
 * türetilmemeli. Şemaya sütun eklerken buraya da ekle — yoksa alan sessizce
 * kaydedilmez. (`npm run dogrula` alan kapsamasını detay sayfası tarafından
 * kontrol ediyor, ama yazma yolunu değil.)
 */
const ULKE_SUTUNLARI = [
  'kod', 'ad',
  'mezuniyet_sonrasi_izin', 'mezuniyet_sonrasi_ay', 'oturum_yolu', 'oturum_yil',
  'oturum_dil_sarti', 'vatandaslik_yil', 'cifte_vatandaslik', 'mulk_kisiti',
  'ogrenci_calisma', 'donus_yukumlulugu',
  'para_birimi', 'aylik_yasam_gideri', 'yasam_gideri_not', 'blokeli_hesap',
  'vize_sureci', 'vize_maliyet', 'ogretim_dili_not',
  'durum', 'oncelik', 'elenme_sebebi', 'notlar', 'kaynak_link', 'etiketler',
] as const

const UNIVERSITE_SUTUNLARI = [
  'ad', 'ulke_kodu', 'sehir', 'tur',
  'qs_sirasi', 'the_sirasi', 'alan_sirasi', 'siralama_not',
  'basvuru_platformu', 'basvuru_ucreti', 'basvuru_ucreti_para',
  'depozito', 'depozito_para', 'depozito_not',
  'ogretim_dili',
  'burs_var', 'burs_notu', 'burs_link',
  'site_link', 'basvuru_link',
  'durum', 'oncelik', 'notlar', 'ham_metin', 'etiketler',
] as const

const PROGRAM_SUTUNLARI = [
  'ad', 'universite_id', 'bolum', 'derece', 'alanlar',
  'sure_ay', 'ects', 'tezli', 'ogretim_dili', 'kampus', 'baslangic_donemleri',
  'son_tarih_tipi', 'son_tarih', 'son_tarih_baslangic', 'son_tarih_bitis',
  'son_tarih_not', 'acilis_tarihi', 'basvuru_turlari',
  'ogrenim_ucreti', 'para_birimi', 'ogrenim_ucreti_donem', 'ucret_muafiyeti', 'ucret_not',
  'uygunluk', 'uygunluk_not', 'on_kosullar', 'on_kosul_detay',
  'dil_sarti', 'not_ortalamasi', 'is_deneyimi',
  'belgeler', 'belge_detay',
  'kontenjan', 'kabul_orani', 'rekabet_not',
  'ilgili_burslar', 'burs_notu', 'burs_tahmini', 'burs_tahmini_para',
  'mezun_istihdam', 'staj_zorunlu', 'kariyer_not',
  'durum', 'oncelik', 'basvuru_link', 'kaynak_link', 'mufredat_link',
  'notlar', 'ham_metin', 'etiketler',
] as const

/**
 * `jsonb` sütunları — parametre olarak JSON DİZGESİ gitmeli.
 *
 * Buraya yazılmazsa sürücü JS dizisini Postgres DİZİSİ sanıp `text[]`
 * biçiminde göndermeye çalışır ve `basvuru_turlari` sessizce bozulur.
 */
const JSONB_SUTUNLAR = new Set(['basvuru_turlari', 'deger'])

function parametre(sutun: string, deger: unknown): unknown {
  if (JSONB_SUTUNLAR.has(sutun)) return JSON.stringify(deger ?? null)
  return deger ?? null
}

function degerleriTopla(sutunlar: readonly string[], veri: Record<string, unknown>): unknown[] {
  return sutunlar.map((s) => parametre(s, veri[s]))
}

/* ═══════════════════════════════════════════════════════════════════ ülkeler */

export async function ulkeleriGetir(): Promise<Ulke[]> {
  try {
    return (await db()`select * from public.ulkeler order by oncelik asc, ad asc`) as Ulke[]
  } catch (e) { hata('Ülkeler okunamadı', e) }
}

export async function ulkeGetir(kod: string): Promise<Ulke | null> {
  try {
    const r = (await db()`select * from public.ulkeler where kod = ${kod}`) as Ulke[]
    return r[0] ?? null
  } catch (e) { hata('Ülke okunamadı', e) }
}

/**
 * Ülke ekle ya da güncelle.
 *
 * Birincil anahtar kullanıcı tarafından seçilen ISO kodu olduğu için tek bir
 * upsert yeterli — "önce var mı diye bak, sonra ekle/güncelle" yarışı yok.
 */
export async function ulkeKaydet(veri: UlkeGirdi): Promise<string> {
  const s = ULKE_SUTUNLARI
  const yer = s.map((_, i) => `$${i + 1}`).join(', ')
  const guncel = s.filter((x) => x !== 'kod').map((x) => `${x} = excluded.${x}`).join(', ')
  try {
    await db().query(
      `insert into public.ulkeler (${s.join(', ')}) values (${yer})
         on conflict (kod) do update set ${guncel}`,
      degerleriTopla(s, veri as unknown as Record<string, unknown>),
    )
    return veri.kod
  } catch (e) { hata('Ülke kaydedilemedi', e) }
}

/** Tek alan güncelleme — listeden/detaydan durum ya da öncelik değiştirmek için. */
export async function ulkeAlanGuncelle(
  kod: string,
  alan: 'durum' | 'oncelik',
  deger: string | number,
): Promise<void> {
  try {
    // `alan` birleşim tipiyle sınırlı, serbest metin değil — gömülmesi güvenli.
    await db().query(`update public.ulkeler set ${alan} = $1 where kod = $2`, [deger, kod])
  } catch (e) { hata('Ülke güncellenemedi', e) }
}

export async function ulkeSil(kod: string): Promise<void> {
  try {
    // Altında üniversite varsa `on delete restrict` engelliyor; hata mesajı
    // hata() içinde anlaşılır hâle getiriliyor.
    await db()`delete from public.ulkeler where kod = ${kod}`
  } catch (e) { hata('Ülke silinemedi', e) }
}

/* ═════════════════════════════════════════════════════════════ üniversiteler */

/** Üniversite + ülkesi + altındaki program sayısı. */
const UNIVERSITE_GENIS = `
  select u.*,
         case when k.kod is null then null else jsonb_build_object(
           'kod', k.kod, 'ad', k.ad,
           'para_birimi', k.para_birimi, 'aylik_yasam_gideri', k.aylik_yasam_gideri,
           'mezuniyet_sonrasi_izin', k.mezuniyet_sonrasi_izin,
           'mezuniyet_sonrasi_ay', k.mezuniyet_sonrasi_ay) end as ulke,
         (select count(*)::int from public.programlar p where p.universite_id = u.id)
           as program_sayisi
    from public.universiteler u
    left join public.ulkeler k on k.kod = u.ulke_kodu`

export async function universiteleriGetir(): Promise<UniversiteGenis[]> {
  try {
    return (await db().query(
      `${UNIVERSITE_GENIS} order by u.oncelik asc, u.ad asc`,
    )) as UniversiteGenis[]
  } catch (e) { hata('Üniversiteler okunamadı', e) }
}

/** Ülke detay sayfasındaki "bu ülkedeki üniversiteler" listesi. */
export async function ulkeninUniversiteleri(kod: string): Promise<UniversiteGenis[]> {
  try {
    return (await db().query(
      `${UNIVERSITE_GENIS} where u.ulke_kodu = $1 order by u.oncelik asc, u.ad asc`,
      [kod],
    )) as UniversiteGenis[]
  } catch (e) { hata('Ülkenin üniversiteleri okunamadı', e) }
}

export async function universiteGetir(id: string): Promise<UniversiteGenis | null> {
  try {
    const r = (await db().query(`${UNIVERSITE_GENIS} where u.id = $1`, [id])) as UniversiteGenis[]
    return r[0] ?? null
  } catch (e) { hata('Üniversite okunamadı', e) }
}

/** Program formundaki açılır liste — tam kayıt çekmeye gerek yok. */
export async function universiteSecenekleri(): Promise<
  Pick<Universite, 'id' | 'ad' | 'ulke_kodu' | 'sehir'>[]
> {
  try {
    return (await db()`
      select id, ad, ulke_kodu, sehir from public.universiteler order by ad asc
    `) as Pick<Universite, 'id' | 'ad' | 'ulke_kodu' | 'sehir'>[]
  } catch (e) { hata('Üniversite listesi okunamadı', e) }
}

export async function universiteEkle(veri: UniversiteGirdi): Promise<string> {
  const s = UNIVERSITE_SUTUNLARI
  const yer = s.map((_, i) => `$${i + 1}`).join(', ')
  try {
    const r = (await db().query(
      `insert into public.universiteler (${s.join(', ')}) values (${yer}) returning id`,
      degerleriTopla(s, veri as unknown as Record<string, unknown>),
    )) as { id: string }[]
    return r[0].id
  } catch (e) { hata('Üniversite kaydedilemedi', e) }
}

export async function universiteGuncelle(id: string, veri: UniversiteGirdi): Promise<void> {
  const s = UNIVERSITE_SUTUNLARI
  const set = s.map((x, i) => `${x} = $${i + 1}`).join(', ')
  try {
    await db().query(
      `update public.universiteler set ${set} where id = $${s.length + 1}`,
      [...degerleriTopla(s, veri as unknown as Record<string, unknown>), id],
    )
  } catch (e) { hata('Üniversite güncellenemedi', e) }
}

/** Tek alan güncelleme — listeden/detaydan durum ya da öncelik değiştirmek için. */
export async function universiteAlanGuncelle(
  id: string,
  alan: 'durum' | 'oncelik',
  deger: string | number,
): Promise<void> {
  try {
    // `alan` birleşim tipiyle sınırlı, serbest metin değil — gömülmesi güvenli.
    await db().query(`update public.universiteler set ${alan} = $1 where id = $2`, [deger, id])
  } catch (e) { hata('Üniversite güncellenemedi', e) }
}

export async function universiteSil(id: string): Promise<void> {
  try {
    // Altındaki programlar ON DELETE CASCADE ile birlikte gider.
    await db()`delete from public.universiteler where id = ${id}`
  } catch (e) { hata('Üniversite silinemedi', e) }
}

/* ══════════════════════════════════════════════════════════════ programlar */

/**
 * Program + üniversitesi.
 *
 * `ulke_kodu` programlar tablosuna KOPYALANMIYOR (PROJE.md §4.1); kartta
 * gereken üniversite alanları burada tek sorguda geliyor, liste N+1 istek
 * atmıyor.
 */
const PROGRAM_GENIS = `
  select p.*,
         jsonb_build_object(
           'id', u.id, 'ad', u.ad, 'ulke_kodu', u.ulke_kodu, 'sehir', u.sehir,
           'tur', u.tur,
           'qs_sirasi', u.qs_sirasi, 'the_sirasi', u.the_sirasi,
           'alan_sirasi', u.alan_sirasi,
           'basvuru_platformu', u.basvuru_platformu,
           'basvuru_ucreti', u.basvuru_ucreti, 'basvuru_ucreti_para', u.basvuru_ucreti_para,
           'depozito', u.depozito, 'depozito_para', u.depozito_para,
           'site_link', u.site_link) as universite,
         case when k.kod is null then null else jsonb_build_object(
           'kod', k.kod, 'ad', k.ad,
           'para_birimi', k.para_birimi,
           'aylik_yasam_gideri', k.aylik_yasam_gideri) end as ulke
    from public.programlar p
    join public.universiteler u on u.id = p.universite_id
    left join public.ulkeler k on k.kod = u.ulke_kodu`

export async function programlariGetir(): Promise<ProgramGenis[]> {
  try {
    return (await db().query(
      `${PROGRAM_GENIS} order by p.olusturma desc`,
    )) as ProgramGenis[]
  } catch (e) { hata('Programlar okunamadı', e) }
}

export async function programGetir(id: string): Promise<ProgramGenis | null> {
  try {
    const r = (await db().query(`${PROGRAM_GENIS} where p.id = $1`, [id])) as ProgramGenis[]
    return r[0] ?? null
  } catch (e) { hata('Program okunamadı', e) }
}

/** Üniversite detay sayfasındaki program listesi. */
export async function universiteninProgramlari(universiteId: string): Promise<Program[]> {
  try {
    return (await db()`
      select * from public.programlar
       where universite_id = ${universiteId}
       order by oncelik asc, ad asc
    `) as Program[]
  } catch (e) { hata('Üniversitenin programları okunamadı', e) }
}

export async function programEkle(veri: ProgramGirdi): Promise<string> {
  const s = PROGRAM_SUTUNLARI
  const yer = s.map((_, i) => `$${i + 1}`).join(', ')
  try {
    const r = (await db().query(
      `insert into public.programlar (${s.join(', ')}) values (${yer}) returning id`,
      degerleriTopla(s, veri as unknown as Record<string, unknown>),
    )) as { id: string }[]
    return r[0].id
  } catch (e) { hata('Program kaydedilemedi', e) }
}

export async function programGuncelle(id: string, veri: ProgramGirdi): Promise<void> {
  const s = PROGRAM_SUTUNLARI
  const set = s.map((x, i) => `${x} = $${i + 1}`).join(', ')
  try {
    await db().query(
      `update public.programlar set ${set} where id = $${s.length + 1}`,
      [...degerleriTopla(s, veri as unknown as Record<string, unknown>), id],
    )
  } catch (e) { hata('Program güncellenemedi', e) }
}

/** Tek alan güncelleme — liste üzerinden durum/öncelik/uygunluk değiştirmek için. */
export async function programAlanGuncelle(
  id: string,
  alan: 'durum' | 'oncelik' | 'uygunluk',
  deger: string | number,
): Promise<void> {
  try {
    // `alan` birleşim tipiyle sınırlı, serbest metin değil — SQL'e gömülmesi güvenli.
    await db().query(`update public.programlar set ${alan} = $1 where id = $2`, [deger, id])
  } catch (e) { hata('Program güncellenemedi', e) }
}

export async function programSil(id: string): Promise<void> {
  try {
    // program_belgeler satırları ON DELETE CASCADE ile birlikte gider.
    await db()`delete from public.programlar where id = ${id}`
  } catch (e) { hata('Program silinemedi', e) }
}

/* ═════════════════════════════════════════════════════ program bazlı belgeler */

export async function programBelgeleriGetir(programId?: string): Promise<ProgramBelge[]> {
  try {
    return (programId
      ? await db()`select * from public.program_belgeler where program_id = ${programId}`
      : await db()`select * from public.program_belgeler`) as ProgramBelge[]
  } catch (e) { hata('Belge durumları okunamadı', e) }
}

export async function programBelgeIsaretle(
  programId: string,
  belgeKodu: string,
  hazir: boolean,
  notlar?: string | null,
): Promise<void> {
  try {
    await db()`
      insert into public.program_belgeler (program_id, belge_kodu, hazir, notlar)
      values (${programId}, ${belgeKodu}, ${hazir}, ${notlar ?? null})
      on conflict (program_id, belge_kodu)
      do update set hazir = excluded.hazir, notlar = excluded.notlar, guncelleme = now()
    `
  } catch (e) { hata('Belge işaretlenemedi', e) }
}

/**
 * Program kaydından çıkarılan belgelerin durum satırlarını da temizle.
 *
 * Yoksa listeden kaldırılan bir belge veritabanında öksüz kalır ve ileride
 * yeniden eklendiğinde eski "hazır" işareti hayalet gibi geri gelir.
 */
export async function programBelgeleriniEsitle(
  programId: string,
  gecerliKodlar: string[],
): Promise<void> {
  try {
    if (gecerliKodlar.length === 0) {
      await db()`delete from public.program_belgeler where program_id = ${programId}`
      return
    }
    await db()`
      delete from public.program_belgeler
       where program_id = ${programId}
         and belge_kodu <> all(${gecerliKodlar}::text[])
    `
  } catch (e) { hata('Belge durumları temizlenemedi', e) }
}

/* ═══════════════════════════════════════════════════════════════ belge havuzu */

export async function havuzGetir(): Promise<HavuzBelge[]> {
  try {
    return (await db()`select * from public.havuz_belgeler`) as HavuzBelge[]
  } catch (e) { hata('Belge havuzu okunamadı', e) }
}

export async function havuzGuncelle(
  belgeKodu: string,
  durum: HavuzDurum,
  gecerlilikBitis: string | null,
  notlar: string | null,
): Promise<void> {
  try {
    await db()`
      insert into public.havuz_belgeler (belge_kodu, durum, gecerlilik_bitis, notlar)
      values (${belgeKodu}, ${durum}, ${gecerlilikBitis}, ${notlar})
      on conflict (belge_kodu) do update set
        durum = excluded.durum,
        gecerlilik_bitis = excluded.gecerlilik_bitis,
        notlar = excluded.notlar,
        guncelleme = now()
    `
  } catch (e) { hata('Belge havuzu güncellenemedi', e) }
}

/* ═══════════════════════════════════════════════════════════════════ ayarlar */

/**
 * Anahtar-değer ayarlar (şu an yalnızca kur tablosu, PROJE.md §4.6).
 *
 * Kod dağıtımı gerektirmeden değişebilmesi için veritabanında; Ayarlar
 * ekranından güncelleniyor.
 */
export async function ayarGetir<T>(anahtar: string): Promise<T | null> {
  try {
    const r = (await db()`
      select deger from public.ayarlar where anahtar = ${anahtar}
    `) as { deger: T }[]
    return r[0]?.deger ?? null
  } catch (e) { hata('Ayar okunamadı', e) }
}

export async function ayarKaydet(anahtar: string, deger: unknown): Promise<void> {
  try {
    await db()`
      insert into public.ayarlar (anahtar, deger)
      values (${anahtar}, ${JSON.stringify(deger)}::jsonb)
      on conflict (anahtar) do update set deger = excluded.deger, guncelleme = now()
    `
  } catch (e) { hata('Ayar kaydedilemedi', e) }
}

/* ══════════════════════════════════════════════════════════════ yedekleme */

export type Yedek = {
  surum: 1
  tarih: string
  ulkeler: Ulke[]
  universiteler: Universite[]
  programlar: Program[]
  program_belgeler: ProgramBelge[]
  havuz_belgeler: HavuzBelge[]
  ayarlar: { anahtar: string; deger: unknown }[]
}

export async function yedekAl(): Promise<Yedek> {
  try {
    const [ulkeler, universiteler, programlar, belgeler, havuz, ayarlar] = await Promise.all([
      db()`select * from public.ulkeler order by kod`,
      db()`select * from public.universiteler order by ad`,
      db()`select * from public.programlar order by olusturma`,
      db()`select * from public.program_belgeler`,
      db()`select * from public.havuz_belgeler`,
      db()`select anahtar, deger from public.ayarlar`,
    ])
    return {
      surum: 1,
      tarih: new Date().toISOString(),
      ulkeler: ulkeler as Ulke[],
      universiteler: universiteler as Universite[],
      programlar: programlar as Program[],
      program_belgeler: belgeler as ProgramBelge[],
      havuz_belgeler: havuz as HavuzBelge[],
      ayarlar: ayarlar as { anahtar: string; deger: unknown }[],
    }
  } catch (e) { hata('Yedek alınamadı', e) }
}

/**
 * Yedekten geri yükle.
 *
 * `temizle` false ise mevcut kayıtların ÜSTÜNE yazar (aynı id varsa
 * günceller, yoksa ekler) — iki cihazda ayrı ayrı çalıştıysan birleştirir.
 * true ise önce her şeyi siler — "bu yedeğe dön" davranışı.
 *
 * SIRA ÖNEMLİ: ülkeler → üniversiteler → programlar. Yabancı anahtarlar
 * yüzünden tersi çalışmaz; silerken de ters sırayla gidiliyor.
 */
export async function yedektenYukle(
  yedek: Yedek,
  temizle: boolean,
): Promise<{ ulke: number; universite: number; program: number; belge: number; havuz: number }> {
  const sql = db()
  try {
    if (temizle) {
      // programlar → universiteler → ulkeler; cascade olsa da açıkça yazılıyor
      // ki sıra bir gün cascade değişirse de doğru kalsın.
      await sql`delete from public.programlar`
      await sql`delete from public.universiteler`
      await sql`delete from public.ulkeler`
      await sql`delete from public.havuz_belgeler`
    }

    for (const u of yedek.ulkeler ?? []) {
      await ulkeKaydet(u as unknown as UlkeGirdi)
    }

    const uniSut = ['id', ...UNIVERSITE_SUTUNLARI] as const
    for (const u of yedek.universiteler ?? []) {
      const yer = uniSut.map((_, i) => `$${i + 1}`).join(', ')
      const guncel = uniSut.filter((x) => x !== 'id').map((x) => `${x} = excluded.${x}`).join(', ')
      await sql.query(
        `insert into public.universiteler (${uniSut.join(', ')}) values (${yer})
           on conflict (id) do update set ${guncel}`,
        degerleriTopla(uniSut, u as unknown as Record<string, unknown>),
      )
    }

    const prgSut = ['id', ...PROGRAM_SUTUNLARI] as const
    for (const p of yedek.programlar ?? []) {
      const yer = prgSut.map((_, i) => `$${i + 1}`).join(', ')
      const guncel = prgSut.filter((x) => x !== 'id').map((x) => `${x} = excluded.${x}`).join(', ')
      await sql.query(
        `insert into public.programlar (${prgSut.join(', ')}) values (${yer})
           on conflict (id) do update set ${guncel}`,
        degerleriTopla(prgSut, p as unknown as Record<string, unknown>),
      )
    }

    for (const b of yedek.program_belgeler ?? []) {
      await programBelgeIsaretle(b.program_id, b.belge_kodu, b.hazir, b.notlar)
    }
    for (const h of yedek.havuz_belgeler ?? []) {
      await havuzGuncelle(h.belge_kodu, h.durum, h.gecerlilik_bitis, h.notlar)
    }
    for (const a of yedek.ayarlar ?? []) {
      await ayarKaydet(a.anahtar, a.deger)
    }

    return {
      ulke: yedek.ulkeler?.length ?? 0,
      universite: yedek.universiteler?.length ?? 0,
      program: yedek.programlar?.length ?? 0,
      belge: yedek.program_belgeler?.length ?? 0,
      havuz: yedek.havuz_belgeler?.length ?? 0,
    }
  } catch (e) { hata('Yedek geri yüklenemedi', e) }
}

/* ═════════════════════════════════════════════════════════ bağlantı sınama */

/** Ayarlar sayfasındaki "Bağlantıyı sına" düğmesi. */
export async function baglantiSina(): Promise<{ tamam: boolean; mesaj: string }> {
  try {
    const r = (await db()`
      select (select count(*)::int from public.ulkeler)        as ulke,
             (select count(*)::int from public.universiteler)  as universite,
             (select count(*)::int from public.programlar)     as program
    `) as { ulke: number; universite: number; program: number }[]

    const { ulke, universite, program } = r[0]
    return {
      tamam: true,
      mesaj: `Bağlantı çalışıyor. ${ulke} ülke, ${universite} üniversite, ${program} program kayıtlı.`,
    }
  } catch (e) {
    const p = e as PgHata
    if (p?.code === '42P01') {
      return {
        tamam: false,
        mesaj: 'Bağlantı kuruldu ama tablolar yok. Terminalde "npm run sema" çalıştır.',
      }
    }
    return { tamam: false, mesaj: p?.message ?? 'Bilinmeyen hata' }
  }
}
