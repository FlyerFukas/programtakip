/**
 * Şemayı veritabanına uygular.
 *
 *   npm run sema
 *
 * `.env.local`deki DATABASE_URL'i okur, `veritabani/sema.sql` dosyasını
 * çalıştırır ve sonucu tablo tablo raporlar.
 *
 * NEDEN BETİK: BursTakip'te bu iş "SQL dosyasını aç, kopyala, Supabase SQL
 * Editor'e yapıştır, Run" adımlarıyla yapılıyordu — Kullanıcının panele girip
 * elle yapması gereken bir işti. Neon'a geçince gerekmiyor: bağlantı dizgesi
 * elimizde olduğu için şemayı buradan uygulayabiliyoruz. Şema her
 * değiştiğinde tekrar çalıştır, dosyanın tamamı `if not exists`.
 *
 * TEK BİR İFADE OLARAK gönderiliyor (`Pool` + tek `query`), çünkü dosyada
 * `$$ … $$` gövdeli fonksiyon var; noktalı virgülden bölmeye kalkan naif bir
 * ayırıcı onu ortadan ikiye keser.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from '@neondatabase/serverless'

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const url = process.env.DATABASE_URL
if (!url) {
  console.error('\n  ✗ DATABASE_URL tanımlı değil.\n')
  console.error('    .env.local dosyasına Neon bağlantı dizgesini yaz, sonra tekrar dene.')
  console.error('    Nereden: Vercel › Storage › Neon › connection string\n')
  process.exit(1)
}

const sema = readFileSync(resolve(KOK, 'veritabani/sema.sql'), 'utf8')

console.log('\n═══ Şema uygulanıyor ═══\n')

const havuz = new Pool({ connectionString: url })

try {
  const { rows: once } = await havuz.query<{ ad: string }>(
    `select table_name as ad from information_schema.tables
      where table_schema = 'public' order by table_name`,
  )
  console.log(`  Önce  : ${once.length ? once.map((t) => t.ad).join(', ') : '(boş)'}`)

  await havuz.query(sema)

  const { rows: sonra } = await havuz.query<{ ad: string; satir: number }>(
    `select c.relname as ad,
            (select count(*) from pg_class x where x.oid = c.oid) as satir
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname`,
  )

  console.log(`  Sonra : ${sonra.length} tablo\n`)

  for (const t of sonra) {
    const { rows } = await havuz.query<{ n: number }>(
      // Tablo adı listeden geliyor, kullanıcı girdisi değil — yine de
      // tanımlayıcı olarak alıntılanıyor.
      `select count(*)::int as n from public."${t.ad.replace(/"/g, '""')}"`,
    )
    console.log(`    ✓ ${t.ad.padEnd(18)} ${String(rows[0].n).padStart(5)} satır`)
  }

  const { rows: politika } = await havuz.query<{ n: number }>(
    `select count(*)::int as n from pg_policies where schemaname = 'public'`,
  )
  console.log(`\n  RLS politikası: ${politika[0].n} (Neon'da beklenen: 0 — halka açık API yok)`)
  console.log('\n  ✓ Şema uygulandı.\n')
} catch (e) {
  console.error('\n  ✗ Şema uygulanamadı:', e instanceof Error ? e.message : e, '\n')
  process.exitCode = 1
} finally {
  await havuz.end()
}
