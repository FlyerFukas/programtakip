import 'server-only'
import { DESTEKLENEN_UZANTILAR, EN_BUYUK_DOSYA } from './dosya-sabitleri'

/**
 * Yüklenen dosyadan düz metin çıkarma.
 *
 * Sunucu tarafında çalışıyor, çünkü docx okuyan `mammoth` kütüphanesinin
 * tarayıcı sürümünü paketlemek uygulamayı yüzlerce KB büyütürdü — dosya
 * yükleme her gün yapılan bir iş değil, sunucuya bir tur atması sorun değil.
 */

export type CikarmaSonucu =
  | { tamam: true; metin: string; uyari?: string }
  | { tamam: false; hata: string }

function uzanti(ad: string): string {
  const nokta = ad.lastIndexOf('.')
  return nokta === -1 ? '' : ad.slice(nokta).toLowerCase()
}

export async function dosyadanMetin(dosya: File): Promise<CikarmaSonucu> {
  if (dosya.size === 0) return { tamam: false, hata: 'Dosya boş.' }
  if (dosya.size > EN_BUYUK_DOSYA) {
    return { tamam: false, hata: `Dosya çok büyük (${Math.round(dosya.size / 1024 / 1024)} MB). Sınır 10 MB.` }
  }

  const uz = uzanti(dosya.name)

  /* ── düz metin biçimleri ── */
  if (['.txt', '.md', '.csv', '.json'].includes(uz)) {
    const metin = await dosya.text()
    if (!metin.trim()) return { tamam: false, hata: 'Dosyada okunabilir metin yok.' }
    return { tamam: true, metin }
  }

  /* ── docx ── */
  if (uz === '.docx') {
    try {
      // Dinamik import: mammoth yalnızca gerçekten docx yüklenince belleğe gelsin.
      const mammoth = await import('mammoth')
      const tampon = Buffer.from(await dosya.arrayBuffer())
      const sonuc = await mammoth.extractRawText({ buffer: tampon })

      if (!sonuc.value.trim()) {
        return { tamam: false, hata: 'Word dosyasında metin bulunamadı. Metin kutuları ve görseller okunamaz.' }
      }

      // mammoth uyarıları çoğunlukla önemsiz (stil eşlenemedi vb.) ama
      // "bu kısmı atladım" diyorsa kullanıcı bilmeli.
      const atlanan = sonuc.messages.filter((m) => m.type === 'warning').length
      return {
        tamam: true,
        metin: sonuc.value,
        uyari: atlanan > 0
          ? `Word dosyasındaki ${atlanan} öğe düz metne çevrilemedi (tablo, kutu ya da görsel olabilir). Eksik varsa metni elle tamamla.`
          : undefined,
      }
    } catch (e) {
      return {
        tamam: false,
        hata: `Word dosyası okunamadı: ${e instanceof Error ? e.message : 'bilinmeyen hata'}. Dosyayı açıp metni kopyalayıp yapıştırmayı dene.`,
      }
    }
  }

  /* ── .doc (eski biçim) ── */
  if (uz === '.doc') {
    return {
      tamam: false,
      hata: 'Eski .doc biçimi okunamıyor. Word\'de açıp "Farklı kaydet → .docx" yap ya da metni kopyalayıp yapıştır.',
    }
  }

  if (uz === '.pdf') {
    return {
      tamam: false,
      hata: 'PDF doğrudan okunamıyor. PDF\'i aç, metni seç (Ctrl+A), kopyala ve yapıştırma kutusuna yapıştır.',
    }
  }

  return {
    tamam: false,
    hata: `"${uz || 'uzantısız'}" dosya türü desteklenmiyor. Desteklenenler: ${DESTEKLENEN_UZANTILAR.join(', ')}.`,
  }
}
