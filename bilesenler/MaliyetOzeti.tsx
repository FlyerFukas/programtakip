import { toplamMaliyet, paraYaz, eurodanCevir, type MaliyetSonucu } from '@/lib/para'
import type { ProgramGenis, KurAyari } from '@/lib/tipler'

/**
 * Toplam net maliyet dökümü (PROJE.md §4.6).
 *
 * EN ÖNEMLİ DAVRANIŞ: eksik kalem sıfır sayılmıyor. 40.000 EUR'luk bir
 * programı yaşam gideri girilmediği için 20.000 EUR diye göstermek, kararı
 * bozan bir yalandır. Onun yerine toplam "en az" olarak işaretleniyor ve
 * hangi kalemin eksik olduğu tek tek yazılıyor.
 *
 * Hem EUR hem TRY gösteriliyor — şartname ikisini de istiyor, çünkü karar
 * EUR'da veriliyor ama para TRY'den çıkıyor.
 */
export function MaliyetOzeti({
  program,
  kur,
  sade = false,
}: {
  program: ProgramGenis
  kur: KurAyari
  /** Kart içinde kısa hâli — yalnızca toplam ve eksik sayısı. */
  sade?: boolean
}) {
  const m = toplamMaliyet(program, kur.kurlar)
  const tl = eurodanCevir(m.euro, 'TRY', kur.kurlar)

  if (sade) return <SadeToplam m={m} euro={m.euro} tl={tl} />

  return (
    <>
      <div className="satir-arasi satir-sar alt-m" style={{ alignItems: 'flex-end' }}>
        <div>
          <div className="k2 soluk-2">
            {m.tamMi ? 'Toplam net maliyet' : 'Toplam net maliyet (en az)'}
          </div>
          <div className="sayac-buyuk">{paraYaz(m.euro, 'EUR')}</div>
          {tl !== null && (
            <div className="k1 soluk">≈ {paraYaz(tl, 'TRY')}</div>
          )}
        </div>
        {!m.tamMi && (
          <span className="rozet rozet-turuncu">
            {m.eksikler.length} kalem eksik
          </span>
        )}
      </div>

      {m.kalemler.length > 0 && (
        <div className="tablo-sar alt-m">
          <table>
            <thead>
              <tr>
                <th>Kalem</th>
                <th className="sag">Girilen</th>
                <th className="sag">EUR</th>
              </tr>
            </thead>
            <tbody>
              {m.kalemler.map((k) => (
                <tr key={k.ad}>
                  <td>
                    {k.eksi && <span aria-hidden>− </span>}
                    {k.ad}
                    {k.aciklama && (
                      <div className="k2 soluk-2">{k.aciklama}</div>
                    )}
                  </td>
                  <td className="sag k1">{paraYaz(k.tutar, k.birim)}</td>
                  <td className="sag kalin">
                    {k.eksi ? '−' : ''}{paraYaz(k.euro, 'EUR')}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="kalin">Toplam</td>
                <td />
                <td className="sag kalin">{paraYaz(m.euro, 'EUR')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Eksik kalemleri SAYMAK yetmez, hangileri olduğu yazılmalı —
          yoksa kullanıcı neyi doldurması gerektiğini bilemez. */}
      {!m.tamMi && (
        <div className="uyari uyari-dikkat">
          <span aria-hidden>⚠</span>
          <span>
            <strong>Bu toplam eksik.</strong> Hesaba giremeyen kalemler:
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {m.eksikler.map((e) => <li key={e} className="k2">{e}</li>)}
            </ul>
          </span>
        </div>
      )}

      <p className="k2 soluk-2 ust-m bosluk-0">
        Kurlar {kur.tarih} tarihli ve sabit — canlı kur çekilmiyor.
        Ayarlar ekranından güncelleyebilirsin.
      </p>
    </>
  )
}

function SadeToplam({
  m, euro, tl,
}: {
  m: MaliyetSonucu
  euro: number
  tl: number | null
}) {
  if (m.kalemler.length === 0) {
    return <span className="k2 soluk-2" style={{ fontStyle: 'italic' }}>hesaplanamıyor</span>
  }
  return (
    <span title={m.tamMi ? undefined : `${m.eksikler.length} kalem eksik: ${m.eksikler.join('; ')}`}>
      <span className="kalin">{m.tamMi ? '' : '≥ '}{paraYaz(euro, 'EUR')}</span>
      {tl !== null && <span className="k2 soluk-2"> · {paraYaz(tl, 'TRY')}</span>}
    </span>
  )
}
