import Link from 'next/link'

/**
 * Henüz yazılmamış ekranların yer tutucusu.
 *
 * Neden boş bir sayfa yerine bu: Aşama 0'da gezinti çubuğunda altı bağlantı
 * var ama arkalarında ekran yok. Tıklayınca 404 gelseydi gezintinin kendisi
 * bozuk görünürdü; burada hangi ekranın hangi aşamada geleceği yazılı, yani
 * kabuk çalışıyor ve eksik olan şey açıkça söyleniyor.
 *
 * Her ekran yazıldığında bu bileşeni kullanan sayfa tamamen değişiyor.
 * Sonunda hiçbir yerde kalmamalı — kaldığı yer, bitmemiş aşama demek.
 */
/**
 * Sayının okunuşuna göre bulunma hâli eki: "Aşama 4'te", "Aşama 6'da".
 *
 * Hepsine 'de' yazmak yanlış olurdu — 4 "dört" olduğu için sert ünsüzle
 * bitiyor ve 4'TE oluyor, 6 "altı" olduğu için kalın ünlüyle bitiyor ve
 * 6'DA oluyor. Küçük bir tablo, çünkü kullanılan aralık 0–14 ile sınırlı.
 */
const BULUNMA_EKI: Record<string, string> = {
  '0': 'da', '1': 'de', '2': 'de', '3': 'te', '4': 'te',
  '5': 'te', '6': 'da', '7': 'de', '8': 'de', '9': 'da',
  '10': 'da', '11': 'de', '12': 'de', '13': 'te', '14': 'te',
}

export function Yakinda({
  baslik,
  simge,
  asama,
  aciklama,
}: {
  baslik: string
  simge: string
  /** PROJE.md §9'daki aşama numarası. */
  asama: string
  aciklama: string
}) {
  return (
    <main className="icerik">
      <div className="bos kart">
        <div className="bos-simge" aria-hidden>{simge}</div>
        <h3>{baslik}</h3>
        <p className="k1" style={{ maxWidth: 460, margin: '0 auto' }}>{aciklama}</p>
        <p className="ust-m">
          <span className="rozet rozet-mavi">
            Aşama {asama}&apos;{BULUNMA_EKI[asama] ?? 'de'} gelecek
          </span>
        </p>
        <p className="k2 soluk-2 ust-m">
          Aşama listesi <code>PROJE.md</code> §9&apos;da. ·{' '}
          <Link href="/">Panele dön</Link>
        </p>
      </div>
    </main>
  )
}
