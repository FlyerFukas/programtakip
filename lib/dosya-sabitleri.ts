/**
 * Dosya yükleme sınırları.
 *
 * `lib/dosya-metin.ts` içinde durmuyorlar çünkü o modül `server-only`
 * işaretli; yükleme formu ise bir istemci bileşeni ve `accept` özniteliği
 * için aynı listeye ihtiyaç duyuyor. Sunucu ve istemcinin ortak bildiği
 * tek şey burada.
 */

export const DESTEKLENEN_UZANTILAR = ['.txt', '.md', '.docx', '.csv', '.json'] as const

export const EN_BUYUK_DOSYA = 10 * 1024 * 1024 // 10 MB
