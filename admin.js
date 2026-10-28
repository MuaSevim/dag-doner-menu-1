import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import { firebaseConfig, adminUid, cloudName } from './firebase-config.js';
import { categories, normalize, formatPrice } from './menu-model.js';
import { loadBaseProducts, loadOverrides, applyOverrides, validImage } from './menu-data.js';

const $ = selector => document.querySelector(selector);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let products = [];
let selectedId = null;
let dirty = false;
let busy = false;
let previewUrl;
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function status(message, error = false) { $('#status').textContent = message; $('#status').classList.toggle('error', error); }
function confirmDiscard() { return !dirty || confirm('Kaydedilmemiş değişiklikler silinsin mi?'); }
function renderList() {
  const term = normalize($('#filter').value);
  const category = $('#category').value;
  const visible = products.filter(p => (category === 'all' || p.categoryId === category) && normalize(`${p.name} ${p.aciklama}`).includes(term));
  $('#product-list').innerHTML = visible.map(p => `<button type="button" class="product-row" data-id="${p.id}" aria-pressed="${p.id === selectedId}"${busy ? ' disabled' : ''}>${p.image ? `<img src="${escape(p.image)}" alt="" loading="lazy">` : ''}<span>${escape(p.name)}<small>${escape(p.categoryLabel)}</small></span><b>${formatPrice(p.fiyat_tl)} ₺</b></button>`).join('') || '<p>Ürün bulunamadı.</p>';
}
function preview(image) {
  $('#preview').hidden = !image;
  $('#no-image').hidden = Boolean(image);
  if (image) $('#preview').src = image; else $('#preview').removeAttribute('src');
}
function selectProduct(id) {
  if (busy || !confirmDiscard()) return;
  const p = products.find(item => item.id === id);
  if (!p) return;
  selectedId = id;
  dirty = false;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  $('#editor').hidden = false;
  $('#editor-title').textContent = p.name;
  $('#editor-category').textContent = p.categoryLabel;
  $('#name').value = p.name;
  $('#price').value = p.fiyat_tl;
  $('#description').value = p.aciklama;
  $('#image-file').value = '';
  $('#save-status').textContent = '';
  preview(p.image);
  renderList();
}
async function reload() {
  products = applyOverrides(await loadBaseProducts(), await loadOverrides());
  selectedId = null;
  dirty = false;
  $('#editor').hidden = true;
  renderList();
  status(`${products.length} ürün hazır. Düzenlemek için bir ürün seç.`);
}
$('#category').insertAdjacentHTML('beforeend', categories.filter(c => c.id !== 'popular').map(c => `<option value="${c.id}">${escape(c.label)}</option>`).join(''));
$('#filter').addEventListener('input', renderList);
$('#category').addEventListener('change', renderList);
$('#product-list').addEventListener('click', e => { const row = e.target.closest('[data-id]'); if (row) selectProduct(Number(row.dataset.id)); });
$('#editor').addEventListener('input', () => { dirty = true; });
$('#image-file').addEventListener('change', () => {
  const file = $('#image-file').files[0];
  if (!file) { preview(products.find(p => p.id === selectedId)?.image); return; }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    $('#image-file').value = '';
    $('#save-status').textContent = 'Desteklenen bir görsel seçin (en fazla 5 MB).';
    preview(products.find(p => p.id === selectedId)?.image);
    return;
  }
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview(previewUrl);
});
$('#login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const button = e.target.querySelector('button');
  button.disabled = true;
  try {
    await setPersistence(auth, browserSessionPersistence);
    await signInWithEmailAndPassword(auth, e.target.elements.email.value.trim(), e.target.elements.password.value);
    e.target.reset();
  } catch { status('Giriş yapılamadı. E-posta, şifre ve bağlantınızı kontrol edin.', true); }
  finally { button.disabled = false; }
});
$('#logout').addEventListener('click', async () => {
  if (busy || !confirmDiscard()) return;
  try { await signOut(auth); } catch { status('Çıkış yapılamadı. Tekrar deneyin.', true); }
});
$('#reload').addEventListener('click', async () => {
  if (busy || !confirmDiscard()) return;
  try { await reload(); } catch (error) { status(error.message, true); }
});
onAuthStateChanged(auth, async user => {
  $('#dashboard').hidden = true;
  $('#editor').hidden = true;
  $('#logout').hidden = !user;
  $('#login-panel').hidden = Boolean(user);
  if (!user) { products = []; selectedId = null; dirty = false; status('Yönetici girişi gerekli.'); return; }
  if (user.uid !== adminUid) { status('Bu hesabın menüyü düzenleme yetkisi yok.', true); return; }
  status('Ürünler yükleniyor…');
  try { await reload(); if (auth.currentUser?.uid === adminUid) $('#dashboard').hidden = false; }
  catch (error) { status(error.message, true); }
});

$('#editor').addEventListener('submit', async e => {
  e.preventDefault();
  if (busy || auth.currentUser?.uid !== adminUid) return;
  const product = products.find(p => p.id === selectedId);
  const name = $('#name').value.trim();
  const price = Number($('#price').value);
  const description = $('#description').value.trim();
  if (!product || !name || name.length > 150 || description.length > 2000 || !Number.isFinite(price) || price < 0 || price > 1000000) return;
  busy = true;
  $('#editor').querySelectorAll('input,textarea,button').forEach(el => { el.disabled = true; });
  $('#reload').disabled = true;
  $('#logout').disabled = true;
  renderList();
  $('#save-status').textContent = 'Kaydediliyor…';
  try {
    let image = product.image;
    const file = $('#image-file').files[0];
    if (file) {
      const token = await auth.currentUser.getIdToken();
      const signing = await fetch('/.netlify/functions/sign-upload', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) });
      const signed = await signing.json();
      if (!signing.ok) throw new Error(signed.error || 'Görsel yükleme yalnızca Netlify üzerinde kullanılabilir.');
      const body = new FormData();
      body.append('file', file);
      body.append('api_key', signed.apiKey);
      body.append('signature', signed.signature);
      for (const [key, value] of Object.entries(signed.params)) body.append(key, value);
      const upload = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body });
      const uploaded = await upload.json();
      if (!upload.ok || !validImage(uploaded.secure_url)) throw new Error('Görsel yüklenemedi. Cloudinary ayarlarını kontrol edin.');
      image = uploaded.secure_url;
    }
    await setDoc(doc(db, 'products', String(product.id)), { name, description, price, image, updatedAt: serverTimestamp() });
    products = products.map(p => p.id === product.id ? { ...p, name, urun_adi: name, aciklama: description, fiyat_tl: price, image } : p);
    dirty = false;
    $('#image-file').value = '';
    preview(image);
    $('#editor-title').textContent = name;
    $('#save-status').textContent = 'Kaydedildi. Menü sayfasını yenileyerek görebilirsin.';
  } catch (error) {
    $('#save-status').textContent = `Kaydedilemedi: ${error.code === 'permission-denied' ? 'Firestore güvenlik kurallarını yayınlayın.' : error.message}`;
  } finally {
    busy = false;
    $('#editor').querySelectorAll('input,textarea,button').forEach(el => { el.disabled = false; });
    $('#reload').disabled = false;
    $('#logout').disabled = false;
    renderList();
  }
});
window.addEventListener('beforeunload', e => { if (dirty || busy) { e.preventDefault(); e.returnValue = ''; } });
