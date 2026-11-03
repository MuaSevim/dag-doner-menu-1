import { enrichProducts } from './menu-model.js';
import { firebaseConfig, cloudName } from './firebase-config.js';
import { applyIndoorCatalog, priceRevision, menuDescription, revisedMenuIds } from './indoor-catalog.js';

// Stored paths stay unchanged; a versioned display URL bypasses old image caches.
export function displayImageUrl(value) {
  return typeof value === 'string' && value.startsWith('assets/images/')
    ? `${value}?v=indoor-photos-20261103-3` : value;
}

export function validImage(value) {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  if (/^assets\/images\/product-(\d+|x|z)\.webp$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && url.pathname.startsWith(`/${cloudName}/image/upload/`);
  } catch { return false; }
}

export function applyOverrides(products, overrides) {
  return products.map(product => {
    const value = overrides[product.id];
    if (!value) return product;
    // Legacy online records must not restore old prices or stale product content.
    const current = [priceRevision, 'indoor-v1', 'indoor-v2', 'indoor-v3'].includes(value.priceRevision);
    // Preserve other indoor edits, but not prices superseded by explicit revisions.
    const currentPrice = current && (value.priceRevision === priceRevision
      || (value.priceRevision === 'indoor-v3' && product.id !== 13)
      || (!revisedMenuIds.has(product.id) && (!product.isDrink || value.priceRevision === 'indoor-v2')));
    return {
      ...product,
      ...(current && typeof value.name === 'string' && value.name.trim() ? { name: value.name, urun_adi: value.name } : {}),
      ...(current && typeof value.description === 'string' ? { aciklama: menuDescription(product, value.description) } : {}),
      ...(currentPrice && Number.isFinite(value.price) && value.price >= 0 ? { fiyat_tl: value.price } : {}),
      ...(validImage(value.image) ? { image: value.image } : {}),
    };
  });
}

export async function loadBaseProducts() {
  const [response, indoor] = await Promise.all([fetch('references/DAG_DONER_TAM_MENU.json'), fetch('references/indoor-menu.json')]);
  if (!response.ok || !indoor.ok) throw new Error('Mekân içi menü yüklenemedi.');
  return applyIndoorCatalog(enrichProducts(await response.json()), await indoor.json());
}

export async function loadOverrides() {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/products?pageSize=100&key=${firebaseConfig.apiKey}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Güncel ürün bilgileri alınamadı. Firestore kurallarını ve bağlantınızı kontrol edin.');
  const result = await response.json();
  const overrides = {};
  for (const document of result.documents || []) {
    const fields = document.fields || {};
    overrides[document.name.split('/').pop()] = {
      name: fields.name?.stringValue,
      priceRevision: fields.priceRevision?.stringValue,
      description: fields.description?.stringValue,
      price: Number(fields.price?.doubleValue ?? fields.price?.integerValue ?? NaN),
      image: fields.image?.nullValue === null ? null : fields.image?.stringValue,
    };
  }
  return overrides;
}
