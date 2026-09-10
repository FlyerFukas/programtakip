/**
 * Alan kapsama denetimi.
 *
 *   npm run dogrula:alanlar
 *
 * NEDEN VAR: Forma yeni bir alan eklerken detay sayfasına eklemeyi unutmak
 * çok kolay — kullanıcı veriyi girer, kaydedilir, ama hiçbir yerde
 * göremez. Veri kaybı gibi hissettirir, oysa veri yerindedir. BursTakip'te
 * tam olarak `kontenjan_not` alanında yaşandı: forma eklendi, detayda başka
 * bir alanın koşuluna gömülü kaldı ve o alan boşken görünmez oldu. Aynı
 * taramada `alanlar` dizisinin hiç gösterilmediği de ortaya çıktı.
 *
 * Yapılan statik bir denetim: tipteki her alanın detay sayfasında GEÇİYOR
 * olmasını arıyor. Doğru render edildiğini kanıtlamaz — ama unutulmadığını
 * kanıtlar, ki asıl hata oydu.
 *
 * BURSTAKIP'TEN FARK: orada tek kayıt tipi vardı (`Burs`), burada üç katman
 * var ve üçünün de kendi formu ve detay sayfası oluyor. Betik üçünü birden
 * tarıyor. Henüz yazılmamış katman ATLANIYOR ve atlandığı ekrana yazılıyor —
 * sessizce "geçti" demiyor.
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const yolu = (p: string) => resolve(KOK, p)
const oku = (p: string) => readFileSync(yolu(p), 'utf8')

type Katman = {
  tip: string
  /** Detay sayfasındaki değişken adı — `program.ad` gibi aranıyor. */
  degisken: string
  detay: string
  /**
   * Kullanıcıya doğrudan gösterilmesi gerekmeyen alanlar.
   * Her biri için sebep yazılı — listeye eklemek bilinçli bir karar olmalı.
   */
  muaf: Record<string, string>
}

const ORTAK_MUAF = {
  id: 'teknik kimlik',
  olusturma: 'zaman damgası, ayarlar sayfasında sayılıyor',
  guncelleme: 'zaman damgası',
}

const KATMANLAR: Katman[] = [
  {
    tip: 'Ulke',
    degisken: 'ulke',
    detay: 'app/(uygulama)/ulkeler/[kod]/page.tsx',
    muaf: {
      // `id` yok (birincil anahtar `kod`), zaman damgaları detayda gösteriliyor —
      // bu yüzden ORTAK_MUAF yayılmıyor, tek muaf `kod`.
      kod: 'başlıkta bayrak ve ülke adı olarak çiziliyor',
    },
  },
  {
    tip: 'Universite',
    degisken: 'universite',
    detay: 'app/(uygulama)/universiteler/[id]/page.tsx',
    muaf: {
      ...ORTAK_MUAF,
      ulke_kodu: 'başlıkta bayrak + ülke adı olarak çiziliyor',
    },
  },
  {
    tip: 'Program',
    degisken: 'program',
    detay: 'app/(uygulama)/programlar/[id]/page.tsx',
    muaf: {
      ...ORTAK_MUAF,
      universite_id: 'gömülü `universite` nesnesi üzerinden gösteriliyor',
      son_tarih_tipi: 'sonTarihMetni() içinde yorumlanıyor',
      son_tarih: 'sonTarihMetni() içinde',
      son_tarih_baslangic: 'sonTarihMetni() içinde',
      son_tarih_bitis: 'sonTarihMetni() içinde',
    },
  },
]

/** `export type X = { … }` gövdesindeki alan adlarını çeker. */
function tipAlanlari(kaynak: string, tip: string): string[] | null {
  const bas = kaynak.indexOf(`export type ${tip} = {`)
  if (bas === -1) return null
  const son = kaynak.indexOf('\n}', bas)
  if (son === -1) return null

  const govde = kaynak.slice(bas, son)
  return [...govde.matchAll(/^\s{2}([a-z_]+)[?]?:/gm)].map((m) => m[1])
}

console.log('\n═══ Alan kapsama denetimi ═══\n')

const tiplerVar = existsSync(yolu('lib/tipler.ts'))
const kaynak = tiplerVar ? oku('lib/tipler.ts') : ''

let hata = false
let taranan = 0

for (const k of KATMANLAR) {
  const alanlar = tiplerVar ? tipAlanlari(kaynak, k.tip) : null

  if (!alanlar) {
    console.log(`  ⏭  ${k.tip.padEnd(12)} atlandı — lib/tipler.ts içinde \`export type ${k.tip}\` yok`)
    continue
  }
  if (!existsSync(yolu(k.detay))) {
    console.log(`  ⏭  ${k.tip.padEnd(12)} atlandı — detay sayfası yok (${k.detay})`)
    continue
  }

  taranan++
  const detay = oku(k.detay)
  const eksikler: string[] = []
  let muafSayisi = 0

  for (const alan of alanlar) {
    if (alan in k.muaf) { muafSayisi++; continue }
    if (!new RegExp(`${k.degisken}\\.${alan}\\b`).test(detay)) eksikler.push(alan)
  }

  const gecen = alanlar.length - eksikler.length - muafSayisi
  console.log(
    `  ${eksikler.length ? '✗' : '✓'}  ${k.tip.padEnd(12)}` +
    ` alan ${String(alanlar.length).padStart(3)}` +
    ` · detayda ${String(gecen).padStart(3)}` +
    ` · muaf ${String(muafSayisi).padStart(2)}`,
  )

  if (eksikler.length) {
    hata = true
    for (const a of eksikler) console.log(`       ✗ ${k.degisken}.${a}`)
  }
}

/* ═══════════════════════════════════ taslak → form bağlantı denetimi ══════ */

/*
 * Ayrıştırıcının doldurduğu her alan formda gerçekten okunuyor mu?
 *
 * NEDEN VAR: Aşama 11'de `tezli` ve `ucret_muafiyeti` alanlarının
 * `<UcluSecim deger={program?.tezli} />` diye yazıldığı görüldü — yalnızca
 * MEVCUT kayıttan okuyor, taslaktan değil. Yani Claude "tez zorunlu" diye
 * okuyor, kullanıcı formda "Bilinmiyor" görüyordu. Hiçbir hata vermiyor,
 * hiçbir test kırmıyor; alan sessizce düşüyordu.
 *
 * Kural: `Taslak` tipindeki her alan ProgramFormu içinde ya `ilk('alan',…)`
 * ile okunmalı ya da aşağıdaki listede sebebiyle muaf olmalı.
 */

/** Formun kendisi tarafından değil, başka yolla taşınan taslak alanları. */
const TASLAK_MUAF: Record<string, string> = {
  universite_adi: "üniversite adı id'ye çevrilip `universiteId` prop'uyla geliyor (app/eylemler.ts)",
  ulke_kodu: 'ülke programda saklanmıyor, üniversiteden geliyor (§4.1)',
  sehir: 'şehir üniversite kaydında; program formunda alanı yok',
}

const formKaynak = existsSync(yolu('bilesenler/ProgramFormu.tsx'))
  ? oku('bilesenler/ProgramFormu.tsx')
  : ''
const taslakAlanlari = tipAlanlari(kaynak, 'Taslak')

if (formKaynak && taslakAlanlari) {
  /*
   * Kaynağı tek biçime indiriyoruz:
   *  - boşlukları siliyoruz, çünkü çağrı satıra bölünmüş olabiliyor
   *    (`ilk<string[]>(\n  'baslangic_donemleri', …`) — ilk denemede bu
   *    yüzden yanlış alarm verdi,
   *  - genel tip parametresini atıyoruz (`ilk<T>(` → `ilk(`).
   */
  const sadeForm = formKaynak.replace(/\s+/g, '').replace(/ilk<[^>]*>\(/g, 'ilk(')
  const bagsiz = taslakAlanlari.filter((alan) => (
    !(alan in TASLAK_MUAF)
    && !sadeForm.includes(`ilk('${alan}'`)
    && !sadeForm.includes(`ilk("${alan}"`)
  ))

  const muafSayisi = taslakAlanlari.filter((a) => a in TASLAK_MUAF).length
  console.log('')
  console.log(
    `  ${bagsiz.length ? '✗' : '✓'}  Taslak       alan ${String(taslakAlanlari.length).padStart(3)}` +
    ` · formda ${String(taslakAlanlari.length - bagsiz.length - muafSayisi).padStart(3)}` +
    ` · muaf ${String(muafSayisi).padStart(2)}`,
  )

  if (bagsiz.length) {
    hata = true
    for (const a of bagsiz) console.log(`       ✗ Taslak.${a} — ProgramFormu bunu okumuyor`)
    console.log('')
    console.log('  Ayrıştırıcı bu alanları dolduruyor ama form onları görmezden geliyor;')
    console.log('  kullanıcı boş bir alan görüyor ve düşen veriyi fark etmiyor.')
  }
}

if (hata) {
  console.log('')
  console.log('  Yukarıdaki alanları kullanıcı forma girebiliyor ama hiçbir yerde göremiyor.')
  console.log('  Ya detay sayfasına ekle, ya da sebebiyle birlikte MUAF listesine al.')
  console.log('')
  process.exit(1)
}

if (taranan === 0) {
  console.log('')
  console.log('  Henüz taranacak katman yok. Tipler ve detay sayfaları geldikçe')
  console.log('  bu denetim kendiliğinden devreye girecek (Aşama 2, 3, 4).')
}

console.log('\n  ✓ Formda girilebilen her alan detay sayfasında gösteriliyor.\n')
