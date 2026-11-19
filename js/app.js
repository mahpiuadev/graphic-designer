/* =========================================================
   Portfolio · María del Pilar Parra
   JavaScript sin dependencias. Todas las rutas son relativas
   para que funcione en https://mahpiuadev.github.io/graphic-designer/
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const state = {
    categories: [],
    projects: [],
    active: 'todos',
    current: null,        // proyecto abierto
    opener: null,         // elemento que abrió el proyecto (para devolver el foco)
    lastScroll: 0,
  };

  const grid = $('#grid');
  const filtersEl = $('#filters');
  const emptyEl = $('#empty');
  const statusEl = $('#filter-status');
  const view = $('#project-view');
  const pvBody = $('#pv-body');
  const pvCounter = $('#pv-counter');
  const lightbox = $('#lightbox');
  const lbStage = $('#lb-stage');
  const lbImg = $('#lb-img');
  const lbCaption = $('#lb-caption');
  const pageBlocks = ['.site-header', 'main', '.site-footer'];
  const originalTitle = document.title;

  /* ---------- Utilidades ---------- */
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v === true ? '' : v);
    }
    [].concat(children).forEach(c => c && node.append(c));
    return node;
  }

  function makeImg(image, { eager = false, sizes } = {}) {
    if (!image.alt) console.warn('[portfolio] Falta el campo "alt" en la imagen:', image.src);
    const img = el('img', {
      src: image.src,
      alt: image.alt || '',
      width: image.width,
      height: image.height,
      decoding: 'async',
    });
    if (image.srcset) img.srcset = image.srcset;
    if (sizes) img.sizes = sizes;
    if (!eager) img.loading = 'lazy';
    return img;
  }

  const catName = id => (state.categories.find(c => c.id === id) || {}).name || id;
  const inCategory = (p, cat) => cat === 'todos' || (p.categories || []).includes(cat);
  const visibleProjects = () => state.projects.filter(p => inCategory(p, state.active));

  /* ---------- Carga de datos ---------- */
  async function loadData() {
    const [cats, projs] = await Promise.all([
      fetch('data/categories.json').then(r => r.json()),
      fetch('data/projects.json').then(r => r.json()),
    ]);
    state.categories = cats;
    state.projects = projs;
  }

  /* ---------- Filtros ---------- */
  function renderFilters() {
    filtersEl.replaceChildren();
    const make = (id, name, count) => {
      const b = el('button', { type: 'button', class: 'chip-btn', 'data-cat': id, 'aria-pressed': String(state.active === id) }, [
        el('span', { text: name }),
        el('span', { class: 'count', text: String(count), 'aria-label': `${count} proyectos` }),
      ]);
      b.addEventListener('click', () => setCategory(id));
      return b;
    };
    filtersEl.append(make('todos', 'Todos', state.projects.length));
    state.categories.forEach(c => {
      const n = state.projects.filter(p => (p.categories || []).includes(c.id)).length;
      if (n > 0) filtersEl.append(make(c.id, c.name, n));   // las categorías vacías se ocultan
    });
  }

  function setCategory(id, { updateUrl = true } = {}) {
    if (id !== 'todos' && !state.categories.some(c => c.id === id)) id = 'todos';
    state.active = id;
    $$('.chip-btn', filtersEl).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === id)));
    renderGrid();
    if (updateUrl) {
      const url = new URL(location.href);
      if (id === 'todos') url.searchParams.delete('cat'); else url.searchParams.set('cat', id);
      history.replaceState(history.state, '', url);
    }
  }

  /* ---------- Galería ---------- */
  function renderGrid() {
    const list = visibleProjects();
    grid.replaceChildren();
    list.forEach((p, i) => {
      const cover = p.cover || p.images[0];
      const a = el('a', { href: `#proyecto/${p.id}`, 'aria-label': `${p.title}. Ver proyecto` }, [
        makeImg(cover, { sizes: '(min-width:1040px) 33vw, (min-width:640px) 50vw, 100vw' }),
        p.ai ? el('span', { class: 'card-badge card-badge-ai', text: 'Hecho con IA', 'aria-hidden': 'true' }) : null,
        p.images.length > 1 ? el('span', { class: 'card-badge', text: `${p.images.length} imágenes`, 'aria-hidden': 'true' }) : null,
        el('div', { class: 'card-cap', 'aria-hidden': 'true' }, [
          el('strong', { text: p.title }),
          el('span', { text: (p.categories || []).map(catName).join(' · ') }),
        ]),
      ]);
      a.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        state.opener = a;
        state.lastScroll = window.scrollY;
        history.pushState({ fromList: true }, '', `#proyecto/${p.id}`);
        route();
      });
      grid.append(el('figure', { class: 'card', style: `--i:${Math.min(i, 12)}` }, a));
    });
    emptyEl.hidden = list.length > 0;
    statusEl.textContent = state.active === 'todos'
      ? `Mostrando todos los proyectos (${list.length})`
      : `Mostrando ${list.length} proyectos de ${catName(state.active)}`;
  }

  function renderHero() {
    const box = $('#hero-visual');
    const featured = state.projects.filter(p => p.featured).slice(0, 3);
    const picks = featured.length ? featured : state.projects.slice(0, 3);
    picks.forEach(p => {
      const img = makeImg(p.cover || p.images[0], { eager: true, sizes: '(min-width:860px) 30vw, 60vw' });
      img.alt = '';
      box.append(img);
    });
  }

  /* ---------- Vista de proyecto ---------- */
  function showProject(p) {
    state.current = p;
    const list = visibleProjects().some(x => x.id === p.id) ? visibleProjects() : state.projects;
    const idx = list.findIndex(x => x.id === p.id);
    const prev = list[(idx - 1 + list.length) % list.length];
    const next = list[(idx + 1) % list.length];

    const meta = [['Año', p.year], ['Rol', p.role], ['Cliente', p.client], ['Herramientas', (p.tools || []).join(', ')]]
      .filter(([, v]) => v);

    pvBody.replaceChildren(...[
      el('div', { class: 'pv-cats' }, (p.categories || []).map(c =>
        el('a', { href: `?cat=${c}#trabajos`, text: catName(c), 'data-cat': c }))),
      el('h1', { class: 'pv-title', id: 'pv-title', text: p.title }),
      meta.length ? el('dl', { class: 'pv-meta' }, meta.map(([k, v]) =>
        el('div', {}, [el('dt', { text: k }), el('dd', { text: String(v) })]))) : null,
      p.ai ? el('p', { class: 'pv-ai', text: 'Este cartel ha sido realizado con inteligencia artificial.' }) : null,
      p.description ? el('p', { class: 'pv-desc', text: p.description }) : null,
      buildGallery(p),
      el('nav', { class: 'pv-nav', 'aria-label': 'Navegación entre proyectos' }, list.length > 1 ? [
        el('a', { href: `#proyecto/${prev.id}`, class: 'prev', 'data-nav': prev.id }, [el('small', { text: '← Anterior' }), el('strong', { text: prev.title })]),
        el('a', { href: `#proyecto/${next.id}`, class: 'next', 'data-nav': next.id }, [el('small', { text: 'Siguiente →' }), el('strong', { text: next.title })]),
      ] : []),
    ].filter(Boolean));   // replaceChildren escribiría "null" con los huecos

    // Enlaces de categoría y navegación prev/next sin recargar
    $$('.pv-cats a', pvBody).forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      closeProject({ restoreScroll: false });
      setCategory(a.dataset.cat);
      $('#trabajos').scrollIntoView();
    }));
    $$('.pv-nav a', pvBody).forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      history.replaceState({ fromList: history.state && history.state.fromList }, '', `#proyecto/${a.dataset.nav}`);
      route();
      view.scrollTo({ top: 0 });
    }));

    pvCounter.textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : '';
    document.title = `${p.title} · Pilar Parra`;
    const wasHidden = view.hidden;
    view.hidden = false;
    document.body.classList.add('no-scroll');
    setInert(true);
    if (wasHidden) $('#pv-close').focus({ preventScroll: true });
  }

  function buildGallery(p) {
    const imgs = p.images || [];
    const wrap = el('div', { class: 'pv-gallery' + (imgs.length > 2 && p.gallery === 'duo' ? ' cols-2' : '') });
    imgs.forEach((im, i) => {
      const b = el('button', { type: 'button', 'aria-label': `Ampliar imagen ${i + 1} de ${imgs.length}${im.alt ? ': ' + im.alt : ''}` },
        makeImg(im, { eager: i === 0, sizes: '(min-width:1100px) 1060px, 100vw' }));
      b.addEventListener('click', () => openLightbox(imgs, i, b));
      wrap.append(b);
    });
    return wrap;
  }

  function closeProject({ restoreScroll = true } = {}) {
    if (view.hidden) return;
    if (history.state && history.state.fromList) {
      // Quita la entrada de historial que añadimos al abrir
      history.back();
      return;   // popstate → route() → hideProject()
    }
    history.replaceState(null, '', location.pathname + location.search);
    hideProject({ restoreScroll });
  }

  function hideProject({ restoreScroll = true } = {}) {
    if (view.hidden) return;
    view.hidden = true;
    document.body.classList.remove('no-scroll');
    setInert(false);
    document.title = originalTitle;
    state.current = null;
    if (restoreScroll) window.scrollTo({ top: state.lastScroll, behavior: 'instant' });
    if (state.opener && document.contains(state.opener)) state.opener.focus({ preventScroll: true });
  }

  function setInert(on) {
    pageBlocks.forEach(sel => { const n = $(sel); if (n) n.inert = on; });
  }

  /* ---------- Router por hash: #proyecto/<id> ---------- */
  function route() {
    const m = location.hash.match(/^#proyecto\/([\w-]+)$/);
    if (m) {
      const p = state.projects.find(x => x.id === m[1]);
      if (p) { showProject(p); return; }
    }
    hideProject();
  }

  /* ---------- Lightbox: zoom, teclado y gestos ---------- */
  const lb = { list: [], i: 0, zoom: false, opener: null };

  function openLightbox(list, i, opener) {
    lb.list = list; lb.i = i; lb.opener = opener;
    lightbox.dataset.single = String(list.length < 2);
    lightbox.hidden = false;
    paintLightbox();
    $('#lb-close').focus();
  }
  function paintLightbox() {
    const im = lb.list[lb.i];
    setZoom(false);
    lbImg.src = im.src;
    lbImg.alt = im.alt || '';
    lbCaption.textContent = `${lb.i + 1} / ${lb.list.length}${im.alt ? ' · ' + im.alt : ''}`;
  }
  function stepLightbox(d) {
    if (lb.list.length < 2) return;
    lb.i = (lb.i + d + lb.list.length) % lb.list.length;
    paintLightbox();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lbImg.removeAttribute('src');
    if (lb.opener) lb.opener.focus({ preventScroll: true });
  }
  function setZoom(on, evt) {
    lb.zoom = on;
    lbStage.classList.toggle('zoomed', on);
    if (on && evt) moveZoom(evt); else if (!on) lbImg.style.transformOrigin = '';
  }
  function moveZoom(e) {
    const r = lbStage.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    lbImg.style.transformOrigin = `${x}% ${y}%`;
  }

  $('#lb-close').addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', () => stepLightbox(-1));
  $('#lb-next').addEventListener('click', () => stepLightbox(1));
  lbStage.addEventListener('click', e => setZoom(!lb.zoom, e));
  lbStage.addEventListener('mousemove', e => { if (lb.zoom) moveZoom(e); });
  lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target.classList.contains('lb-figure')) closeLightbox(); });

  let touchX = null, touchY = null;
  lbStage.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  lbStage.addEventListener('touchend', e => {
    if (touchX === null || lb.zoom) { touchX = null; return; }
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) stepLightbox(dx < 0 ? 1 : -1);
    touchX = touchY = null;
  }, { passive: true });

  /* ---------- Teclado global y trampa de foco ---------- */
  document.addEventListener('keydown', e => {
    const lbOpen = !lightbox.hidden;
    const pvOpen = !view.hidden;
    if (e.key === 'Escape') {
      if (lbOpen) closeLightbox(); else if (pvOpen) closeProject();
      return;
    }
    if (lbOpen) {
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    }
    if (e.key === 'Tab' && (lbOpen || pvOpen)) trapFocus(e, lbOpen ? lightbox : view);
  });

  function trapFocus(e, container) {
    const focusables = $$('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])', container)
      .filter(n => n.offsetParent !== null || n === document.activeElement);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  $('#pv-close').addEventListener('click', () => closeProject());

  /* ---------- Tema claro / oscuro ---------- */
  const themeBtn = $('#theme-toggle');
  const root = document.documentElement;
  function paintThemeBtn() {
    themeBtn.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
  }
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* almacenamiento no disponible */ }
    paintThemeBtn();
  });
  paintThemeBtn();

  /* ---------- Peso del CV (se lee solo; si falla, queda "PDF") ---------- */
  async function fillCvSize() {
    const link = $('a[href$=".pdf"]');
    if (!link) return;
    try {
      const r = await fetch(link.getAttribute('href'), { method: 'HEAD' });
      const bytes = Number(r.headers.get('content-length'));
      if (r.ok && bytes) {
        const txt = bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
        $$('[data-cv-size]').forEach(n => { n.textContent = `PDF · ${txt}`; });
      }
    } catch (e) { /* sin peso: se deja "PDF" */ }
  }

  /* ---------- Formulario (Formspree opcional) ---------- */
  function setupForm() {
    const form = $('#contact-form');
    if (!form) return;
    if (form.getAttribute('action').includes('TU_ID')) { form.hidden = true; return; }
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('button', form);
      btn.disabled = true; btn.textContent = 'Enviando…';
      try {
        const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error();
        form.replaceChildren(el('p', { class: 'lead', role: 'status', text: '¡Gracias! He recibido tu mensaje y te responderé pronto.' }));
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Enviar mensaje';
        alert('No se pudo enviar. Inténtalo de nuevo o escríbeme por email.');
      }
    });
  }

  /* ---------- Aparición al hacer scroll ---------- */
  function setupReveal() {
    const items = $$('.about, .contact, .section-head');
    items.forEach(n => n.classList.add('reveal'));
    if (!('IntersectionObserver' in window)) { items.forEach(n => n.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .12 });
    items.forEach(n => io.observe(n));
  }

  /* ---------- Arranque ---------- */
  async function init() {
    $('#year').textContent = new Date().getFullYear();
    setupForm();
    setupReveal();
    fillCvSize();
    try {
      await loadData();
    } catch (err) {
      console.error(err);
      emptyEl.hidden = false;
      emptyEl.textContent = 'No se pudieron cargar los proyectos. Si abres el archivo directamente, usa un servidor local (ver README).';
      return;
    }
    renderFilters();
    renderHero();
    setCategory(new URLSearchParams(location.search).get('cat') || 'todos', { updateUrl: false });
    route();
  }

  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);
  init();
})();
