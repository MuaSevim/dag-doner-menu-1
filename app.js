import { categories, filterProducts, formatPrice } from './menu-model.js';
import { loadBaseProducts, loadOverrides, applyOverrides } from './menu-data.js';

const $ = selector => document.querySelector(selector);
const container = $('#menu-categories');
const tabs = $('#category-tabs');
const toolbar = $('.menu-toolbar');
const dialog = $('#product-dialog');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let products = [];
let activeCategory = 'popular';
let query = '';
let sort = 'default';
let focusBeforeDialog;
let scrollFrame;
const sauceColors = { 43: '#b33b23', 44: '#f3e2b7', 45: '#c34825', 46: '#f8efdc', 47: '#eeac26' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function productImage(product) {
  if (!product.image) return `<div class="sauce-art" role="img" aria-label="${escapeHtml(product.name)} sos illüstrasyonu"><span class="sauce-bowl" style="--sauce-color:${sauceColors[product.id] || '#d96336'}"></span></div>`;
  return `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.urun_adi)}" loading="lazy" width="480" height="343">`;
}

function productCard(product) {
  const badge = product.id === 7 ? '<span class="product-badge">ÇOK SEVİLEN</span>' : product.id === 10 ? '<span class="product-badge orange">DAĞ’IN İMZASI</span>' : product.id === 4 ? '<span class="product-badge">BİZDEN BİR KLASİK</span>' : product.id === 30 ? '<span class="product-badge">BİRLİKTE DAHA GÜZEL</span>' : '';
  return `<article class="product-card"><div class="product-image-button${product.isDrink ? ' drink-image' : ''}">${productImage(product)}${badge}</div><div class="product-info"><span class="product-meta">${escapeHtml(product.categoryLabel)}</span><h4>${escapeHtml(product.name)}</h4><p>${escapeHtml(product.aciklama)}</p><div class="product-bottom"><span class="product-price">${formatPrice(product.fiyat_tl)}<small>₺</small></span></div></div></article>`;
}

function renderTabs() {
  tabs.innerHTML = categories.map(category => `<button class="category-tab" data-category="${category.id}" aria-controls="category-${category.id}" aria-pressed="false"><span aria-hidden="true">${category.icon}</span>${category.label}</button>`).join('');
}

function setActiveCategory(id) {
  const changed = activeCategory !== id;
  activeCategory = id;
  tabs.querySelectorAll('[data-category]').forEach(tab => {
    const active = tab.dataset.category === id;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  const activeTab = tabs.querySelector('.active');
  if (activeTab && changed) {
    const tabRect = activeTab.getBoundingClientRect();
    const tabsRect = tabs.getBoundingClientRect();
    if (tabRect.left < tabsRect.left || tabRect.right > tabsRect.right) {
      tabs.scrollTo({ left: tabs.scrollLeft + tabRect.left - tabsRect.left - (tabsRect.width - tabRect.width) / 2, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
  }
  if (changed) {
    const url = new URL(location.href);
    if (id === 'popular') url.searchParams.delete('category'); else url.searchParams.set('category', id);
    history.replaceState(null, '', url);
  }
}

function syncActiveCategory() {
  const sections = [...container.querySelectorAll('.menu-category:not([hidden])')];
  if (!sections.length) return;
  const threshold = toolbar.getBoundingClientRect().height + 24;
  let current = sections[0];
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= threshold) current = section;
    else break;
  }
  setActiveCategory(current.dataset.category);
}

function scheduleScrollSync() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => { scrollFrame = null; syncActiveCategory(); });
}

function renderProducts() {
  const results = categories.map(category => ({ category, items: filterProducts(products, category.id, query, sort) }));
  $('#result-count').textContent = `${filterProducts(products, 'all', query).length} lezzet`;
  container.innerHTML = results.map(({ category, items }) => `<section class="menu-category" id="category-${category.id}" data-category="${category.id}" aria-labelledby="title-${category.id}"${items.length ? '' : ' hidden'}><div class="results-heading"><div><span>${escapeHtml(category.title)}</span><h3 id="title-${category.id}">${escapeHtml(category.label)}</h3></div><span class="category-count">${items.length} lezzet</span></div><div class="product-grid">${items.map(productCard).join('')}</div></section>`).join('');
  if (!results.some(result => result.items.length)) {
    container.insertAdjacentHTML('beforeend', '<div class="empty-state"><h3>Bu lezzeti bulamadık.</h3><p>Başka bir kelime dene ya da aramayı temizle.</p><button class="button button-green" id="reset-search">Tüm lezzetleri göster ↗</button></div>');
    $('#reset-search').addEventListener('click', clearSearch);
    tabs.querySelectorAll('[data-category]').forEach(tab => { tab.classList.remove('active'); tab.setAttribute('aria-pressed', 'false'); });
  }
  tabs.querySelectorAll('[data-category]').forEach(tab => {
    tab.disabled = !results.find(result => result.category.id === tab.dataset.category).items.length;
  });
  syncActiveCategory();
}

function selectCategory(id) {
  let section = document.getElementById(`category-${id}`);
  if (!section) return;
  if (section.hidden) { query = ''; $('#search').value = ''; renderProducts(); section = document.getElementById(`category-${id}`); }
  const top = window.scrollY + section.getBoundingClientRect().top - toolbar.getBoundingClientRect().height - 16;
  setActiveCategory(id);
  window.scrollTo({ top, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
}

function clearSearch() {
  query = '';
  $('#search').value = '';
  renderProducts();
  $('#search').focus({ preventScroll: true });
}

tabs.addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (button && !button.disabled) selectCategory(button.dataset.category);
});
window.addEventListener('scroll', scheduleScrollSync, { passive: true });
window.addEventListener('resize', scheduleScrollSync);
$('.search-toggle').addEventListener('click', () => {
  const panel = $('#search-panel');
  panel.hidden = !panel.hidden;
  $('.search-toggle').setAttribute('aria-expanded', String(!panel.hidden));
  if (!panel.hidden) $('#search').focus({ preventScroll: true });
  else if (query) { query = ''; $('#search').value = ''; renderProducts(); }
});
$('#search').addEventListener('input', event => { query = event.target.value; renderProducts(); });
$('#clear-search').addEventListener('click', clearSearch);
$('#sort').addEventListener('change', event => { sort = event.target.value; renderProducts(); });
$('#family-cta').addEventListener('click', () => selectCategory('family'));

// Only the informational allergen dialog remains; product cards are non-interactive.
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (focusBeforeDialog?.isConnected) focusBeforeDialog.focus({ preventScroll: true }); });
$('#allergen-info').addEventListener('click', () => {
  focusBeforeDialog = document.activeElement;
  $('#dialog-content').innerHTML = '<div class="info-dialog"><p class="eyebrow">KÜÇÜK AMA ÖNEMLİ BİR NOT</p><h2 id="dialog-title">Alerjen bilgisi</h2><p>Ürünlerimiz gluten, süt ürünleri, yumurta, hardal ve diğer alerjenleri içerebilir. Ortak hazırlama alanları nedeniyle çapraz bulaşma riski bulunabilir.</p><p style="margin-top:15px">Alerjiniz veya özel bir beslenme ihtiyacınız varsa sipariş vermeden önce restoran çalışanlarından ürün içeriği ve hazırlama koşulları hakkında bilgi alın. Bu menü, ürün bazında doğrulanmış bir alerjen listesi değildir.</p></div>';
  dialog.showModal();
  document.body.classList.add('dialog-open');
  $('.dialog-close').focus({ preventScroll: true });
});
$('#year').textContent = new Date().getFullYear();

renderTabs();
try {
  products = await loadBaseProducts();
  try { products = applyOverrides(products, await loadOverrides()); }
  catch (error) {
    console.warn(error);
    const notice = document.createElement('p');
    notice.className = 'menu-data-notice';
    notice.setAttribute('role', 'status');
    notice.textContent = 'Güncel fiyatlar şu an doğrulanamıyor. Gösterilen bilgiler eski olabilir; lütfen restoranla teyit edin.';
    container.before(notice);
  }
  document.querySelectorAll('[data-hero-price]').forEach(element => {
    const product = products.find(p => p.id === Number(element.dataset.heroPrice));
    if (product) element.innerHTML = `${formatPrice(product.fiyat_tl)} <small>₺</small>`;
  });
  const initialCategory = new URLSearchParams(location.search).get('category');
  renderProducts();
  if (categories.some(category => category.id === initialCategory)) selectCategory(initialCategory);
} catch (error) {
  container.innerHTML = '<div class="error-message">Menü şu an yüklenemedi. Lütfen sayfayı yenileyin.</div>';
  console.error(error);
}
