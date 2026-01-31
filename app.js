// ==========================================
// APP.JS - VERSION OPTIMISÉE POUR VOTRE STRUCTURE
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

// Configuration globale
const CONFIG = {
    START_DATE: new Date('2024-04-02'),
    CURRENT_DATE: new Date(),
    promises: [],
    news: [],
    press: [
        { id: '1', title: 'Le Soleil', date: '28/01/2026', image: 'https://picsum.photos/seed/soleil/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6d/Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg/200px-Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg.png' },
        { id: '2', title: 'Sud Quotidien', date: '28/01/2026', image: 'https://picsum.photos/seed/sud/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5b/Sud_Quotidien_logo.svg/200px-Sud_Quotidien_logo.svg.png' },
        { id: '3', title: 'Libération', date: '28/01/2026', image: 'https://picsum.photos/seed/liberation/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/8d/Lib%C3%A9ration_Logo.svg/200px-Lib%C3%A9ration_Logo.svg.png' },
        { id: '4', title: 'L\'Observateur', date: '28/01/2026', image: 'https://picsum.photos/seed/observateur/400/533', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/L%27Observateur_logo.svg/200px-L%27Observateur_logo.svg.png' },
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
    currentRatingValue: 0
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
    { label: '⏱️ Délai Moyen', value: '0j', icon: '⏱️' },
    { label: '⭐ Note Moyenne', value: '0.0', icon: '⭐' },
    { label: '📋 Avec MAJ', value: '0', icon: '📋' }
];

// ==========================================
// FONCTION DE CONVERSION DES DÉLAIS TEXTE EN JOURS
// ==========================================
function parseDelayToDays(delayText) {
    if (!delayText || delayText.trim() === '') return 1095; // 3 ans par défaut
    
    const lower = delayText.toLowerCase();
    if (lower.includes('immédiat') || lower.includes('immediat') || lower.includes('dès')) {
        return 0;
    }
    
    let totalDays = 0;
    
    // Années
    const yearsMatch = delayText.match(/(\d+)\s*an[s]?/i);
    if (yearsMatch) totalDays += parseInt(yearsMatch[1], 10) * 365;
    
    // Mois
    const monthsMatch = delayText.match(/(\d+)\s*mois/i);
    if (monthsMatch) totalDays += parseInt(monthsMatch[1], 10) * 30;
    
    // Jours
    const daysMatch = delayText.match(/(\d+)\s*jour[s]?/i);
    if (daysMatch) totalDays += parseInt(daysMatch[1], 10);
    
    // Expressions comme "3 premières années"
    const firstYearsMatch = delayText.match(/(\d+)\s*premières?\s*années?/i);
    if (firstYearsMatch) totalDays += parseInt(firstYearsMatch[1], 10) * 365;
    
    if (totalDays === 0) {
        const num = parseInt(delayText, 10);
        totalDays = !isNaN(num) ? num * 365 : 1095; // 3 ans par défaut
    }
    
    return totalDays;
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
    initPhotoViewer();

    // Charger les données
    await loadData();

    // Configurer les composants
    setupPressCarousel();
    setupServiceRatings();
    setupDailyPromise();
    setupPromisesCarousel();
    setupKpiCarousel();
    
    // Initialiser les étoiles de notation
    initStarRatings();
    
    // Initialiser le visualiseur photo avec un délai
    setTimeout(() => {
        if (typeof setupPhotoViewerControls === 'function') {
            setupPhotoViewerControls();
        }
    }, 500);
    
    // Testez la connexion Supabase
    setTimeout(testServiceRatingsTable, 3000);
});

// ==========================================
// NAVIGATION
// ==========================================
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('show');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            const target = document.getElementById(section);

            if (target) {
                const offset = CONFIG.scrollOffset;
                const targetPosition = target.offsetTop - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                if (navMenu.classList.contains('show')) {
                    navMenu.classList.remove('show');
                    mobileMenuBtn?.classList.remove('active');
                }
            }
        });
    });

    // Scroll spy
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section[id]');

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.pageYOffset >= (sectionTop - CONFIG.scrollOffset - 50)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current) {
                link.classList.add('active');
            }
        });
    });
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
// CHARGEMENT DES DONNÉES - ADAPTÉ À VOTRE STRUCTURE
// ==========================================
async function loadData() {
    try {
        const response = await fetch('promises.json');
        
        if (!response.ok) {
            console.warn('Fichier promises.json non trouvé - utilisation des données de test');
            CONFIG.promises = generateTestPromises();
        } else {
            const data = await response.json();
            
            // Récupérer la date de début depuis le JSON
            if (data.start_date) {
                CONFIG.START_DATE = new Date(data.start_date);
            }
            
            // Traiter les promesses selon votre structure
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
                const delayDays = parseDelayToDays(p.delai || '3 premières années');
                
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
                    delai_texte: p.delai || `${Math.round(delayDays/365)} années`,
                    resultat: p.resultat || p.objectif || 'Résultats non spécifiés',
                    updates: updates,
                    deadline: deadline,
                    isLate: isLate,
                    publicAvg: 0,
                    publicCount: 0
                };
            });
        }
        
        // Trier les promesses : d'abord en retard, puis par date limite
        CONFIG.promises.sort((a, b) => {
            if (a.isLate && !b.isLate) return -1;
            if (!a.isLate && b.isLate) return 1;
            return a.deadline - b.deadline;
        });
        
        // Charger les votes publics si Supabase est disponible
        setTimeout(() => {
            fetchAndDisplayPublicVotes().catch(error => {
                console.warn('⚠️ Impossible de charger les votes:', error.message);
            });
        }, 1000);
        
        // Données de démonstration pour les actualités
        CONFIG.news = [
            { id: '1', title: 'Lancement officiel de la plateforme', excerpt: 'La plateforme citoyenne de suivi des engagements est désormais opérationnelle.', date: '25/01/2026', source: 'Le Soleil', image: 'school' },
            { id: '2', title: 'Première école numérique inaugurée', excerpt: 'Le gouvernement a inauguré la première école entièrement numérique à Dakar.', date: '20/01/2026', source: 'Sud Quotidien', image: 'inauguration' },
            { id: '3', title: 'Budget 2026 axé sur la relance économique', excerpt: 'Le budget de l\'État pour 2026 prévoit d\'importants investissements dans les infrastructures.', date: '15/01/2026', source: 'WalFadjri', image: 'budget' }
        ];
        
        // Rendre tout
        renderAll();
        renderNews(CONFIG.news);
        renderNewspapers();
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showNotification('Erreur de chargement des données', 'error');
        CONFIG.promises = generateTestPromises();
        renderAll();
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
// CALCULS
// ==========================================
function calculateDeadlineFromDays(days) {
    const deadline = new Date(CONFIG.START_DATE);
    deadline.setDate(deadline.getDate() + parseInt(days, 10));
    return deadline;
}

function checkIfLate(status, deadline) {
    if (status === 'Réalisé') return false;
    return CONFIG.CURRENT_DATE > deadline;
}

function getDaysRemaining(deadline) {
    const diff = deadline - CONFIG.CURRENT_DATE;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
                                ${daysRemaining > 0 ? `${daysRemaining} jours` : daysRemaining < 0 ? `${Math.abs(daysRemaining)} jours de retard` : 'Aujourd\'hui'}
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
    updateStats();
    renderPromises(CONFIG.promises.slice(0, CONFIG.currentVisible));
    populateDomainFilter();
    updateKpiCarousel();
}

// ==========================================
// UPDATE STATS
// ==========================================
function updateStats() {
    const total = CONFIG.promises.length;
    const realise = CONFIG.promises.filter(p => p.status === 'Réalisé').length;
    const encours = CONFIG.promises.filter(p => p.status === 'En cours').length;
    const nonLance = CONFIG.promises.filter(p => p.status === 'Non lancé').length;
    const retard = CONFIG.promises.filter(p => p.isLate).length;
    const withUpdates = CONFIG.promises.filter(p => p.updates && p.updates.length > 0).length;
    const tauxRealisation = total > 0 ? Math.round((realise / total) * 100) : 0;
    
    KPI_ITEMS[0].value = total;
    KPI_ITEMS[1].value = realise;
    KPI_ITEMS[2].value = encours;
    KPI_ITEMS[3].value = retard;
    KPI_ITEMS[4].value = `${tauxRealisation}%`;
    
    const nonRealises = CONFIG.promises.filter(p => p.status !== 'Réalisé');
    const avgDelay = nonRealises.length > 0
        ? nonRealises.reduce((sum, p) => sum + Math.abs(getDaysRemaining(p.deadline)), 0) / nonRealises.length
        : 0;
    
    KPI_ITEMS[5].value = `${Math.round(avgDelay)}j`;
    
    const allRatings = CONFIG.promises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    const totalVotes = allRatings.reduce((sum, p) => sum + p.publicCount, 0);
    
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
    updateStatValue('delai-moyen', `${Math.round(avgDelay)}j`);
    
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

    [filterStatus, filterDomain, filterSearch].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
            filter.addEventListener('input', applyFilters);
        }
    });

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            CONFIG.currentVisible = CONFIG.promises.length;
            renderPromises(CONFIG.promises);
            showMoreBtn.style.display = 'none';
            showLessBtn.style.display = 'inline-flex';
        });
    }

    if (showLessBtn) {
        showLessBtn.addEventListener('click', () => {
            CONFIG.currentVisible = CONFIG.visibleCount;
            renderPromises(CONFIG.promises.slice(0, CONFIG.currentVisible));
            showLessBtn.style.display = 'none';
            showMoreBtn.style.display = 'inline-flex';
        });
    }
}

function applyFilters() {
    const filterStatus = document.getElementById('filter-status')?.value || '';
    const filterDomain = document.getElementById('filter-domain')?.value || '';
    const filterSearch = document.getElementById('filter-search')?.value.toLowerCase() || '';
    
    const filtered = CONFIG.promises.filter(promise => {
        let match = true;
        
        if (filterStatus) {
            if (filterStatus === 'En retard') {
                match = match && promise.isLate;
            } else {
                const statusMap = { '✅ Réalisé': 'Réalisé', '🔄 En cours': 'En cours', '⏳ Non lancé': 'Non lancé' };
                const normalizedStatus = statusMap[filterStatus] || filterStatus.replace('✅ ', '').replace('🔄 ', '').replace('⏳ ', '').replace('⚠️ ', '');
                match = match && promise.status.includes(normalizedStatus);
            }
        }
        
        if (filterDomain && filterDomain !== '') {
            match = match && (promise.domain || '').includes(filterDomain);
        }
        
        if (filterSearch) {
            match = match && (
                promise.engagement.toLowerCase().includes(filterSearch) ||
                (promise.domain || '').toLowerCase().includes(filterSearch) ||
                (promise.resultat || '').toLowerCase().includes(filterSearch)
            );
        }
        
        return match;
    });

    CONFIG.currentVisible = Math.min(CONFIG.visibleCount, filtered.length);
    renderPromises(filtered.slice(0, CONFIG.currentVisible));
    updateResultsCount(filtered.length);
    
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    if (filtered.length > CONFIG.visibleCount) {
        showMoreBtn.style.display = 'inline-flex';
        showLessBtn.style.display = 'none';
    } else {
        showMoreBtn.style.display = 'none';
        showLessBtn.style.display = 'none';
    }
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
    
    if (promises.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <p><i class="fas fa-search"></i> Aucun engagement trouvé avec ces critères.</p>
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
                        ${statusIcon} ${promise.isLate ? 'En retard' : promise.status}
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
                    <span><i class="fas fa-clock"></i> ${daysRemaining > 0 ? `${daysRemaining} jours restants` : daysRemaining < 0 ? `${Math.abs(daysRemaining)} jours de retard` : 'Aujourd\'hui'}</span>
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
                        <button class="social-btn fb" onclick="shareToPlatform('${promise.id}', 'facebook')" title="Part
