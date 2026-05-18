/**
 * ProjetBI V2 – app.js
 * ─────────────────────────────────────────────────────────────────────────
 * Architecture : Module Pattern (IIFE) + namespaces internes
 * Intègre directement les correctifs de app.perf.js et app.harden.js
 *
 * Modules :
 *   Security  – escapeHTML, escapeAttr, escapeJS, safeReadJSON, safeWriteJSON
 *   Config    – constantes et configuration Supabase
 *   State     – store réactif minimaliste
 *   Data      – chargement et cache des JSON
 *   Render    – rendu DOM (promises, news, press, stats)
 *   Filters   – logique de filtrage avec index de recherche précalculé
 *   Carousel  – carrousel presse accessible (pause hover/focus, reduced-motion)
 *   Modal     – modales accessibles (ESC, focus trap, retour de focus)
 *   A11y      – aria-label automatique, aria-hidden, skip-link
 *   SW        – enregistrement Service Worker
 *   App       – bootstrap et orchestration
 * ─────────────────────────────────────────────────────────────────────────
 */

'use strict';

(function ProjetBI() {

  /* ═══════════════════════════════════════════════════════════════
     SECURITY – Helpers d'échappement et stockage sûr
     ═══════════════════════════════════════════════════════════════ */
  const Security = (() => {
    const HTML_MAP = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' };
    const HTML_RE  = /[&<>"']/g;

    const ATTR_MAP = { ...HTML_MAP, '`':'&#96;','=':'&#61;' };
    const ATTR_RE  = /[&<>"'`=]/g;

    /** Échappe pour insertion dans le body HTML */
    function escapeHTML(str) {
      if (str == null) return '';
      return String(str).replace(HTML_RE, c => HTML_MAP[c]);
    }

    /** Tronque puis échappe */
    function escapeAndTruncate(str, max = 80) {
      if (!str) return '';
      const s = String(str);
      return escapeHTML(s.length > max ? s.slice(0, max) + '…' : s);
    }

    /** Échappe pour attribut HTML entre guillemets doubles */
    function escapeAttr(str) {
      if (str == null) return '';
      return String(str).replace(ATTR_RE, c => ATTR_MAP[c]);
    }

    /** Échappe pour littéral JS entre apostrophes (inline handlers) */
    function escapeJS(str) {
      if (str == null) return '';
      return String(str)
        .replace(/\\/g,  '\\\\')
        .replace(/'/g,   "\\'")
        .replace(/"/g,   '\\"')
        .replace(/\n/g,  '\\n')
        .replace(/\r/g,  '\\r')
        .replace(/ /g,'\\u2028')
        .replace(/ /g,'\\u2029')
        .replace(/</g,   '\\x3C')
        .replace(/>/g,   '\\x3E');
    }

    /** Lecture sûre du localStorage */
    function safeReadJSON(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null || raw === '') return fallback;
        return JSON.parse(raw);
      } catch (e) {
        console.warn('[Security] localStorage corrompu :', key, e.message);
        return fallback;
      }
    }

    /** Écriture sûre dans le localStorage */
    function safeWriteJSON(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('[Security] Impossible d\'écrire dans localStorage :', key, e.message);
        return false;
      }
    }

    /** Valide un ID (alphanumérique + - _ .) */
    function isValidId(id) {
      return typeof id === 'string' && /^[A-Za-z0-9_.\-]{1,128}$/.test(id);
    }

    return { escapeHTML, escapeAndTruncate, escapeAttr, escapeJS, safeReadJSON, safeWriteJSON, isValidId };
  })();

  /* Exposition globale pour les fonctions héritées de app.js */
  window.escapeHTML         = Security.escapeHTML;
  window.escapeAndTruncate  = Security.escapeAndTruncate;
  window.escapeAttr         = Security.escapeAttr;
  window.escapeJSString     = Security.escapeJS;
  window.safeReadJSON       = Security.safeReadJSON;


  /* ═══════════════════════════════════════════════════════════════
     CONFIG – Constantes applicatives
     ═══════════════════════════════════════════════════════════════ */
  const CONFIG = {
    /* Supabase */
    supabaseUrl: 'https://jwsdxttjjbfnoufiidkd.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3c2R4dHRqamJmbm91ZmlpZGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzOTQ3ODIsImV4cCI6MjA1OTk3MDc4Mn0.l68Fob5Pct5SZTH3VjDfxBNRfCDrjLWIjRf_Bpm2KcA',

    /* URLs des données */
    dataUrls: {
      promises: './promises.json',
      news:     './news.json',
      press:    './press.json',
    },

    /* UI */
    carouselAutoPlay:    true,
    carouselInterval:    4000,
    newsPageSize:        12,
    promisesPageSize:    24,

    /* Domaines (pour les filtres) */
    domaineLabels: {
      'Politique':        '🏛️ Politique',
      'Éducation':        '📚 Éducation',
      'Santé':            '🏥 Santé',
      'Économie':         '📈 Économie',
      'Infrastructures':  '🏗️ Infrastructures',
      'Agriculture':      '🌾 Agriculture',
      'Énergie':          '⚡ Énergie',
      'Social':           '🤝 Social',
      'Environnement':    '🌿 Environnement',
      'Justice':          '⚖️ Justice',
      'Sécurité':         '🛡️ Sécurité',
      'Diplomatie':       '🌍 Diplomatie',
    },
  };

  /* ═══════════════════════════════════════════════════════════════
     STATE – Store réactif simple
     ═══════════════════════════════════════════════════════════════ */
  const State = (() => {
    const _state = {
      promises:   [],
      news:       [],
      press:      [],
      votes:      {},
      ratings:    {},
      filters:    { search: '', domaine: '', status: '' },
      loading:    { promises: false, news: false, press: false },
      newsPage:   1,
      promisePage:1,
    };

    const _listeners = new Map();

    function get(key) {
      return key ? _state[key] : { ..._state };
    }

    function set(key, value) {
      _state[key] = value;
      if (_listeners.has(key)) {
        _listeners.get(key).forEach(fn => {
          try { fn(value); } catch (e) { console.error('[State]', e); }
        });
      }
    }

    function patch(key, partial) {
      _state[key] = { ..._state[key], ...partial };
      set(key, _state[key]);
    }

    function subscribe(key, fn) {
      if (!_listeners.has(key)) _listeners.set(key, new Set());
      _listeners.get(key).add(fn);
      return () => _listeners.get(key).delete(fn); // unsubscribe
    }

    return { get, set, patch, subscribe };
  })();


  /* ═══════════════════════════════════════════════════════════════
     DATA – Chargement parallèle des JSON avec cache mémoire
     ═══════════════════════════════════════════════════════════════ */
  const DataLayer = (() => {
    const _cache = new Map();

    async function fetchJSON(url) {
      if (_cache.has(url)) return _cache.get(url);

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        cache: 'default',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
      const data = await res.json();
      _cache.set(url, data);
      return data;
    }

    /**
     * Chargement parallèle des 3 sources de données.
     * Retourne true si au moins les promesses ont été chargées.
     */
    async function loadAll() {
      try {
        const [promises, news, press] = await Promise.allSettled([
          fetchJSON(CONFIG.dataUrls.promises),
          fetchJSON(CONFIG.dataUrls.news),
          fetchJSON(CONFIG.dataUrls.press),
        ]);

        if (promises.status === 'fulfilled') {
          const raw = promises.value;
          // Prétraitement : ajouter les champs de recherche précalculés
          const processed = preprocessPromises(Array.isArray(raw) ? raw : raw.promises || []);
          State.set('promises', processed);
        } else {
          console.error('[Data] promises.json :', promises.reason);
        }

        if (news.status === 'fulfilled') {
          const raw = news.value;
          State.set('news', Array.isArray(raw) ? raw : raw.articles || raw.news || []);
        } else {
          console.warn('[Data] news.json :', news.reason);
        }

        if (press.status === 'fulfilled') {
          const raw = press.value;
          State.set('press', Array.isArray(raw) ? raw : raw.items || raw.press || []);
        } else {
          console.warn('[Data] press.json :', press.reason);
        }

        return promises.status === 'fulfilled';
      } catch (e) {
        console.error('[Data] loadAll :', e);
        return false;
      }
    }

    /** Précalcule un champ _searchIndex pour les filtres rapides */
    function preprocessPromises(items) {
      return items.map(p => ({
        ...p,
        _searchIndex: [
          p.engagement, p.resultat, p.domaine, p.ministere, p.categorie,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      }));
    }

    return { loadAll, fetchJSON };
  })();


  /* ═══════════════════════════════════════════════════════════════
     FILTERS – Filtrage optimisé (index précalculé)
     ═══════════════════════════════════════════════════════════════ */
  const Filters = (() => {
    let _debounceTimer = null;

    function apply() {
      const { search, domaine, status } = State.get('filters');
      const all = State.get('promises');

      const q = search.trim().toLowerCase();

      const filtered = all.filter(p => {
        if (q && !p._searchIndex.includes(q)) return false;
        if (domaine && p.domaine !== domaine) return false;
        if (status) {
          if (status === 'realise'        && p.status !== 'realise')          return false;
          if (status === 'en-cours'       && p.status !== 'en-cours')         return false;
          if (status === 'en-retard'      && !p.isLate)                       return false;
          if (status === 'non-commence'   && p.status !== 'non-commence')     return false;
        }
        return true;
      });

      Render.promises(filtered);
      updateResultCount(filtered.length, all.length);
    }

    function applyDebounced(delay = 250) {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(apply, delay);
    }

    function updateResultCount(count, total) {
      const el = document.getElementById('resultsCount');
      if (!el) return;
      el.textContent = count === total
        ? `${total} engagement${total > 1 ? 's' : ''}`
        : `${count} / ${total} engagement${total > 1 ? 's' : ''}`;
    }

    function init() {
      const searchEl  = document.getElementById('search');
      const domaineEl = document.getElementById('domaine');
      const statusEl  = document.getElementById('status');

      if (searchEl) {
        searchEl.addEventListener('input', e => {
          State.patch('filters', { search: e.target.value });
          applyDebounced(300);
        });
      }

      if (domaineEl) {
        domaineEl.addEventListener('change', e => {
          State.patch('filters', { domaine: e.target.value });
          applyDebounced(0);
        });
      }

      if (statusEl) {
        statusEl.addEventListener('change', e => {
          State.patch('filters', { status: e.target.value });
          applyDebounced(0);
        });
      }
    }

    return { apply, applyDebounced, init };
  })();


  /* ═══════════════════════════════════════════════════════════════
     RENDER – Rendu DOM
     ═══════════════════════════════════════════════════════════════ */
  const Render = (() => {

    /* ── Icônes par catégorie ─────────────────────────────────── */
    const CAT_ICONS = {
      'Général':'fa-newspaper','Politique':'fa-landmark','Éducation':'fa-graduation-cap',
      'Santé':'fa-heartbeat','Économie':'fa-chart-line','Infrastructures':'fa-road',
      'Agriculture':'fa-seedling','Énergie':'fa-bolt','Environnement':'fa-leaf',
      'Social':'fa-hands-helping','Justice':'fa-balance-scale','Sécurité':'fa-shield-alt',
      'Diplomatie':'fa-globe','Finances':'fa-coins','Commerce':'fa-shopping-cart',
      'Habitat':'fa-home','Urbanisme':'fa-city','Transparence':'fa-eye',
    };

    function catIcon(cat) {
      if (!cat) return 'fa-circle';
      for (const [k, v] of Object.entries(CAT_ICONS)) {
        if (cat.toLowerCase().includes(k.toLowerCase())) return v;
      }
      return 'fa-circle';
    }

    /* ── Formatage des dates ──────────────────────────────────── */
    const _dateFormatters = new Map();

    function formatDate(dateStr, opts = { day:'numeric', month:'short', year:'numeric' }) {
      if (!dateStr) return '';
      const key = JSON.stringify(opts);
      if (!_dateFormatters.has(key)) {
        _dateFormatters.set(key, new Intl.DateTimeFormat('fr-FR', opts));
      }
      try {
        return _dateFormatters.get(key).format(new Date(dateStr));
      } catch {
        return dateStr;
      }
    }

    /* ── Stats ────────────────────────────────────────────────── */
    function stats() {
      const promises = State.get('promises');
      if (!promises.length) return;

      const total        = promises.length;
      const realise      = promises.filter(p => p.status === 'realise').length;
      const enCours      = promises.filter(p => p.status === 'en-cours').length;
      const enRetard     = promises.filter(p => p.isLate).length;
      const nonCommence  = promises.filter(p => p.status === 'non-commence').length;
      const tauxRealise  = total > 0 ? Math.round((realise / total) * 100) : 0;

      // Cache des refs DOM (une seule fois)
      const refs = {
        total:       document.getElementById('statTotal'),
        realise:     document.getElementById('statRealise'),
        enCours:     document.getElementById('statEnCours'),
        enRetard:    document.getElementById('statEnRetard'),
        nonCommence: document.getElementById('statNonCommence'),
        taux:        document.getElementById('statTaux'),
        tauxFill:    document.getElementById('tauxFill'),
        heroTotal:   document.getElementById('heroTotal'),
        heroRealise: document.getElementById('heroRealise'),
        heroTaux:    document.getElementById('heroTaux'),
      };

      // Mise à jour en une passe
      const updates = [
        [refs.total,       total],
        [refs.realise,     realise],
        [refs.enCours,     enCours],
        [refs.enRetard,    enRetard],
        [refs.nonCommence, nonCommence],
        [refs.taux,        `${tauxRealise}%`],
        [refs.heroTotal,   total],
        [refs.heroRealise, realise],
        [refs.heroTaux,    `${tauxRealise}%`],
      ];

      for (const [el, val] of updates) {
        if (el) el.textContent = val;
      }

      if (refs.tauxFill) {
        refs.tauxFill.style.width = `${tauxRealise}%`;
        refs.tauxFill.setAttribute('aria-valuenow', tauxRealise);
      }
    }

    /* ── Promesses ────────────────────────────────────────────── */
    function promises(items) {
      const container = document.getElementById('promisesGrid') ||
                        document.getElementById('promises-grid');
      if (!container) return;

      if (!items || items.length === 0) {
        container.innerHTML = `
          <div class="empty-state" role="status">
            <div class="empty-state-icon"><i class="fas fa-search" aria-hidden="true"></i></div>
            <p>Aucun engagement ne correspond à votre recherche.</p>
          </div>`;
        return;
      }

      const fragment = document.createDocumentFragment();
      for (const p of items) {
        const card = document.createElement('article');
        card.className = 'promise-card';
        card.dataset.id = Security.escapeAttr(p.id || '');

        const statusClass = getStatusClass(p);
        const statusLabel = getStatusLabel(p);
        const icon        = catIcon(p.categorie || p.domaine);
        const isLate      = p.isLate;

        card.innerHTML = `
          <div class="promise-card-header">
            <div>
              <span class="promise-domain-badge">
                <i class="fas ${Security.escapeAttr(icon)}" aria-hidden="true"></i>
                ${Security.escapeHTML(p.domaine || 'Général')}
              </span>
            </div>
            <span class="status-badge ${Security.escapeAttr(statusClass)}" aria-label="Statut : ${Security.escapeAttr(statusLabel)}">
              ${Security.escapeHTML(statusLabel)}
            </span>
          </div>
          <div class="promise-card-body">
            <h3 class="promise-title">${Security.escapeHTML(p.engagement || '')}</h3>
            ${p.resultat ? `<p class="promise-text">${Security.escapeHTML(p.resultat)}</p>` : ''}
            ${p.deadline ? `
              <div class="promise-meta">
                <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                <span>Échéance : <time datetime="${Security.escapeAttr(p.deadline)}">${formatDate(p.deadline)}</time></span>
                ${isLate ? '<span class="badge badge-danger">En retard</span>' : ''}
              </div>` : ''}
          </div>
          <div class="promise-card-footer">
            <div class="promise-actions" aria-label="Partager cet engagement">
              ${buildShareButtons(p)}
            </div>
            <button
              class="btn btn-ghost btn-sm"
              onclick="openPromiseDetail(${Security.escapeAttr(JSON.stringify(p.id))})"
              aria-label="Voir les détails de : ${Security.escapeAttr(p.engagement || '')}"
            >
              Détails <i class="fas fa-chevron-right" aria-hidden="true"></i>
            </button>
          </div>`;

        fragment.appendChild(card);
      }

      container.innerHTML = '';
      container.appendChild(fragment);
    }

    function getStatusClass(p) {
      if (p.status === 'realise')       return 'realise';
      if (p.status === 'en-cours')      return 'en-cours';
      if (p.isLate)                     return 'en-retard';
      return 'non-commence';
    }

    function getStatusLabel(p) {
      const map = {
        'realise':      'Réalisé ✓',
        'en-cours':     'En cours',
        'non-commence': 'Non commencé',
      };
      if (p.status && map[p.status]) return map[p.status];
      if (p.isLate) return 'En retard';
      return p.status || 'Inconnu';
    }

    function buildShareButtons(p) {
      const url  = encodeURIComponent(`https://projetbi.org/#promise-${p.id || ''}`);
      const text = encodeURIComponent(`Engagement présidentiel : ${(p.engagement || '').substring(0, 100)}`);
      return `
        <a href="https://twitter.com/intent/tweet?text=${text}&url=${url}"
           class="social-btn tw" target="_blank" rel="noopener noreferrer"
           aria-label="Partager sur X (Twitter)" title="Partager sur X">
          <i class="fab fa-x-twitter" aria-hidden="true"></i>
        </a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${url}"
           class="social-btn fb" target="_blank" rel="noopener noreferrer"
           aria-label="Partager sur Facebook" title="Partager sur Facebook">
          <i class="fab fa-facebook-f" aria-hidden="true"></i>
        </a>
        <a href="https://wa.me/?text=${text}%20${url}"
           class="social-btn wa" target="_blank" rel="noopener noreferrer"
           aria-label="Partager sur WhatsApp" title="Partager sur WhatsApp">
          <i class="fab fa-whatsapp" aria-hidden="true"></i>
        </a>`;
    }

    /* ── Actualités ───────────────────────────────────────────── */
    function news(items) {
      const container = document.getElementById('newsGrid') ||
                        document.getElementById('news-grid');
      if (!container || !items) return;

      if (!items.length) {
        container.innerHTML = `<div class="empty-state" role="status"><p>Aucune actualité disponible.</p></div>`;
        return;
      }

      const fragment = document.createDocumentFragment();

      // Tri Schwartzian (date → timestamp précalculé)
      const sorted = items
        .map(n => ({ n, ts: n.date ? new Date(n.date).getTime() : 0 }))
        .sort((a, b) => b.ts - a.ts)
        .map(({ n }) => n);

      for (const item of sorted) {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.setAttribute('role', 'article');
        card.setAttribute('tabindex', '0');

        const hasImg  = item.image && item.image.startsWith('http');
        const catIcon = catIcon_news(item.categorie);

        card.innerHTML = `
          ${hasImg
            ? `<img
                class="news-card-img"
                src="${Security.escapeAttr(item.image)}"
                alt="${Security.escapeAttr(item.titre || item.title || '')}"
                loading="lazy"
                decoding="async"
                onerror="this.parentElement.querySelector('.news-card-img-fallback').style.display='flex';this.style.display='none'"
              >`
            : ''}
          <div class="news-card-img-fallback" ${hasImg ? 'style="display:none"' : ''} aria-hidden="true">
            <i class="fas ${Security.escapeAttr(catIcon)}"></i>
          </div>
          <div class="news-card-body">
            <span class="news-category-badge">
              <i class="fas ${Security.escapeAttr(catIcon)}" aria-hidden="true"></i>
              ${Security.escapeHTML(item.categorie || 'Actualité')}
            </span>
            <h3 class="news-title">${Security.escapeHTML(item.titre || item.title || 'Sans titre')}</h3>
            ${item.resume || item.description
              ? `<p class="news-excerpt">${Security.escapeHTML(item.resume || item.description)}</p>`
              : ''}
          </div>
          <footer class="news-card-footer">
            <time class="news-date" datetime="${Security.escapeAttr(item.date || '')}">
              <i class="fas fa-calendar-alt" aria-hidden="true"></i>
              ${item.date ? formatDate(item.date) : ''}
            </time>
            <div class="promise-actions" aria-label="Partager">
              ${buildNewsShareButtons(item)}
            </div>
          </footer>`;

        card.addEventListener('click', () => openNewsDetail(item));
        card.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openNewsDetail(item);
          }
        });

        fragment.appendChild(card);
      }

      container.innerHTML = '';
      container.appendChild(fragment);
    }

    function catIcon_news(cat) {
      return catIcon(cat);
    }

    function buildNewsShareButtons(item) {
      const url  = encodeURIComponent(item.url || item.lien || 'https://projetbi.org/actualites.html');
      const text = encodeURIComponent((item.titre || item.title || '').substring(0, 100));
      return `
        <a href="https://twitter.com/intent/tweet?text=${text}&url=${url}"
           class="social-btn-small tw social-btn" target="_blank" rel="noopener noreferrer"
           aria-label="Partager sur X" title="Partager sur X">
          <i class="fab fa-x-twitter" aria-hidden="true"></i>
        </a>
        <a href="https://wa.me/?text=${text}%20${url}"
           class="social-btn-small wa social-btn" target="_blank" rel="noopener noreferrer"
           aria-label="Partager sur WhatsApp" title="Partager sur WhatsApp">
          <i class="fab fa-whatsapp" aria-hidden="true"></i>
        </a>`;
    }

    return { stats, promises, news };
  })();


  /* ═══════════════════════════════════════════════════════════════
     MODAL – Accessibilité des modales (ESC, focus trap, retour)
     ═══════════════════════════════════════════════════════════════ */
  const Modal = (() => {
    const _registry = new WeakMap();

    const FOCUSABLE = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    function open(modal, closeFn) {
      if (!modal || _registry.has(modal)) return;

      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('tabindex', '-1');
      document.body.style.overflow = 'hidden';

      const trigger = document.activeElement;

      setTimeout(() => {
        const first = modal.querySelectorAll(FOCUSABLE)[0] || modal;
        first.focus();
      }, 50);

      const onKey = e => {
        if (!modal.isConnected || modal.style.display === 'none') { cleanup(); return; }

        if (e.key === 'Escape' || e.key === 'Esc') {
          e.preventDefault();
          close(modal, closeFn, trigger);
        } else if (e.key === 'Tab') {
          trapFocus(e, modal);
        }
      };

      function cleanup() {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
        _registry.delete(modal);
      }

      document.addEventListener('keydown', onKey);
      _registry.set(modal, { trigger, cleanup });
    }

    function close(modal, closeFn, trigger) {
      const state = _registry.get(modal);
      if (state) {
        state.cleanup();
        const t = trigger || state.trigger;
        if (t?.focus) setTimeout(() => t.focus(), 50);
      }
      if (typeof closeFn === 'function') closeFn();
      else if (modal) modal.style.display = 'none';
    }

    function trapFocus(e, modal) {
      const focusables = [...modal.querySelectorAll(FOCUSABLE)];
      if (!focusables.length) { e.preventDefault(); return; }
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }

    /** Observe les modales statiques et les rend accessibles à l'ouverture */
    function watchStatic(id, closeFnName) {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new MutationObserver(() => {
        if (el.style.display && el.style.display !== 'none') {
          open(el, typeof window[closeFnName] === 'function'
            ? window[closeFnName]
            : null);
        }
      });
      obs.observe(el, { attributes: true, attributeFilter: ['style'] });
    }

    return { open, close, watchStatic };
  })();


  /* ═══════════════════════════════════════════════════════════════
     CAROUSEL – Carrousel presse accessible
     ═══════════════════════════════════════════════════════════════ */
  const Carousel = (() => {
    let _timer   = null;
    let _current = 0;
    let _items   = [];
    let _paused  = false;

    const prefersReducedMotion = () =>
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    function init(trackId, prevBtnId, nextBtnId) {
      const track = document.getElementById(trackId);
      if (!track) return;

      _items = [...track.children];
      if (!_items.length) return;

      const prevBtn = document.getElementById(prevBtnId);
      const nextBtn = document.getElementById(nextBtnId);

      if (prevBtn) prevBtn.addEventListener('click', prev);
      if (nextBtn) nextBtn.addEventListener('click', next);

      // Pause hover/focus
      const root = track.closest('[data-carousel]') || track.parentElement;
      if (root) {
        root.addEventListener('mouseenter', pause);
        root.addEventListener('mouseleave', resume);
        root.addEventListener('focusin',   pause);
        root.addEventListener('focusout',  resume);
      }

      // Respecter la préférence utilisateur
      if (window.matchMedia) {
        window.matchMedia('(prefers-reduced-motion: reduce)')
          .addEventListener('change', mq => {
            if (mq.matches) stop();
          });
      }

      if (CONFIG.carouselAutoPlay && !prefersReducedMotion()) {
        start();
      }
    }

    function goTo(index) {
      _current = (index + _items.length) % _items.length;
      // Déplacer les items visibles plutôt qu'un transform sur le track entier
      _items.forEach((item, i) => {
        item.setAttribute('aria-hidden', i !== _current);
      });
    }

    function prev() { goTo(_current - 1); }
    function next() { goTo(_current + 1); }

    function start() {
      if (_timer || prefersReducedMotion()) return;
      _timer = setInterval(next, CONFIG.carouselInterval);
    }

    function stop() {
      clearInterval(_timer);
      _timer = null;
    }

    function pause() {
      _paused = true;
      stop();
    }

    function resume() {
      if (!_paused) return;
      _paused = false;
      if (CONFIG.carouselAutoPlay && !prefersReducedMotion()) start();
    }

    return { init, prev, next, start, stop };
  })();

  // Exposition globale pour la compatibilité avec l'HTML existant
  window.startCarouselAutoPlay = Carousel.start;
  window.stopCarouselAutoPlay  = Carousel.stop;


  /* ═══════════════════════════════════════════════════════════════
     A11Y – Annotations automatiques
     ═══════════════════════════════════════════════════════════════ */
  const A11y = (() => {

    /** Copie le title → aria-label sur les boutons/liens icône-seul */
    function annotateIconButtons(root = document) {
      root.querySelectorAll('button:not([aria-label]), a:not([aria-label])').forEach(el => {
        const title  = el.getAttribute('title');
        const hasText = el.textContent.replace(/\s+/g, '').length > 0;
        if (title && !hasText) el.setAttribute('aria-label', title);
      });

      // Icônes FontAwesome décoratives
      root.querySelectorAll('i.fa, i.fas, i.far, i.fab, i.fa-solid, i.fa-regular, i.fa-brands').forEach(i => {
        if (!i.hasAttribute('aria-hidden') && !i.hasAttribute('aria-label')) {
          i.setAttribute('aria-hidden', 'true');
        }
      });
    }

    /** Labels des dots de carrousel */
    function labelCarouselDots(root = document) {
      root.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        if (!dot.hasAttribute('aria-label')) {
          dot.setAttribute('aria-label', `Diapositive ${i + 1}`);
        }
      });
    }

    /** Observe le DOM pour ré-annoter après les rendus dynamiques */
    function observe() {
      let queued = false;
      const obs = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        setTimeout(() => {
          queued = false;
          annotateIconButtons(document);
          labelCarouselDots(document);
        }, 200);
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    return { annotateIconButtons, labelCarouselDots, observe };
  })();


  /* ═══════════════════════════════════════════════════════════════
     NAVIGATION – Scroll, mobile menu, navbar active
     ═══════════════════════════════════════════════════════════════ */
  const Nav = (() => {
    let _raf = null;
    let _scrollY = 0;

    function initScrollEffects() {
      window.addEventListener('scroll', () => {
        _scrollY = window.scrollY;
        if (_raf) return;
        _raf = requestAnimationFrame(() => {
          _raf = null;
          onScroll(_scrollY);
        });
      }, { passive: true });
    }

    function onScroll(y) {
      const navbar = document.querySelector('.navbar');
      if (navbar) navbar.classList.toggle('scrolled', y > 10);

      // Back-to-top button
      const btt = document.getElementById('backToTop');
      if (btt) btt.classList.toggle('visible', y > 300);

      // Active nav link selon la section visible
      updateActiveNavLink();
    }

    function updateActiveNavLink() {
      const sections = document.querySelectorAll('section[id]');
      const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
      let active = '';

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom > 100) {
          active = section.id;
          break;
        }
      }

      navLinks.forEach(link => {
        const hash = link.getAttribute('href').substring(1);
        link.classList.toggle('active', hash === active);
        link.setAttribute('aria-current', hash === active ? 'page' : 'false');
      });
    }

    function initMobileMenu() {
      const btn  = document.querySelector('.mobile-menu-btn');
      const menu = document.querySelector('.nav-menu');
      if (!btn || !menu) return;

      btn.setAttribute('aria-controls', 'nav-menu');
      btn.setAttribute('aria-expanded', 'false');
      menu.id = 'nav-menu';

      btn.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('active');
        btn.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
      });

      // Fermer sur clic extérieur
      document.addEventListener('click', e => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
          closeMenu();
        }
      });

      // Fermer sur ESC
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMenu();
      });

      // Fermer sur clic d'un lien
      menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
      });

      function closeMenu() {
        menu.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }

    return { initScrollEffects, initMobileMenu };
  })();


  /* ═══════════════════════════════════════════════════════════════
     DETAILS – Ouverture des détails (news, promesses)
     ═══════════════════════════════════════════════════════════════ */

  function openNewsDetail(item) {
    const modal = document.getElementById('newsModal');
    if (!modal) return;

    const titleEl  = modal.querySelector('.article-modal-title, .modal-title');
    const bodyEl   = modal.querySelector('.article-modal-body, .modal-body');
    const imageEl  = modal.querySelector('.article-modal-img');

    if (titleEl) titleEl.textContent = item.titre || item.title || 'Sans titre';

    if (imageEl) {
      if (item.image) {
        imageEl.src = item.image;
        imageEl.alt = Security.escapeAttr(item.titre || '');
        imageEl.style.display = 'block';
      } else {
        imageEl.style.display = 'none';
      }
    }

    if (bodyEl) {
      bodyEl.innerHTML = `
        <div class="news-meta" style="margin-bottom:1rem;display:flex;gap:.5rem;flex-wrap:wrap">
          ${item.date ? `<time datetime="${Security.escapeAttr(item.date)}" class="news-date">
            <i class="fas fa-calendar-alt" aria-hidden="true"></i>
            ${Security.escapeHTML(new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric'}).format(new Date(item.date)))}
          </time>` : ''}
          ${item.categorie ? `<span class="news-category-badge">${Security.escapeHTML(item.categorie)}</span>` : ''}
        </div>
        <div class="news-content">
          ${item.contenu
            ? `<p>${Security.escapeHTML(item.contenu)}</p>`
            : item.resume || item.description
              ? `<p>${Security.escapeHTML(item.resume || item.description)}</p>`
              : '<p><em>Aucun contenu disponible.</em></p>'
          }
        </div>
        ${item.url || item.lien ? `
          <div style="margin-top:1.5rem">
            <a href="${Security.escapeAttr(item.url || item.lien)}"
               target="_blank" rel="noopener noreferrer"
               class="btn btn-primary">
              Lire l'article complet
              <i class="fas fa-external-link-alt" aria-hidden="true"></i>
            </a>
          </div>` : ''}`;
    }

    modal.style.display = 'flex';
    Modal.open(modal, () => {
      modal.style.display = 'none';
    });
  }

  // Exposition pour les onclick HTML existants
  window.openNewsDetail   = openNewsDetail;
  window.openNewsModal    = (id) => {
    if (!Security.isValidId(id)) return;
    const item = State.get('news').find(n => String(n.id) === String(id));
    if (item) openNewsDetail(item);
  };

  window.closeNewsModal = () => {
    const modal = document.getElementById('newsModal');
    if (modal) { modal.style.display = 'none'; }
  };

  window.openPromiseDetail = (id) => {
    if (!Security.isValidId(String(id))) return;
    const p = State.get('promises').find(x => String(x.id) === String(id));
    if (p) console.log('[App] Détail promesse :', p); // À remplacer par vraie modale
  };


  /* ═══════════════════════════════════════════════════════════════
     SUPABASE – Votes et notations
     ═══════════════════════════════════════════════════════════════ */
  const SupabaseService = (() => {
    let _client = null;

    function getClient() {
      if (_client) return _client;
      if (window.supabase?.createClient) {
        _client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
      }
      return _client;
    }

    async function getVotes(domaine = null) {
      const client = getClient();
      if (!client) return {};

      try {
        let query = client.from('votes').select('promise_id, note');
        if (domaine) query = query.eq('domaine', domaine);
        const { data, error } = await query;
        if (error) throw error;

        // Agréger par promise_id
        const agg = {};
        for (const row of (data || [])) {
          if (!agg[row.promise_id]) agg[row.promise_id] = { sum: 0, count: 0 };
          agg[row.promise_id].sum   += row.note;
          agg[row.promise_id].count += 1;
        }
        return agg;
      } catch (e) {
        console.error('[Supabase] getVotes :', e.message);
        return {};
      }
    }

    async function submitVote(promiseId, note) {
      if (!Security.isValidId(String(promiseId))) return false;
      if (typeof note !== 'number' || note < 1 || note > 5) return false;

      const client = getClient();
      if (!client) return false;

      try {
        const { error } = await client.from('votes').upsert({
          promise_id: promiseId,
          note,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
        return true;
      } catch (e) {
        console.error('[Supabase] submitVote :', e.message);
        return false;
      }
    }

    return { getClient, getVotes, submitVote };
  })();

  // Exposition globale (compatibilité avec l'HTML existant)
  window.processVotes   = () => SupabaseService.getVotes().then(v => State.set('votes', v));
  window.submitVote     = SupabaseService.submitVote;


  /* ═══════════════════════════════════════════════════════════════
     SERVICE WORKER – Enregistrement
     ═══════════════════════════════════════════════════════════════ */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => {
          console.log('[SW] Enregistré :', reg.scope);

          // Notifier l'utilisateur si une mise à jour est disponible
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            if (!worker) return;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateBanner();
              }
            });
          });
        })
        .catch(err => console.warn('[SW] Erreur d\'enregistrement :', err));
    });
  }

  function showUpdateBanner() {
    const banner = document.getElementById('updateBanner');
    if (banner) {
      banner.style.display = 'flex';
      banner.querySelector('[data-action="update"]')?.addEventListener('click', () => {
        navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  }


  /* ═══════════════════════════════════════════════════════════════
     APP – Bootstrap et orchestration principale
     ═══════════════════════════════════════════════════════════════ */
  const App = {

    async init() {
      // Navigation
      Nav.initScrollEffects();
      Nav.initMobileMenu();

      // Filtres
      Filters.init();

      // Accessibilité
      A11y.annotateIconButtons();
      A11y.labelCarouselDots();
      A11y.observe();

      // Modales statiques
      Modal.watchStatic('ratingsListModal', 'closeRatingsModal');
      Modal.watchStatic('ratingModal',      'closeRatingModal');
      Modal.watchStatic('photoViewerModal', 'closePhotoViewer');

      // Carrousel
      Carousel.init('pressCarousel', 'carouselPrev', 'carouselNext');

      // Chargement des données
      this.showLoading(true);
      const success = await DataLayer.loadAll();
      this.showLoading(false);

      if (success) {
        Render.stats();
        Render.promises(State.get('promises'));
        Render.news(State.get('news'));

        // Votes Supabase en arrière-plan (non bloquant)
        SupabaseService.getVotes()
          .then(votes => State.set('votes', votes))
          .catch(e => console.warn('[App] Votes :', e));
      } else {
        this.showError();
      }

      // Service Worker
      registerSW();

      // Analytics
      this.initAnalytics();

      console.log('[ProjetBI V2] Initialisé ✓');
    },

    showLoading(visible) {
      const el = document.getElementById('loadingState') ||
                 document.getElementById('loading-state');
      if (el) el.style.display = visible ? 'flex' : 'none';
    },

    showError() {
      const el = document.getElementById('errorState') ||
                 document.getElementById('error-state');
      if (el) el.style.display = 'flex';
    },

    initAnalytics() {
      // Cloudflare Web Analytics (chargement différé)
      const script = document.querySelector('script[data-cf-beacon]');
      if (!script) return;
      // Déjà injecté via l'HTML, pas besoin de le réinjecter
    },
  };

  /* ── Lancement ─────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  /* ── Exposition du namespace global (pour débogage) ──────── */
  window.ProjetBI = {
    State,
    Render,
    Filters,
    Carousel,
    Modal,
    Security,
    DataLayer,
    SupabaseService,
    version: '2.0.0',
  };

  // Compatibilité avec l'ancien CONFIG global
  window.CONFIG = CONFIG;

})(); /* fin ProjetBI IIFE */
