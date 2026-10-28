import { categories, enrichProducts, filterProducts, formatPrice } from './menu-model.js';

const $ = selector => document.querySelector(selector);
const grid = $('#product-grid');
const tabs = $('#category-tabs');
const dialog = $('#product-dialog');
let products = [];
let activeCategory = categories.some(c => c.id === new URLSearchParams(location.search).get('category')) ? new URLSearchParams(location.search).get('category') : 'popular';
let query = '';
let sort = 'default';
let focusBeforeDialog;
const orderUrl = 'https://www.yemeksepeti.com/restaurant/mtph/dag-doner';
const sauceColors = { 43: '#b33b23', 44: '#f3e2b7', 45: '#c34825', 46: '#f8efdc', 47: '#eeac26' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function productImage(product, dialogView = false) {
  if (!product.image) return `<div class="sauce-art" role="img" aria-label="${escapeHtml(product.name)} sos illüstrasyonu"${dialogView ? ' style="height:220px"' : ''}><span class="sauce-bowl" style="--sauce-color:${sauceColors[product.id] || '#d96336'}"></span></div>`;
  return `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.urun_adi)}" ${dialogView ? 'class="dialog-image ' + (product.isDrink ? 'drink-image' : '') + '"' : 'loading="lazy" width="480" height="343"'}>`;
}

function renderTabs() {
  tabs.innerHTML = categories.map(category => `<button class="category-tab${category.id === activeCategory ? ' active' : ''}" data-category="${category.id}" aria-pressed="${category.id === activeCategory}"><span aria-hidden="true">${category.icon}</span>${category.label}</button>`).join('');
}

function renderProducts() {
  const category = categories.find(c => c.id === activeCategory);
  const result = filterProducts(products, activeCategory, query, sort);
  $('#category-kicker').textContent = query ? 'ARADIĞIN LEZZETLER' : category.kicker || category.label.toLocaleUpperCase('tr-TR');
  $('#category-title').textContent = query ? `“${query}” için sonuçlar` : category.title;
  $('#result-count').textContent = `${result.length} lezzet`;
  $('#show-all').hidden = activeCategory === 'all' && !query;
  if (!result.length) {
    grid.innerHTML = '<div class="empty-state"><h4>Bu lezzeti bulamadık.</h4><p>Başka bir kelime dene ya da tüm menüye göz at.</p><button class="button button-green" id="reset-filters">Tüm lezzetleri göster ↗</button></div>';
    $('#reset-filters').addEventListener('click', showAll);
    return;
  }
  grid.innerHTML = result.map(product => {
    const badge = product.id === 7 ? '<span class="product-badge">ÇOK SEVİLEN</span>' : product.id === 10 ? '<span class="product-badge orange">DAĞ’IN İMZASI</span>' : product.id === 4 ? '<span class="product-badge">BİZDEN BİR KLASİK</span>' : product.id === 30 ? '<span class="product-badge">BİRLİKTE DAHA GÜZEL</span>' : '';
    return `<article class="product-card"><button class="product-image-button${product.isDrink ? ' drink-image' : ''}" data-product="${product.id}" aria-label="${escapeHtml(product.urun_adi)} detaylarını gör">${productImage(product)}${badge}</button><div class="product-info"><span class="product-meta">${escapeHtml(product.categoryLabel)}</span><button class="product-title-button" data-product="${product.id}"><h4>${escapeHtml(product.name)}</h4></button><p>${escapeHtml(product.aciklama)}</p><div class="product-bottom"><span class="product-price">${formatPrice(product.fiyat_tl)}<small>₺</small></span><button data-product="${product.id}" aria-label="${escapeHtml(product.urun_adi)} ürününü incele">↗</button></div></div></article>`;
  }).join('');
}

function selectCategory(id, scrollToMenu = false) {
  activeCategory = id;
  query = '';
  $('#search').value = '';
  const url = new URL(location.href);
  if (id === 'popular') url.searchParams.delete('category'); else url.searchParams.set('category', id);
  history.replaceState(null, '', url);
  renderTabs();
  renderProducts();
  const activeTab = tabs.querySelector('.active');
  tabs.scrollTo({ left: Math.max(0, activeTab.offsetLeft - tabs.offsetLeft - 12), behavior: 'smooth' });
  if (scrollToMenu) $('#menu').scrollIntoView({ behavior: 'smooth' });
}

function showAll() { selectCategory('all', true); }

function openDialog(content) {
  focusBeforeDialog = document.activeElement;
  $('#dialog-content').innerHTML = content;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  $('.dialog-close').focus({ preventScroll: true });
}

function openProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  openDialog(`${productImage(product, true)}<div class="dialog-body"><p class="eyebrow">${escapeHtml(product.kategori)}</p><h2 id="dialog-title">${escapeHtml(product.urun_adi)}</h2><p>${escapeHtml(product.aciklama)}</p><div class="dialog-bottom"><span class="product-price">${formatPrice(product.fiyat_tl)}<small>₺</small></span><a class="button button-orange" href="${orderUrl}" target="_blank" rel="noopener noreferrer">Yemeksepeti’nde sipariş ver <span aria-hidden="true">↗</span></a></div><p class="dialog-note">Sipariş ve ödeme Yemeksepeti üzerinden gerçekleşir. Platform fiyatları ve kampanyaları farklılık gösterebilir. Alerjen bilgisi için restoran çalışanlarına danışın.</p></div>`);
}

tabs.addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (button) selectCategory(button.dataset.category); });
document.addEventListener('click', event => { const button = event.target.closest('[data-product]'); if (button) openProduct(Number(button.dataset.product)); });
$('.search-toggle').addEventListener('click', () => {
  const panel = $('#search-panel');
  panel.hidden = !panel.hidden;
  $('.search-toggle').setAttribute('aria-expanded', String(!panel.hidden));
  if (!panel.hidden) $('#search').focus({ preventScroll: true });
  else if (query) { query = ''; $('#search').value = ''; renderProducts(); }
});
$('#search').addEventListener('input', event => {
  query = event.target.value;
  if (activeCategory !== 'all') { activeCategory = 'all'; renderTabs(); const url = new URL(location.href); url.searchParams.set('category', 'all'); history.replaceState(null, '', url); }
  renderProducts();
});
$('#clear-search').addEventListener('click', () => { query = ''; $('#search').value = ''; renderProducts(); $('#search').focus(); });
$('#sort').addEventListener('change', event => { sort = event.target.value; renderProducts(); });
$('#show-all').addEventListener('click', showAll);
$('#family-cta').addEventListener('click', () => selectCategory('family', true));
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (focusBeforeDialog?.isConnected) focusBeforeDialog.focus({ preventScroll: true }); });
$('#allergen-info').addEventListener('click', () => openDialog('<div class="info-dialog"><p class="eyebrow">KÜÇÜK AMA ÖNEMLİ BİR NOT</p><h2 id="dialog-title">Alerjen bilgisi</h2><p>Ürünlerimiz gluten, süt ürünleri, yumurta, hardal ve diğer alerjenleri içerebilir. Ortak hazırlama alanları nedeniyle çapraz bulaşma riski bulunabilir.</p><p style="margin-top:15px">Alerjiniz veya özel bir beslenme ihtiyacınız varsa sipariş vermeden önce restoran çalışanlarından ürün içeriği ve hazırlama koşulları hakkında bilgi alın. Bu menü, ürün bazında doğrulanmış bir alerjen listesi değildir.</p><a class="button button-green" href="https://www.yemeksepeti.com/restaurant/mtph/dag-doner" target="_blank" rel="noopener noreferrer">Restoran sayfasına git ↗</a></div>'));
$('#year').textContent = new Date().getFullYear();

renderTabs();
try {
  const response = await fetch('references/DAG_DONER_TAM_MENU.json');
  if (!response.ok) throw new Error('Menü yüklenemedi');
  products = enrichProducts(await response.json());
  document.querySelectorAll('[data-hero-price]').forEach(element => {
    const product = products.find(p => p.id === Number(element.dataset.heroPrice));
    if (product) element.innerHTML = `${formatPrice(product.fiyat_tl)} <small>₺</small>`;
  });
  renderProducts();
} catch (error) {
  grid.innerHTML = '<div class="error-message">Menü şu an yüklenemedi. Lütfen sayfayı yenileyin veya <a href="https://www.yemeksepeti.com/restaurant/mtph/dag-doner" target="_blank" rel="noopener noreferrer">Yemeksepeti menümüzü açın ↗</a>.</div>';
  console.error(error);
}
