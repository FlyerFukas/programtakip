import { NextResponse } from 'next/server'
import { oturumVar } from '@/lib/auth'
import { yedekAl } from '@/lib/sorgular'
import { bugun } from '@/lib/tarih'

export const dynamic = 'force-dynamic'

/**
 * Yedek indirme (PROJE.md Aşama 14).
 *
 * Neden sayfa değil de uç nokta: tarayıcı dosyayı indirsin istiyoruz ve
 * `Content-Disposition: attachment` ancak burada verilebiliyor.
 *
 * OTURUM ZORUNLU. Buradan bütün veritabanı tek dosyada çıkıyor; korumasız
 * bırakılsaydı uygulamanın parola kapısı anlamsız olurdu — adresi bilen
 * herkes her şeyi indirebilirdi.
 *
 * Yanıt tarayıcıda AÇILMASIN diye `no-store`: yedek eskiyince kullanıcı
 * eski dosyayı yeni sanır.
 */
export async function GET() {
  if (!(await oturumVar())) {
    return NextResponse.json(
      { hata: 'Oturum yok. Önce giriş yap.' },
      { status: 401 },
    )
  }

  try {
    const yedek = await yedekAl()
    const dosyaAdi = `program-takip-yedek-${bugun()}.json`

    return new NextResponse(JSON.stringify(yedek, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="${dosyaAdi}"`,
        'cache-control': 'no-store',
      },
    })
  } catch (e) {
    const mesaj = e instanceof Error ? e.message : 'Yedek alınamadı.'
    return NextResponse.json({ hata: mesaj }, { status: 500 })
  }
}
