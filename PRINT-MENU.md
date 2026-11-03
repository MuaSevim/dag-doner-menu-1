# Masa menüsü — 5 sayfalı A4 baskı

`/print-menu.html` dijital menüyle aynı mekân içi fiyatları kullanır. `dag-doner-baski-menu.pdf` üretim anındaki verilerin sabit PDF kopyasıdır; dashboard değişikliği sonrası yeniden PDF alınmalıdır.

1. Kapak: krem (#faf8f0) zeminde ortalanmış logo ve altında MENÜ.
2. Solda 6 klasik döner, karşılarında sağda aynı ürünlerin menüleri.
3. Solda Hatay ve burritolar; sağda ayran/patatesli menüleri.
4. Solda çıtırlar ve yan ürünler; sağda fotoğrafsız soslar ve ilaveler.
5. Fotoğrafsız içecek listesi.

Favoriler, öğrenci menüleri, aile menüleri ve ayrı Coca-Cola fırsat listesi bu baskı seçkisinde yoktur; dijital menüde korunur. Çıtır tavuk menü baskının 4. sayfasındadır. Küçük ayran ve 1,5 L su her iki menüden kaldırılmıştır.

## Fiyat kaynağı

`references/indoor-menu.json` güncel başlangıç fiyatlarını, ürün değişikliklerini, kaldırılan ID’leri ve yeni ürünleri içerir. Eski `DAG_DONER_TAM_MENU.json` kimlik/görsel eşleştirmesi için kaynak arşividir; fiyatları doğrudan kullanılmaz. Kimlikleri yeniden numaralandırmayın.

Aktarım dosyası standart JSON olarak ayrıştırılabilir değildir (kaçışsız Windows yolları, `300tl` gibi sayılar içerir); değiştirilmedi. Fiyatlar incelenerek aktarılmıştır. Kullanıcının açık mesajındaki fiyatlar dosyadaki çelişkilerin önüne geçer: örneğin porsiyon 300 TL, tam ekmek menü 250 TL. Mesajda tek tek verilmeyen öğrenci/aile/fırsat fiyatları aktarım dosyasından korunmuştur.

İçecek fiyatları son talimatla sabitlenmiştir: büyük ayran 30, şalgam/limonata 35, 500 ml su 15, kutu kola/Fanta/Sarıyer ve Fuse Tea 70 TL; Coca-Cola/Fanta 1 L 80, 1,5 L 100, 2,5 L 120 TL. Soda fiyatları önceki haliyle korunur. Yüzde indirimi artık uygulanmaz. Menü açıklamalarında büyük ayran kullanılır.

## Dashboard geçişi — önemli

**Yeni `firestore.rules` içeriğini Firebase Console’da yeniden Publish edin.** Yeni ürünler ID 72–79 kullanır. Yeni kayıtlar `priceRevision: indoor-v4` içerir. Eski Firestore kayıtları silinmez; online fiyat/isim/açıklamalar yok sayılır, görsel güncellemeleri korunur. Önceki indoor düzenlemeleri korunur, ancak indirim yapılan menülerin v1/v2 fiyatları, eski içecek fiyatları ve Çıtır Tavuk Menü’nün v1/v2/v3 fiyatları yeni başlangıç fiyatlarını geçersiz kılamaz. Dashboard’dan v4 olarak tekrar kaydedilen fiyatlar iki menüye de yansır. Otomatik bulut yazımı veya deploy yapılmaz.

Dağ Döner Menü `product-72.webp` görselini kullanır. Üç Burrito Menü aynı `product-74.webp` fotoğrafını kullanır. Porsiyon Menü `product-73.webp`, Turşu Tabağı `product-40.webp` görsellerini kullanır. Klasik/Hatay menülerinin fotoğrafları da kullanıcının son sağladığı dosyalardan yenilenmiştir. Porsiyon Menü içeriği porsiyon döner + büyük ayrandır; gerektiğinde panelden değiştirin. Sos ve ilaveler baskıda fotoğrafsızdır.

Son menü indirimi bir kez uygulanmıştır: yarım ekmek/lavaş menü 170 TL, tam ekmek/lavaş menü 240 TL, Dağ Döner Menü 300 TL; Hatay S/M/L/XL menüler 210/240/270/300 TL; Burrito 120/140/160 g menüler 300/330/360 TL. Çıtır Tavuk Menü son talimatla 200 TL’dir ve `citir-tavuk-menu.png` kaynaklı fotoğrafı kullanır. Porsiyon Menü 330 TL olarak korunur. Dijital menü aynı fiyatları kullanır. Baskı logoları şeffaf `logos/print-logo.png` dosyasından gelir.

Satırlar sütundaki ürün sayısına göre kullanılabilir yüksekliği eşit paylaşır; klasik/menü ve Hatay/burrito eşleşmeleri karşılıklı hizalanır. Kategori başlığının altında 1 px çizgi bulunur. Sayfa sonunda yalnızca sağ altta küçük sayfa numarası vardır; footer metni ve site adresi yoktur.

## Baskı

`npm start` → `http://localhost:3000/print-menu.html` (PORT farklıysa adresi değiştirin). Yayında: `https://dagdoner.netlify.app/print-menu.html`.

Yazdır / PDF kaydet: **A4, dikey, %100 ölçek, kenar boşluğu yok, tarayıcı üst/alt bilgileri kapalı, arka plan grafikleri açık**. Yan yana sayfalar normal A4 sırasındadır; matbaa kitapçık/broşür katlama montajını ayrıca yapmalıdır. Beş sayfa kitapçık katlaması için dördün katı değildir; bu dosya otomatik imposition yapmaz.

Firestore doğrulanamazsa baskı engellenir. Sabit sayfalarda çok uzun açıklamalar taşarsa PDF yerine uyarı gösterilir; açıklamayı kısaltın. Güncel fiyatları baskı öncesi kontrol edin. RGB A4 tasarımdır; CMYK, bleed ve kesim işaretleri matbaanın şartlarına göre ayrıca hazırlanmalıdır.
