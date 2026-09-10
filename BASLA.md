# Kurulum: adım adım

Toplam 10 dakika. Bilgisayarında **Node.js 20 veya üzeri** olması gerekiyor
(`node --version` ile bakabilirsin).

> Veritabanı **Neon** (serverless Postgres). Ücretsiz planı bu ölçek için
> fazlasıyla yeterli ve Vercel Storage üzerinden tek tıkla açılıyor.
> Sürücünün tip tuzakları `lib/veritabani.ts` başında yazılı; okumadan
> `setTypeParser` satırlarına dokunma.

---

## 1. Bağımlılıkları kur

Proje klasöründe:

```bash
npm install
```

---

## 2. Veritabanını aç (ücretsiz)

1. [vercel.com](https://vercel.com) → hesabını seç.
2. Üst menüde **Storage** → **Create Database** → **Neon** → **Free**.
3. Ad: `program-takip-db`. Bölge: **Frankfurt (eu-central-1)**: Türkiye'ye en
   yakını.
4. Oluşunca store sayfasında bağlantı dizgesi görünecek
   (`postgresql://…@…neon.tech/…`). Bir sonraki adımda lazım.

> Vercel Hobby hesabı Neon'un Free planına eşleniyor: 0,5 GB depolama,
> ayda 100 CU-saat. Bu uygulama birkaç yüz satır tutacak, sınırın yanından
> geçmiyor.

---

## 3. `.env.local` dosyasını doldur

Parola ve oturum anahtarı zaten üretilmiş durumda. Yenisini istersen:

```bash
npm run gizli
```

`.env.local` dosyası `package.json` ile aynı klasörde. Tek doldurman gereken
satır:

```
DATABASE_URL=postgresql://...@....neon.tech/neondb?sslmode=require
```

`APP_PAROLA`'yı istediğin gibi değiştirebilirsin; uygulamaya girerken bunu
yazacaksın. `OTURUM_GIZLI`'yi olduğu gibi bırak, oturum çerezini o imzalıyor.

> `.env.local` `.gitignore` içinde; asla depoya gitmez. `DATABASE_URL`
> `NEXT_PUBLIC_` öneki almaz; yalnızca sunucuda okunur, tarayıcıya gitmez.

---

## 4. Tabloları oluştur

```bash
npm run sema
```

Betik `veritabani/sema.sql` dosyasını uygular ve hangi tablonun kaç satır
içerdiğini yazar. Panele girip SQL kopyalaman gerekmiyor.

> Bu komutu tekrar çalıştırmak zararsız; her şey `if not exists` ile yazıldı.
> Şemaya sütun eklediğinde de bunu çalıştır.

---

## 5. Çalıştır

```bash
npm run dev
```

Tarayıcıda <http://localhost:3200> aç. Giriş ekranı gelmeli; `APP_PAROLA` ile
gir.

Eksik bir ortam değişkeni varsa uygulama çökmüyor, `/kurulum` ekranına gidiyor
ve hangisinin eksik olduğunu tablo hâlinde söylüyor. Bağlantının çalıştığını
görmek için **Ayarlar → Bağlantıyı sına**.

---

## 6. (İsteğe bağlı) Yapay zekâ ile ayrıştırma

Uygulama, yapıştırdığın program metnini kural tabanlı bir ayrıştırıcıyla forma
çeviriyor. Bu ücretsiz, internete çıkmıyor ve çoğu program sayfasında yeterli.

Karmaşık cümleleri daha iyi çözen ikinci bir yol istersen:

1. [console.anthropic.com](https://console.anthropic.com) → API Keys → yeni anahtar.
2. `.env.local` dosyasına ekle:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Sunucuyu yeniden başlat.

Artık **Ekle** sayfasında ikinci bir düğme çıkacak. Kullandığın her ayrıştırma
küçük bir ücret doğurur ve metin Anthropic'e gönderilir; kamuya açık program
sayfaları için sorun değil, kişisel belge yapıştıracaksan dikkat et.

---

## Sık karşılaşılanlar

**"Kurulum tamamlanmamış" ekranı geliyor**
`.env.local` dosyası yok, yanlış yerde ya da sunucu yeniden başlatılmamış.
Dosya `package.json` ile aynı klasörde olmalı. Değişiklikten sonra `npm run dev`
komutunu durdurup (Ctrl+C) yeniden başlat.

**"tablo bulunamadı (42P01)"**
4. adımı atlamışsın. `npm run sema` çalıştır.

**Parolayı unuttum**
`.env.local` dosyasındaki `APP_PAROLA` satırına bak. Değiştirirsen tüm açık
oturumlar geçerliliğini korur; oturumları da kapatmak istersen `OTURUM_GIZLI`
değerini değiştir.

**İlk sorgu yavaş geldi**
Neon boşta kalınca hesaplamayı sıfıra indiriyor; ilk istek onu uyandırıyor
(yarım saniye kadar). Sonrakiler hızlı.

**Word dosyam okunmuyor**
`.docx` destekleniyor, eski `.doc` desteklenmiyor. PDF de doğrudan
okunmuyor; PDF'i aç, Ctrl+A / Ctrl+C ile metni kopyala, yapıştırma kutusuna
yapıştır.

---

## Nerede ne var

| Ne | Nerede |
|---|---|
| Projenin tam şartnamesi | `PROJE.md` |
| Veritabanı şeması | `veritabani/sema.sql` |
| Bağlantı ve tip ayrıştırıcıları | `lib/veritabani.ts` |
| SQL'e giden tek yol | `lib/sorgular.ts` |
| Tasarım sistemi (renk, boşluk, bileşen) | `app/globals.css` |
| Sabit kod listeleri (belge, ön koşul, durum) | `lib/sabitler.ts` |
| Ülke kataloğu | `lib/ulkeler.ts` |
