'use client'

import { useState } from 'react'
import Link from 'next/link'
import { bayrak } from '@/lib/ulkeler'
import { tarihFormat, tarihKisa, HAZIRLIK_ETIKET } from '@/lib/tarih'
import { EKLEME_SURESI, type BelgeSatiri } from '@/lib/belge-takvim'
import { DurumRozeti } from '@/bilesenler/Rozetler'

/**
 * Belge takviminin tek satırı.
 *
 * ASIL BİLGİ "başlama tarihi", son tarih değil (PROJE.md §6.3). Satır
 * kapalıyken bile gördüğün şey "ne zaman başlamalıyım" — hangi programlara
 * ait olduğu ayrıntı, açınca geliyor.
 */

const HAZIRLIK_RENK: Record<BelgeSatiri['hazirlik'], string> = {
  gecikti: 'kirmizi',
  basla: 'turuncu',
  rahat: 'yesil',
  gecersiz: 'notr',
}

export function BelgeSatiriKarti({ satir }: { satir: BelgeSatiri }) {
  const [acik, setAcik] = useState(false)

  return (
    <div
      className={`kart serit serit-${satir.hazirlik === 'gecikti' ? 'kritik'
        : satir.hazirlik === 'basla' ? 'yakin'
        : satir.hazirlik === 'rahat' ? 'uzak' : 'belirsiz'}`}
      style={{ opacity: satir.bitti ? 0.6 : 1 }}
    >
      <div className="satir-arasi satir-sar" style={{ alignItems: 'flex-start', gap: 8 }}>
        <div className="buyu">
          <div className="satir satir-sar" style={{ gap: 8 }}>
            <span aria-hidden style={{ fontSize: '1.2rem' }}>{satir.simge}</span>
            <h3>{satir.ad}</h3>
            {satir.bitti && <span className="rozet rozet-yesil">✓ tamam</span>}
          </div>

          <div className="k2 soluk ust-s">
            {satir.toplam} programda isteniyor
            {satir.tamamlanan > 0 && ` · ${satir.tamamlanan} tanesinde hazır işaretli`}
            {satir.kalicilik === 'havuz' ? ' · kalıcı belge' : ' · programa özel'}
          </div>
        </div>

        <span className={`rozet rozet-${HAZIRLIK_RENK[satir.hazirlik]}`}>
          {HAZIRLIK_ETIKET[satir.hazirlik]}
        </span>
      </div>

      {/* ══════════════ asıl mesaj: ne zaman başlamalısın ══════════════ */}
      {!satir.bitti && satir.baslamaTarihi && (
        <div className="izgara izgara-3 ust-m" style={{ gap: 8 }}>
          <div>
            <div className="k2 soluk-2">En geç başlama günü</div>
            <div className="kalin">{tarihFormat(satir.baslamaTarihi)}</div>
          </div>
          <div>
            <div className="k2 soluk-2">Hazırlık süresi</div>
            <div className="kalin">
              {satir.hazirlikGun} gün
              {satir.elindeGecerli && satir.tamHazirlikGun !== satir.hazirlikGun && (
                <span className="k2 soluk-2"> (tam {satir.tamHazirlikGun})</span>
              )}
            </div>
          </div>
          <div>
            <div className="k2 soluk-2">En yakın son tarih</div>
            <div className="kalin">
              {satir.enYakinTarih ? tarihKisa(satir.enYakinTarih) : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Havuzda geçerli belge varsa hazırlık süresi neden kısaldı, söyle. */}
      {satir.elindeGecerli && (
        <div className="uyari uyari-basari k2 ust-m">
          <span aria-hidden>✓</span>
          <span>
            Elinde geçerli hâli var — hazırlık {satir.tamHazirlikGun} gün değil{' '}
            <strong>{EKLEME_SURESI} gün</strong> (yükleme payı).
            {satir.gecerlilikBitis && ` Geçerlilik: ${tarihKisa(satir.gecerlilikBitis)}.`}
          </span>
        </div>
      )}

      {satir.gecerlilikUyarisi && (
        <div className="uyari uyari-hata k2 ust-m">
          <span aria-hidden>⚠</span>
          <span>{satir.gecerlilikUyarisi}</span>
        </div>
      )}

      {satir.hazirlik === 'gecikti' && satir.payGun !== null && satir.payGun < 0 && (
        <div className="uyari uyari-hata k2 ust-m">
          <span aria-hidden>⏰</span>
          <span>
            Başlama günü <strong>{Math.abs(satir.payGun)} gün</strong> geride kaldı.
            Bu belge {satir.hazirlikGun} gün sürüyor, en yakın son tarihe{' '}
            {satir.kalan} gün var.
          </span>
        </div>
      )}

      {satir.aciklama && <p className="k2 soluk-2 ust-m bosluk-0">{satir.aciklama}</p>}

      {/* ══════════════════════ hangi programlar ══════════════════════ */}
      <div className="ust-m">
        <button
          type="button"
          className="dugme dugme-sade dugme-kucuk"
          onClick={() => setAcik((a) => !a)}
          aria-expanded={acik}
        >
          {acik ? 'Programları gizle ▲' : `Hangi programlar (${satir.toplam}) ▼`}
        </button>
      </div>

      {acik && (
        <div className="sutun ust-s" style={{ gap: 6 }}>
          {satir.programlar.map((p) => (
            <Link
              key={p.program_id}
              href={`/programlar/${p.program_id}`}
              className="satir-arasi kart kart-sik"
              style={{ color: 'inherit', background: 'var(--kart-2)' }}
            >
              <div className="buyu">
                <div className={p.hazir ? 'soluk' : 'kalin'}
                     style={p.hazir ? { textDecoration: 'line-through' } : undefined}>
                  <span aria-hidden>{bayrak(p.ulke_kodu)}</span> {p.program_ad}
                </div>
                <div className="k2 soluk-2">
                  {p.universite_ad}
                  {p.hedefTarih
                    ? ` · ${tarihKisa(p.hedefTarih)}${p.kalan !== null ? ` (${p.kalan} gün)` : ''}`
                    : ' · tarih yok'}
                </div>
                {p.notlar && <div className="k2 soluk-2">{p.notlar}</div>}
              </div>
              <div className="satir" style={{ gap: 6 }}>
                {p.hazir && <span className="rozet rozet-yesil">✓</span>}
                <DurumRozeti kod={p.durum} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
