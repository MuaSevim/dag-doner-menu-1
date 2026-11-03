import { categories } from './menu-model.js';

export const priceRevision = 'indoor-v4';
export const revisedMenuIds = new Set([13, 21, 22, 23, 24, 25, 26, 27, 28, 72, 74, 75, 76]);

export function menuDescription(product, description) {
  if (product.kategori === 'İçecekler') return description;
  return description.replace(/\b(?:büyük\s+)?ayran(?:\s*\((?:20|30|27[,.]5)\s*cl\))?/giu, 'büyük ayran');
}

export function applyIndoorCatalog(base, catalog) {
  if (catalog.revision !== priceRevision) throw new Error('Mekân içi menü sürümü uyuşmuyor.');
  return [...base, ...catalog.additions].filter(p => !catalog.removedIds.includes(p.id)).map(original => {
    const p = { ...original, ...catalog.changes[original.id] };
    const category = categories.find(c => c.source === p.kategori || c.sources?.includes(p.kategori));
    const price = catalog.prices[p.id];
    if (!Number.isFinite(price) || !category) throw new Error(`Ürün ${p.id} için mekân içi fiyat/kategori eksik.`);
    return { ...p, name: p.name || p.urun_adi, urun_adi: p.name || p.urun_adi, fiyat_tl: price, priceRevision,
      categoryId: category.id, categoryLabel: category.label,
      aciklama: menuDescription(p, p.aciklama || ''),
      isDrink: p.kategori === 'İçecekler', image: p.image ?? null };
  });
}
