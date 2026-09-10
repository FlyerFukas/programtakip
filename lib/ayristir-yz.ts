import 'server-only'
import {
  SEMA, sistemIstemi, taslagaCevir, EN_UZUN_METIN, type HamCikti,
} from './ayristir-taslak'
import type { AyristirmaSonucu, Saglayici } from './tipler'

/**
 * Program sayfasının metnini bir dil modeline okutup forma taslak çıkarma.
 *
 * NEDEN KURAL TABANLI AYRIŞTIRICI YAZILMADI (PROJE.md §9, Aşama 10 iptal):
 * BursTakip'teki kural tabanlı ayrıştırıcı 932 satır ve her yeni üniversite
 * sayfası için yeni bir kalıp istiyor — "Application deadline", "Deadline for
 * non-EU applicants", "Frist", tablo içinde tarih, dipnotta tarih. Program
 * sayfaları burs duyurularından çok daha çeşitli. İki ayrıştırıcıya birden
 * bakmak yerine tek yol seçildi.
 *
 * İKİ SAĞLAYICI: Claude ve Gemini. İkisi de "araç çağırma" ile aynı şemayı
 * dolduruyor, çıktı aynı `HamCikti` nesnesi, süzme katmanı ortak. Fark
 * yalnızca bu dosyadaki HTTP çağrısında. Neden ikisi birden:
 *  - biri kotayı doldurduğunda ya da yavaşladığında diğeri duruyor,
 *  - aynı sayfayı ikisine okutup karşılaştırmak mümkün.
 * Hangisinin anahtarı varsa o kullanılabilir; ikisi de varsa /ekle ekranında
 * seçiliyor, varsayılan Claude.
 *
 * BUNUN BEDELİ: hiçbir anahtar yoksa metinden ekleme çalışmaz. O yüzden
 * `/ekle` ekranı anahtarsız çökmüyor, elle eklemeye yönlendiriyor —
 * uygulamanın geri kalanı anahtara bağlı DEĞİL.
 *
 * GÜVEN SÖZLEŞMESİ: modelin döndürdüğü hiçbir kod olduğu gibi kabul
 * edilmiyor. Belge kodu, ülke kodu, para birimi, tarih biçimi — hepsi
 * `lib/ayristir-taslak.ts` içinde katalog listelerine karşı süzülüyor.
 * Modelin uydurduğu bir kod veritabanına giderse süzgeçler sessizce
 * bozulurdu (lib/sabitler.ts'in varlık sebebi). Elenen her şey `uyarilar`
 * içinde kullanıcıya söyleniyor.
 *
 * Ve hiçbir şey KAYDEDİLMİYOR: çıktı forma doldurulan bir taslak, kaydete
 * Kullanıcı basıyor.
 */

const ARAC_ADI = 'program_taslagi'
const ARAC_ACIKLAMA = 'Metinden çıkarılan program bilgileri.'
const AZAMI_JETON = 8000
/** Uzun sayfalar var; 120 sn cömert ama kullanıcıyı sonsuza kadar bekletmiyor. */
const ZAMAN_ASIMI = 120_000

/**
 * Model adları ortam değişkeniyle geçilebiliyor.
 *
 * Sebep: model isimleri koddaki en çabuk eskiyen şey. Yeni bir sürüm
 * çıktığında dağıtım yapmak yerine Vercel'den değişkeni değiştirmek yeter.
 */
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL?.trim() || 'claude-opus-5'
/* `-latest` takma adı bilerek: canlıda `gemini-2.5-pro` 404 verdi (ad
   emekliye ayrılmış ama ListModels çıktısında hâlâ duruyordu). Takma ad
   sürüm değişimlerini kendi yutuyor; yine de tutmazsa aşağıdaki yedeğe
   düşme mantığı devreye giriyor. */
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest'

export const SAGLAYICI_ADLARI: Record<Saglayici, string> = {
  claude: 'Claude',
  gemini: 'Gemini',
}

function anahtar(saglayici: Saglayici): string | undefined {
  const ham = saglayici === 'claude'
    ? process.env.ANTHROPIC_API_KEY
    : process.env.GEMINI_API_KEY
  return ham?.trim() || undefined
}

/** Anahtarı tanımlı olan sağlayıcılar — sıra önemli, ilki varsayılan. */
export function kullanilabilirSaglayicilar(): Saglayici[] {
  return (['claude', 'gemini'] as Saglayici[]).filter((s) => anahtar(s))
}

export function yzHazirMi(): boolean {
  return kullanilabilirSaglayicilar().length > 0
}

/* ═══════════════════════════════════════════════════════════ ortak hatalar */

/** Ağ katmanının fırlattıklarını Türkçeye çevirir. */
function agHatasi(e: unknown, ad: string): Error {
  if (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
    return new Error(`${ad} 2 dakikada cevap vermedi. Metni kısaltıp tekrar dene.`)
  }
  return new Error(`${ad} servisine ulaşılamadı. İnternet bağlantını kontrol et.`)
}

/**
 * HTTP durumlarını Türkçeye çevirir; ham İngilizce gövde kullanıcıya gitmesin.
 * İki sağlayıcının durum kodları büyük ölçüde örtüşüyor, ayrım gövdede.
 */
function apiHatasi(ad: string, durum: number, govde: string): Error {
  const g = govde.toLowerCase()
  if (durum === 401 || g.includes('api_key_invalid') || g.includes('api key not valid')) {
    return new Error(`${ad} anahtarı geçersiz. Değeri .env.local dosyasında kontrol et.`)
  }
  if (durum === 403) return new Error(`${ad} anahtarı bu isteğe yetkili değil.`)
  if (g.includes('credit') || g.includes('billing')) {
    return new Error(`${ad} hesabında kredi/fatura sorunu var.`)
  }
  if (durum === 429) return new Error(`${ad} istek sınırına takıldın. Birkaç dakika sonra tekrar dene.`)
  if (durum === 529 || durum === 503) return new Error(`${ad} servisi şu an yoğun. Birkaç dakika sonra tekrar dene.`)
  if (durum >= 500) return new Error(`${ad} servisinde geçici bir sorun var. Tekrar dene.`)
  if (durum === 404) return new Error(`${ad} modeli bulunamadı. Ortam değişkenindeki model adını kontrol et.`)
  return new Error(`${ad} isteği reddedildi (HTTP ${durum}).`)
}

/* ══════════════════════════════════════════════════════════════════ Claude */

async function claudeCagir(
  metin: string,
  bugun: string,
): Promise<{ ham: HamCikti; model: string; uyari?: string }> {
  const gizli = anahtar('claude')
  if (!gizli) throw new Error('ANTHROPIC_API_KEY tanımlı değil.')

  let yanit: Response
  try {
    yanit = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': gizli,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: AZAMI_JETON,
        system: sistemIstemi(bugun),
        tools: [{ name: ARAC_ADI, description: ARAC_ACIKLAMA, input_schema: SEMA }],
        tool_choice: { type: 'tool', name: ARAC_ADI },
        messages: [{ role: 'user', content: metin }],
      }),
      signal: AbortSignal.timeout(ZAMAN_ASIMI),
    })
  } catch (e) {
    throw agHatasi(e, 'Claude')
  }

  if (!yanit.ok) {
    throw apiHatasi('Claude', yanit.status, await yanit.text().catch(() => ''))
  }

  const govde = await yanit.json() as {
    content?: { type: string; name?: string; input?: unknown }[]
  }
  const arac = govde.content?.find((p) => p.type === 'tool_use' && p.name === ARAC_ADI)
  if (!arac || typeof arac.input !== 'object' || arac.input === null) {
    throw new Error('Claude beklenen biçimde cevap vermedi. Tekrar dene.')
  }
  return { ham: arac.input as HamCikti, model: CLAUDE_MODEL }
}

/* ══════════════════════════════════════════════════════════════════ Gemini */

/**
 * JSON Schema → Gemini `Schema` dönüşümü.
 *
 * Gemini'nin şeması OpenAPI alt kümesi ve iki farkı var: `type` BÜYÜK harf
 * bir enum ("STRING", "OBJECT"), ve tanımadığı anahtarları görünce isteği
 * tümden reddediyor. O yüzden şemayı olduğu gibi gönderemiyoruz; tek
 * kaynaktan (SEMA) üretip burada çeviriyoruz — iki ayrı şema tutmak ikisinin
 * ayrışması demekti.
 */
type SemaDugumu = {
  type?: string
  description?: string
  enum?: readonly string[]
  items?: SemaDugumu
  properties?: Record<string, SemaDugumu>
  required?: readonly string[]
}

function geminiSemasi(dugum: SemaDugumu): Record<string, unknown> {
  const cikti: Record<string, unknown> = {}
  if (dugum.type) cikti.type = dugum.type.toUpperCase()
  if (dugum.description) cikti.description = dugum.description
  if (dugum.enum) cikti.enum = [...dugum.enum]
  if (dugum.items) cikti.items = geminiSemasi(dugum.items)
  if (dugum.properties) {
    const ozellikler: Record<string, unknown> = {}
    for (const [ad, alt] of Object.entries(dugum.properties)) {
      ozellikler[ad] = geminiSemasi(alt)
    }
    cikti.properties = ozellikler
  }
  /* Boş `required` gönderilmiyor: Gemini bunu geçersiz sayabiliyor ve
     zaten "hiçbir alan zorunlu değil" demek istiyoruz. */
  if (dugum.required?.length) cikti.required = [...dugum.required]
  return cikti
}

/**
 * Anahtarın erişebildiği, `generateContent` destekleyen modeller.
 *
 * Yalnızca 404 sonrası teşhis için çağrılıyor. Kendisi de patlarsa boş dizi
 * dönüyor: teşhis çağrısının asıl hatayı gölgelemesi saçma olurdu.
 */
async function geminiModelleri(gizli: string): Promise<string[]> {
  try {
    const y = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': gizli },
      signal: AbortSignal.timeout(15_000),
    })
    if (!y.ok) return []
    const g = await y.json() as {
      models?: { name?: string; supportedGenerationMethods?: string[] }[]
    }
    return (g.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => (m.name ?? '').replace(/^models\//, ''))
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Listeden metin ayrıştırmaya uygun bir model seç.
 *
 * Eleme: görsel/gömme/gemma modelleri bu işi yapmıyor, `lite` sürümler
 * uzun şemayı doldurmakta zayıf. `-latest` takma adları tercih ediliyor —
 * bu sorunun kaynağı zaten adların emekli olması, takma ad onu bir daha
 * yaşatmıyor.
 *
 * NEDEN PRO DEĞİL FLASH ÖNCE: ilk sürüm pro'yu tercih ediyordu ve canlıda
 * "kredi/fatura sorunu" ile döndü — pro ücretli katman istiyor, ücretsiz
 * anahtara flash veriliyor. Bu iş (hazır bir şemayı sayfadan doldurmak)
 * flash için fazlasıyla kolay; pro'yu tercih etmek yedeği çalışmaz
 * kılıyordu. Asıl ayrıştırıcı zaten Claude, bu yedek yol.
 */
function geminiAdayi(modeller: string[]): string | null {
  const uygun = modeller.filter((m) =>
    m.startsWith('gemini-')
    && !m.includes('image') && !m.includes('embedding')
    && !m.includes('tts') && !m.includes('live') && !m.includes('lite'))

  const sirali = [
    (m: string) => m.includes('flash') && m.endsWith('-latest'),
    (m: string) => m.includes('flash'),
    (m: string) => m.includes('pro') && m.endsWith('-latest'),
    (m: string) => m.includes('pro'),
  ]
  for (const olcut of sirali) {
    const bulunan = uygun.find(olcut)
    if (bulunan) return bulunan
  }
  return uygun[0] ?? null
}

/** Tek bir Gemini isteği. Model adı dışarıdan geliyor ki yeniden denenebilsin. */
async function geminiIstek(
  gizli: string,
  model: string,
  metin: string,
  bugun: string,
): Promise<Response> {
  const adres = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  try {
    return await fetch(adres, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        /* Anahtar başlıkta, sorgu dizgesinde DEĞİL: URL'ler günlüklere,
           yönlendirmelere ve hata raporlarına düşüyor. */
        'x-goog-api-key': gizli,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sistemIstemi(bugun) }] },
        contents: [{ role: 'user', parts: [{ text: metin }] }],
        tools: [{
          function_declarations: [{
            name: ARAC_ADI,
            description: ARAC_ACIKLAMA,
            parameters: geminiSemasi(SEMA as SemaDugumu),
          }],
        }],
        tool_config: {
          function_calling_config: { mode: 'ANY', allowed_function_names: [ARAC_ADI] },
        },
        generationConfig: { maxOutputTokens: AZAMI_JETON, temperature: 0 },
      }),
      signal: AbortSignal.timeout(ZAMAN_ASIMI),
    })
  } catch (e) {
    throw agHatasi(e, 'Gemini')
  }
}

/** Başarılı bir yanıtın gövdesinden araç çağrısını çıkarır. */
async function geminiCikti(yanit: Response): Promise<HamCikti> {
  const govde = await yanit.json() as {
    candidates?: {
      content?: { parts?: { functionCall?: { name?: string; args?: unknown } }[] }
      finishReason?: string
    }[]
  }
  const aday = govde.candidates?.[0]
  const cagri = aday?.content?.parts
    ?.map((p) => p.functionCall)
    .find((f) => f?.name === ARAC_ADI)

  if (!cagri || typeof cagri.args !== 'object' || cagri.args === null) {
    /* Cevabın kesilmesi en olası sebep; kullanıcı ne yapacağını bilsin. */
    if (aday?.finishReason === 'MAX_TOKENS') {
      throw new Error('Gemini cevabı sığmadı. Metni kısaltıp tekrar dene.')
    }
    throw new Error('Gemini beklenen biçimde cevap vermedi. Tekrar dene.')
  }
  return cagri.args as HamCikti
}

/**
 * Gemini çağrısı — model adı tutmazsa kendi kendini onarıyor.
 *
 * NEDEN: canlı testte `gemini-2.5-pro` 404 döndü, ÜSTELİK model ListModels
 * çıktısında `generateContent` destekleyen bir ad olarak duruyordu. Yani
 * "listede var" bile güvenilir değil; Google adları emekliye ayırırken
 * listeyi hemen temizlemiyor. Model adı bu kodun en çabuk eskiyen parçası
 * ve her eskidiğinde uygulamanın kırılması kabul edilemezdi.
 *
 * Davranış: 404 gelirse listeden uygun bir ad seçip BİR kez daha deniyor ve
 * hangi modeli kullandığını kullanıcıya söylüyor (sessiz düşmek, hangi
 * modelin okuduğunu bilmemek demekti). Kalıcı çözüm yine GEMINI_MODEL
 * değişkeni; uyarı bunu hatırlatıyor.
 */
async function geminiCagir(
  metin: string,
  bugun: string,
): Promise<{ ham: HamCikti; model: string; uyari?: string }> {
  const gizli = anahtar('gemini')
  if (!gizli) throw new Error('GEMINI_API_KEY tanımlı değil.')

  const yanit = await geminiIstek(gizli, GEMINI_MODEL, metin, bugun)
  if (yanit.ok) return { ham: await geminiCikti(yanit), model: GEMINI_MODEL }

  if (yanit.status !== 404) {
    throw apiHatasi('Gemini', yanit.status, await yanit.text().catch(() => ''))
  }

  const modeller = await geminiModelleri(gizli)
  const yedek = geminiAdayi(modeller)
  if (!yedek || yedek === GEMINI_MODEL) {
    throw new Error(
      `Gemini modeli "${GEMINI_MODEL}" bulunamadı. `
      + (modeller.length
        ? `Anahtarının erişebildikleri: ${modeller.join(', ')}. `
          + 'Birini GEMINI_MODEL ortam değişkenine yaz.'
        : 'Model listesi de alınamadı; anahtarı ve GEMINI_MODEL değerini kontrol et.'),
    )
  }

  const ikinci = await geminiIstek(gizli, yedek, metin, bugun)
  if (!ikinci.ok) {
    /* Yedek de tutmadıysa HANGİ modelin denendiğini söylüyoruz; yoksa
       kullanıcı ayarladığı modelin hata verdiğini sanıyor. */
    const asil = apiHatasi('Gemini', ikinci.status, await ikinci.text().catch(() => ''))
    throw new Error(`${asil.message} (denenen model: ${yedek})`)
  }
  return {
    ham: await geminiCikti(ikinci),
    model: yedek,
    uyari: `Ayarlı model "${GEMINI_MODEL}" artık yok; metni "${yedek}" okudu. `
      + 'Kalıcı çözüm için GEMINI_MODEL ortam değişkenini güncelle.',
  }
}

/* ════════════════════════════════════════════════════════════════ dış kapı */

/**
 * `bugun` dışarıdan geliyor: test edilebilir olsun ve modelin çözdüğü
 * göreli tarihler ("başvurular ekimde açılıyor") uygulamanın bugünüyle aynı
 * günü kullansın.
 */
export async function yzIleAyristir(
  metin: string,
  bugun: string,
  istenen?: Saglayici,
): Promise<AyristirmaSonucu> {
  const acik = kullanilabilirSaglayicilar()
  if (acik.length === 0) {
    throw new Error('Ne ANTHROPIC_API_KEY ne GEMINI_API_KEY tanımlı. Metinden ekleme kapalı.')
  }
  /* İstenen sağlayıcının anahtarı yoksa sessizce diğerine düşmüyoruz —
     kullanıcı hangi modelin okuduğunu bilmeli. */
  if (istenen && !acik.includes(istenen)) {
    throw new Error(`${SAGLAYICI_ADLARI[istenen]} anahtarı tanımlı değil.`)
  }
  const saglayici = istenen ?? acik[0]

  const temiz = metin.trim()
  if (temiz.length < 40) {
    throw new Error('Metin çok kısa. Program sayfasının tamamını yapıştır.')
  }
  const kesildi = temiz.length > EN_UZUN_METIN
  const gonderilen = kesildi ? temiz.slice(0, EN_UZUN_METIN) : temiz

  /* İki sağlayıcı da `{ham, model, uyari?}` döndürüyor: hangi modelin
     okuduğu sonuç ekranında yazıyor ve Gemini yedeğe düştüyse uyarı
     kullanıcıya ulaşıyor. DİKKAT: burada `ham` yerine nesnenin kendisini
     `taslagaCevir`e vermek tip hatası VERMİYOR (ikisi de Record<string,
     unknown>'a uyuyor) ama sessizce boş taslak üretir — bir kez yaşandı. */
  const cagri = saglayici === 'claude'
    ? await claudeCagir(gonderilen, bugun)
    : await geminiCagir(gonderilen, bugun)

  const sonuc = taslagaCevir(cagri.ham, temiz, kesildi)
  return {
    ...sonuc,
    uyarilar: cagri.uyari ? [cagri.uyari, ...sonuc.uyarilar] : sonuc.uyarilar,
    saglayici,
    model: cagri.model,
  }
}
