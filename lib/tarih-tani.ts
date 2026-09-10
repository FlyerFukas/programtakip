import { tarihYaz, tarihOku } from './tarih'

/**
 * Serbest metinden tarih çıkarma.
 *
 * Burs sayfaları tarihi her biçimde yazıyor: "15 January 2027",
 * "15.01.2027", "January 15th", "Ocak 2027", "2027-01-15". Buradaki iş
 * hepsini 'YYYY-MM-DD'ye indirmek ve NE KADAR emin olduğumuzu söylemek.
 *
 * İki kasıtlı karar:
 *
 * 1. GÜN/AY SIRASI. "05/03/2027" hem 5 Mart hem 3 Mayıs olabilir. Varsayılan
 *    gün-önce (Türkiye ve Avrupa yazımı, burs kaynaklarının çoğu). Sayılardan
 *    biri 12'yi aşıyorsa belirsizlik zaten çözülür; çözülmezse `guven: 'dusuk'`
 *    dönüp önizlemede sarı işaretlettiriyoruz.
 *
 * 2. EKSİK YIL. "15 January" yazan bir sayfa bu yılın değil, gelecek
 *    dönemin başvurusundan bahsediyordur. Bugünden sonraki ilk oluşumu
 *    alıyoruz — geçmiş bir son tarih hiçbir işe yaramaz.
 */

export type TarihBulgusu = {
  iso: string
  /** 'gun' → tam tarih; 'ay' → sadece ay biliniyor, iso ayın 1'i. */
  kesinlik: 'gun' | 'ay'
  /** Ay bazlı bulgularda ayın son günü — aralık kurmak için. */
  ayBitis?: string
  guven: 'yuksek' | 'dusuk'
  /** Metindeki konum — hangi tarihin hangi etikete ait olduğunu çözmek için. */
  indeks: number
  ham: string
  /** Belirsizliğin sebebi: önizlemede kullanıcıya gösterilir. */
  not?: string
}

/* Sadeleştirilmiş (aksansız, küçük harf) metinde aranan ay adları. */
const AY_ADLARI: Record<string, number> = {
  // Türkçe
  ocak: 1, subat: 2, mart: 3, nisan: 4, mayis: 5, haziran: 6,
  temmuz: 7, agustos: 8, eylul: 9, ekim: 10, kasim: 11, aralik: 12,
  // İngilizce — tam
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  // İngilizce — kısa
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7,
  aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

const AY_KALIBI = Object.keys(AY_ADLARI).sort((a, b) => b.length - a.length).join('|')

/** Ayın kaç gün çektiği (artık yıl dahil). */
function ayGunSayisi(yil: number, ay: number): number {
  return new Date(yil, ay, 0).getDate()
}

/** Yıl yoksa: bugünden sonraki ilk (ay, gün) oluşumunun yılı. */
function yaklasanYil(ay: number, gun: number): number {
  const simdi = new Date()
  const buYil = simdi.getFullYear()
  const aday = new Date(buYil, ay - 1, gun)
  const bugunYerel = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate())
  return aday.getTime() >= bugunYerel.getTime() ? buYil : buYil + 1
}

/** İki haneli yılı dört haneye tamamla: 27 → 2027. */
function yiliTamamla(y: number): number {
  if (y >= 1000) return y
  if (y >= 100) return y // 3 haneli saçmalık — dokunma, doğrulama elesin
  return y < 70 ? 2000 + y : 1900 + y
}

function gecerli(yil: number, ay: number, gun: number): boolean {
  return yil >= 1900 && yil <= 2100 && ay >= 1 && ay <= 12 && gun >= 1 && gun <= ayGunSayisi(yil, ay)
}

/**
 * Metindeki tüm tarihleri konum sırasıyla döndürür.
 *
 * @param sade `sadelestir()`ten geçmiş metin (aksansız, küçük harf).
 */
export function tarihleriBul(sade: string): TarihBulgusu[] {
  const bulgular: TarihBulgusu[] = []
  /** Aynı karakter aralığını iki farklı kalıp yakalamasın. */
  const kapsanan: [number, number][] = []

  const cakisiyorMu = (bas: number, son: number) =>
    kapsanan.some(([b, s]) => bas < s && son > b)

  const ekle = (b: TarihBulgusu, bas: number, son: number) => {
    if (cakisiyorMu(bas, son)) return
    kapsanan.push([bas, son])
    bulgular.push(b)
  }

  /* ── 1) ISO: 2027-01-15 ─────────────────────────────────────────────── */
  for (const m of sade.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
    const [ham, y, a, g] = m
    const yil = Number(y), ay = Number(a), gun = Number(g)
    if (!gecerli(yil, ay, gun)) continue
    ekle(
      { iso: `${yil}-${String(ay).padStart(2, '0')}-${String(gun).padStart(2, '0')}`,
        kesinlik: 'gun', guven: 'yuksek', indeks: m.index!, ham },
      m.index!, m.index! + ham.length,
    )
  }

  /* ── 2) "15 January 2027" / "15 Ocak" / "15th Jan 2027" ─────────────── */
  {
    const re = new RegExp(
      `\\b(\\d{1,2})(?:st|nd|rd|th|\\.|'?[iıuü]?n?)?\\s+(${AY_KALIBI})\\b(?:\\s*,?\\s*(\\d{4}|\\d{2})\\b)?`,
      'g',
    )
    for (const m of sade.matchAll(re)) {
      const [ham, g, ayAdi, y] = m
      const ay = AY_ADLARI[ayAdi]
      const gun = Number(g)
      const yilVar = y !== undefined
      const yil = yilVar ? yiliTamamla(Number(y)) : yaklasanYil(ay, gun)
      if (!gecerli(yil, ay, gun)) continue
      ekle(
        { iso: `${yil}-${String(ay).padStart(2, '0')}-${String(gun).padStart(2, '0')}`,
          kesinlik: 'gun',
          guven: yilVar ? 'yuksek' : 'dusuk',
          not: yilVar ? undefined : `Metinde yıl yazmıyordu, ${yil} varsayıldı.`,
          indeks: m.index!, ham },
        m.index!, m.index! + ham.length,
      )
    }
  }

  /* ── 3) "January 15, 2027" / "Jan 15" ───────────────────────────────── */
  {
    const re = new RegExp(
      `\\b(${AY_KALIBI})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:\\s*,?\\s*(\\d{4}|\\d{2})\\b)?`,
      'g',
    )
    for (const m of sade.matchAll(re)) {
      const [ham, ayAdi, g, y] = m
      const ay = AY_ADLARI[ayAdi]
      const gun = Number(g)
      const yilVar = y !== undefined
      const yil = yilVar ? yiliTamamla(Number(y)) : yaklasanYil(ay, gun)
      if (!gecerli(yil, ay, gun)) continue
      ekle(
        { iso: `${yil}-${String(ay).padStart(2, '0')}-${String(gun).padStart(2, '0')}`,
          kesinlik: 'gun',
          guven: yilVar ? 'yuksek' : 'dusuk',
          not: yilVar ? undefined : `Metinde yıl yazmıyordu, ${yil} varsayıldı.`,
          indeks: m.index!, ham },
        m.index!, m.index! + ham.length,
      )
    }
  }

  /* ── 4) "15.01.2027" / "15/01/2027" / "15-01-2027" ──────────────────── */
  for (const m of sade.matchAll(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})\b/g)) {
    const [ham, a1, a2, y] = m
    const yil = yiliTamamla(Number(y))
    const s1 = Number(a1), s2 = Number(a2)

    let gun: number, ay: number, guven: TarihBulgusu['guven'] = 'yuksek', not: string | undefined

    if (s1 > 12 && s2 <= 12) {
      gun = s1; ay = s2                       // 25/03 → gün-önce, tartışmasız
    } else if (s2 > 12 && s1 <= 12) {
      gun = s2; ay = s1                       // 03/25 → ay-önce (ABD), tartışmasız
      not = 'Ay/gün sırası ABD biçiminde okundu.'
    } else {
      gun = s1; ay = s2                       // ikisi de ≤12 → belirsiz
      guven = 'dusuk'
      not = `"${ham}" hem ${s1}. ay hem ${s1}. gün olabilir; gün/ay/yıl varsayıldı.`
    }

    if (!gecerli(yil, ay, gun)) continue
    ekle(
      { iso: `${yil}-${String(ay).padStart(2, '0')}-${String(gun).padStart(2, '0')}`,
        kesinlik: 'gun', guven, not, indeks: m.index!, ham },
      m.index!, m.index! + ham.length,
    )
  }

  /* ── 5) Sadece ay: "Ocak 2027" / "January 2027" ─────────────────────── */
  {
    // "aralik" hem ay adı hem "range" demek. Yanında dört haneli yıl varsa
    // ay olarak okumak güvenli; yoksa hiç dokunma.
    const re = new RegExp(`\\b(${AY_KALIBI})\\s+(\\d{4})\\b`, 'g')
    for (const m of sade.matchAll(re)) {
      const [ham, ayAdi, y] = m
      const ay = AY_ADLARI[ayAdi]
      const yil = Number(y)
      if (!gecerli(yil, ay, 1)) continue
      ekle(
        { iso: `${yil}-${String(ay).padStart(2, '0')}-01`,
          ayBitis: `${yil}-${String(ay).padStart(2, '0')}-${String(ayGunSayisi(yil, ay)).padStart(2, '0')}`,
          kesinlik: 'ay',
          guven: 'dusuk',
          not: 'Metinde gün yazmıyordu, ay aralığı olarak alındı.',
          indeks: m.index!, ham },
        m.index!, m.index! + ham.length,
      )
    }
  }

  return bulgular.sort((a, b) => a.indeks - b.indeks)
}

/** Geçmişte kalmış bulguları ele — son tarih arıyorsak geçmiş anlamsız. */
export function gelecektekiler(bulgular: TarihBulgusu[]): TarihBulgusu[] {
  const bugunMs = tarihOku(tarihYaz(new Date()))!.getTime()
  return bulgular.filter((b) => {
    const d = tarihOku(b.iso)
    return d !== null && d.getTime() >= bugunMs
  })
}
