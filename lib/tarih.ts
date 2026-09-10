import type { Program, BasvuruTuru } from './tipler'
import { durumBul, SANA_ACIK_TURLAR } from './sabitler'

/**
 * Son tarih mantığı — uygulamanın kalbi.
 *
 * Zorluk şu: bir programın son tarihi "15 Ocak 2027" kadar net olabileceği
 * gibi "Ekim ortası – Aralık başı" kadar bulanık ya da hiç açıklanmamış da
 * olabilir. Üstüne bir de BAŞVURU TURLARI var: AB dışı ve AB başvuruları
 * ayrı günlerde kapanıyor. Bu dosya hepsini tek bir karşılaştırılabilir
 * büyüklüğe indiriyor (`etkinTarih`) ki sıralama ve "önümüzdeki 30 gün"
 * filtresi çalışsın.
 *
 * TARİH BİÇİMİ: her yerde 'YYYY-MM-DD' düz metin. Date nesnesi yalnızca
 * hesaplama anında üretiliyor ve yerel gece yarısına sabitleniyor — kullanıcı
 * "15 Ocak" derken Türkiye'deki 15 Ocak'ı kastediyor, UTC'yi değil.
 * (Sürücü tarafında da aynısı: `lib/veritabani.ts` `date` sütunlarını dizge
 * olarak okuyor.)
 */

const GUN_MS = 86_400_000

const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]
const AYLAR_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

/* ═══════════════════════════════════════════════════════ temel çeviriler */

/** 'YYYY-MM-DD' → yerel gece yarısına sabitlenmiş Date. Geçersizse null. */
export function tarihOku(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const [, y, a, g] = m
  const d = new Date(Number(y), Number(a) - 1, Number(g))
  // 31 Şubat gibi taşan tarihleri ele: JS sessizce ileri kaydırır.
  if (d.getFullYear() !== Number(y) || d.getMonth() !== Number(a) - 1 || d.getDate() !== Number(g)) {
    return null
  }
  return d
}

/** Date → 'YYYY-MM-DD' (yerel). */
export function tarihYaz(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Bugün, yerel saate göre 'YYYY-MM-DD'. */
export function bugun(): string {
  return tarihYaz(new Date())
}

/** "15 Ocak 2027". Geçersiz girdi ham haliyle döner — veri yutmaktan iyidir. */
export function tarihFormat(iso: string | null | undefined): string {
  const d = tarihOku(iso)
  if (!d) return iso ?? ''
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`
}

/** "15 Oca 2027" — dar sütunlar için. */
export function tarihKisa(iso: string | null | undefined): string {
  const d = tarihOku(iso)
  if (!d) return iso ?? ''
  return `${d.getDate()} ${AYLAR_KISA[d.getMonth()]} ${d.getFullYear()}`
}

/** Bugünden hedefe kaç gün. Negatif = geçmiş. Geçersizse null. */
export function kalanGun(iso: string | null | undefined): number | null {
  const hedef = tarihOku(iso)
  if (!hedef) return null
  const simdi = new Date()
  const bugunYerel = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate())
  return Math.round((hedef.getTime() - bugunYerel.getTime()) / GUN_MS)
}

/** Bugüne gün ekle → 'YYYY-MM-DD'. Filtre kısayolları ("30 gün içinde") için. */
export function gunEkle(gun: number, temel: string = bugun()): string {
  const d = tarihOku(temel) ?? new Date()
  const yeni = new Date(d)
  yeni.setDate(yeni.getDate() + gun)
  return tarihYaz(yeni)
}

/* ═════════════════════════════════════════════════════════ başvuru turları */

/**
 * Tarih hesapları için gereken en küçük program parçası.
 *
 * `basvuru_turlari` OPSİYONEL: bu dosyanın fonksiyonları hem tam `Program`
 * nesneleriyle hem de testlerdeki küçük nesnelerle çağrılıyor. Zorunlu yapmak
 * her çağrı yerini boş dizi eklemeye zorlardı.
 */
export type TarihliProgram =
  Pick<Program, 'son_tarih_tipi' | 'son_tarih' | 'son_tarih_baslangic' | 'son_tarih_bitis'>
  & { basvuru_turlari?: BasvuruTuru[] }

/** Tarihi okunabilir olan turlar — bozuk kayıt hesabı bozmasın. */
function tarihliTurlar(p: TarihliProgram): (BasvuruTuru & { son_tarih: string })[] {
  return (p.basvuru_turlari ?? []).filter(
    (t): t is BasvuruTuru & { son_tarih: string } =>
      typeof t.son_tarih === 'string' && tarihOku(t.son_tarih) !== null,
  )
}

/**
 * Kullanıcının takip etmesi gereken tur.
 *
 * AB DIŞI pasaportu olduğu için yalnızca 'ab_disi' ve 'herkes' turları
 * bağlayıcı ('ab' turları arayüzde görünür ama tarihi belirlemez —
 * `SANA_ACIK_TURLAR`, lib/sabitler.ts). Danimarka'da AB dışı 15 Ocak'ta,
 * AB 15 Mart'ta kapanıyor; programın sayfasında büyük puntoyla yazan tarih
 * çoğunlukla AB tarihidir ve ona bakan iki ay geç kalır.
 *
 * `kimin_icin` boş bırakılmış tur bağlayıcı SAYILMAZ. Bilinçli: yanlış turu
 * bağlayıcı saymak bir yıl kaybettirir, saymamak yalnızca bir uyarı
 * kaybettirir.
 *
 * Turlar her yıl tekrarladığı için "en erken" değil **GEÇMEMİŞ EN YAKIN**
 * tur alınır. Hepsi geçmişse en sonuncusu döner — kart "kaçırdın" diye
 * görünsün, tarihsiz görünmesin.
 */
export function siradakiTur(p: TarihliProgram): BasvuruTuru | null {
  const acik = tarihliTurlar(p).filter(
    (t) => t.kimin_icin !== null && SANA_ACIK_TURLAR.includes(t.kimin_icin),
  )
  if (acik.length === 0) return null

  // 'YYYY-MM-DD' sözlük sırası = kronolojik sıra; Date'e çevirmeye gerek yok.
  const bugunIso = bugun()
  const gelecek = acik
    .filter((t) => t.son_tarih >= bugunIso)
    .sort((a, b) => a.son_tarih.localeCompare(b.son_tarih))

  if (gelecek.length > 0) return gelecek[0]
  return [...acik].sort((a, b) => b.son_tarih.localeCompare(a.son_tarih))[0]
}

/** Sana kapalı ama bilgi amaçlı gösterilen turlar (AB vatandaşı turları). */
export function bilgiTurlari(p: TarihliProgram): BasvuruTuru[] {
  return (p.basvuru_turlari ?? []).filter(
    (t) => t.kimin_icin === null || !SANA_ACIK_TURLAR.includes(t.kimin_icin),
  )
}

/* ═══════════════════════════════════════════════════════════ etkin tarih */

/**
 * Programın merkezî (turlardan bağımsız) son tarihi. Yoksa null.
 *
 * Aralık tipinde ARALIĞIN SONU alınıyor: kaçırma riski orada doğuyor.
 * 'surekli' ve 'bilinmiyor' merkezî tarih taşımıyor.
 */
function merkeziTarih(p: TarihliProgram): string | null {
  switch (p.son_tarih_tipi) {
    case 'kesin':
      return p.son_tarih
    case 'aralik':
      return p.son_tarih_bitis ?? p.son_tarih_baslangic ?? null
    default:
      return null
  }
}

/**
 * Programı tek bir tarihle temsil et — sıralama, geri sayım ve tarih filtresi.
 *
 * KURAL: merkezî tarih ile SENİN TURUN arasından **erken olan** kazanır.
 *
 * Şartname bu noktada kendiyle çelişiyor: §4.4 "önce `siradakiTur()`" derken
 * §7.2 "programın kendi merkezî tarihi varsa turlar onu ezmez" diyor. Önce
 * §7.2 uygulandı (merkezî tarih hep kazanır) ama ekranda görülünce yanlış
 * olduğu anlaşıldı:
 *
 *   Aalborg kaydında merkezî tarih 28 Ekim (sayfada büyük yazan AB tarihi),
 *   AB dışı tur 18 Eylül. Kart "~2 ay kaldı" diyordu; gerçek süre 20 gündü.
 *   Uyarı metni doğruyu söylüyordu ama ROZET yalan söylüyordu ve insan
 *   rozete bakar.
 *
 * "Erken olan kazanır" ikisini de karşılıyor: turun geç ise merkezî tarih
 * ezilmiyor (§7.2), turun erken ise geri sayım ona geçiyor (§4.4'ün amacı).
 * Tanımı da dürüst: `etkinTarih` = "kaçıramayacağın gün".
 *
 * AB turları hesaba GİRMEZ — `siradakiTur()` zaten yalnızca sana açık
 * turlara bakıyor.
 */
export function etkinTarih(p: TarihliProgram): string | null {
  const merkezi = merkeziTarih(p)
  const turTarihi = siradakiTur(p)?.son_tarih ?? null

  if (merkezi && turTarihi) return turTarihi < merkezi ? turTarihi : merkezi
  return merkezi ?? turTarihi
}

/**
 * Belgelerin yetişmesi gereken gün.
 *
 * Aralık tipinde de KAPANIŞ günü kullanılır — açılış değil. Başlangıçta
 * açılış günü alınıyordu ("evrak pencere açılırken hazır olmalı" varsayımı),
 * ama gerçek ilanlar öyle işlemiyor: pencere Aralık'ta açılıp Mart'ta
 * kapanıyor ve belgeler kapanışa kadar yüklenebiliyor. Açılışı hedef almak,
 * kullanıcıya iki buçuk ay erken "geciktin" derdi.
 *
 * Ayrı fonksiyon olarak duruyor çünkü çağrı yerleri niyeti belli ediyor:
 * "belgenin yetişmesi gereken gün" ile "sıralama tarihi" kavramsal olarak
 * farklı şeyler, bugün aynı değere denk geliyor olsalar da.
 */
export function etkinBaslangic(p: TarihliProgram): string | null {
  return etkinTarih(p)
}

/**
 * "Senin turun merkezî tarihten önce kapanıyor" uyarısı.
 *
 * `etkinTarih()` artık erken olanı aldığı için geri sayım zaten doğru; bu
 * uyarının işi FARKI görünür kılmak. Programın sayfasında büyük yazan tarih
 * genelde AB tarihidir ve kullanıcı onu merkezî alana yazmış olabilir; iki
 * tarihin ayrıştığını söylemek, kaydın doğru girildiğini kontrol etmesini
 * sağlıyor.
 *
 * Uyarı yalnızca gerçekten bir fark varken çıkıyor; yoksa null.
 */
export function turUyarisi(p: TarihliProgram): string | null {
  const tur = siradakiTur(p)
  if (!tur?.son_tarih) return null

  const merkezi = merkeziTarih(p)
  if (!merkezi || tur.son_tarih >= merkezi) return null

  return `Senin turun (${tur.ad}) ${tarihKisa(tur.son_tarih)} tarihinde, `
    + `programın merkezî tarihinden (${tarihKisa(merkezi)}) önce kapanıyor. `
    + 'Geri sayım turuna göre yapılıyor — merkezî tarih büyük ihtimalle AB turunun tarihi.'
}

/* ═════════════════════════════════════════════════════════════ aciliyet */

export type Aciliyet =
  | 'gecti'      // tarih geride kaldı, hâlâ belge toplanıyor
  | 'bugun'      // son gün
  | 'kritik'     // ≤ 7 gün
  | 'yakin'      // ≤ 30 gün
  | 'yaklasiyor' // ≤ 90 gün
  | 'uzak'       // > 90 gün
  | 'surekli'    // rolling
  | 'belirsiz'   // tarih yok / henüz açıklanmadı
  | 'beklemede'  // başvuru gönderildi — geri sayımın işi bitti, sıra sonuçta
  | 'kapali'     // program sonuçlandı (kabul/kayıt/red/elendi)

export const ACILIYET_ESIK = { kritik: 7, yakin: 30, yaklasiyor: 90 } as const

export function aciliyet(p: TarihliProgram & Pick<Program, 'durum'>): Aciliyet {
  const durum = durumBul(p.durum)
  if (durum?.kapali) return 'kapali'

  /*
   * Başvurusu gönderilmiş bir programda geri sayım yanlış sinyal verir:
   * "6 gün geçti" kırmızı rozeti bir şeyi kaçırdığını düşündürür, oysa
   * evrakı zamanında yollamışsındır ve sadece sonucu bekliyorsundur.
   */
  if (durum && !durum.belgeBekliyor) return 'beklemede'

  // Sürekli başvuru, turu olsa bile sürekli sayılır.
  if (p.son_tarih_tipi === 'surekli') return 'surekli'

  const gun = kalanGun(etkinTarih(p))
  if (gun === null) return 'belirsiz'

  if (gun < 0) return 'gecti'
  if (gun === 0) return 'bugun'
  if (gun <= ACILIYET_ESIK.kritik) return 'kritik'
  if (gun <= ACILIYET_ESIK.yakin) return 'yakin'
  if (gun <= ACILIYET_ESIK.yaklasiyor) return 'yaklasiyor'
  return 'uzak'
}

/**
 * Aciliyet etiketleri gün penceresini söyler, takvim ayını değil:
 * 24 gün kalan bir tarihe "bu ay" demek gelecek aya sarkan bir son tarihte
 * yanlış olur.
 */
export const ACILIYET_ETIKET: Record<Aciliyet, string> = {
  gecti: 'Süresi geçti',
  bugun: 'BUGÜN son gün',
  kritik: '1 hafta içinde',
  yakin: '1 ay içinde',
  yaklasiyor: '3 ay içinde',
  uzak: '3 aydan uzak',
  surekli: 'Sürekli açık',
  belirsiz: 'Tarih belirsiz',
  beklemede: 'Sonuç bekleniyor',
  kapali: 'Kapandı',
}

/* ══════════════════════════════════════════════════════ okunur metinler */

/** "15 Ocak 2027" / "1 Kas 2026 – 15 Oca 2027" / "Sürekli açık" / "Henüz açıklanmadı" */
export function sonTarihMetni(p: TarihliProgram & Pick<Program, 'son_tarih_not'>): string {
  switch (p.son_tarih_tipi) {
    case 'kesin':
      return p.son_tarih ? tarihFormat(p.son_tarih) : 'Tarih girilmemiş'

    case 'aralik': {
      const bas = p.son_tarih_baslangic
      const bit = p.son_tarih_bitis
      if (bas && bit) return `${tarihKisa(bas)} – ${tarihKisa(bit)}`
      if (bit) return `en geç ${tarihFormat(bit)}`
      if (bas) return `${tarihFormat(bas)} sonrası`
      return p.son_tarih_not?.trim() || 'Aralık girilmemiş'
    }

    case 'surekli':
      return 'Sürekli açık'

    case 'bilinmiyor': {
      // Merkezî tarih yok ama turların tarihi olabilir.
      const tur = siradakiTur(p)
      if (tur?.son_tarih) return `${tarihFormat(tur.son_tarih)} (${tur.ad})`
      return p.son_tarih_not?.trim() || 'Henüz açıklanmadı'
    }
  }
}

/** "23 gün kaldı" / "BUGÜN son gün" / "12 gün geçti". Anlamsızsa boş metin. */
export function geriSayimMetni(p: TarihliProgram & Pick<Program, 'durum'>): string {
  const a = aciliyet(p)
  if (a === 'kapali' || a === 'surekli' || a === 'belirsiz' || a === 'beklemede') return ''

  const gun = kalanGun(etkinTarih(p))
  if (gun === null) return ''
  if (gun === 0) return 'BUGÜN son gün'
  if (gun < 0) return `${Math.abs(gun)} gün geçti`
  if (gun === 1) return 'yarın son gün'
  if (gun < 60) return `${gun} gün kaldı`

  const ay = Math.round(gun / 30)
  return `~${ay} ay kaldı`
}

/** Başvuru henüz açılmadıysa bilgi metni; açıldıysa boş. */
export function acilisMetni(p: Pick<Program, 'acilis_tarihi'>): string {
  const gun = kalanGun(p.acilis_tarihi)
  if (gun === null || gun <= 0) return ''
  if (gun === 1) return 'Başvurular yarın açılıyor'
  return `Başvurular ${gun} gün sonra açılıyor (${tarihKisa(p.acilis_tarihi)})`
}

/* ═══════════════════════════════════════════ belge hazırlık uyarısı */

export type HazirlikDurumu = 'rahat' | 'basla' | 'gecikti' | 'gecersiz'

/**
 * "Bu belgeye ne zaman başlamalıyım?" sorusunun cevabı.
 *
 * PROJE.md §6.3'ün bütün mesele ettiği hesap: IELTS'in sonucu ~90 gün
 * sürüyorsa ve en yakın son tarih 60 gün sonraysa **çoktan gecikmişsin**
 * demektir. "60 gün var" demek doğru ama yanıltıcı bir cümle; belge takvimi
 * bu yüzden son tarihi değil BAŞLAMA tarihini gösteriyor.
 *
 * @param hedefTarih  Belgenin yetişmesi gereken gün (programın etkin tarihi)
 * @param hazirlikGun Belgenin sıfırdan hazırlanma süresi (BELGELER tablosundan)
 */
export function hazirlikDurumu(hedefTarih: string | null, hazirlikGun: number): {
  durum: HazirlikDurumu
  /** En geç bu gün başlamalısın. */
  baslamaTarihi: string | null
  /** Başlama gününe kaç gün var (negatif = geciktin). */
  payGun: number | null
} {
  const kalan = kalanGun(hedefTarih)
  if (kalan === null) return { durum: 'gecersiz', baslamaTarihi: null, payGun: null }

  const baslamaTarihi = gunEkle(-hazirlikGun, hedefTarih!)
  const payGun = kalan - hazirlikGun

  if (kalan < 0) return { durum: 'gecikti', baslamaTarihi, payGun }
  if (payGun < 0) return { durum: 'gecikti', baslamaTarihi, payGun }
  // İki hafta kala "başla" demek, hocadan referans istemek gibi başkasına
  // bağlı işlerde tampon bırakıyor.
  if (payGun <= 14) return { durum: 'basla', baslamaTarihi, payGun }
  return { durum: 'rahat', baslamaTarihi, payGun }
}

export const HAZIRLIK_ETIKET: Record<HazirlikDurumu, string> = {
  rahat: 'Zaman var',
  basla: 'Şimdi başla',
  gecikti: 'Geciktin',
  gecersiz: 'Tarih yok',
}

/* ══════════════════════════════════════════════════════ sıralama anahtarı */

/**
 * Son tarihe göre sıralamada kullanılan skor. Küçük = önce.
 *
 * Tarihi olmayanlar (sürekli / belirsiz) listenin sonuna gider ama
 * kaybolmaz. Kapanmış programlar en sona.
 */
export function siraSkoru(p: TarihliProgram & Pick<Program, 'durum'>): number {
  if (durumBul(p.durum)?.kapali) return Number.MAX_SAFE_INTEGER

  const d = tarihOku(etkinTarih(p))
  if (!d) {
    // Sürekli açık olan, hiç tarihi olmayandan biraz daha "işlenebilir".
    return p.son_tarih_tipi === 'surekli'
      ? Number.MAX_SAFE_INTEGER - 2
      : Number.MAX_SAFE_INTEGER - 1
  }
  return d.getTime()
}
