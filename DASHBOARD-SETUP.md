# Yönetim paneli kurulumu

Adres: https://remarkable-caramel-c9d03b.netlify.app/admin.html

## 1. Firestore kuralları

Firebase Console → Firestore Database → Rules bölümüne `firestore.rules` dosyasının **tam içeriğini** yapıştırıp Publish seçin. Mevcut tüm erişimleri engelleyen kuralların yerine geçmelidir. Ürün verileri herkese açık okunur; yalnızca `firebase-config.js` içindeki UID düzenleyebilir. Diğer koleksiyonlar kapalı kalır.

İlk çalışmada koleksiyon oluşturmanız gerekmez. JSON’daki 72 ürün başlangıç verisidir; ilk kayıtta `products/{id}` belgesi oluşur. JSON sırasını değiştirmeyin: ürün kimlikleri bu sıraya bağlıdır. Firestore kurallarını yayınlamadan panel güncellemeleri çalışmaz.

## 2. Yönetici girişi

Firebase Authentication → Sign-in method → Email/Password açık olmalı. Users bölümündeki kullanıcı UID’si `OD1pdLs23JRTvS88ya5X5FwgUCG2` olmalı. Şifre kodda saklanmaz. Panelde kayıt olma yoktur; başka bir kullanıcı giriş yapsa bile düzenleyemez.

Authentication → Settings → Authorized domains listesine `remarkable-caramel-c9d03b.netlify.app` ve yerel test için `localhost` ekleyin. İleride özel alan adı kullanırsanız onu da ekleyin.

## 3. Cloudinary ve Netlify

Sohbette paylaşılan eski Cloudinary anahtarını iptal edin. Yeni API key/secret oluşturun. Netlify → Project configuration → Environment variables bölümüne, Functions kapsamında:

- `CLOUDINARY_API_KEY`: yeni anahtarın API key değeri
- `CLOUDINARY_API_SECRET`: yeni anahtarın gizli API secret değeri

Cloud name `xsnngbvg`, kodda herkese açık yapılandırmadır. Secret’ı dosyalara, GitHub’a veya sohbete koymayın. Unsigned upload preset gerekli değildir. Yüklemeler Firebase oturumu doğrulandıktan sonra Netlify Function tarafından imzalanır.

Değişkenleri ekledikten sonra yeniden deploy edin. `netlify.toml` yayın klasörünü ve fonksiyonları ayarlar; build komutu gerekmez. Yeni görseller JPG/PNG/WebP/AVIF, en fazla 5 MB olabilir; Cloudinary üzerinde en fazla 1600 px WebP olarak saklanır. Eski görseller otomatik silinmez; kullanılmayanları Cloudinary panelinden temizleyebilirsiniz. Görsel yüklenip Firestore kaydı başarısız olursa yüklenen dosya kullanılmadan kalabilir.

## Kullanım ve yerel test

`npm start` ile `/admin.html` açılır. İnternet ve yayınlanmış Firestore kuralları varsa giriş ve metin/fiyat kaydı yerelde de çalışır; **canlı veriyi değiştirir**. Görsel yükleme Netlify Functions gerektirir; normal Node sunucusunda çalışmaz. Yerelde tüm akış için Netlify CLI `netlify dev` kullanılabilir.

Menü her açılışta güncellemeleri okur. Açık ziyaretçi sayfasının yenilenmesi gerekir. Firestore erişilemezse başlangıç JSON’u ve eski fiyat olabileceğini belirten uyarı gösterilir. Favoriler ve ana kategoriler aynı ürün güncellemesini kullanır. Hero fiyatı da güncellenir; poster görselleri ayrı tasarım dosyalarıdır, ürün görseli düzenlemek posteri değiştirmez.

Firebase SDK yalnızca yönetim panelinde CDN’den yüklenir; menü Firestore REST okuması yapar. Ücretsiz Firestore okuma kotası trafikle tüketilir (sayfa açılışı başına kayıtlı ürün başına okuma). Cloudinary ve Netlify kotalarını da takip edin.
