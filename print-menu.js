import { formatPrice } from './menu-model.js';
import { loadBaseProducts, loadOverrides, applyOverrides, displayImageUrl } from './menu-data.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Fixed booklet order. Product IDs are shared with the digital menu and dashboard.
export const pagePlan = [
  { className: 'paired', columns: [
    [{ title: 'Klasikler', ids: [0, 1, 2, 3, 4, 5] }],
    [{ title: 'Menülerimiz', ids: [21, 22, 23, 24, 72, 73] }],
  ] },
  { className: 'paired', columns: [
    [{ title: 'Hatay Usulü', ids: [6, 7, 8, 9] }, { title: 'Dağ Burritolar', ids: [10, 11, 12] }],
    [{ title: 'Menülerimiz', ids: [25, 26, 27, 28, 74, 75, 76], splitAfter: 4 }],
  ] },
  { className: 'sides-page', columns: [
    [{ title: 'Çıtırlar ve Yan Ürünler', ids: [33, 13, 34, 35, 38, 39, 36, 37, 40, 42] }],
    [{ title: 'Soslar', ids: [43, 46, 45, 44, 47], list: true }, { title: 'İlave Malzeme Ekleme', ids: [41, 77, 78, 79], list: true }],
  ] },
  { className: 'drinks-page', columns: [
    [{ title: 'İçecekler', ids: [49, 50, 51, 52, 53, 55, 56, 57, 58, 59, 60], list: true }],
    [{ title: 'İçecekler', ids: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71], list: true }],
  ] },
];

function item(product, list = false) {
  const element = document.createElement('article');
  element.className = `menu-item${list ? ' list-item' : ''}`;
  element.dataset.product = product.id;
  const photo = !list ? product.image
    ? `<img class="item-photo" src="${escape(displayImageUrl(product.image))}" alt="" width="68" height="68">`
    : '<span class="item-photo photo-placeholder" aria-label="Ürün görseli eklenecek">Görsel<br>eklenecek</span>' : '';
  element.innerHTML = `${photo}<div class="item-copy"><div class="item-top"><h3>${escape(product.name)}</h3><span class="price">${formatPrice(product.fiyat_tl)} <small>₺</small></span></div>${list ? '' : `<p class="description">${escape(product.aciklama)}</p>`}</div>`;
  return element;
}

function renderBooklet(products) {
  const byId = new Map(products.map(p => [p.id, p]));
  $('#sheets').innerHTML = '<article class="sheet cover" aria-label="Menü kapağı"><div class="cover-brand"><img src="logos/print-logo.png" alt="Dağ Döner — Lezzetin Zirvesi" width="1563" height="1006"><h1>MENÜ</h1></div></article>';
  for (const [index, plan] of pagePlan.entries()) {
    const sheet = document.createElement('article');
    sheet.className = `sheet ${plan.className}`;
    sheet.setAttribute('aria-label', `Menü sayfası ${index + 2}`);
    sheet.innerHTML = `<header class="sheet-header"><div class="brand"><img src="logos/print-logo.png" alt="Dağ Döner"><div><strong>DAĞ DÖNER</strong><small>“Lezzetin Zirvesi”</small></div></div></header><div class="columns"><div class="menu-column"></div><div class="menu-column"></div></div><div class="page-number" aria-label="Sayfa ${index + 2}">${String(index + 2).padStart(2, '0')} / 05</div>`;
    const columns = [...sheet.querySelectorAll('.menu-column')];
    plan.columns.forEach((groups, colIndex) => {
      for (const group of groups) {
        const title = document.createElement('div');
        title.className = 'category-heading';
        const heading = document.createElement('h2');
        heading.textContent = group.title;
        title.append(heading);
        if (group.title === 'Menülerimiz') {
          const note = document.createElement('small');
          note.className = 'category-note';
          note.textContent = 'İçecek Değişimi Fiyat Farkıyla Mevcuttur';
          title.append(note);
        }
        columns[colIndex].append(title);
        group.ids.forEach((id, rowIndex) => {
          const product = byId.get(id);
          if (!product) throw new Error(`Ürün ${id} bulunamadı.`);
          const row = item(product, group.list);
          // Match the Burrito section break on the left without repeating a heading.
          if (rowIndex === group.splitAfter) {
            const spacer = document.createElement('div');
            spacer.className = 'category-heading category-spacer';
            spacer.setAttribute('aria-hidden', 'true');
            spacer.textContent = 'Dağ Burritolar';
            columns[colIndex].append(spacer);
          }
          columns[colIndex].append(row);
        });
      }
    });
    $('#sheets').append(sheet);
  }
}

function validateLayout() {
  for (const column of document.querySelectorAll('.menu-column')) {
    if (column.scrollHeight > column.clientHeight + 1) throw new Error('Bir sütun sayfaya sığmıyor. Uzun ürün açıklamalarını kısaltıp tekrar deneyin.');
    for (const row of column.querySelectorAll('.menu-item')) {
      if (row.scrollHeight > row.clientHeight + 1) throw new Error('Bir ürün açıklaması satıra sığmıyor. Lütfen açıklamayı kısaltıp tekrar deneyin.');
    }
  }
}

async function prepare() {
  document.body.classList.remove('ready');
  $('#print').disabled = true;
  $('#retry').hidden = true;
  $('#status').classList.remove('error');
  $('#status').textContent = 'Mekân içi menü ve güncel veriler hazırlanıyor…';
  try {
    const [base, overrides] = await Promise.all([loadBaseProducts(), loadOverrides()]);
    renderBooklet(applyOverrides(base, overrides));
    await document.fonts.ready;
    const photos = [...document.querySelectorAll('.sheet img')];
    await Promise.all(photos.map(img => img.decode().catch(() => {
      if (img.closest('.cover') || img.closest('.brand')) throw new Error('Logo yüklenemedi.');
      const placeholder = document.createElement('span');
      placeholder.className = 'item-photo photo-placeholder';
      placeholder.textContent = 'Görsel eklenecek';
      img.replaceWith(placeholder);
    })));
    validateLayout();
    document.body.classList.add('ready');
    $('#print').disabled = false;
    $('#status').textContent = '5 A4 sayfa hazır: kapak, klasikler, Hatay / burrito, yan ürünler ve içecekler. Favoriler baskıda yoktur. Fiyatları baskı öncesinde kontrol edin.';
  } catch (error) {
    $('#sheets').replaceChildren();
    $('#status').textContent = `Baskı hazırlanamadı: ${error.message}`;
    $('#status').classList.add('error');
    $('#retry').hidden = false;
  }
}
$('#print').addEventListener('click', () => { if (document.body.classList.contains('ready')) window.print(); });
$('#retry').addEventListener('click', prepare);
prepare();
