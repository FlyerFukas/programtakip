'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { girisYap, type EylemSonucu } from '../eylemler'

function Gonder() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="dugme dugme-ana dugme-tam" disabled={pending}>
      {pending ? 'Kontrol ediliyor…' : 'Gir'}
    </button>
  )
}

export function GirisFormu() {
  const [sonuc, eylem] = useActionState<EylemSonucu, FormData>(girisYap, {})

  return (
    <form action={eylem}>
      <div className="alan">
        <label className="alan-etiket" htmlFor="parola">Parola</label>
        <input
          id="parola"
          name="parola"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-invalid={sonuc.hata ? 'true' : undefined}
          aria-describedby={sonuc.hata ? 'giris-hata' : undefined}
        />
      </div>

      {sonuc.hata && (
        <div id="giris-hata" className="uyari uyari-hata alt-m" role="alert">
          <span>⚠</span>
          <span>{sonuc.hata}</span>
        </div>
      )}

      <Gonder />
    </form>
  )
}
