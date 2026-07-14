/* ============================================
   Openwebdocs.kit-MD3 Docs - config.json driven
   ============================================ */
(function() {
  'use strict';

  const ROUTES = {};
  let FILE_TO_ROUTE = {};
  let SITE = { name:'Openwebdocs.kit-MD3', titleSuffix:'Openwebdocs.kit-MD3', meta:'Openwebdocs.kit-MD3 · 文档站点框架', docDir:'../docs' };
  let NAV = [];
  let SIDEBAR_LINKS = [];
  let CURRENT_ROUTE = '/';
  const DEFAULT_ROUTE = '/';

  const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    devices: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    schedule: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    computer: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    customize: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  };
  function iconSVG(name) { return ICONS[name] || ICONS.info; }

  async function loadConfig() {
    try {
      const resp = await fetch('config.json');
      if (!resp.ok) return;
      const cfg = await resp.json();
      if (cfg.site) Object.assign(SITE, cfg.site);
      if (cfg.nav && Array.isArray(cfg.nav)) {
        NAV = cfg.nav;
        const nr = {}, nf = {};
        function processNav(items, parentRoute) {
          items.forEach(item => {
            const tag = (item.title || item.file || '').toLowerCase();
            const autoSlug = tag.replace(/[\u4e00-\u9fff]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || tag.replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
            const route = item.route || (parentRoute ? parentRoute + '/' : '/') + autoSlug;
            item.route = route;
            const slug = route.split('/').pop();
            let file = item.file;
            if (!file) {
              if (item.children) file = route.replace(/^\//, '') + '/README.md';
              else if (parentRoute) file = parentRoute.replace(/^\//, '') + '/docs/' + slug + '.md';
              else file = route === '/' ? 'README.md' : route.replace(/^\//, '') + '.md';
            }
            nr[route] = { file, title: item.title, icon: item.icon || 'info' };
            nf[file] = route;
            if (item.children) processNav(item.children, route);
          });
        }
        processNav(cfg.nav);

        // Load blocks-nav.json and inject as children of "方块" item
        try {
          const blocksResp = await fetch('blocks-nav.json');
          if (blocksResp.ok) {
            const blocksList = await blocksResp.json();
            const blocksNavItem = NAV.find(item => item.route === '/blocks');
            if (blocksNavItem) {
              blocksNavItem.children = blocksList;
              blocksList.forEach(block => {
                nr[block.route] = { file: block.file, title: block.title, icon: 'computer' };
                nf[block.file] = block.route;
              });
            }
          }
        } catch (e) { console.warn('blocks-nav.json load failed:', e.message); }

        // Load articles.json to get children for items, mobs, crafting, mechanics categories
        try {
          const articlesResp = await fetch('../api/articles.json');
          if (articlesResp.ok) {
            const articlesData = await articlesResp.json();
            articlesData.categories.forEach(function(cat) {
              if (cat.id === 'blocks') return; // blocks already loaded from blocks-nav.json
              var navItem = NAV.find(function(item) { return item.route === cat.route; });
              if (navItem && cat.articles && cat.articles.length > 1) {
                // Filter out the category overview article (index)
                var children = cat.articles.filter(function(a) {
                  return a.route !== cat.route;
                });
                if (children.length > 0) {
                  navItem.children = children.map(function(a) {
                    return { title: a.title, route: a.route, file: a.file, icon: cat.icon };
                  });
                  children.forEach(function(a) {
                    nr[a.route] = { file: a.file, title: a.title, icon: cat.icon };
                    nf[a.file] = a.route;
                  });
                }
              }
            });
          }
        } catch (e) { console.warn('articles.json load failed:', e.message); }

        Object.assign(ROUTES, nr); Object.assign(FILE_TO_ROUTE, nf);
      }
      SIDEBAR_LINKS = cfg.sidebarLinks || [];
    } catch (e) { console.warn('config.json load failed:', e.message); }
  }

  /* ============================================
     Sidebar - MC Wiki Style (section-based, no collapsing)
     ============================================ */
  function renderSidebar() {
    if (!NAV.length) return;
    var html = '';

    NAV.forEach(function(item) {
      // Skip items without children (standalone pages handled separately)
      var hasKids = item.children && item.children.length;
      if (!hasKids) {
        // Standalone page like 首页 or 关于
        var route = item.route || '/' + (item.title || '').toLowerCase();
        html += '<a href="#' + route + '" class="nav-item-link' + (route === DEFAULT_ROUTE ? ' nav-item-link--active' : '') + '" data-route="' + route + '">';
        html += '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconSVG(item.icon || 'info') + '</svg>';
        html += item.title;
        html += '</a>';
        return;
      }

      // Category with children
      var catRoute = item.route || '/' + item.title.toLowerCase();
      var catIcon = iconSVG(item.icon || 'computer');

      html += '<div class="nav-section">';
      // Section header
      html += '<div class="nav-section__header">';
      html += '<svg viewBox="0 0 24 24" width="14" height="14" class="nav-section__icon" fill="none" stroke="currentColor" stroke-width="2">' + catIcon + '</svg>';
      html += '<span class="nav-section__title">' + item.title + '</span>';
      html += '</div>';

      // Category overview link
      html += '<a href="#' + catRoute + '" class="nav-cat-link" data-route="' + catRoute + '">' + item.title + '总览</a>';

      // Child links
      item.children.forEach(function(child) {
        var childRoute = child.route || '';
        html += '<a href="#' + childRoute + '" class="nav-child-link" data-route="' + childRoute + '">' + child.title + '</a>';
      });
      html += '</div>';
    });

    navList.innerHTML = html;
  }

  function renderSidebarLinks() {
    var container = $('#sidebarLinks');
    if (!container) return;
    container.innerHTML = '<div class="sidebar__footer-label">外部链接</div>' + SIDEBAR_LINKS.map(function(link) {
      return '<a href="' + link.url + '" class="sidebar-footer-link"' + (link.external ? ' target="_blank"' : '') + '>' +
        '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + iconSVG(link.external ? 'external' : 'home') + '</svg>' +
        link.title +
      '</a>';
    }).join('');
  }

  const $ = (sel) => document.querySelector(sel);
  const docTitle = $('#docTitle'), docBody = $('#docBody'), docMeta = $('#docMeta');
  const navList = $('#navList'), sidebar = $('#sidebar'), drawerOverlay = $('#drawerOverlay');
  const menuToggle = $('#menuToggle'), themeToggle = $('#themeToggle'), themeIcon = $('#themeIcon');
  const scrollTopBtn = $('#scrollTop'), tocList = $('#tocList');
  const sidebarSearchInput = $('#sidebarSearchInput');

  /* ============================================
     Version Data - Loaded from versions.json
     ============================================ */
  let VERSIONS = null;
  async function loadVersions() {
    try {
      const resp = await fetch('../versions.json');
      if (resp.ok) VERSIONS = await resp.json();
    } catch (e) { console.warn('versions.json load failed:', e.message); }
  }
  function getLatestVersion(edition) {
    if (!VERSIONS || !VERSIONS.latest) return edition === 'bedrock' ? '26.30' : '26.2';
    return edition === 'bedrock' ? VERSIONS.latest.bedrock : VERSIONS.latest.java;
  }
  function getLatestVersionName(edition) {
    if (!VERSIONS || !VERSIONS.latest) return 'Chaos Cubed';
    return edition === 'bedrock' ? VERSIONS.latest.bedrock_name : VERSIONS.latest.java_name;
  }
  function getLatestVersionNameZh(edition) {
    if (!VERSIONS || !VERSIONS.latest) return '混沌立方';
    return edition === 'bedrock' ? VERSIONS.latest.bedrock_name_zh : VERSIONS.latest.java_name_zh;
  }
  function getVersionDate(edition) {
    if (!VERSIONS || !VERSIONS.latest) return '';
    return edition === 'bedrock' ? VERSIONS.latest.bedrock_date : VERSIONS.latest.java_date;
  }

  function replaceVersionPlaceholders(md) {
    // Replace {{JE_VERSION}}, {{BE_VERSION}}, {{JE_NAME}}, {{BE_NAME}}, {{JE_DATE}}, {{BE_DATE}}
    // Also support {{JE_NAME_ZH}}, {{BE_NAME_ZH}}
    return md
      .replace(/\{\{JE_VERSION\}\}/g, getLatestVersion('java'))
      .replace(/\{\{BE_VERSION\}\}/g, getLatestVersion('bedrock'))
      .replace(/\{\{JE_NAME\}\}/g, getLatestVersionName('java'))
      .replace(/\{\{BE_NAME\}\}/g, getLatestVersionName('bedrock'))
      .replace(/\{\{JE_NAME_ZH\}\}/g, getLatestVersionNameZh('java'))
      .replace(/\{\{BE_NAME_ZH\}\}/g, getLatestVersionNameZh('bedrock'))
      .replace(/\{\{JE_DATE\}\}/g, getVersionDate('java'))
      .replace(/\{\{BE_DATE\}\}/g, getVersionDate('bedrock'));
  }

  function getPreferredTheme() { return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme);
    const isDark = theme === 'dark';
    themeIcon.innerHTML = isDark
      ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
      : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  }
  setTheme(getPreferredTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { if (!localStorage.getItem('theme')) setTheme(e.matches ? 'dark' : 'light'); });

  function openDrawer() { sidebar.classList.add('open'); drawerOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { sidebar.classList.remove('open'); drawerOverlay.classList.remove('active'); document.body.style.overflow = ''; }
  menuToggle.addEventListener('click', () => { sidebar.classList.contains('open') ? closeDrawer() : openDrawer(); });
  drawerOverlay.addEventListener('click', closeDrawer);
  navList.addEventListener('click', (e) => { if (window.innerWidth <= 768) closeDrawer(); });
  window.addEventListener('scroll', () => { scrollTopBtn.classList.toggle('visible', window.scrollY > 300); }, { passive: true });
  scrollTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  function updateActiveNav(route) {
    // Remove all active states
    navList.querySelectorAll('.nav-item-link--active, .nav-cat-link--active, .nav-child-link--active').forEach(function(el) {
      el.classList.remove('nav-item-link--active', 'nav-cat-link--active', 'nav-child-link--active');
    });

    // Find and activate matching item for the current route
    // Try child link first (most specific)
    var childMatch = navList.querySelector('.nav-child-link[data-route="' + route + '"]');
    if (childMatch) {
      childMatch.classList.add('nav-child-link--active');
      return;
    }

    // Try category link
    var catMatch = navList.querySelector('.nav-cat-link[data-route="' + route + '"]');
    if (catMatch) {
      catMatch.classList.add('nav-cat-link--active');
      return;
    }

    // Try standalone nav item
    var itemMatch = navList.querySelector('.nav-item-link[data-route="' + route + '"]');
    if (itemMatch) {
      itemMatch.classList.add('nav-item-link--active');
      return;
    }
  }

  function generateTOC(el) {
    tocList.innerHTML = '';
    const hs = el.querySelectorAll('h2, h3');
    if (!hs.length) { document.getElementById('tocSidebar').style.display = 'none'; return; }
    document.getElementById('tocSidebar').style.display = 'block';
    hs.forEach((h, i) => {
      if (!h.id) h.id = `${i}`;
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = `#${h.id}`; a.textContent = h.textContent; a.className = h.tagName === 'H3' ? 'toc-h3' : 'toc-h2';
      a.addEventListener('click', (e) => { e.preventDefault(); const t = document.getElementById(h.id); if (t) { t.scrollIntoView({ behavior:'smooth', block:'start' }); history.replaceState(null,'',`#${h.id}`); } });
      li.appendChild(a); tocList.appendChild(li);
    });
  }

  function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }

  /* ============================================
     Post-processing: MC Infobox, Gallery, Animated Images
     ============================================ */

  function processInfobox(body, title) {
    // Find the first blockquote (key-value stats)
    const bq = body.querySelector('blockquote');
    if (!bq) return;

    // Find the first standalone image (before any heading)
    let firstImg = null;
    const children = Array.from(body.children);
    for (const child of children) {
      if (child.tagName === 'H1' || child.tagName === 'H2') break;
      if (child.tagName === 'P') {
        const img = child.querySelector('img');
        if (img && !child.querySelector('em') && !firstImg) {
          firstImg = img;
          break;
        }
      }
    }

    // Parse blockquote lines into key-value pairs
    const lines = bq.innerHTML.split('\n').filter(l => l.trim());
    const rows = [];
    lines.forEach(line => {
      // Split by | separator
      const parts = line.split('|');
      parts.forEach(part => {
        const m = part.match(/\*\*(.+?)\*\*\s*[：:]\s*(.+)/);
        if (m) {
          rows.push({ label: m[1].trim(), value: m[2].trim() });
        }
      });
    });

    if (rows.length === 0) return;

    // Build infobox HTML
    let infoboxHTML = `<div class="mc-infobox">`;
    infoboxHTML += `<div class="mc-infobox__header">${escapeHtml(title)}</div>`;

    // Image
    if (firstImg) {
      const imgSrc = firstImg.getAttribute('src');
      const imgAlt = firstImg.getAttribute('alt') || title;
      infoboxHTML += `<div class="mc-infobox__image"><a href="${imgSrc}" target="_blank"><img src="${imgSrc}" alt="${escapeHtml(imgAlt)}" loading="lazy"></a></div>`;
      // Remove the original image paragraph
      const imgP = firstImg.closest('p');
      if (imgP) imgP.remove();
    }

    // Rows
    infoboxHTML += `<div class="mc-infobox__rows">`;
    rows.forEach(row => {
      infoboxHTML += `<div class="mc-infobox__row"><div class="mc-infobox__label">${row.label}</div><div class="mc-infobox__value">${row.value}</div></div>`;
    });
    infoboxHTML += `</div></div>`;

    // Replace blockquote with infobox
    const temp = document.createElement('div');
    temp.innerHTML = infoboxHTML;
    bq.parentNode.replaceChild(temp.firstElementChild, bq);
  }

  function processGallery(body) {
    // Find gallery section: images with captions under headings containing "图库" or "gallery"
    const galleryHeadings = [];
    body.querySelectorAll('h2, h3').forEach(h => {
      if (/图库|画廊|gallery/i.test(h.textContent)) {
        galleryHeadings.push(h);
      }
    });

    galleryHeadings.forEach(heading => {
      const items = [];
      let el = heading.nextElementSibling;
      // Collect consecutive image+caption pairs until next heading
      while (el && !/^H[1-6]$/.test(el.tagName)) {
        const img = el.querySelector('img');
        if (img) {
          const imgSrc = img.getAttribute('src');
          const imgAlt = img.getAttribute('alt') || '';
          // Look for caption in next sibling
          let caption = '';
          let next = el.nextElementSibling;
          if (next && next.tagName === 'P') {
            const em = next.querySelector('em');
            if (em) {
              caption = em.textContent.trim();
              // Check if next p is purely italic (caption)
              const textContent = next.textContent.trim();
              if (next.innerHTML.replace(/<[^>]+>/g, '').trim() === textContent && next.querySelector('em')) {
                items.push({ src: imgSrc, alt: imgAlt, caption, removeEl: el, removeNext: next });
                el = next.nextElementSibling;
                continue;
              }
            }
            // Also handle plain text caption in italic wrapper
            const italicOnly = next.querySelector('em');
            if (italicOnly && next.childNodes.length === 1) {
              caption = italicOnly.textContent.trim();
              items.push({ src: imgSrc, alt: imgAlt, caption, removeEl: el, removeNext: next });
              el = next.nextElementSibling;
              continue;
            }
          }
          // Also match the pattern: <p><em>caption</em></p> where the img is in a separate p before
          // Actually, marked renders ![alt](url) as <p><img></p> and *text* as <p><em>text</em></p>
          // So if there's an image p followed by an em-only p, that's a caption
          if (next && next.tagName === 'P' && next.querySelector('em') && !next.querySelector('img')) {
            caption = next.querySelector('em').textContent.trim();
            items.push({ src: imgSrc, alt: imgAlt, caption, removeEl: el, removeNext: next });
            el = next.nextElementSibling;
            continue;
          }
          // Image without caption
          items.push({ src: imgSrc, alt: imgAlt, caption: '', removeEl: el, removeNext: null });
        }
        const nextEl = el ? el.nextElementSibling : null;
        el = nextEl;
        // Break if we hit a non-caption element that's not an image
        if (el && !el.querySelector('img') && el.tagName !== 'P') break;
      }

      if (items.length === 0) return;

      // Remove collected elements
      items.forEach(item => {
        if (item.removeEl) item.removeEl.remove();
        if (item.removeNext) item.removeNext.remove();
      });

      // Build gallery
      let galleryHTML = `<div class="mc-gallery">`;
      items.forEach(item => {
        galleryHTML += `<div class="mc-gallery__item">`;
        galleryHTML += `<a href="${item.src}" target="_blank"><img src="${item.src}" alt="${escapeHtml(item.alt)}" loading="lazy"></a>`;
        if (item.caption) {
          galleryHTML += `<div class="mc-gallery__caption">${item.caption}</div>`;
        }
        galleryHTML += `</div>`;
      });
      galleryHTML += `</div>`;

      // Insert gallery after the heading
      const temp = document.createElement('div');
      temp.innerHTML = galleryHTML;
      heading.after(temp.firstElementChild);
    });
  }

  function processAnimatedImages(body) {
    // Add GIF badge to animated images
    body.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (src.toLowerCase().endsWith('.gif') || src.includes('.gif?')) {
        const parent = img.parentElement;
        if (parent && parent.tagName === 'P') {
          const badge = document.createElement('span');
          badge.className = 'mc-gif-badge';
          badge.textContent = 'GIF';
          parent.appendChild(badge);
        }
      }
    });
  }

  async function loadDocument(route) {
    let config = ROUTES[route];
    // If route contains a sub-path like "/blocks/stone", auto-resolve to file path
    if (!config && route.includes('/')) {
      const cleanRoute = route.replace(/^\//, ''); // remove leading /
      const parts = cleanRoute.split('/');
      const last = parts[parts.length - 1];
      // Check if parent route exists (e.g., /blocks) and child is a sub-document
      const parentRoute = '/' + parts.slice(0, -1).join('/');
      const parentConfig = ROUTES[parentRoute];
      if (parentConfig) {
        const file = cleanRoute + '.md';
        const title = last.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        config = { file, title };
        // Register so subsequent navigation and FILE_TO_ROUTE lookups work
        ROUTES[route] = config;
        FILE_TO_ROUTE[file] = route;
        FILE_TO_ROUTE[last + '.md'] = route;
      }
    }
    if (!config && (route.endsWith('.md') || route.endsWith('.txt'))) config = { file: route, title: route.replace(/\.(md|txt)$/i, '') };
    if (!config) { navigate(DEFAULT_ROUTE); return; }
    CURRENT_ROUTE = route;
    docTitle.textContent = config.title;
    document.title = `${config.title} - ${SITE.titleSuffix}`;
    docBody.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>加载文档中...</p></div>';
    tocList.innerHTML = ''; updateActiveNav(route);
    try {
      const response = await fetch(`${SITE.docDir}/${config.file}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let md = await response.text();
      md = replaceVersionPlaceholders(md);
      pageCache[route] = { title: config.title, content: md, file: config.file };
      const renderer = new marked.Renderer();
      renderer.heading = function({ text, depth }) {
        const slug = text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '');
        return `<h${depth} id="${slug}"><a class="heading-anchor" href="#${slug}" aria-hidden="true">#</a>${text}</h${depth}>`;
      };
      renderer.code = function({ text, lang }) {
        const language = lang || '', validLang = language && hljs.getLanguage(language) ? language : '';
        const highlighted = validLang ? hljs.highlight(text, { language: validLang }).value : escapeHtml(text);
        return `<pre data-language="${language}"><code class="hljs${validLang?' language-'+validLang:''}">${highlighted}</code></pre>`;
      };
      renderer.link = function({ href, tokens }) {
        const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
        return `<a href="${href}"${isExternal?' target="_blank" rel="noopener noreferrer"':''}>${this.parser.parseInline(tokens)}</a>`;
      };
      marked.use({ renderer, breaks: true, gfm: true });
      docBody.innerHTML = marked.parse(md);
      processInfobox(docBody, config.title);
      processGallery(docBody);
      processAnimatedImages(docBody);
      generateTOC(docBody);
      const scrollTo = sessionStorage.getItem('scrollTo');
      if (scrollTo) { sessionStorage.removeItem('scrollTo'); const s = scrollTo.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, ''); setTimeout(() => { const el = document.getElementById(s); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }); }, 200); }
      docMeta.innerHTML = `<span>${SITE.meta}</span>`;
    } catch (err) {
      console.error('Failed to load document:', err);
      docBody.innerHTML = `<div class="loading-state" style="gap:12px"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--md-sys-color-error)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p>文档加载失败</p><p style="font-size:14px;color:var(--md-sys-color-on-surface-variant)">${err.message}</p><button onclick="location.reload()" style="margin-top:12px;padding:8px 24px;border-radius:9999px;border:none;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);cursor:pointer;font-size:14px">重新加载</button></div>`;
    }
  }

  function navigate(route) { window.location.hash = (route.startsWith('#') ? route.slice(1) : route) || DEFAULT_ROUTE; }
  function handleRoute() {
    const hash = window.location.hash.slice(1);
    // Load doc if: empty, starts with /, is a .md/.txt file, or contains / (sub-document like blocks/stone)
    if (!hash || hash.startsWith('/') || hash.endsWith('.md') || hash.endsWith('.txt') || (hash.includes('/') && !hash.startsWith('http'))) {
      loadDocument(hash || DEFAULT_ROUTE);
    }
  }
  window.addEventListener('hashchange', handleRoute);

  docBody.addEventListener('click', (e) => {
    const link = e.target.closest('a'); if (!link) return;
    const href = link.getAttribute('href'); if (!href) return;
    const lastPart = href.split('/').pop();
    const [filename, anchor] = lastPart.split('#');
    const decoded = decodeURIComponent(filename.split('?')[0]);
    if (!decoded.endsWith('.md') && !decoded.endsWith('.txt')) return;
    e.preventDefault();
    // Try FILE_TO_ROUTE first, then use full relative path from href
    let route = FILE_TO_ROUTE[decoded] || FILE_TO_ROUTE[href];
    if (!route) {
      // If href is just "stone.md" (relative), prepend current doc's directory
      if (!href.includes('/') && CURRENT_ROUTE !== '/') {
        // Get the current route's directory from its file mapping
        const currentConfig = ROUTES[CURRENT_ROUTE];
        let dirPrefix = '';
        if (currentConfig && currentConfig.file) {
          // e.g., file = "blocks.md" → prefix = "blocks/"
          // e.g., file = "blocks/stone.md" → prefix = "blocks/"
          const parts = currentConfig.file.replace(/\.(md|txt)$/i, '').split('/');
          if (parts.length > 1) {
            dirPrefix = parts.slice(0, -1).join('/') + '/';
          } else {
            // Single file like "blocks.md" → use its name as directory
            dirPrefix = parts[0] + '/';
          }
        } else {
          // Fallback: use CURRENT_ROUTE path components (exclude last part = current doc)
          const parts = CURRENT_ROUTE.replace(/^\//, '').split('/');
          dirPrefix = parts.slice(0, -1).join('/');
          if (dirPrefix) dirPrefix += '/';
        }
        route = '/' + dirPrefix + href.replace(/\.(md|txt)$/i, '');
      } else {
        route = href.replace(/\.(md|txt)$/i, '');
      }
    }
    if (anchor) sessionStorage.setItem('scrollTo', anchor);
    navigate(`#${route}`);
  });

  themeToggle.addEventListener('click', () => { setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sidebar.classList.contains('open')) closeDrawer(); });

  const pageCache = {};
  async function init() {
    await loadConfig();
    await loadVersions();
    renderSidebar();
    renderSidebarLinks();
    if (!window.location.hash) window.location.hash = DEFAULT_ROUTE;
    else handleRoute();

    // Build search index
    buildSearchIndex();

    window.OWD = { config:SITE, routes:ROUTES, nav:NAV, cache:pageCache,
      navigate(r) { if (r) navigate('#' + r.replace(/^#/, '')); },
      async getPage(route) { const r=ROUTES[route]; if(!r)return null; if(pageCache[route])return pageCache[route]; try{const resp=await fetch(`${SITE.docDir}/${r.file}`);if(!resp.ok)return null;const t=await resp.text();pageCache[route]={title:r.title,content:t,file:r.file};return pageCache[route];}catch(e){return null;} },
      search(q) { const w=q.toLowerCase(),res=[]; for(const[k,p]of Object.entries(pageCache)){if(p.content.toLowerCase().includes(w)){const i=p.content.toLowerCase().indexOf(w);const s=p.content.substring(Math.max(0,i-30),i+w.length+80).replace(/\n/g,' ');res.push({route:k,title:p.title,snippet:'...'+s+'...',file:p.file});}} return res; },
      async searchAll(q) { await Promise.all(Object.keys(ROUTES).map(r=>this.getPage(r))); return this.search(q); }
    };
  }

  // ===== Search in doc pages =====
  let searchIndex = [];
  let searchTimeout = null;

  function buildSearchIndex() {
    searchIndex = [];
    NAV.forEach(function(item) {
      if (!item.children) {
        searchIndex.push({
          title: item.title,
          route: item.route || '/' + item.title.toLowerCase(),
          type: 'page',
          keywords: item.title
        });
      } else {
        searchIndex.push({
          title: item.title,
          route: item.route || '/' + item.title.toLowerCase(),
          type: 'category',
          keywords: item.title
        });
        if (item.children) {
          item.children.forEach(function(child) {
            searchIndex.push({
              title: child.title,
              route: child.route,
              type: 'page',
              keywords: child.title + ' ' + item.title
            });
          });
        }
      }
    });
  }

  function searchDocs(query) {
    if (!query || query.trim().length < 1) return [];
    var q = query.toLowerCase().trim();
    var results = [];
    searchIndex.forEach(function(item) {
      if (item.keywords.toLowerCase().indexOf(q) !== -1) {
        results.push(item);
      }
    });
    results.sort(function(a, b) {
      var aExact = a.title.toLowerCase() === q ? 2 : (a.title.toLowerCase().indexOf(q) === 0 ? 1 : 0);
      var bExact = b.title.toLowerCase() === q ? 2 : (b.title.toLowerCase().indexOf(q) === 0 ? 1 : 0);
      return bExact - aExact;
    });
    return results.slice(0, 8);
  }

  function renderDocSearchResults(results) {
    var container = document.getElementById('docSearchResults');
    var inner = document.getElementById('docSearchResultsInner');
    if (!container || !inner) return;
    if (!results || results.length === 0) {
      container.style.display = 'none';
      return;
    }
    inner.innerHTML = results.map(function(r) {
      var iconName = r.type === 'category' ? 'computer' : 'info';
      return '<a class="doc-search-result" href="#' + r.route + '">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">' + (ICONS[iconName] || ICONS.info) + '</svg>' +
        '<div class="doc-search-result__body">' +
          '<span class="doc-search-result__title">' + r.title + '</span>' +
          '<span class="doc-search-result__badge">' + (r.type === 'category' ? '分类' : '页面') + '</span>' +
        '</div>' +
      '</a>';
    }).join('');
    container.style.display = 'block';
  }

  // Initialize doc search
  var docSearchInput = document.getElementById('docSearchInput');
  var docSearchShortcut = document.querySelector('.doc-search__shortcut');
  if (docSearchInput) {
    docSearchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      var val = this.value;
      var self = this;
      searchTimeout = setTimeout(function() {
        var results = searchDocs(val);
        renderDocSearchResults(results);
      }, 150);
    });
    docSearchInput.addEventListener('focus', function() {
      if (docSearchShortcut) docSearchShortcut.style.display = 'none';
      if (this.value.trim().length > 0) {
        renderDocSearchResults(searchDocs(this.value));
      }
    });
    docSearchInput.addEventListener('blur', function() {
      if (docSearchShortcut) {
        docSearchShortcut.style.display = this.value.trim().length > 0 ? 'none' : 'inline-flex';
      }
    });
    document.addEventListener('click', function(e) {
      var searchWrap = document.getElementById('docSearch');
      if (searchWrap && !searchWrap.contains(e.target)) {
        var resultsEl = document.getElementById('docSearchResults');
        if (resultsEl) resultsEl.style.display = 'none';
      }
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === '/' && document.activeElement !== docSearchInput &&
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        docSearchInput.focus();
      }
      if (e.key === 'Escape') {
        var resultsEl = document.getElementById('docSearchResults');
        if (resultsEl) resultsEl.style.display = 'none';
        docSearchInput.blur();
      }
    });
  }
  // ===== Sidebar Search Filter =====
  if (sidebarSearchInput) {
    var sidebarFilterTimeout = null;
    sidebarSearchInput.addEventListener('input', function() {
      clearTimeout(sidebarFilterTimeout);
      var filter = this.value.toLowerCase().trim();
      var self = this;
      sidebarFilterTimeout = setTimeout(function() {
        if (!filter) {
          // Show all
          navList.querySelectorAll('.nav-child-link, .nav-cat-link, .nav-item-link, .nav-section').forEach(function(el) {
            el.style.display = '';
          });
          return;
        }
        // Filter: hide non-matching items
        navList.querySelectorAll('.nav-child-link').forEach(function(el) {
          var text = el.textContent.toLowerCase();
          el.style.display = text.indexOf(filter) !== -1 ? '' : 'none';
        });
        // Hide category links without visible children
        navList.querySelectorAll('.nav-section').forEach(function(section) {
          var visibleChildren = section.querySelectorAll('.nav-child-link[style*="display:"]');
          var allChildren = section.querySelectorAll('.nav-child-link');
          var hasVisible = Array.from(allChildren).some(function(c) { return c.style.display !== 'none'; });
          section.style.display = hasVisible ? '' : 'none';
        });
        // Hide standalone links that don't match
        navList.querySelectorAll('.nav-item-link').forEach(function(el) {
          var text = el.textContent.toLowerCase();
          el.style.display = text.indexOf(filter) !== -1 ? '' : 'none';
        });
        navList.querySelectorAll('.nav-cat-link').forEach(function(el) {
          var text = el.textContent.toLowerCase();
          el.style.display = text.indexOf(filter) !== -1 ? '' : 'none';
        });
      }, 100);
    });
  }

  function waitForDeps() { if (typeof marked!=='undefined' && typeof hljs!=='undefined') init(); else setTimeout(waitForDeps, 100); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForDeps);
  else waitForDeps();
})();
