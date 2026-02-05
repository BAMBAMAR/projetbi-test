// ==========================================
// CONFIGURATION SUPABASE
// ==========================================
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_joJuW7-vMiQG302_2Mvj5A_sVaD8Wap';
let supabaseClient = null;
let DEMO_MODE = false;

// Initialisation Supabase
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase initialisé');
    }
} catch (error) {
    console.error('❌ Erreur Supabase:', error);
    supabaseClient = null;
}

// ==========================================
// CONFIGURATION PRINCIPALE
// ==========================================
const CONFIG = {
    START_DATE: new Date('2024-04-02'),
    END_DATE: new Date('2029-04-02'),
    CURRENT_DATE: new Date(),
    promises: [],
    news: [],
    press: [],
    currentIndex: 0,
    ratings: [],
    visibleCount: 6,
    currentVisible: 6,
    carouselInterval: null,
    carouselIndex: 0,
    carouselAutoPlay: true,
    kpiCarouselIndex: 0,
    kpiAutoPlay: true,
    zoomScale: 1,
    currentRatingPromiseId: null,
    currentRatingValue: 0,
    filteredPromises: [],
    zooming: false,
    dragStartX: 0,
    dragStartY: 0,
    isDragging: false
};

// KPIs pour le carousel
const KPI_ITEMS = [
    { label: 'Total Engagements', value: '0', icon: '📊' },
    { label: '✅ Réalisés', value: '0', icon: '✅' },
    { label: '🔄 En Cours', value: '0', icon: '🔄' },
    { label: '⚠️ En Retard', value: '0', icon: '⚠️' },
    { label: '📈 Taux Réalisation', value: '0%', icon: '📈' },
    { label: '⏱️ Retard moyen', value: '0j', icon: '⏱️' },
    { label: '⭐ Note Moyenne', value: '0.0', icon: '⭐' },
    { label: '📋 Avec MAJ', value: '0', icon: '📋' }
];

// ==========================================
// MENU MOBILE - VERSION CORRIGÉE
// ==========================================
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    let overlay = null;

    // Toggle menu mobile
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('show');
            mobileMenuBtn.classList.toggle('active');
            
            if (navMenu.classList.contains('show')) {
                createMobileOverlay();
            } else {
                removeMobileOverlay();
            }
        });
    }

    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            
            const targetId = href.substring(1);
            const target = document.getElementById(targetId);

            if (target) {
                const offset = 80;
                const targetPosition = target.offsetTop - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                if (navMenu.classList.contains('show')) {
                    navMenu.classList.remove('show');
                    mobileMenuBtn.classList.remove('active');
                    removeMobileOverlay();
                }
            }
        });
    });

    // Overlay pour fermer le menu
    function createMobileOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        overlay.id = 'mobileOverlay';
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', () => {
            navMenu.classList.remove('show');
            mobileMenuBtn.classList.remove('active');
            removeMobileOverlay();
        });
        
        document.body.style.overflow = 'hidden';
    }

    function removeMobileOverlay() {
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
        document.body.style.overflow = '';
    }

    // Active link on scroll
    window.addEventListener('scroll', debounce(() => {
        let current = '';
        const sections = document.querySelectorAll('section[id]');

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, 100));
}

// ==========================================
// FONCTION DEBOUNCE
// ==========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==========================================
// CONVERSION DES DÉLAIS TEXTE EN JOURS
// ==========================================
function parseDelayToDays(delayText) {
    if (!delayText || delayText.trim() === '') return 365;
    const lower = delayText.toLowerCase().trim();

    // Cas spéciaux
    if (lower.includes('immédiat') || lower.includes('immediat') || lower.includes('dès')) {
        return 0;
    }
    if (lower.includes('mandat') || lower.includes('quinquennat')) {
        return 1825;
    }

    let totalDays = 0;

    // Extraction des valeurs
    const yearsMatch = lower.match(/(\d+)\s*an[s]?/i);
    if (yearsMatch) {
        totalDays += parseInt(yearsMatch[1], 10) * 365;
    }

    const monthsMatch = lower.match(/(\d+)\s*mois/i);
    if (monthsMatch) {
        totalDays += parseInt(monthsMatch[1], 10) * 30;
    }

    const daysMatch = lower.match(/(\d+)\s*jour[s]?/i);
    if (daysMatch) {
        totalDays += parseInt(daysMatch[1], 10);
    }

    // Limiter à 5 ans max
    return Math.min(totalDays || 365, 1825);
}

// ==========================================
// CALCULS DE DATES
// ==========================================
function calculateDeadlineFromDays(days) {
    const daysNum = Math.max(0, parseInt(days, 10) || 0);
    const deadline = new Date(CONFIG.START_DATE);
    
    if (daysNum === 0) return deadline;
    
    deadline.setDate(deadline.getDate() + daysNum);
    
    if (deadline > CONFIG.END_DATE) {
        return new Date(CONFIG.END_DATE);
    }
    
    return deadline;
}

function checkIfLate(status, deadline) {
    if (status === 'Réalisé') return false;
    if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) {
        return false;
    }
    return CONFIG.CURRENT_DATE > deadline;
}

function getDaysRemaining(deadline) {
    if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) {
        return 0;
    }
    const diff = deadline.getTime() - CONFIG.CURRENT_DATE.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDaysRemaining(days) {
    if (days > 0) {
        return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
    } else if (days < 0) {
        const absDays = Math.abs(days);
        return `${absDays} jour${absDays > 1 ? 's' : ''} de retard`;
    } else {
        return 'Aujourd\'hui';
    }
}

// ==========================================
// CHARGEMENT DES DONNÉES
// ==========================================
async function loadData() {
    try {
        await Promise.all([
            loadPromisesData(),
            loadPressData(),
            loadNewsData()
        ]);
        
        setTimeout(() => {
            fetchAndDisplayPublicVotes().catch(console.warn);
        }, 1000);
        
        renderAll();
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showNotification('Erreur de chargement des données', 'error');
        CONFIG.promises = generateTestPromises();
        renderAll();
    }
}

async function loadPromisesData() {
    try {
        const response = await fetch('promises.json');
        if (!response.ok) {
            CONFIG.promises = generateTestPromises();
            return;
        }
        
        const data = await response.json();
        
        if (data.start_date) {
            CONFIG.START_DATE = new Date(data.start_date);
            CONFIG.END_DATE = new Date(CONFIG.START_DATE);
            CONFIG.END_DATE.setFullYear(CONFIG.END_DATE.getFullYear() + 5);
        }
        
        CONFIG.promises = (data.promises || []).map(p => {
            // Normaliser statut
            let status = 'Non lancé';
            if (p.status) {
                const statusLower = p.status.toLowerCase();
                if (statusLower.includes('realise') || statusLower.includes('réalisé')) {
                    status = 'Réalisé';
                } else if (statusLower.includes('cours') || statusLower.includes('encours')) {
                    status = 'En cours';
                } else if (statusLower.includes('retard')) {
                    status = 'En retard';
                }
            }
            
            // Convertir délai
            const delayText = p.delai || '12 premiers mois';
            const delayDays = parseDelayToDays(delayText);
            
            // Calculer deadline
            const deadline = calculateDeadlineFromDays(delayDays);
            const isLate = checkIfLate(status, deadline);
            
            // Mises à jour
            const updates = (p.mises_a_jour || []).map(update => ({
                date: update.date || '',
                description: update.text || update.description || 'Mise à jour'
            }));
            
            return {
                id: p.id || Math.random().toString(36).substr(2, 9),
                engagement: p.engagement || p.titre || 'Engagement non spécifié',
                domain: p.domaine || p.domain || p.categorie || 'Autre',
                status: status,
                delai: delayDays.toString(),
                delai_texte: delayText,
                resultat: p.resultat || p.objectif || 'Résultats non spécifiés',
                updates: updates,
                deadline: deadline,
                isLate: isLate,
                publicAvg: 0,
                publicCount: 0
            };
        });
        
        // Trier
        CONFIG.promises.sort((a, b) => {
            if (a.isLate && !b.isLate) return -1;
            if (!a.isLate && b.isLate) return 1;
            return a.deadline - b.deadline;
        });
        
    } catch (error) {
        console.error('❌ Erreur promesses:', error);
        CONFIG.promises = generateTestPromises();
    }
}

async function loadPressData() {
    try {
        const response = await fetch('press.json?v=' + Date.now());
        if (!response.ok) {
            CONFIG.press = getDefaultPressData();
            return;
        }
        
        const pressData = await response.json();
        
        if (pressData && Array.isArray(pressData.press)) {
            CONFIG.press = pressData.press.sort((a, b) => {
                try {
                    const dateA = new Date(a.date.split('/').reverse().join('-'));
                    const dateB = new Date(b.date.split('/').reverse().join('-'));
                    return dateB - dateA;
                } catch {
                    return 0;
                }
            });
        } else {
            CONFIG.press = getDefaultPressData();
        }
        
    } catch (error) {
        console.error('❌ Erreur presse:', error);
        CONFIG.press = getDefaultPressData();
    }
}

async function loadNewsData() {
    try {
        const response = await fetch('news.json?v=' + Date.now());
        if (!response.ok) {
            CONFIG.news = getDefaultNewsData();
            return;
        }
        
        const newsData = await response.json();
        
        if (newsData && Array.isArray(newsData.news)) {
            CONFIG.news = newsData.news;
        } else {
            CONFIG.news = getDefaultNewsData();
        }
        
    } catch (error) {
        console.error('❌ Erreur actualités:', error);
        CONFIG.news = getDefaultNewsData();
    }
}

// Données par défaut
function getDefaultPressData() {
    return [
        { id: '1', title: 'Le Soleil', date: '28/01/2026', image: 'https://picsum.photos/seed/soleil/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6d/Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg/200px-Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg.png' },
        { id: '2', title: 'Sud Quotidien', date: '28/01/2026', image: 'https://picsum.photos/seed/sud/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5b/Sud_Quotidien_logo.svg/200px-Sud_Quotidien_logo.svg.png' },
        { id: '3', title: 'Libération', date: '28/01/2026', image: 'https://picsum.photos/seed/liberation/400/533', logo: 'iconeliberation.jpg' },
        { id: '4', title: 'L\'Observateur', date: '28/01/2026', image: 'https://picsum.photos/seed/observateur/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/L%27Observateur_logo.svg/200px-L%27Observateur_logo.svg.png' },
        { id: '5', title: 'Le Quotidien', date: '28/01/2026', image: 'https://picsum.photos/seed/quotidien/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3c/Le_Quotidien_logo.svg/200px-Le_Quotidien_logo.svg.png' },
        { id: '6', title: 'WalFadjri', date: '28/01/2026', image: 'https://picsum.photos/seed/walfadjri/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7c/Walf_fadjri_logo.svg/200px-Walf_fadjri_logo.svg.png' }
    ];
}

function getDefaultNewsData() {
    return [
        { 
            id: '1', 
            title: 'Lancement officiel de la plateforme', 
            excerpt: 'La plateforme citoyenne de suivi des engagements est désormais opérationnelle.', 
            date: '25/01/2026', 
            source: 'Le Soleil', 
            image: 'school' 
        },
        { 
            id: '2', 
            title: 'Première école numérique inaugurée', 
            excerpt: 'Le gouvernement a inauguré la première école entièrement numérique à Dakar.', 
            date: '20/01/2026', 
            source: 'Sud Quotidien', 
            image: 'school' 
        },
        { 
            id: '3', 
            title: 'Budget 2026 axé sur la relance économique', 
            excerpt: 'Le budget de l\'État pour 2026 prévoit d\'importants investissements dans les infrastructures.', 
            date: '15/01/2026', 
            source: 'WalFadjri', 
            image: 'money' 
        }
    ];
}

function generateTestPromises() {
    return [
        {
            id: 'promise_1',
            domaine: 'Lutte Corruption',
            engagement: 'Loi de protection des lanceurs d\'alerte',
            resultat: 'Encouragement dénonciation civique',
            delai: '3 premières années',
            status: 'realise',
            mises_a_jour: [
                {
                    date: '26/08/2025',
                    text: 'Loi adoptée par l\'Assemblée nationale'
                }
            ]
        },
        {
            id: 'promise_2',
            domaine: 'Éducation',
            engagement: 'Construction de 100 nouvelles écoles',
            resultat: 'Amélioration accès éducation',
            delai: '5 ans',
            status: 'en cours',
            mises_a_jour: [
                {
                    date: '15/10/2025',
                    text: '30 écoles déjà construites, 50 en construction'
                }
            ]
        },
        {
            id: 'promise_3',
            domaine: 'Santé',
            engagement: 'Couverture Santé Universelle',
            resultat: 'Soins accessibles à tous',
            delai: '2 premières années',
            status: 'en retard',
            mises_a_jour: []
        }
    ].map(p => {
        const delayDays = parseDelayToDays(p.delai);
        const deadline = calculateDeadlineFromDays(delayDays);
        const status = p.status === 'realise' ? 'Réalisé' :
                      p.status === 'en cours' ? 'En cours' :
                      p.status === 'en retard' ? 'En retard' : 'Non lancé';
        const isLate = checkIfLate(status, deadline);
        
        return {
            id: p.id,
            engagement: p.engagement,
            domain: p.domaine || 'Autre',
            status: status,
            delai: delayDays.toString(),
            delai_texte: p.delai,
            resultat: p.resultat,
            updates: (p.mises_a_jour || []).map(update => ({
                date: update.date,
                description: update.text
            })),
            deadline: deadline,
            isLate: isLate,
            publicAvg: 0,
            publicCount: 0
        };
    });
}

// ==========================================
// FONCTIONS UTILITAIRES LOCALSTORAGE
// ==========================================
function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn('⚠️ localStorage:', error.message);
        window.tempStorage = window.tempStorage || {};
        window.tempStorage[key] = value;
        return false;
    }
}

function safeGetItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('⚠️ localStorage:', error.message);
        if (window.tempStorage && window.tempStorage[key]) {
            return window.tempStorage[key];
        }
        return defaultValue;
    }
}

// ==========================================
// INITIALISATIONS
// ==========================================
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    const scrollToTop = document.getElementById('scrollToTop');
    const progressIndicator = document.getElementById('progressIndicator');
    
    window.addEventListener('scroll', () => {
        if (navbar && window.scrollY > 50) navbar.classList.add('scrolled');
        else if (navbar) navbar.classList.remove('scrolled');

        if (scrollToTop) scrollToTop.classList.toggle('visible', window.scrollY > 400);

        if (progressIndicator) {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            progressIndicator.style.width = `${scrolled}%`;
        }
    });

    if (scrollToTop) {
        scrollToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function initDateDisplay() {
    const currentDateEl = document.getElementById('current-date');
    if (currentDateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        currentDateEl.textContent = today.toLocaleDateString('fr-FR', options);
    }
}

function initFilters() {
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filtersSection = document.getElementById('filtersSection');
    const filterStatus = document.getElementById('filter-status');
    const filterDomain = document.getElementById('filter-domain');
    const filterSearch = document.getElementById('filter-search');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (filterToggleBtn && filtersSection) {
        filterToggleBtn.addEventListener('click', () => {
            filtersSection.classList.toggle('active');
        });
    }

    if (filterStatus) {
        filterStatus.addEventListener('change', applyFilters);
    }

    if (filterDomain) {
        filterDomain.addEventListener('change', applyFilters);
    }

    if (filterSearch) {
        filterSearch.addEventListener('input', debounce(applyFilters, 300));
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            CONFIG.currentVisible = CONFIG.filteredPromises.length;
            renderPromises(CONFIG.filteredPromises);
            showMoreBtn.style.display = 'none';
            if (showLessBtn) showLessBtn.style.display = 'inline-flex';
        });
    }

    if (showLessBtn) {
        showLessBtn.addEventListener('click', () => {
            CONFIG.currentVisible = CONFIG.visibleCount;
            renderPromises(CONFIG.filteredPromises.slice(0, CONFIG.currentVisible));
            showLessBtn.style.display = 'none';
            if (showMoreBtn) showMoreBtn.style.display = 'inline-flex';
        });
        showLessBtn.style.display = 'none';
    }

    populateDomainFilter();
}

function populateDomainFilter() {
    const filterDomain = document.getElementById('filter-domain');
    if (!filterDomain) return;
    
    const domains = [...new Set(CONFIG.promises.map(p => p.domain || 'Autre'))]
        .filter(d => d !== 'Autre')
        .sort();
    
    filterDomain.innerHTML = '<option value="">Tous les domaines</option>' +
        domains.map(domain => `<option value="${domain}">${domain}</option>`).join('') +
        '<option value="Autre">Autre</option>';
}

// ==========================================
// FILTRES
// ==========================================
function applyFilters() {
    const filterStatus = document.getElementById('filter-status')?.value || '';
    const filterDomain = document.getElementById('filter-domain')?.value || '';
    const filterSearch = document.getElementById('filter-search')?.value.toLowerCase() || '';
    
    let filtered = CONFIG.promises;

    // Filtre statut
    if (filterStatus) {
        if (filterStatus === '⚠️ En retard') {
            filtered = filtered.filter(p => p.isLate);
        } else if (filterStatus === '✅ Réalisé') {
            filtered = filtered.filter(p => p.status === 'Réalisé' && !p.isLate);
        } else if (filterStatus === '🔄 En cours') {
            filtered = filtered.filter(p => p.status === 'En cours' && !p.isLate);
        } else if (filterStatus === '⏳ Non lancé') {
            filtered = filtered.filter(p => p.status === 'Non lancé' && !p.isLate);
        }
    }

    // Filtre domaine
    if (filterDomain && filterDomain !== '') {
        filtered = filtered.filter(p => p.domain === filterDomain);
    }

    // Filtre recherche
    if (filterSearch) {
        filtered = filtered.filter(p => 
            p.engagement.toLowerCase().includes(filterSearch) ||
            (p.domain || '').toLowerCase().includes(filterSearch) ||
            (p.resultat || '').toLowerCase().includes(filterSearch)
        );
    }

    CONFIG.filteredPromises = filtered;
    updateFilteredDisplay();
}

function resetFilters() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-domain').value = '';
    document.getElementById('filter-search').value = '';
    
    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = CONFIG.visibleCount;
    
    renderPromises(CONFIG.promises.slice(0, CONFIG.currentVisible));
    updateResultsCount(CONFIG.promises.length);
}

function updateFilteredDisplay() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (CONFIG.filteredPromises.length > CONFIG.visibleCount) {
        CONFIG.currentVisible = CONFIG.visibleCount;
        if (showMoreBtn) showMoreBtn.style.display = 'inline-flex';
        if (showLessBtn) showLessBtn.style.display = 'none';
    } else {
        CONFIG.currentVisible = CONFIG.filteredPromises.length;
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        if (showLessBtn) showLessBtn.style.display = 'none';
    }

    renderPromises(CONFIG.filteredPromises.slice(0, CONFIG.currentVisible));
    updateResultsCount(CONFIG.filteredPromises.length);
}

function updateResultsCount(count) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `${count} engagement(s) trouvé(s)`;
    }
}

// ==========================================
// RENDERING
// ==========================================
function renderAll() {
    if (!CONFIG.filteredPromises || CONFIG.filteredPromises.length === 0) {
        CONFIG.filteredPromises = [...CONFIG.promises];
    }

    updateStats();
    
    const initialCount = Math.min(CONFIG.visibleCount, CONFIG.filteredPromises.length);
    renderPromises(CONFIG.filteredPromises.slice(0, initialCount));
    
    updateResultsCount(CONFIG.filteredPromises.length);
    populateDomainFilter();
    
    // Initialiser les autres composants
    setupDailyPromise();
    setupPromisesCarousel();
    setupPressCarousel();
    setupKpiCarousel();
    setupServiceRatings();
    renderNews(CONFIG.news);
    renderNewspapers();
}

function renderPromises(promises) {
    const grid = document.getElementById('promisesGrid');
    if (!grid) return;
    
    if (!promises || promises.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <p><i class="fas fa-search"></i> Aucun engagement trouvé avec ces critères.</p>
                <button class="btn-updates" onclick="resetFilters()" style="margin-top: 1rem;">
                    <i class="fas fa-redo"></i> Réinitialiser les filtres
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = promises.map(promise => {
        const statusClass = getStatusClass(promise);
        const statusIcon = getStatusIcon(promise);
        const daysRemaining = getDaysRemaining(promise.deadline);
        
        return `
            <div class="promise-card ${statusClass}" data-id="${promise.id}">
                <div class="promise-header">
                    <span class="promise-status">
                        ${statusIcon} ${getStatusText(promise)}
                    </span>
                    <span class="promise-domain">${promise.domain || 'Non spécifié'}</span>
                </div>
                <h3 class="promise-title">${promise.engagement}</h3>
                
                <div class="promise-result">
                    <strong><i class="fas fa-bullseye"></i> Résultat attendu :</strong>
                    <p>${promise.resultat || 'Non spécifié'}</p>
                </div>
                
                <div class="promise-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(promise.deadline)}</span>
                    <span><i class="fas fa-clock"></i> ${formatDaysRemaining(daysRemaining)}</span>
                </div>
                
                ${promise.updates && promise.updates.length > 0 ? `
                    <div class="promise-updates">
                        <button class="btn-updates" onclick="toggleUpdates('${promise.id}')">
                            <i class="fas fa-info-circle"></i>
                            ${promise.updates.length} mise(s) à jour
                        </button>
                        <div class="updates-list" id="updates-${promise.id}" style="display: none;">
                            ${promise.updates.map(update => `
                                <div class="update-item">
                                    <div class="update-date">${formatDateProper(update.date || '')}</div>
                                    <div class="update-text">${update.description || 'Mise à jour'}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="promise-actions">
                    <div class="social-share">
                        <button class="social-btn fb" onclick="shareToPlatform('${promise.id}', 'facebook')" title="Partager sur Facebook">
                            <i class="fab fa-facebook-f"></i>
                        </button>
                        <button class="social-btn tw" onclick="shareToPlatform('${promise.id}', 'twitter')" title="Partager sur Twitter">
                            <i class="fab fa-twitter"></i>
                        </button>
                        <button class="social-btn wa" onclick="shareToPlatform('${promise.id}', 'whatsapp')" title="Partager sur WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                    <button class="btn-stars" onclick="showRatingModal('${promise.id}')" title="Noter cette promesse">
                        <i class="fas fa-star"></i> Noter
                    </button>
                </div>
                
                ${promise.publicCount > 0 ? `
                    <div class="promise-rating">
                        <span class="rating-value">${promise.publicAvg.toFixed(1)}</span>
                        <div class="rating-stars">
                            ${generateStars(promise.publicAvg)}
                        </div>
                        <span class="rating-count">(${promise.publicCount} vote${promise.publicCount > 1 ? 's' : ''})</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getStatusClass(promise) {
    if (promise.isLate) return 'status-late';
    if (promise.status.includes('Réalisé')) return 'status-realise';
    if (promise.status.includes('cours')) return 'status-encours';
    return 'status-non-lance';
}

function getStatusIcon(promise) {
    if (promise.isLate) return '⚠️';
    if (promise.status.includes('Réalisé')) return '✅';
    if (promise.status.includes('cours')) return '🔄';
    return '⏳';
}

function getStatusText(promise) {
    if (promise.isLate) return 'En retard';
    return promise.status;
}

function formatDate(dateInput) {
    if (!dateInput) return 'Date inconnue';
    
    let date;
    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
    } else {
        return 'Date inconnue';
    }

    if (isNaN(date.getTime())) return 'Date inconnue';

    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateProper(dateInput) {
    if (!dateInput) return 'Pas de date';
    try {
        const parts = dateInput.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            }
        }
        
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        
        return dateInput;
    } catch (error) {
        return dateInput;
    }
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '⭐';
    if (hasHalfStar) stars += '⭐';
    for (let i = 0; i < emptyStars; i++) stars += '☆';
    return stars;
}

// ==========================================
// STATISTIQUES
// ==========================================
function updateStats() {
    const total = CONFIG.promises.length;
    
    const realise = CONFIG.promises.filter(p => p.status === 'Réalisé' && !p.isLate).length;
    const encours = CONFIG.promises.filter(p => p.status === 'En cours' && !p.isLate).length;
    const nonLance = CONFIG.promises.filter(p => p.status === 'Non lancé' && !p.isLate).length;
    const retard = CONFIG.promises.filter(p => p.isLate).length;
    const withUpdates = CONFIG.promises.filter(p => p.updates && p.updates.length > 0).length;
    const tauxRealisation = total > 0 ? Math.round((realise / total) * 100) : 0;

    // Calcul retard moyen
    const promisesEnRetard = CONFIG.promises.filter(p => p.isLate);
    let avgRetard = 0;
    if (promisesEnRetard.length > 0) {
        const totalRetard = promisesEnRetard.reduce((sum, p) => {
            const daysRemaining = getDaysRemaining(p.deadline);
            return sum + Math.abs(daysRemaining);
        }, 0);
        avgRetard = Math.round(totalRetard / promisesEnRetard.length);
    }

    // Note moyenne
    const allRatings = CONFIG.promises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    const totalVotes = allRatings.reduce((sum, p) => sum + p.publicCount, 0);

    // Mise à jour KPIs
    KPI_ITEMS[0].value = total;
    KPI_ITEMS[1].value = realise;
    KPI_ITEMS[2].value = encours;
    KPI_ITEMS[3].value = retard;
    KPI_ITEMS[4].value = `${tauxRealisation}%`;
    KPI_ITEMS[5].value = retard > 0 ? `${avgRetard}j` : 'N/A';
    KPI_ITEMS[6].value = avgRating;
    KPI_ITEMS[7].value = withUpdates;

    // Mise à jour statistiques
    updateStatValue('total', total);
    updateStatValue('realise', realise);
    updateStatValue('encours', encours);
    updateStatValue('non-lance', nonLance);
    updateStatValue('retard', retard);
    updateStatValue('avec-maj', withUpdates);
    updateStatValue('taux-realisation', `${tauxRealisation}%`);
    updateStatValue('moyenne-notes', avgRating);
    updateStatValue('votes-total', `${totalVotes.toLocaleString('fr-FR')} votes`);
    
    if (retard > 0) {
        updateStatValue('delai-moyen', `${avgRetard}j`);
    } else {
        updateStatValue('delai-moyen', 'N/A');
    }

    updateStatPercentage('total-percentage', total, total);
    updateStatPercentage('realise-percentage', realise, total);
    updateStatPercentage('encours-percentage', encours, total);
    updateStatPercentage('non-lance-percentage', nonLance, total);
    updateStatPercentage('retard-percentage', retard, total);
    updateStatPercentage('avec-maj-percentage', withUpdates, total);

    // Domaine principal
    const domains = CONFIG.promises.reduce((acc, p) => {
        const domain = p.domain || 'Autre';
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
    }, {});

    if (Object.keys(domains).length > 0) {
        const principalDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
        updateStatValue('domaine-principal', principalDomain[0]);
        updateStatValue('domaine-count', `${principalDomain[1]} engagements`);
    } else {
        updateStatValue('domaine-principal', 'Non spécifié');
        updateStatValue('domaine-count', '0 engagements');
    }
}

function updateStatValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '0';
}

function updateStatPercentage(id, value, total) {
    const el = document.getElementById(id);
    if (el && total > 0) {
        const percentage = Math.round((value / total) * 100);
        el.textContent = `${percentage}%`;
    } else {
        el.textContent = '0%';
    }
}

// ==========================================
// PROMESSE DU JOUR
// ==========================================
function setupDailyPromise() {
    const promisesWithDetails = CONFIG.promises.filter(p => p.engagement && p.resultat && p.delai);
    if (promisesWithDetails.length === 0) return;

    const today = new Date().getDate();
    const promiseIndex = today % promisesWithDetails.length;
    const promise = promisesWithDetails[promiseIndex];

    const dailyPromiseCard = document.getElementById('dailyPromise');
    if (!dailyPromiseCard) return;

    const daysRemaining = getDaysRemaining(promise.deadline);
    const statusClass = promise.isLate ? 'status-late' : 
                       promise.status === 'Réalisé' ? 'status-realise' :
                       promise.status === 'En cours' ? 'status-encours' : 'status-non-lance';

    const statusIcon = promise.isLate ? '⚠️' :
                      promise.status === 'Réalisé' ? '✅' :
                      promise.status === 'En cours' ? '🔄' : '⏳';

    dailyPromiseCard.innerHTML = `
        <div class="daily-newspaper-header">
            <div class="newspaper-badge">
                <i class="fas fa-newspaper"></i>
                PROMESSE DU JOUR
            </div>
            <div class="newspaper-date">
                <i class="fas fa-calendar"></i>
                ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
        </div>
        
        <div class="daily-newspaper-article">
            <h2 class="article-title">${promise.engagement}</h2>
            
            <div class="article-meta">
                <span class="article-domain">
                    <i class="fas fa-building"></i> ${promise.domain || 'Non spécifié'}
                </span>
                <span class="article-status ${statusClass}">
                    ${statusIcon} ${promise.isLate ? 'En retard' : promise.status}
                </span>
            </div>
            
            <div class="article-content">
                <p class="article-lead">
                    <strong><i class="fas fa-quote-left"></i></strong>
                    ${promise.engagement}
                    <strong><i class="fas fa-quote-right"></i></strong>
                </p>
                
                <div class="article-section">
                    <h3><i class="fas fa-bullseye"></i> Résultats attendus</h3>
                    <p>${promise.resultat || 'Aucun résultat spécifié'}</p>
                </div>
                
                <div class="article-section">
                    <h3><i class="fas fa-clock"></i> Délai de réalisation</h3>
                    <div class="deadline-grid">
                        <div class="deadline-item">
                            <span class="deadline-label">Délai initial :</span>
                            <span class="deadline-value">${promise.delai_texte || promise.delai + ' jours'}</span>
                        </div>
                        <div class="deadline-item">
                            <span class="deadline-label">Date limite :</span>
                            <span class="deadline-value">${formatDate(promise.deadline)}</span>
                        </div>
                        <div class="deadline-item">
                            <span class="deadline-label">Temps restant :</span>
                            <span class="deadline-value ${daysRemaining < 0 ? 'late' : ''}">
                                ${formatDaysRemaining(daysRemaining)}
                            </span>
                        </div>
                    </div>
                </div>
                
                ${promise.updates && promise.updates.length > 0 ? `
                    <div class="article-section updates-section">
                        <h3><i class="fas fa-history"></i> Dernières mises à jour</h3>
                        ${promise.updates.slice(0, 3).map(update => `
                            <div class="update-item-small">
                                <div class="update-date-small">${formatDateProper(update.date || '')}</div>
                                <div class="update-text-small">${update.description || 'Mise à jour'}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="article-footer">
                <button class="btn-article-primary" onclick="sharePromise('${promise.id}')">
                    <i class="fas fa-share-alt"></i> Partager cette promesse
                </button>
                <button class="btn-article-secondary" onclick="showRatingModal('${promise.id}')">
                    <i class="fas fa-star"></i> Noter
                </button>
            </div>
        </div>
    `;
}

// ==========================================
// CAROUSELS
// ==========================================
function setupPromisesCarousel() {
    const carouselGrid = document.getElementById('promisesCarouselGrid');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    const autoPlayToggle = document.getElementById('carouselAutoPlayToggle');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!carouselGrid) return;

    const carouselPromises = CONFIG.promises.slice(0, 6);
    let currentSlide = 0;

    function renderCarousel() {
        const itemsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
        const totalSlides = Math.ceil(carouselPromises.length / itemsPerSlide);
        
        const startIdx = currentSlide * itemsPerSlide;
        const visiblePromises = carouselPromises.slice(startIdx, startIdx + itemsPerSlide);
        
        carouselGrid.innerHTML = visiblePromises.map((promise, index) => {
            const statusClass = getStatusClass(promise);
            const statusIcon = getStatusIcon(promise);
            const daysRemaining = getDaysRemaining(promise.deadline);
            
            return `
                <div class="carousel-promise-card ${statusClass}" onclick="goToPromiseSection('${promise.id}')">
                    <div class="promise-card-header">
                        <span class="promise-status">${statusIcon} ${promise.isLate ? 'En retard' : promise.status}</span>
                        <span class="promise-domain">${promise.domain || 'Non spécifié'}</span>
                    </div>
                    <h4 class="promise-card-title">${promise.engagement.substring(0, 80)}${promise.engagement.length > 80 ? '...' : ''}</h4>
                    <div class="promise-card-meta">
                        <span><i class="fas fa-calendar"></i> ${formatDate(promise.deadline)}</span>
                        <span><i class="fas fa-clock"></i> ${formatDaysRemaining(daysRemaining)}</span>
                    </div>
                    ${promise.publicCount > 0 ? `
                        <div class="promise-card-rating">
                            <i class="fas fa-star"></i> ${promise.publicAvg.toFixed(1)} (${promise.publicCount})
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        if (dotsContainer) {
            dotsContainer.innerHTML = Array.from({length: totalSlides}, (_, i) => 
                `<button class="carousel-dot ${i === currentSlide ? 'active' : ''}" onclick="goToCarouselSlide(${i})"></button>`
            ).join('');
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const itemsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
            const totalSlides = Math.ceil(carouselPromises.length / itemsPerSlide);
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            renderCarousel();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const itemsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
            const totalSlides = Math.ceil(carouselPromises.length / itemsPerSlide);
            currentSlide = (currentSlide + 1) % totalSlides;
            renderCarousel();
        });
    }

    if (autoPlayToggle) {
        autoPlayToggle.addEventListener('click', () => {
            CONFIG.carouselAutoPlay = !CONFIG.carouselAutoPlay;
            autoPlayToggle.innerHTML = CONFIG.carouselAutoPlay ? 
                '<i class="fas fa-pause"></i>' : 
                '<i class="fas fa-play"></i>';
        });
    }

    let carouselInterval;
    function startCarousel() {
        if (carouselInterval) clearInterval(carouselInterval);
        carouselInterval = setInterval(() => {
            if (CONFIG.carouselAutoPlay) {
                const itemsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
                const totalSlides = Math.ceil(carouselPromises.length / itemsPerSlide);
                currentSlide = (currentSlide + 1) % totalSlides;
                renderCarousel();
            }
        }, 5000);
    }

    startCarousel();
    renderCarousel();

    window.addEventListener('resize', () => {
        renderCarousel();
    });
}

function goToCarouselSlide(index) {
    const carouselPromises = CONFIG.promises.slice(0, 6);
    const itemsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    const totalSlides = Math.ceil(carouselPromises.length / itemsPerSlide);
    if (index >= 0 && index < totalSlides) {
        setupPromisesCarousel();
    }
}

function goToPromiseSection(promiseId) {
    const promisesSection = document.getElementById('promises');
    if (promisesSection) {
        const offset = 80;
        const targetPosition = promisesSection.offsetTop - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            const card = document.querySelector(`.promise-card[data-id="${promiseId}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                card.style.boxShadow = '0 0 0 3px var(--primary)';
                setTimeout(() => { card.style.boxShadow = ''; }, 3000);
            }
        }, 500);
    }
}

// ==========================================
// PRESSE CAROUSEL
// ==========================================
async function setupPressCarousel() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!prevBtn || !nextBtn || !indicators) return;

    if (CONFIG.press.length === 0) {
        document.getElementById('pressCarousel').innerHTML = `
            <div class="loading-state">
                <p><i class="fas fa-newspaper"></i> Aucun journal disponible</p>
            </div>
        `;
        return;
    }

    prevBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
        CONFIG.zoomScale = 1;
        renderPressCarousel();
    });

    nextBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
        CONFIG.zoomScale = 1;
        renderPressCarousel();
    });

    if (autoPlayToggle) {
        autoPlayToggle.addEventListener('click', () => {
            CONFIG.carouselAutoPlay = !CONFIG.carouselAutoPlay;
            autoPlayToggle.innerHTML = CONFIG.carouselAutoPlay ? 
                '<i class="fas fa-pause"></i> Pause' : 
                '<i class="fas fa-play"></i> Lecture auto';
            
            if (CONFIG.carouselAutoPlay) startCarouselAutoPlay();
            else stopCarouselAutoPlay();
        });
    }

    renderPressCarousel();
    startCarouselAutoPlay();
    
    // Indicators
    indicators.innerHTML = CONFIG.press.map((_, i) => 
        `<button class="indicator ${i === CONFIG.currentIndex ? 'active' : ''}" onclick="goToSlide(${i})"></button>`
    ).join('');
}

function startCarouselAutoPlay() {
    stopCarouselAutoPlay();
    CONFIG.carouselInterval = setInterval(() => {
        if (CONFIG.carouselAutoPlay) {
            CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
            CONFIG.zoomScale = 1;
            renderPressCarousel();
        }
    }, 10000);
}

function stopCarouselAutoPlay() {
    if (CONFIG.carouselInterval) {
        clearInterval(CONFIG.carouselInterval);
        CONFIG.carouselInterval = null;
    }
}

function renderPressCarousel() {
    const carousel = document.getElementById('pressCarousel');
    const indicators = document.getElementById('carouselIndicators');
    if (!carousel || !indicators) return;
    
    const currentPaper = CONFIG.press[CONFIG.currentIndex];
    let imageUrl = currentPaper.image;
    if (imageUrl.includes('picsum.photos')) {
        imageUrl = imageUrl.replace('/400/533', '/700/933');
    }

    carousel.innerHTML = `
        <div class="carousel-item active">
            <div class="carousel-image-container">
                <img src="${imageUrl}" alt="${currentPaper.title}" 
                    onerror="this.onerror=null; this.src='https://picsum.photos/700/933?random=${CONFIG.currentIndex}'"
                    id="pressImage"
                    style="transform: scale(${CONFIG.zoomScale})">
            </div>
            <div class="carousel-overlay">
                <div class="carousel-info">
                    <h3 class="carousel-title">${currentPaper.title}</h3>
                    <div class="carousel-date">${currentPaper.date}</div>
                </div>
            </div>
        </div>
    `;

    const indicatorBtns = indicators.querySelectorAll('.indicator');
    indicatorBtns.forEach((btn, index) => {
        btn.classList.toggle('active', index === CONFIG.currentIndex);
    });
}

function togglePressZoom(action) {
    const pressImage = document.getElementById('pressImage');
    if (!pressImage) return;
    
    switch(action) {
        case 'in':
            CONFIG.zoomScale = Math.min(CONFIG.zoomScale + 0.2, 3);
            break;
        case 'out':
            CONFIG.zoomScale = Math.max(CONFIG.zoomScale - 0.2, 1);
            break;
        case 'reset':
            CONFIG.zoomScale = 1;
            break;
    }

    pressImage.style.transform = `scale(${CONFIG.zoomScale})`;
    document.querySelector('.carousel-zoom-info').textContent = `${Math.round(CONFIG.zoomScale * 100)}%`;
}

function goToSlide(index) {
    CONFIG.currentIndex = index;
    CONFIG.zoomScale = 1;
    renderPressCarousel();
}

// ==========================================
// KPI CAROUSEL
// ==========================================
function setupKpiCarousel() {
    const kpiCarousel = document.getElementById('kpiCarousel');
    const kpiPrev = document.getElementById('kpiPrev');
    const kpiNext = document.getElementById('kpiNext');
    
    if (!kpiCarousel) return;

    renderKpiItem();

    if (kpiPrev) {
        kpiPrev.addEventListener('click', () => {
            CONFIG.kpiCarouselIndex = (CONFIG.kpiCarouselIndex - 1 + KPI_ITEMS.length) % KPI_ITEMS.length;
            renderKpiItem();
        });
    }

    if (kpiNext) {
        kpiNext.addEventListener('click', () => {
            CONFIG.kpiCarouselIndex = (CONFIG.kpiCarouselIndex + 1) % KPI_ITEMS.length;
            renderKpiItem();
        });
    }

    startKpiAutoPlay();
}

function renderKpiItem() {
    const kpiCarousel = document.getElementById('kpiCarousel');
    if (!kpiCarousel) return;
    
    const currentItem = KPI_ITEMS[CONFIG.kpiCarouselIndex];
    kpiCarousel.innerHTML = `
        <div class="kpi-item">
            <span class="kpi-icon">${currentItem.icon}</span>
            <div class="kpi-content">
                <span class="kpi-value">${currentItem.value}</span>
                <span class="kpi-label">${currentItem.label}</span>
            </div>
        </div>
    `;
}

function startKpiAutoPlay() {
    setInterval(() => {
        if (CONFIG.kpiAutoPlay) {
            CONFIG.kpiCarouselIndex = (CONFIG.kpiCarouselIndex + 1) % KPI_ITEMS.length;
            renderKpiItem();
        }
    }, 3000);
}

// ==========================================
// ACTUALITÉS
// ==========================================
function renderNews(news) {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    
    grid.innerHTML = news.map(item => `
        <article class="news-card">
            <div class="news-image">
                <i class="fas fa-${item.image === 'school' ? 'school' : item.image === 'budget' ? 'coins' : 'flag'} fa-3x"></i>
            </div>
            <div class="news-content">
                <h3>${item.title}</h3>
                <p>${item.excerpt}</p>
                <div class="news-footer">
                    <span><i class="fas fa-calendar"></i> ${item.date}</span>
                    <span><i class="fas fa-newspaper"></i> ${item.source}</span>
                </div>
            </div>
        </article>
    `).join('');
}

// ==========================================
// JOURNAUX
// ==========================================
function renderNewspapers() {
    const grid = document.getElementById('newspapersGrid');
    if (!grid) return;
    
    grid.innerHTML = CONFIG.press.map(paper => `
        <div class="newspaper-card">
            <div class="newspaper-preview">
                <img src="${paper.image}" alt="${paper.title}" 
                    onerror="this.onerror=null; this.src='https://picsum.photos/400/533?random=${paper.id}'">
            </div>
            <h4>${paper.title}</h4>
            <p class="newspaper-date">${paper.date}</p>
        </div>
    `).join('');
}

// ==========================================
// NOTATION DES SERVICES
// ==========================================
function setupServiceRatings() {
    const form = document.getElementById('ratingForm');
    if (!form) return;

    initStarRatings();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const service = document.getElementById('service').value;
        const accessibility = document.getElementById('accessibility').value;
        const welcome = document.getElementById('welcome').value;
        const efficiency = document.getElementById('efficiency').value;
        const transparency = document.getElementById('transparency').value;
        const comment = document.getElementById('comment').value.trim();
        
        if (!service) {
            showNotification('Veuillez sélectionner un service', 'error');
            return;
        }
        
        const ratingData = {
            service: service,
            accessibility: parseInt(accessibility) || 0,
            welcome: parseInt(welcome) || 0,
            efficiency: parseInt(efficiency) || 0,
            transparency: parseInt(transparency) || 0,
            comment: comment,
            date: new Date().toISOString()
        };
        
        saveRatingLocally(ratingData);
        const success = await saveRatingToSupabase(ratingData);
        
        if (success) {
            showNotification('Merci pour votre notation !', 'success');
            form.reset();
            resetStars();
            setTimeout(() => fetchAndDisplayServiceRatings(), 1000);
        } else {
            showNotification('Notation enregistrée en local', 'info');
        }
    });

    fetchAndDisplayServiceRatings();
}

function initStarRatings() {
    function updateStars(container, rating) {
        const stars = container.querySelectorAll('i.far, i.fas');
        stars.forEach((star, index) => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= rating) {
                star.classList.remove('far');
                star.classList.add('fas', 'star-active');
            } else {
                star.classList.remove('fas', 'star-active');
                star.classList.add('far');
            }
        });
    }

    document.querySelectorAll('.stars-rating').forEach(container => {
        const criteria = container.getAttribute('data-criteria');
        const input = container.querySelector(`input[name="${criteria}"]`);
        
        if (!input) return;
        
        const stars = container.querySelectorAll('i[data-value]');
        const defaultValue = parseInt(input.value) || 3;
        updateStars(container, defaultValue);
        
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.getAttribute('data-value'));
                input.value = value;
                updateStars(container, value);
            });
            
            star.addEventListener('mouseenter', () => {
                const hoverValue = parseInt(star.getAttribute('data-value'));
                updateStars(container, hoverValue);
            });
            
            star.addEventListener('mouseleave', () => {
                const currentValue = parseInt(input.value) || 3;
                updateStars(container, currentValue);
            });
        });
    });
}

function resetStars() {
    document.querySelectorAll('.stars-rating').forEach(container => {
        const criteria = container.getAttribute('data-criteria');
        const input = container.querySelector(`input[name="${criteria}"]`);
        if (input) input.value = '3';
        
        const stars = container.querySelectorAll('i[data-value]');
        stars.forEach((star, index) => {
            if (index < 3) {
                star.classList.remove('far');
                star.classList.add('fas', 'star-active');
            } else {
                star.classList.remove('fas', 'star-active');
                star.classList.add('far');
            }
        });
    });
}

function saveRatingLocally(ratingData) {
    const ratings = safeGetItem('service_ratings', []);
    ratings.push({
        id: Date.now().toString(),
        service: ratingData.service,
        accessibility: ratingData.accessibility,
        welcome: ratingData.welcome,
        efficiency: ratingData.efficiency,
        transparency: ratingData.transparency,
        comment: ratingData.comment,
        created_at: new Date().toISOString()
    });
    safeSetItem('service_ratings', ratings);
}

async function saveRatingToSupabase(ratingData) {
    if (!supabaseClient) {
        console.log('⚠️ Supabase non disponible');
        return false;
    }
    
    try {
        const supabaseData = {
            service: ratingData.service,
            accessibility: ratingData.accessibility,
            welcome: ratingData.welcome,
            efficiency: ratingData.efficiency,
            transparency: ratingData.transparency,
            comment: ratingData.comment || null,
            created_at: new Date().toISOString()
        };
        
        const { error } = await supabaseClient
            .from('service_ratings')
            .insert([supabaseData]);
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        return false;
    }
}

async function fetchAndDisplayServiceRatings() {
    const localRatings = safeGetItem('service_ratings', []);
    
    if (supabaseClient) {
        try {
            const { data: supabaseRatings, error } = await supabaseClient
                .from('service_ratings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (!error && supabaseRatings) {
                displayRatingResults([...localRatings, ...supabaseRatings]);
                return;
            }
        } catch (error) {
            console.warn('⚠️ Erreur Supabase:', error.message);
        }
    }
    
    if (localRatings.length > 0) {
        displayRatingResults(localRatings);
    } else {
        displayDemoRatingResults();
    }
}

function displayRatingResults(ratings) {
    if (!ratings || ratings.length === 0) {
        displayEmptyRatingResults();
        return;
    }
    
    const totalVotes = ratings.length;
    const uniqueServices = [...new Set(ratings.map(item => item.service))];
    const avgRating = (ratings.reduce((sum, item) => {
        const accessibility = parseInt(item.accessibility) || 0;
        const welcome = parseInt(item.welcome) || 0;
        const efficiency = parseInt(item.efficiency) || 0;
        const transparency = parseInt(item.transparency) || 0;
        const avg = (accessibility + welcome + efficiency + transparency) / 4;
        return sum + avg;
    }, 0) / totalVotes).toFixed(1);

    const totalVotesEl = document.getElementById('totalVotes');
    const totalServicesEl = document.getElementById('totalServices');
    const avgRatingEl = document.getElementById('avgRating');
    
    if (totalVotesEl) totalVotesEl.textContent = totalVotes;
    if (totalServicesEl) totalServicesEl.textContent = uniqueServices.length;
    if (avgRatingEl) avgRatingEl.textContent = avgRating;

    const serviceStats = {};
    ratings.forEach(item => {
        if (!serviceStats[item.service]) {
            serviceStats[item.service] = { sum: 0, count: 0 };
        }
        const rating = calculateAverageRating(item);
        serviceStats[item.service].sum += rating;
        serviceStats[item.service].count += 1;
    });

    const topServices = Object.entries(serviceStats)
        .map(([service, stats]) => ({
            service,
            avg: stats.sum / stats.count,
            count: stats.count
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 3);

    const topServicesEl = document.getElementById('topServices');
    if (topServicesEl) {
        topServicesEl.innerHTML = topServices.map((service, index) => {
            const badges = ['gold', 'silver', 'bronze'];
            return `
                <div class="service-item-card ${badges[index]}">
                    <div class="service-rank-badge ${badges[index]}">${index + 1}</div>
                    <div class="service-info-card">
                        <div class="service-name-card">${service.service}</div>
                        <div class="service-stats-card">
                            <span class="service-score-card">
                                <i class="fas fa-star"></i> ${service.avg.toFixed(1)}/5
                            </span>
                            <span class="service-count-card">${service.count} votes</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    const recentRatings = document.getElementById('recentRatings');
    if (recentRatings) {
        recentRatings.innerHTML = ratings.slice(0, 3).map(item => `
            <div class="recent-item">
                <div class="recent-header">
                    <span class="recent-service">${item.service}</span>
                    <span class="recent-date">${formatDate(new Date(item.created_at || item.date))}</span>
                </div>
                <div class="recent-score">
                    <i class="fas fa-star"></i> 
                    ${calculateAverageRating(item).toFixed(1)}/5
                </div>
                ${item.comment ? `
                    <div class="recent-comment">"${item.comment.substring(0, 80)}${item.comment.length > 80 ? '...' : ''}"</div>
                ` : ''}
            </div>
        `).join('');
    }
}

function calculateAverageRating(item) {
    const accessibility = parseInt(item.accessibility) || 0;
    const welcome = parseInt(item.welcome) || 0;
    const efficiency = parseInt(item.efficiency) || 0;
    const transparency = parseInt(item.transparency) || 0;
    return (accessibility + welcome + efficiency + transparency) / 4;
}

function displayEmptyRatingResults() {
    const recentRatings = document.getElementById('recentRatings');
    const topServices = document.getElementById('topServices');
    if (recentRatings) {
        recentRatings.innerHTML = '<div class="rating-placeholder"><p>Aucune notation récente</p></div>';
    }
    if (topServices) {
        topServices.innerHTML = '<div class="rating-placeholder"><p>Pas encore de services notés</p></div>';
    }
}

function displayDemoRatingResults() {
    const totalVotesEl = document.getElementById('totalVotes');
    const totalServicesEl = document.getElementById('totalServices');
    const avgRatingEl = document.getElementById('avgRating');
    if (totalVotesEl) totalVotesEl.textContent = '310';
    if (totalServicesEl) totalServicesEl.textContent = '8';
    if (avgRatingEl) avgRatingEl.textContent = '4.3';

    const recentRatings = document.getElementById('recentRatings');
    if (recentRatings) {
        recentRatings.innerHTML = `
            <div class="recent-item">
                <div class="recent-header">
                    <span class="recent-service">Santé Publique</span>
                    <span class="recent-date">28/01/2026</span>
                </div>
                <div class="recent-score"><i class="fas fa-star"></i> 5.0/5</div>
                <div class="recent-comment">Très bon accueil et délais réduits</div>
            </div>
            <div class="recent-item">
                <div class="recent-header">
                    <span class="recent-service">Éducation Nationale</span>
                    <span class="recent-date">27/01/2026</span>
                </div>
                <div class="recent-score"><i class="fas fa-star"></i> 4.0/5</div>
                <div class="recent-comment">Amélioration notable des infrastructures</div>
            </div>
            <div class="recent-item">
                <div class="recent-header">
                    <span class="recent-service">Transports</span>
                    <span class="recent-date">26/01/2026</span>
                </div>
                <div class="recent-score"><i class="fas fa-star"></i> 3.5/5</div>
                <div class="recent-comment">Ponctualité à améliorer</div>
            </div>
        `;
    }

    const topServices = document.getElementById('topServices');
    if (topServices) {
        topServices.innerHTML = `
            <div class="service-item-card gold">
                <div class="service-rank-badge gold">1</div>
                <div class="service-info-card">
                    <div class="service-name-card">Santé Publique</div>
                    <div class="service-stats-card">
                        <span class="service-score-card"><i class="fas fa-star"></i> 4.7/5</span>
                        <span class="service-count-card">128 votes</span>
                    </div>
                </div>
            </div>
            <div class="service-item-card silver">
                <div class="service-rank-badge silver">2</div>
                <div class="service-info-card">
                    <div class="service-name-card">Éducation Nationale</div>
                    <div class="service-stats-card">
                        <span class="service-score-card"><i class="fas fa-star"></i> 4.3/5</span>
                        <span class="service-count-card">95 votes</span>
                    </div>
                </div>
            </div>
            <div class="service-item-card bronze">
                <div class="service-rank-badge bronze">3</div>
                <div class="service-info-card">
                    <div class="service-name-card">Transports</div>
                    <div class="service-stats-card">
                        <span class="service-score-card"><i class="fas fa-star"></i> 3.9/5</span>
                        <span class="service-count-card">87 votes</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// ==========================================
// VOTES PUBLICS
// ==========================================
async function fetchAndDisplayPublicVotes() {
    const localVotes = safeGetItem('promise_votes', []);
    
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('votes')
                .select('promise_id, rating, comment, created_at');
            
            if (!error && data) {
                processVotes([...localVotes, ...data]);
                return;
            }
        } catch (error) {
            console.warn('⚠️ Erreur votes:', error.message);
        }
    }
    
    processVotes(localVotes);
}

function processVotes(votes) {
    const votesMap = {};
    votes.forEach(vote => {
        if (!votesMap[vote.promise_id]) {
            votesMap[vote.promise_id] = { sum: 0, count: 0 };
        }
        votesMap[vote.promise_id].sum += vote.rating;
        votesMap[vote.promise_id].count += 1;
    });

    CONFIG.promises.forEach(promise => {
        if (votesMap[promise.id]) {
            promise.publicAvg = votesMap[promise.id].sum / votesMap[promise.id].count;
            promise.publicCount = votesMap[promise.id].count;
        }
    });

    if (typeof renderPromises === 'function') {
        renderPromises(CONFIG.promises.slice(0, CONFIG.currentVisible));
    }
    if (typeof updateStats === 'function') {
        updateStats();
    }
}

// ==========================================
// MODAL DE NOTATION
// ==========================================
function showRatingModal(promiseId) {
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    CONFIG.currentRatingPromiseId = promiseId;
    CONFIG.currentRatingValue = 0;

    const modal = document.createElement('div');
    modal.className = 'rating-modal';
    modal.id = 'ratingModal';
    modal.innerHTML = `
        <div class="rating-modal-content">
            <div class="rating-modal-header">
                <h3>
                    <i class="fas fa-star"></i>
                    Noter cet engagement
                </h3>
                <button class="close-modal" onclick="closeRatingModal()">&times;</button>
            </div>
            <div class="rating-modal-body">
                <p class="promise-preview">"${promise.engagement.substring(0, 100)}${promise.engagement.length > 100 ? '...' : ''}"</p>
                
                <div class="stars-rating-container">
                    <div class="stars-large" id="ratingStars">
                        <i class="far fa-star" data-value="1"></i>
                        <i class="far fa-star" data-value="2"></i>
                        <i class="far fa-star" data-value="3"></i>
                        <i class="far fa-star" data-value="4"></i>
                        <i class="far fa-star" data-value="5"></i>
                    </div>
                    <div class="rating-label" id="ratingLabel">
                        Sélectionnez une note (1-5 étoiles)
                    </div>
                </div>
                
                <div class="rating-feedback">
                    <label for="ratingComment">
                        <i class="fas fa-comment"></i>
                        Commentaire (optionnel)
                    </label>
                    <textarea id="ratingComment" placeholder="Partagez votre avis..."></textarea>
                </div>
            </div>
            <div class="rating-modal-footer">
                <button class="btn-cancel" onclick="closeRatingModal()">
                    Annuler
                </button>
                <button class="btn-submit-rating" onclick="submitRating()" disabled>
                    <i class="fas fa-paper-plane"></i>
                    Soumettre ma note
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const stars = modal.querySelectorAll('#ratingStars i');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            CONFIG.currentRatingValue = value;
            updateStars(stars, value);
            modal.querySelector('.btn-submit-rating').disabled = false;
            
            const labels = ['Mauvais', 'Passable', 'Bon', 'Très bon', 'Excellent'];
            modal.querySelector('#ratingLabel').textContent = labels[value - 1];
        });
        
        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.getAttribute('data-value'));
            updateStars(stars, value, true);
        });
    });

    modal.querySelector('#ratingStars').addEventListener('mouseleave', () => {
        updateStars(stars, CONFIG.currentRatingValue);
    });

    modal.style.display = 'flex';
}

function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => modal.remove(), 300);
    }
}

function updateStars(stars, value, isHover = false) {
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
        star.style.transform = isHover ? 'scale(1.1)' : 'scale(1)';
    });
}

function submitRating() {
    if (!CONFIG.currentRatingPromiseId || CONFIG.currentRatingValue === 0) {
        showNotification('Veuillez sélectionner une note', 'error');
        return;
    }
    
    const comment = document.getElementById('ratingComment')?.value.trim() || '';
    saveVoteToSupabase(CONFIG.currentRatingPromiseId, CONFIG.currentRatingValue, comment);
    closeRatingModal();
}

async function saveVoteToSupabase(promiseId, rating, comment = '') {
    if (!supabaseClient) {
        showNotification('Mode démo : Vote enregistré localement', 'info');
        const votes = safeGetItem('promise_votes', []);
        votes.push({
            id: Date.now().toString(),
            promise_id: promiseId,
            rating: rating,
            comment: comment,
            created_at: new Date().toISOString()
        });
        safeSetItem('promise_votes', votes);
        return;
    }
    
    try {
        const voteData = { 
            promise_id: promiseId, 
            rating: rating,
            comment: comment,
            created_at: new Date().toISOString()
        };
        
        const { error } = await supabaseClient
            .from('votes')
            .insert([voteData]);
        
        if (error) {
            console.error('Erreur Supabase:', error);
            const votes = safeGetItem('promise_votes', []);
            votes.push({
                id: Date.now().toString(),
                promise_id: promiseId,
                rating: rating,
                comment: comment,
                created_at: new Date().toISOString()
            });
            safeSetItem('promise_votes', votes);
            showNotification('Vote enregistré localement (mode démo)', 'info');
        } else {
            showNotification('Merci pour votre vote !', 'success');
        }
        
        setTimeout(() => fetchAndDisplayPublicVotes(), 500);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showNotification('Mode démo : Vote enregistré localement', 'info');
    }
}

// ==========================================
// ACTIONS
// ==========================================
function toggleUpdates(promiseId) {
    const updatesList = document.getElementById(`updates-${promiseId}`);
    if (updatesList) {
        updatesList.style.display = updatesList.style.display === 'none' ? 'block' : 'none';
    }
}

function sharePromise(promiseId) {
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const text = `📊 "${promise.engagement.substring(0, 100)}..." - Suivi des engagements du Projet Sénégal`;
    const url = window.location.href;

    if (navigator.share) {
        navigator.share({ title: 'Engagement du Projet Sénégal', text: text, url: url })
            .catch(err => console.log('Erreur partage:', err));
    } else {
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    }
}

function shareToPlatform(promiseId, platform) {
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const text = `📊 "${promise.engagement.substring(0, 100)}..." - Suivi des engagements du Projet Sénégal`;
    const url = window.location.href;

    let shareUrl = '';
    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        default:
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
}

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };

    notification.innerHTML = `
        <i class="fas fa-${icons[type] || icons.success}"></i>
        <span>${message}</span>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// COMPTE À REBOURS
// ==========================================
function setupCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;
    
    function updateCountdown() {
        const now = new Date();
        const diff = CONFIG.END_DATE - now;
        
        if (diff <= 0) {
            document.getElementById('days').textContent = '000';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(3, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ==========================================
// INITIALISATION PRINCIPALE
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    
    // Initialiser les composants UI
    initNavigation();
    initScrollEffects();
    initFilters();
    initDateDisplay();
    setupCountdown();
    
    // Charger les données
    await loadData();
    
    // Initialiser filteredPromises
    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = Math.min(CONFIG.visibleCount, CONFIG.promises.length);
    
    // Rendre les données
    renderAll();
});
