'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { havuzGuncelleEylem, type EylemSonucu } from '@/app/eylemler'
import { HAVUZ_DURUMLARI } from '@/lib/tipler'
import { tarihKisa } from '@/lib/tarih'
import type { HavuzSatiri } from '@/lib/belge-takvim'

/**
 * Elindeki kalıcı bir belgenin kartı.
 *
 * NEDEN AYRI EKRAN: IELTS'i bir kere alırsın, beş programda kullanırsın.
 * Program program işaretlemek hem sıkıcı hem yanlış — belgenin kendisi
 * program bazlı bir şey değil.
 *
 * GEÇERLİLİK TARİHİ burada asıl mesele. "Hazır" işaretleyip tarihi boş
 * bırakmak, uygulamanın hazırlık süresini 90 günden 3 güne indirmesine yol
 * açar; belge o sırada süresi dolmuşsa uygulama sana yalan söylemiş olur.
 * Kart bu yüzden tarihi ısrarla istiyor.
 */

function Kaydet() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="dugme dugme-ana dugme-kucuk" disabled={pending}>
      {pending ? 'Kaydediliyor…' : 'Kaydet'}
    </button>
  )
}

export function HavuzKarti({ belge }: { belge: HavuzSatiri }) {
  const [sonuc, eylem] = useActionState<EylemSonucu, FormData>(havuzGuncelleEylem, {})
  const [acik, setAcik] = useState(false)
  const [durum, setDurum] = useState(belge.durum)

  const simge = HAVUZ_DURUMLARI.find((d) => d.kod === belge.durum)?.simge ?? '⬜'

  return (
    <div className="kart kart-sik">
      <div className="satir-arasi satir-sar" style={{ alignItems: 'flex-start', gap: 8 }}>
        <div className="buyu">
          <div className="satir" style={{ gap: 7 }}>
            <span aria-hidden style={{ fontSize: '1.1rem' }}>{belge.simge}</span>
            <strong>{belge.ad}</strong>
            <span aria-hidden title={belge.durum}>{simge}</span>
          </div>

          <div className="k2 soluk ust-s">
            {belge.istenen > 0
              ? `${belge.istenen} program istiyor`
              : 'Hiçbir program istemiyor — yine de önden alabilirsin'}
            {belge.gecerlilikBitis && ` · geçerlilik ${tarihKisa(belge.gecerlilikBitis)}`}
          </div>

          {belge.gecerlilikUyarisi && (
            <div className="uyari uyari-dikkat ust-s k2">
              <span aria-hidden>⚠</span>
              <span>{belge.gecerlilikUyarisi}</span>
            </div>
          )}

          {belge.notlar && <div className="k2 soluk-2 ust-s">{belge.notlar}</div>}
        </div>

        <button
          type="button"
          className="dugme dugme-sade dugme-kucuk"
          onClick={() => setAcik((a) => !a)}
          aria-expanded={acik}
        >
          {acik ? 'Kapat' : 'Düzenle'}
        </button>
      </div>

      {acik && (
        <form action={eylem} className="ust-m">
          <input type="hidden" name="belge_kodu" value={belge.kod} />

          <div className="izgara izgara-2" style={{ gap: 8 }}>
            <label className="k2 soluk">
              Durum
              <select
                name="durum"
                value={durum}
                onChange={(e) => setDurum(e.target.value as typeof durum)}
              >
                {HAVUZ_DURUMLARI.map((d) => (
                  <option key={d.kod} value={d.kod}>{d.simge} {d.ad}</option>
                ))}
              </select>
            </label>

            <label className="k2 soluk">
              Geçerlilik bitişi
              <input
                type="date"
                name="gecerlilik_bitis"
                defaultValue={belge.gecerlilikBitis ?? ''}
              />
            </label>
          </div>

          {durum === 'hazir' && (
            <div className="uyari uyari-bilgi k2 alt-s">
              <span aria-hidden>ℹ</span>
              <span>
                Süresi olan bir belgeyse (IELTS/TOEFL 2 yıl) <strong>geçerlilik
                tarihini gir</strong>. Boş bırakırsan uygulama belgeyi süresiz
                geçerli sayar ve hazırlık süresini 3 güne indirir.
              </span>
            </div>
          )}

          <label className="k2 soluk">
            Not
            <input
              type="text"
              name="notlar"
              defaultValue={belge.notlar ?? ''}
              placeholder="Overall 7.0, W 6.5 — bazı programlar 7.0 istiyor"
            />
          </label>

          {sonuc.hata && (
            <div className="uyari uyari-hata k2 ust-s" role="alert">
              <span aria-hidden>⚠</span>
              <span>{sonuc.hata}</span>
            </div>
          )}

          <div className="satir ust-s" style={{ justifyContent: 'flex-end' }}>
            {sonuc.tamam && <span className="k2 soluk">{sonuc.mesaj}</span>}
            <Kaydet />
          </div>
        </form>
      )}
    </div>
  )
}
