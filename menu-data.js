import { enrichProducts } from './menu-model.js';
import { firebaseConfig, cloudName } from './firebase-config.js';

export function validImage(value) {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  if (/^assets\/images\/product-\d+\.webp$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && url.pathname.startsWith(`/${cloudName}/image/upload/`);
  } catch { return false; }
}

export function applyOverrides(products, overrides) {
  return products.map(product => {
    const value = overrides[product.id];
    if (!value) return product;
    return {
      ...product,
      ...(typeof value.name === 'string' && value.name.trim() ? { name: value.name, urun_adi: value.name } : {}),
      ...(typeof value.description === 'string' ? { aciklama: value.description } : {}),
      ...(Number.isFinite(value.price) && value.price >= 0 ? { fiyat_tl: value.price } : {}),
      ...(validImage(value.image) ? { image: value.image } : {}),
    };
  });
}

export async function loadBaseProducts() {
  const response = await fetch('references/DAG_DONER_TAM_MENU.json');
  if (!response.ok) throw new Error('Menü yüklenemedi.');
  return enrichProducts(await response.json());
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
      description: fields.description?.stringValue,
      price: Number(fields.price?.doubleValue ?? fields.price?.integerValue ?? NaN),
      image: fields.image?.nullValue === null ? null : fields.image?.stringValue,
    };
  }
  return overrides;
}
