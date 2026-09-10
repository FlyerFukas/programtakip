import {
  durumBul, ONCELIKLER, paraBul, belgeBul, kosulBul, uygunlukBul, TUR_KIMIN_ICIN,
} from '@/lib/sabitler'
import { bayrak, ulkeAdi } from '@/lib/ulkeler'
import {
  aciliyet, ACILIYET_ETIKET, geriSayimMetni, tarihKisa,
  type Aciliyet, type TarihliProgram,
} from '@/lib/tarih'
import type { Program, BasvuruTuru } from '@/lib/tipler'

/**
 * Küçük, durum taşıyan görsel parçalar. Hepsi sunucu bileşeni — hiçbiri
 * etkileşim içermiyor, sadece veriyi renge ve simgeye çeviriyorlar.
 */

/* ─────────────────────────────────────────────────────────── süreç durumu */

export function DurumRozeti({ kod }: { kod: string }) {
  const d = durumBul(kod)
  if (!d) return <span className="rozet">{kod}</span>
  return (
    <span className={`rozet rozet-${d.renk}`} title={d.aciklama}>
      <span aria-hidden>{d.simge}</span>
      {d.ad}
    </span>
  )
}

/* ────────────────────────────────────────────────────────────────── ülke */

export function UlkeEtiketi({ kod, kisa = false }: { kod: string; kisa?: boolean }) {
  return (
    <span className="satir" style={{ gap: 5, display: 'inline-flex' }}>
      <span aria-hidden>{bayrak(kod)}</span>
      {!kisa && <span>{ulkeAdi(kod)}</span>}
    </span>
  )
}

/* ────────────────────────────────────────────────────────────── öncelik */

export function OncelikRozeti({ oncelik }: { oncelik: number }) {
  const o = ONCELIKLER.find((x) => x.kod === oncelik)
  if (!o || oncelik === 2) return null // Orta öncelik varsayılan — gürültü yapmasın.
  return (
    <span className="etiket" title={`${o.ad} öncelik`}>
      <span aria-hidden>{o.simge}</span>
      {o.ad}
    </span>
  )
}

/* ─────────────────────────────────────────────────── geri dönüş yükümlülüğü */

/**
 * Kullanıcının KIRMIZI ÇİZGİSİ (PROJE.md §1).
 *
 * Mezuniyetten sonra Türkiye'ye dönmeyi zorunlu kılan hiçbir kanalla
 * ilgilenmiyor. Bu alan doluysa ülke listede ve detayda kırmızı işaretlenir —
 * sayfanın dibinde bir not olarak kalırsa fark edilmez.
 */
export function DonusUyarisi({ metin }: { metin: string | null }) {
  if (!metin) return null
  return (
    <span className="rozet rozet-kirmizi" title={metin}>
      <span aria-hidden>⛔</span>
      Geri dönüş yükümlülüğü
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────── para */

/**
 * Tutar + para birimi. Kur çevirisi YOK — o Aşama 7'de `lib/para.ts` ile
 * geliyor. Burada yalnızca doğru simgeyle ve binlik ayracıyla yazılıyor.
 *
 * Değer yoksa `null` döner, "0" yazmaz: eksik veriyi sıfır göstermek
 * PROJE.md §4.6'da açıkça yasaklanmış.
 */
export function Para({ tutar, birim }: { tutar: number | null; birim: string | null }) {
  if (tutar === null || tutar === undefined) return null
  const p = birim ? paraBul(birim) : undefined
  const sayi = tutar.toLocaleString('tr-TR', { maximumFractionDigits: 2 })
  return (
    <span title={p ? `${sayi} ${p.ad}` : undefined}>
      {sayi} {p?.simge ?? birim ?? ''}
    </span>
  )
}

/* ───────────────────────────────────────────────────────────── aciliyet */

const ACILIYET_RENK: Record<Aciliyet, string> = {
  gecti: 'kirmizi',
  bugun: 'kirmizi',
  kritik: 'kirmizi',
  yakin: 'turuncu',
  yaklasiyor: 'sari',
  uzak: 'yesil',
  surekli: 'mavi',
  belirsiz: 'notr',
  beklemede: 'sari',
  kapali: 'notr',
}

/**
 * Geri sayım rozeti. Geri sayımın anlamlı olmadığı durumlarda (sürekli
 * başvuru, tarihi açıklanmamış, başvurusu gönderilmiş, kapanmış kayıt)
 * aciliyet etiketini gösterir.
 */
export function GeriSayim({ program }: { program: TarihliProgram & Pick<Program, 'durum'> }) {
  const a = aciliyet(program)
  const metin = geriSayimMetni(program)
  return <span className={`rozet rozet-${ACILIYET_RENK[a]}`}>{metin || ACILIYET_ETIKET[a]}</span>
}

/** Kartın sol kenarındaki aciliyet şeridi için sınıf adı. */
export function seritSinifi(program: TarihliProgram & Pick<Program, 'durum'>): string {
  return `serit serit-${aciliyet(program)}`
}

/* ─────────────────────────────────────────────────────── uygunluk kapısı */

/**
 * Üç durumlu uygunluk ışığı.
 *
 * "Bakılmadı" da çiziliyor — sessizce boş bırakmak "uygunum" gibi okunur,
 * oysa henüz bakılmamış demektir.
 */
export function UygunlukRozeti({ kod }: { kod: string }) {
  const u = uygunlukBul(kod)
  if (!u) return null
  return (
    <span className={`rozet rozet-${u.renk}`} title={u.aciklama}>
      <span aria-hidden>{u.simge}</span>
      {u.ad}
    </span>
  )
}

/* ─────────────────────────────────────────────────────── başvuru turları */

/**
 * Tek bir başvuru turu.
 *
 * SENİN turun kalın ve renkli, AB turu soluk — PROJE.md §4.4'ün istediği
 * ayrım. İkisi aynı ağırlıkta çizilseydi özelliğin bütün anlamı kaybolurdu:
 * amaç zaten büyük puntoyla yazan AB tarihine bakmanı engellemek.
 */
export function TurSatiri({ tur, senin }: { tur: BasvuruTuru; senin: boolean }) {
  const k = TUR_KIMIN_ICIN.find((x) => x.kod === tur.kimin_icin)
  return (
    <div
      className="satir-arasi satir-sar kart kart-sik"
      style={{
        background: senin ? 'var(--vurgu-soluk)' : 'var(--kart-2)',
        borderColor: senin ? 'var(--vurgu)' : undefined,
        opacity: senin ? 1 : 0.72,
        gap: 8,
      }}
    >
      <div className="buyu">
        <div className={senin ? 'kalin' : undefined}>
          {tur.ad}
          {senin && <span className="etiket etiket-vurgu" style={{ marginLeft: 6 }}>senin turun</span>}
        </div>
        <div className="k2 soluk">
          {[
            k?.ad ?? 'kimin için belirtilmemiş',
            tur.baslangic,
            tur.sonuc_tarihi ? `sonuç ${tarihKisa(tur.sonuc_tarihi)}` : null,
          ].filter(Boolean).join(' · ')}
        </div>
        {tur.not && <div className="k2 soluk-2 ust-s">{tur.not}</div>}
      </div>
      <div className="sag">
        <div className={senin ? 'kalin' : 'soluk'}>
          {tur.son_tarih ? tarihKisa(tur.son_tarih) : 'tarih yok'}
        </div>
        <div className="k2 soluk-2">{k?.simge}</div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────── belgeler ve ön koşullar */

export function BelgeEtiketleri({ kodlar, enFazla }: { kodlar: string[]; enFazla?: number }) {
  if (kodlar.length === 0) {
    return <span className="soluk-2 k2">Belge girilmemiş</span>
  }

  const gosterilecek = enFazla ? kodlar.slice(0, enFazla) : kodlar
  const kalan = kodlar.length - gosterilecek.length

  return (
    <span className="secim-liste" style={{ gap: 4 }}>
      {gosterilecek.map((k) => {
        const s = belgeBul(k)
        return (
          <span key={k} className="etiket" title={s?.aciklama}>
            <span aria-hidden>{s?.simge ?? '📎'}</span>
            {s?.ad ?? k}
          </span>
        )
      })}
      {kalan > 0 && <span className="etiket">+{kalan}</span>}
    </span>
  )
}

export function KosulEtiketleri({ kodlar, enFazla }: { kodlar: string[]; enFazla?: number }) {
  if (kodlar.length === 0) return null

  const gosterilecek = enFazla ? kodlar.slice(0, enFazla) : kodlar
  const kalan = kodlar.length - gosterilecek.length

  return (
    <span className="secim-liste" style={{ gap: 4 }}>
      {gosterilecek.map((k) => {
        const s = kosulBul(k)
        return (
          <span key={k} className="etiket" title={s?.aciklama}>
            <span aria-hidden>{s?.simge ?? '•'}</span>
            {s?.ad ?? k}
          </span>
        )
      })}
      {kalan > 0 && <span className="etiket">+{kalan}</span>}
    </span>
  )
}

/* ────────────────────────────────────────────────────────────── etiketler */

export function EtiketListesi({ etiketler }: { etiketler: string[] }) {
  if (etiketler.length === 0) return null
  return (
    <>
      {etiketler.map((e) => (
        <span key={e} className="etiket">#{e}</span>
      ))}
    </>
  )
}

/* ───────────────────────────────────────────────────── detay satırı ────── */

/**
 * Detay sayfalarındaki "etiket + değer" satırı.
 *
 * NEDEN BİLEŞEN: BursTakip'te `kontenjan_not` alanı başka bir alanın
 * `{burs.kontenjan && …}` koşuluna gömülü kalmıştı; kontenjan boşsa not da
 * görünmüyordu ve kullanıcı bunu kendisi fark etti. Buradaki kural: her alan
 * KENDİ boşluğuna bakar, başka bir alanınkine değil. `npm run dogrula`
 * alanın sayfada geçtiğini kontrol ediyor, bu bileşen de doğru
 * gösterildiğini.
 */
export function Deger({
  etiket,
  deger,
  ipucu,
  cokSatir = false,
}: {
  etiket: string
  deger: React.ReactNode
  ipucu?: string
  /** Uzun serbest metinler için: değer etiketin altına, satır yapısı korunarak. */
  cokSatir?: boolean
}) {
  const bos = deger === null || deger === undefined || deger === '' || deger === false
  if (bos) return null

  return (
    <div className={cokSatir ? 'alt-m' : 'satir-arasi alt-s'} style={{ alignItems: 'baseline' }}>
      <span className="k2 soluk-2" title={ipucu} style={{ flexShrink: 0 }}>{etiket}</span>
      <span
        className={cokSatir ? 'k1 ust-s' : 'k1 sag'}
        style={cokSatir ? { whiteSpace: 'pre-wrap', display: 'block' } : undefined}
      >
        {deger}
      </span>
    </div>
  )
}

/** Üç durumlu (evet / hayır / bilinmiyor) alanları yazıya çevirir. */
export function EvetHayir({ deger }: { deger: boolean | null }) {
  if (deger === null || deger === undefined) return null
  return deger
    ? <span className="rozet rozet-yesil">✓ Evet</span>
    : <span className="rozet rozet-notr">✗ Hayır</span>
}

/* ───────────────────────────────────────────────────────────── boş durum */

export function BosDurum({
  simge = '📭',
  baslik,
  aciklama,
  children,
}: {
  simge?: string
  baslik: string
  aciklama?: string
  children?: React.ReactNode
}) {
  return (
    <div className="bos">
      <div className="bos-simge" aria-hidden>{simge}</div>
      <h3>{baslik}</h3>
      {aciklama && <p className="k1" style={{ maxWidth: 420, margin: '0 auto' }}>{aciklama}</p>}
      {children && <div className="ust-m">{children}</div>}
    </div>
  )
}
