'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  oturumAc, oturumKapat, oturumZorunlu, parolaDogru, korumaHazirMi,
} from '@/lib/auth'
import {
  dogrulaUlke, dogrulaUniversite, dogrulaProgram, formVerisiniOku,
} from '@/lib/dogrula'
import {
  ulkeKaydet as ulkeYaz, ulkeSil, ulkeGetir, ulkeAlanGuncelle,
  universiteEkle, universiteGuncelle, universiteSil, universiteAlanGuncelle,
  programEkle, programGuncelle, programSil, programAlanGuncelle,
  programBelgeleriniEsitle, programBelgeIsaretle,
  havuzGuncelle, ayarKaydet, universiteleriGetir,
  yedektenYukle, type Yedek,
} from '@/lib/sorgular'
import { HAVUZ_DURUMLARI, type HavuzDurum } from '@/lib/tipler'
import { KUR_ANAHTARI, VARSAYILAN_KUR_AYARI, kurAyariniDogrula } from '@/lib/para'
import { PARA_BIRIMLERI } from '@/lib/sabitler'
import {
  yzHazirMi, yzIleAyristir, kullanilabilirSaglayicilar, SAGLAYICI_ADLARI,
} from '@/lib/ayristir-yz'
import { dosyadanMetin } from '@/lib/dosya-metin'
import { EN_BUYUK_DOSYA } from '@/lib/dosya-sabitleri'
import { bugun } from '@/lib/tarih'
import { sadelestir } from '@/lib/metin'
import type { AyristirmaSonucu, Saglayici } from '@/lib/tipler'

/**
 * Server action'lar — istemciden çağrılabilen tek yazma yolu.
 *
 * Yazan her action `oturumZorunlu()` ile BAŞLAR. Layout korumasına güvenmek
 * yetmez: action'lar layout'tan geçmeden doğrudan POST edilebilir.
 *
 * Dönüş sözleşmesi: form action'ları `{ hata }` / `{ hatalar }` döndürür,
 * form bunu useActionState ile gösterir. Başarıda ya `redirect()` çağrılır
 * ya da `{ tamam: true }` döner.
 */

export type EylemSonucu = {
  tamam?: boolean
  hata?: string
  hatalar?: Record<string, string>
  mesaj?: string
}

/** Beklenmeyen hataları kullanıcıya okunur biçimde geçir. */
function hataMetni(e: unknown): string {
  if (e instanceof Error) return e.message
  return 'Beklenmeyen bir hata oldu.'
}

/**
 * `redirect()` içeride NEXT_REDIRECT fırlatır — try/catch'in yutmasına izin
 * verirsek yönlendirme sessizce çalışmaz ve kullanıcı formda kalır.
 */
function yonlendirmeyseFirlat(e: unknown): void {
  if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
  if (typeof e === 'object' && e !== null && 'digest' in e
      && String((e as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')) throw e
}

/* ═══════════════════════════════════════════════════════════════ oturum */

export async function girisYap(_onceki: EylemSonucu, fd: FormData): Promise<EylemSonucu> {
  if (!korumaHazirMi()) {
    return { hata: 'Kurulum tamamlanmamış: APP_PAROLA ve OTURUM_GIZLI değerleri eksik.' }
  }

  const parola = String(fd.get('parola') ?? '')
  if (!parola) return { hata: 'Parolayı gir.' }

  if (!parolaDogru(parola)) {
    // Kaba kuvvet denemesini yavaşlatan küçük gecikme. Tek kullanıcılı bir
    // uygulamada tam bir hız sınırlayıcı fazla; bu kadarı caydırıcı.
    await new Promise((c) => setTimeout(c, 700))
    return { hata: 'Parola yanlış.' }
  }

  await oturumAc()
  redirect('/')
}

export async function cikisYap(): Promise<void> {
  await oturumKapat()
  redirect('/giris')
}

/* ═══════════════════════════════════════════════════════════════ ülkeler */

/**
 * Ülke ekler ya da günceller.
 *
 * `duzenleme` alanı formdan geliyor. Veritabanı katmanı upsert yapıyor
 * (birincil anahtar kullanıcının seçtiği ISO kodu), ama YENİ kayıtta bu
 * tehlikeli olurdu: aynı ülkeyi ikinci kez ekleyen kullanıcı var olan
 * kaydının üstüne yazar ve göç yolu notlarını kaybeder. O yüzden ekleme
 * yolunda önce varlık kontrolü yapılıyor.
 */
export async function ulkeKaydet(_onceki: EylemSonucu, fd: FormData): Promise<EylemSonucu> {
  try {
    await oturumZorunlu()

    const duzenleme = String(fd.get('duzenleme') ?? '') === '1'
    const sonuc = dogrulaUlke(formVerisiniOku(fd, 'ulke'))

    if (!sonuc.gecerli) {
      return { hatalar: sonuc.hatalar, hata: 'Bazı alanları düzeltmen gerekiyor.' }
    }

    if (!duzenleme && (await ulkeGetir(sonuc.veri.kod))) {
      return {
        hatalar: { kod: 'Bu ülke zaten kayıtlı.' },
        hata: `${sonuc.veri.ad} zaten listende var. Üstüne yazmak yerine mevcut kaydı düzenle.`,
      }
    }

    await ulkeYaz(sonuc.veri)

    revalidatePath('/', 'layout')
    redirect(`/ulkeler/${sonuc.veri.kod}`)
  } catch (e) {
    yonlendirmeyseFirlat(e)
    return { hata: hataMetni(e) }
  }
}

export async function ulkeSilEylem(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const kod = String(fd.get('kod') ?? '').trim()
  if (!kod) throw new Error('Silinecek kayıt belirtilmedi.')

  // Altında üniversite varsa `on delete restrict` engelliyor; lib/sorgular.ts
  // hatayı Türkçe açıklamaya çeviriyor.
  await ulkeSil(kod)
  revalidatePath('/', 'layout')
  redirect('/ulkeler')
}

/** Detaydan tek tıkla durum değiştirme — formu açmadan. */
export async function ulkeDurumDegistir(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const kod = String(fd.get('kod') ?? '')
  const durum = String(fd.get('durum') ?? '')
  if (!kod || !durum) return

  await ulkeAlanGuncelle(kod, 'durum', durum)
  revalidatePath('/', 'layout')
}

export async function ulkeOncelikDegistir(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const kod = String(fd.get('kod') ?? '')
  const oncelik = Number(fd.get('oncelik'))
  if (!kod || ![1, 2, 3].includes(oncelik)) return

  await ulkeAlanGuncelle(kod, 'oncelik', oncelik)
  revalidatePath('/', 'layout')
}

/* ══════════════════════════════════════════════════════════ üniversiteler */

/**
 * Üniversite ekler ya da günceller.
 *
 * `ulke_kodu` doğrulaması İKİ AŞAMALI: `lib/dogrula.ts` kodun ISO
 * kataloğunda olduğunu kontrol ediyor, burada ise o ülkenin gerçekten KAYITLI
 * olduğuna bakılıyor. İkincisi olmasa veritabanı yabancı anahtar hatası
 * verirdi ve kullanıcı "gösterilen kayıt bulunamadı (23503)" gibi bir mesajla
 * baş başa kalırdı — oysa yapması gereken şey basit: önce ülkeyi eklemek.
 */
export async function universiteKaydet(
  _onceki: EylemSonucu,
  fd: FormData,
): Promise<EylemSonucu> {
  try {
    await oturumZorunlu()

    const id = String(fd.get('id') ?? '').trim()
    const sonuc = dogrulaUniversite(formVerisiniOku(fd, 'universite'))

    if (!sonuc.gecerli) {
      return { hatalar: sonuc.hatalar, hata: 'Bazı alanları düzeltmen gerekiyor.' }
    }

    if (!(await ulkeGetir(sonuc.veri.ulke_kodu))) {
      return {
        hatalar: { ulke_kodu: 'Bu ülke henüz kayıtlı değil.' },
        hata: 'Üniversiteyi bağlayacağın ülkeyi önce Ülkeler ekranından ekle.',
      }
    }

    let hedefId: string
    if (id) {
      await universiteGuncelle(id, sonuc.veri)
      hedefId = id
    } else {
      hedefId = await universiteEkle(sonuc.veri)
    }

    revalidatePath('/', 'layout')
    redirect(`/universiteler/${hedefId}`)
  } catch (e) {
    yonlendirmeyseFirlat(e)
    return { hata: hataMetni(e) }
  }
}

export async function universiteSilEylem(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const id = String(fd.get('id') ?? '').trim()
  if (!id) throw new Error('Silinecek kayıt belirtilmedi.')

  // Altındaki programlar ON DELETE CASCADE ile birlikte gider.
  await universiteSil(id)
  revalidatePath('/', 'layout')
  redirect('/universiteler')
}

export async function universiteDurumDegistir(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const id = String(fd.get('id') ?? '')
  const durum = String(fd.get('durum') ?? '')
  if (!id || !durum) return

  await universiteAlanGuncelle(id, 'durum', durum)
  revalidatePath('/', 'layout')
}

export async function universiteOncelikDegistir(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const id = String(fd.get('id') ?? '')
  const oncelik = Number(fd.get('oncelik'))
  if (!id || ![1, 2, 3].includes(oncelik)) return

  await universiteAlanGuncelle(id, 'oncelik', oncelik)
  revalidatePath('/', 'layout')
}

/* ═════════════════════════════════════════════════════════════ programlar */

/**
 * Program ekler ya da günceller.
 *
 * Kaydetmenin ikinci yarısı `programBelgeleriniEsitle`: belge listesinden
 * çıkarılan bir kalemin "hazır" işareti veritabanında öksüz kalırsa, aynı
 * belge ileride yeniden eklendiğinde eski işaret hayalet gibi geri gelir ve
 * hazır olmayan bir evrak hazır görünür.
 */
export async function programKaydet(_onceki: EylemSonucu, fd: FormData): Promise<EylemSonucu> {
  try {
    await oturumZorunlu()

    const id = String(fd.get('id') ?? '').trim()
    const sonuc = dogrulaProgram(formVerisiniOku(fd, 'program'))

    if (!sonuc.gecerli) {
      return { hatalar: sonuc.hatalar, hata: 'Bazı alanları düzeltmen gerekiyor.' }
    }

    let hedefId: string
    if (id) {
      await programGuncelle(id, sonuc.veri)
      await programBelgeleriniEsitle(id, sonuc.veri.belgeler)
      hedefId = id
    } else {
      hedefId = await programEkle(sonuc.veri)
    }

    revalidatePath('/', 'layout')
    redirect(`/programlar/${hedefId}`)
  } catch (e) {
    yonlendirmeyseFirlat(e)
    return { hata: hataMetni(e) }
  }
}

export async function programSilEylem(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const id = String(fd.get('id') ?? '').trim()
  if (!id) throw new Error('Silinecek kayıt belirtilmedi.')

  // program_belgeler satırları ON DELETE CASCADE ile birlikte gider.
  await programSil(id)
  revalidatePath('/', 'layout')
  redirect('/programlar')
}

export async function programDurumDegistir(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const id = String(fd.get('id') ?? '')
  const durum = String(fd.get('durum') ?? '')
  if (!id || !durum) return

  await programAlanGuncelle(id, 'durum', durum)
  revalidatePath('/', 'layout')
}

export async function programOncelikDegistir(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const id = String(fd.get('id') ?? '')
  const oncelik = Number(fd.get('oncelik'))
  if (!id || ![1, 2, 3].includes(oncelik)) return

  await programAlanGuncelle(id, 'oncelik', oncelik)
  revalidatePath('/', 'layout')
}

/**
 * Uygunluk ışığını tek tıkla değiştirme.
 *
 * Ayrı bir action olarak duruyor çünkü uygunluk süreç durumundan farklı bir
 * şey: durum "nerede olduğun", uygunluk "girebilir misin". İkisini tek
 * alanda toplamak, elenmiş bir programı "vazgeçtim" ile karıştırmak olurdu.
 */
export async function programUygunlukDegistir(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const id = String(fd.get('id') ?? '')
  const uygunluk = String(fd.get('uygunluk') ?? '')
  if (!id || !uygunluk) return

  await programAlanGuncelle(id, 'uygunluk', uygunluk)
  revalidatePath('/', 'layout')
}

/** Detaydaki belge kontrol listesinden tek kutu işaretleme. */
export async function programBelgeDegistir(fd: FormData): Promise<void> {
  await oturumZorunlu()
  const programId = String(fd.get('program_id') ?? '')
  const belgeKodu = String(fd.get('belge_kodu') ?? '')
  if (!programId || !belgeKodu) return

  await programBelgeIsaretle(programId, belgeKodu, String(fd.get('hazir') ?? '') === '1')
  revalidatePath('/', 'layout')
}

/* ═══════════════════════════════════════════════════════════ belge havuzu */

/**
 * Elindeki kalıcı belgenin durumunu günceller.
 *
 * `gecerlilik_bitis` belge takviminin en pahalı girdisi: IELTS'i "hazır"
 * işaretleyip geçerlilik tarihini boş bırakmak, süresi dolmuş bir sertifikayı
 * geçerli saydırır ve hazırlık süresini 90 günden 3 güne indirir — yani
 * uygulamayı yalan söyletir. Bu yüzden 'hazir' seçildiğinde tarih İSTENİYOR
 * (zorunlu değil ama arayüz üsteliyor).
 */
export async function havuzGuncelleEylem(
  _onceki: EylemSonucu,
  fd: FormData,
): Promise<EylemSonucu> {
  try {
    await oturumZorunlu()

    const kod = String(fd.get('belge_kodu') ?? '').trim()
    if (!kod) return { hata: 'Belge belirtilmedi.' }

    const ham = String(fd.get('durum') ?? '')
    const durum = (HAVUZ_DURUMLARI.some((d) => d.kod === ham) ? ham : 'yok') as HavuzDurum

    const tarih = String(fd.get('gecerlilik_bitis') ?? '').trim()
    const gecerlilik = /^\d{4}-\d{2}-\d{2}$/.test(tarih) ? tarih : null

    const notlar = String(fd.get('notlar') ?? '').trim() || null

    await havuzGuncelle(kod, durum, gecerlilik, notlar)
    revalidatePath('/', 'layout')
    return { tamam: true, mesaj: 'Kaydedildi.' }
  } catch (e) {
    yonlendirmeyseFirlat(e)
    return { hata: hataMetni(e) }
  }
}

/* ═══════════════════════════════════════════════════════════════ kurlar */

/**
 * Kur tablosunu günceller.
 *
 * Form "1 EUR = N birim" olarak soruyor çünkü kurlar günlük hayatta böyle
 * yazılıyor (1 EUR = 55,96 TRY). Veritabanına ise ters çevrilmiş hâli, yani
 * "1 birim kaç EUR eder" yazılıyor — `lib/para.ts` hesabı o yönde yapıyor.
 * Çevrimi burada yapmak, kullanıcının kafasında ters çevirmesinden iyi.
 *
 * EUR her zaman 1: taban o, düzenlenemiyor.
 */
export async function kurKaydetEylem(
  _onceki: EylemSonucu,
  fd: FormData,
): Promise<EylemSonucu> {
  try {
    await oturumZorunlu()

    const kurlar: Record<string, number> = { EUR: 1 }
    const bozuk: string[] = []

    for (const p of PARA_BIRIMLERI) {
      if (p.kod === 'EUR') continue
      const ham = String(fd.get(`kur_${p.kod}`) ?? '').trim().replace(',', '.')
      if (!ham) continue

      const euroBasina = Number(ham)
      if (!Number.isFinite(euroBasina) || euroBasina <= 0) { bozuk.push(p.kod); continue }
      // "1 EUR = N birim" → "1 birim = 1/N EUR"
      kurlar[p.kod] = 1 / euroBasina
    }

    if (bozuk.length > 0) {
      return { hata: `Şu para birimlerinde geçersiz değer var: ${bozuk.join(', ')}` }
    }

    const tarihHam = String(fd.get('tarih') ?? '').trim()
    const tarih = /^\d{4}-\d{2}-\d{2}$/.test(tarihHam)
      ? tarihHam
      : VARSAYILAN_KUR_AYARI.tarih

    await ayarKaydet(KUR_ANAHTARI, kurAyariniDogrula({ kurlar, tarih }))
    revalidatePath('/', 'layout')
    return { tamam: true, mesaj: 'Kurlar kaydedildi.' }
  } catch (e) {
    yonlendirmeyseFirlat(e)
    return { hata: hataMetni(e) }
  }
}

/** Kurları koddaki başlangıç değerlerine döndür. */
export async function kurSifirlaEylem(): Promise<void> {
  await oturumZorunlu()
  await ayarKaydet(KUR_ANAHTARI, VARSAYILAN_KUR_AYARI)
  revalidatePath('/', 'layout')
}

/* ═══════════════════════════════════════════════ metinden ayrıştırma (Aşama 11) */

export type AyristirmaEylemSonucu = {
  hata?: string
  sonuc?: AyristirmaSonucu
  /** Ayrıştırıcının bulduğu üniversite adı kayıtlıysa onun id'si. */
  universiteId?: string
  /** Kayıtlı değilse: Kullanıcıya "önce üniversiteyi ekle" demek için. */
  eslesmeyenUniversite?: string
}

/**
 * Yapıştırılan metni ya da yüklenen dosyayı Claude'a okutup taslak çıkarır.
 *
 * HİÇBİR ŞEY KAYDETMEZ — çıktı forma doldurulur, kaydete kullanıcı basar.
 * Bu yüzden burada `revalidatePath` de yok.
 */
export async function metinAyristirEylem(
  _onceki: AyristirmaEylemSonucu,
  fd: FormData,
): Promise<AyristirmaEylemSonucu> {
  try {
    await oturumZorunlu()

    if (!yzHazirMi()) {
      return { hata: 'Ne ANTHROPIC_API_KEY ne GEMINI_API_KEY tanımlı. Metinden ekleme kapalı; programı elle ekleyebilirsin.' }
    }

    /* Formdan gelen sağlayıcı adı doğrudan kullanılmıyor: istemciden gelen
       her değer gibi listeye karşı sınanıyor. */
    const istenenHam = String(fd.get('saglayici') ?? '')
    const acik = kullanilabilirSaglayicilar()
    const istenen = acik.find((s) => s === istenenHam) as Saglayici | undefined

    /* Dosya varsa o kazanır: Kullanıcı hem yapıştırıp hem dosya seçtiyse
       dosyayı seçmiş olması daha yeni bir niyet. */
    let metin = String(fd.get('metin') ?? '')
    const dosya = fd.get('dosya')
    if (dosya instanceof File && dosya.size > 0) {
      const cikarma = await dosyadanMetin(dosya)
      if (!cikarma.tamam) return { hata: cikarma.hata }
      metin = cikarma.metin
    }

    if (!metin.trim()) {
      return { hata: 'Ayrıştırılacak metin yok. Sayfayı yapıştır ya da dosya yükle.' }
    }

    const sonuc = await yzIleAyristir(metin, bugun(), istenen)

    /* Üniversite adını kayıtlılarla eşle — form id ile çalışıyor, adla değil. */
    const aranan = sonuc.taslak.universite_adi?.deger
    let universiteId: string | undefined
    let eslesmeyenUniversite: string | undefined
    if (aranan) {
      const hepsi = await universiteleriGetir()
      const sade = sadelestir(aranan)
      const eslesen = hepsi.find((u) => sadelestir(u.ad) === sade)
        ?? hepsi.find((u) => sadelestir(u.ad).includes(sade) || sade.includes(sadelestir(u.ad)))
      if (eslesen) universiteId = eslesen.id
      else eslesmeyenUniversite = aranan
    }

    return { sonuc, universiteId, eslesmeyenUniversite }
  } catch (e) {
    yonlendirmeyseFirlat(e)
    return { hata: okunanSaglayiciHatasi(e, fd) }
  }
}

/**
 * Sağlayıcı hatasına "diğerini dene" ipucu ekler.
 *
 * NEDEN: anahtarın TANIMLI olması çalıştığı anlamına gelmiyor. Furkan'ın
 * Gemini anahtarı iptal edildi ama değer Vercel'de kaldı; uygulama Gemini'yi
 * seçenek olarak sunmaya devam etti ve her deneme hatayla bitti. Kullanıcı
 * ekranda kalakalıyordu — oysa çalışan bir sağlayıcı bir tık ötedeydi.
 *
 * Otomatik olarak diğerine geçmiyoruz: bu bir yapılandırma sorunu ve sessiz
 * yedekleme onu kalıcı olarak gizlerdi. Sorun görünür kalsın, kullanıcı
 * tıkanmasın.
 */
function okunanSaglayiciHatasi(e: unknown, fd: FormData): string {
  const mesaj = hataMetni(e)
  const secilen = String(fd.get('saglayici') ?? '')
  const digerleri = kullanilabilirSaglayicilar().filter((s) => s !== secilen)
  if (!secilen || digerleri.length === 0) return mesaj

  const adlar = digerleri.map((s) => SAGLAYICI_ADLARI[s]).join(' ya da ')
  return `${mesaj} ${adlar} ile deneyebilirsin — yukarıdan seçip tekrar gönder.`
}

/* ════════════════════════════════════════════════ yedekleme (Aşama 14) */

/**
 * Yedek dosyasından geri yükleme.
 *
 * İndirme tarafı `/api/yedek` uç noktasında (tarayıcının dosya indirmesi
 * için `Content-Disposition` gerekiyordu). Geri yükleme burada, çünkü
 * yazma işlemi ve `oturumZorunlu()` sözleşmesine tabi.
 *
 * `temizle` işaretlenmezse ÜSTÜNE YAZAR: aynı id varsa günceller, yoksa
 * ekler. İşaretlenirse önce her şeyi siler. Varsayılan üstüne yazmak —
 * yanlışlıkla veri silmek geri alınamaz, birleştirmek alınabilir.
 */
export async function yedekYukleEylem(
  _onceki: EylemSonucu,
  fd: FormData,
): Promise<EylemSonucu> {
  try {
    await oturumZorunlu()

    const dosya = fd.get('yedek')
    if (!(dosya instanceof File) || dosya.size === 0) {
      return { hata: 'Yedek dosyası seçilmedi.' }
    }
    if (dosya.size > EN_BUYUK_DOSYA) {
      return { hata: `Dosya çok büyük (${Math.round(dosya.size / 1024 / 1024)} MB). Sınır 10 MB.` }
    }

    let cozulmus: unknown
    try {
      cozulmus = JSON.parse(await dosya.text())
    } catch {
      return { hata: 'Dosya okunamadı — geçerli bir JSON değil. /api/yedek ile indirdiğin dosyayı seç.' }
    }

    /* Sürüm kontrolü: ileride şema değişirse eski yedeği sessizce yarım
       yüklemek yerine burada durmalı. */
    const y = cozulmus as Partial<Yedek>
    if (!y || typeof y !== 'object' || y.surum !== 1) {
      return { hata: 'Bu dosya bir Program Takip yedeği değil (sürüm bilgisi yok).' }
    }
    if (!Array.isArray(y.ulkeler) || !Array.isArray(y.programlar)) {
      return { hata: 'Yedek dosyası eksik görünüyor — ülke ya da program listesi yok.' }
    }

    const temizle = fd.get('temizle') === 'evet'
    const sayim = await yedektenYukle(cozulmus as Yedek, temizle)

    revalidatePath('/', 'layout')
    return {
      tamam: true,
      mesaj: `Geri yüklendi: ${sayim.ulke} ülke, ${sayim.universite} üniversite, `
        + `${sayim.program} program, ${sayim.belge} belge işareti, ${sayim.havuz} havuz kaydı.`,
    }
  } catch (e) {
    yonlendirmeyseFirlat(e)
    return { hata: hataMetni(e) }
  }
}
