# Dağ Döner — Dijital Menü

## Yönetim paneli

`/admin.html`: e-posta/şifre ile ürün adı, fiyatı, açıklaması ve görseli düzenleme. Firebase/Cloudinary/Netlify kurulumu için **[DASHBOARD-SETUP.md](DASHBOARD-SETUP.md)** dosyasını izleyin. Güvenlik kuralları ve Netlify ortam değişkenleri yayınlanmadan panel tam çalışmaz.

Krem, koyu yeşil ve turuncu renklerle hazırlanmış; mobil uyumlu, Türkçe dijital restoran menüsü. Klasördeki gerçek ürün ve içecek fotoğraflarını, logoyu ve `references/DAG_DONER_TAM_MENU.json` içindeki 72 ürünü kullanır.

## Çalıştırma

Node.js 20 veya üzeri ile:

```sh
cd dag-doner-menu
npm start
```

Tarayıcı: **http://localhost:3000**. Çalıştırmak için paket kurulumu gerekmez. Başka port için `PORT` ortam değişkenini kullanabilirsiniz. Dosyayı doğrudan çift tıklamak yerine sunucu üzerinden açın; menü verileri JSON dosyasından yüklenir.

## Özellikler

- Alt alta kategori bölümleri; kaydırmayla güncellenen, sabit kategori sekmeleri
- Türkçe/aksansız arama ve her kategori içinde fiyat sıralama
- Modal açmayan ürün kartları; açıklamalar ve fiyatlar doğrudan kartta
- Kategori bağlantıları (`?category=family` gibi) ilgili bölüme kaydırır
- Alt bilgide gerçek Dağ Döner Yemeksepeti sayfasına sipariş bağlantısı
- Düşük hareket tercihi, erişilebilir odaklar ve mobil tasarım

Bu site sipariş/ödeme almaz; siparişler Yemeksepeti’nde tamamlanır. Fiyatlar sağlanan JSON kaynağından gelir; platform fiyatları farklı olabilir. Yayına almadan önce fiyatları ve ürün içeriklerini işletmeyle doğrulayın.

## İçerik düzenleme

Fiyat ve açıklamalar: `references/DAG_DONER_TAM_MENU.json`.

Kategori başlıkları ve kısa ürün adları: `menu-model.js`. Ürün görselleri `assets/images/product-ID.webp` yolundan yüklenir; ID, mevcut JSON sırasındaki sıfırdan başlayan ürün numarasıdır. Ürün eklerken veya sıralamayı değiştirirken görselleri de güncelleyin. Yarım lavaş için ayrı görsel bulunmadığından tam lavaş fotoğrafı temsilî olarak kullanılır. Soslar için fotoğraf yerine illüstrasyon bulunur.

Kategori sırası: Favoriler, Klasikler, Hatay Usulü, Dağ Burritolar, Öğrenci Menüleri, Menüler, Paylaşmalık, Fırsatlar, Atıştırmalıklar, İçecekler. Çıtır burger ve soslar Atıştırmalıklar bölümündedir. Favori ürünler kendi kategorilerinde de gösterilir.

Görünüm: `styles.css`. Sayfa içeriği: `index.html`. Etkileşimler: `app.js`.

## Yayınlama

Statik hosting üzerinde `index.html`, `styles.css`, `app.js`, `menu-model.js`, `assets`, `logos` ve `references` klasörünü birlikte yayınlayın. Orijinal fotoğraf klasörleri, görsel üretim betiği, testler ve geliştirme bağımlılıkları kaldırılmıştır; uygulama hazır WebP görsellerini doğrudan kullanır.

## Git deposu

Bu `dag-doner-menu` klasörü bağımsız proje köküdür; Git deposunu burada başlatabilirsiniz. Uygulama, menü verileri, görseller ve referanslar bu klasörde bulunur. Uygulamayı başlatmak için yalnızca Node.js yeterlidir; paket kurulumu gerekmez.
