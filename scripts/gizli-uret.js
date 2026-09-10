/**
 * Kurulumda gereken rastgele değerleri üretir.
 *
 *   npm run gizli
 *
 * Çıktıyı `.env.local` dosyasına yapıştır. Parolayı kendin de belirleyebilirsin;
 * OTURUM_GIZLI'yi mutlaka buradan üretilen gibi rastgele bir şey yap — çerez
 * imzasının güvenliği ona bağlı.
 */

import { randomBytes } from 'node:crypto'

const gizli = (bayt) => randomBytes(bayt).toString('base64url')

console.log(`
Aşağıdaki satırları .env.local dosyana yapıştır:
────────────────────────────────────────────────

# Uygulamaya giriş parolan. Bunu değiştirip aklında tutabileceğin
# bir şey yapabilirsin — ama kısa/tahmin edilebilir olmasın.
APP_PAROLA=${gizli(12)}

# Oturum çerezini imzalar. Bunu DEĞİŞTİRME, olduğu gibi kullan.
OTURUM_GIZLI=${gizli(32)}

────────────────────────────────────────────────
Kalan değeri Vercel panelinden alacaksın:
  DATABASE_URL   → Vercel › Storage › Neon › connection string

Bağlantıyı yazdıktan sonra tabloları kurmak için:
  npm run sema

Ayrıntılar için BASLA.md dosyasına bak.
`)
