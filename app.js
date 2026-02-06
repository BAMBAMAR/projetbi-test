// Mode démo - activé si Supabase échoue
let DEMO_MODE = false;
// AJOUTER AVEC LES AUTRES VARIABLES GLOBALES

// Vérifier la connexion Supabase
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

// Appelez cette fonction après l'initialisation
setTimeout(checkSupabaseConnection, 1000);
// ==========================================
// APP.JS - VERSION CORRIGÉE POUR LES DÉLAIS
// ==========================================
// Configuration Supabase
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_joJuW7-vMiQG302_2Mvj5A_sVaD8Wap';
let supabaseClient = null;

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

const CONFIG = {
    START_DATE: new Date('2024-04-02'),
    END_DATE: new Date('2029-04-02'), // Fin du mandat
    CURRENT_DATE: new Date(),
    promises: [],
    news: [],
    press: [
        { id: '1', title: 'Le Soleil', date: '28/01/2026', image: 'https://picsum.photos/seed/soleil/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6d/Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg/200px-Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg.png' },
        { id: '2', title: 'Sud Quotidien', date: '28/01/2026', image: 'https://picsum.photos/seed/sud/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5b/Sud_Quotidien_logo.svg/200px-Sud_Quotidien_logo.svg.png' },
        { id: '3', title: 'Libération', date: '28/01/2026', image: 'liberation.jpg', logo: 'iconeliberation.jpg' },
        { id: '4', title: 'L\'Observateur', date: '28/01/2026', image: 'observateur.jpg', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/L%27Observateur_logo.svg/200px-L%27Observateur_logo.svg.png' },
        { id: '5', title: 'Le Quotidien', date: '28/01/2026', image: 'https://picsum.photos/seed/quotidien/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3c/Le_Quotidien_logo.svg/200px-Le_Quotidien_logo.svg.png' },
        { id: '6', title: 'WalFadjri', date: '28/01/2026', image: 'https://picsum.photos/seed/walfadjri/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7c/Walf_fadjri_logo.svg/200px-Walf_fadjri_logo.svg.png' }
    ],
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
    zooming: false,
    dragStartX: 0,
    dragStartY: 0,
    isDragging: false,
    currentRatingPromiseId: null,
    currentRatingValue: 0,
    // AJOUTEZ CETTE LIGNE À LA FIN :
    filteredPromises: []
};
// Variables pour le visualiseur photo
let currentZoom = 1;
let currentPhotoIndex = 0;

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
// FONCTION DE CONVERSION DES DÉLAIS TEXTE EN JOURS - CORRIGÉE
// ==========================================
function parseDelayToDays(delayText) {
    if (!delayText || delayText.trim() === '') return 365; // 1 an par défaut
    
    const lower = delayText.toLowerCase().trim();
    
    // CORRECTION: Dates trop éloignées
    if (lower.includes('2030')) {
        return 1825; // Fin du mandat (5 ans)
    }
    
    if (lower.includes('2029')) {
        return 1825; // Fin du mandat (5 ans)
    }
    
    // "Immédiat" = 0 jour
    if (lower.includes('immédiat') || lower.includes('immediat') || lower.includes('dès')) {
        return 0;
    }
    
    // "Mandat" ou "Quinquennat" = durée complète du mandat (5 ans)
    if (lower.includes('mandat') || lower.includes('quinquennat')) {
        return 1825; // 5 ans en jours
    }
    
    let totalDays = 0;
    
    // Années complètes
    const yearsMatch = lower.match(/(\d+)\s*an[s]?/i);
    if (yearsMatch) {
        const years = parseInt(yearsMatch[1], 10);
        totalDays += years * 365;
    }
    
    // Mois
    const monthsMatch = lower.match(/(\d+)\s*mois/i);
    if (monthsMatch) {
        const months = parseInt(monthsMatch[1], 10);
        totalDays += months * 30;
    }
    
    // Jours
    const daysMatch = lower.match(/(\d+)\s*jour[s]?/i);
    if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        totalDays += days;
    }
    
    // Expressions comme "6 premiers mois"
    const premiersMoisMatch = lower.match(/(\d+)\s*premiers?\s*mois/i);
    if (premiersMoisMatch) {
        const mois = parseInt(premiersMoisMatch[1], 10);
        totalDays += mois * 30;
    }
    
    // Expressions comme "3 premières années"
    const firstYearsMatch = lower.match(/(\d+)\s*premières?\s*années?/i);
    if (firstYearsMatch) {
        const years = parseInt(firstYearsMatch[1], 10);
        totalDays += years * 365;
    }
    
    // "2 premières années"
    if (lower.includes('2 premières années') || lower.includes('2 premières annees')) {
        totalDays = 730; // 2 ans exactement
    }
    
    // "1ère année"
    if (lower.includes('1ère année') || lower.includes('1ere annee') || lower.includes('1ère annee')) {
        totalDays = 365; // 1 an exactement
    }
    
    // "2 ans" (sans "premières")
    const ansSimpleMatch = lower.match(/(\d+)\s*ans$/i);
    if (ansSimpleMatch && !lower.includes('premières') && !lower.includes('premiere')) {
        const ans = parseInt(ansSimpleMatch[1], 10);
        totalDays = ans * 365;
    }
    
    // "2 à 3 ans" - prendre la moyenne
    const rangeMatch = lower.match(/(\d+)\s*à\s*(\d+)\s*an[s]?/i);
    if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10) * 365;
        const max = parseInt(rangeMatch[2], 10) * 365;
        totalDays = Math.round((min + max) / 2);
    }
    
    // "3 à 5 ans" - prendre la moyenne
    const longRangeMatch = lower.match(/(\d+)\s*à\s*(\d+)\s*an[s]?/i);
    if (longRangeMatch) {
        const min = parseInt(longRangeMatch[1], 10) * 365;
        const max = parseInt(longRangeMatch[2], 10) * 365;
        totalDays = Math.round((min + max) / 2);
    }
    
    // "5 à 10 ans" - prendre la moyenne mais limiter à 5 ans max
    const veryLongRangeMatch = lower.match(/5\s*à\s*10\s*an[s]?/i);
    if (veryLongRangeMatch) {
        totalDays = 1825; // Limiter à 5 ans max (durée du mandat)
    }
    
    // Dates spécifiques (format AAAA-MM-JJ)
    const dateMatch = delayText.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
        try {
            const targetDate = new Date(dateMatch[0]);
            const startDate = CONFIG.START_DATE;
            
            // Calculer la différence en jours
            const diffTime = targetDate.getTime() - startDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Ne pas retourner de valeurs négatives
            totalDays = Math.max(0, diffDays);
            
            // Limiter à la durée du mandat (5 ans max)
            totalDays = Math.min(totalDays, 1825);
            
        } catch (e) {
            console.warn('Erreur conversion date:', dateMatch[0]);
        }
    }
    
    // Si aucune correspondance, essayer de trouver un nombre simple
    if (totalDays === 0) {
        const num = parseInt(delayText.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) {
            // Si c'est juste un nombre, supposer que c'est des années
            totalDays = num * 365;
        } else {
            totalDays = 365; // 1 an par défaut
        }
    }
    
    // LIMITER À LA DURÉE MAXIMALE DU MANDAT (5 ans = 1825 jours)
    const MANDAT_MAX_DAYS = 1825;
    const result = Math.min(totalDays, MANDAT_MAX_DAYS);
    
    console.log(`parseDelayToDays: "${delayText}" → ${result} jours`);
    return result;
}

// ==========================================
// FONCTION POUR CALCULER LES JOURS RESTANTS (AVEC SIGNE) - CORRIGÉE
// ==========================================
function getDaysRemaining(deadline) {
    if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) {
        console.warn('Date limite invalide pour getDaysRemaining:', deadline);
        return 0;
    }
    
    const diff = deadline.getTime() - CONFIG.CURRENT_DATE.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    // Retourne:
    // - Positif: jours restants avant échéance
    // - Négatif: jours de retard
    // - 0: échéance aujourd'hui
    return days;
}

// ==========================================
// FONCTION POUR FORMATER LES JOURS RESTANTS/RETARD
// ==========================================
function formatDaysRemaining(days) {
    if (days > 0) {
        // Jours restants avant échéance
        return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
    } else if (days < 0) {
        // En retard
        const absDays = Math.abs(days);
        return `${absDays} jour${absDays > 1 ? 's' : ''} de retard`;
    } else {
        // Échéance aujourd'hui
        return 'Aujourd\'hui';
    }
}

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    
    // 1. Initialiser les composants UI
    initNavigation();
    initScrollEffects();
    initFilters();
    initDateDisplay();
    initPhotoViewer();

    // 2. Charger les données
    await loadData();
    
    // 3. IMPORTANT: Initialiser filteredPromises après chargement
    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = Math.min(CONFIG.visibleCount, CONFIG.promises.length);

    // 4. Rendre les données
    renderAll();
    renderNewsImproved();
    if (typeof renderNewspapers === 'function') {
        renderNewspapers();
    }
    
    // 5. Configurer les composants
    setupPressCarousel();
    setupServiceRatings();
    setupDailyPromise();
    setupPromisesCarousel();
    setupKpiCarousel();
    
    // 6. Initialiser les étoiles
    initStarRatings();
    
    // 7. Initialiser le visualiseur photo
    setTimeout(() => {
        if (typeof setupPhotoViewerControls === 'function') {
            setupPhotoViewerControls();
        }
    }, 500);
});
// NAVIGATION - VERSION MODERNE
// ==========================================
function initNavigation() {
    // Nouveau menu moderne
    const modernHamburger = document.getElementById('modernHamburger');
    const modernMenu = document.getElementById('modernMenu');
    const modernLinks = document.querySelectorAll('.modern-link');

    // 1. GESTION DU MENU HAMBURGER
    if (modernHamburger && modernMenu) {
        modernHamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            modernHamburger.classList.toggle('active');
            modernMenu.classList.toggle('active');
        });
    }

    // 2. NAVIGATION FONCTIONNELLE
    modernLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            const target = document.getElementById(targetId);

            if (target) {
                // Scroll smooth vers la section
                const offset = 80;
                const targetPosition = target.offsetTop - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Fermer le menu mobile si ouvert
                if (modernMenu && modernMenu.classList.contains('active')) {
                    modernMenu.classList.remove('active');
                    modernHamburger.classList.remove('active');
                }
            }
        });
    });

    // 3. FERMER LE MENU EN CLIQUANT EN DEHORS
    document.addEventListener('click', (e) => {
        if (modernMenu && modernHamburger) {
            const modernNav = document.getElementById('modernNav');
            if (modernNav && !modernNav.contains(e.target) && modernMenu.classList.contains('active')) {
                modernMenu.classList.remove('active');
                modernHamburger.classList.remove('active');
            }
        }
    });

    // 4. GESTION DU SCROLL POUR ACTIVER LES LIENS
    window.addEventListener('scroll', debounce(() => {
        let current = '';
        const sections = document.querySelectorAll('section[id]');

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= (sectionTop - 100)) {
                current = section.getAttribute('id');
            }
        });

        modernLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, 100));
}

// Fonction debounce pour optimiser les performances
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
// FONCTIONS UTILITAIRES POUR LE LOCALSTORAGE
// ==========================================

function safeSetItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn('⚠️ localStorage bloqué - stockage temporaire en mémoire:', error.message);
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
        console.warn('⚠️ localStorage bloqué - récupération depuis mémoire:', error.message);
        if (window.tempStorage && window.tempStorage[key]) {
            return window.tempStorage[key];
        }
        return defaultValue;
    }
}

// ==========================================
// CHARGEMENT DES DONNÉES - VERSION CORRIGÉE
// ==========================================

async function loadData() {
    try {
        console.log('📥 Début du chargement des données...');
        
        // Charger les promesses
        await loadPromisesData();
        
        // Charger la presse (async)
        await loadPressData();
        
        // Charger les actualités (async)
        await loadNewsData();
        
        // Charger les votes publics (avec délai)
        setTimeout(() => {
            fetchAndDisplayPublicVotes().catch(error => {
                console.warn('⚠️ Impossible de charger les votes:', error.message);
            });
        }, 1000);
        
        // Rendre tout
        renderAll();
        renderNewsImproved();
        if (typeof renderNewspapers === 'function') {
            renderNewspapers();
        }
        
        console.log('✅ Toutes les données chargées avec succès');
        
    } catch (error) {
        console.error('❌ Erreur chargement général:', error);
        showNotification('Erreur de chargement des données', 'error');
        CONFIG.promises = generateTestPromises();
        CONFIG.press = getDefaultPressData();
        if (typeof renderAll === 'function') {
            renderAll();
        }
    }
}

// Fonction séparée pour charger les promesses
async function loadPromisesData() {
    try {
        const response = await fetch('promises.json');
        
        if (!response.ok) {
            console.warn('Fichier promises.json non trouvé - utilisation des données de test');
            CONFIG.promises = generateTestPromises();
            return;
        }
        
        const data = await response.json();
        
        // Récupérer la date de début depuis le JSON
        if (data.start_date) {
            CONFIG.START_DATE = new Date(data.start_date);
            CONFIG.END_DATE = new Date(CONFIG.START_DATE);
            CONFIG.END_DATE.setFullYear(CONFIG.END_DATE.getFullYear() + 5); // 5 ans après
        }
        
        // Traiter les promesses
        CONFIG.promises = (data.promises || []).map(p => {
            // Normaliser le statut
            let status = 'Non lancé';
            if (p.status) {
                const statusLower = p.status.toLowerCase();
                if (statusLower.includes('realise') || statusLower.includes('réalisé')) {
                    status = 'Réalisé';
                } else if (statusLower.includes('cours') || statusLower.includes('encours')) {
                    status = 'En cours';
                } else if (statusLower.includes('retard')) {
                    status = 'En retard';
                } else if (statusLower.includes('lancé') || statusLower.includes('lance')) {
                    status = 'Non lancé';
                }
            }
            
            // Normaliser le domaine
            const domain = p.domaine || p.domain || p.categorie || 'Autre';
            
            // Convertir le délai en jours
            let delayText = p.delai || '12 premiers mois';
            let delayDays = parseDelayToDays(delayText);
            
            // S'assurer que delayDays est un nombre valide
            if (isNaN(delayDays) || delayDays < 0) {
                delayDays = 365;
            }
            
            // Calculer la date limite
            const deadline = calculateDeadlineFromDays(delayDays);
            
            // Vérifier si en retard
            const isLate = checkIfLate(status, deadline);
            
            // Normaliser les mises à jour
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
        
        // Corriger les délais invalides
        fixInvalidDelays();
        
        // Trier les promesses
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

// Fonction séparée pour charger la presse
async function loadPressData() {
    try {
        console.log('📰 Chargement des données presse...');
        const pressResponse = await fetch('press.json?v=' + Date.now());
        
        if (!pressResponse.ok) {
            console.warn('Fichier press.json non trouvé - données de presse par défaut');
            CONFIG.press = getDefaultPressData();
            return;
        }
        
        const pressData = await pressResponse.json();
        
        if (pressData && Array.isArray(pressData.press)) {
            // Trier par date (les plus récents d'abord)
            CONFIG.press = pressData.press.sort((a, b) => {
                try {
                    const dateA = new Date(a.date.split('/').reverse().join('-'));
                    const dateB = new Date(b.date.split('/').reverse().join('-'));
                    return dateB - dateA;
                } catch {
                    return 0;
                }
            });
            
            console.log(`✅ ${CONFIG.press.length} journaux chargés depuis press.json`);
        } else {
            console.warn('Format press.json invalide - données par défaut');
            CONFIG.press = getDefaultPressData();
        }
        
    } catch (pressError) {
        console.error('❌ Erreur chargement presse:', pressError);
        CONFIG.press = getDefaultPressData();
    }
}

// Fonction séparée pour charger les actualités
async function loadNewsData() {
    try {
        console.log('📰 Chargement des actualités...');
        const newsResponse = await fetch('news.json?v=' + Date.now());
        
        if (!newsResponse.ok) {
            console.warn('Fichier news.json non trouvé - données de démonstration');
            CONFIG.news = [
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
            return;
        }
        
        const newsData = await newsResponse.json();
        
        if (newsData && Array.isArray(newsData.news)) {
            CONFIG.news = newsData.news;
            console.log(`✅ ${CONFIG.news.length} actualités chargées depuis news.json`);
        } else {
            console.warn('Format news.json invalide - données par défaut');
            CONFIG.news = [
                { 
                    id: '1', 
                    title: 'Lancement officiel de la plateforme', 
                    excerpt: 'La plateforme citoyenne de suivi des engagements est désormais opérationnelle.', 
                    date: '25/01/2026', 
                    source: 'Le Soleil', 
                    image: 'school' 
                }
            ];
        }
        
    } catch (newsError) {
        console.error('❌ Erreur chargement actualités:', newsError);
        CONFIG.news = [
            { 
                id: '1', 
                title: 'Lancement officiel de la plateforme', 
                excerpt: 'La plateforme citoyenne de suivi des engagements est désormais opérationnelle.', 
                date: '25/01/2026', 
                source: 'Le Soleil', 
                image: 'school' 
            }
        ];
    }
}

// ==========================================
// CORRECTION DES FONCTIONS UTILISANT localStorage
// ==========================================

// Dans saveVoteToSupabase()
async function saveVoteToSupabase(promiseId, rating, comment = '') {
    if (!supabaseClient) {
        showNotification('Mode démo : Vote enregistré localement', 'info');
        // Mode fallback - stocker localement
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
        
        console.log('Envoi du vote:', voteData);
        
        const { error } = await supabaseClient
            .from('votes')
            .insert([voteData]);
        
        if (error) {
            console.error('Erreur Supabase:', error);
            
            // Mode fallback - stocker localement
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
        
        // Recharger les votes après un délai
        setTimeout(() => fetchAndDisplayPublicVotes(), 500);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde vote:', error);
        showNotification('Mode démo : Vote enregistré localement', 'info');
    }
}

// Dans saveRatingLocally()
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

// Dans fetchAndDisplayPublicVotes() ou processVotes()
function processVotes(votes) {
    const votesMap = {};
    
    // D'abord, ajouter les votes de Supabase
    votes.forEach(vote => {
        if (!votesMap[vote.promise_id]) {
            votesMap[vote.promise_id] = { sum: 0, count: 0 };
        }
        votesMap[vote.promise_id].sum += vote.rating;
        votesMap[vote.promise_id].count += 1;
    });
    
    // Ajouter les votes locaux
    const localVotes = safeGetItem('promise_votes', []);
    localVotes.forEach(vote => {
        if (!votesMap[vote.promise_id]) {
            votesMap[vote.promise_id] = { sum: 0, count: 0 };
        }
        votesMap[vote.promise_id].sum += vote.rating;
        votesMap[vote.promise_id].count += 1;
    });
    
    // Mettre à jour les promesses
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

// Générer des données de test adaptées à votre structure
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

// ==========================================
// CALCULS - CORRIGÉS
// ==========================================
function calculateDeadlineFromDays(days) {
    // Garantir que days est un nombre positif
    const daysNum = Math.max(0, parseInt(days, 10) || 0);
    
    const deadline = new Date(CONFIG.START_DATE);
    
    // Si le délai est 0 (immédiat), date limite = date de début
    if (daysNum === 0) {
        return deadline;
    }
    
    // Ajouter les jours
    deadline.setDate(deadline.getDate() + daysNum);
    
    // Ne jamais dépasser la fin du mandat (5 ans après le début)
    if (deadline > CONFIG.END_DATE) {
        return new Date(CONFIG.END_DATE);
    }
    
    return deadline;
}

function checkIfLate(status, deadline) {
    if (status === 'Réalisé') return false;
    
    // Vérifier que la date limite est valide
    if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) {
        return false;
    }
    
    // Une promesse est en retard si la date actuelle dépasse la date limite
    return CONFIG.CURRENT_DATE > deadline;
}

// ==========================================
// FONCTION POUR CORRIGER LES DÉLAIS INVALIDES
// ==========================================
function fixInvalidDelays() {
    console.log('🔧 Correction des délais invalides...');
    let corrections = 0;
    
    CONFIG.promises.forEach(promise => {
        const currentDelay = parseInt(promise.delai);
        
        // Si délai > 5 ans (1825 jours), le corriger
        if (currentDelay > 1825) {
            console.log(`Correction: ${promise.id} - ${promise.engagement.substring(0, 50)}...`);
            console.log(`  Ancien délai: ${currentDelay} jours (${Math.round(currentDelay/365)} années)`);
            
            // Nouveau délai = max 5 ans (durée du mandat)
            promise.delai = '1825';
            promise.delai_texte = 'Quinquennat';
            
            // Recalculer la date limite
            promise.deadline = calculateDeadlineFromDays(1825);
            
            // Recalculer si en retard
            promise.isLate = checkIfLate(promise.status, promise.deadline);
            
            console.log(`  Nouveau délai: 1825 jours (5 années)`);
            console.log(`  Nouvelle date limite: ${formatDate(promise.deadline)}`);
            corrections++;
        }
    });
    
    if (corrections > 0) {
        console.log(`✅ ${corrections} délais corrigés`);
    } else {
        console.log('✅ Aucun délai invalide trouvé');
    }
}

// ==========================================
// PROMESSE DU JOUR - FORMAT JOURNAL
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
// RENDER ALL
// ==========================================
function renderAll() {
    console.log('renderAll: Rendering', CONFIG.promises.length, 'promises');
    
    // Initialiser filteredPromises si vide
    if (!CONFIG.filteredPromises || CONFIG.filteredPromises.length === 0) {
        CONFIG.filteredPromises = [...CONFIG.promises];
    }
    
    // Mettre à jour les statistiques
    updateStats();
    
    // Rendre les promesses initiales
    const initialCount = Math.min(CONFIG.visibleCount, CONFIG.filteredPromises.length);
    renderPromises(CONFIG.filteredPromises.slice(0, initialCount));
    
    // Mettre à jour le compteur
    updateResultsCount(CONFIG.filteredPromises.length);
    
    // Mettre à jour les boutons
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (CONFIG.filteredPromises.length > CONFIG.visibleCount) {
        if (showMoreBtn) showMoreBtn.style.display = 'inline-flex';
        if (showLessBtn) showLessBtn.style.display = 'none';
    } else {
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        if (showLessBtn) showLessBtn.style.display = 'none';
    }
    
    // Remplir le filtre de domaine
    populateDomainFilter();
}

// ==========================================
// UPDATE STATS - VERSION CORRIGÉE
// ==========================================
    function updateStats() {
 const total = CONFIG.promises.length;
    
    // Logique CORRIGÉE pour le comptage :
    const realise = CONFIG.promises.filter(p => 
        p.status === 'Réalisé' && !p.isLate
    ).length;
    
    const encours = CONFIG.promises.filter(p => 
        p.status === 'En cours' && !p.isLate
    ).length;
    
    const nonLance = CONFIG.promises.filter(p => 
        p.status === 'Non lancé' && !p.isLate
    ).length;
    
    // Les retards sont séparés
    const retard = CONFIG.promises.filter(p => p.isLate).length;
    const withUpdates = CONFIG.promises.filter(p => p.updates && p.updates.length > 0).length;
    const tauxRealisation = total > 0 ? Math.round((realise / total) * 100) : 0;
    
    // ============= CALCUL DU Retard moyen CORRIGÉ =============
    
    // 1. Filtrer seulement les promesses NON RÉALISÉES et NON EN RETARD
    const promisesNonRealiseesNonRetard = CONFIG.promises.filter(p => 
        p.status !== 'Réalisé' && !p.isLate
    );
    
    let avgDelay = 0;
    
    if (promisesNonRealiseesNonRetard.length > 0) {
        // Calculer la somme des jours restants
        let totalDaysRemaining = 0;
        let validPromisesCount = 0;
        
        promisesNonRealiseesNonRetard.forEach(promise => {
            const daysRemaining = getDaysRemaining(promise.deadline);
            
            // Ignorer les valeurs aberrantes (trop grandes)
            if (daysRemaining >= 0 && daysRemaining <= 1825) { // Max 5 ans
                totalDaysRemaining += daysRemaining;
                validPromisesCount++;
            }
        });
        
        if (validPromisesCount > 0) {
            avgDelay = Math.round(totalDaysRemaining / validPromisesCount);
        }
    }
    
    // ============= CALCUL DU RETARD MOYEN =============
    
    const promisesEnRetard = CONFIG.promises.filter(p => p.isLate);
    let avgRetard = 0;
    
    if (promisesEnRetard.length > 0) {
        const totalRetard = promisesEnRetard.reduce((sum, p) => {
            const daysRemaining = getDaysRemaining(p.deadline);
            return sum + Math.abs(daysRemaining);
        }, 0);
        
        avgRetard = Math.round(totalRetard / promisesEnRetard.length);
    }
    
    // ============= NOTE MOYENNE PUBLIQUE =============
    
    const allRatings = CONFIG.promises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    const totalVotes = allRatings.reduce((sum, p) => sum + p.publicCount, 0);
    
    // ============= MISE À JOUR DES KPIs =============
    
    KPI_ITEMS[0].value = total;
    KPI_ITEMS[1].value = realise;
    KPI_ITEMS[2].value = encours;
    KPI_ITEMS[3].value = retard;
    KPI_ITEMS[4].value = `${tauxRealisation}%`;
    
    // Choisir quoi afficher comme KPI[5]
    if (retard > 0) {
        // S'il y a des retards, afficher le retard moyen
        KPI_ITEMS[5].value = `${avgRetard}j`;
        KPI_ITEMS[5].label = '⚠️ Retard Moyen';
        KPI_ITEMS[5].icon = '⚠️';
    } else if (avgDelay > 0) {
        // Sinon, afficher le Retard moyen
        KPI_ITEMS[5].value = `${avgDelay}j`;
        KPI_ITEMS[5].label = '⏱️ Retard moyen';
        KPI_ITEMS[5].icon = '⏱️';
    } else {
        // Cas spécial (toutes réalisées)
        KPI_ITEMS[5].value = 'N/A';
        KPI_ITEMS[5].label = '⏱️ Retard moyen';
        KPI_ITEMS[5].icon = '⏱️';
    }
    
    KPI_ITEMS[6].value = avgRating;
    KPI_ITEMS[7].value = withUpdates;
    
    // ============= MISE À JOUR DES STATISTIQUES =============
    
    updateStatValue('total', total);
    updateStatValue('realise', realise);
    updateStatValue('encours', encours);
    updateStatValue('non-lance', nonLance);
    updateStatValue('retard', retard);
    updateStatValue('avec-maj', withUpdates);
    updateStatValue('taux-realisation', `${tauxRealisation}%`);
    updateStatValue('moyenne-notes', avgRating);
    updateStatValue('votes-total', `${totalVotes.toLocaleString('fr-FR')} votes`);
    
    // Afficher correctement le Retard moyen
    if (retard > 0) {
        updateStatValue('delai-moyen', `${avgRetard}j `);
    } else if (avgDelay > 0) {
        updateStatValue('delai-moyen', `${avgDelay}j restants en moyenne`);
    } else {
        updateStatValue('delai-moyen', 'N/A');
    }
    
    // Pourcentage
    updateStatPercentage('total-percentage', total, total);
    updateStatPercentage('realise-percentage', realise, total);
    updateStatPercentage('encours-percentage', encours, total);
    updateStatPercentage('non-lance-percentage', nonLance, total);
    updateStatPercentage('retard-percentage', retard, total);
    updateStatPercentage('avec-maj-percentage', withUpdates, total);
    
    // Domaines
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

    // Événements de filtrage
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

    // BOUTONS AFFICHER PLUS/MOINS
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            console.log('Afficher plus cliqué');
            CONFIG.currentVisible = CONFIG.filteredPromises.length;
            renderPromises(CONFIG.filteredPromises);
            showMoreBtn.style.display = 'none';
            if (showLessBtn) showLessBtn.style.display = 'inline-flex';
        });
    }

    if (showLessBtn) {
        showLessBtn.addEventListener('click', () => {
            console.log('Afficher moins cliqué');
            CONFIG.currentVisible = CONFIG.visibleCount;
            renderPromises(CONFIG.filteredPromises.slice(0, CONFIG.currentVisible));
            showLessBtn.style.display = 'none';
            if (showMoreBtn) showMoreBtn.style.display = 'inline-flex';
        });
        // Caché par défaut
        showLessBtn.style.display = 'none';
    }
    
    // Initialiser le filtre de domaine
    populateDomainFilter();
}

function resetFilters() {
    console.log('Réinitialisation des filtres');
    
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-domain').value = '';
    document.getElementById('filter-search').value = '';
    
    // Réinitialiser à toutes les promesses
    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = CONFIG.visibleCount;
    
    // Rendre toutes les promesses
    renderPromises(CONFIG.filteredPromises.slice(0, CONFIG.currentVisible));
    updateResultsCount(CONFIG.filteredPromises.length);
    
    // Mettre à jour les boutons
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (CONFIG.promises.length > CONFIG.visibleCount) {
        if (showMoreBtn) showMoreBtn.style.display = 'inline-flex';
        if (showLessBtn) showLessBtn.style.display = 'none';
    } else {
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        if (showLessBtn) showLessBtn.style.display = 'none';
    }
    
    showNotification('Filtres réinitialisés');
}

// Fonction debounce pour la recherche
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

function resetFilters() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-domain').value = '';
    document.getElementById('filter-search').value = '';
    
    // Réinitialiser à toutes les promesses
    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = CONFIG.visibleCount;
    
    updateFilteredDisplay();
    
    // Réinitialiser les boutons
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (CONFIG.promises.length > CONFIG.visibleCount) {
        if (showMoreBtn) showMoreBtn.style.display = 'inline-flex';
        if (showLessBtn) showLessBtn.style.display = 'none';
    } else {
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        if (showLessBtn) showLessBtn.style.display = 'none';
    }
}
function applyFilters() {
    const filterStatus = document.getElementById('filter-status')?.value || '';
    const filterDomain = document.getElementById('filter-domain')?.value || '';
    const filterSearch = document.getElementById('filter-search')?.value.toLowerCase() || '';
    
    console.log('Filtrage avec:', { filterStatus, filterDomain, filterSearch });
    
    // Utiliser toutes les promesses comme base
    let filtered = CONFIG.promises;
    
    // 1. FILTRAGE PAR STATUT - LOGIQUE CORRIGÉE
    if (filterStatus) {
        console.log('Filtre statut:', filterStatus);
        
        if (filterStatus === 'En retard') {
            // Seulement les promesses EN RETARD
            filtered = filtered.filter(promise => promise.isLate === true);
        } 
        else if (filterStatus === '✅ Réalisé') {
            // Seulement les promesses RÉALISÉES (et NON en retard)
            filtered = filtered.filter(promise => 
                promise.status === 'Réalisé' && promise.isLate === false
            );
        } 
        else if (filterStatus === '🔄 En cours') {
            // Seulement les promesses EN COURS (et NON en retard)
            filtered = filtered.filter(promise => 
                promise.status === 'En cours' && promise.isLate === false
            );
        } 
        else if (filterStatus === '⏳ Non lancé') {
            // Seulement les promesses NON LANCÉES (et NON en retard)
            filtered = filtered.filter(promise => 
                promise.status === 'Non lancé' && promise.isLate === false
            );
        }
    }
    
    // 2. FILTRAGE PAR DOMAINE
    if (filterDomain && filterDomain !== '') {
        console.log('Filtre domaine:', filterDomain);
        filtered = filtered.filter(promise => promise.domain === filterDomain);
    }
    
    // 3. FILTRAGE PAR RECHERCHE
    if (filterSearch) {
        console.log('Filtre recherche:', filterSearch);
        filtered = filtered.filter(promise => 
            promise.engagement.toLowerCase().includes(filterSearch) ||
            (promise.domain || '').toLowerCase().includes(filterSearch) ||
            (promise.resultat || '').toLowerCase().includes(filterSearch)
        );
    }
    
    console.log('Résultat filtre:', filtered.length, 'promesses');
    
    // Stocker le résultat
    CONFIG.filteredPromises = filtered;
    
    // Mettre à jour l'affichage
    updateFilteredDisplay();
}
function updateFilteredDisplay() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    console.log('updateFilteredDisplay:', CONFIG.filteredPromises.length, 'promesses');
    
    // Toujours montrer "Afficher plus" s'il y a plus d'éléments
    if (CONFIG.filteredPromises.length > CONFIG.visibleCount) {
        CONFIG.currentVisible = CONFIG.visibleCount;
        if (showMoreBtn) showMoreBtn.style.display = 'inline-flex';
        if (showLessBtn) showLessBtn.style.display = 'none';
    } else {
        CONFIG.currentVisible = CONFIG.filteredPromises.length;
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        if (showLessBtn) showLessBtn.style.display = 'none';
    }
    
    // Rendre les promesses
    renderPromises(CONFIG.filteredPromises.slice(0, CONFIG.currentVisible));
    updateResultsCount(CONFIG.filteredPromises.length);
}

function updateFilteredDisplay() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    // Déterminer combien de promesses afficher
    if (CONFIG.filteredPromises.length > CONFIG.visibleCount) {
        CONFIG.currentVisible = CONFIG.visibleCount;
        if (showMoreBtn) showMoreBtn.style.display = 'inline-flex';
        if (showLessBtn) showLessBtn.style.display = 'none';
    } else {
        CONFIG.currentVisible = CONFIG.filteredPromises.length;
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        if (showLessBtn) showLessBtn.style.display = 'none';
    }
    
    // Rendre les promesses
    renderPromises(CONFIG.filteredPromises.slice(0, CONFIG.currentVisible));
    updateResultsCount(CONFIG.filteredPromises.length);
}
// Modifier la fonction pour "Afficher plus"
function showMorePromises() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    CONFIG.currentVisible = CONFIG.filteredPromises.length;
    renderPromises(CONFIG.filteredPromises);
    
    showMoreBtn.style.display = 'none';
    showLessBtn.style.display = 'inline-flex';
}

// Modifier la fonction pour "Afficher moins"
function showLessPromises() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    CONFIG.currentVisible = CONFIG.visibleCount;
    renderPromises(CONFIG.filteredPromises.slice(0, CONFIG.currentVisible));
    
    showLessBtn.style.display = 'none';
    showMoreBtn.style.display = 'inline-flex';
}

function resetFilters() {
    const filterStatus = document.getElementById('filter-status');
    const filterDomain = document.getElementById('filter-domain');
    const filterSearch = document.getElementById('filter-search');
    
    if (filterStatus) filterStatus.value = '';
    if (filterDomain) filterDomain.value = '';
    if (filterSearch) filterSearch.value = '';

    CONFIG.currentVisible = CONFIG.visibleCount;
    renderPromises(CONFIG.promises.slice(0, CONFIG.currentVisible));
    updateResultsCount(CONFIG.promises.length);
}

function updateResultsCount(count) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `${count} engagement(s) trouvé(s)`;
    }
}

function populateDomainFilter() {
    const filterDomain = document.getElementById('filter-domain');
    if (!filterDomain) return;
    
    const domains = [...new Set(CONFIG.promises.map(p => p.domain || 'Autre'))].filter(d => d !== 'Autre');
    domains.sort();

    filterDomain.innerHTML = '<option value="">Tous les domaines</option>' +
        domains.map(domain => `<option value="${domain}">${domain}</option>`).join('') +
        '<option value="Autre">Autre</option>';
}

// ==========================================
// RENDER PROMISES - AVEC ICÔNES PARTAGE/NOTATION
// ==========================================
function renderPromises(promises) {
    const grid = document.getElementById('promisesGrid');
    if (!grid) return;
    
    console.log('renderPromises: Rendering', promises.length, 'promises');
    
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
                        <!-- FORCER LES COULEURS AVEC STYLE INLINE -->
                        <button class="social-btn fb" onclick="shareToPlatform('${promise.id}', 'facebook')" 
                                title="Partager sur Facebook"
                                style="background-color: #3b5998 !important; border: none !important;">
                            <i class="fab fa-facebook-f" style="color: white !important;"></i>
                        </button>
                        <button class="social-btn tw" onclick="shareToPlatform('${promise.id}', 'twitter')" 
                                title="Partager sur Twitter"
                                style="background-color: #000000 !important; border: none !important;">
                            <i class="fab fa-x-twitter" style="color: white !important;"></i>
                        </button>
                        <button class="social-btn wa" onclick="shareToPlatform('${promise.id}', 'whatsapp')" 
                                title="Partager sur WhatsApp"
                                style="background-color: #25D366 !important; border: none !important;">
                            <i class="fab fa-whatsapp" style="color: white !important;"></i>
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
    
    // FORCER LA VISIBILITÉ DES BOUTONS APRÈS RENDU
    setTimeout(() => {
        forceSocialButtonsColors();
    }, 100);
}

// NOUVELLE FONCTION POUR FORCER LES COULEURS
function forceSocialButtonsColors() {
    const socialButtons = document.querySelectorAll('.social-btn');
    
    socialButtons.forEach(btn => {
        // Retirer toutes les classes qui pourraient écraser les couleurs
        btn.className = 'social-btn';
        
        // Ajouter la classe spécifique
        if (btn.innerHTML.includes('fa-facebook')) {
            btn.classList.add('fb');
            btn.style.cssText = `
                background-color: #3b5998 !important;
                color: white !important;
                border: none !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
        } else if (btn.innerHTML.includes('fa-x-twitter') || btn.innerHTML.includes('fa-twitter')) {
            btn.classList.add('tw');
            btn.style.cssText = `
                background-color: #000000 !important;
                color: white !important;
                border: none !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
        } else if (btn.innerHTML.includes('fa-whatsapp')) {
            btn.classList.add('wa');
            btn.style.cssText = `
                background-color: #25D366 !important;
                color: white !important;
                border: none !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
        }
    });
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

function formatDate(dateInput) {
    let date;
    if (!dateInput) return 'Date inconnue';
    
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
        // Essayer de parser la date au format DD/MM/YYYY
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
        
        // Essayer le format standard
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        
        return dateInput; // Retourner la chaîne originale si elle ne peut pas être parsée
    } catch (error) {
        return dateInput;
    }
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
    return stars;
}

// ==========================================
// MODAL DE NOTATION DES PROMESSES
// ==========================================
function showRatingModal(promiseId) {
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    CONFIG.currentRatingPromiseId = promiseId;
    CONFIG.currentRatingValue = 0;
    
    // Créer le modal de notation
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
                    <textarea 
                        id="ratingComment" 
                        placeholder="Partagez votre avis sur cet engagement..."
                        rows="3"></textarea>
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
    
    // Initialiser les étoiles
    const stars = modal.querySelectorAll('#ratingStars i');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            CONFIG.currentRatingValue = value;
            updateStars(stars, value);
            modal.querySelector('.btn-submit-rating').disabled = false;
            
            const labels = [
                'Mauvais',
                'Passable',
                'Bon',
                'Très bon',
                'Excellent'
            ];
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
        setTimeout(() => {
            modal.remove();
        }, 300);
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
        
        if (isHover) {
            star.style.transform = 'scale(1.1)';
        } else {
            star.style.transform = 'scale(1)';
        }
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
        // Mode fallback - stocker localement
        const votes = JSON.parse(localStorage.getItem('promise_votes') || '[]');
        votes.push({
            id: Date.now().toString(),
            promise_id: promiseId,
            rating: rating,
            comment: comment,
            created_at: new Date().toISOString()
        });
        localStorage.setItem('promise_votes', JSON.stringify(votes));
        return;
    }
    
    try {
        const voteData = { 
            promise_id: promiseId, 
            rating: rating,
            comment: comment,
            created_at: new Date().toISOString()
        };
        
        console.log('Envoi du vote:', voteData);
        
        const { error } = await supabaseClient
            .from('votes')
            .insert([voteData]);
        
        if (error) {
            console.error('Erreur Supabase:', error);
            
            // Mode fallback - stocker localement
            const votes = JSON.parse(localStorage.getItem('promise_votes') || '[]');
            votes.push({
                id: Date.now().toString(),
                promise_id: promiseId,
                rating: rating,
                comment: comment,
                created_at: new Date().toISOString()
            });
            localStorage.setItem('promise_votes', JSON.stringify(votes));
            
            showNotification('Vote enregistré localement (mode démo)', 'info');
        } else {
            showNotification('Merci pour votre vote !', 'success');
        }
        
        // Recharger les votes après un délai
        setTimeout(() => fetchAndDisplayPublicVotes(), 500);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde vote:', error);
        showNotification('Mode démo : Vote enregistré localement', 'info');
    }
}

// ==========================================
// RENDER NEWS
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
// RENDER NEWSPAPERS
// ==========================================

async function renderNewspapers() {
    const grid = document.getElementById('newspapersGrid');
    if (!grid) return;
    
    // Vérifier les images disponibles
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

// ==========================================
// CONFIGURATION PRESSE - AVEC VOS FICHIERS
// ==========================================

// Données par défaut si press.json n'est pas chargé
const DEFAULT_PRESS = [
    {
        id: '1',
        title: 'Le Soleil',
        date: '31/01/2024',
        image: 'revuedepresse/lesoleil.jpg',
        logo: 'images/logos/le_soleil.png',
        link: 'http://www.lesoleil.sn/'
    },
    {
        id: '2',
        title: 'Sud Quotidien',
        date: '31/01/2024',
        image: 'revuedepresse/sudquotidien.jpg',
        logo: 'images/logos/sud_quotidien.png',
        link: 'http://www.sudonline.sn/'
    },
    {
        id: '3',
        title: 'Libération',
        date: '31/01/2024',
        image: 'revuedepresse/liberation.jpg',
        logo: 'images/logos/liberation.png',
        link: 'http://www.liberation.sn/'
    },
    {
        id: '4',
        title: 'L\'Observateur',
        date: '31/01/2024',
        image: 'revuedepresse/observateur.jpg',
        logo: 'images/logos/observateur.png',
        link: 'http://www.observateur.sn/'
    },
    {
        id: '5',
        title: 'Le Quotidien',
        date: '31/01/2024',
        image: 'revuedepresse/lequotidien.jpg',
        logo: 'images/logos/le_quotidien.png',
        link: 'http://www.lequotidien.sn/'
    },
    {
        id: '6',
        title: 'Rewmi Sport',
        date: '31/01/2024',
        image: 'revuedepresse/rewmisport.jpg',
        logo: 'images/logos/rewmi_sport.png',
        link: '#'
    },
    {
        id: '7',
        title: 'Solo Quotidien',
        date: '31/01/2024',
        image: 'revuedepresse/soloquotidien.jpg',
        logo: 'images/logos/solo_quotidien.png',
        link: '#'
    },
    {
        id: '8',
        title: 'Yoor Yoor',
        date: '31/01/2024',
        image: 'revuedepresse/yooryoor.jpg',
        logo: 'images/logos/yooryoor.png',
        link: '#'
    },
    {
        id: '9',
        title: 'Record',
        date: '31/01/2024',
        image: 'revuedepresse/record.jpg',
        logo: 'images/logos/record.png',
        link: '#'
    },
    {
        id: '10',
        title: 'Enquete',
        date: '31/01/2024',
        image: 'revuedepresse/enquete.jpg',
        logo: 'images/logos/enquete.png',
        link: '#'
    }
];

let PRESS_DATA = [...DEFAULT_PRESS];

// ==========================================
// CHARGEMENT DES DONNÉES PRESSE
// ==========================================

async function loadPressData() {
    console.log('📰 Chargement des données presse depuis revuedepresse/...');
    
    try {
        // Essayer de charger depuis press.json
        const response = await fetch('press.json?v=' + Date.now());
        
        if (!response.ok) {
            console.warn('Fichier press.json non trouvé - utilisation des chemins par défaut');
            PRESS_DATA = DEFAULT_PRESS;
            return;
        }
        
        const data = await response.json();
        
        // Vérifier et utiliser les données
        if (data && Array.isArray(data.press)) {
            PRESS_DATA = data.press;
            console.log(`✅ ${PRESS_DATA.length} journaux chargés depuis press.json`);
        } else {
            console.warn('Format press.json invalide - utilisation chemins par défaut');
            PRESS_DATA = DEFAULT_PRESS;
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement presse:', error);
        PRESS_DATA = DEFAULT_PRESS;
    }
}

// ==========================================
// FONCTION POUR DÉTECTER LES IMAGES DISPONIBLES
// ==========================================

async function checkAvailableNewspapers() {
    const availablePapers = [];
    
    // Liste de vos fichiers existants
    const existingFiles = [
        'revuedepresse/lesoleil.jpg',
        'revuedepresse/sudquotidien.jpg',
        'revuedepresse/liberation.jpg',
        'revuedepresse/observateur.jpg',
        'revuedepresse/lequotidien.jpg',
        'revuedepresse/rewmisport.jpg',
        'revuedepresse/soloquotidien.jpg',
        'revuedepresse/yooryoor.jpg',
        'revuedepresse/record.jpg',
        'revuedepresse/enquete.jpg'
    ];
    
    // Vérifier quels fichiers existent réellement
    for (const paper of PRESS_DATA) {
        try {
            const response = await fetch(paper.image, { method: 'HEAD' });
            if (response.ok) {
                availablePapers.push(paper);
            } else {
                console.warn(`Image non trouvée: ${paper.image}`);
            }
        } catch (error) {
            console.warn(`Erreur vérification: ${paper.image}`);
        }
    }
    
    // Si aucune image n'est trouvée, utiliser toutes les données
    if (availablePapers.length === 0) {
        console.log('⚠️ Aucune image vérifiée, utilisation de toutes les données');
        return PRESS_DATA;
    }
    
    console.log(`📊 ${availablePapers.length}/${PRESS_DATA.length} images disponibles`);
    return availablePapers;
}

// ==========================================
// MODIFIEZ VOTRE FONCTION setupPressCarousel
// ==========================================

async function setupPressCarousel() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!prevBtn || !nextBtn || !indicators) {
        console.error('Éléments carousel non trouvés');
        return;
    }

    // Vérifier les images disponibles
    const availablePress = await checkAvailableNewspapers();
    
    if (availablePress.length === 0) {
        console.error('Aucun journal disponible');
        document.getElementById('pressCarousel').innerHTML = `
            <div class="loading-state">
                <p><i class="fas fa-newspaper"></i> Aucun journal disponible pour le moment</p>
            </div>
        `;
        return;
    }

    // Mettre à jour CONFIG.press avec les journaux disponibles
    CONFIG.press = availablePress;
    CONFIG.currentIndex = 0;
    CONFIG.zoomScale = 1;

    // Configuration des boutons
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
}

function startCarouselAutoPlay() {
    stopCarouselAutoPlay();
    CONFIG.carouselInterval = setInterval(() => {
        if (CONFIG.carouselAutoPlay) {
            CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
            CONFIG.zoomScale = 1; // Reset zoom when changing slide
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

    // Utiliser une image plus grande pour le carousel
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
                
                    </div>
            </div>
            
        </div>
    `;

    const indicatorBtns = indicators.querySelectorAll('.indicator');
    indicatorBtns.forEach((btn, index) => {
        btn.classList.toggle('active', index === CONFIG.currentIndex);
    });
    
    // Setup drag and drop
    const pressImage = document.getElementById('pressImage');
    const imageContainer = carousel.querySelector('.carousel-image-container');
    
    if (pressImage && imageContainer) {
        let isDragging = false;
        let startX, startY, translateX = 0, translateY = 0;
        
        imageContainer.addEventListener('mousedown', (e) => {
            if (CONFIG.zoomScale > 1) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                pressImage.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || CONFIG.zoomScale <= 1) return;
            e.preventDefault();
            
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            
            // Limiter le déplacement pour éviter de sortir de l'image
            const maxX = (pressImage.clientWidth * CONFIG.zoomScale - imageContainer.clientWidth) / 2;
            const maxY = (pressImage.clientHeight * CONFIG.zoomScale - imageContainer.clientHeight) / 2;
            
            translateX = Math.max(-maxX, Math.min(maxX, translateX));
            translateY = Math.max(-maxY, Math.min(maxY, translateY));
            
            pressImage.style.transform = `scale(${CONFIG.zoomScale}) translate(${translateX}px, ${translateY}px)`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (CONFIG.zoomScale > 1) {
                pressImage.style.cursor = 'grab';
            } else {
                pressImage.style.cursor = 'default';
            }
        });
        
        pressImage.addEventListener('mouseenter', () => {
            if (CONFIG.zoomScale > 1) {
                pressImage.style.cursor = 'grab';
            }
        });
        
        pressImage.addEventListener('mouseleave', () => {
            if (!isDragging) {
                pressImage.style.cursor = 'default';
            }
        });
        
        // Reset position when zoom changes
        if (CONFIG.zoomScale === 1) {
            translateX = 0;
            translateY = 0;
            pressImage.style.transform = 'scale(1)';
        }
    }
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
    
    // Reset drag position when zoom changes
    if (action === 'reset') {
        pressImage.style.transform = 'scale(1)';
    }
}

function goToSlide(index) {
    CONFIG.currentIndex = index;
    CONFIG.zoomScale = 1; // Reset zoom when changing slide
    renderPressCarousel();
}

// ==========================================
// CAROUSEL PROMESSES VEDETTE
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
        
        // Calculate which items to show
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
        
        // Update dots
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
                '<i class="fas fa-pause"></i> Pause' : 
                '<i class="fas fa-play"></i> Lecture auto';
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
    
    // Handle window resize
    window.addEventListener('resize', () => {
        renderCarousel();
    });
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
// CAROUSEL KPI
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

function updateKpiCarousel() {
    renderKpiItem();
}

// ==========================================
// INITIALISATION DES ÉTOILES DE NOTATION DES SERVICES
// ==========================================
function initStarRatings() {
    console.log('⭐ Initialisation des étoiles de notation...');
    
    // Fonction pour mettre à jour l'affichage des étoiles
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
    
    // Initialiser chaque ensemble d'étoiles
    document.querySelectorAll('.stars-rating').forEach(container => {
        const criteria = container.getAttribute('data-criteria');
        const input = container.querySelector(`input[name="${criteria}"]`);
        
        if (!input) return;
        
        const stars = container.querySelectorAll('i[data-value]');
        
        // Valeur par défaut
        const defaultValue = parseInt(input.value) || 3;
        updateStars(container, defaultValue);
        
        // Gestion des clics
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.getAttribute('data-value'));
                input.value = value;
                updateStars(container, value);
            });
            
            // Effet hover
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

// ==========================================
// NOTATION DES SERVICES PUBLICS - CORRIGÉ
// ==========================================
function setupServiceRatings() {
    const form = document.getElementById('ratingForm');
    
    if (!form) {
        console.error('❌ Formulaire de notation non trouvé');
        return;
    }
    
    console.log('✅ Formulaire de notation trouvé');
    
    // Initialiser les étoiles
    initStarRatings();
    
    // Gestion de la soumission du formulaire
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const service = document.getElementById('service').value;
        const accessibility = document.getElementById('accessibility').value;
        const welcome = document.getElementById('welcome').value;
        const efficiency = document.getElementById('efficiency').value;
        const transparency = document.getElementById('transparency').value;
        const comment = document.getElementById('comment').value.trim();
        
        // Validation
        if (!service) {
            showNotification('Veuillez sélectionner un service', 'error');
            return;
        }
        
        // Préparer les données
        const ratingData = {
            service: service,
            accessibility: parseInt(accessibility) || 0,
            welcome: parseInt(welcome) || 0,
            efficiency: parseInt(efficiency) || 0,
            transparency: parseInt(transparency) || 0,
            comment: comment,
            date: new Date().toISOString()
        };
        
        console.log('📝 Données à envoyer:', ratingData);
        
        // Sauvegarder localement
        saveRatingLocally(ratingData);
        
        // Essayer d'envoyer à Supabase
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
    
    // Charger les notations existantes
    fetchAndDisplayServiceRatings();
}

// ==========================================
// FONCTIONS AUXILIAIRES POUR LES NOTATIONS DES SERVICES
// ==========================================
function resetStars() {
    document.querySelectorAll('.stars-rating').forEach(container => {
        const criteria = container.getAttribute('data-criteria');
        const input = container.querySelector(`input[name="${criteria}"]`);
        if (input) {
            input.value = '3';
        }
        
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
    const ratings = JSON.parse(localStorage.getItem('service_ratings') || '[]');
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
    localStorage.setItem('service_ratings', JSON.stringify(ratings));
    console.log('💾 Notation sauvegardée localement');
}

async function saveRatingToSupabase(ratingData) {
    if (!supabaseClient) {
        console.log('⚠️ Supabase non disponible - mode local seulement');
        return false;
    }
    
    try {
        console.log('🚀 Envoi à Supabase...');
        
        // Structure des données POUR VOTRE TABLE
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
        
        console.log('📤 Données Supabase adaptées:', supabaseData);
        
        const { data, error } = await supabaseClient
            .from('service_ratings')
            .insert([supabaseData]);
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            return false;
        }
        
        console.log('✅ Notation envoyée à Supabase avec succès:', data);
        
        // Mettre à jour les statistiques
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

// Fonction pour mettre à jour les statistiques du service
async function updateServiceStats(serviceName) {
    if (!supabaseClient) return;
    
    try {
        // Calculer les nouvelles moyennes
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
            
            // Insérer ou mettre à jour dans service_stats
            const { error: statsError } = await supabaseClient
                .from('service_stats')
                .upsert(stats, { onConflict: 'service' });
            
            if (statsError) {
                console.error('❌ Erreur mise à jour stats:', statsError);
            } else {
                console.log('📊 Statistiques mises à jour:', stats);
            }
        }
        
    } catch (error) {
        console.error('❌ Erreur calcul stats:', error);
    }
}

// ==========================================
// AFFICHAGE DES RÉSULTATS DE NOTATION DES SERVICES
// ==========================================
async function fetchAndDisplayServiceRatings() {
    console.log('📊 Chargement des notations service...');
    
    // D'abord, récupérer les notations locales
    const localRatings = JSON.parse(localStorage.getItem('service_ratings') || '[]');
    
    // Si Supabase est disponible
    if (supabaseClient) {
        try {
            // Récupérer les notations
            const { data: supabaseRatings, error } = await supabaseClient
                .from('service_ratings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (!error && supabaseRatings) {
                // Récupérer les statistiques
                const { data: stats, error: statsError } = await supabaseClient
                    .from('service_stats')
                    .select('*')
                    .order('overall_rating', { ascending: false });
                
                // Afficher les résultats
                displayRatingResults(supabaseRatings, stats);
                return;
            }
        } catch (error) {
            console.warn('⚠️ Erreur chargement Supabase:', error.message);
        }
    }
    
    // Mode démo ou fallback
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

    // Si on a des stats pré-calculées, les utiliser
    if (stats && stats.length > 0) {
        // Statistiques Globales
        const totalVotesEl = document.getElementById('totalVotes');
        const totalServicesEl = document.getElementById('totalServices');
        const avgRatingEl = document.getElementById('avgRating');
        
        const totalVotesFromStats = stats.reduce((sum, stat) => sum + (stat.total_ratings || 0), 0);
        const overallAvg = stats.length > 0 
            ? (stats.reduce((sum, stat) => sum + parseFloat(stat.overall_rating || 0), 0) / stats.length).toFixed(1)
            : '0.0';
        
        if (totalVotesEl) totalVotesEl.textContent = totalVotesFromStats;
        if (totalServicesEl) totalServicesEl.textContent = stats.length;
        if (avgRatingEl) avgRatingEl.textContent = overallAvg;
        
        // Afficher les meilleurs services depuis les stats
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
        // Calcul manuel des statistiques
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

        // Mettre à jour les statistiques globales
        const totalVotesEl = document.getElementById('totalVotes');
        const totalServicesEl = document.getElementById('totalServices');
        const avgRatingEl = document.getElementById('avgRating');
        
        if (totalVotesEl) totalVotesEl.textContent = totalVotes;
        if (totalServicesEl) totalServicesEl.textContent = uniqueServices.length;
        if (avgRatingEl) avgRatingEl.textContent = avgRating;

        // Calculer les meilleurs services manuellement
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

    // Afficher les dernières notations
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
    // Statistiques Globales
    const totalVotesEl = document.getElementById('totalVotes');
    const totalServicesEl = document.getElementById('totalServices');
    const avgRatingEl = document.getElementById('avgRating');
    
    if (totalVotesEl) totalVotesEl.textContent = '310';
    if (totalServicesEl) totalServicesEl.textContent = '8';
    if (avgRatingEl) avgRatingEl.textContent = '4.3';

    // Dernières Notations
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

    // Meilleurs Services
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
    
    // D'abord, récupérer les votes locaux
    const localVotes = JSON.parse(localStorage.getItem('promise_votes') || '[]');
    
    // Si Supabase est disponible, essayer de récupérer les votes en ligne
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('votes')
                .select('promise_id, rating, comment, created_at');
            
            if (!error && data) {
                // Fusionner votes locaux et en ligne
                const allVotes = [...localVotes, ...data];
                processVotes(allVotes);
                return;
            }
        } catch (error) {
            console.warn('⚠️ Erreur chargement votes Supabase:', error.message);
        }
    }
    
    // Utiliser uniquement les votes locaux
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

// ==========================================
// FONCTIONS POUR LA VISUALISATION PHOTO
// ==========================================
function initPhotoViewer() {
    console.log('📸 Initialisation du visualiseur photo');
    // Cette fonction est appelée au chargement
}

function setupPhotoViewerControls() {
    console.log('🎯 Configuration des contrôles du visualiseur photo');
    
    // Créer le modal si nécessaire
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
    console.log('📰 Ouvrir visualiseur pour:', pressId);
    
    const index = CONFIG.press.findIndex(p => p.id === pressId);
    if (index === -1) return;
    
    currentPhotoIndex = index;
    currentZoom = 1;
    
    const modal = document.getElementById('photoViewerModal');
    const image = document.getElementById('photoViewerImage');
    const info = document.getElementById('photoViewerInfo');
    
    const paper = CONFIG.press[currentPhotoIndex];
    
    // Utiliser une image plus grande (600x800 au lieu de 400/533)
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
    
    // Désactiver le défilement de la page
    document.body.style.overflow = 'hidden';
    
    // Setup drag and drop pour le zoom
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
    currentZoom = Math.min(currentZoom + 0.25, 3);
    updateZoom();
}

function zoomOut() {
    currentZoom = Math.max(currentZoom - 0.25, 1);
    updateZoom();
}

function zoomReset() {
    currentZoom = 1;
    updateZoom();
}

function updateZoom() {
    const image = document.getElementById('photoViewerImage');
    if (image) {
        image.style.transform = `scale(${currentZoom})`;
        image.style.cursor = currentZoom > 1 ? 'grab' : 'default';
    }
}

function prevPhoto() {
    currentPhotoIndex = (currentPhotoIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
    currentZoom = 1;
    updateViewerPhoto();
}

function nextPhoto() {
    currentPhotoIndex = (currentPhotoIndex + 1) % CONFIG.press.length;
    currentZoom = 1;
    updateViewerPhoto();
}

function updateViewerPhoto() {
    const image = document.getElementById('photoViewerImage');
    const info = document.getElementById('photoViewerInfo');
    
    const paper = CONFIG.press[currentPhotoIndex];
    
    // Utiliser une image plus grande
    let imageUrl = paper.image;
    if (imageUrl.includes('picsum.photos')) {
        imageUrl = imageUrl.replace('/400/533', '/600/800');
    }
    
    image.src = imageUrl;
    image.alt = paper.title;
    image.style.transform = `scale(${currentZoom})`;
    
    info.textContent = `${paper.title} - ${paper.date}`;
}

function setupImageDrag(image) {
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;
    
    image.addEventListener('mousedown', (e) => {
        if (currentZoom > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            image.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging || currentZoom <= 1) return;
        e.preventDefault();
        
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        
        // Limiter le déplacement
        const maxX = (image.clientWidth * currentZoom - image.parentElement.clientWidth) / 2;
        const maxY = (image.clientHeight * currentZoom - image.parentElement.clientHeight) / 2;
        
        translateX = Math.max(-maxX, Math.min(maxX, translateX));
        translateY = Math.max(-maxY, Math.min(maxY, translateY));
        
        image.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (currentZoom > 1) {
            image.style.cursor = 'grab';
        }
    });
}

// ==========================================
// FORCER LA VISIBILITÉ DES BOUTONS
// ==========================================
function forceButtonVisibility() {
    console.log('🎨 Forçage de la visibilité des boutons...');
    
    // Attendre que le DOM soit complètement chargé
    setTimeout(() => {
        const shareButtons = document.querySelectorAll('.promise-actions .social-btn');
        const starButtons = document.querySelectorAll('.promise-actions .btn-stars');
        
        console.log(`🎯 ${shareButtons.length} boutons de partage trouvés`);
        console.log(`🎯 ${starButtons.length} boutons étoiles trouvés`);
        
        // Appliquer des styles inline (priorité maximale)
        shareButtons.forEach(btn => {
            btn.style.cssText = `
                background: #00695f !important;
                color: white !important;
                border: 2px solid white !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 40px !important;
                height: 40px !important;
                border-radius: 50% !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
            
            // Classes spécifiques
            if (btn.classList.contains('fb')) {
                btn.style.background = '#3b5998 !important';
            }
            if (btn.classList.contains('tw')) {
                btn.style.background = '#1da1f2 !important';
            }
            if (btn.classList.contains('wa')) {
                btn.style.background = '#25d366 !important';
            }
        });
        
        starButtons.forEach(btn => {
            btn.style.cssText = `
                background: linear-gradient(135deg, #f57c00, #ff6f3c) !important;
                color: white !important;
                border: 2px solid #f57c00 !important;
                font-weight: bold !important;
                padding: 8px 16px !important;
                border-radius: 20px !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                box-shadow: 0 2px 8px rgba(245,124,0,0.4) !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
        });
        
        // Améliorer toute la section actions
        const actionSections = document.querySelectorAll('.promise-actions');
        actionSections.forEach(section => {
            section.style.cssText = `
                background: rgba(0,105,95,0.05) !important;
                border: 2px solid #e0e0e0 !important;
                border-radius: 8px !important;
                padding: 12px !important;
                margin-top: 16px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                opacity: 1 !important;
                visibility: visible !important;
            `;
        });
        
    }, 500); // Attendre un peu que tout soit chargé
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

// ==========================================
// FONCTIONS MANQUANTES (pour éviter les erreurs)
// ==========================================

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
// FONCTIONS DE SECOURS POUR SUPABASE
// ==========================================

// Fonction pour insérer avec retry et fallback
async function safeSupabaseInsert(table, data, retryCount = 2) {
    if (!supabaseClient) {
        console.log(`⚠️ Supabase non disponible - stockage local pour ${table}`);
        return { success: false, data: null, error: 'Supabase non disponible' };
    }
    
    for (let i = 0; i <= retryCount; i++) {
        try {
            console.log(`🔄 Tentative ${i + 1} d'insertion dans ${table}...`);
            
            const { data: result, error } = await supabaseClient
                .from(table)
                .insert([data])
                .select();
            
            if (!error) {
                console.log(`✅ Insertion réussie dans ${table}:`, result);
                return { success: true, data: result, error: null };
            }
            
            // Si erreur 401 (RLS), essayez avec une méthode différente
            if (error.code === 'PGRST301' || error.code === '42501' || error.message.includes('row-level security')) {
                console.warn(`⚠️ Erreur RLS pour ${table}:`, error.message);
                
                // Mode fallback : stockage local
                const localStorageKey = `supabase_fallback_${table}`;
                const fallbackData = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
                fallbackData.push({
                    ...data,
                    id: Date.now().toString(),
                    _synced: false,
                    _timestamp: new Date().toISOString()
                });
                localStorage.setItem(localStorageKey, JSON.stringify(fallbackData));
                
                return { 
                    success: false, 
                    data: null, 
                    error: error.message,
                    fallback: true 
                };
            }
            
            // Autre erreur
            console.error(`❌ Erreur insertion ${table}:`, error);
            
        } catch (error) {
            console.error(`❌ Exception insertion ${table}:`, error);
        }
        
        // Attente avant retry
        if (i < retryCount) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    
    return { success: false, data: null, error: 'Toutes les tentatives ont échoué' };
}

// Version corrigée de saveRatingToSupabase
async function saveRatingToSupabase(ratingData) {
    if (!supabaseClient) {
        console.log('⚠️ Supabase non disponible - mode local seulement');
        return false;
    }
    
    try {
        console.log('🚀 Envoi de notation à Supabase...');
        
        // Structure des données
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
        
        console.log('📤 Données à envoyer:', supabaseData);
        
        // Utiliser la fonction safe insert
        const result = await safeSupabaseInsert('service_ratings', supabaseData);
        
        if (result.fallback) {
            showNotification('Notation enregistrée localement (problème serveur)', 'info');
            return false;
        }
        
        if (!result.success) {
            console.error('❌ Échec insertion Supabase');
            showNotification('Mode démo : Notation enregistrée localement', 'info');
            return false;
        }
        
        console.log('✅ Notation envoyée avec succès');
        showNotification('Merci pour votre notation !', 'success');
        
        // Mettre à jour les stats (en arrière-plan)
        setTimeout(() => updateServiceStats(ratingData.service), 1000);
        
        return true;
        
    } catch (error) {
        console.error('❌ Erreur envoi Supabase:', error);
        showNotification('Mode démo : Notation enregistrée localement', 'info');
        return false;
    }
}

// Version corrigée de saveVoteToSupabase
async function saveVoteToSupabase(promiseId, rating, comment = '') {
    if (!supabaseClient) {
        showNotification('Mode démo : Vote enregistré localement', 'info');
        const votes = JSON.parse(localStorage.getItem('promise_votes') || '[]');
        votes.push({
            id: Date.now().toString(),
            promise_id: promiseId,
            rating: rating,
            comment: comment,
            created_at: new Date().toISOString()
        });
        localStorage.setItem('promise_votes', JSON.stringify(votes));
        return;
    }
    
    try {
        const voteData = { 
            promise_id: promiseId, 
            rating: rating,
            comment: comment,
            created_at: new Date().toISOString()
        };
        
        console.log('Envoi du vote:', voteData);
        
        const result = await safeSupabaseInsert('votes', voteData);
        
        if (result.fallback) {
            showNotification('Vote enregistré localement (problème serveur)', 'info');
        } else if (result.success) {
            showNotification('Merci pour votre vote !', 'success');
        } else {
            showNotification('Vote enregistré localement (mode démo)', 'info');
        }
        
        // Recharger les votes après un délai
        setTimeout(() => fetchAndDisplayPublicVotes(), 500);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde vote:', error);
        showNotification('Mode démo : Vote enregistré localement', 'info');
    }
}

// Fonction pour synchroniser les données locales
async function syncLocalDataWithSupabase() {
    console.log('🔄 Synchronisation des données locales...');
    
    // Synchroniser service_ratings
    const serviceRatingsLocal = JSON.parse(localStorage.getItem('supabase_fallback_service_ratings') || '[]');
    if (serviceRatingsLocal.length > 0) {
        console.log(`📊 ${serviceRatingsLocal.length} notations locales à synchroniser`);
        
        for (const rating of serviceRatingsLocal.filter(r => !r._synced)) {
            try {
                const { success } = await safeSupabaseInsert('service_ratings', {
                    service: rating.service,
                    accessibility: rating.accessibility,
                    welcome: rating.welcome,
                    efficiency: rating.efficiency,
                    transparency: rating.transparency,
                    comment: rating.comment,
                    user_ip: rating.user_ip || 'unknown',
                    user_agent: rating.user_agent || 'local-sync',
                    created_at: rating.created_at || rating._timestamp
                });
                
                if (success) {
                    rating._synced = true;
                }
            } catch (error) {
                console.error('❌ Erreur synchronisation:', error);
            }
        }
        
        // Mettre à jour le stockage local
        localStorage.setItem('supabase_fallback_service_ratings', JSON.stringify(serviceRatingsLocal));
    }
    
    // Synchroniser votes
    const votesLocal = JSON.parse(localStorage.getItem('promise_votes') || '[]');
    if (votesLocal.length > 0) {
        console.log(`📊 ${votesLocal.length} votes locaux à synchroniser`);
        
        // Logique similaire pour les votes...
    }
}
// ==========================================
// DEBUG MOBILE - AJOUTER DANS app.js
// ==========================================
function debugMobileMenu() {
    console.log('📱 DEBUG MOBILE MENU');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    console.log('Bouton mobile:', mobileBtn ? '✅ trouvé' : '❌ non trouvé');
    console.log('Menu navigation:', navMenu ? '✅ trouvé' : '❌ non trouvé');
    console.log('Liens de navigation:', navLinks.length, 'trouvés');
    
    if (mobileBtn && navMenu) {
        console.log('État initial du menu:', navMenu.classList.contains('show') ? 'ouvert' : 'fermé');
        
        // Vérifier les écouteurs d'événements
        const hasClickHandler = mobileBtn.onclick || mobileBtn._hasClickHandler;
        console.log('Écouteur bouton mobile:', hasClickHandler ? '✅ actif' : '❌ absent');
    }
}

// Appeler le debug au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Votre code existant...
    debugMobileMenu();
    
    // Vérifier si c'est mobile
    if (window.innerWidth <= 768) {
        console.log('📱 Mode mobile détecté - largeur:', window.innerWidth);
    }
});

// Debug lors du clic sur le menu mobile
document.addEventListener('click', (e) => {
    if (e.target.closest('#mobileMenuBtn')) {
        console.log('🍔 Menu mobile cliqué');
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            console.log('État après clic:', navMenu.classList.contains('show') ? 'ouvert' : 'fermé');
        }
    }
    
    // Debug clic sur les liens
    if (e.target.closest('.nav-link')) {
        console.log('🔗 Lien de navigation cliqué:', e.target.getAttribute('href'));
        e.preventDefault();
        // Votre logique de navigation ici
    }
});
function getStatusText(promise) {
    if (promise.isLate) return 'En retard';
    return promise.status;
}
// ==========================================
// AMÉLIORATIONS POUR APP.JS
// À ajouter à la fin du fichier app.js existant
// ==========================================

// ========== MODAL POUR ARTICLES COMPLETS ==========
function openArticleModal(newsId) {
    const news = CONFIG.news.find(n => n.id === newsId);
    if (!news) return;
    
    // Créer la modal si elle n'existe pas
    let modal = document.getElementById('articleModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'articleModal';
        modal.className = 'article-modal';
        modal.innerHTML = `
            <div class="article-modal-overlay" onclick="closeArticleModal()"></div>
            <div class="article-modal-content">
                <button class="article-modal-close" onclick="closeArticleModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div id="articleModalBody"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Remplir le contenu
    const modalBody = document.getElementById('articleModalBody');
    modalBody.innerHTML = `
        ${news.image ? `<img src="${news.image}" alt="${news.title}" class="article-modal-image">` : ''}
        <h2 class="article-modal-title">${news.title}</h2>
        <div class="article-modal-meta">
            <span><i class="fas fa-calendar"></i> ${news.date}</span>
            <span><i class="fas fa-newspaper"></i> ${news.source || 'Le Soleil'}</span>
            ${news.category ? `<span><i class="fas fa-tag"></i> ${getCategoryLabel(news.category)}</span>` : ''}
        </div>
        <div class="article-modal-content-text">${news.content || news.excerpt}</div>
        ${news.link && news.link !== '#' ? `
            <a href="${news.link}" target="_blank" class="article-modal-link">
                <i class="fas fa-external-link-alt"></i> Lire la source originale
            </a>
        ` : ''}
        <div class="article-modal-share">
            <strong>Partager cet article :</strong>
            <div class="article-modal-share-buttons">
                <button class="social-btn fb" onclick="shareNewsEnriched('${newsId}', 'facebook')" title="Facebook">
                    <i class="fab fa-facebook-f"></i>
                </button>
                <button class="social-btn tw" onclick="shareNewsEnriched('${newsId}', 'twitter')" title="Twitter">
                    <i class="fab fa-twitter"></i>
                </button>
                <button class="social-btn wa" onclick="shareNewsEnriched('${newsId}', 'whatsapp')" title="WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeArticleModal() {
    const modal = document.getElementById('articleModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function getCategoryLabel(category) {
    const labels = {
        general: 'Général',
        education: 'Éducation',
        sante: 'Santé',
        economie: 'Économie',
        infrastructure: 'Infrastructure',
        social: 'Social',
        environnement: 'Environnement',
        justice: 'Justice',
        securite: 'Sécurité'
    };
    return labels[category] || category;
}

// ========== PARTAGE ENRICHI D'ACTUALITÉS ==========
function shareNewsEnriched(newsId, platform) {
    const news = CONFIG.news.find(n => n.id === newsId);
    if (!news) return;
    
    // Créer un texte enrichi
    const shareText = `📰 ${news.title}\n\n${news.excerpt || news.content.substring(0, 200) + '...'}\n\n📅 ${news.date} | 📰 ${news.source || 'Le Soleil'}\n🏷️ ${getCategoryLabel(news.category || 'general')}`;
    const shareUrl = news.link && news.link !== '#' ? news.link : window.location.href;
    
    let url = '';
    switch(platform) {
        case 'facebook':
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
            if (news.image) {
                url += `&picture=${encodeURIComponent(news.image)}`;
            }
            break;
        case 'twitter':
            const tweetText = `📰 ${news.title}\n\n${news.excerpt ? news.excerpt.substring(0, 180) : news.content.substring(0, 180)}...\n\n${shareUrl}`;
            url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            break;
        case 'whatsapp':
            url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
            break;
    }
    
    if (url) {
        window.open(url, '_blank', 'width=600,height=400');
    }
}

// ========== PARTAGE ENRICHI DE PROMESSES ==========
function sharePromiseEnriched(promiseId, platform) {
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    // Créer un texte très enrichi avec toutes les informations
    let shareText = `🎯 ENGAGEMENT PRÉSIDENTIEL\n\n`;
    shareText += `📋 ${promise.title}\n\n`;
    shareText += `📍 Domaine: ${promise.domain || 'Non spécifié'}\n`;
    shareText += `📅 Délai: ${promise.delai || 'Non spécifié'}\n`;
    shareText += `🔖 Statut: ${getStatusLabel(promise.status)}\n\n`;
    
    if (promise.description) {
        shareText += `📝 ${promise.description.substring(0, 200)}${promise.description.length > 200 ? '...' : ''}\n\n`;
    }
    
    if (promise.date_update) {
        shareText += `🔄 Dernière mise à jour: ${promise.date_update}\n\n`;
    }
    
    shareText += `📊 Suivez tous les engagements sur: ${window.location.origin}`;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}#promises`;
    
    let url = '';
    switch(platform) {
        case 'facebook':
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
            break;
        case 'twitter':
            const tweetText = `🎯 ${promise.title}\n\n📍 ${promise.domain}\n🔖 ${getStatusLabel(promise.status)}\n\n${shareUrl}`;
            url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            break;
        case 'whatsapp':
            url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            break;
    }
    
    if (url) {
        window.open(url, '_blank', 'width=600,height=400');
    }
}

function getStatusLabel(status) {
    const labels = {
        'realise': '✅ Réalisé',
        'encours': '🔄 En cours',
        'non-lance': '⏳ Non lancé',
        'retard': '⚠️ En retard'
    };
    return labels[status] || status;
}

// ========== MODAL POUR LISTE COMPLÈTE DES NOTATIONS ==========
function showRatingsModal(category, categoryLabel) {
    // À implémenter : afficher toutes les notations d'une catégorie
    // Cette fonction sera appelée par le bouton "Liste complète"
    console.log('Affichage des notations complètes pour:', category, categoryLabel);
    // TODO: Implémenter l'affichage modal
}

// ========== AMÉLIORATION DU RENDU DES ACTUALITÉS ==========
function renderNewsImproved() {
    const newsGrid = document.getElementById('newsGrid');
    if (!newsGrid) return;
    
    if (!CONFIG.news || CONFIG.news.length === 0) {
        newsGrid.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Aucune actualité pour le moment</p></div>';
        return;
    }
    
    newsGrid.innerHTML = CONFIG.news.map(news => {
        const hasLongContent = news.content && news.content.length > 300;
        const displayText = hasLongContent ? (news.excerpt || news.content.substring(0, 200) + '...') : (news.content || news.excerpt);
        
        return `
            <div class="news-card">
                ${news.image ? `
                    <div class="news-card-image">
                        <img src="${news.image}" alt="${news.title}" onerror="this.parentElement.style.display='none'">
                    </div>
                ` : ''}
                <div class="news-card-content">
                    <div class="news-card-header">
                        <h3 class="news-card-title">${news.title}</h3>
                        <span class="news-card-date">${news.date}</span>
                    </div>
                    <p class="news-card-excerpt">${displayText}</p>
                    ${hasLongContent ? `
                        <a href="#" class="news-read-more" onclick="openArticleModal('${news.id}'); return false;">
                            Lire l'article complet <i class="fas fa-arrow-right"></i>
                        </a>
                    ` : ''}
                    <div class="news-card-footer">
                        <div class="news-card-meta">
                            <span><i class="fas fa-newspaper"></i> ${news.source || 'Le Soleil'}</span>
                            ${news.category ? `<span><i class="fas fa-tag"></i> ${getCategoryLabel(news.category)}</span>` : ''}
                        </div>
                        <div class="news-card-actions">
                            <button class="social-btn-small fb" onclick="shareNewsEnriched('${news.id}', 'facebook')" title="Partager sur Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </button>
                            <button class="social-btn-small tw" onclick="shareNewsEnriched('${news.id}', 'twitter')" title="Partager sur Twitter">
                                <i class="fab fa-twitter"></i>
                            </button>
                            <button class="social-btn-small wa" onclick="shareNewsEnriched('${news.id}', 'whatsapp')" title="Partager sur WhatsApp">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== MODIFIER LA FONCTION renderNews EXISTANTE ==========
// Remplacer l'appel à renderNews par renderNewsImproved
// Dans la fonction initiale, remplacer:
// if (typeof renderNews === 'function') { renderNews(CONFIG.news); }
// Par:
// renderNewsImproved();

console.log('✅ Améliorations chargées');
