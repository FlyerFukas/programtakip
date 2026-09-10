import type { ProgramGenis, ProgramBelge, HavuzBelge, HavuzDurum } from './tipler'
import { BELGELER, BELGE_BEKLEYEN_DURUMLAR, belgeBul, type BelgeKalicilik } from './sabitler'
import {
  etkinBaslangic, kalanGun, hazirlikDurumu, bugun, tarihKisa,
  type HazirlikDurumu,
} from './tarih'

/**
 * Belge takvimi — "hangi belgeyi hangi tarihe kadar hazırlamalıyım?"
 *
 * Program listesi ülke ülke bakmayı sağlıyor ama asıl iş yükü belge
 * tarafında: beş ayrı programın beşi de transkript istiyorsa transkripti bir
 * kere alırsın, ama EN ERKEN son tarihe yetiştirmen gerekir. Bu dosya veriyi
 * program ekseninden BELGE eksenine çeviriyor.
 *
 * Kritik nokta HAZIRLIK SÜRESİ (PROJE.md §6.3): IELTS sonucu ~90 gün alıyorsa,
 * 60 gün sonraki bir son tarih için "60 gün var" demek yanıltıcıdır — çoktan
 * gecikmişsindir. Her satır bu yüzden son tarihi değil, BAŞLAMA tarihini
 * gösteriyor.
 */

/**
 * Elinde hazır duran bir belgeyi başvuruya eklemek için ayrılan pay.
 * Fotokopi çekmek, taratmak, portala yüklemek — birkaç gün (PROJE.md §6.4).
 */
export const EKLEME_SURESI = 3

export type BelgeProgramSatiri = {
  program_id: string
  program_ad: string
  universite_ad: string
  ulke_kodu: string
  durum: string
  /** Belgenin yetişmesi gereken gün — programın etkin tarihi. */
  hedefTarih: string | null
  kalan: number | null
  /** Bu program özelinde hazır işaretlenmiş mi. */
  hazir: boolean
  notlar: string | null
}

export type BelgeSatiri = {
  kod: string
  ad: string
  simge: string
  aciklama?: string
  kalicilik: BelgeKalicilik
  /** Bu satır için geçerli hazırlık süresi — havuzda hazırsa EKLEME_SURESI. */
  hazirlikGun: number
  /** Belgenin sözlükteki tam hazırlık süresi — kısalmanın ne kadar olduğunu göstermek için. */
  tamHazirlikGun: number

  /** Bu belgeyi isteyen açık programlar, en acil önce. */
  programlar: BelgeProgramSatiri[]
  toplam: number
  tamamlanan: number

  /** En yakın hedef tarih (henüz hazır olmayanlardan). */
  enYakinTarih: string | null
  kalan: number | null

  /** Bu belgeye en geç ne zaman başlamalısın. */
  baslamaTarihi: string | null
  hazirlik: HazirlikDurumu
  payGun: number | null

  /** Havuz belgeleri için elindeki genel durum. */
  havuzDurum: HavuzDurum
  /** Elinde GEÇERLİ hâliyle duruyor mu — hazırlık süresi bu yüzden kısaldı mı. */
  elindeGecerli: boolean
  gecerlilikBitis: string | null
  /** Geçerliliği dolmuş / başvurudan önce dolacak mı (IELTS 2 yıl gibi). */
  gecerlilikUyarisi: string | null

  /** Her şey tamam mı — listede soluk gösterilir. */
  bitti: boolean
}

/* ═════════════════════════════════════════════════════════════ hesaplama */

export function belgeTakvimi(
  programlar: ProgramGenis[],
  programBelgeleri: ProgramBelge[],
  havuz: HavuzBelge[],
): BelgeSatiri[] {
  /*
   * Yalnızca hâlâ belge toplanan programlar (PROJE.md §4.7).
   *
   * Sonuçlanmışlar (kabul/kayıt/red/elendi) bir yana, BAŞVURUSU GÖNDERİLMİŞ
   * olanlar da dışarıda: onların belgeleri teslim edilmiştir, "geciktin"
   * demek yanlış alarmdır ve gerçek acil işleri gölgeler.
   */
  const acik = programlar.filter((p) => BELGE_BEKLEYEN_DURUMLAR.includes(p.durum))

  const hazirHarita = new Map(
    programBelgeleri.map((x) => [`${x.program_id}|${x.belge_kodu}`, x]),
  )
  const havuzHarita = new Map(havuz.map((h) => [h.belge_kodu, h]))

  /* belge kodu → onu isteyen programlar */
  const gruplar = new Map<string, BelgeProgramSatiri[]>()

  for (const p of acik) {
    const hedef = etkinBaslangic(p)
    for (const kod of p.belgeler) {
      const kayit = hazirHarita.get(`${p.id}|${kod}`)
      const satir: BelgeProgramSatiri = {
        program_id: p.id,
        program_ad: p.ad,
        universite_ad: p.universite.ad,
        ulke_kodu: p.universite.ulke_kodu,
        durum: p.durum,
        hedefTarih: hedef,
        kalan: kalanGun(hedef),
        hazir: kayit?.hazir ?? false,
        notlar: kayit?.notlar ?? null,
      }
      const mevcut = gruplar.get(kod)
      if (mevcut) mevcut.push(satir)
      else gruplar.set(kod, [satir])
    }
  }

  const satirlar: BelgeSatiri[] = []

  for (const [kod, programSatirlari] of gruplar) {
    const tanim = belgeBul(kod)
    const havuzKayit = havuzHarita.get(kod)
    const tamHazirlikGun = tanim?.hazirlikGun ?? 14

    /*
     * Elinde HAZIR duran kalıcı bir belgenin (pasaport, transkript) hazırlık
     * süresi yoktur — onu üretmen değil, başvuruya eklemen gerekiyor. 90
     * günlük IELTS hazırlığını elindeki geçerli sertifikaya uygulamak
     * "geciktin" diye yanlış alarm üretirdi (PROJE.md §6.4).
     *
     * Geçerliliği DOLMUŞ belge elinde sayılmaz: tam hazırlık süresi geri gelir.
     */
    const elindeGecerli =
      tanim?.kalicilik === 'havuz'
      && havuzKayit?.durum === 'hazir'
      && (havuzKayit.gecerlilik_bitis === null
          || (kalanGun(havuzKayit.gecerlilik_bitis) ?? 0) >= 0)

    const hazirlikGun = elindeGecerli ? EKLEME_SURESI : tamHazirlikGun

    // En acil program önce; tarihi olmayanlar sona.
    programSatirlari.sort((a, b) => {
      if (a.hedefTarih && b.hedefTarih) return a.hedefTarih.localeCompare(b.hedefTarih)
      if (a.hedefTarih) return -1
      if (b.hedefTarih) return 1
      return a.program_ad.localeCompare(b.program_ad, 'tr')
    })

    /*
     * En yakın tarih HENÜZ HAZIR OLMAYAN programlardan hesaplanır: o program
     * için belgeyi zaten teslim ettiysen artık baskı yaratmamalı.
     */
    const bekleyenler = programSatirlari.filter((x) => !x.hazir && x.hedefTarih)
    const enYakinTarih = bekleyenler.length > 0 ? bekleyenler[0].hedefTarih : null

    const hazirlik = hazirlikDurumu(enYakinTarih, hazirlikGun)
    const havuzDurum: HavuzDurum = havuzKayit?.durum ?? 'yok'

    const tamamlanan = programSatirlari.filter((x) => x.hazir).length
    const toplam = programSatirlari.length

    satirlar.push({
      kod,
      ad: tanim?.ad ?? kod,
      simge: tanim?.simge ?? '📎',
      aciklama: tanim?.aciklama,
      kalicilik: tanim?.kalicilik ?? 'ozel',
      hazirlikGun,
      tamHazirlikGun,
      programlar: programSatirlari,
      toplam,
      tamamlanan,
      enYakinTarih,
      kalan: kalanGun(enYakinTarih),
      baslamaTarihi: hazirlik.baslamaTarihi,
      hazirlik: hazirlik.durum,
      payGun: hazirlik.payGun,
      havuzDurum,
      elindeGecerli: Boolean(elindeGecerli),
      gecerlilikBitis: havuzKayit?.gecerlilik_bitis ?? null,
      gecerlilikUyarisi: gecerlilikUyar(havuzKayit?.gecerlilik_bitis ?? null, enYakinTarih),
      bitti:
        tamamlanan === toplam
        || (tanim?.kalicilik === 'havuz' && havuzDurum === 'hazir' && bekleyenler.length === 0),
    })
  }

  return satirlar.sort(belgeSiralamasi)
}

/**
 * Sıralama: gecikenler en üstte, sonra başlaması gerekenler, sonra rahat
 * olanlar. Aynı gruptaysa en yakın tarihli önce. Bitmiş işler en sonda.
 */
function belgeSiralamasi(a: BelgeSatiri, b: BelgeSatiri): number {
  if (a.bitti !== b.bitti) return a.bitti ? 1 : -1

  const agirlik: Record<HazirlikDurumu, number> = { gecikti: 0, basla: 1, rahat: 2, gecersiz: 3 }
  const fark = agirlik[a.hazirlik] - agirlik[b.hazirlik]
  if (fark !== 0) return fark

  if (a.enYakinTarih && b.enYakinTarih) return a.enYakinTarih.localeCompare(b.enYakinTarih)
  if (a.enYakinTarih) return -1
  if (b.enYakinTarih) return 1

  return b.toplam - a.toplam
}

/**
 * IELTS/TOEFL sonucu 2 yıl geçerli. Belgen son tarihten ÖNCE geçersizleşecekse
 * yeniden sınava girmen gerekir — bunu önceden söylemek işin bütün amacı
 * (PROJE.md §10 kabul kriteri).
 */
function gecerlilikUyar(gecerlilikBitis: string | null, hedefTarih: string | null): string | null {
  if (!gecerlilikBitis) return null

  const kalanGecerlilik = kalanGun(gecerlilikBitis)
  if (kalanGecerlilik === null) return null

  if (kalanGecerlilik < 0) {
    return `Geçerliliği ${Math.abs(kalanGecerlilik)} gün önce doldu — yenilemen gerekiyor.`
  }
  if (hedefTarih && gecerlilikBitis < hedefTarih) {
    return `Son başvuru tarihinden ÖNCE (${tarihKisa(gecerlilikBitis)}) geçerliliği doluyor — yenile.`
  }
  if (kalanGecerlilik <= 90) {
    return `Geçerliliğine ${kalanGecerlilik} gün kaldı.`
  }
  return null
}

/* ══════════════════════════════════════════════════════════ panel özetleri */

/** Panelde gösterilecek "şimdi elini çabuk tut" listesi. */
export function acilBelgeler(takvim: BelgeSatiri[], adet = 6): BelgeSatiri[] {
  return takvim
    .filter((s) => !s.bitti && (s.hazirlik === 'gecikti' || s.hazirlik === 'basla'))
    .slice(0, adet)
}

/**
 * Bir programın kendi belge listesi — detay sayfasındaki onay kutuları.
 *
 * Havuzda hazır olan belgeler otomatik "hazır" sayılMAZ ama "elinde var"
 * bilgisi gösterilir; teslim etmek yine senin işin. Otomatik işaretlemek,
 * yüklemediğin bir evrakı yüklenmiş göstermek olurdu.
 */
export function programBelgeListesi(
  program: Pick<ProgramGenis, 'id' | 'belgeler' | 'son_tarih_tipi' | 'son_tarih'
    | 'son_tarih_baslangic' | 'son_tarih_bitis' | 'basvuru_turlari'>,
  programBelgeleri: ProgramBelge[],
  havuz: HavuzBelge[],
): {
  kod: string
  ad: string
  simge: string
  aciklama?: string
  kalicilik: BelgeKalicilik
  hazir: boolean
  notlar: string | null
  havuzDurum: HavuzDurum
  elindeGecerli: boolean
  hazirlikGun: number
  hazirlik: HazirlikDurumu
  baslamaTarihi: string | null
  payGun: number | null
}[] {
  const hazirHarita = new Map(
    programBelgeleri.filter((x) => x.program_id === program.id).map((x) => [x.belge_kodu, x]),
  )
  const havuzHarita = new Map(havuz.map((h) => [h.belge_kodu, h]))
  const hedef = etkinBaslangic(program)

  return program.belgeler.map((kod) => {
    const tanim = belgeBul(kod)
    const kayit = hazirHarita.get(kod)
    const havuzKayit = havuzHarita.get(kod)

    const elindeGecerli =
      tanim?.kalicilik === 'havuz'
      && havuzKayit?.durum === 'hazir'
      && (havuzKayit.gecerlilik_bitis === null
          || (kalanGun(havuzKayit.gecerlilik_bitis) ?? 0) >= 0)

    const hazirlikGun = elindeGecerli ? EKLEME_SURESI : tanim?.hazirlikGun ?? 14
    const h = hazirlikDurumu(hedef, hazirlikGun)

    return {
      kod,
      ad: tanim?.ad ?? kod,
      simge: tanim?.simge ?? '📎',
      aciklama: tanim?.aciklama,
      kalicilik: tanim?.kalicilik ?? 'ozel',
      hazir: kayit?.hazir ?? false,
      notlar: kayit?.notlar ?? null,
      havuzDurum: havuzKayit?.durum ?? 'yok',
      elindeGecerli: Boolean(elindeGecerli),
      hazirlikGun,
      hazirlik: h.durum,
      baslamaTarihi: h.baslamaTarihi,
      payGun: h.payGun,
    }
  })
}

export type HavuzSatiri = {
  kod: string
  ad: string
  simge: string
  aciklama?: string
  durum: HavuzDurum
  gecerlilikBitis: string | null
  notlar: string | null
  /** Kaç program bu belgeyi istiyor. */
  istenen: number
  enYakinTarih: string | null
  gecerlilikUyarisi: string | null
}

/**
 * Havuz ekranı için: sistemdeki tüm kalıcı belgeler + elindeki durum.
 *
 * Hiçbir program istemese bile listede görünürler — IELTS'ini önden almak
 * isteyebilirsin ve o karar programlardan bağımsız.
 */
export function havuzListesi(havuz: HavuzBelge[], takvim: BelgeSatiri[]): HavuzSatiri[] {
  const havuzHarita = new Map(havuz.map((h) => [h.belge_kodu, h]))
  const takvimHarita = new Map(takvim.map((t) => [t.kod, t]))

  return BELGELER
    .filter((b) => b.kalicilik === 'havuz')
    .map((b) => {
      const kayit = havuzHarita.get(b.kod)
      const t = takvimHarita.get(b.kod)
      return {
        kod: b.kod,
        ad: b.ad,
        simge: b.simge ?? '📎',
        aciklama: b.aciklama,
        durum: kayit?.durum ?? 'yok',
        gecerlilikBitis: kayit?.gecerlilik_bitis ?? null,
        notlar: kayit?.notlar ?? null,
        istenen: t?.toplam ?? 0,
        enYakinTarih: t?.enYakinTarih ?? null,
        gecerlilikUyarisi: gecerlilikUyar(
          kayit?.gecerlilik_bitis ?? null,
          t?.enYakinTarih ?? null,
        ),
      }
    })
    .sort((a, b) => {
      // Önce bir programın istediği belgeler, sonra kalanlar.
      if ((a.istenen > 0) !== (b.istenen > 0)) return a.istenen > 0 ? -1 : 1
      if (a.enYakinTarih && b.enYakinTarih) return a.enYakinTarih.localeCompare(b.enYakinTarih)
      if (a.enYakinTarih) return -1
      if (b.enYakinTarih) return 1
      return a.ad.localeCompare(b.ad, 'tr')
    })
}

/** Panel sayaçları. */
export function takvimOzeti(takvim: BelgeSatiri[]) {
  return {
    geciken: takvim.filter((s) => !s.bitti && s.hazirlik === 'gecikti').length,
    baslamali: takvim.filter((s) => !s.bitti && s.hazirlik === 'basla').length,
    toplam: takvim.filter((s) => !s.bitti).length,
    bugunTarih: bugun(),
  }
}
