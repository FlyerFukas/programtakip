'use client'

import { useTransition, useOptimistic } from 'react'
import { programBelgeDegistir } from '@/app/eylemler'
import { tarihKisa, HAZIRLIK_ETIKET } from '@/lib/tarih'
import type { programBelgeListesi } from '@/lib/belge-takvim'

type BelgeSatiri = ReturnType<typeof programBelgeListesi>[number]

/**
 * Programın istediği belgelerin hazırlık kontrol listesi.
 *
 * Her satır kendi HAZIRLIK durumunu taşıyor: bu programın son tarihine göre
 * o belgeye başlamak için geç mi kalındı. Havuzda geçerli hâli olan belgeler
 * "elinde var" diye işaretleniyor ve hazırlık süresi 3 güne düşüyor — ama
 * kutu OTOMATİK İŞARETLENMİYOR. Yüklemediğin bir evrakı yüklenmiş göstermek,
 * uygulamanın söyleyebileceği en pahalı yalan olurdu.
 *
 * `useOptimistic`: kutu tıklanır tıklanmaz doluyor, sunucu cevabı beklenmiyor.
 * Onlarca kutunun olduğu bir listede her tıkta yarım saniye beklemek işareti
 * bırakmaktan caydırır.
 */

const HAZIRLIK_RENK: Record<BelgeSatiri['hazirlik'], string> = {
  gecikti: 'kirmizi',
  basla: 'turuncu',
  rahat: 'yesil',
  gecersiz: 'notr',
}

export function BelgeKontrolListesi({
  programId,
  belgeler,
}: {
  programId: string
  belgeler: BelgeSatiri[]
}) {
  const hazirKodlar = new Set(belgeler.filter((b) => b.hazir).map((b) => b.kod))
  const [iyimser, iyimserAyarla] = useOptimistic(
    hazirKodlar,
    (mevcut: Set<string>, degisim: { kod: string; hazir: boolean }) => {
      const yeni = new Set(mevcut)
      if (degisim.hazir) yeni.add(degisim.kod)
      else yeni.delete(degisim.kod)
      return yeni
    },
  )
  const [, gecisBasla] = useTransition()

  if (belgeler.length === 0) {
    return (
      <p className="k2 soluk-2">
        Belge işaretlenmemiş. Formdan seçtiğin belgeler burada kontrol listesi
        olur ve <strong>belge takvimine</strong> girer.
      </p>
    )
  }

  function degistir(kod: string, hazir: boolean) {
    gecisBasla(async () => {
      iyimserAyarla({ kod, hazir })
      const fd = new FormData()
      fd.set('program_id', programId)
      fd.set('belge_kodu', kod)
      fd.set('hazir', hazir ? '1' : '0')
      await programBelgeDegistir(fd)
    })
  }

  const hazirSayisi = belgeler.filter((b) => iyimser.has(b.kod)).length
  const geciken = belgeler.filter((b) => !iyimser.has(b.kod) && b.hazirlik === 'gecikti')

  return (
    <>
      <div className="satir-arasi satir-sar alt-m">
        <span className="k2 soluk-2">{hazirSayisi} / {belgeler.length} hazır</span>
        {hazirSayisi === belgeler.length
          ? <span className="rozet rozet-yesil">✓ Belgeler tamam</span>
          : geciken.length > 0
            ? <span className="rozet rozet-kirmizi">{geciken.length} belgede geciktin</span>
            : null}
      </div>

      <div className="sutun" style={{ gap: 0 }}>
        {belgeler.map((b) => {
          const hazir = iyimser.has(b.kod)
          return (
            <label key={b.kod} className="kutu-satir">
              <input
                type="checkbox"
                checked={hazir}
                onChange={(e) => degistir(b.kod, e.target.checked)}
              />
              <span className="buyu">
                <span className="satir satir-sar" style={{ gap: 6 }}>
                  <span
                    className={hazir ? 'soluk' : 'kalin'}
                    style={hazir ? { textDecoration: 'line-through' } : undefined}
                  >
                    <span aria-hidden>{b.simge}</span> {b.ad}
                  </span>
                  {!hazir && b.hazirlik !== 'gecersiz' && (
                    <span className={`rozet rozet-${HAZIRLIK_RENK[b.hazirlik]}`}>
                      {HAZIRLIK_ETIKET[b.hazirlik]}
                    </span>
                  )}
                  {b.elindeGecerli && (
                    <span className="etiket etiket-vurgu" title="Havuzda geçerli hâli var">
                      ✓ elinde var
                    </span>
                  )}
                </span>

                <span className="k2 soluk-2" style={{ display: 'block' }}>
                  {b.kalicilik === 'havuz' ? 'kalıcı belge' : 'programa özel'}
                  {' · '}~{b.hazirlikGun} gün hazırlık
                  {b.baslamaTarihi && !hazir && (
                    <> · en geç <strong>{tarihKisa(b.baslamaTarihi)}</strong> başla</>
                  )}
                </span>

                {b.aciklama && (
                  <span className="k2 soluk-2" style={{ display: 'block' }}>{b.aciklama}</span>
                )}
                {b.notlar && (
                  <span className="k2 soluk" style={{ display: 'block' }}>{b.notlar}</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </>
  )
}
