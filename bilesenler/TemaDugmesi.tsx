'use client'

import { useEffect, useState } from 'react'

type Tema = 'sistem' | 'acik' | 'koyu'

const SIRA: Tema[] = ['sistem', 'acik', 'koyu']
const ETIKET: Record<Tema, { simge: string; ad: string }> = {
  sistem: { simge: '🖥️', ad: 'Sistem teması' },
  acik: { simge: '☀️', ad: 'Açık tema' },
  koyu: { simge: '🌙', ad: 'Koyu tema' },
}

/**
 * Üç konumlu tema anahtarı: sistem → açık → koyu → sistem.
 *
 * Tercih `<html data-tema>` üzerine yazılıyor; globals.css onu okuyor.
 * İlk boyamadan önce uygulanması için ayrıca layout.tsx içinde küçük bir
 * betik var — burası yalnızca değiştirme işini görüyor.
 */
export function TemaDugmesi() {
  const [tema, setTema] = useState<Tema>('sistem')
  // Sunucuda localStorage yok; ilk render'da simgeyi göstermeyip
  // hidrasyon uyuşmazlığını önlüyoruz.
  const [bindi, setBindi] = useState(false)

  useEffect(() => {
    const kayitli = localStorage.getItem('pt-tema')
    if (kayitli === 'acik' || kayitli === 'koyu') setTema(kayitli)
    setBindi(true)
  }, [])

  function degistir() {
    const sonraki = SIRA[(SIRA.indexOf(tema) + 1) % SIRA.length]
    setTema(sonraki)

    if (sonraki === 'sistem') {
      localStorage.removeItem('pt-tema')
      delete document.documentElement.dataset.tema
    } else {
      localStorage.setItem('pt-tema', sonraki)
      document.documentElement.dataset.tema = sonraki
    }
  }

  return (
    <button
      type="button"
      onClick={degistir}
      className="dugme dugme-sade dugme-kucuk"
      title={`${ETIKET[tema].ad} — değiştirmek için tıkla`}
      aria-label={ETIKET[tema].ad}
      style={{ minWidth: 34 }}
    >
      <span aria-hidden style={{ opacity: bindi ? 1 : 0 }}>{ETIKET[tema].simge}</span>
    </button>
  )
}
