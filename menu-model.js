export const categories = [
  { id: 'popular', label: 'Favoriler', icon: '✳', kicker: 'MENÜNÜN YILDIZLARI', title: 'İlk ısırıkta favorin.' },
  { id: 'classic', label: 'Klasikler', icon: '🥙', source: 'Klasik Dönerlerimiz', title: 'Klasiklerin yeri ayrı.' },
  { id: 'hatay', label: 'Hatay Usulü', icon: '🌯', source: 'Hatay Usulü Tavuk Dönerler', title: 'Sosu bol. Keyfi bambaşka.' },
  { id: 'burrito', label: 'Dağ Burritolar', icon: '🌮', source: 'Dağ Burritoları', title: 'Bir dürümden çok daha fazlası.' },
  { id: 'student', label: 'Öğrenci Menüleri', icon: '🎒', source: 'Öğrenci Menüleri', title: 'Ders arası, lezzet molası.' },
  { id: 'menus', label: 'Menüler', icon: '🍟', source: 'Avantajlı Menüler (Tek Kişilik)', title: 'Yanına mutluluk da ekledik.' },
  { id: 'family', label: 'Paylaşmalık', icon: '♡', source: "2'li & Aile Menüler", title: 'Kalabalık sofraların favorisi.' },
  { id: 'offers', label: 'Fırsatlar', icon: '🥤', source: 'Coca-Cola Fırsat Menüleri', title: 'Bir arada, tam kıvamında.' },
  { id: 'sides', label: 'Atıştırmalıklar', icon: '🍟', sources: ['Yan Ürünler ve Ekstralar', 'Çıtır Burgerler', 'Soslar'], title: 'Yanına çok yakışır.' },
  { id: 'drinks', label: 'İçecekler', icon: '🥤', source: 'İçecekler', title: 'Buz gibi bir eşlikçi.' },
];

export const popularIds = [7, 10, 4, 33, 1, 26, 30, 34];
const shortNames = {
  0: 'Yarım Ekmek Döner', 1: 'Tam Ekmek Döner', 2: 'Yarım Lavaş Döner', 3: 'Tam Lavaş Döner', 5: 'Porsiyon Tavuk Döner',
  6: 'Hatay Usulü Dürüm · S', 7: 'Hatay Usulü Dürüm · M', 8: 'Hatay Usulü Dürüm · L', 9: 'Hatay Usulü Dürüm · XL',
  10: 'Dağ Burrito', 11: 'Dağ Burrito · 140 g', 12: 'Dağ Burrito · 160 g',
  13: 'Çıtır Burger Fırsat Menü', 14: 'Hatay Fırsat Menü · M', 15: 'Hatay Fırsat Menü · L', 16: 'İkili Hatay Fırsat Menü',
  17: 'Öğrenci Hatay Menü', 18: 'Öğrenci Çıtır Burger Menü', 19: 'Öğrenci Lavaş Döner Menü', 20: 'Öğrenci Ekmek Döner Menü',
  21: 'Yarım Ekmek Döner Menü', 22: 'Tam Ekmek Döner Menü', 23: 'Yarım Lavaş Döner Menü', 24: 'Tam Lavaş Döner Menü',
  25: 'Hatay Menü · S', 26: 'Hatay Menü · M', 27: 'Hatay Menü · L', 28: 'Hatay Menü · XL',
  34: 'Çıtır Patates · Orta', 35: 'Çıtır Patates · Büyük', 36: 'Soğan Halkası · 6 Adet', 37: 'Soğan Halkası · 12 Adet',
  38: 'Tavuk Nugget · 4 Adet', 39: 'Tavuk Nugget · 8 Adet',
};

export function enrichProducts(data) {
  return data.map((item, id) => {
    const category = categories.find(c => c.source === item.kategori || c.sources?.includes(item.kategori));
    const isDrink = item.kategori === 'İçecekler';
    const image = item.kategori === 'Soslar' ? null : `assets/images/product-${id}.webp`;
    return { ...item, id, name: shortNames[id] || item.urun_adi, categoryId: category?.id, categoryLabel: category?.label || item.kategori, image, isDrink: isDrink || id === 41 };
  });
}

export function normalize(value) {
  return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}

export function filterProducts(products, categoryId, query = '', sort = 'default') {
  const category = categories.find(c => c.id === categoryId) || categories[0];
  let result = categoryId === 'all' ? [...products] : category.id === 'popular' ? popularIds.map(id => products.find(p => p.id === id)).filter(Boolean) : products.filter(p => p.categoryId === category.id);
  const term = normalize(query.trim());
  if (term) result = result.filter(p => normalize(`${p.urun_adi} ${p.name} ${p.aciklama} ${p.kategori}`).includes(term));
  if (sort === 'price-asc') result.sort((a, b) => a.fiyat_tl - b.fiyat_tl);
  if (sort === 'price-desc') result.sort((a, b) => b.fiyat_tl - a.fiyat_tl);
  return result;
}

export function formatPrice(price) { return new Intl.NumberFormat('tr-TR').format(price); }
