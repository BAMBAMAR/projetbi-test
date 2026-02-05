// ==========================================
// CONFIGURATION SUPABASE
// ==========================================
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_joJuW7-vMiQG302_2Mvj5A_sVaD8Wap';
let supabaseClient = null;
let DEMO_MODE = false;

// Initialisation Supabase
try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase initialisé avec succès');
    } else {
        console.warn('⚠️ SDK Supabase non disponible - fonctionnalités limitées');
    }
} catch (error) {
    console.error('❌ Erreur initialisation Supabase:', error);
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
    carouselInterval: null,
    visibleCount: 6,
    currentVisible: 6,
    carouselIndex: 0,
    carouselAutoPlay: true,
    animationDuration: 300,
    scrollOffset: 80,
    kpiCarouselIndex: 0,
    kpiAutoPlay: true,
    zoomScale: 1,
    currentRatingPromiseId: null,
    currentRatingValue: 0,
    filteredPromises: [],
    currentPhotoIndex: 0
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
// VÉRIFICATION CONNEXION SUPABASE
// ==========================================
async function checkSupabaseConnection() {
    if (!supabaseClient) {
        DEMO_MODE = true;
        console.log('🎭 MODE DÉMO - Supabase non disponible');
        return;
    }
    try {
        const { error } = await supabaseClient
            .from('service_ratings')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            DEMO_MODE = true;
            console.log('🎭 MODE DÉMO - Erreur Supabase:', error.message);
            showNotification('Mode démo activé - données locales', 'info');
        } else {
            DEMO_MODE = false;
            console.log('✅ Mode Supabase activé');
        }
    } catch (error) {
        DEMO_MODE = true;
        console.log('🎭 MODE DÉMO - Exception:', error.message);
    }
}

// ==========================================
// CONVERSION DES DÉLAIS TEXTE EN JOURS
// ==========================================
function parseDelayToDays(delayText) {
    if (!delayText || delayText.trim() === '') return 365;
    const lower = delayText.toLowerCase().trim();

    if (lower.includes('2030') || lower.includes('20 29')) return 1825;
    if (lower.includes('immédiat') || lower.includes('immediat') || lower.includes('dès')) return 0;
    if (lower.includes('mandat') || lower.includes('quinquennat')) return 1825;

    let totalDays = 0;

    const yearsMatch = lower.match(/(\d+)\s*an[s]?/i);
    if (yearsMatch) totalDays += parseInt(yearsMatch[1], 10) * 365;

    const monthsMatch = lower.match(/(\d+)\s*mois/i);
    if (monthsMatch) totalDays += parseInt(monthsMatch[1], 10) * 30;

    const daysMatch = lower.match(/(\d+)\s*jour[s]?/i);
    if (daysMatch) totalDays += parseInt(daysMatch[1], 10);

    const premiersMoisMatch = lower.match(/(\d+)\s*premiers?\s*mois/i);
    if (premiersMoisMatch) totalDays += parseInt(premiersMoisMatch[1], 10) * 30;

    const firstYearsMatch = lower.match(/(\d+)\s*premières?\s*années?/i);
    if (firstYearsMatch) totalDays += parseInt(firstYearsMatch[1], 10) * 365;

    if (lower.includes('2 premières années') || lower.includes('2 premières annees')) totalDays = 730;
    if (lower.includes('1ère année') || lower.includes('1ere annee')) totalDays = 365;

    const ansSimpleMatch = lower.match(/(\d+)\s*ans$/i);
    if (ansSimpleMatch && !lower.includes('premières') && !lower.includes('premiere')) {
        totalDays = parseInt(ansSimpleMatch[1], 10) * 365;
    }

    const rangeMatch = lower.match(/(\d+)\s*à\s*(\d+)\s*an[s]?/i);
    if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10) * 365;
        const max = parseInt(rangeMatch[2], 10) * 365;
        totalDays = Math.round((min + max) / 2);
    }

    const dateMatch = delayText.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
        try {
            const targetDate = new Date(dateMatch[0]);
            const startDate = CONFIG.START_DATE;
            const diffTime = targetDate.getTime() - startDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDays = Math.max(0, Math.min(diffDays, 1825));
        } catch (e) {
            console.warn('Erreur conversion date:', dateMatch[0]);
        }
    }

    if (totalDays === 0) {
        const num = parseInt(delayText.replace(/[^0-9]/g, ''), 10);
        totalDays = !isNaN(num) ? num * 365 : 365;
    }

    return Math.min(totalDays, 1825);
}

// ==========================================
// CALCULS DES DATES
// ==========================================
function getDaysRemaining(deadline) {
    if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) return 0;
    const diff = deadline.getTime() - CONFIG.CURRENT_DATE.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDaysRemaining(days) {
    if (days > 0) return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
    if (days < 0) return `${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''} de retard`;
    return 'Aujourd\'hui';
}

function calculateDeadlineFromDays(days) {
    const daysNum = Math.max(0, parseInt(days, 10) || 0);
    const deadline = new Date(CONFIG.START_DATE);
    if (daysNum === 0) return deadline;
    deadline.setDate(deadline.getDate() + daysNum);
    return deadline > CONFIG.END_DATE ? new Date(CONFIG.END_DATE) : deadline;
}

function checkIfLate(status, deadline) {
    if (status === 'Réalisé') return false;
    if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) return false;
    return CONFIG.CURRENT_DATE > deadline;
}

// ==========================================
// FONCTIONS UTILITAIRES LOCALSTORAGE
// ==========================================
function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn('⚠️ localStorage bloqué:', error.message);
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
        console.warn('⚠️ localStorage bloqué:', error.message);
        if (window.tempStorage && window.tempStorage[key]) return window.tempStorage[key];
        return defaultValue;
    }
}

// ==========================================
// CHARGEMENT DES DONNÉES
// ==========================================
async function loadData() {
    try {
        console.log('📥 Début du chargement des données...');
        await loadPromisesData();
        await loadPressData();
        await loadNewsData();
        
        setTimeout(() => {
            fetchAndDisplayPublicVotes().catch(error => {
                console.warn('⚠️ Impossible de charger les votes:', error.message);
            });
        }, 1000);
        
        renderAll();
        if (typeof renderNews === 'function') renderNews(CONFIG.news);
        if (typeof renderNewspapers === 'function') renderNewspapers();
        console.log('✅ Toutes les données chargées');
    } catch (error) {
        console.error('❌ Erreur chargement général:', error);
        showNotification('Erreur de chargement des données', 'error');
        CONFIG.promises = generateTestPromises();
        CONFIG.press = getDefaultPressData();
        if (typeof renderAll === 'function') renderAll();
    }
}

async function loadPromisesData() {
    try {
        const response = await fetch('promises.json');
        if (!response.ok) {
            console.warn('Fichier promises.json non trouvé');
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
            let status = 'Non lancé';
            if (p.status) {
                const statusLower = p.status.toLowerCase();
                if (statusLower.includes('realise') || statusLower.includes('réalisé')) status = 'Réalisé';
                else if (statusLower.includes('cours') || statusLower.includes('encours')) status = 'En cours';
                else if (statusLower.includes('retard')) status = 'En retard';
                else if (statusLower.includes('lancé') || statusLower.includes('lance')) status = 'Non lancé';
            }
            
            const domain = p.domaine || p.domain || p.categorie || 'Autre';
            const delayText = p.delai || '12 premiers mois';
            let delayDays = parseDelayToDays(delayText);
            if (isNaN(delayDays) || delayDays < 0) delayDays = 365;
            
            const deadline = calculateDeadlineFromDays(delayDays);
            const isLate = checkIfLate(status, deadline);
            
            const updates = (p.mises_a_jour || []).map(update => ({
                date: update.date || '',
                description: update.text || update.description || 'Mise à jour'
            }));
            
            return {
                id: p.id || Math.random().toString(36).substr(2, 9),
                engagement: p.engagement || p.titre || 'Engagement non spécifié',
                domain: domain,
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
        
        fixInvalidDelays();
        
        CONFIG.promises.sort((a, b) => {
            if (a.isLate && !b.isLate) return -1;
            if (!a.isLate && b.isLate) return 1;
            return a.deadline - b.deadline;
        });
        
    } catch (error) {
        console.error('❌ Erreur chargement promesses:', error);
        CONFIG.promises = generateTestPromises();
    }
}

async function loadPressData() {
    try {
        console.log('📰 Chargement des données presse...');
        const pressResponse = await fetch('press.json?v=' + Date.now());
        if (!pressResponse.ok) {
            console.warn('Fichier press.json non trouvé');
            CONFIG.press = getDefaultPressData();
            return;
        }
        
        const pressData = await pressResponse.json();
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
            console.log(`✅ ${CONFIG.press.length} journaux chargés`);
        } else {
            CONFIG.press = getDefaultPressData();
        }
    } catch (pressError) {
        console.error('❌ Erreur chargement presse:', pressError);
        CONFIG.press = getDefaultPressData();
    }
}

async function loadNewsData() {
    try {
        console.log('📰 Chargement des actualités...');
        const newsResponse = await fetch('news.json?v=' + Date.now());
        if (!newsResponse.ok) {
            console.warn('Fichier news.json non trouvé');
            CONFIG.news = getDefaultNewsData();
            return;
        }
        
        const newsData = await newsResponse.json();
        if (newsData && Array.isArray(newsData.news)) {
            CONFIG.news = newsData.news;
            console.log(`✅ ${CONFIG.news.length} actualités chargées`);
        } else {
            CONFIG.news = getDefaultNewsData();
        }
    } catch (newsError) {
        console.error('❌ Erreur chargement actualités:', newsError);
        CONFIG.news = getDefaultNewsData();
    }
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

// ==========================================
// CORRECTION DES DÉLAIS INVALIDES
// ==========================================
function fixInvalidDelays() {
    console.log('🔧 Correction des délais invalides...');
    let corrections = 0;
    CONFIG.promises.forEach(promise => {
        const currentDelay = parseInt(promise.delai);
        if (currentDelay > 1825) {
            console.log(`Correction: ${promise.id} - ${promise.engagement.substring(0, 50)}...`);
            promise.delai = '1825';
            promise.delai_texte = 'Quinquennat';
            promise.deadline = calculateDeadlineFromDays(1825);
            promise.isLate = checkIfLate(promise.status, promise.deadline);
            corrections++;
        }
    });
    if (corrections > 0) console.log(`✅ ${corrections} délais corrigés`);
}

// ==========================================
// DONNÉES DE TEST
// ==========================================
function generateTestPromises() {
    return [
        {
            id: 'promise_19',
            domaine: 'Lutte Corruption',
            engagement: 'Loi de protection des lanceurs d\'alerte',
            resultat: 'Encouragement dénonciation civique',
            delai: '3 premières années',
            status: 'realise',
            mises_a_jour: [
                {
                    date: '26/08/2025',
                    text: 'Au Sénégal, la protection des lanceurs d\'alerte est désormais régie par la Loi n° 2025-14, adoptée par l\'Assemblée nationale le 26 août 2025 et promulguée en septembre 2025[...]'
                }
            ]
        },
        {
            id: 'promise_20',
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
            id: 'promise_21',
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
        const updates = (p.mises_a_jour || []).map(update => ({
            date: update.date || '',
            description: update.text || update.description || 'Mise à jour'
        }));
        
        return {
            id: p.id,
            engagement: p.engagement,
            domain: p.domaine || p.domain || 'Autre',
            status: status,
            delai: delayDays.toString(),
            delai_texte: p.delai,
            resultat: p.resultat,
            updates: updates,
            deadline: deadline,
            isLate: isLate,
            publicAvg: 0,
            publicCount: 0
        };
    });
}

function getDefaultPressData() {
    return [
        { id: '1', title: 'Le Soleil', date: '28/01/2026', image: 'https://picsum.photos/seed/soleil/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6d/Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg/200px-Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg.png' },
        { id: '2', title: 'Sud Quotidien', date: '28/01/2026', image: 'https://picsum.photos/seed/sud/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5b/Sud_Quotidien_logo.svg/200px-Sud_Quotidien_logo.svg.png' },
        { id: '3', title: 'Libération', date: '28/01/2026', image: 'liberation.jpg', logo: 'iconeliberation.jpg' },
        { id: '4', title: 'L\'Observateur', date: '28/01/2026', image: 'observateur.jpg', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/L%27Observateur_logo.svg/200px-L%27Observateur_logo.svg.png' },
        { id: '5', title: 'Le Quotidien', date: '28/01/2026', image: 'https://picsum.photos/seed/quotidien/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3c/Le_Quotidien_logo.svg/200px-Le_Quotidien_logo.svg.png' },
        { id: '6', title: 'WalFadjri', date: '28/01/2026', image: 'https://picsum.photos/seed/walfadjri/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7c/Walf_fadjri_logo.svg/200px-Walf_fadjri_logo.svg.png' }
    ];
}

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    
    initNavigation();
    initScrollEffects();
    initFilters();
    initDateDisplay();
    initPhotoViewer();
    
    await loadData();
    
    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = Math.min(CONFIG.visibleCount, CONFIG.promises.length);
    
    renderAll();
    if (typeof renderNews === 'function') renderNews(CONFIG.news);
    if (typeof renderNewspapers === 'function') renderNewspapers();
    
    setupPressCarousel();
    setupServiceRatings();
    setupDailyPromise();
    setupPromisesCarousel();
    setupKpiCarousel();
    initStarRatings();
    
    setTimeout(() => {
        if (typeof setupPhotoViewerControls === 'function') {
            setupPhotoViewerControls();
        }
    }, 500);
    
    setTimeout(checkSupabaseConnection, 1000);
});

// ==========================================
// NAVIGATION
// ==========================================
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('show');
            mobileMenuBtn.classList.toggle('active');
            navMenu.classList.contains('show') ? createMobileOverlay() : removeMobileOverlay();
        });
    }
    
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
                
                if (navMenu && navMenu.classList.contains('show')) {
                    navMenu.classList.remove('show');
                    mobileMenuBtn.classList.remove('active');
                    removeMobileOverlay();
                }
            }
        });
    });
    
    window.addEventListener('scroll', debounce(() => {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 100)) current = section.getAttribute('id');
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href === `#${current}`) link.classList.add('active');
        });
    }, 100));
}

function createMobileOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.id = 'mobileOverlay';
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', () => {
        const navMenu = document.getElementById('navMenu');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (navMenu) navMenu.classList.remove('show');
        if (mobileMenuBtn) mobileMenuBtn.classList.remove('active');
        removeMobileOverlay();
    });
    
    document.body.style.overflow = 'hidden';
}

function removeMobileOverlay() {
    const overlay = document.getElementById('mobileOverlay');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
}

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
// SCROLL EFFECTS
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

// ==========================================
// DATE DISPLAY
// ==========================================
function initDateDisplay() {
    const currentDateEl = document.getElementById('current-date');
    if (currentDateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        currentDateEl.textContent = today.toLocaleDateString('fr-FR', options);
    }
}

// ==========================================
// FILTRES
// ==========================================
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
    
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);
    if (filterDomain) filterDomain.addEventListener('change', applyFilters);
    if (filterSearch) filterSearch.addEventListener('input', debounce(applyFilters, 300));
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    
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

function applyFilters() {
    const filterStatus = document.getElementById('filter-status')?.value || '';
    const filterDomain = document.getElementById('filter-domain')?.value || '';
    const filterSearch = document.getElementById('filter-search')?.value.toLowerCase() || '';
    
    let filtered = CONFIG.promises;
    
    if (filterStatus) {
        if (filterStatus === 'En retard') {
            filtered = filtered.filter(promise => promise.isLate === true);
        } else if (filterStatus === '✅ Réalisé') {
            filtered = filtered.filter(promise => promise.status === 'Réalisé' && promise.isLate === false);
        } else if (filterStatus === '🔄 En cours') {
            filtered = filtered.filter(promise => promise.status === 'En cours' && promise.isLate === false);
        } else if (filterStatus === '⏳ Non lancé') {
            filtered = filtered.filter(promise => promise.status === 'Non lancé' && promise.isLate === false);
        }
    }
    
    if (filterDomain && filterDomain !== '') {
        filtered = filtered.filter(promise => promise.domain === filterDomain);
    }
    
    if (filterSearch) {
        filtered = filtered.filter(promise => 
            promise.engagement.toLowerCase().includes(filterSearch) ||
            (promise.domain || '').toLowerCase().includes(filterSearch) ||
            (promise.resultat || '').toLowerCase().includes(filterSearch)
        );
    }
    
    CONFIG.filteredPromises = filtered;
    updateFilteredDisplay();
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

function resetFilters() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-domain').value = '';
    document.getElementById('filter-search').value = '';
    
    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = CONFIG.visibleCount;
    
    renderPromises(CONFIG.promises.slice(0, CONFIG.currentVisible));
    updateResultsCount(CONFIG.promises.length);
}

function updateResultsCount(count) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) resultsCount.textContent = `${count} engagement(s) trouvé(s)`;
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
// RENDERING
// ==========================================
function renderAll() {
    console.log('renderAll: Rendering', CONFIG.promises.length, 'promises');
    
    if (!CONFIG.filteredPromises || CONFIG.filteredPromises.length === 0) {
        CONFIG.filteredPromises = [...CONFIG.promises];
    }
    
    updateStats();
    
    const initialCount = Math.min(CONFIG.visibleCount, CONFIG.filteredPromises.length);
    renderPromises(CONFIG.filteredPromises.slice(0, initialCount));
    
    updateResultsCount(CONFIG.filteredPromises.length);
    
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (CONFIG.filteredPromises.length > CONFIG.visibleCount) {
        if (showMoreBtn) showMoreBtn.style.display = 'inline-flex';
        if (showLessBtn) showLessBtn.style.display = 'none';
    } else {
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        if (showLessBtn) showLessBtn.style.display = 'none';
    }
    
    populateDomainFilter();
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
                                    <div class="update-text">${update.description || 'Mise à jour des engagements'}</div>
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
                            <i class="fab fa-x-twitter"></i>
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
                        <div class="rating-stars">${generateStars(promise.publicAvg)}</div>
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
    let date;
    if (!dateInput) return 'Date inconnue';
    if (dateInput instanceof Date) date = dateInput;
    else if (typeof dateInput === 'string' || typeof dateInput === 'number') date = new Date(dateInput);
    else return 'Date inconnue';
    
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
    
    const promisesNonRealiseesNonRetard = CONFIG.promises.filter(p => p.status !== 'Réalisé' && !p.isLate);
    let avgDelay = 0;
    if (promisesNonRealiseesNonRetard.length > 0) {
        let totalDaysRemaining = 0;
        let validPromisesCount = 0;
        promisesNonRealiseesNonRetard.forEach(promise => {
            const daysRemaining = getDaysRemaining(promise.deadline);
            if (daysRemaining >= 0 && daysRemaining <= 1825) {
                totalDaysRemaining += daysRemaining;
                validPromisesCount++;
            }
        });
        if (validPromisesCount > 0) avgDelay = Math.round(totalDaysRemaining / validPromisesCount);
    }
    
    const promisesEnRetard = CONFIG.promises.filter(p => p.isLate);
    let avgRetard = 0;
    if (promisesEnRetard.length > 0) {
        const totalRetard = promisesEnRetard.reduce((sum, p) => {
            const daysRemaining = getDaysRemaining(p.deadline);
            return sum + Math.abs(daysRemaining);
        }, 0);
        avgRetard = Math.round(totalRetard / promisesEnRetard.length);
    }
    
    const allRatings = CONFIG.promises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    const totalVotes = allRatings.reduce((sum, p) => sum + p.publicCount, 0);
    
    KPI_ITEMS[0].value = total;
    KPI_ITEMS[1].value = realise;
    KPI_ITEMS[2].value = encours;
    KPI_ITEMS[3].value = retard;
    KPI_ITEMS[4].value = `${tauxRealisation}%`;
    
    if (retard > 0) {
        KPI_ITEMS[5].value = `${avgRetard}j`;
        KPI_ITEMS[5].label = '⚠️ Retard Moyen';
        KPI_ITEMS[5].icon = '⚠️';
    } else if (avgDelay > 0) {
        KPI_ITEMS[5].value = `${avgDelay}j`;
        KPI_ITEMS[5].label = '⏱️ Retard moyen';
        KPI_ITEMS[5].icon = '⏱️';
    } else {
        KPI_ITEMS[5].value = 'N/A';
        KPI_ITEMS[5].label = '⏱️ Retard moyen';
        KPI_ITEMS[5].icon = '⏱️';
    }
    
    KPI_ITEMS[6].value = avgRating;
    KPI_ITEMS[7].value = withUpdates;
    
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
    } else if (avgDelay > 0) {
        updateStatValue('delai-moyen', `${avgDelay}j restants en moyenne`);
    } else {
        updateStatValue('delai-moyen', 'N/A');
    }
    
    updateStatPercentage('total-percentage', total, total);
    updateStatPercentage('realise-percentage', realise, total);
    updateStatPercentage('encours-percentage', encours, total);
    updateStatPercentage('non-lance-percentage', nonLance, total);
    updateStatPercentage('retard-percentage', retard, total);
    updateStatPercentage('avec-maj-percentage', withUpdates, total);
    
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
                <span class="article-domain"><i class="fas fa-building"></i> ${promise.domain || 'Non spécifié'}</span>
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
                    <h3><i class="fas fa-clock"></i> Délai de réalisation des mesures clés</h3>
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
// NEWS & NEWSPAPERS
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

async function renderNewspapers() {
    const grid = document.getElementById('newspapersGrid');
    if (!grid) return;
    
    const availablePress = await checkAvailableNewspapers();
    
    if (availablePress.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <p><i class="fas fa-newspaper"></i> Aucun journal disponible pour le moment</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = availablePress.map(paper => {
        return `
            <div class="newspaper-card" onclick="openPhotoViewer('${paper.id}')">
                <div class="newspaper-preview">
                    <img src="${paper.image}" alt="${paper.title}" 
                        onerror="this.onerror=null; this.src='https://picsum.photos/400/533?random=${paper.id}'">
                </div>
                <h4>${paper.title}</h4>
                <p class="newspaper-date">${paper.date}</p>
            </div>
        `;
    }).join('');
}

async function checkAvailableNewspapers() {
    const availablePapers = [];
    for (const paper of CONFIG.press) {
        try {
            const response = await fetch(paper.image, { method: 'HEAD' });
            if (response.ok) availablePapers.push(paper);
        } catch (error) {
            console.warn(`Erreur vérification: ${paper.image}`);
        }
    }
    
    if (availablePapers.length === 0) return CONFIG.press;
    
    console.log(`📊 ${availablePapers.length}/${CONFIG.press.length} images disponibles`);
    return availablePapers;
}

// ==========================================
// CAROUSELS
// ==========================================
async function setupPressCarousel() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!prevBtn || !nextBtn || !indicators) return;
    
    const availablePress = await checkAvailableNewspapers();
    if (availablePress.length === 0) {
        document.getElementById('pressCarousel').innerHTML = `
            <div class="loading-state">
                <p><i class="fas fa-newspaper"></i> Aucun journal disponible pour le moment</p>
            </div>
        `;
        return;
    }
    
    CONFIG.press = availablePress;
    CONFIG.currentIndex = 0;
    CONFIG.zoomScale = 1;
    
    if (prevBtn) prevBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
        CONFIG.zoomScale = 1;
        renderPressCarousel();
    });
    
    if (nextBtn) nextBtn.addEventListener('click', () => {
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
    
    const carouselTitle = document.getElementById('carouselTitle');
    const carouselDate = document.getElementById('carouselDate');
    if (carouselTitle) carouselTitle.textContent = currentPaper.title;
    if (carouselDate) carouselDate.textContent = currentPaper.date;
    
    carousel.querySelector('#pressImage').src = imageUrl;
    
    indicators.innerHTML = Array.from({length: CONFIG.press.length}, (_, i) => 
        `<button class="indicator ${i === CONFIG.currentIndex ? 'active' : ''}" onclick="goToSlide(${i})"></button>`
    ).join('');
}

function goToSlide(index) {
    CONFIG.currentIndex = index;
    CONFIG.zoomScale = 1;
    renderPressCarousel();
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

// ==========================================
// PROMISES CAROUSEL
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
    window.addEventListener('resize', renderCarousel);
}

function goToCarouselSlide(index) {
    const carouselPromises = CONFIG.promises.slice(0, 6);
    const itemsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    const totalSlides = Math.ceil(carouselPromises.length / itemsPerSlide);
    if (index >= 0 && index < totalSlides) {
        const currentSlide = index;
        setupPromisesCarousel();
    }
}

function goToPromiseSection(promiseId) {
    const promisesSection = document.getElementById('promises');
    if (promisesSection) {
        const offset = CONFIG.scrollOffset;
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
// KPI CAROUSEL
// ==========================================
function setupKpiCarousel() {
    const kpiCarousel = document.getElementById('kpiCarousel');
    const kpiPrev = document.getElementById('kpiPrev');
    const kpiNext = document.getElementById('kpiNext');
    const kpiAutoPlayToggle = document.getElementById('kpiAutoPlayToggle');
    
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
    
    if (kpiAutoPlayToggle) {
        kpiAutoPlayToggle.addEventListener('click', () => {
            CONFIG.kpiAutoPlay = !CONFIG.kpiAutoPlay;
            kpiAutoPlayToggle.innerHTML = CONFIG.kpiAutoPlay ? 
                '<i class="fas fa-pause"></i>' : 
                '<i class="fas fa-play"></i>';
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
        
        const defaultValue = parseInt(input.value) || 3;
        updateStars(container, defaultValue);
        
        const stars = container.querySelectorAll('i[data-value]');
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
    console.log('💾 Notation sauvegardée localement');
}

async function saveRatingToSupabase(ratingData) {
    if (!supabaseClient) {
        console.log('⚠️ Supabase non disponible - mode local seulement');
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
            user_ip: await getIPAddress(),
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('service_ratings')
            .insert([supabaseData]);
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            return false;
        }
        
        await updateServiceStats(ratingData.service);
        return true;
        
    } catch (error) {
        console.error('❌ Erreur envoi Supabase:', error);
        return false;
    }
}

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

async function updateServiceStats(serviceName) {
    if (!supabaseClient) return;
    try {
        const { data: ratings, error } = await supabaseClient
            .from('service_ratings')
            .select('accessibility, welcome, efficiency, transparency')
            .eq('service', serviceName);
        
        if (error) throw error;
        
        if (ratings.length > 0) {
            const total = ratings.length;
            const sums = ratings.reduce((acc, rating) => ({
                accessibility: acc.accessibility + (rating.accessibility || 0),
                welcome: acc.welcome + (rating.welcome || 0),
                efficiency: acc.efficiency + (rating.efficiency || 0),
                transparency: acc.transparency + (rating.transparency || 0)
            }), { accessibility: 0, welcome: 0, efficiency: 0, transparency: 0 });
            
            const stats = {
                service: serviceName,
                total_ratings: total,
                avg_accessibility: (sums.accessibility / total).toFixed(2),
                avg_welcome: (sums.welcome / total).toFixed(2),
                avg_efficiency: (sums.efficiency / total).toFixed(2),
                avg_transparency: (sums.transparency / total).toFixed(2),
                overall_rating: ((sums.accessibility + sums.welcome + sums.efficiency + sums.transparency) / (total * 4)).toFixed(2),
                last_updated: new Date().toISOString()
            };
            
            const { error: statsError } = await supabaseClient
                .from('service_stats')
                .upsert(stats, { onConflict: 'service' });
        }
    } catch (error) {
        console.error('❌ Erreur calcul stats:', error);
    }
}

async function fetchAndDisplayServiceRatings() {
    console.log('📊 Chargement des notations service...');
    const localRatings = safeGetItem('service_ratings', []);
    
    if (supabaseClient) {
        try {
            const { data: supabaseRatings, error } = await supabaseClient
                .from('service_ratings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (!error && supabaseRatings) {
                const { data: stats, error: statsError } = await supabaseClient
                    .from('service_stats')
                    .select('*')
                    .order('overall_rating', { ascending: false });
                displayRatingResults(supabaseRatings, stats);
                return;
            }
        } catch (error) {
            console.warn('⚠️ Erreur chargement Supabase:', error.message);
        }
    }
    
    if (localRatings.length > 0) {
        displayRatingResults(localRatings);
    } else {
        displayDemoRatingResults();
    }
}

function displayRatingResults(ratings, stats = null) {
    if (!ratings || ratings.length === 0) {
        displayEmptyRatingResults();
        return;
    }
    
    if (stats && stats.length > 0) {
        const totalVotesFromStats = stats.reduce((sum, stat) => sum + (stat.total_ratings || 0), 0);
        const overallAvg = stats.length > 0 
            ? (stats.reduce((sum, stat) => sum + parseFloat(stat.overall_rating || 0), 0) / stats.length).toFixed(1)
            : '0.0';
        
        if (document.getElementById('totalVotes')) document.getElementById('totalVotes').textContent = totalVotesFromStats;
        if (document.getElementById('totalServices')) document.getElementById('totalServices').textContent = stats.length;
        if (document.getElementById('avgRating')) document.getElementById('avgRating').textContent = overallAvg;
        
        const topServicesEl = document.getElementById('topServices');
        if (topServicesEl) {
            topServicesEl.innerHTML = stats.slice(0, 3).map((service, index) => {
                const badges = ['gold', 'silver', 'bronze'];
                return `
                    <div class="service-item-card ${badges[index]}">
                        <div class="service-rank-badge ${badges[index]}">${index + 1}</div>
                        <div class="service-info-card">
                            <div class="service-name-card">${service.service}</div>
                            <div class="service-stats-card">
                                <span class="service-score-card">
                                    <i class="fas fa-star"></i> ${parseFloat(service.overall_rating).toFixed(1)}/5
                                </span>
                                <span class="service-count-card">${service.total_ratings} votes</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } else {
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
        
        if (document.getElementById('totalVotes')) document.getElementById('totalVotes').textContent = totalVotes;
        if (document.getElementById('totalServices')) document.getElementById('totalServices').textContent = uniqueServices.length;
        if (document.getElementById('avgRating')) document.getElementById('avgRating').textContent = avgRating;
        
        const serviceStats = {};
        ratings.forEach(item => {
            if (!serviceStats[item.service]) {
                serviceStats[item.service] = { sum: 0, count: 0, comments: 0 };
            }
            const rating = calculateAverageRating(item);
            serviceStats[item.service].sum += rating;
            serviceStats[item.service].count += 1;
            if (item.comment && item.comment.trim() !== '') {
                serviceStats[item.service].comments += 1;
            }
        });
        
        const topServices = Object.entries(serviceStats)
            .map(([service, stats]) => ({
                service,
                avg: stats.sum / stats.count,
                count: stats.count,
                comments: stats.comments
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
        recentRatings.innerHTML = `
            <div class="rating-placeholder">
                <p>Aucune notation récente</p>
            </div>
        `;
    }
    if (topServices) {
        topServices.innerHTML = `
            <div class="rating-placeholder">
                <p>Pas encore de services notés</p>
            </div>
        `;
    }
}

function displayDemoRatingResults() {
    if (document.getElementById('totalVotes')) document.getElementById('totalVotes').textContent = '310';
    if (document.getElementById('totalServices')) document.getElementById('totalServices').textContent = '8';
    if (document.getElementById('avgRating')) document.getElementById('avgRating').textContent = '4.3';
    
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
// VOTES PUBLICS POUR LES PROMESSES
// ==========================================
async function fetchAndDisplayPublicVotes() {
    console.log('📊 Chargement des votes...');
    const localVotes = safeGetItem('promise_votes', []);
    
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('votes')
                .select('promise_id, rating, comment, created_at');
            
            if (!error && data) {
                const allVotes = [...localVotes, ...data];
                processVotes(allVotes);
                return;
            }
        } catch (error) {
            console.warn('⚠️ Erreur chargement votes Supabase:', error.message);
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
    
    renderPromises(CONFIG.promises.slice(0, CONFIG.currentVisible));
    updateStats();
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
        console.error('❌ Erreur sauvegarde vote:', error);
        showNotification('Mode démo : Vote enregistré localement', 'info');
    }
}

// ==========================================
// MODAL DE NOTATION DES PROMESSES
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
                    <textarea id="ratingComment" placeholder="Partagez votre avis sur cet engagement..." rows="3"></textarea>
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

// ==========================================
// PHOTO VIEWER
// ==========================================
function initPhotoViewer() {
    console.log('📸 Initialisation du visualiseur photo');
}

function setupPhotoViewerControls() {
    console.log('🎯 Configuration des contrôles du visualiseur photo');
    if (!document.getElementById('photoViewerModal')) {
        const modal = document.createElement('div');
        modal.id = 'photoViewerModal';
        modal.className = 'photo-viewer-modal';
        modal.innerHTML = `
            <div class="photo-viewer-content">
                <div class="photo-viewer-header">
                    <h3><i class="fas fa-newspaper"></i> Revue de Presse</h3>
                    <div class="photo-viewer-controls">
                        <button onclick="zoomIn()" title="Zoom +"><i class="fas fa-search-plus"></i></button>
                        <button onclick="zoomReset()" title="Réinitialiser"><i class="fas fa-expand"></i></button>
                        <button onclick="zoomOut()" title="Zoom -"><i class="fas fa-search-minus"></i></button>
                    </div>
                    <button id="closeViewerBtn" onclick="closePhotoViewer()">&times;</button>
                </div>
                <div class="photo-viewer-body">
                    <button class="nav-btn prev" onclick="prevPhoto()">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="photo-container">
                        <img id="photoViewerImage" src="" alt="">
                    </div>
                    <button class="nav-btn next" onclick="nextPhoto()">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="photo-viewer-footer">
                    <span id="photoViewerInfo"></span>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function openPhotoViewer(pressId) {
    const index = CONFIG.press.findIndex(p => p.id === pressId);
    if (index === -1) return;
    
    CONFIG.currentPhotoIndex = index;
    let currentZoom = 1;
    
    const modal = document.getElementById('photoViewerModal');
    const image = document.getElementById('photoViewerImage');
    const info = document.getElementById('photoViewerInfo');
    
    const paper = CONFIG.press[CONFIG.currentPhotoIndex];
    let imageUrl = paper.image;
    if (imageUrl.includes('picsum.photos')) {
        imageUrl = imageUrl.replace('/400/533', '/600/800');
    }
    
    image.src = imageUrl;
    image.alt = paper.title;
    image.style.transform = `scale(${currentZoom})`;
    image.style.cursor = currentZoom > 1 ? 'grab' : 'default';
    
    info.textContent = `${paper.title} - ${paper.date}`;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setupImageDrag(image);
}

function closePhotoViewer() {
    const modal = document.getElementById('photoViewerModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function zoomIn() {
    const image = document.getElementById('photoViewerImage');
    if (image) {
        const currentScale = parseFloat(image.style.transform.replace(/[^0-9.]/g, '') || 1);
        const newScale = Math.min(currentScale + 0.25, 3);
        image.style.transform = `scale(${newScale})`;
        image.style.cursor = newScale > 1 ? 'grab' : 'default';
    }
}

function zoomOut() {
    const image = document.getElementById('photoViewerImage');
    if (image) {
        const currentScale = parseFloat(image.style.transform.replace(/[^0-9.]/g, '') || 1);
        const newScale = Math.max(currentScale - 0.25, 1);
        image.style.transform = `scale(${newScale})`;
        image.style.cursor = newScale > 1 ? 'grab' : 'default';
    }
}

function zoomReset() {
    const image = document.getElementById('photoViewerImage');
    if (image) {
        image.style.transform = 'scale(1)';
        image.style.cursor = 'default';
    }
}

function prevPhoto() {
    CONFIG.currentPhotoIndex = (CONFIG.currentPhotoIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
    updateViewerPhoto();
}

function nextPhoto() {
    CONFIG.currentPhotoIndex = (CONFIG.currentPhotoIndex + 1) % CONFIG.press.length;
    updateViewerPhoto();
}

function updateViewerPhoto() {
    const image = document.getElementById('photoViewerImage');
    const info = document.getElementById('photoViewerInfo');
    const paper = CONFIG.press[CONFIG.currentPhotoIndex];
    
    let imageUrl = paper.image;
    if (imageUrl.includes('picsum.photos')) {
        imageUrl = imageUrl.replace('/400/533', '/600/800');
    }
    
    image.src = imageUrl;
    image.alt = paper.title;
    image.style.transform = 'scale(1)';
    image.style.cursor = 'default';
    
    info.textContent = `${paper.title} - ${paper.date}`;
}

function setupImageDrag(image) {
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;
    
    image.addEventListener('mousedown', (e) => {
        const currentScale = parseFloat(image.style.transform.replace(/[^0-9.]/g, '') || 1);
        if (currentScale > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            image.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const currentScale = parseFloat(image.style.transform.replace(/[^0-9.]/g, '') || 1);
        if (currentScale <= 1) return;
        
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        
        const maxX = (image.clientWidth * currentScale - image.parentElement.clientWidth) / 2;
        const maxY = (image.clientHeight * currentScale - image.parentElement.clientHeight) / 2;
        
        translateX = Math.max(-maxX, Math.min(maxX, translateX));
        translateY = Math.max(-maxY, Math.min(maxY, translateY));
        
        image.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        const currentScale = parseFloat(image.style.transform.replace(/[^0-9.]/g, '') || 1);
        image.style.cursor = currentScale > 1 ? 'grab' : 'default';
    });
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
// EXPORTS GLOBAUX
// ==========================================
window.toggleUpdates = toggleUpdates;
window.showRatingModal = showRatingModal;
window.closeRatingModal = closeRatingModal;
window.submitRating = submitRating;
window.sharePromise = sharePromise;
window.resetFilters = resetFilters;
window.goToSlide = goToSlide;
window.openPhotoViewer = openPhotoViewer;
window.closePhotoViewer = closePhotoViewer;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.zoomReset = zoomReset;
window.prevPhoto = prevPhoto;
window.nextPhoto = nextPhoto;
window.togglePressZoom = togglePressZoom;
window.goToCarouselSlide = goToCarouselSlide;
window.shareToPlatform = shareToPlatform;
window.filterByStatus = function(status) {
    document.getElementById('filter-status').value = status;
    applyFilters();
};
