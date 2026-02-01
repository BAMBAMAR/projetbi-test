// ============================================
// LE PROJET SÉNÉGAL - Application Principale
// Suivi Citoyen des Engagements Présidentiels
// Version: 2.1.0 (Optimisée & Sécurisée)
// ============================================

// ============================================
// CONFIGURATION & CONSTANTES
// ============================================

const CONFIG = {
    // API & Stockage
    supabaseUrl: 'https://yibgjbkxuljpfqavjxqh.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYmdqYmt4dWxqcGZxYXZqeHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYwMzU2MzcsImV4cCI6MjAyMTYxMTYzN30.Bp32fIh8Yq3JdDcVbGd5dQxZvVQvJqYwDfQxQjJkY7A',
    localStoragePrefix: 'projet-senegal-',
    cacheDuration: 30 * 60 * 1000, // 30 minutes
    
    // Compte à rebours
    countdownTarget: new Date('2029-04-02T00:00:00'),
    
    // Pagination
    itemsPerPage: 12,
    maxItems: 200,
    
    // Carrousels
    carouselSpeed: 5000,
    pressCarouselSpeed: 8000,
    
    // Sécurité
    maxRatingsPerDay: 5,
    ratingCooldown: 60000, // 1 minute entre notations
};

// Variables d'état globales
let appState = {
    // Données
    promises: [],
    filteredPromises: [],
    news: [],
    newspapers: [],
    pressImages: [],
    ratings: [],
    serviceRatings: [],
    
    // Filtres
    currentPage: 1,
    currentDomain: 'all',
    currentStatus: 'all',
    currentSearch: '',
    currentView: 'grid',
    
    // UI
    carouselIndex: 0,
    pressIndex: 0,
    isMobileMenuOpen: false,
    lastRatingTime: 0,
    ratingsToday: 0,
    
    // Chargement
    isLoadingPromises: false,
    isLoadingNews: false,
    isLoadingPress: false,
    isLoadingRatings: false,
};

// ============================================
// INITIALISATION GLOBALE
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialisation progressive
        await Promise.all([
            initializeCountdown(),
            initializeNavbar(),
            initializeFilters(),
            initializeButtons(),
            initializeCarousels(),
            initializeModals(),
            initializePhotoViewer(),
            initializeDateDisplay()
        ]);
        
        // Chargement des données avec fallback
        await loadDataWithFallback();
        
        // Initialisation du scroll
        initializeScrollTracking();
        
        console.log('✓ Application initialisée avec succès');
    } catch (error) {
        console.error('✗ Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors du chargement de l\'application', 'error');
        
        // Mode dégradé
        enableDegradedMode();
    }
});

// ============================================
// STOCKAGE SÉCURISÉ (localStorage fallback)
// ============================================

class SafeStorage {
    static setItem(key, value) {
        try {
            const prefixedKey = `${CONFIG.localStoragePrefix}${key}`;
            const item = {
                value: value,
                timestamp: Date.now()
            };
            localStorage.setItem(prefixedKey, JSON.stringify(item));
            return true;
        } catch (e) {
            console.warn('localStorage inaccessible:', e.message);
            // Fallback mémoire temporaire
            window.tempStorage = window.tempStorage || {};
            window.tempStorage[key] = value;
            return false;
        }
    }
    
    static getItem(key, maxAge = null) {
        try {
            const prefixedKey = `${CONFIG.localStoragePrefix}${key}`;
            const itemStr = localStorage.getItem(prefixedKey);
            
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            
            // Vérification de l'âge
            if (maxAge && Date.now() - item.timestamp > maxAge) {
                localStorage.removeItem(prefixedKey);
                return null;
            }
            
            return item.value;
        } catch (e) {
            console.warn('Erreur lecture localStorage:', e.message);
            return window.tempStorage?.[key] || null;
        }
    }
    
    static removeItem(key) {
        try {
            const prefixedKey = `${CONFIG.localStoragePrefix}${key}`;
            localStorage.removeItem(prefixedKey);
            if (window.tempStorage) delete window.tempStorage[key];
            return true;
        } catch (e) {
            console.warn('Erreur suppression localStorage:', e.message);
            return false;
        }
    }
    
    static clearExpired() {
        try {
            const now = Date.now();
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(CONFIG.localStoragePrefix)) {
                    try {
                        const item = JSON.parse(localStorage.getItem(key));
                        if (now - item.timestamp > CONFIG.cacheDuration) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        localStorage.removeItem(key);
                    }
                }
            });
        } catch (e) {
            console.warn('Erreur nettoyage localStorage:', e.message);
        }
    }
}

// ============================================
// CHARGEMENT DES DONNÉES AVEC FALLBACK
// ============================================

async function loadDataWithFallback() {
    try {
        // Nettoyage préventif du localStorage
        SafeStorage.clearExpired();
        
        // Chargement parallèle avec timeout
        const [promisesRes, newsRes, pressRes, ratingsRes] = await Promise.allSettled([
            loadPromisesWithFallback(),
            loadNewsWithFallback(),
            loadPressWithFallback(),
            loadRatingsWithFallback()
        ]);
        
        // Traitement des résultats
        if (promisesRes.status === 'fulfilled') {
            appState.promises = promisesRes.value;
            appState.filteredPromises = [...appState.promises];
            renderStats();
            renderPromises();
            renderFeaturedPromises();
            populateDomainFilter();
        } else {
            console.warn('Fallback: promesses non chargées', promisesRes.reason);
            loadPromisesFallback();
        }
        
        if (newsRes.status === 'fulfilled') {
            appState.news = newsRes.value;
            renderNews();
        } else {
            console.warn('Fallback: actualités non chargées', newsRes.reason);
            loadNewsFallback();
        }
        
        if (pressRes.status === 'fulfilled') {
            appState.pressImages = pressRes.value;
            initializePressCarousel();
        } else {
            console.warn('Fallback: presse non chargée', pressRes.reason);
            loadPressFallback();
        }
        
        if (ratingsRes.status === 'fulfilled') {
            appState.ratings = ratingsRes.value;
            renderRatingsOverview();
        } else {
            console.warn('Fallback: notations non chargées', ratingsRes.reason);
        }
        
        // Mise à jour du compteur
        updateResultsCount();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        showNotification('Données partiellement chargées (mode offline)', 'warning');
        loadAllFallbackData();
    }
}

// Chargement des promesses avec fallback Supabase → localStorage → données locales
async function loadPromisesWithFallback() {
    // 1. Essayer Supabase
    try {
        const { data, error } = await supabase
            .from('promesses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(CONFIG.maxItems);
        
        if (error) throw error;
        if (data && data.length > 0) {
            SafeStorage.setItem('promesses', data);
            console.log('✓ Promesses chargées depuis Supabase');
            return processPromisesData(data);
        }
    } catch (e) {
        console.warn('Supabase indisponible:', e.message);
    }
    
    // 2. Essayer localStorage
    const cached = SafeStorage.getItem('promesses', CONFIG.cacheDuration);
    if (cached && cached.length > 0) {
        console.log('✓ Promesses chargées depuis cache');
        return processPromisesData(cached);
    }
    
    // 3. Données fallback locales
    throw new Error('Aucune source de données disponible');
}

// Traitement et enrichissement des données promesses
function processPromisesData(rawData) {
    return rawData.map(p => {
        // Normalisation des champs
        const status = p.status?.trim() || '⏳ Non lancé';
        const domaine = p.domaine?.trim() || 'Autre';
        const title = p.titre?.trim() || p.title?.trim() || 'Engagement sans titre';
        
        // Calcul du retard si applicable
        let delayDays = 0;
        if (p.delai_prevu && p.date_realisation_prevue) {
            delayDays = parseDelayToDays(p.delai_prevu);
        }
        
        return {
            id: p.id || generateUniqueId(),
            title: title,
            domaine: domaine,
            status: status,
            date: p.date_creation || p.created_at || new Date().toISOString(),
            deadline: p.date_realisation_prevue || null,
            delayDays: delayDays,
            resultat: p.resultat_final || p.resultat || null,
            preuves: p.preuves || [],
            updates: p.mises_a_jour ? 
                (Array.isArray(p.mises_a_jour) ? p.mises_a_jour : JSON.parse(p.mises_a_jour)) 
                : [],
            rating: p.note_moyenne || 0,
            ratingCount: p.nombre_votes || 0,
            priority: p.priorite || 'medium'
        };
    }).sort((a, b) => {
        // Tri personnalisé: En retard > En cours > Non lancé > Réalisé
        const order = {
            '⚠️ En retard': 1,
            '🔄 En cours': 2,
            '⏳ Non lancé': 3,
            '✅ Réalisé': 4
        };
        return (order[a.status] || 99) - (order[b.status] || 99);
    });
}

// ============================================
// FONCTIONS UTILITAIRES CORRIGÉES & OPTIMISÉES
// ============================================

/**
 * Parse un délai textuel en jours (CORRIGÉ)
 * Ex: "2 ans 3 mois" → 820 jours
 */
function parseDelayToDays(delayText) {
    if (!delayText || typeof delayText !== 'string') return 0;
    
    const lower = delayText.toLowerCase().trim();
    let totalDays = 0;
    
    // Années
    const yearsMatch = lower.match(/(\d+)\s*an[s]?/i);
    if (yearsMatch) {
        const years = parseInt(yearsMatch[1], 10);
        totalDays += years * 365;
    }
    
    // Mois (CORRIGÉ: "low er" → "lower")
    const monthsMatch = lower.match(/(\d+)\s*mois?/i);
    if (monthsMatch) {
        const months = parseInt(monthsMatch[1], 10);
        totalDays += months * 30;
    }
    
    // Semaines
    const weeksMatch = lower.match(/(\d+)\s*semaine[s]?/i);
    if (weeksMatch) {
        const weeks = parseInt(weeksMatch[1], 10);
        totalDays += weeks * 7;
    }
    
    // Jours
    const daysMatch = lower.match(/(\d+)\s*jour[s]?/i);
    if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        totalDays += days;
    }
    
    return Math.round(totalDays);
}

/**
 * Génère un ID unique sécurisé
 */
function generateUniqueId() {
    return `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatte une date en français complet
 */
function formatDate(date) {
    if (!date) return 'Date inconnue';
    
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Date invalide';
        
        return d.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        console.warn('Erreur formatage date:', e);
        return 'Date inconnue';
    }
}

/**
 * Formatte une date courte (JJ/MM/AAAA)
 */
function formatDateShort(date) {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return '';
    }
}

/**
 * Calcule le temps restant jusqu'à une date cible
 */
function getTimeRemaining(endtime) {
    const total = Date.parse(endtime) - Date.parse(new Date());
    
    if (total <= 0) {
        return {
            total: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
    }
    
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    return {
        total,
        days,
        hours,
        minutes,
        seconds
    };
}

// ============================================
// COUNTDOWN TIMER (OPTIMISÉ)
// ============================================

function initializeCountdown() {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;
    
    function updateCountdown() {
        const t = getTimeRemaining(CONFIG.countdownTarget);
        
        daysEl.textContent = String(t.days).padStart(3, '0');
        hoursEl.textContent = String(t.hours).padStart(2, '0');
        minutesEl.textContent = String(t.minutes).padStart(2, '0');
        secondsEl.textContent = String(t.seconds).padStart(2, '0');
    }
    
    // Mise à jour immédiate + interval optimisé
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    console.log('✓ Countdown initialisé');
}

// ============================================
// NAVBAR & SCROLL (OPTIMISÉ)
// ============================================

function initializeNavbar() {
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!navbar || !mobileMenuBtn || !navMenu) return;
    
    // Effet de scroll avec debounce
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, 100);
    });
    
    // Toggle menu mobile
    mobileMenuBtn.addEventListener('click', () => {
        appState.isMobileMenuOpen = !appState.isMobileMenuOpen;
        navMenu.classList.toggle('show', appState.isMobileMenuOpen);
        mobileMenuBtn.classList.toggle('active', appState.isMobileMenuOpen);
    });
    
    // Fermer menu mobile au clic lien
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (appState.isMobileMenuOpen) {
                navMenu.classList.remove('show');
                mobileMenuBtn.classList.remove('active');
                appState.isMobileMenuOpen = false;
            }
        });
    });
    
    console.log('✓ Navbar initialisé');
}

// ============================================
// FILTRES & RECHERCHE (AVEC DEBOUNCE)
// ============================================

let filterDebounceTimer = null;

function initializeFilters() {
    const filterToggle = document.getElementById('filterToggle');
    const filtersSection = document.getElementById('filtersSection');
    const statusFilter = document.getElementById('statusFilter');
    const domainFilter = document.getElementById('domainFilter');
    const searchFilter = document.getElementById('searchFilter');
    const resetFilters = document.getElementById('resetFilters');
    const viewToggle = document.querySelectorAll('.view-btn');
    
    // Toggle filtres
    if (filterToggle && filtersSection) {
        filterToggle.addEventListener('click', () => {
            const isActive = filtersSection.classList.toggle('active');
            filterToggle.innerHTML = `
                <i class="fas fa-${isActive ? 'times' : 'filter'}"></i>
                <span>${isActive ? 'Fermer' : 'Filtres'}</span>
            `;
        });
    }
    
    // Filtre statut
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            appState.currentStatus = e.target.value;
            applyFilters();
        });
    }
    
    // Filtre domaine
    if (domainFilter) {
        domainFilter.addEventListener('change', (e) => {
            appState.currentDomain = e.target.value;
            applyFilters();
        });
    }
    
    // Recherche avec debounce (OPTIMISÉ)
    if (searchFilter) {
        searchFilter.addEventListener('input', (e) => {
            clearTimeout(filterDebounceTimer);
            filterDebounceTimer = setTimeout(() => {
                appState.currentSearch = e.target.value.toLowerCase().trim();
                applyFilters();
            }, 300); // 300ms de délai
        });
    }
    
    // Reset filtres
    if (resetFilters) {
        resetFilters.addEventListener('click', () => {
            if (statusFilter) statusFilter.value = 'all';
            if (domainFilter) domainFilter.value = 'all';
            if (searchFilter) searchFilter.value = '';
            
            appState.currentStatus = 'all';
            appState.currentDomain = 'all';
            appState.currentSearch = '';
            
            applyFilters();
            showNotification('Filtres réinitialisés', 'info');
        });
    }
    
    // Toggle vue (grille/liste)
    viewToggle.forEach(btn => {
        btn.addEventListener('click', () => {
            viewToggle.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            appState.currentView = btn.dataset.view;
            renderPromises();
        });
    });
    
    console.log('✓ Filtres initialisés');
}

/**
 * Applique les filtres avec optimisation
 */
function applyFilters() {
    if (appState.isLoadingPromises) return;
    
    let filtered = [...appState.promises];
    
    // Filtre statut
    if (appState.currentStatus !== 'all') {
        const statusMap = {
            'realise': '✅ Réalisé',
            'encours': '🔄 En cours',
            'nonlance': '⏳ Non lancé',
            'retard': '⚠️ En retard'
        };
        const targetStatus = statusMap[appState.currentStatus];
        filtered = filtered.filter(p => p.status === targetStatus);
    }
    
    // Filtre domaine
    if (appState.currentDomain !== 'all') {
        filtered = filtered.filter(p => 
            p.domaine.toLowerCase().includes(appState.currentDomain.toLowerCase())
        );
    }
    
    // Filtre recherche
    if (appState.currentSearch) {
        const searchTerms = appState.currentSearch.split(/\s+/).filter(t => t.length > 2);
        
        filtered = filtered.filter(p => {
            const searchable = `
                ${p.title.toLowerCase()}
                ${p.domaine.toLowerCase()}
                ${p.resultat?.toLowerCase() || ''}
                ${p.status.toLowerCase()}
            `;
            
            return searchTerms.every(term => searchable.includes(term));
        });
    }
    
    // Mise à jour état
    appState.filteredPromises = filtered;
    appState.currentPage = 1;
    
    // Rendu optimisé
    requestAnimationFrame(() => {
        renderPromises();
        updateResultsCount();
    });
}

/**
 * Met à jour le compteur de résultats
 */
function updateResultsCount() {
    const el = document.getElementById('resultsCount');
    if (!el) return;
    
    const count = appState.filteredPromises.length;
    el.textContent = `${count} engagement${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`;
}

// ============================================
// AFFICHAGE DES ENGAGEMENTS (OPTIMISÉ)
// ============================================

function renderPromises() {
    const grid = document.getElementById('promisesGrid');
    if (!grid || appState.isLoadingPromises) return;
    
    // Indicateur de chargement
    appState.isLoadingPromises = true;
    grid.innerHTML = `
        <div class="loading-state" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
            <p>Chargement des engagements...</p>
        </div>
    `;
    
    // Pagination
    const startIndex = (appState.currentPage - 1) * CONFIG.itemsPerPage;
    const endIndex = Math.min(startIndex + CONFIG.itemsPerPage, appState.filteredPromises.length);
    const promisesToDisplay = appState.filteredPromises.slice(startIndex, endIndex);
    
    // Rendu différé pour performance
    setTimeout(() => {
        if (promisesToDisplay.length === 0) {
            grid.innerHTML = `
                <div class="loading-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-muted);"></i>
                    <p>Aucun engagement ne correspond à vos critères</p>
                </div>
            `;
            appState.isLoadingPromises = false;
            updateShowMoreButton();
            return;
        }
        
        // Fragment DOM pour performance
        const fragment = document.createDocumentFragment();
        
        promisesToDisplay.forEach(promise => {
            const card = document.createElement('div');
            card.className = `promise-card status-${getStatusClass(promise.status)}`;
            card.dataset.id = promise.id;
            card.innerHTML = createPromiseCardHTML(promise);
            fragment.appendChild(card);
        });
        
        // Injection unique
        grid.innerHTML = '';
        grid.appendChild(fragment);
        
        // Écouteurs après injection
        document.querySelectorAll('.btn-stars').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.promise-card');
                const promiseId = card?.dataset.id;
                const promise = appState.promises.find(p => p.id === promiseId);
                if (promise) openRatingModal(promise);
            });
        });
        
        document.querySelectorAll('.btn-updates').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.promise-card');
                toggleUpdates(card);
            });
        });
        
        appState.isLoadingPromises = false;
        updateShowMoreButton();
    }, 50); // Délai minimal pour smooth rendering
}

/**
 * Crée le HTML d'une carte engagement (SÉCURISÉ)
 */
function createPromiseCardHTML(promise) {
    // Échappement HTML pour sécurité XSS
    const escapeHtml = (str) => {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };
    
    const hasUpdates = promise.updates && promise.updates.length > 0;
    const statusIcon = getStatusIcon(promise.status);
    const statusClass = getStatusClass(promise.status);
    
    return `
        <div class="promise-header">
            <div class="promise-status">
                <i class="fas fa-${statusIcon}"></i>
                ${escapeHtml(promise.status)}
            </div>
            <div class="promise-domain">${escapeHtml(promise.domaine)}</div>
        </div>
        <h3 class="promise-title">${escapeHtml(promise.title)}</h3>
        ${promise.resultat ? `
        <div class="promise-result">
            <strong>Résultat :</strong>
            <p>${escapeHtml(promise.resultat)}</p>
        </div>
        ` : ''}
        <div class="promise-meta">
            <span><i class="fas fa-calendar"></i> ${formatDateShort(promise.date)}</span>
            ${promise.deadline ? `
            <span><i class="fas fa-clock"></i> Échéance: ${formatDateShort(promise.deadline)}</span>
            ` : ''}
            ${hasUpdates ? `
            <span><i class="fas fa-sync"></i> ${promise.updates.length} mise${promise.updates.length > 1 ? 's' : ''} à jour</span>
            ` : ''}
        </div>
        ${hasUpdates ? `
        <button class="btn-updates">
            <i class="fas fa-chevron-down"></i>
            Voir les mises à jour
        </button>
        <div class="updates-list" style="display: none;">
            ${promise.updates.map((update, index) => `
                <div class="update-item">
                    <div class="update-date">${formatDate(update.date || update.created_at || new Date())}</div>
                    <div class="update-text">${escapeHtml(update.text || update.description || '')}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        <div class="promise-actions">
            <div class="social-share">
                <button class="social-btn fb" title="Partager sur Facebook" data-id="${promise.id}">
                    <i class="fab fa-facebook-f"></i>
                </button>
                <button class="social-btn tw" title="Partager sur Twitter" data-id="${promise.id}">
                    <i class="fab fa-twitter"></i>
                </button>
                <button class="social-btn wa" title="Partager sur WhatsApp" data-id="${promise.id}">
                    <i class="fab fa-whatsapp"></i>
                </button>
            </div>
            <button class="btn-stars" title="Noter cet engagement" data-id="${promise.id}">
                <i class="fas fa-star"></i>
                Noter
            </button>
        </div>
    `;
}

/**
 * Retourne la classe CSS pour un statut
 */
function getStatusClass(status) {
    if (!status) return 'non-lance';
    if (status.includes('✅ Réalisé') || status.includes('realise')) return 'realise';
    if (status.includes('🔄 En cours') || status.includes('encours')) return 'encours';
    if (status.includes('⚠️ En retard') || status.includes('retard')) return 'late';
    return 'non-lance';
}

/**
 * Retourne l'icône Font Awesome pour un statut
 */
function getStatusIcon(status) {
    if (!status) return 'clock';
    if (status.includes('✅ Réalisé')) return 'check-circle';
    if (status.includes('🔄 En cours')) return 'sync-alt';
    if (status.includes('⚠️ En retard')) return 'exclamation-triangle';
    return 'clock';
}

// ============================================
// STATISTIQUES & KPI
// ============================================

function renderStats() {
    if (appState.promises.length === 0) return;
    
    const stats = calculateStats(appState.promises);
    
    // Mise à jour des cartes
    updateStatCard('stat-total', stats.total, 'Total Engagements', '100%', 'tasks');
    updateStatCard('stat-success', stats.realise, '✅ Réalisés', `${stats.realisePercent}%`, 'check-circle');
    updateStatCard('stat-progress', stats.encours, '🔄 En Cours', `${stats.encoursPercent}%`, 'sync-alt');
    updateStatCard('stat-pending', stats.nonlance, '⏳ Non Lancés', `${stats.nonlancePercent}%`, 'clock');
    updateStatCard('stat-warning', stats.retard, '⚠️ En Retard', `${stats.retardPercent}%`, 'exclamation-triangle');
    updateStatCard('stat-rate', stats.tauxRealisation, '📈 Taux Réalisation', `${stats.progression} progression`, 'percentage');
    updateStatCard('stat-rating', stats.noteMoyenne, '⭐ Note Moyenne', `${stats.votes} votes`, 'star');
    updateStatCard('stat-update', stats.avecMaj, '📋 Avec MAJ', `${stats.avecMajPercent}%`, 'sync');
    updateStatCard('stat-time', stats.retardMoyen, '⏱️ Retard Moyen', 'Restant', 'stopwatch');
    updateStatCard('stat-domain', 1, `🏛️ ${stats.domainePrincipal}`, `-${stats.engagementsDomaine} engagements`, 'building');
}

function calculateStats(promises) {
    const total = promises.length;
    const realise = promises.filter(p => p.status.includes('✅ Réalisé')).length;
    const encours = promises.filter(p => p.status.includes('🔄 En cours')).length;
    const nonlance = promises.filter(p => p.status.includes('⏳ Non lancé')).length;
    const retard = promises.filter(p => p.status.includes('⚠️ En retard')).length;
    
    // Domaine principal
    const domaines = {};
    promises.forEach(p => {
        domaines[p.domaine] = (domaines[p.domaine] || 0) + 1;
    });
    const domainePrincipal = Object.entries(domaines)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Autre';
    const engagementsDomaine = domaines[domainePrincipal] || 0;
    
    // Calculs
    const realisePercent = total > 0 ? Math.round((realise / total) * 100) : 0;
    const encoursPercent = total > 0 ? Math.round((encours / total) * 100) : 0;
    const nonlancePercent = total > 0 ? Math.round((nonlance / total) * 100) : 0;
    const retardPercent = total > 0 ? Math.round((retard / total) * 100) : 0;
    const tauxRealisation = realisePercent;
    const progression = total > 0 ? ((realise + encours * 0.5) / total * 100).toFixed(1) : '0.0';
    const noteMoyenne = promises.reduce((sum, p) => sum + (p.rating || 0), 0) / (promises.length || 1);
    const votes = promises.reduce((sum, p) => sum + (p.ratingCount || 0), 0);
    const avecMaj = promises.filter(p => p.updates && p.updates.length > 0).length;
    const avecMajPercent = total > 0 ? Math.round((avecMaj / total) * 100) : 0;
    const retardMoyen = '0j';
    
    return {
        total,
        realise,
        encours,
        nonlance,
        retard,
        realisePercent,
        encoursPercent,
        nonlancePercent,
        retardPercent,
        tauxRealisation: `${tauxRealisation}%`,
        progression,
        noteMoyenne: noteMoyenne.toFixed(1),
        votes,
        avecMaj,
        avecMajPercent,
        retardMoyen,
        domainePrincipal,
        engagementsDomaine
    };
}

function updateStatCard(id, value, label, footer, icon) {
    const card = document.querySelector(`.stat-card.${id}`);
    if (!card) return;
    
    card.querySelector('.stat-value').textContent = value;
    card.querySelector('.stat-label').textContent = label;
    card.querySelector('.stat-percentage').textContent = footer;
    card.querySelector('.stat-icon i').className = `fas fa-${icon}`;
}

// ============================================
// ENGAGEMENTS EN VEDETTE
// ============================================

function renderFeaturedPromises() {
    const container = document.getElementById('promisesCarouselGrid');
    if (!container || appState.promises.length === 0) return;
    
    // Sélection aléatoire de 3 promesses non réalisées
    const candidates = appState.promises.filter(p => 
        !p.status.includes('✅ Réalisé')
    ).sort(() => Math.random() - 0.5).slice(0, 3);
    
    if (candidates.length === 0) return;
    
    container.innerHTML = candidates.map(promise => `
        <div class="carousel-promise-card status-${getStatusClass(promise.status)}">
            <div class="promise-card-header">
                <h4 class="promise-card-title">${promise.title}</h4>
                <div class="promise-card-meta">
                    <span><i class="fas fa-tag"></i> ${promise.domaine}</span>
                    <span><i class="fas fa-clock"></i> ${promise.delayDays || 0} jours</span>
                </div>
            </div>
            ${promise.resultat ? `
            <div class="promise-card-result">
                <strong>Résultat:</strong> ${promise.resultat.substring(0, 100)}...
            </div>
            ` : ''}
            <div class="promise-card-footer">
                <span class="promise-card-status">
                    <i class="fas fa-${getStatusIcon(promise.status)}"></i>
                    ${promise.status}
                </span>
                ${promise.rating > 0 ? `
                <span class="promise-card-rating">
                    <i class="fas fa-star"></i> ${promise.rating.toFixed(1)}/5 (${promise.ratingCount})
                </span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// ACTUALITÉS
// ============================================

function renderNews() {
    const grid = document.querySelector('.news-grid');
    if (!grid || appState.news.length === 0) return;
    
    grid.innerHTML = appState.news.slice(0, 6).map(news => `
        <div class="news-card" data-id="${news.id}" tabindex="0">
            <div class="news-image">
                <i class="fas fa-newspaper" style="font-size: 4rem; color: var(--primary);"></i>
            </div>
            <div class="news-content">
                <h3>${news.title || news.titre || 'Sans titre'}</h3>
                <p>${(news.excerpt || news.description || '').substring(0, 120)}...</p>
                <div class="news-footer">
                    <span><i class="fas fa-newspaper"></i> ${news.source || 'Source inconnue'}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDateShort(news.date || news.created_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Écouteurs clic actualités
    document.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', () => {
            const newsId = card.dataset.id;
            const news = appState.news.find(n => n.id === newsId);
            if (news) openNewsDetailModal(news);
        });
        
        // Accessibilité clavier
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

// ============================================
// CARROUSEL PRESSE
// ============================================

function initializePressCarousel() {
    if (appState.pressImages.length === 0) return;
    
    const pressImage = document.getElementById('pressImage');
    const pressDate = document.getElementById('pressDate');
    
    if (!pressImage || !pressDate) return;
    
    // Initialisation
    appState.pressIndex = 0;
    updatePressSlide();
    
    // Rotation automatique
    setInterval(() => {
        appState.pressIndex = (appState.pressIndex + 1) % appState.pressImages.length;
        updatePressSlide();
    }, CONFIG.pressCarouselSpeed);
    
    // Clic pour agrandir
    pressImage.addEventListener('click', () => {
        const currentImage = appState.pressImages[appState.pressIndex];
        if (currentImage?.url) {
            openPhotoViewer([currentImage], 0, 'Éditions de presse du jour');
        }
    });
}

function updatePressSlide() {
    const image = appState.pressImages[appState.pressIndex];
    if (!image) return;
    
    const pressImage = document.getElementById('pressImage');
    const pressDate = document.getElementById('pressDate');
    
    if (pressImage) {
        pressImage.src = image.url || 'https://projetbi.org/placeholder-press.jpg';
        pressImage.alt = image.title || 'Revue de presse';
        pressImage.style.cursor = 'zoom-in';
    }
    
    if (pressDate) {
        pressDate.textContent = image.date ? formatDate(image.date) : 'Date inconnue';
    }
}

function changePressImage(direction) {
    const newIndex = (appState.pressIndex + direction + appState.pressImages.length) % appState.pressImages.length;
    appState.pressIndex = newIndex;
    updatePressSlide();
}

// ============================================
// BOUTONS & INTERACTIONS
// ============================================

function initializeButtons() {
    // Bouton "Afficher plus"
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            appState.currentPage++;
            renderPromises();
            
            if (appState.currentPage > 1 && showLessBtn) {
                showLessBtn.style.display = 'inline-flex';
            }
            
            // Scroll smooth vers les résultats
            document.getElementById('promises')?.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    if (showLessBtn) {
        showLessBtn.addEventListener('click', () => {
            if (appState.currentPage > 1) {
                appState.currentPage--;
                renderPromises();
            }
            
            if (appState.currentPage === 1) {
                showLessBtn.style.display = 'none';
            }
        });
    }
    
    // Bouton scroll to top
    const scrollToTop = document.getElementById('scrollToTop');
    if (scrollToTop) {
        window.addEventListener('scroll', () => {
            scrollToTop.classList.toggle('visible', window.scrollY > 500);
        });
        
        scrollToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // Bouton téléchargement PDF
    const downloadBtn = document.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            trackDownload('programme-presidentiel.pdf');
            showNotification('Téléchargement du programme en cours...', 'info');
            // Lien réel à configurer selon hébergement
            window.open('Livre-Programme-Bassirou-Diomaye-Faye.pdf', '_blank');
        });
    }
}

function updateShowMoreButton() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (!showMoreBtn || !showLessBtn) return;
    
    const canLoadMore = appState.currentPage * CONFIG.itemsPerPage < appState.filteredPromises.length;
    showMoreBtn.style.display = canLoadMore ? 'inline-flex' : 'none';
    showLessBtn.style.display = appState.currentPage > 1 ? 'inline-flex' : 'none';
}

// ============================================
// NOTIFICATIONS (OPTIMISÉES)
// ============================================

function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.role = 'alert';
    
    const icons = {
        success: '✓',
        error: '✗',
        warning: '!',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || '•'}</span>
        <span class="notification-message">${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Fermeture automatique
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, type === 'error' ? 5000 : 3000);
}

// ============================================
// MODALS (NOTATION & DÉTAILS)
// ============================================

function initializeModals() {
    // Modal notation
    const ratingModal = document.getElementById('ratingModal');
    const closeRatingModal = document.getElementById('closeRatingModal');
    const cancelRating = document.getElementById('cancelRating');
    
    if (ratingModal && closeRatingModal) {
        closeRatingModal.addEventListener('click', () => {
            ratingModal.style.display = 'none';
            document.body.style.overflow = '';
        });
        
        cancelRating?.addEventListener('click', () => {
            ratingModal.style.display = 'none';
            document.body.style.overflow = '';
        });
        
        // Fermeture au clic extérieur
        ratingModal.addEventListener('click', (e) => {
            if (e.target === ratingModal) {
                ratingModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
    
    // Modal actualités
    const newsModal = document.getElementById('newsDetailModal');
    const closeNewsModal = document.getElementById('closeNewsModal');
    const closeNewsDetail = document.getElementById('closeNewsDetail');
    
    if (newsModal && closeNewsModal) {
        [closeNewsModal, closeNewsDetail].forEach(btn => {
            btn?.addEventListener('click', () => {
                newsModal.style.display = 'none';
                document.body.style.overflow = '';
            });
        });
        
        newsModal.addEventListener('click', (e) => {
            if (e.target === newsModal) {
                newsModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
        
        // Échap pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                ratingModal.style.display = 'none';
                newsModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
}

function openRatingModal(promise) {
    const modal = document.getElementById('ratingModal');
    const preview = document.getElementById('promisePreview');
    const stars = document.getElementById('ratingStars');
    const label = document.getElementById('ratingLabel');
    
    if (!modal || !preview || !stars || !label) return;
    
    // Vérification cooldown notation
    const now = Date.now();
    if (now - appState.lastRatingTime < CONFIG.ratingCooldown) {
        showNotification(`Veuillez attendre ${Math.ceil((CONFIG.ratingCooldown - (now - appState.lastRatingTime)) / 1000)} secondes avant de noter à nouveau`, 'warning');
        return;
    }
    
    if (appState.ratingsToday >= CONFIG.maxRatingsPerDay) {
        showNotification('Limite de notations quotidiennes atteinte (5 max)', 'warning');
        return;
    }
    
    // Pré-remplissage
    preview.textContent = promise.title;
    modal.dataset.promiseId = promise.id;
    
    // Réinitialisation étoiles
    stars.querySelectorAll('i').forEach((star, index) => {
        star.className = 'far fa-star';
        star.dataset.value = index + 1;
        
        star.addEventListener('click', () => {
            const value = parseInt(star.dataset.value);
            setRatingStars(stars, value);
            label.textContent = getRatingLabel(value);
        });
        
        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.dataset.value);
            highlightStars(stars, value);
        });
        
        star.addEventListener('mouseleave', () => {
            const currentRating = getSelectedRating(stars);
            highlightStars(stars, currentRating);
        });
    });
    
    // Affichage modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    appState.lastRatingTime = now;
}

function setRatingStars(container, rating) {
    container.querySelectorAll('i').forEach((star, index) => {
        star.className = index < rating ? 'fas fa-star' : 'far fa-star';
    });
}

function highlightStars(container, count) {
    container.querySelectorAll('i').forEach((star, index) => {
        star.className = index < count ? 'fas fa-star' : 'far fa-star';
    });
}

function getSelectedRating(container) {
    return Array.from(container.querySelectorAll('i.fas')).length;
}

function getRatingLabel(rating) {
    const labels = [
        'Très insatisfait',
        'Insatisfait',
        'Moyen',
        'Satisfait',
        'Très satisfait'
    ];
    return rating > 0 ? labels[rating - 1] : 'Sélectionnez une note';
}

function openNewsDetailModal(news) {
    const modal = document.getElementById('newsDetailModal');
    if (!modal || !news) return;
    
    // Remplissage
    document.getElementById('newsDetailTitle').textContent = news.title || news.titre || 'Sans titre';
    document.getElementById('newsSource').textContent = news.source || 'Source inconnue';
    document.getElementById('newsDate').textContent = formatDate(news.date || news.created_at);
    document.getElementById('newsAuthor').textContent = news.author || news.auteur || 'Anonyme';
    document.getElementById('newsTime').textContent = '3 min de lecture';
    document.getElementById('newsExcerpt').textContent = news.excerpt || news.description?.substring(0, 200) + '...' || 'Aucun résumé disponible';
    document.getElementById('newsContent').textContent = news.content || news.description || news.excerpt || 'Contenu non disponible';
    
    const linkEl = document.getElementById('newsLink');
    if (linkEl && news.url) {
        linkEl.href = news.url;
        linkEl.style.display = 'inline-flex';
    } else if (linkEl) {
        linkEl.style.display = 'none';
    }
    
    // Affichage
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ============================================
// PHOTO VIEWER
// ============================================

function initializePhotoViewer() {
    const modal = document.getElementById('photoViewerModal');
    const closeBtn = document.getElementById('closeViewerBtn');
    const prevBtn = document.getElementById('prevPhoto');
    const nextBtn = document.getElementById('nextPhoto');
    const imageEl = document.getElementById('photoViewerImage');
    
    if (!modal || !closeBtn || !imageEl) return;
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
    
    prevBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        changePhoto(-1);
    });
    
    nextBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        changePhoto(1);
    });
    
    // Glisser pour naviguer
    let startX = 0;
    imageEl.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    
    imageEl.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        if (startX - endX > 50) changePhoto(1);   // Swipe gauche → suivant
        if (endX - startX > 50) changePhoto(-1);  // Swipe droit → précédent
    });
}

function openPhotoViewer(images, startIndex = 0, title = 'Galerie') {
    const modal = document.getElementById('photoViewerModal');
    const imageEl = document.getElementById('photoViewerImage');
    const captionEl = document.getElementById('photoViewerCaption');
    const titleEl = document.getElementById('photoViewerTitle');
    
    if (!modal || !imageEl) return;
    
    // Stockage temporaire des images
    modal.dataset.images = JSON.stringify(images);
    modal.dataset.index = startIndex;
    
    // Mise à jour UI
    if (titleEl) titleEl.textContent = title;
    updatePhotoViewer();
    
    // Affichage
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function updatePhotoViewer() {
    const modal = document.getElementById('photoViewerModal');
    const imageEl = document.getElementById('photoViewerImage');
    const captionEl = document.getElementById('photoViewerCaption');
    
    if (!modal || !imageEl) return;
    
    try {
        const images = JSON.parse(modal.dataset.images || '[]');
        const index = parseInt(modal.dataset.index || '0');
        
        if (index < 0 || index >= images.length) return;
        
        const current = images[index];
        imageEl.src = current.url || current;
        imageEl.alt = current.title || `Image ${index + 1}`;
        
        if (captionEl) {
            captionEl.textContent = current.title || current.description || `Image ${index + 1} sur ${images.length}`;
        }
    } catch (e) {
        console.error('Erreur mise à jour photo viewer:', e);
    }
}

function changePhoto(direction) {
    const modal = document.getElementById('photoViewerModal');
    if (!modal) return;
    
    try {
        const images = JSON.parse(modal.dataset.images || '[]');
        let index = parseInt(modal.dataset.index || '0');
        
        index = (index + direction + images.length) % images.length;
        modal.dataset.index = index;
        
        updatePhotoViewer();
    } catch (e) {
        console.error('Erreur changement photo:', e);
    }
}

// ============================================
// CARROUSELS SUPPLÉMENTAIRES
// ============================================

function initializeCarousels() {
    // Carrousel promesses vedette
    const prevBtn = document.getElementById('prevCarousel');
    const nextBtn = document.getElementById('nextCarousel');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            // Implémentation future pour carrousel horizontal
            showNotification('Carrousel en développement', 'info');
        });
        
        nextBtn.addEventListener('click', () => {
            // Implémentation future
            showNotification('Carrousel en développement', 'info');
        });
    }
    
    // Carrousel KPI (optionnel)
    initializeKpiCarousel();
}

function initializeKpiCarousel() {
    // À implémenter selon besoins
}

// ============================================
// FONCTIONS DE FALLBACK (MODE DÉGRADÉ)
// ============================================

function loadPromisesFallback() {
    appState.promises = [
        {
            id: 'fallback-1',
            title: 'Réforme du système éducatif',
            domaine: 'Éducation',
            status: '🔄 En cours',
            date: '2024-04-02',
            deadline: '2026-12-31',
            delayDays: 600,
            resultat: null,
            updates: [
                { date: '2025-01-15', text: 'Lancement du comité de pilotage' },
                { date: '2025-06-20', text: 'Consultation nationale engagée' }
            ],
            rating: 4.2,
            ratingCount: 156
        },
        {
            id: 'fallback-2',
            title: 'Construction de 500 écoles',
            domaine: 'Éducation',
            status: '⏳ Non lancé',
            date: '2024-04-02',
            deadline: '2027-12-31',
            delayDays: 1000,
            resultat: null,
            updates: [],
            rating: 0,
            ratingCount: 0
        },
        {
            id: 'fallback-3',
            title: 'Gratuité des soins pour enfants de moins de 5 ans',
            domaine: 'Santé',
            status: '✅ Réalisé',
            date: '2024-04-02',
            deadline: '2025-06-30',
            delayDays: 0,
            resultat: 'Décret signé le 15 janvier 2025, application effective depuis février 2025',
            updates: [
                { date: '2024-08-10', text: 'Budget alloué voté' },
                { date: '2025-01-15', text: 'Décret de mise en œuvre signé' }
            ],
            rating: 4.8,
            ratingCount: 324
        }
    ];
    
    appState.filteredPromises = [...appState.promises];
    renderStats();
    renderPromises();
    renderFeaturedPromises();
    populateDomainFilter();
    updateResultsCount();
    showNotification('Données de démonstration chargées (hors ligne)', 'warning');
}

function loadNewsFallback() {
    appState.news = [
        {
            id: 'news-1',
            title: 'Lancement officiel du Projet Sénégal',
            source: 'APS',
            date: '2024-04-02',
            excerpt: 'Le président Bassirou Diomaye Faye a lancé officiellement le programme de suivi citoyen...'
        },
        {
            id: 'news-2',
            title: 'Première évaluation des engagements',
            source: 'Sud Quotidien',
            date: '2025-01-15',
            excerpt: 'Une première évaluation citoyenne des 100 premiers jours du programme présidentiel a été publiée...'
        }
    ];
    
    renderNews();
}

function loadPressFallback() {
    appState.pressImages = [
        {
            url: 'https://projetbi.org/placeholder-press.jpg',
            title: 'Édition du 02 février 2026',
            date: '2026-02-02'
        }
    ];
    
    initializePressCarousel();
}

function loadAllFallbackData() {
    loadPromisesFallback();
    loadNewsFallback();
    loadPressFallback();
    showNotification('Mode hors ligne activé avec données de démonstration', 'warning');
}

function enableDegradedMode() {
    // Désactiver fonctionnalités non essentielles
    document.querySelectorAll('.carousel-btn, .btn-export').forEach(el => {
        el.disabled = true;
        el.style.opacity = '0.5';
    });
    
    // Message utilisateur
    const header = document.querySelector('.header-modern');
    if (header) {
        const warning = document.createElement('div');
        warning.className = 'notification notification-warning';
        warning.style.margin = '1rem 0';
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            Mode dégradé : certaines fonctionnalités sont limitées (hors ligne ou blocage réseau)
        `;
        header.parentNode.insertBefore(warning, header);
    }
}

// ============================================
// FONCTIONS D'ASSISTANCE UI
// ============================================

function populateDomainFilter() {
    const select = document.getElementById('domainFilter');
    if (!select || appState.promises.length === 0) return;
    
    // Extraction domaines uniques
    const domaines = [...new Set(appState.promises.map(p => p.domaine))].sort();
    
    // Sauvegarde sélection actuelle
    const current = select.value;
    
    // Reconstruction options
    select.innerHTML = '<option value="all">Tous les domaines</option>';
    domaines.forEach(domaine => {
        const opt = document.createElement('option');
        opt.value = domaine;
        opt.textContent = domaine;
        if (domaine === current) opt.selected = true;
        select.appendChild(opt);
    });
}

function toggleUpdates(card) {
    const updatesList = card.querySelector('.updates-list');
    const btn = card.querySelector('.btn-updates i');
    
    if (!updatesList || !btn) return;
    
    const isVisible = updatesList.style.display === 'block';
    updatesList.style.display = isVisible ? 'none' : 'block';
    btn.className = isVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
}

function initializeScrollTracking() {
    // Barre de progression scroll
    const progress = document.querySelector('.progress-indicator');
    if (!progress) return;
    
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollTop = document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (scrollTop / scrollHeight) * 100;
            progress.style.width = `${scrolled}%`;
        }, 50);
    });
}

function initializeDateDisplay() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = formatDate(new Date());
    }
}

// ============================================
// SÉCURITÉ & TRACKING (OPTIONNEL)
// ============================================

function trackDownload(filename) {
    // À implémenter avec analytics si souhaité
    console.log('Téléchargement:', filename);
}

// Protection XSS basique pour les entrées utilisateur
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ============================================
// INITIALISATION SUPABASE (AVEC GESTION D'ERREURS)
// ============================================

// Vérification présence Supabase
let supabase;
try {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    } else {
        // Fallback CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        script.onload = () => {
            if (window.supabase) {
                supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
                console.log('✓ Supabase chargé via CDN');
            }
        };
        document.head.appendChild(script);
    }
} catch (e) {
    console.warn('Supabase non disponible:', e.message);
    supabase = null;
}

// ============================================
// EXPORT POUR DÉBOGAGE
// ============================================

window.appDebug = {
    state: () => appState,
    reload: loadDataWithFallback,
    clearCache: () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CONFIG.localStoragePrefix)) {
                localStorage.removeItem(key);
            }
        });
        showNotification('Cache vidé avec succès', 'success');
    },
    testNotification: () => showNotification('Test notification système', 'info')
};

console.log('✓ Application JavaScript chargée - Version 2.1.0');
