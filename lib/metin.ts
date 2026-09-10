/**
 * Metin normalleştirme — ayrıştırıcının ve aramanın ortak zemini.
 *
 * Türkçe'nin özel derdi: `'İSTANBUL'.toLowerCase()` bazı ortamlarda
 * "i̇stanbul" (i + birleşen nokta) üretir ve `includes('istanbul')` tutmaz.
 * Bu yüzden küçültmeden ÖNCE harfleri elle eşliyoruz.
 */

const HARF_HARITASI: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', i: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  â: 'a', Â: 'a', î: 'i', Î: 'i', û: 'u', Û: 'u',
  é: 'e', É: 'e', è: 'e', ê: 'e', ë: 'e',
  á: 'a', à: 'a', ä: 'a', å: 'a', ã: 'a',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ø: 'o',
  ú: 'u', ù: 'u', ñ: 'n', ç̧: 'c', ß: 'ss', æ: 'ae',
}

/**
 * Aksansız, küçük harfli, tek boşluklu hâl.
 * Karşılaştırma ve arama için; kullanıcıya gösterilmez.
 */
export function sadelestir(metin: string): string {
  let cikti = ''
  for (const harf of metin) {
    cikti += HARF_HARITASI[harf] ?? harf
  }
  return cikti.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Aynı sadeleştirme ama satır yapısını korur — ayrıştırıcı satır satır çalışıyor. */
export function sadelestirSatirli(metin: string): string {
  let cikti = ''
  for (const harf of metin) {
    cikti += HARF_HARITASI[harf] ?? harf
  }
  return cikti.toLowerCase().replace(/[ \t ]+/g, ' ')
}

/** `iğne` `samanlik` içinde kelime sınırlarına saygılı biçimde geçiyor mu. */
export function icerirKelime(samanlik: string, igne: string): boolean {
  if (!igne) return false
  const kacir = igne.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Kelime sınırı: harf/rakam olmayan ya da metin başı/sonu.
  return new RegExp(`(^|[^a-z0-9])${kacir}([^a-z0-9]|$)`).test(samanlik)
}

/** İlk eşleşmenin indeksi, kelime sınırına saygılı. Yoksa -1. */
export function kelimeIndeksi(samanlik: string, igne: string): number {
  if (!igne) return -1
  const kacir = igne.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = new RegExp(`(^|[^a-z0-9])(${kacir})([^a-z0-9]|$)`).exec(samanlik)
  return m ? m.index + m[1].length : -1
}

/** Uzun metinden okunabilir bir kanıt parçası kes. */
export function kanitKes(metin: string, indeks: number, uzunluk = 90): string {
  if (indeks < 0) return ''
  const bas = Math.max(0, indeks - 30)
  const son = Math.min(metin.length, indeks + uzunluk)
  return (bas > 0 ? '…' : '') + metin.slice(bas, son).replace(/\s+/g, ' ').trim() + (son < metin.length ? '…' : '')
}
