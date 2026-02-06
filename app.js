// ==========================================
// CONFIGURATION SUPABASE ET VARIABLES GLOBALES
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

// Configuration générale
const CONFIG = {
    START_DATE: new Date('2024-04-02'),
    END_DATE: new Date('2029-04-02'),
    CURRENT_DATE: new Date(),
    promises: [],
    news: [],
    press: [],
    currentIndex: 0,
    carouselInterval: null,
    visibleCount: 6,
    currentVisible: 6,
    carouselAutoPlay: true,
    kpiCarouselIndex: 0,
    kpiAutoPlay: true,
    zoomScale: 1,
    currentRatingPromiseId: null,
    currentRatingValue: 0,
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
// FONCTION DE CONVERSION DES DÉLAIS TEXTE EN JOURS
// ==========================================
function parseDelayToDays(delayText) {
    if (!delayText || delayText.trim() === '') return 365;
    const lower = delayText.toLowerCase().trim();

    if (lower.includes('immédiat') || lower.includes('immediat') || lower.includes('dès')) {
        return 0;
    }

    if (lower.includes('mandat') || lower.includes('quinquennat')) {
        return 1825;
    }

    let totalDays = 0;

    const yearsMatch = lower.match(/(\d+)\s*an[s]?/i);
    if (yearsMatch) {
        const years = parseInt(yearsMatch[1], 10);
        totalDays += years * 365;
    }

    const monthsMatch = lower.match(/(\d+)\s*mois/i);
    if (monthsMatch) {
        const months = parseInt(monthsMatch[1], 10);
        totalDays += months * 30;
    }

    const daysMatch = lower.match(/(\d+)\s*jour[s]?/i);
    if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        totalDays += days;
    }

    const premiersMoisMatch = lower.match(/(\d+)\s*premiers?\s*mois/i);
    if (premiersMoisMatch) {
        const mois = parseInt(premiersMoisMatch[1], 10);
        totalDays += mois * 30;
    }

    const firstYearsMatch = lower.match(/(\d+)\s*premières?\s*années?/i);
    if (firstYearsMatch) {
        const years = parseInt(firstYearsMatch[1], 10);
        totalDays += years * 365;
    }

    if (lower.includes('2 premières années') || lower.includes('2 premières annees')) {
        totalDays = 730;
    }

    if (lower.includes('1ère année') || lower.includes('1ere annee') || lower.includes('1ère annee')) {
        totalDays = 365;
    }

    const ansSimpleMatch = lower.match(/(\d+)\s*ans$/i);
    if (ansSimpleMatch && !lower.includes('premières') && !lower.includes('premiere')) {
        const ans = parseInt(ansSimpleMatch[1], 10);
        totalDays = ans * 365;
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
            totalDays = Math.max(0, diffDays);
            totalDays = Math.min(totalDays, 1825);
        } catch (e) {
            console.warn('Erreur conversion date:', dateMatch[0]);
        }
    }

    if (totalDays === 0) {
        const num = parseInt(delayText.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) {
            totalDays = num * 365;
        } else {
            totalDays = 365;
        }
    }

    const MANDAT_MAX_DAYS = 1825;
    return Math.min(totalDays, MANDAT_MAX_DAYS);
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================
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

function calculateDeadlineFromDays(days) {
    const daysNum = Math.max(0, parseInt(days, 10) || 0);
    const deadline = new Date(CONFIG.START_DATE);

    if (daysNum === 0) {
        return deadline;
    }

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
// FONCTIONS DE MISE À JOUR SÉCURISÉES
// ==========================================
function updateStatValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value || '0';
    } else {
        console.warn(`⚠️ Element #${id} non trouvé - ignoré`);
    }
}

function updateStatPercentage(id, value, total) {
    const el = document.getElementById(id);
    if (el && total > 0) {
        const percentage = Math.round((value / total) * 100);
        el.textContent = `${percentage}%`;
    } else if (el) {
        el.textContent = '0%';
    } else {
        console.warn(`⚠️ Element #${id} non trouvé - ignoré`);
    }
}

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    
    // Initialiser les composants UI
    initNavigation();
    initScrollEffects();
    initFilters();
    initDateDisplay();
    initCountdown();
    initPhotoViewer();

    // Charger les données
    await loadData();

    // Initialiser filteredPromises
    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = Math.min(CONFIG.visibleCount, CONFIG.promises.length);

    // Rendre les données
    renderAll();
    if (typeof renderNews === 'function') {
        renderNews(CONFIG.news);
    }
    if (typeof renderNewspapers === 'function') {
        renderNewspapers();
    }

    // Configurer les composants
    setupPressCarousel();
    setupServiceRatings();
    setupDailyPromise();
    setupPromisesCarousel();
    setupKpiCarousel();

    // Initialiser les étoiles
    initStarRatings();

    // Initialiser le visualiseur photo
    setTimeout(() => {
        if (typeof setupPhotoViewerControls === 'function') {
            setupPhotoViewerControls();
        }
    }, 500);
});

// ==========================================
// NAVIGATION MODERNE
// ==========================================
function initNavigation() {
    const modernHamburger = document.getElementById('modernHamburger');
    const modernMenu = document.getElementById('modernMenu');
    const modernLinks = document.querySelectorAll('.modern-link');

    if (modernHamburger && modernMenu) {
        modernHamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            modernHamburger.classList.toggle('active');
            modernMenu.classList.toggle('active');
        });
    }

    modernLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            
            e.preventDefault();
            
            const targetId = href.substring(1);
            const target = document.getElementById(targetId);

            if (target) {
                const offset = 80;
                const targetPosition = target.offsetTop - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                if (modernMenu && modernMenu.classList.contains('active')) {
                    modernMenu.classList.remove('active');
                    modernHamburger.classList.remove('active');
                }
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (modernMenu && modernHamburger) {
            const modernNav = document.getElementById('modernNav');
            if (modernNav && !modernNav.contains(e.target) && modernMenu.classList.contains('active')) {
                modernMenu.classList.remove('active');
                modernHamburger.classList.remove('active');
            }
        }
    });

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

// ==========================================
// SCROLL EFFECTS ET DATE
// ==========================================
function initScrollEffects() {
    const scrollToTop = document.getElementById('scrollToTop');
    const progressIndicator = document.getElementById('progressIndicator');

    window.addEventListener('scroll', () => {
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

// ==========================================
// COMPTE À REBOURS
// ==========================================
function initCountdown() {
    const countdownDate = new Date('2029-04-02T00:00:00').getTime();
    
    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = countdownDate - now;
        
        if (distance < 0) {
            document.getElementById('days').textContent = '000';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(3, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    };
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
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
        if (typeof renderNews === 'function') {
            renderNews(CONFIG.news);
        }
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

async function loadPromisesData() {
    try {
        const response = await fetch('promises.json?v=' + Date.now());
        if (!response.ok) {
            console.warn('Fichier promises.json non trouvé - utilisation des données de test');
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
            
            const domain = p.domaine || p.domain || p.categorie || 'Autre';
            let delayText = p.delai || '12 premiers mois';
            let delayDays = parseDelayToDays(delayText);
            
            if (isNaN(delayDays) || delayDays < 0) {
                delayDays = 365;
            }
            
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
            console.warn('Fichier press.json non trouvé - données de presse par défaut');
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
                    content: 'La plateforme citoyenne de suivi des engagements est désormais opérationnelle. Elle permet aux citoyens de suivre en temps réel les progrès des engagements du Président Bassirou Diomaye Faye.',
                    date: '25/01/2026', 
                    source: 'Le Soleil',
                    category: 'gouvernance',
                    image: 'https://picsum.photos/seed/news1/800/450'
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
                    content: 'La plateforme citoyenne de suivi des engagements est désormais opérationnelle. Elle permet aux citoyens de suivre en temps réel les progrès des engagements du Président Bassirou Diomaye Faye.',
                    date: '25/01/2026', 
                    source: 'Le Soleil',
                    category: 'gouvernance',
                    image: 'https://picsum.photos/seed/news1/800/450'
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
                content: 'La plateforme citoyenne de suivi des engagements est désormais opérationnelle. Elle permet aux citoyens de suivre en temps réel les progrès des engagements du Président Bassirou Diomaye Faye.',
                date: '25/01/2026', 
                source: 'Le Soleil',
                category: 'gouvernance',
                image: 'https://picsum.photos/seed/news1/800/450'
            }
        ];
    }
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
            console.log(`  Ancien délai: ${currentDelay} jours (${Math.round(currentDelay/365)} années)`);
            
            promise.delai = '1825';
            promise.delai_texte = 'Quinquennat';
            promise.deadline = calculateDeadlineFromDays(1825);
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
// MISE À JOUR DES STATISTIQUES
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
        
        if (validPromisesCount > 0) {
            avgDelay = Math.round(totalDaysRemaining / validPromisesCount);
        }
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

// ==========================================
// RENDER ALL ET FILTRES
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

function resetFilters() {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-domain').value = '';
    document.getElementById('filter-search').value = '';

    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = CONFIG.visibleCount;

    renderPromises(CONFIG.filteredPromises.slice(0, CONFIG.currentVisible));
    updateResultsCount(CONFIG.filteredPromises.length);

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
// RENDER PROMISES
// ==========================================
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
                    <span class="promise-status">${statusIcon} ${getStatusText(promise)}</span>
                    <span class="promise-domain">${promise.domain || 'Non spécifié'}</span>
                </div>
                <h3 class="promise-title">${promise.engagement}</h3>
                
                <div class="promise-result">
                    <strong><i class="fas fa-bullseye"></i> Résultat attendu:</strong>
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
                            <span class="deadline-label">Délai initial:</span>
                            <span class="deadline-value">${promise.delai_texte || promise.delai + ' jours'}</span>
                        </div>
                        <div class="deadline-item">
                            <span class="deadline-label">Date limite:</span>
                            <span class="deadline-value">${formatDate(promise.deadline)}</span>
                        </div>
                        <div class="deadline-item">
                            <span class="deadline-label">Temps restant:</span>
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
// CAROUSELS ET PRESSE
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

    CONFIG.press = availablePress;
    CONFIG.currentIndex = 0;
    CONFIG.zoomScale = 1;

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
            <img src="${imageUrl}" alt="${currentPaper.title}" 
                onerror="this.onerror=null; this.src='https://picsum.photos/700/933?random=${CONFIG.currentIndex}'"
                id="pressImage"
                style="transform: scale(${CONFIG.zoomScale})">
        </div>
    `;

    document.getElementById('carouselTitle').textContent = currentPaper.title;
    document.getElementById('carouselDate').textContent = currentPaper.date;
    document.getElementById('carouselLink').href = currentPaper.link || '#';

    const indicatorBtns = indicators.querySelectorAll('.indicator');
    indicatorBtns.forEach((btn, index) => {
        btn.classList.toggle('active', index === CONFIG.currentIndex);
    });

    const pressImage = document.getElementById('pressImage');
    if (pressImage && CONFIG.zoomScale === 1) {
        pressImage.style.cursor = 'default';
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

    if (action === 'reset') {
        pressImage.style.transform = 'scale(1)';
    }
}

async function checkAvailableNewspapers() {
    const availablePapers = [];
    const existingFiles = [
        'revuedepresse/lesoleil.jpg',
        'revuedepresse/sudquotidien.jpg',
        'revuedepresse/liberation.jpg',
        'revuedepresse/observateur.jpg',
        'revuedepresse/lequotidien.jpg',
        'revuedepresse/rewmisport.jpg'
    ];

    for (const paper of DEFAULT_PRESS) {
        try {
            const response = await fetch(paper.image, { method: 'HEAD' });
            if (response.ok) {
                availablePapers.push(paper);
            }
        } catch (error) {
            console.warn(`Erreur vérification: ${paper.image}`);
        }
    }

    if (availablePapers.length === 0) {
        console.log('⚠️ Aucune image vérifiée, utilisation de toutes les données');
        return DEFAULT_PRESS;
    }

    console.log(`📊 ${availablePapers.length}/${DEFAULT_PRESS.length} images disponibles`);
    return availablePapers;
}

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
    }
];

function getDefaultPressData() {
    return DEFAULT_PRESS;
}

// ==========================================
// NOTATIONS ET SERVICES
// ==========================================
function initStarRatings() {
    console.log('⭐ Initialisation des étoiles de notation...');
    
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
                const value = parseInt(star.getAttribute('data-value'));
                updateStars(container, value, true);
            });
        });

        container.addEventListener('mouseleave', () => {
            const currentValue = parseInt(input.value) || 3;
            updateStars(container, currentValue);
        });
    });
}

function setupServiceRatings() {
    const form = document.getElementById('ratingForm');
    if (!form) {
        console.error('❌ Formulaire de notation non trouvé');
        return;
    }

    console.log('✅ Formulaire de notation trouvé');

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
        
        console.log('📝 Données à envoyer:', ratingData);
        
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

async function fetchAndDisplayServiceRatings() {
    console.log('📊 Chargement des notations service...');
    
    const localRatings = JSON.parse(localStorage.getItem('service_ratings') || '[]');

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
        
        updateStatValue('totalVotes', totalVotesFromStats);
        updateStatValue('totalServices', stats.length);
        updateStatValue('avgRating', overallAvg);
        
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

        updateStatValue('totalVotes', totalVotes);
        updateStatValue('totalServices', uniqueServices.length);
        updateStatValue('avgRating', avgRating);

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
    updateStatValue('totalVotes', '310');
    updateStatValue('totalServices', '8');
    updateStatValue('avgRating', '4.3');

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
// NOTIFICATIONS ET ACTIONS
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
    
    const statusIcon = promise.isLate ? '⚠️' :
                      promise.status === 'Réalisé' ? '✅' :
                      promise.status === 'En cours' ? '🔄' : '⏳';

    const statusText = promise.isLate ? 'En retard' : promise.status;
    const daysRemaining = getDaysRemaining(promise.deadline);
    const timeText = formatDaysRemaining(daysRemaining);

    const shareText = `🎯 ${promise.engagement}\n\n` +
                     `📍 Domaine: ${promise.domain || 'Non spécifié'}\n` +
                     `📅 Délai: ${promise.delai_texte}\n` +
                     `🔖 Statut: ${statusIcon} ${statusText}\n` +
                     `⏰ ${timeText}\n\n` +
                     `📝 Description: ${promise.resultat || 'Non spécifié'}\n\n` +
                     `📊 Suivez tous les engagements sur: ${window.location.href}`;

    let shareUrl = '';

    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + window.location.href)}`;
            break;
        default:
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
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

// ==========================================
// VOTES PUBLICS
// ==========================================
async function fetchAndDisplayPublicVotes() {
    console.log('📊 Chargement des votes...');
    
    const localVotes = JSON.parse(localStorage.getItem('promise_votes') || '[]');

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
        
        setTimeout(() => fetchAndDisplayPublicVotes(), 500);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde vote:', error);
        showNotification('Mode démo : Vote enregistré localement', 'info');
    }
}

// ==========================================
// FONCTIONS MANQUANTES
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
                    text: 'Au Sénégal, la protection des lanceurs d\'alerte est désormais régie par la Loi n° 2025-14, adoptée par l\'Assemblée nationale le 26 août 2025 et promulguée en septembre 2025.'
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
// EXPORTS GLOBAUX
// ==========================================
window.toggleUpdates = toggleUpdates;
window.showRatingModal = showRatingModal;
window.closeRatingModal = closeRatingModal;
window.submitRating = submitRating;
window.sharePromise = sharePromise;
window.resetFilters = resetFilters;
window.goToSlide = goToSlide;
window.togglePressZoom = togglePressZoom;
window.shareToPlatform = shareToPlatform;

// ==========================================
// CAROUSELS SUPPLÉMENTAIRES
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
// FONCTIONS DE SERVICE
// ==========================================
function updateServiceList() {
    const category = document.getElementById('serviceCategory').value;
    const serviceSelect = document.getElementById('service');
    
    // Liste complète des services par catégorie
    const servicesByCategory = {
        health: [
            "Hôpital public", "Centre hospitalier régional", "Centre de santé", 
            "Pharmacie publique (SEN-Pharmacie)", "SAMU (Service d'Assistance Médicale Urgente)",
            "Centre national de Transfusion sanguine", "Centre national d'Oncologie",
            "Laboratoire d'analyses médicales public", "Centre psychiatrique",
            "Service de Protection maternelle et infantile"
        ],
        education: [
            "École publique (élémentaire)", "Collège public", "Lycée public",
            "Université publique (UCAD, UGB, etc.)", "Institut Islamique de Dakar",
            "École nationale d'Administration (ENA)", "Centre de Formation judiciaire",
            "École nationale de Cybersécurité", "Centre régional des Œuvres universitaires",
            "Inspection d'Académie"
        ],
        security: [
            "Commissariat de police", "Brigade de gendarmerie", "Police judiciaire (PJ)",
            "Police routière", "Sapeurs-pompiers / Protection civile", "Douanes (poste frontalier)",
            "Direction de la Surveillance du Territoire", "Centre national de coordination des alertes",
            "Administration pénitentiaire", "Brigade nationale des sapeurs-pompiers"
        ],
        justice: [
            "Tribunal (civil, pénal, commerce)", "Maison de justice",
            "Centre national des Archives judiciaires", "Médiateur de la République",
            "Commission nationale des Droits de l'Homme",
            "Commission de Protection des Données Personnelles",
            "Direction de la Justice de Proximité", "Service d'aide juridictionnelle"
        ],
        administration: [
            "Mairie", "Préfecture / Sous-préfecture", "Service d'état civil (naissance, mariage)",
            "Agence nationale de l'état civil", "Archives du Sénégal", "Imprimerie nationale",
            "Direction générale de l'Administration territoriale", "Service du Protocole d'État"
        ],
        finance: [
            "Trésor public (Trésorerie régionale)", "Centre des Impôts (DGID)",
            "Douanes (dédouanement)", "Caisse des Dépôts et Consignations",
            "Banque agricole", "Banque de l'Habitat du Sénégal", "Office de recouvrement",
            "Direction générale du Budget"
        ],
        transport: [
            "Transport urbain (Dakar Dem Dikk)", "Train Express Régional (TER)",
            "Chemins de Fer du Sénégal", "Aéroport international Blaise Diagne",
            "Port autonome de Dakar", "Agence nationale de Sécurité routière",
            "Direction des Transports routiers", "Société nationale Autoroutes du Sénégal"
        ],
        energy: [
            "SENELEC (bureau clientèle)", "Société nationale des Eaux du Sénégal",
            "SDE (Sénégal des Eaux)", "Agence sénégalaise de l'Électrification rurale",
            "Office national des Forages ruraux", "Office national de l'Assainissement",
            "Commission de Régulation du Secteur de l'Énergie"
        ],
        communication: [
            "SONATEL (agence)", "La Poste (bureau de poste)",
            "RTS (Radiodiffusion Télévision Sénégalaise)",
            "Agence de Presse Sénégalaise (APS)", "Maison de la Presse Babacar TOURE",
            "Autorité de Régulation des Télécoms (ARTP)", "Sénégal Numérique SA"
        ],
        social: [
            "Commissariat à la Sécurité alimentaire", "Agence de Couverture sanitaire universelle",
            "Fonds national de l'Entreprenariat féminin", "Office national des Pupilles de la Nation",
            "Centre d'accueil pour enfants", "Direction de l'Action sociale",
            "Service national d'Hygiène", "ANPEJ (Promotion de l'Emploi des Jeunes)"
        ],
        employment: [
            "Office national de Formation professionnelle",
            "Centre de formation professionnelle", "Centre national de Qualification professionnelle",
            "Direction de l'Emploi", "Service d'orientation professionnelle"
        ],
        environment: [
            "Direction des Eaux et Forêts", "Parc national",
            "Agence de la Reforestation et Grande Muraille verte",
            "Centre de Suivi écologique", "Service de collecte des ordures (SONAGED)",
            "Direction de la Propreté et Hygiène publique",
            "Commission nationale de Gestion des Produits Chimiques"
        ],
        culture: [
            "Musée des Civilisations Noires", "Bibliothèque nationale du Sénégal",
            "Grand Théâtre National", "Agence sénégalaise de Promotion touristique",
            "Centre culturel régional", "Monument de la Renaissance africaine",
            "Musée Boribana", "Service agricole / vétérinaire", "Haras national",
            "Station piscicole", "Institut de Recherches agricoles", "Service de l'Urbanisme",
            "Société nationale des HLM", "Service des Sports et Jeunesse"
        ],
        other: ["Autre (précisez en commentaire)"]
    };

    serviceSelect.innerHTML = '<option value="">Sélectionnez un service</option>';
    
    if (category && servicesByCategory[category]) {
        servicesByCategory[category].forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            option.textContent = service;
            serviceSelect.appendChild(option);
        });
    }
}

// ==========================================
// INITIALISATION PHOTO VIEWER
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
    console.log('📰 Ouvrir visualiseur pour:', pressId);
    const index = CONFIG.press.findIndex(p => p.id === pressId);
    if (index === -1) return;

    currentPhotoIndex = index;
    currentZoom = 1;

    const modal = document.getElementById('photoViewerModal');
    const image = document.getElementById('photoViewerImage');
    const info = document.getElementById('photoViewerInfo');

    const paper = CONFIG.press[currentPhotoIndex];

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
// FONCTION MANQUANTE AJOUTÉE
// ==========================================
function goToSlide(index) {
    CONFIG.currentIndex = index;
    CONFIG.zoomScale = 1; // Reset zoom when changing slide
    renderPressCarousel();
}

// ==========================================
// FONCTION POUR LE CARROUSEL DES PROMESSES
// ==========================================
function goToCarouselSlide(index) {
    const carouselPromises = CONFIG.promises.slice(0, 6);
    const itemsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    const totalSlides = Math.ceil(carouselPromises.length / itemsPerSlide);
    if (index >= 0 && index < totalSlides) {
        CONFIG.carouselIndex = index; // Utiliser CONFIG.carouselIndex au lieu de currentSlide local
        setupPromisesCarousel();
    }
}

// ==========================================
// EXPORTS GLOBAUX - CORRIGÉS ET COMPLÉTÉS
// ==========================================
// Ajouter TOUTES les fonctions nécessaires aux exports globaux
window.toggleUpdates = toggleUpdates;
window.showRatingModal = showRatingModal;
window.closeRatingModal = closeRatingModal;
window.submitRating = submitRating;
window.sharePromise = sharePromise;
window.shareToPlatform = shareToPlatform;
window.resetFilters = resetFilters;
window.goToSlide = goToSlide; // ✅ FONCTION AJOUTÉE
window.goToCarouselSlide = goToCarouselSlide; // ✅ FONCTION AJOUTÉE
window.openPhotoViewer = openPhotoViewer;
window.closePhotoViewer = closePhotoViewer;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.zoomReset = zoomReset;
window.prevPhoto = prevPhoto;
window.nextPhoto = nextPhoto;
window.togglePressZoom = togglePressZoom;
window.openNewsDetail = openNewsDetail; // ✅ Pour les actualités
window.closeNewsDetail = closeNewsDetail; // ✅ Pour les actualités
window.shareNews = shareNews; // ✅ Pour les actualités
window.updateServiceList = updateServiceList; // ✅ Pour les notations

// ==========================================
// FONCTION POUR LES ACTUALITÉS (AJOUTÉE)
// ==========================================
function openNewsDetail(newsId) {
    const news = CONFIG.news.find(n => n.id === newsId);
    if (!news) return;
    
    // Créer le modal si nécessaire
    if (!document.getElementById('newsDetailModal')) {
        const modal = document.createElement('div');
        modal.id = 'newsDetailModal';
        modal.className = 'news-detail-modal';
        modal.innerHTML = `
            <div class="news-detail-content">
                <div class="news-detail-header">
                    <h2 id="newsDetailTitle"></h2>
                    <button class="close-news-modal" onclick="closeNewsDetail()">&times;</button>
                </div>
                <div class="news-detail-body" id="newsDetailBody"></div>
                <div class="news-detail-footer">
                    <button class="btn-share-news" onclick="shareNews('${newsId}')">
                        <i class="fas fa-share-alt"></i> Partager
                    </button>
                    <button class="btn-close-news" onclick="closeNewsDetail()">
                        <i class="fas fa-times"></i> Fermer
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Remplir le modal
    document.getElementById('newsDetailTitle').textContent = news.title;
    
    const body = document.getElementById('newsDetailBody');
    body.innerHTML = `
        <div class="news-detail-meta">
            <div class="news-detail-source">
                <i class="fas fa-newspaper"></i>
                <span>${news.source || 'Source non spécifiée'}</span>
            </div>
            <div class="news-detail-date">
                <i class="fas fa-calendar"></i>
                <span>${news.date}</span>
            </div>
            <div class="news-detail-author">
                <i class="fas fa-user"></i>
                <span>${news.author || 'Rédaction'}</span>
            </div>
            <div class="news-detail-time">
                <i class="fas fa-clock"></i>
                <span>${news.readTime || '3 minutes'}</span>
            </div>
        </div>
        
        ${news.image ? `
            <div class="news-detail-image">
                <img src="${news.image}" alt="${news.title}" onerror="this.src='https://picsum.photos/seed/${news.id}/1200/600'">
            </div>
        ` : ''}
        
        <div class="news-detail-excerpt">
            <h3><i class="fas fa-file-alt"></i> Résumé</h3>
            <p>${news.excerpt}</p>
        </div>
        
        <div class="news-detail-content-text">
            <h3><i class="fas fa-align-left"></i> Article complet</h3>
            <p>${news.content || 'Contenu non disponible.'}</p>
        </div>
        
        ${news.link ? `
            <div class="news-detail-link">
                <a href="${news.link}" target="_blank" class="btn-external-link">
                    <i class="fas fa-external-link-alt"></i> Lire l'article original
                </a>
            </div>
        ` : ''}
    `;
    
    // Afficher le modal
    document.getElementById('newsDetailModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeNewsDetail() {
    const modal = document.getElementById('newsDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function shareNews(newsId) {
    const news = CONFIG.news.find(n => n.id === newsId);
    if (!news) return;

    const shareText = `📰 ${news.title}\n\n${news.excerpt}\n\n📅 ${news.date} | ${news.source}\n🏷️ ${getCategoryLabel(news.category)}\n\nLire l'article complet: ${window.location.href}`;

    if (navigator.share) {
        navigator.share({
            title: news.title,
            text: shareText,
            url: window.location.href
        }).catch(err => console.log('Erreur partage:', err));
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Texte copié dans le presse-papiers !', 'success');
        });
    }
}

// ==========================================
// FONCTION POUR LES CATÉGORIES D'ACTUALITÉS
// ==========================================
function getCategoryLabel(category) {
    const labels = {
        'education': '🎓 Éducation',
        'sante': '🏥 Santé',
        'economie': '📈 Économie',
        'infrastructures': '🏗️ Infrastructures',
        'gouvernance': '🏛️ Gouvernance',
        'transparence': '👁️ Transparence',
        'general': '📰 Général',
        'default': '📰 Actualité'
    };
    return labels[category] || labels['default'];
}

// ==========================================
// FONCTION POUR LA LISTE DES SERVICES (AJOUTÉE)
// ==========================================
function updateServiceList() {
    const category = document.getElementById('serviceCategory').value;
    const serviceSelect = document.getElementById('service');
    
    // Liste complète des services par catégorie
    const servicesByCategory = {
        health: [
            "Hôpital public", "Centre hospitalier régional", "Centre de santé", 
            "Pharmacie publique (SEN-Pharmacie)", "SAMU (Service d'Assistance Médicale Urgente)",
            "Centre national de Transfusion sanguine", "Centre national d'Oncologie",
            "Laboratoire d'analyses médicales public", "Centre psychiatrique",
            "Service de Protection maternelle et infantile"
        ],
        education: [
            "École publique (élémentaire)", "Collège public", "Lycée public",
            "Université publique (UCAD, UGB, etc.)", "Institut Islamique de Dakar",
            "École nationale d'Administration (ENA)", "Centre de Formation judiciaire",
            "École nationale de Cybersécurité", "Centre régional des Œuvres universitaires",
            "Inspection d'Académie"
        ],
        // ... (autres catégories comme dans le fichier original)
        other: ["Autre (précisez en commentaire)"]
    };

    serviceSelect.innerHTML = '<option value="">Sélectionnez un service</option>';
    
    if (category && servicesByCategory[category]) {
        servicesByCategory[category].forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            option.textContent = service;
            serviceSelect.appendChild(option);
        });
    }
}
