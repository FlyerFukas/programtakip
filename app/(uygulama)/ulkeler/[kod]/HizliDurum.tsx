'use client'

import { useTransition } from 'react'
import { ulkeDurumDegistir, ulkeOncelikDegistir } from '@/app/eylemler'
import { DURUMLAR, ONCELIKLER } from '@/lib/sabitler'

/**
 * Detay sayfasından tek tıkla durum/öncelik değiştirme.
 *
 * Düzenleme formuna girip çıkmadan "eledim" işaretleyebilmek, araştırma
 * sırasında en sık yapılan hareket. Formu açmak zorunda bırakmak bu işi
 * yapmaktan caydırır ve liste bayatlar.
 */

const SECILI = {
  background: 'var(--vurgu-soluk)',
  borderColor: 'var(--vurgu)',
  color: 'var(--vurgu)',
  fontWeight: 580,
} as const

export function HizliDurum({
  kod, durum, oncelik,
}: {
  kod: string
  durum: string
  oncelik: number
}) {
  const [bekliyor, gecisBasla] = useTransition()

  function gonder(eylem: (fd: FormData) => Promise<void>, alan: string, deger: string) {
    gecisBasla(async () => {
      const fd = new FormData()
      fd.set('kod', kod)
      fd.set(alan, deger)
      await eylem(fd)
    })
  }

  return (
    <div style={{ opacity: bekliyor ? 0.6 : 1, transition: 'opacity .15s' }}>
      <div className="k2 soluk-2 alt-s">Durum</div>
      <div className="secim-liste alt-m">
        {DURUMLAR.map((d) => (
          <button
            key={d.kod}
            type="button"
            className="secim"
            onClick={() => d.kod !== durum && gonder(ulkeDurumDegistir, 'durum', d.kod)}
            title={d.aciklama}
            aria-pressed={d.kod === durum}
            style={d.kod === durum ? SECILI : undefined}
          >
            <span aria-hidden>{d.simge}</span>
            {d.ad}
          </button>
        ))}
      </div>

      <div className="k2 soluk-2 alt-s">Öncelik</div>
      <div className="secim-liste">
        {ONCELIKLER.map((o) => (
          <button
            key={o.kod}
            type="button"
            className="secim"
            onClick={() => o.kod !== oncelik && gonder(ulkeOncelikDegistir, 'oncelik', String(o.kod))}
            aria-pressed={o.kod === oncelik}
            style={o.kod === oncelik ? SECILI : undefined}
          >
            <span aria-hidden>{o.simge}</span>
            {o.ad}
          </button>
        ))}
      </div>
    </div>
  )
}
