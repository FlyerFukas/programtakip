/**
 * Kural testleri — tarih mantığı ve başvuru turları.
 *
 *   npm run dogrula:kurallar
 *
 * NEDEN VAR: bu dosyanın test ettiği mantık uygulamanın en pahalı yeri.
 * Yanlış turu takip etmek bir yıl kaybettirir; "3 ay var" diye gösterilen
 * bir programın aslında iki ay önce kapanmış olması aynı şey demek.
 * Arayüzden gözle kontrol edilemez, çünkü hepsi bugünün tarihine göre
 * değişiyor — o yüzden testler bugüne GÖRE kuruluyor (`gunEkle`), sabit
 * tarihlerle değil. Sabit tarihli test bir yıl sonra sessizce yalan söyler.
 *
 * PROJE.md §7.2'nin listesi. Maliyet ve kur çevrimi kuralları Aşama 7'de
 * `lib/para.ts` ile birlikte buraya eklenecek — şu an o kod yok, sahte test
 * yazmak yerine eksik olduğu burada yazılı.
 */

import {
  tarihOku, tarihYaz, bugun, gunEkle, kalanGun, tarihFormat,
  siradakiTur, bilgiTurlari, etkinTarih, turUyarisi,
  aciliyet, geriSayimMetni, sonTarihMetni, acilisMetni, siraSkoru, hazirlikDurumu,
  type TarihliProgram,
} from '../lib/tarih'
import {
  BOS_SUZGEC, urldenSuzgec, suzgecSorgusu, suzgecUygula, siralamaUygula,
  sonTarihSiniri, suzgecAktif, suzgecSayisi,
  type Suzgec,
} from '../lib/suzgec'
import {
  belgeTakvimi, programBelgeListesi, havuzListesi, takvimOzeti, EKLEME_SURESI,
} from '../lib/belge-takvim'
import {
  VARSAYILAN_KURLAR, euroyaCevir, cevir, kurAyariniDogrula, toplamMaliyet, paraYaz,
} from '../lib/para'
import type { BasvuruTuru, ProgramGenis } from '../lib/tipler'

let gecti = 0
const kalanlar: string[] = []

function kontrol(ad: string, kosul: boolean, ayrinti = ''): void {
  if (kosul) { gecti++; console.log(`    ✓ ${ad}`) }
  else { kalanlar.push(ad); console.log(`    ✗ ${ad}${ayrinti ? ` — ${ayrinti}` : ''}`) }
}

function esit(ad: string, gelen: unknown, beklenen: unknown): void {
  kontrol(ad, gelen === beklenen, `beklenen ${JSON.stringify(beklenen)}, gelen ${JSON.stringify(gelen)}`)
}

/** Test programı kurucu — yalnızca tarih alanları anlamlı. */
function prg(p: Partial<TarihliProgram> & { durum?: string } = {}): TarihliProgram & { durum: string } {
  return {
    son_tarih_tipi: 'bilinmiyor',
    son_tarih: null,
    son_tarih_baslangic: null,
    son_tarih_bitis: null,
    basvuru_turlari: [],
    durum: 'arastiriliyor',
    ...p,
  }
}

function tur(
  ad: string,
  gunSonra: number,
  kiminIcin: BasvuruTuru['kimin_icin'],
): BasvuruTuru {
  return {
    ad,
    son_tarih: gunEkle(gunSonra),
    kimin_icin: kiminIcin,
    baslangic: null,
    sonuc_tarihi: null,
    not: null,
  }
}

console.log('\n═══ Kural testleri ═══')

/* ══════════════════════════════════════════════════════ temel çeviriler */
console.log('\n  Tarih çevirileri')
{
  esit('tarihOku + tarihYaz gidiş-dönüş', tarihYaz(tarihOku('2027-01-15')!), '2027-01-15')
  esit('31 Şubat reddedildi', tarihOku('2027-02-31'), null)
  esit('bozuk biçim reddedildi', tarihOku('15/01/2027'), null)
  esit('boş değer null', tarihOku(null), null)
  esit('bugün için kalanGun 0', kalanGun(bugun()), 0)
  esit('yarın için kalanGun 1', kalanGun(gunEkle(1)), 1)
  esit('dün için kalanGun -1', kalanGun(gunEkle(-1)), -1)
  esit('tarihFormat Türkçe ay', tarihFormat('2027-01-15'), '15 Ocak 2027')
  // Yerel gece yarısına sabitleme: saat dilimi kaymasıyla gün değişmemeli.
  esit('gunEkle 0 kimliği bozmuyor', gunEkle(0, '2027-03-01'), '2027-03-01')
  esit('gunEkle ay sınırını geçiyor', gunEkle(1, '2027-02-28'), '2027-03-01')
}

/* ════════════════════════════════════════════════ siradakiTur — ana kural */
console.log('\n  siradakiTur() — Kullanıcı AB DIŞI')
{
  esit('tur yoksa null', siradakiTur(prg()), null)

  const ikiTur = prg({
    basvuru_turlari: [tur('AB dışı', 40, 'ab_disi'), tur('AB', 100, 'ab')],
  })
  esit('AB dışı tur seçiliyor', siradakiTur(ikiTur)?.ad, 'AB dışı')

  // ASIL TUZAK: AB turu daha ERKEN olsa bile seçilmemeli.
  const abDahaErken = prg({
    basvuru_turlari: [tur('AB', 10, 'ab'), tur('AB dışı', 60, 'ab_disi')],
  })
  esit('AB turu daha erken olsa bile atlanıyor', siradakiTur(abDahaErken)?.ad, 'AB dışı')

  const ucTur = prg({
    basvuru_turlari: [
      tur('Geç tur', 120, 'ab_disi'),
      tur('Erken tur', 30, 'ab_disi'),
      tur('Orta tur', 70, 'ab_disi'),
    ],
  })
  esit('geçmemiş EN YAKIN tur seçiliyor', siradakiTur(ucTur)?.ad, 'Erken tur')

  const gecmisVeGelecek = prg({
    basvuru_turlari: [tur('Geçmiş', -30, 'ab_disi'), tur('Gelecek', 20, 'ab_disi')],
  })
  esit('geçmiş tur atlanıyor', siradakiTur(gecmisVeGelecek)?.ad, 'Gelecek')

  // "En erken" değil "geçmemiş en yakın": hepsi geçmişse EN SONUNCUSU döner
  // ki kart "kaçırdın" diye görünsün, tarihsiz görünmesin.
  const hepsiGecmis = prg({
    basvuru_turlari: [tur('Çok eski', -200, 'ab_disi'), tur('Yakın geçmiş', -10, 'ab_disi')],
  })
  esit('hepsi geçmişse en sonuncusu', siradakiTur(hepsiGecmis)?.ad, 'Yakın geçmiş')
  kontrol('hepsi geçmişse null DÖNMÜYOR', siradakiTur(hepsiGecmis) !== null)

  const herkes = prg({ basvuru_turlari: [tur('Tek tur', 45, 'herkes')] })
  esit('"herkes" turu bağlayıcı', siradakiTur(herkes)?.ad, 'Tek tur')

  const sadeceAb = prg({ basvuru_turlari: [tur('AB', 45, 'ab')] })
  esit('yalnızca AB turu varsa null', siradakiTur(sadeceAb), null)

  const belirsizTur = prg({ basvuru_turlari: [tur('Belirsiz', 45, null)] })
  esit('kimin_icin boşsa bağlayıcı değil', siradakiTur(belirsizTur), null)

  const tarihsizTur = prg({
    basvuru_turlari: [{ ...tur('Tarihsiz', 0, 'ab_disi'), son_tarih: null }],
  })
  esit('tarihi olmayan tur sayılmıyor', siradakiTur(tarihsizTur), null)

  esit('bilgiTurlari AB turunu döndürüyor', bilgiTurlari(ikiTur).length, 1)
  esit('bilgiTurlari senin turunu döndürmüyor', bilgiTurlari(ikiTur)[0]?.ad, 'AB')
}

/* ═══════════════════════════════════════════════════════════ etkinTarih */
console.log('\n  etkinTarih() — merkezî tarih mi, tur mu')
{
  /*
   * KURAL: erken olan kazanır. Şartname §4.4 ile §7.2 burada çelişiyor;
   * gerekçe lib/tarih.ts'teki `etkinTarih` notunda. Özet: "kaçıramayacağın
   * gün" tanımı ikisini de karşılıyor ve ekranda yalan söylemiyor.
   */
  const turDahaErken = prg({
    son_tarih_tipi: 'kesin',
    son_tarih: gunEkle(50),
    basvuru_turlari: [tur('AB dışı', 20, 'ab_disi')],
  })
  esit('turun merkezîden erkense tur kazanıyor', etkinTarih(turDahaErken), gunEkle(20))

  const merkeziDahaErken = prg({
    son_tarih_tipi: 'kesin',
    son_tarih: gunEkle(20),
    basvuru_turlari: [tur('AB dışı', 50, 'ab_disi')],
  })
  esit('merkezî erkense turlar onu ezmiyor', etkinTarih(merkeziDahaErken), gunEkle(20))

  // AB turu ne kadar erken olursa olsun hesaba girmemeli.
  const abErkenAmaKapali = prg({
    son_tarih_tipi: 'kesin',
    son_tarih: gunEkle(50),
    basvuru_turlari: [tur('AB', 5, 'ab')],
  })
  esit('AB turu erken olsa da etkin tarihi değiştirmiyor',
    etkinTarih(abErkenAmaKapali), gunEkle(50))

  const sadeceTur = prg({
    son_tarih_tipi: 'bilinmiyor',
    basvuru_turlari: [tur('AB dışı', 20, 'ab_disi')],
  })
  esit('merkezî tarih yoksa tura düşüyor', etkinTarih(sadeceTur), gunEkle(20))

  const aralik = prg({
    son_tarih_tipi: 'aralik',
    son_tarih_baslangic: gunEkle(10),
    son_tarih_bitis: gunEkle(40),
  })
  esit('aralıkta KAPANIŞ alınıyor', etkinTarih(aralik), gunEkle(40))

  const acikUcluAralik = prg({
    son_tarih_tipi: 'aralik',
    son_tarih_baslangic: gunEkle(10),
  })
  esit('aralığın sonu yoksa başı alınıyor', etkinTarih(acikUcluAralik), gunEkle(10))

  esit('hiçbir tarih yoksa null', etkinTarih(prg()), null)
}

/* ═══════════════════════════════════════════════════════════ turUyarisi */
console.log('\n  turUyarisi() — yanlış tarihi takip etme riski')
{
  const riskli = prg({
    son_tarih_tipi: 'kesin',
    son_tarih: gunEkle(60),
    basvuru_turlari: [tur('AB dışı', 20, 'ab_disi')],
  })
  kontrol('turun merkezî tarihten önceyse uyarı çıkıyor', turUyarisi(riskli) !== null)
  kontrol('uyarı turun adını içeriyor', turUyarisi(riskli)?.includes('AB dışı') === true)

  const risksiz = prg({
    son_tarih_tipi: 'kesin',
    son_tarih: gunEkle(20),
    basvuru_turlari: [tur('AB dışı', 60, 'ab_disi')],
  })
  esit('tur daha geç ise uyarı yok', turUyarisi(risksiz), null)

  const merkezisiz = prg({
    son_tarih_tipi: 'bilinmiyor',
    basvuru_turlari: [tur('AB dışı', 20, 'ab_disi')],
  })
  esit('merkezî tarih yoksa uyarı yok', turUyarisi(merkezisiz), null)

  esit('tur yoksa uyarı yok', turUyarisi(prg({ son_tarih_tipi: 'kesin', son_tarih: gunEkle(30) })), null)
}

/* ═════════════════════════════════════════════════════════════ aciliyet */
console.log('\n  aciliyet() ve geri sayım')
{
  const ile = (gun: number, durum = 'arastiriliyor') =>
    prg({ son_tarih_tipi: 'kesin', son_tarih: gunEkle(gun), durum })

  esit('bugün', aciliyet(ile(0)), 'bugun')
  esit('geçti', aciliyet(ile(-5)), 'gecti')
  esit('kritik (≤7)', aciliyet(ile(5)), 'kritik')
  esit('sınır: tam 7 gün kritik', aciliyet(ile(7)), 'kritik')
  esit('sınır: 8 gün yakın', aciliyet(ile(8)), 'yakin')
  esit('sınır: tam 30 gün yakın', aciliyet(ile(30)), 'yakin')
  esit('sınır: 31 gün yaklaşıyor', aciliyet(ile(31)), 'yaklasiyor')
  esit('sınır: tam 90 gün yaklaşıyor', aciliyet(ile(90)), 'yaklasiyor')
  esit('sınır: 91 gün uzak', aciliyet(ile(91)), 'uzak')

  esit('kapalı durum geri sayımı susturuyor', aciliyet(ile(5, 'kabul')), 'kapali')
  esit('vazgeçilen program kapalı', aciliyet(ile(5, 'vazgectim')), 'kapali')

  // Gönderilmiş başvuruda "6 gün geçti" kırmızısı yanlış alarm üretir.
  esit('başvuruldu → beklemede', aciliyet(ile(-6, 'basvuruldu')), 'beklemede')
  esit('mülakat → beklemede', aciliyet(ile(-6, 'mulakat')), 'beklemede')
  esit('bekleme listesi → beklemede', aciliyet(ile(3, 'bekleme')), 'beklemede')

  esit('sürekli açık', aciliyet(prg({ son_tarih_tipi: 'surekli' })), 'surekli')
  esit('tarihsiz belirsiz', aciliyet(prg()), 'belirsiz')

  // Turdan gelen tarih de aciliyeti besliyor.
  const turluAciliyet = prg({
    son_tarih_tipi: 'bilinmiyor',
    basvuru_turlari: [tur('AB dışı', 3, 'ab_disi')],
  })
  esit('tur tarihi aciliyeti belirliyor', aciliyet(turluAciliyet), 'kritik')

  esit('geri sayım: bugün', geriSayimMetni(ile(0)), 'BUGÜN son gün')
  esit('geri sayım: yarın', geriSayimMetni(ile(1)), 'yarın son gün')
  esit('geri sayım: 12 gün', geriSayimMetni(ile(12)), '12 gün kaldı')
  esit('geri sayım: geçmiş', geriSayimMetni(ile(-9)), '9 gün geçti')
  esit('geri sayım: uzun vade aya çevriliyor', geriSayimMetni(ile(90)), '~3 ay kaldı')
  esit('geri sayım: kapalıda boş', geriSayimMetni(ile(5, 'kabul')), '')
  esit('geri sayım: beklemede boş', geriSayimMetni(ile(5, 'basvuruldu')), '')
}

/* ══════════════════════════════════════════════════════ okunur metinler */
console.log('\n  Okunur metinler')
{
  const kesin = { ...prg({ son_tarih_tipi: 'kesin', son_tarih: '2027-01-15' }), son_tarih_not: null }
  esit('kesin tarih metni', sonTarihMetni(kesin), '15 Ocak 2027')

  const bosKesin = { ...prg({ son_tarih_tipi: 'kesin' }), son_tarih_not: null }
  esit('kesin ama tarihsiz', sonTarihMetni(bosKesin), 'Tarih girilmemiş')

  const aralik = {
    ...prg({ son_tarih_tipi: 'aralik', son_tarih_baslangic: '2026-11-01', son_tarih_bitis: '2027-01-15' }),
    son_tarih_not: null,
  }
  esit('aralık metni', sonTarihMetni(aralik), '1 Kas 2026 – 15 Oca 2027')

  const surekli = { ...prg({ son_tarih_tipi: 'surekli' }), son_tarih_not: null }
  esit('sürekli metni', sonTarihMetni(surekli), 'Sürekli açık')

  const notlu = { ...prg(), son_tarih_not: 'Mart 2027 bekleniyor' }
  esit('bilinmiyorsa not gösteriliyor', sonTarihMetni(notlu), 'Mart 2027 bekleniyor')

  const turlu = {
    ...prg({ son_tarih_tipi: 'bilinmiyor', basvuru_turlari: [tur('AB dışı', 30, 'ab_disi')] }),
    son_tarih_not: null,
  }
  kontrol('merkezî tarih yokken tur metni geçiyor',
    sonTarihMetni(turlu).includes('AB dışı'), sonTarihMetni(turlu))

  esit('açılış geçmişse boş', acilisMetni({ acilis_tarihi: gunEkle(-3) }), '')
  esit('açılış yarınsa özel metin', acilisMetni({ acilis_tarihi: gunEkle(1) }), 'Başvurular yarın açılıyor')
  kontrol('açılış ileride ise gün sayısı yazıyor',
    acilisMetni({ acilis_tarihi: gunEkle(20) }).includes('20 gün sonra'))
}

/* ═══════════════════════════════════════════════════════════ sıralama */
console.log('\n  Sıralama anahtarı')
{
  const yakin = prg({ son_tarih_tipi: 'kesin', son_tarih: gunEkle(10) })
  const uzak = prg({ son_tarih_tipi: 'kesin', son_tarih: gunEkle(100) })
  const surekli = prg({ son_tarih_tipi: 'surekli' })
  const belirsiz = prg()
  const kapali = prg({ son_tarih_tipi: 'kesin', son_tarih: gunEkle(5), durum: 'red' })

  kontrol('yakın tarih uzaktan önce', siraSkoru(yakin) < siraSkoru(uzak))
  kontrol('tarihli, sürekliden önce', siraSkoru(uzak) < siraSkoru(surekli))
  kontrol('sürekli, belirsizden önce', siraSkoru(surekli) < siraSkoru(belirsiz))
  kontrol('kapalı en sonda', siraSkoru(belirsiz) < siraSkoru(kapali))
}

/* ═══════════════════════════════════════════════════════════════ süzgeç */
console.log('\n  Süzgeç ve sıralama')
{
  /** Tam `ProgramGenis` kurmak yerine test için gereken alanlar. */
  function pg(o: Partial<ProgramGenis> & { id: string }): ProgramGenis {
    return {
      ad: 'Program', universite_id: 'u1', bolum: null, derece: null, alanlar: [],
      sure_ay: null, ects: null, tezli: null, ogretim_dili: null, kampus: null,
      baslangic_donemleri: [],
      son_tarih_tipi: 'bilinmiyor', son_tarih: null,
      son_tarih_baslangic: null, son_tarih_bitis: null,
      son_tarih_not: null, acilis_tarihi: null, basvuru_turlari: [],
      ogrenim_ucreti: null, para_birimi: null, ogrenim_ucreti_donem: null,
      ucret_muafiyeti: null, ucret_not: null,
      uygunluk: 'bilinmiyor', uygunluk_not: null, on_kosullar: [], on_kosul_detay: null,
      dil_sarti: null, not_ortalamasi: null, is_deneyimi: null,
      belgeler: [], belge_detay: null,
      kontenjan: null, kabul_orani: null, rekabet_not: null,
      ilgili_burslar: [], burs_notu: null,
      mezun_istihdam: null, staj_zorunlu: null, kariyer_not: null,
      durum: 'arastiriliyor', oncelik: 2,
      basvuru_link: null, kaynak_link: null, mufredat_link: null,
      notlar: null, ham_metin: null, etiketler: [],
      olusturma: '2026-01-01T00:00:00.000Z', guncelleme: '2026-01-01T00:00:00.000Z',
      universite: {
        id: 'u1', ad: 'Üniversite', ulke_kodu: 'NL', sehir: null, tur: null,
        qs_sirasi: null, the_sirasi: null, alan_sirasi: null,
        basvuru_platformu: null, basvuru_ucreti: null, basvuru_ucreti_para: null,
        depozito: null, depozito_para: null, site_link: null,
      },
      ...o,
    } as ProgramGenis
  }

  const s = (o: Partial<Suzgec> = {}): Suzgec => ({ ...BOS_SUZGEC, ...o })
  const idler = (l: ProgramGenis[]) => l.map((x) => x.id).join(',')

  /* ── URL gidiş-dönüş ── */
  const dolu = s({
    ara: 'veri', ulke: ['NL', 'DK'], belge: ['ielts'], kosul: ['programlama'],
    uygunluk: ['uygun'], durum: ['kisa_liste'], dil: ['İngilizce'],
    ucretMin: 5000, ucretMax: 20000, son: '+30', sirala: 'ucret',
    kapaliGoster: true, uygunsuzGoster: true,
  })
  const geri = urldenSuzgec(new URLSearchParams(suzgecSorgusu(dolu)))
  esit('URL gidiş-dönüş bozulmuyor', JSON.stringify(geri), JSON.stringify(dolu))
  esit('varsayılan süzgeç URL\'ye hiç yazılmıyor', suzgecSorgusu(BOS_SUZGEC), '')
  kontrol('varsayılan sıralama URL\'ye yazılmıyor',
    !suzgecSorgusu(s({ ulke: ['NL'] })).includes('sirala'))

  /* ── göreli tarih ── */
  esit('+30 bugüne göre çözülüyor', sonTarihSiniri('+30'), gunEkle(30))
  esit('-7 geriye çözülüyor', sonTarihSiniri('-7'), gunEkle(-7))
  esit('mutlak tarih olduğu gibi', sonTarihSiniri('2027-01-15'), '2027-01-15')
  esit('bozuk değer null', sonTarihSiniri('abc'), null)
  esit('boş null', sonTarihSiniri(null), null)

  /* ── varsayılan gizlemeler ── */
  const liste = [
    pg({ id: 'acik' }),
    pg({ id: 'elenen', uygunluk: 'uygun_degil' }),
    pg({ id: 'kapali', durum: 'red' }),
  ]
  esit('uygun_degil varsayılanda gizli', idler(suzgecUygula(liste, s())), 'acik')
  esit('kapalı durum varsayılanda gizli', idler(suzgecUygula(liste, s())), 'acik')
  kontrol('uygunsuzGoster açınca geliyor',
    idler(suzgecUygula(liste, s({ uygunsuzGoster: true }))).includes('elenen'))
  kontrol('kapaliGoster açınca geliyor',
    idler(suzgecUygula(liste, s({ kapaliGoster: true }))).includes('kapali'))

  /* ── kod listeleri ── */
  const kodListesi = [
    pg({ id: 'ielts', belgeler: ['ielts'] }),
    pg({ id: 'ikisi', belgeler: ['ielts', 'gre'] }),
    pg({ id: 'gre', belgeler: ['gre'] }),
  ]
  esit('tek belge süzgeci VEYA değil, içeren hepsi',
    idler(suzgecUygula(kodListesi, s({ belge: ['ielts'] }))), 'ielts,ikisi')
  // İki belge seçen kişi ikisini BİRDEN isteyen programı arıyordur.
  esit('iki belge seçilince HEPSİ tutmalı',
    idler(suzgecUygula(kodListesi, s({ belge: ['ielts', 'gre'] }))), 'ikisi')

  const ulkeListesi = [
    pg({ id: 'nl' }),
    pg({ id: 'dk', universite: { ...pg({ id: 'x' }).universite, ulke_kodu: 'DK' } }),
    pg({ id: 'de', universite: { ...pg({ id: 'x' }).universite, ulke_kodu: 'DE' } }),
  ]
  esit('ülke süzgeci VEYA mantığı',
    idler(suzgecUygula(ulkeListesi, s({ ulke: ['NL', 'DE'] }))), 'nl,de')

  /* ── ücret: Aşama 7'den beri EUR üzerinden ── */
  const ucretListesi = [
    pg({ id: 'ucuz', ogrenim_ucreti: 5000, para_birimi: 'EUR' }),
    pg({ id: 'orta', ogrenim_ucreti: 15000, para_birimi: 'EUR' }),
    pg({ id: 'pahali', ogrenim_ucreti: 40000, para_birimi: 'EUR' }),
    pg({ id: 'bilinmiyor' }),
    pg({ id: 'birimsiz', ogrenim_ucreti: 12000 }),
  ]
  esit('ücret aralığı',
    idler(suzgecUygula(ucretListesi, s({ ucretMin: 10000, ucretMax: 20000 }))), 'orta')
  // Eksik veri sıfır sayılmıyor: ücreti girilmemiş program "0 EUR" değildir.
  esit('ücreti girilmemiş program aralığa girmiyor',
    idler(suzgecUygula(ucretListesi, s({ ucretMax: 100000 }))), 'ucuz,orta,pahali')
  // Para birimi olmayan tutar çevrilemez — "12000 ne?" sorusunun cevabı yok.
  kontrol('para birimi girilmemiş tutar aralığa girmiyor',
    !idler(suzgecUygula(ucretListesi, s({ ucretMax: 100000 }))).includes('birimsiz'))

  // ASIL KAZANÇ: DKK ile EUR artık doğru karşılaştırılıyor.
  const karisikPara = [
    pg({ id: 'dkk120k', ogrenim_ucreti: 120000, para_birimi: 'DKK' }),  // ≈ 16.053 EUR
    pg({ id: 'eur15k', ogrenim_ucreti: 15000, para_birimi: 'EUR' }),
  ]
  esit('120.000 DKK, 15.000 EUR ile aynı aralıkta',
    idler(suzgecUygula(karisikPara, s({ ucretMin: 14000, ucretMax: 17000 }))),
    'dkk120k,eur15k')
  esit('ücrete göre sıralama EUR üzerinden',
    idler(siralamaUygula(karisikPara, 'ucret')), 'eur15k,dkk120k')

  /* ── son tarih penceresi ── */
  const tarihListesi = [
    pg({ id: 'yakin', son_tarih_tipi: 'kesin', son_tarih: gunEkle(10) }),
    pg({ id: 'uzak', son_tarih_tipi: 'kesin', son_tarih: gunEkle(200) }),
    pg({ id: 'gecmis', son_tarih_tipi: 'kesin', son_tarih: gunEkle(-5) }),
    pg({ id: 'tarihsiz' }),
  ]
  esit('30 gün penceresi', idler(suzgecUygula(tarihListesi, s({ son: '+30' }))), 'yakin')
  kontrol('tarihsiz program pencereye girmiyor',
    !idler(suzgecUygula(tarihListesi, s({ son: '+365' }))).includes('tarihsiz'))
  kontrol('geçmiş tarih "önümüzdeki N gün" içinde sayılmıyor',
    !idler(suzgecUygula(tarihListesi, s({ son: '+30' }))).includes('gecmis'))

  /* ── arama ── */
  const aramaListesi = [
    pg({ id: 'a', ad: 'MSc Social Data Science',
         universite: { ...pg({ id: 'x' }).universite, ad: 'Aalborg Universitet', sehir: 'Aalborg' } }),
    pg({ id: 'b', ad: 'MA Demography', alanlar: ['demografi'] }),
  ]
  esit('tek kelime arama', idler(suzgecUygula(aramaListesi, s({ ara: 'demografi' }))), 'b')
  esit('üniversite adında arama', idler(suzgecUygula(aramaListesi, s({ ara: 'aalborg' }))), 'a')
  // Türkçe/aksan normalizasyonu: "İ" ve büyük harf sorun çıkarmamalı.
  esit('büyük harf ve aksan duyarsız',
    idler(suzgecUygula(aramaListesi, s({ ara: 'DEMOGRAFİ' }))), 'b')
  // Çok kelime VE mantığı: ikisi de geçmeli.
  esit('çok kelime VE mantığı',
    idler(suzgecUygula(aramaListesi, s({ ara: 'aalborg data' }))), 'a')
  esit('eşleşmeyen kelime hepsini eliyor',
    idler(suzgecUygula(aramaListesi, s({ ara: 'aalborg demografi' }))), '')

  /* ── sıralama ── */
  // Para birimi ŞART: Aşama 7'den beri sıralama EUR üzerinden yapılıyor ve
  // birimi olmayan tutar çevrilemediği için sona düşüyor.
  const siraListesi = [
    pg({ id: 'pahali', ogrenim_ucreti: 40000, para_birimi: 'EUR', ad: 'Zeta' }),
    pg({ id: 'ucretsiz', ad: 'Çilek' }),
    pg({ id: 'ucuz', ogrenim_ucreti: 5000, para_birimi: 'EUR', ad: 'Alfa' }),
  ]
  esit('ücrete göre: ucuzdan pahalıya, boş SONA',
    idler(siralamaUygula(siraListesi, 'ucret')), 'ucuz,pahali,ucretsiz')
  // Türkçe alfabe: Ç, C'den sonra gelir — localeCompare('tr') bunu biliyor.
  esit('ada göre Türkçe alfabe', idler(siralamaUygula(siraListesi, 'ad')), 'ucuz,ucretsiz,pahali')

  const oncelikListesi = [
    pg({ id: 'dusuk-yakin', oncelik: 3, son_tarih_tipi: 'kesin', son_tarih: gunEkle(5) }),
    pg({ id: 'yuksek-uzak', oncelik: 1, son_tarih_tipi: 'kesin', son_tarih: gunEkle(200) }),
    pg({ id: 'yuksek-yakin', oncelik: 1, son_tarih_tipi: 'kesin', son_tarih: gunEkle(10) }),
  ]
  esit('önceliğe göre, eşitse tarihe göre',
    idler(siralamaUygula(oncelikListesi, 'oncelik')), 'yuksek-yakin,yuksek-uzak,dusuk-yakin')

  /* ── yardımcılar ── */
  kontrol('boş süzgeç aktif değil', !suzgecAktif(BOS_SUZGEC))
  kontrol('tek ölçüt süzgeci aktif yapıyor', suzgecAktif(s({ ulke: ['NL'] })))
  esit('süzgeç sayacı ölçüt sayıyor, kod sayısını değil',
    suzgecSayisi(s({ ulke: ['NL', 'DK'], belge: ['ielts'] })), 2)
  esit('ücret aralığı tek ölçüt sayılıyor',
    suzgecSayisi(s({ ucretMin: 1, ucretMax: 2 })), 1)
}

/* ═══════════════════════════════════════════════════════ belge takvimi */
console.log('\n  Belge takvimi')
{
  const bosUni = {
    id: 'u1', ad: 'Üniversite', ulke_kodu: 'NL', sehir: null, tur: null,
    qs_sirasi: null, the_sirasi: null, alan_sirasi: null,
    basvuru_platformu: null, basvuru_ucreti: null, basvuru_ucreti_para: null,
    depozito: null, depozito_para: null, site_link: null,
  }

  function pg(o: Partial<ProgramGenis> & { id: string }): ProgramGenis {
    return {
      ad: 'Program', universite_id: 'u1', bolum: null, derece: null, alanlar: [],
      sure_ay: null, ects: null, tezli: null, ogretim_dili: null, kampus: null,
      baslangic_donemleri: [],
      son_tarih_tipi: 'bilinmiyor', son_tarih: null,
      son_tarih_baslangic: null, son_tarih_bitis: null,
      son_tarih_not: null, acilis_tarihi: null, basvuru_turlari: [],
      ogrenim_ucreti: null, para_birimi: null, ogrenim_ucreti_donem: null,
      ucret_muafiyeti: null, ucret_not: null,
      uygunluk: 'bilinmiyor', uygunluk_not: null, on_kosullar: [], on_kosul_detay: null,
      dil_sarti: null, not_ortalamasi: null, is_deneyimi: null,
      belgeler: [], belge_detay: null,
      kontenjan: null, kabul_orani: null, rekabet_not: null,
      ilgili_burslar: [], burs_notu: null,
      mezun_istihdam: null, staj_zorunlu: null, kariyer_not: null,
      durum: 'arastiriliyor', oncelik: 2,
      basvuru_link: null, kaynak_link: null, mufredat_link: null,
      notlar: null, ham_metin: null, etiketler: [],
      olusturma: '2026-01-01T00:00:00.000Z', guncelleme: '2026-01-01T00:00:00.000Z',
      universite: bosUni,
      ...o,
    } as ProgramGenis
  }
  const kesin = (id: string, gun: number, belgeler: string[], durum = 'arastiriliyor') =>
    pg({ id, ad: id, son_tarih_tipi: 'kesin', son_tarih: gunEkle(gun), belgeler, durum })

  const hv = (kod: string, durum: 'yok' | 'hazirlaniyor' | 'hazir', bitis: string | null = null) =>
    ({ belge_kodu: kod, durum, gecerlilik_bitis: bitis, notlar: null, guncelleme: '' })

  /* ── hazırlık eşikleri ── */
  esit('hazırlık: tarih yoksa geçersiz', hazirlikDurumu(null, 90).durum, 'gecersiz')
  esit('hazırlık: süre yetmiyorsa geciktin',
    hazirlikDurumu(gunEkle(60), 90).durum, 'gecikti')
  esit('hazırlık: 14 gün pay varsa "başla"',
    hazirlikDurumu(gunEkle(100), 90).durum, 'basla')
  esit('hazırlık: bol pay varsa rahat',
    hazirlikDurumu(gunEkle(200), 90).durum, 'rahat')
  esit('hazırlık: başlama tarihi hedeften hazırlık kadar geri',
    hazirlikDurumu('2027-04-01', 90).baslamaTarihi, gunEkle(-90, '2027-04-01'))
  esit('hazırlık: son tarih geçmişse geciktin',
    hazirlikDurumu(gunEkle(-1), 3).durum, 'gecikti')

  /* ── aynı belge, birden çok program: TEK SATIR, EN ERKEN hedef ── */
  const cokProgram = belgeTakvimi(
    [
      kesin('uzak', 300, ['transkript']),
      kesin('yakin', 100, ['transkript']),
      kesin('orta', 200, ['transkript']),
    ],
    [], [],
  )
  esit('aynı belge tek satırda toplanıyor', cokProgram.length, 1)
  esit('satır 3 programı sayıyor', cokProgram[0].toplam, 3)
  esit('en yakın hedef alınıyor', cokProgram[0].enYakinTarih, gunEkle(100))
  esit('programlar en acil önce sıralı',
    cokProgram[0].programlar.map((x) => x.program_id).join(','), 'yakin,orta,uzak')

  /* ── belgeBekliyor: false olan durumlar takvime GİRMEZ ── */
  const gonderilmis = belgeTakvimi(
    [
      kesin('acik', 100, ['ielts']),
      kesin('gonderildi', 20, ['ielts'], 'basvuruldu'),
      kesin('kabul', 10, ['ielts'], 'kabul'),
      kesin('vazgectim', 5, ['ielts'], 'vazgectim'),
    ],
    [], [],
  )
  esit('takvimde yalnızca belge bekleyen programlar', gonderilmis[0].toplam, 1)
  esit('en yakın tarih gönderilmişlerden gelmiyor',
    gonderilmis[0].enYakinTarih, gunEkle(100))

  /* ── havuz: elinde geçerli belge hazırlık süresini kısaltıyor ── */
  const havuzsuz = belgeTakvimi([kesin('p', 100, ['ielts'])], [], [])
  esit('havuz boşken IELTS tam süre', havuzsuz[0].hazirlikGun, 90)
  esit('havuz boşken 100 güne 90 gün hazırlık = başla', havuzsuz[0].hazirlik, 'basla')

  const havuzlu = belgeTakvimi(
    [kesin('p', 100, ['ielts'])], [], [hv('ielts', 'hazir', gunEkle(400))],
  )
  esit('elinde geçerli IELTS varsa hazırlık 3 gün', havuzlu[0].hazirlikGun, EKLEME_SURESI)
  esit('kısalınca durum rahatlıyor', havuzlu[0].hazirlik, 'rahat')
  kontrol('elindeGecerli işaretleniyor', havuzlu[0].elindeGecerli)
  esit('tam süre de saklanıyor', havuzlu[0].tamHazirlikGun, 90)

  // Süresi DOLMUŞ belge elinde sayılmaz: tam hazırlık süresi geri gelir.
  const suresiDolmus = belgeTakvimi(
    [kesin('p', 100, ['ielts'])], [], [hv('ielts', 'hazir', gunEkle(-10))],
  )
  esit('süresi dolmuş belge elinde sayılmıyor', suresiDolmus[0].hazirlikGun, 90)
  kontrol('elindeGecerli false', !suresiDolmus[0].elindeGecerli)
  kontrol('süresi dolduğu uyarıda yazıyor',
    suresiDolmus[0].gecerlilikUyarisi?.includes('doldu') === true,
    String(suresiDolmus[0].gecerlilikUyarisi))

  // "hazirlaniyor" hazır değildir — süre kısalmamalı.
  const hazirlaniyor = belgeTakvimi(
    [kesin('p', 100, ['ielts'])], [], [hv('ielts', 'hazirlaniyor', gunEkle(400))],
  )
  esit('"hazırlanıyor" süreyi kısaltmıyor', hazirlaniyor[0].hazirlikGun, 90)

  // Programa özel belge (motivasyon mektubu) havuzdan etkilenmez.
  const ozelBelge = belgeTakvimi(
    [kesin('p', 100, ['motivasyon_mektubu'])], [],
    [hv('motivasyon_mektubu', 'hazir', null)],
  )
  esit('programa özel belge havuzdan kısalmıyor', ozelBelge[0].hazirlikGun, 14)

  /* ── geçerlilik başvurudan ÖNCE doluyorsa uyar ── */
  const erkenDolan = belgeTakvimi(
    [kesin('p', 200, ['ielts'])], [], [hv('ielts', 'hazir', gunEkle(100))],
  )
  kontrol('son tarihten önce dolan geçerlilik uyarı üretiyor',
    erkenDolan[0].gecerlilikUyarisi?.includes('ÖNCE') === true,
    String(erkenDolan[0].gecerlilikUyarisi))

  const gecDolan = belgeTakvimi(
    [kesin('p', 100, ['ielts'])], [], [hv('ielts', 'hazir', gunEkle(500))],
  )
  esit('son tarihten sonra dolan geçerlilik uyarı üretmiyor',
    gecDolan[0].gecerlilikUyarisi, null)

  /* ── hazır işaretli program baskı yaratmıyor ── */
  const isaretli = belgeTakvimi(
    [kesin('yakin', 20, ['transkript']), kesin('uzak', 300, ['transkript'])],
    [{ program_id: 'yakin', belge_kodu: 'transkript', hazir: true, notlar: null, guncelleme: '' }],
    [],
  )
  esit('hazır işaretli program en yakın tarihi belirlemiyor',
    isaretli[0].enYakinTarih, gunEkle(300))
  esit('tamamlanan sayısı doğru', isaretli[0].tamamlanan, 1)

  const hepsiHazir = belgeTakvimi(
    [kesin('p', 20, ['transkript'])],
    [{ program_id: 'p', belge_kodu: 'transkript', hazir: true, notlar: null, guncelleme: '' }],
    [],
  )
  kontrol('hepsi hazırsa satır bitti sayılıyor', hepsiHazir[0].bitti)

  /* ── sıralama: gecikenler üstte ── */
  const karisik = belgeTakvimi(
    [kesin('p', 100, ['ielts', 'foto', 'referans_mektubu'])], [], [],
  )
  esit('geciken belge en üstte', karisik[0].kod, 'ielts')       // 90 gün > 100-90=10 pay → başla
  kontrol('bitmemiş satırlar önce', karisik.every((x) => !x.bitti))

  /* ── program detayındaki liste ── */
  const detay = programBelgeListesi(
    kesin('p', 100, ['ielts', 'foto']),
    [{ program_id: 'p', belge_kodu: 'foto', hazir: true, notlar: 'çekildi', guncelleme: '' }],
    [hv('ielts', 'hazir', gunEkle(400))],
  )
  esit('detay listesi belge sayısı', detay.length, 2)
  kontrol('havuzdaki geçerli belge "elinde var" işaretli',
    detay.find((x) => x.kod === 'ielts')?.elindeGecerli === true)
  // Havuzda hazır olması kutuyu OTOMATİK işaretlemez — teslim etmek ayrı iş.
  kontrol('havuzda hazır olmak kutuyu işaretlemiyor',
    detay.find((x) => x.kod === 'ielts')?.hazir === false)
  esit('program bazlı işaret okunuyor', detay.find((x) => x.kod === 'foto')?.hazir, true)
  esit('program bazlı not okunuyor', detay.find((x) => x.kod === 'foto')?.notlar, 'çekildi')

  /* ── havuz listesi ── */
  const takvim = belgeTakvimi([kesin('p', 100, ['ielts'])], [], [])
  const havuzL = havuzListesi([hv('ielts', 'hazir', null)], takvim)
  kontrol('havuz listesi bütün kalıcı belgeleri gösteriyor', havuzL.length > 10)
  esit('istenen belge başa geliyor', havuzL[0].kod, 'ielts')
  esit('kaç program istiyor sayılıyor', havuzL[0].istenen, 1)
  kontrol('hiç istenmeyen belgeler de listede',
    havuzL.some((x) => x.istenen === 0))

  /* ── özet ── */
  const ozet = takvimOzeti(belgeTakvimi(
    [kesin('p1', 30, ['ielts']), kesin('p2', 300, ['foto'])], [], [],
  ))
  esit('özet: geciken sayısı', ozet.geciken, 1)   // IELTS 90 gün, 30 gün kalmış
  esit('özet: bekleyen toplam', ozet.toplam, 2)
}

/* ═════════════════════════════════════════════ maliyet ve kur çevrimi */
console.log('\n  Maliyet ve kur çevrimi')
{
  const yakin = (a: number | null, b: number, tolerans = 0.001) =>
    a !== null && Math.abs(a - b) < tolerans

  /* ── çevrim ── */
  esit('EUR kendine 1', VARSAYILAN_KURLAR.EUR, 1)
  kontrol('DKK → EUR: 7,4751 DKK ≈ 1 EUR',
    yakin(euroyaCevir(7.4751, 'DKK'), 1),
    String(euroyaCevir(7.4751, 'DKK')))
  kontrol('GBP EUR\'dan pahalı (kur > 1)', VARSAYILAN_KURLAR.GBP > 1)
  kontrol('TRY EUR\'dan ucuz (kur < 1)', VARSAYILAN_KURLAR.TRY < 1)

  // §7.2: "Kur çevrimi çift yönlü tutarlı"
  for (const birim of ['DKK', 'TRY', 'GBP', 'HUF']) {
    const gidis = cevir(10000, 'EUR', birim)
    const donus = cevir(gidis, birim, 'EUR')
    kontrol(`çift yönlü tutarlı: EUR → ${birim} → EUR`,
      yakin(donus, 10000, 0.0001), `gelen: ${donus}`)
  }

  esit('bilinmeyen para birimi null', euroyaCevir(100, 'XYZ'), null)
  esit('para birimi yoksa null', euroyaCevir(100, null), null)
  esit('tutar yoksa null', euroyaCevir(null, 'EUR'), null)

  /* ── kur ayarı doğrulama ── */
  const bozukAyar = kurAyariniDogrula({ kurlar: { DKK: -5, TRY: 'abc', EUR: 42 }, tarih: 'bozuk' })
  esit('negatif kur reddedildi, varsayılana düştü',
    bozukAyar.kurlar.DKK, VARSAYILAN_KURLAR.DKK)
  esit('metin kur reddedildi', bozukAyar.kurlar.TRY, VARSAYILAN_KURLAR.TRY)
  esit('EUR her zaman 1 (taban ezilemez)', bozukAyar.kurlar.EUR, 1)
  kontrol('bozuk tarih varsayılana düştü', /^\d{4}-\d{2}-\d{2}$/.test(bozukAyar.tarih))

  const gecerliAyar = kurAyariniDogrula({ kurlar: { TRY: 0.02 }, tarih: '2027-01-15' })
  esit('geçerli kur kabul edildi', gecerliAyar.kurlar.TRY, 0.02)
  esit('geçerli tarih kabul edildi', gecerliAyar.tarih, '2027-01-15')
  esit('verilmeyen birim varsayılanda kaldı',
    gecerliAyar.kurlar.DKK, VARSAYILAN_KURLAR.DKK)

  /* ── toplam maliyet ── */
  const uni = (o: Record<string, unknown> = {}) => ({
    id: 'u1', ad: 'Üniversite', ulke_kodu: 'NL', sehir: null, tur: null,
    qs_sirasi: null, the_sirasi: null, alan_sirasi: null,
    basvuru_platformu: null, basvuru_ucreti: null, basvuru_ucreti_para: null,
    depozito: null, depozito_para: null, site_link: null, ...o,
  })
  const mp = (o: Partial<ProgramGenis> = {}): ProgramGenis => ({
    id: 'p', ad: 'Program', universite_id: 'u1', bolum: null, derece: null, alanlar: [],
    sure_ay: 24, ects: 120, tezli: null, ogretim_dili: null, kampus: null,
    baslangic_donemleri: [],
    son_tarih_tipi: 'bilinmiyor', son_tarih: null,
    son_tarih_baslangic: null, son_tarih_bitis: null,
    son_tarih_not: null, acilis_tarihi: null, basvuru_turlari: [],
    ogrenim_ucreti: null, para_birimi: null, ogrenim_ucreti_donem: null,
    ucret_muafiyeti: null, ucret_not: null,
    uygunluk: 'bilinmiyor', uygunluk_not: null, on_kosullar: [], on_kosul_detay: null,
    dil_sarti: null, not_ortalamasi: null, is_deneyimi: null,
    belgeler: [], belge_detay: null,
    kontenjan: null, kabul_orani: null, rekabet_not: null,
    ilgili_burslar: [], burs_notu: null, burs_tahmini: null, burs_tahmini_para: null,
    mezun_istihdam: null, staj_zorunlu: null, kariyer_not: null,
    durum: 'arastiriliyor', oncelik: 2,
    basvuru_link: null, kaynak_link: null, mufredat_link: null,
    notlar: null, ham_metin: null, etiketler: [],
    olusturma: '2026-01-01T00:00:00.000Z', guncelleme: '2026-01-01T00:00:00.000Z',
    universite: uni(),
    ulke: { kod: 'NL', ad: 'Hollanda', para_birimi: 'EUR', aylik_yasam_gideri: null },
    ...o,
  } as ProgramGenis)

  // Hiçbir şey girilmemişse toplam 0 ama TAM DEĞİL — "0 EUR" diye
  // göstermek bedava sanmaya yol açar.
  const bos = toplamMaliyet(mp())
  esit('boş programda toplam 0', bos.euro, 0)
  kontrol('boş program "tam" sayılmıyor', !bos.tamMi)
  kontrol('eksik kalemler sayılıyor', bos.eksikler.length >= 2, JSON.stringify(bos.eksikler))

  // Yıllık ücret × yıl sayısı
  const yillik = toplamMaliyet(mp({
    ogrenim_ucreti: 10000, para_birimi: 'EUR', ogrenim_ucreti_donem: 'yillik', sure_ay: 24,
  }))
  esit('yıllık ücret 2 yılla çarpıldı',
    yillik.kalemler.find((k) => k.ad === 'Öğrenim ücreti')?.euro, 20000)

  // 18 ay = 2 akademik yıl (yukarı yuvarlama)
  const bucukYil = toplamMaliyet(mp({
    ogrenim_ucreti: 10000, para_birimi: 'EUR', ogrenim_ucreti_donem: 'yillik', sure_ay: 18,
  }))
  esit('18 ay iki yıl ücreti ödetiyor',
    bucukYil.kalemler.find((k) => k.ad === 'Öğrenim ücreti')?.euro, 20000)

  // Süre bilinmiyorsa yıllık ücret HESAPLANMIYOR — bir yıl saymak maliyeti yarıya indirirdi.
  const suresiz = toplamMaliyet(mp({
    ogrenim_ucreti: 10000, para_birimi: 'EUR', ogrenim_ucreti_donem: 'yillik', sure_ay: null,
  }))
  esit('süresiz programda yıllık ücret hesaba girmiyor', suresiz.euro, 0)
  kontrol('sebebi eksiklerde yazıyor',
    suresiz.eksikler.some((e) => e.includes('kaç yıl')), JSON.stringify(suresiz.eksikler))

  const toplamTip = toplamMaliyet(mp({
    ogrenim_ucreti: 30000, para_birimi: 'EUR', ogrenim_ucreti_donem: 'toplam', sure_ay: 24,
  }))
  esit('"toplam" tipinde yılla çarpılmıyor', toplamTip.euro, 30000)

  const ectsTip = toplamMaliyet(mp({
    ogrenim_ucreti: 150, para_birimi: 'EUR', ogrenim_ucreti_donem: 'ects', ects: 120,
  }))
  esit('ECTS başına ücret ECTS ile çarpılıyor', ectsTip.euro, 18000)

  // Yaşam gideri ülkeden × süre
  const yasam = toplamMaliyet(mp({
    sure_ay: 24,
    ulke: { kod: 'NL', ad: 'Hollanda', para_birimi: 'EUR', aylik_yasam_gideri: 1000 },
  }))
  esit('yaşam gideri 24 ayla çarpıldı',
    yasam.kalemler.find((k) => k.ad === 'Yaşam gideri')?.euro, 24000)

  // Farklı para birimleri EUR'da toplanıyor
  const karisik = toplamMaliyet(mp({
    ogrenim_ucreti: 120000, para_birimi: 'DKK', ogrenim_ucreti_donem: 'toplam',
    universite: uni({ basvuru_ucreti: 100, basvuru_ucreti_para: 'EUR' }),
    ulke: { kod: 'DK', ad: 'Danimarka', para_birimi: 'DKK', aylik_yasam_gideri: null },
  }))
  kontrol('DKK ücret EUR toplamına doğru giriyor',
    yakin(karisik.euro, 120000 * VARSAYILAN_KURLAR.DKK + 100, 0.01),
    String(karisik.euro))

  // Burs EKSİ kalem
  const burslu = toplamMaliyet(mp({
    ogrenim_ucreti: 20000, para_birimi: 'EUR', ogrenim_ucreti_donem: 'toplam',
    burs_tahmini: 5000, burs_tahmini_para: 'EUR',
  }))
  esit('burs toplamdan düşülüyor', burslu.euro, 15000)
  kontrol('burs kalemi eksi işaretli',
    burslu.kalemler.find((k) => k.ad === 'Burs (tahmini)')?.eksi === true)

  // Para birimi olmayan kalem hesaba girmiyor
  const birimsizUcret = toplamMaliyet(mp({
    ogrenim_ucreti: 20000, para_birimi: null, ogrenim_ucreti_donem: 'toplam',
  }))
  esit('para birimsiz ücret hesaba girmiyor', birimsizUcret.euro, 0)
  kontrol('sebebi eksiklerde',
    birimsizUcret.eksikler.some((e) => e.includes('para birimi')),
    JSON.stringify(birimsizUcret.eksikler))

  // Her şey girilmişse tam
  const tam = toplamMaliyet(mp({
    ogrenim_ucreti: 20000, para_birimi: 'EUR', ogrenim_ucreti_donem: 'toplam', sure_ay: 24,
    burs_tahmini: 5000, burs_tahmini_para: 'EUR',
    universite: uni({
      basvuru_ucreti: 100, basvuru_ucreti_para: 'EUR',
      depozito: 1000, depozito_para: 'EUR',
    }),
    ulke: { kod: 'NL', ad: 'Hollanda', para_birimi: 'EUR', aylik_yasam_gideri: 1000 },
  }))
  esit('tam veride toplam doğru', tam.euro, 20000 + 24000 + 100 + 1000 - 5000)
  kontrol('tam veride eksik yok', tam.tamMi, JSON.stringify(tam.eksikler))

  /* ── biçimleme ── */
  esit('paraYaz binlik ayracı ve simge', paraYaz(18500, 'EUR'), '18.500 €')
  esit('paraYaz boş değeri tire', paraYaz(null, 'EUR'), '—')
}

/* ════════════════════════════════════════════════════════════════ özet */
console.log(`\n  ${gecti} geçti, ${kalanlar.length} kaldı.\n`)
if (kalanlar.length > 0) {
  for (const k of kalanlar) console.log(`    ✗ ${k}`)
  console.log('')
  process.exit(1)
}
