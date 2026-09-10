'use client'

import { useTransition } from 'react'
import {
  programDurumDegistir, programOncelikDegistir, programUygunlukDegistir,
} from '@/app/eylemler'
import { DURUMLAR, ONCELIKLER, UYGUNLUKLAR } from '@/lib/sabitler'

/**
 * Detay sayfasından tek tıkla durum / uygunluk / öncelik değiştirme.
 *
 * Uygunluk ayrı bir satır olarak duruyor çünkü durumdan farklı bir soruya
 * cevap veriyor: durum "nerede olduğun", uygunluk "girebilir misin". Elenmiş
 * bir programla vazgeçilmiş bir programı aynı alanda toplamak ikisini de
 * anlamsızlaştırırdı.
 */

const SECILI = {
  background: 'var(--vurgu-soluk)',
  borderColor: 'var(--vurgu)',
  color: 'var(--vurgu)',
  fontWeight: 580,
} as const

export function HizliDurum({
  id, durum, oncelik, uygunluk,
}: {
  id: string
  durum: string
  oncelik: number
  uygunluk: string
}) {
  const [bekliyor, gecisBasla] = useTransition()

  function gonder(eylem: (fd: FormData) => Promise<void>, alan: string, deger: string) {
    gecisBasla(async () => {
      const fd = new FormData()
      fd.set('id', id)
      fd.set(alan, deger)
      await eylem(fd)
    })
  }

  return (
    <div style={{ opacity: bekliyor ? 0.6 : 1, transition: 'opacity .15s' }}>
      <div className="k2 soluk-2 alt-s">Uygunluk — transkriptine bakarak sen işaretle</div>
      <div className="secim-liste alt-m">
        {UYGUNLUKLAR.map((u) => (
          <button
            key={u.kod}
            type="button"
            className="secim"
            onClick={() =>
              u.kod !== uygunluk && gonder(programUygunlukDegistir, 'uygunluk', u.kod)}
            title={u.aciklama}
            aria-pressed={u.kod === uygunluk}
            style={u.kod === uygunluk ? SECILI : undefined}
          >
            <span aria-hidden>{u.simge}</span>
            {u.ad}
          </button>
        ))}
      </div>

      <div className="k2 soluk-2 alt-s">Durum</div>
      <div className="secim-liste alt-m">
        {DURUMLAR.map((d) => (
          <button
            key={d.kod}
            type="button"
            className="secim"
            onClick={() => d.kod !== durum && gonder(programDurumDegistir, 'durum', d.kod)}
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
            onClick={() =>
              o.kod !== oncelik && gonder(programOncelikDegistir, 'oncelik', String(o.kod))}
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
