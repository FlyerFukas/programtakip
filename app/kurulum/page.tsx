import { korumaHazirMi } from '@/lib/auth'
import { veritabaniHazirMi } from '@/lib/veritabani'

export const metadata = { title: 'Kurulum — Bölüm Takip' }
export const dynamic = 'force-dynamic'

/**
 * Ortam değişkenleri eksikken gösterilen sayfa.
 *
 * Alternatif, uygulamanın "Ortam değişkeni eksik: …" diye çökmesiydi.
 * Bu ekran aynı bilgiyi verir ama neyin eksik olduğunu ve nasıl
 * doldurulacağını da söyler. BursTakip'te Vercel'de neyin eksik olduğunu
 * bulmayı çok kolaylaştırdı — o yüzden aynen taşındı.
 */
export default function KurulumSayfasi() {
  const eksikler = [
    { ad: 'DATABASE_URL', var: veritabaniHazirMi(),
      nereden: 'Vercel › Storage › Neon › connection string' },
    { ad: 'APP_PAROLA', var: Boolean(process.env.APP_PAROLA),
      nereden: 'Kendin belirle — npm run gizli komutu bir öneri üretir' },
    { ad: 'OTURUM_GIZLI', var: Boolean(process.env.OTURUM_GIZLI),
      nereden: 'npm run gizli komutunun ürettiği rastgele değer' },
  ]

  /* İsteğe bağlı olanlar ayrı tabloda: eksik olmaları uygulamayı
     durdurmuyor, ama "neden Metinden ekle çalışmıyor" sorusunun cevabı
     burada görünsün. */
  const istegeBagli = [
    { ad: 'ANTHROPIC_API_KEY', var: Boolean(process.env.ANTHROPIC_API_KEY),
      nereden: 'console.anthropic.com › API Keys' },
    { ad: 'GEMINI_API_KEY', var: Boolean(process.env.GEMINI_API_KEY),
      nereden: 'aistudio.google.com/apikey' },
  ]

  const korumaTamam = korumaHazirMi()
  const hepsiTamam = korumaTamam && veritabaniHazirMi()

  return (
    <main className="icerik icerik-dar" style={{ paddingTop: '8vh' }}>
      <h1>Kurulum tamamlanmamış</h1>
      <p className="soluk ust-s alt-l">
        Uygulamanın çalışması için birkaç ortam değişkeni gerekiyor. Aşağıdakileri{' '}
        <code>.env.local</code> dosyasına yaz, sonra sunucuyu yeniden başlat.
      </p>

      <div className="kart alt-m">
        <table>
          <thead>
            <tr>
              <th>Değişken</th>
              <th>Durum</th>
              <th>Nereden alınır</th>
            </tr>
          </thead>
          <tbody>
            {eksikler.map((e) => (
              <tr key={e.ad}>
                <td><code className="k1">{e.ad}</code></td>
                <td>
                  {e.var
                    ? <span className="rozet rozet-yesil">✓ tamam</span>
                    : <span className="rozet rozet-kirmizi">eksik</span>}
                </td>
                <td className="k1 soluk">{e.nereden}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="ust-l alt-s">İsteğe bağlı</h2>
      <p className="k1 soluk alt-m bosluk-0">
        Bunlar olmadan da uygulama tam çalışır. Yalnızca <strong>Metinden
        ekle</strong> ekranı bunlara bağlı — <strong>biri yeterli</strong>,
        ikisi de tanımlıysa hangisinin okuyacağını o ekranda seçersin.
      </p>
      <p className="k2 soluk-2 alt-m bosluk-0">
        <strong>&quot;Tanımlı&quot; çalışıyor demek değil.</strong> Buradaki
        onay yalnızca değerin dolu olduğunu söylüyor; anahtarın geçerli olup
        olmadığı ancak istek gönderilince belli oluyor. İptal edilmiş bir
        anahtarı silmezsen o sağlayıcı seçenek olarak görünmeye devam eder ve
        her deneme hata verir — kullanmadığın değişkeni boş bırak.
      </p>

      <div className="kart alt-m">
        <table>
          <thead>
            <tr>
              <th>Değişken</th>
              <th>Durum</th>
              <th>Nereden alınır</th>
            </tr>
          </thead>
          <tbody>
            {istegeBagli.map((e) => (
              <tr key={e.ad}>
                <td><code className="k1">{e.ad}</code></td>
                <td>
                  {e.var
                    ? <span className="rozet rozet-yesil">✓ tanımlı</span>
                    : <span className="rozet rozet-notr">yok</span>}
                </td>
                <td className="k1 soluk">{e.nereden}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hepsiTamam ? (
        <div className="uyari uyari-basari">
          <span>✓</span>
          <span>
            Değişkenlerin hepsi tanımlı. Sunucuyu yeniden başlatıp{' '}
            <a href="/giris">giriş sayfasına</a> git.
          </span>
        </div>
      ) : (
        <>
          <div className="uyari uyari-bilgi alt-m">
            <span>ℹ</span>
            <span>
              Adım adım anlatım için proje klasöründeki <code>BASLA.md</code> dosyasına bak.
              Bağlantı geldikten sonra tabloları kurmak için{' '}
              <code>npm run sema</code> çalıştır — <code>veritabani/sema.sql</code>{' '}
              dosyasını uygular, panele girmene gerek yok.
            </span>
          </div>

          {/* Veritabanı henüz bağlanmamış olabilir ama parola ve oturum anahtarı
              tanımlıysa giriş ekranı zaten çalışıyor. Kullanıcı burada
              tıkanmasın diye o kapıyı açıkça göster. */}
          {korumaTamam && !veritabaniHazirMi() && (
            <div className="uyari uyari-dikkat">
              <span>⚠</span>
              <span>
                Veritabanı henüz bağlanmamış ama parola koruması hazır —{' '}
                <a href="/giris">giriş ekranını</a> şimdiden deneyebilirsin.
                Kayıt ekranları bağlantı kurulduktan sonra açılacak.
              </span>
            </div>
          )}
        </>
      )}
    </main>
  )
}
