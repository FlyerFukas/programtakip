/**
 * Bağlantı ve veri katmanı duman testi.
 *
 *   npm run sina
 *
 * NEDEN VAR: PROJE.md §8.3'teki bağlantı testi yalnızca "sunucu cevap veriyor
 * mu" diyordu. Asıl kırılgan yer orası değil, TİP DÖNÜŞÜMLERİ:
 *
 *  - `numeric` sürücünün varsayılanında DİZGE gelir. Fark edilmezse
 *    "40000" > "9000" karşılaştırması alfabetik yapılır ve 40.000 EUR'luk
 *    program 9.000'likten ucuz görünür.
 *  - `date` varsayılanda `Date` nesnesine çevrilir ve saat dilimi yüzünden
 *    bir gün geri kayabilir.
 *  - `jsonb` alanına JS dizisi doğrudan verilirse sürücü onu Postgres
 *    DİZİSİ sanar ve `basvuru_turlari` sessizce bozulur.
 *
 * Üçü de `lib/veritabani.ts` içinde ayarlandı; bu betik ayarların gerçekten
 * tuttuğunu kanıtlıyor. Sürücü sürümü yükseltildiğinde tekrar çalıştır.
 *
 * GÜVENLİ: yalnızca 'ZZ' ülke koduyla kendi yarattığı satırlara dokunur,
 * başta ve sonda temizler. Gerçek veriyi görmez.
 */

import {
  ulkeKaydet, ulkeSil, ulkeGetir,
  universiteEkle, universiteGetir,
  programEkle, programGetir, programlariGetir,
  programBelgeIsaretle, programBelgeleriGetir, programBelgeleriniEsitle,
  havuzGuncelle, havuzGetir,
  ayarKaydet, ayarGetir,
  baglantiSina,
} from '../lib/sorgular'
import type { UlkeGirdi, UniversiteGirdi, ProgramGirdi } from '../lib/tipler'

const DENEME_ULKE = 'ZZ'

let gecti = 0
let kaldi = 0

function kontrol(ad: string, kosul: boolean, ayrinti = ''): void {
  if (kosul) { gecti++; console.log(`    ✓ ${ad}`) }
  else { kaldi++; console.log(`    ✗ ${ad}${ayrinti ? ` — ${ayrinti}` : ''}`) }
}

async function temizle(): Promise<void> {
  // universiteler ON DELETE restrict, programlar ON DELETE cascade.
  // Önce üniversiteleri sil ki ülke silinebilsin.
  const { db } = await import('../lib/veritabani')
  await db()`delete from public.universiteler where ulke_kodu = ${DENEME_ULKE}`
  await ulkeSil(DENEME_ULKE).catch(() => {})
  await havuzGuncelle('__deneme__', 'yok', null, null).catch(() => {})
  const { db: d2 } = await import('../lib/veritabani')
  await d2()`delete from public.havuz_belgeler where belge_kodu = '__deneme__'`
  await d2()`delete from public.ayarlar where anahtar = '__deneme__'`
}

console.log('\n═══ Bağlantı ve veri katmanı sınaması ═══\n')

const ilk = await baglantiSina()
console.log(`  ${ilk.tamam ? '✓' : '✗'} ${ilk.mesaj}\n`)
if (!ilk.tamam) process.exit(1)

await temizle()

try {
  /* ─────────────────────────────────────────────────────────────── ülke */
  console.log('  Ülke katmanı')
  const ulkeGirdi: UlkeGirdi = {
    kod: DENEME_ULKE, ad: 'Deneme Ülkesi',
    mezuniyet_sonrasi_izin: 'deneme izni', mezuniyet_sonrasi_ay: 36,
    oturum_yolu: null, oturum_yil: 5.5, oturum_dil_sarti: null,
    vatandaslik_yil: 10, cifte_vatandaslik: false,
    mulk_kisiti: null, ogrenci_calisma: null, donus_yukumlulugu: null,
    para_birimi: 'EUR', aylik_yasam_gideri: 1234.56, yasam_gideri_not: null,
    blokeli_hesap: null, vize_sureci: null, vize_maliyet: null,
    ogretim_dili_not: null,
    durum: 'arastiriliyor', oncelik: 1, elenme_sebebi: null, notlar: null,
    kaynak_link: null, etiketler: ['deneme', 'gecici'],
  }
  await ulkeKaydet(ulkeGirdi)
  const u = await ulkeGetir(DENEME_ULKE)

  kontrol('kayıt geri okundu', u !== null)
  kontrol('numeric → number (aylik_yasam_gideri)',
    typeof u?.aylik_yasam_gideri === 'number' && u.aylik_yasam_gideri === 1234.56,
    `gelen: ${typeof u?.aylik_yasam_gideri} ${u?.aylik_yasam_gideri}`)
  kontrol('numeric ondalık korundu (oturum_yil 5.5)', u?.oturum_yil === 5.5,
    `gelen: ${u?.oturum_yil}`)
  kontrol('integer → number (mezuniyet_sonrasi_ay)', u?.mezuniyet_sonrasi_ay === 36)
  kontrol('boolean false null\'a düşmedi', u?.cifte_vatandaslik === false,
    `gelen: ${u?.cifte_vatandaslik}`)
  kontrol('text[] → dizi', Array.isArray(u?.etiketler) && u!.etiketler.length === 2,
    `gelen: ${JSON.stringify(u?.etiketler)}`)
  kontrol('timestamptz → ISO dizge',
    typeof u?.olusturma === 'string' && u.olusturma.includes('T') && u.olusturma.endsWith('Z'),
    `gelen: ${u?.olusturma}`)

  // Upsert: aynı kodla ikinci kez kaydet, güncellemeli.
  await ulkeKaydet({ ...ulkeGirdi, ad: 'Deneme Ülkesi 2', oncelik: 3 })
  const u2 = await ulkeGetir(DENEME_ULKE)
  kontrol('upsert güncelledi (yeni satır açmadı)', u2?.ad === 'Deneme Ülkesi 2' && u2?.oncelik === 3)

  /* ───────────────────────────────────────────────────────── üniversite */
  console.log('\n  Üniversite katmanı')
  const uniGirdi: UniversiteGirdi = {
    ad: 'Deneme Üniversitesi', ulke_kodu: DENEME_ULKE, sehir: 'Deneme', tur: 'devlet',
    qs_sirasi: 120, the_sirasi: null, alan_sirasi: 45, siralama_not: null,
    basvuru_platformu: 'Studielink', basvuru_ucreti: 100, basvuru_ucreti_para: 'EUR',
    depozito: 2500.75, depozito_para: 'EUR', depozito_not: null,
    ogretim_dili: ['İngilizce', 'Hollandaca'],
    burs_var: true, burs_notu: null, burs_link: null,
    site_link: null, basvuru_link: null,
    durum: 'arastiriliyor', oncelik: 2, notlar: null, ham_metin: null, etiketler: [],
  }
  const uniId = await universiteEkle(uniGirdi)
  const uni = await universiteGetir(uniId)

  kontrol('üniversite eklendi ve okundu', uni !== null)
  kontrol('ülke gömülü geldi', uni?.ulke?.kod === DENEME_ULKE, JSON.stringify(uni?.ulke))
  kontrol('gömülü numeric sayı kaldı',
    typeof uni?.ulke?.aylik_yasam_gideri === 'number',
    `gelen: ${typeof uni?.ulke?.aylik_yasam_gideri}`)
  kontrol('program sayısı 0', uni?.program_sayisi === 0, `gelen: ${uni?.program_sayisi}`)
  kontrol('depozito ondalık korundu', uni?.depozito === 2500.75, `gelen: ${uni?.depozito}`)

  /* ─────────────────────────────────────────────────────────── program */
  console.log('\n  Program katmanı')
  const prgGirdi: ProgramGirdi = {
    ad: 'Deneme MSc', universite_id: uniId, bolum: 'Sosyoloji', derece: 'MSc',
    alanlar: ['demografi', 'göç'],
    sure_ay: 24, ects: 120, tezli: true, ogretim_dili: 'İngilizce',
    kampus: 'yuz_yuze', baslangic_donemleri: ['guz'],
    son_tarih_tipi: 'kesin', son_tarih: '2027-01-15',
    son_tarih_baslangic: null, son_tarih_bitis: null,
    son_tarih_not: null, acilis_tarihi: '2026-10-01',
    basvuru_turlari: [
      { ad: 'Tur 1 — AB dışı', son_tarih: '2027-01-15', kimin_icin: 'ab_disi',
        baslangic: '2027 Güz', sonuc_tarihi: '2027-03-01', not: null },
      { ad: 'Tur 2 — AB', son_tarih: '2027-03-15', kimin_icin: 'ab',
        baslangic: '2027 Güz', sonuc_tarihi: null, not: 'Sana kapalı' },
    ],
    ogrenim_ucreti: 18500.5, para_birimi: 'EUR', ogrenim_ucreti_donem: 'yillik',
    ucret_muafiyeti: false, ucret_not: null,
    uygunluk: 'supheli', uygunluk_not: 'Matematik ECTS sınırda',
    on_kosullar: ['matematik_ects', 'programlama'], on_kosul_detay: null,
    dil_sarti: 'IELTS 6.5', not_ortalamasi: null, is_deneyimi: null,
    belgeler: ['ielts', 'transkript', 'motivasyon_mektubu'], belge_detay: null,
    kontenjan: 40, kabul_orani: '%18', rekabet_not: null,
    ilgili_burslar: ['Holland Scholarship'], burs_notu: null,
    burs_tahmini: 5000, burs_tahmini_para: 'EUR',
    mezun_istihdam: null, staj_zorunlu: null, kariyer_not: null,
    durum: 'kisa_liste', oncelik: 1,
    basvuru_link: null, kaynak_link: null, mufredat_link: null,
    notlar: null, ham_metin: null, etiketler: ['deneme'],
  }
  const prgId = await programEkle(prgGirdi)
  const p = await programGetir(prgId)

  kontrol('program eklendi ve okundu', p !== null)
  kontrol('date → "YYYY-MM-DD" dizge (Date nesnesi DEĞİL)',
    p?.son_tarih === '2027-01-15',
    `gelen: ${typeof p?.son_tarih} ${JSON.stringify(p?.son_tarih)}`)
  kontrol('ikinci date de dizge', p?.acilis_tarihi === '2026-10-01',
    `gelen: ${JSON.stringify(p?.acilis_tarihi)}`)
  kontrol('öğrenim ücreti sayı ve ondalıklı', p?.ogrenim_ucreti === 18500.5,
    `gelen: ${typeof p?.ogrenim_ucreti} ${p?.ogrenim_ucreti}`)
  kontrol('jsonb dizi olarak geri geldi',
    Array.isArray(p?.basvuru_turlari) && p!.basvuru_turlari.length === 2,
    `gelen: ${JSON.stringify(p?.basvuru_turlari)?.slice(0, 120)}`)
  kontrol('turun alanları bozulmadı',
    p?.basvuru_turlari[0]?.kimin_icin === 'ab_disi'
    && p?.basvuru_turlari[0]?.son_tarih === '2027-01-15'
    && p?.basvuru_turlari[1]?.kimin_icin === 'ab')
  kontrol('kod dizileri (belgeler, on_kosullar) korundu',
    p?.belgeler.length === 3 && p?.on_kosullar.includes('matematik_ects'))
  kontrol('üniversite gömülü geldi (join)', p?.universite?.ad === 'Deneme Üniversitesi')
  kontrol('ülke de gömülü geldi (Aşama 7 — maliyet için)', p?.ulke?.kod === DENEME_ULKE,
    JSON.stringify(p?.ulke))
  kontrol('burs tahmini sayı olarak geri geldi', p?.burs_tahmini === 5000,
    `gelen: ${typeof p?.burs_tahmini} ${p?.burs_tahmini}`)
  kontrol('gömülü başvuru ücreti sayı', typeof p?.universite?.basvuru_ucreti === 'number')
  kontrol('ulke_kodu programa kopyalanmadı, üniversiteden geliyor',
    p?.universite?.ulke_kodu === DENEME_ULKE && !('ulke_kodu' in (p as object)))

  const hepsi = await programlariGetir()
  kontrol('liste sorgusu programı görüyor', hepsi.some((x) => x.id === prgId))

  const uniSonra = await universiteGetir(uniId)
  kontrol('üniversitenin program sayısı 1 oldu', uniSonra?.program_sayisi === 1,
    `gelen: ${uniSonra?.program_sayisi}`)

  /* ────────────────────────────────────────────────── veritabanı kısıtı */
  console.log('\n  Veritabanı kısıtları')
  let kisitTuttu = false
  try {
    // 'kesin' tipinde son_tarih zorunlu — CHECK bunu reddetmeli.
    await programEkle({ ...prgGirdi, ad: 'Bozuk', son_tarih: null })
  } catch (e) {
    kisitTuttu = e instanceof Error && e.message.includes('son tarih alanları')
  }
  kontrol('prg_son_tarih_tutarli CHECK bozuk kaydı reddetti + mesaj Türkçe', kisitTuttu)

  let fkTuttu = false
  try {
    await ulkeSil(DENEME_ULKE) // altında üniversite var, restrict engellemeli
  } catch (e) {
    fkTuttu = e instanceof Error && e.message.includes('bağlı başka kayıtlar var')
  }
  kontrol('ülke silme, altında üniversite varken engellendi', fkTuttu)

  /* ──────────────────────────────────────────────────────────── belgeler */
  console.log('\n  Belgeler ve ayarlar')
  await programBelgeIsaretle(prgId, 'ielts', true, 'deneme notu')
  await programBelgeIsaretle(prgId, 'transkript', false, null)
  let belgeler = await programBelgeleriGetir(prgId)
  kontrol('belge işaretleri yazıldı', belgeler.length === 2)
  kontrol('upsert aynı satırı güncelliyor',
    belgeler.find((b) => b.belge_kodu === 'ielts')?.hazir === true)

  await programBelgeleriniEsitle(prgId, ['ielts'])
  belgeler = await programBelgeleriGetir(prgId)
  kontrol('esitle() listeden çıkarılan belgeyi sildi',
    belgeler.length === 1 && belgeler[0].belge_kodu === 'ielts',
    `kalan: ${belgeler.map((b) => b.belge_kodu).join(',')}`)

  await havuzGuncelle('__deneme__', 'hazir', '2027-06-30', null)
  const havuz = await havuzGetir()
  const h = havuz.find((x) => x.belge_kodu === '__deneme__')
  kontrol('havuz belgesi yazıldı', h?.durum === 'hazir')
  kontrol('havuz geçerlilik tarihi dizge', h?.gecerlilik_bitis === '2027-06-30',
    `gelen: ${JSON.stringify(h?.gecerlilik_bitis)}`)

  await ayarKaydet('__deneme__', { kurlar: { EUR: 1, DKK: 0.134 }, tarih: '2026-08-28' })
  const ayar = await ayarGetir<{ kurlar: Record<string, number>; tarih: string }>('__deneme__')
  kontrol('ayar jsonb yazıldı ve nesne olarak geri geldi',
    ayar?.kurlar?.DKK === 0.134 && ayar?.tarih === '2026-08-28',
    JSON.stringify(ayar))

  /* ───────────────────────────────────────────────────────────── cascade */
  console.log('\n  Silme davranışı')
  const { db } = await import('../lib/veritabani')
  await db()`delete from public.universiteler where id = ${uniId}`
  kontrol('üniversite silinince programı da gitti (cascade)',
    (await programGetir(prgId)) === null)
  const kalanBelge = await programBelgeleriGetir(prgId)
  kontrol('program silinince belge satırları da gitti (cascade)', kalanBelge.length === 0)

  await ulkeSil(DENEME_ULKE)
  kontrol('üniversite gidince ülke silinebildi', (await ulkeGetir(DENEME_ULKE)) === null)
} finally {
  await temizle()
}

console.log(`\n  ${gecti} geçti, ${kaldi} kaldı.\n`)
if (kaldi > 0) process.exit(1)
