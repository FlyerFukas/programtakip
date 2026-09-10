import 'server-only'
import { neon, types, type NeonQueryFunction } from '@neondatabase/serverless'

/**
 * Veritabanı bağlantısı — YALNIZCA SUNUCU TARAFI.
 *
 * Neon (serverless PostgreSQL). `DATABASE_URL` bağlantı dizgesi veritabanının
 * tam anahtarıdır; bu modül asla bir istemci bileşenine ('use client')
 * import edilmemeli. `server-only` içe aktarımı öyle bir durumda derlemeyi
 * hata verdirir — dizgenin tarayıcıya gitmesinden iyidir.
 *
 * ── NEDEN SUPABASE DEĞİL ──────────────────────────────────────────────────
 * Supabase ücretsiz planı hesap başına 2 aktif proje veriyor; ikisi de dolu
 * (Burs Takip + İlişki Haritası). Neon'a geçildi. Kazanç sadece kota değil:
 *
 *  - Halka açık HTTP API yok. Supabase'de PostgREST anon anahtarıyla
 *    internete açık olduğu için "RLS açık + hiçbir politika yok" numarası
 *    gerekiyordu. Burada kapatılacak bir kapı yok.
 *  - `NEXT_PUBLIC_` bir veritabanı değişkeni yok, dolayısıyla PROJE.md
 *    §8.5'teki 1 numaralı Vercel tuzağı (NEXT_PUBLIC_ değişken Secret
 *    olamıyor, panelden sessizce düşüyor) burada hiç doğmuyor.
 *  - 7 gün hareketsizlikte proje duraklatma yok; hesaplama sıfıra iniyor,
 *    ilk sorguda uyanıyor.
 *
 * ── SORGU BİÇİMİ ──────────────────────────────────────────────────────────
 * Etiketli şablon: `sql`select * from programlar where id = ${id}``
 * Değerler ŞABLONA GÖMÜLMÜYOR, parametre olarak gidiyor — SQL enjeksiyonu
 * bu biçimde mümkün değil. Dizgeyi elle birleştirme.
 */

/**
 * `numeric` sütunları sayı olarak oku.
 *
 * PostgreSQL sürücüleri `numeric`i varsayılan olarak DİZGE döndürür; sebep
 * keyfî değil, `numeric` JavaScript `number`ının taşıyamayacağı hassasiyeti
 * tutabiliyor. Ama buradaki numeric alanlar öğrenim ücreti, yaşam gideri ve
 * "oturuma kaç yıl" — hiçbiri 2^53'ü aşmıyor ve hepsi karşılaştırılıp
 * toplanacak. Dizge kalsalardı `40000 > 9000` karşılaştırması alfabetik
 * yapılır ve 40.000 EUR'luk program 9.000'likten ucuz görünürdü.
 *
 * `int8` (bigint) BİLEREK dokunulmadı: onda taşma gerçek bir risk.
 * Sayım gereken yerde sorguda `count(*)::int` yazılıyor.
 */
types.setTypeParser(types.builtins.NUMERIC, (d) => (d === null ? null : Number(d)))

/**
 * `date` sütunlarını 'YYYY-MM-DD' DİZGE olarak oku.
 *
 * Sürücünün varsayılanı bunu `Date` nesnesine çeviriyor ve orada saat dilimi
 * derdi başlıyor: "15 Ocak" son tarihi, sunucu UTC'deyken 14 Ocak 21:00 olarak
 * saklanıp bir gün geri kayabiliyor. Uygulamanın her yerinde tarih zaten düz
 * metin (lib/tarih.ts başındaki nota bak) — telden gelen değer de zaten
 * 'YYYY-MM-DD', olduğu gibi bırakmak hem doğru hem ucuz.
 */
types.setTypeParser(types.builtins.DATE, (d) => d)

/**
 * `timestamptz` sütunlarını ISO-8601 dizgeye çevir.
 *
 * Varsayılan `Date` nesnesi döndürüyor ama `lib/tipler.ts` bu alanları
 * `string` olarak tanımlıyor (olusturma/guncelleme) ve yedek JSON'una da
 * dizge olarak giriyorlar. Çeviriyi elle yapmak yerine sürücünün kendi
 * ayrıştırıcısını çağırıp sonucu ISO'ya çeviriyoruz — Postgres'in tel
 * biçimini ('2026-08-28 12:34:56.789+00') elle parse etmeye kalkmak
 * ortamdan ortama değişen bir davranış.
 */
const tsTzVarsayilan = types.getTypeParser(types.builtins.TIMESTAMPTZ)
types.setTypeParser(types.builtins.TIMESTAMPTZ, (d) => {
  if (d === null) return null
  const c = tsTzVarsayilan(d)
  return c instanceof Date ? c.toISOString() : String(c)
})

let onbellek: NeonQueryFunction<false, false> | null = null

function zorunlu(ad: string): string {
  const deger = process.env[ad]
  if (!deger) {
    throw new Error(
      `Ortam değişkeni eksik: ${ad}. ".env.local" dosyasını ".env.local.example" örneğine göre doldur.`,
    )
  }
  return deger
}

export function db(): NeonQueryFunction<false, false> {
  if (onbellek) return onbellek
  onbellek = neon(zorunlu('DATABASE_URL'))
  return onbellek
}

/** Kurulum tamamlanmış mı — /kurulum sayfası ve uygulama kabuğu bunu sorar. */
export function veritabaniHazirMi(): boolean {
  return Boolean(process.env.DATABASE_URL)
}
