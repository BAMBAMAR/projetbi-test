// ==========================================
// CONFIGURATION ET INITIALISATION
// ==========================================

// Mode démo - activé si Supabase échoue
let DEMO_MODE = false;

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
    END_DATE: new Date('2029-04-02'),
    CURRENT_DATE: new Date(),
    promises: [],
    news: [],
    press: [],
    currentIndex: 0,
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
    filteredPromises: []
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
// INITIALISATION PRINCIPALE
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    
    // Initialiser les composants UI
    initNavigation();
    initScrollEffects();
    initFilters();
    initDateDisplay();
    initCountdown();
    initStarRatings();
    
    // Vérifier la connexion Supabase
    await checkSupabaseConnection();
    
    // Charger les données
    await loadData();
    
    // Initialiser filteredPromises après chargement
    CONFIG.filteredPromises = [...CONFIG.promises];
    CONFIG.currentVisible = Math.min(CONFIG.visibleCount, CONFIG.promises.length);
    
    // Rendre les données
    renderAll();
    
    // Configurer les composants
    setupPressCarousel();
    setupServiceRatings();
    setupDailyPromise();
    setupPromisesCarousel();
    setupKpiCarousel();
});

// ==========================================
// FONCTIONS D'INITIALISATION
// ==========================================

function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Gestion du menu mobile
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

    // Navigation fonctionnelle
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

    // Gestion du scroll pour activer les liens
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

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href && href === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, 100));
}

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

function initCountdown() {
    const endDate = CONFIG.END_DATE;
    const today = new Date();
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    const remainingMonths = diffMonths % 12;
    const remainingDays = diffDays % 30;
    
    document.getElementById('countdown-days').textContent = remainingDays;
    document.getElementById('countdown-months').textContent = remainingMonths;
    document.getElementById('countdown-years').textContent = diffYears;
}

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
// GESTION SUPABASE
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
        
        console.log('✅ Toutes les données chargées avec succès');
        
    } catch (error) {
        console.error('❌ Erreur chargement général:', error);
        showNotification('Erreur de chargement des données', 'error');
        CONFIG.promises = generateTestPromises();
        CONFIG.press = getDefaultPressData();
        renderAll();
    }
}

async function loadPromisesData() {
    try {
        const response = await fetch('promises.json');
        
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
                    date: '25/01/2026', 
                    source: 'Le Soleil', 
                    image: 'school' 
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
// FONCTIONS UTILITAIRES
// ==========================================

function parseDelayToDays(delayText) {
    if (!delayText || delayText.trim() === '') return 365;
    
    const lower = delayText.toLowerCase().trim();
    
    if (lower.includes('2030') || lower.includes('2029')) {
        return 1825;
    }
    
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
    
    const veryLongRangeMatch = lower.match(/5\s*à\s*10\s*an[s]?/i);
    if (veryLongRangeMatch) {
        totalDays = 1825;
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
    const result = Math.min(totalDays, MANDAT_MAX_DAYS);
    
    console.log(`parseDelayToDays: "${delayText}" → ${result} jours`);
    return result;
}

function getDaysRemaining(deadline) {
    if (!deadline || !(deadline instanceof Date) || isNaN(deadline.getTime())) {
        console.warn('Date limite invalide pour getDaysRemaining:', deadline);
        return 0;
    }
    
    const diff = deadline.getTime() - CONFIG.CURRENT_DATE.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return days;
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

function fixInvalidDelays() {
    console.log('🔧 Correction des délais invalides...');
    let corrections = 0;
    
    CONFIG.promises.forEach(promise => {
        const currentDelay = parseInt(promise.delai);
        
        if (currentDelay > 1825) {
            promise.delai = '1825';
            promise.delai_texte = 'Quinquennat';
            promise.deadline = calculateDeadlineFromDays(1825);
            promise.isLate = checkIfLate(promise.status, promise.deadline);
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
// RENDU DES DONNÉES
// ==========================================

function renderAll() {
    console.log('renderAll: Rendering', CONFIG.promises.length, 'promises');
    
    if (!CONFIG.filteredPromises || CONFIG.filteredPromises.length === 0) {
        CONFIG.filteredPromises = [...CONFIG.promises];
    }
    
    updateStats();
    renderStatsGrid();
    
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

function renderStatsGrid() {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    const stats = calculateStats();
    
    statsGrid.innerHTML = `
        <div class="stat-card stat-total">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-bullhorn"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Engagements totaux</div>
            </div>
            <div class="stat-footer">
                <span class="stat-percentage" id="total-percentage">100%</span>
            </div>
        </div>
        
        <div class="stat-card stat-success">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.realise}</div>
                <div class="stat-label">Réalisés</div>
            </div>
            <div class="stat-footer">
                <span class="stat-percentage" id="realise-percentage">${stats.realisePercentage}%</span>
            </div>
        </div>
        
        <div class="stat-card stat-progress">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-spinner"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.encours}</div>
                <div class="stat-label">En cours</div>
            </div>
            <div class="stat-footer">
                <span class="stat-percentage" id="encours-percentage">${stats.encoursPercentage}%</span>
            </div>
        </div>
        
        <div class="stat-card stat-pending">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.nonLance}</div>
                <div class="stat-label">Non lancés</div>
            </div>
            <div class="stat-footer">
                <span class="stat-percentage" id="non-lance-percentage">${stats.nonLancePercentage}%</span>
            </div>
        </div>
        
        <div class="stat-card stat-warning">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.retard}</div>
                <div class="stat-label">En retard</div>
            </div>
            <div class="stat-footer">
                <span class="stat-percentage" id="retard-percentage">${stats.retardPercentage}%</span>
            </div>
        </div>
        
        <div class="stat-card stat-rate">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.tauxRealisation}%</div>
                <div class="stat-label">Taux de réalisation</div>
            </div>
        </div>
        
        <div class="stat-card stat-rating">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-star"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.avgRating}</div>
                <div class="stat-label">Note moyenne</div>
            </div>
            <div class="stat-footer">
                <span class="stat-subvalue" id="votes-total">${stats.totalVotes} votes</span>
            </div>
        </div>
        
        <div class="stat-card stat-update">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-history"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.withUpdates}</div>
                <div class="stat-label">Avec mises à jour</div>
            </div>
            <div class="stat-footer">
                <span class="stat-percentage" id="avec-maj-percentage">${stats.withUpdatesPercentage}%</span>
            </div>
        </div>
        
        <div class="stat-card stat-time">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-hourglass-half"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.avgDelay}j</div>
                <div class="stat-label">Retard moyen</div>
            </div>
        </div>
        
        <div class="stat-card stat-domain">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-building"></i>
                </div>
            </div>
            <div class="stat-body">
                <div class="stat-value">${stats.principalDomain}</div>
                <div class="stat-label">Domaine principal</div>
            </div>
            <div class="stat-footer">
                <span class="stat-subvalue" id="domaine-count">${stats.principalDomainCount} engagements</span>
            </div>
        </div>
    `;
}

function calculateStats() {
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
    
    const domains = CONFIG.promises.reduce((acc, p) => {
        const domain = p.domain || 'Autre';
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
    }, {});
    
    let principalDomain = 'Non spécifié';
    let principalDomainCount = 0;
    
    if (Object.keys(domains).length > 0) {
        const sortedDomains = Object.entries(domains).sort((a, b) => b[1] - a[1]);
        principalDomain = sortedDomains[0][0];
        principalDomainCount = sortedDomains[0][1];
    }
    
    return {
        total,
        realise,
        encours,
        nonLance,
        retard,
        withUpdates,
        tauxRealisation,
        avgDelay: retard > 0 ? avgRetard : avgDelay,
        avgRating,
        totalVotes,
        principalDomain,
        principalDomainCount,
        realisePercentage: total > 0 ? Math.round((realise / total) * 100) : 0,
        encoursPercentage: total > 0 ? Math.round((encours / total) * 100) : 0,
        nonLancePercentage: total > 0 ? Math.round((nonLance / total) * 100) : 0,
        retardPercentage: total > 0 ? Math.round((retard / total) * 100) : 0,
        withUpdatesPercentage: total > 0 ? Math.round((withUpdates / total) * 100) : 0
    };
}

function updateStats() {
    const stats = calculateStats();
    
    KPI_ITEMS[0].value = stats.total;
    KPI_ITEMS[1].value = stats.realise;
    KPI_ITEMS[2].value = stats.encours;
    KPI_ITEMS[3].value = stats.retard;
    KPI_ITEMS[4].value = `${stats.tauxRealisation}%`;
    
    if (stats.retard > 0) {
        KPI_ITEMS[5].value = `${stats.avgDelay}j`;
        KPI_ITEMS[5].label = '⚠️ Retard Moyen';
        KPI_ITEMS[5].icon = '⚠️';
    } else if (stats.avgDelay > 0) {
        KPI_ITEMS[5].value = `${stats.avgDelay}j`;
        KPI_ITEMS[5].label = '⏱️ Retard moyen';
        KPI_ITEMS[5].icon = '⏱️';
    } else {
        KPI_ITEMS[5].value = 'N/A';
        KPI_ITEMS[5].label = '⏱️ Retard moyen';
        KPI_ITEMS[5].icon = '⏱️';
    }
    
    KPI_ITEMS[6].value = stats.avgRating;
    KPI_ITEMS[7].value = stats.withUpdates;
}

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
                        <button class="social-btn fb" onclick="shareToPlatform('${promise.id}', 'facebook')" 
                                title="Partager sur Facebook">
                            <i class="fab fa-facebook-f"></i>
                        </button>
                        <button class="social-btn tw" onclick="shareToPlatform('${promise.id}', 'twitter')" 
                                title="Partager sur Twitter">
                            <i class="fab fa-x-twitter"></i>
                        </button>
                        <button class="social-btn wa" onclick="shareToPlatform('${promise.id}', 'whatsapp')" 
                                title="Partager sur WhatsApp">
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
    
    setTimeout(() => {
        forceSocialButtonsColors();
    }, 100);
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
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
    return stars;
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

function applyFilters() {
    const filterStatus = document.getElementById('filter-status')?.value || '';
    const filterDomain = document.getElementById('filter-domain')?.value || '';
    const filterSearch = document.getElementById('filter-search')?.value.toLowerCase() || '';
    
    console.log('Filtrage avec:', { filterStatus, filterDomain, filterSearch });
    
    let filtered = CONFIG.promises;
    
    if (filterStatus) {
        if (filterStatus === 'En retard') {
            filtered = filtered.filter(promise => promise.isLate === true);
        } 
        else if (filterStatus === '✅ Réalisé') {
            filtered = filtered.filter(promise => 
                promise.status === 'Réalisé' && promise.isLate === false
            );
        } 
        else if (filterStatus === '🔄 En cours') {
            filtered = filtered.filter(promise => 
                promise.status === 'En cours' && promise.isLate === false
            );
        } 
        else if (filterStatus === '⏳ Non lancé') {
            filtered = filtered.filter(promise => 
                promise.status === 'Non lancé' && promise.isLate === false
            );
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
    
    console.log('Résultat filtre:', filtered.length, 'promesses');
    
    CONFIG.filteredPromises = filtered;
    updateFilteredDisplay();
}

function updateFilteredDisplay() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    console.log('updateFilteredDisplay:', CONFIG.filteredPromises.length, 'promesses');
    
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
    
    updateFilteredDisplay();
    
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
// FONCTIONS DE PARTAGE ET NOTATION
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
// LOCALSTORAGE
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
        <div class="daily-promise-card">
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
        </div>
    `;
}

// ==========================================
// PRESSE
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
            <div class="carousel-image-container">
                <img src="${imageUrl}" alt="${currentPaper.title}" 
                     onerror="this.onerror=null; this.src='https://picsum.photos/700/933?random=${CONFIG.currentIndex}'"
                     id="pressImage"
                     style="transform: scale(${CONFIG.zoomScale})">
            </div>
        </div>
    `;

    indicators.innerHTML = CONFIG.press.map((_, index) => `
        <button class="indicator ${index === CONFIG.currentIndex ? 'active' : ''}" 
                onclick="goToSlide(${index})"></button>
    `).join('');
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

function goToSlide(index) {
    CONFIG.currentIndex = index;
    CONFIG.zoomScale = 1;
    renderPressCarousel();
}

async function checkAvailableNewspapers() {
    const availablePapers = [];
    
    for (const paper of CONFIG.press) {
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
    
    if (availablePapers.length === 0) {
        console.log('⚠️ Aucune image vérifiée, utilisation de toutes les données');
        return CONFIG.press;
    }
    
    console.log(`📊 ${availablePapers.length}/${CONFIG.press.length} images disponibles`);
    return availablePapers;
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
    const kpiPrev = document.getElementById('kpiPrev');
    const kpiNext = document.getElementById('kpiNext');
    const kpiAutoPlayToggle = document.getElementById('kpiAutoPlayToggle');
    
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
        
        const { error } = await supabaseClient
            .from('service_ratings')
            .insert([supabaseData]);
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            return false;
        }
        
        console.log('✅ Notation envoyée à Supabase avec succès');
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
        
        document.getElementById('totalVotes').textContent = totalVotesFromStats;
        document.getElementById('totalServices').textContent = stats.length;
        document.getElementById('avgRating').textContent = overallAvg;
        
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
            const avg = (parseInt(item.accessibility) + parseInt(item.welcome) + parseInt(item.efficiency) + parseInt(item.transparency)) / 4;
            return sum + avg;
        }, 0) / totalVotes).toFixed(1);

        document.getElementById('totalVotes').textContent = totalVotes;
        document.getElementById('totalServices').textContent = uniqueServices.length;
        document.getElementById('avgRating').textContent = avgRating;

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
    document.getElementById('totalVotes').textContent = '310';
    document.getElementById('totalServices').textContent = '8';
    document.getElementById('avgRating').textContent = '4.3';

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
        
        console.log('Envoi du vote:', voteData);
        
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
// FONCTIONS AUXILIAIRES
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
    if (overlay) {
        overlay.remove();
    }
    document.body.style.overflow = '';
}

function forceSocialButtonsColors() {
    const socialButtons = document.querySelectorAll('.social-btn');
    
    socialButtons.forEach(btn => {
        btn.className = 'social-btn';
        
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
window.goToCarouselSlide = goToCarouselSlide;
window.shareToPlatform = shareToPlatform;
window.goToPromiseSection = goToPromiseSection;