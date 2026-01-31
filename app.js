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
        { id: '1', title: 'Le Soleil', date: '28/01/2026', image: 'https://picsum.photos/seed/soleil/300/400', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6d/Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg/200px-Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg.png' },
        { id: '2', title: 'Sud Quotidien', date: '28/01/2026', image: 'https://picsum.photos/seed/sud/300/400', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5b/Sud_Quotidien_logo.svg/200px-Sud_Quotidien_logo.svg.png' },
        { id: '3', title: 'Libération', date: '28/01/2026', image: 'https://picsum.photos/seed/liberation/300/400', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/8d/Lib%C3%A9ration_Logo.svg/200px-Lib%C3%A9ration_Logo.svg.png' },
        { id: '4', title: 'L\'Observateur', date: '28/01/2026', image: 'https://picsum.photos/seed/observateur/300/400', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/L%27Observateur_logo.svg/200px-L%27Observateur_logo.svg.png' },
        { id: '5', title: 'Le Quotidien', date: '28/01/2026', image: 'https://picsum.photos/seed/quotidien/300/400', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3c/Le_Quotidien_logo.svg/200px-Le_Quotidien_logo.svg.png' },
        { id: '6', title: 'WalFadjri', date: '28/01/2026', image: 'https://picsum.photos/seed/walfadjri/300/400', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7c/Walf_fadjri_logo.svg/200px-Walf_fadjri_logo.svg.png' }
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
// setupPhotoViewerControls(); // Commenté car non définie
console.log('🎯 Contrôles du visualiseur photo désactivés (fonction non définie)');
    console.log('✅ Initialisation terminée');
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
        if (supabaseClient) {
            setTimeout(() => {
                fetchAndDisplayPublicVotes().catch(error => {
                    console.warn('⚠️ Impossible de charger les votes:', error.message);
                });
            }, 1000);
        }
        
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
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
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
// MODAL DE NOTATION
// ==========================================
function showRatingModal(promiseId) {
    if (!supabaseClient) {
        showNotification('Fonctionnalité de notation non disponible hors ligne', 'info');
        return;
    }
    
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
    if (!supabaseClient) return;
    
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
        
        if (error) throw error;
        
        showNotification('Merci pour votre vote !', 'success');
        
        // Recharger les votes après un délai
        setTimeout(() => fetchAndDisplayPublicVotes(), 500);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde vote:', error);
        showNotification('Erreur lors de l\'enregistrement du vote', 'error');
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
function renderNewspapers() {
    const grid = document.getElementById('newspapersGrid');
    if (!grid) return;
    
    grid.innerHTML = CONFIG.press.map(paper => `
        <div class="newspaper-card" onclick="openPhotoViewer('${paper.id}')">
            <div class="newspaper-preview">
                <img src="${paper.image}" alt="${paper.title}" 
                     onerror="this.onerror=null; this.src='https://picsum.photos/300/400?random=${paper.id}'">
            </div>
            <h4>${paper.title}</h4>
            <p class="newspaper-date">${paper.date}</p>
        </div>
    `).join('');
}

// ==========================================
// CAROUSEL PRESSE - VERSION JOURNAL
// ==========================================
function setupPressCarousel() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const autoPlayToggle = document.getElementById('autoPlayToggle');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!prevBtn || !nextBtn || !indicators) return;

    prevBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
        CONFIG.zoomScale = 1; // Reset zoom when changing slide
        renderPressCarousel();
    });

    nextBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
        CONFIG.zoomScale = 1; // Reset zoom when changing slide
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

    indicators.innerHTML = CONFIG.press.map((_, index) => 
        `<button class="indicator ${index === CONFIG.currentIndex ? 'active' : ''}" onclick="goToSlide(${index})"></button>`
    ).join('');
    
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

    carousel.innerHTML = `
        <div class="carousel-item active">
            <div class="carousel-image-container">
                <img src="${currentPaper.image}" alt="${currentPaper.title}" 
                     onerror="this.onerror=null; this.src='https://picsum.photos/800/400?random=${CONFIG.currentIndex}'"
                     id="pressImage"
                     style="transform: scale(${CONFIG.zoomScale})">
            </div>
            <div class="carousel-overlay">
                <div class="carousel-info">
                    <div class="carousel-title">${currentPaper.title}</div>
                    <div class="carousel-date">${currentPaper.date}</div>
                    <a href="https://projetbi.org/presse" target="_blank" class="carousel-link">
                        Lire l'article <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
            
            <div class="carousel-controls-panel">
                <button class="carousel-control-btn" onclick="togglePressZoom('out')" title="Zoom -">
                    <i class="fas fa-search-minus"></i>
                </button>
                <button class="carousel-control-btn" onclick="togglePressZoom('reset')" title="Réinitialiser">
                    <i class="fas fa-expand"></i>
                </button>
                <button class="carousel-control-btn" onclick="togglePressZoom('in')" title="Zoom +">
                    <i class="fas fa-search-plus"></i>
                </button>
                <div class="carousel-zoom-info">${Math.round(CONFIG.zoomScale * 100)}%</div>
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
                        <span><i class="fas fa-clock"></i> ${daysRemaining}j</span>
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

window.goToCarouselSlide = function(index) {
    const carouselPromises = CONFIG.promises.slice(0, 6);
    const itemsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    const totalSlides = Math.ceil(carouselPromises.length / itemsPerSlide);
    
    if (index >= 0 && index < totalSlides) {
        const currentSlide = index;
        setupPromisesCarousel();
    }
};

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
// SERVICE RATINGS
// ==========================================
function setupServiceRatings() {
    const form = document.getElementById('ratingForm');
    const resultsSection = document.getElementById('ratingResults');
    
    if (!form || !resultsSection) return;
    
    if (!supabaseClient) {
        resultsSection.innerHTML = `
            <div class="rating-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Les fonctionnalités de notation ne sont pas disponibles actuellement.</p>
                <p class="rating-note">La plateforme fonctionne en mode lecture seule.</p>
            </div>
        `;
        return;
    }
    
    const starsContainers = document.querySelectorAll('.stars-container');

    starsContainers.forEach(container => {
        const field = container.getAttribute('data-field');
        const input = document.getElementById(field);
        const stars = container.querySelectorAll('i');
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const value = index + 1;
                input.value = value;
                updateStars(stars, value);
            });
            
            star.addEventListener('mouseenter', () => {
                updateStars(stars, index + 1);
            });
        });
        
        container.addEventListener('mouseleave', () => {
            const currentValue = parseInt(input.value) || 3;
            updateStars(stars, currentValue);
        });
        
        const initialValue = parseInt(input.value) || 3;
        updateStars(stars, initialValue);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            service: document.getElementById('service').value,
            accessibility: document.getElementById('accessibility').value,
            welcome: document.getElementById('welcome').value,
            efficiency: document.getElementById('efficiency').value,
            transparency: document.getElementById('transparency').value,
            comment: document.getElementById('comment').value.trim(),
            date: new Date().toISOString()
        };
        
        if (!formData.service) {
            showNotification('Veuillez sélectionner un service', 'error');
            return;
        }
        
        try {
            if (supabaseClient) {
                const { error } = await supabaseClient.from('service_ratings').insert([formData]);
                if (error) throw error;
                
                showNotification('Merci pour votre notation !', 'success');
                form.reset();
                
                starsContainers.forEach(container => {
                    const field = container.getAttribute('data-field');
                    const input = document.getElementById(field);
                    const stars = container.querySelectorAll('i');
                    input.value = '3';
                    updateStars(stars, 3);
                });
                
                setTimeout(() => fetchAndDisplayServiceRatings(), 1000);
            } else {
                showNotification('Fonctionnalité non disponible hors ligne', 'info');
            }
        } catch (error) {
            console.error('Erreur sauvegarde notation:', error);
            showNotification('Erreur lors de l\'enregistrement. Réessayez plus tard.', 'error');
        }
    });
    
    if (supabaseClient) fetchAndDisplayServiceRatings();
    else displayDemoRatingResults();
}

async function fetchAndDisplayServiceRatings() {
    if (!supabaseClient) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('service_ratings')
            .select('*')
            .order('date', { ascending: false })
            .limit(20);
        
        if (error) {
            console.warn('⚠️ Table service_ratings non trouvée - utilisation données démo');
            displayDemoRatingResults();
            return;
        }
        
        if (data && data.length > 0) displayRatingResults(data);
        else displayEmptyRatingResults();
    } catch (error) {
        console.warn('⚠️ Erreur chargement notations:', error.message);
        displayDemoRatingResults();
    }
}

function displayDemoRatingResults() {
    const resultsSection = document.getElementById('ratingResults');
    if (!resultsSection) return;
    
    resultsSection.innerHTML = `
        <div class="rating-results-grid">
            <div class="rating-results-card">
                <h4><i class="fas fa-chart-bar"></i> Meilleurs Services (Démo)</h4>
                <div class="top-services-grid">
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
                </div>
            </div>
            
            <div class="rating-results-card">
                <h4><i class="fas fa-clock"></i> Dernières Notations (Démo)</h4>
                <div class="recent-ratings">
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
                </div>
            </div>
            
            <div class="rating-results-card">
                <h4><i class="fas fa-poll"></i> Statistiques Globales</h4>
                <div class="stats-overview-grid">
                    <div class="stat-item-card">
                        <div class="stat-value-card">310</div>
                        <div class="stat-label-card">Votes totaux</div>
                    </div>
                    <div class="stat-item-card">
                        <div class="stat-value-card">8</div>
                        <div class="stat-label-card">Services évalués</div>
                    </div>
                    <div class="stat-item-card">
                        <div class="stat-value-card">185</div>
                        <div class="stat-label-card">Avec commentaires</div>
                    </div>
                </div>
                
                <h5 style="margin-top: 20px; margin-bottom: 10px;"><i class="fas fa-th-list"></i> Votes par Service</h5>
                <div class="votes-by-service-list">
                    <div class="service-vote-item-card">
                        <span class="service-name-card">Santé Publique</span>
                        <span class="service-votes-card">128 votes</span>
                    </div>
                    <div class="service-vote-item-card">
                        <span class="service-name-card">Éducation Nationale</span>
                        <span class="service-votes-card">95 votes</span>
                    </div>
                    <div class="service-vote-item-card">
                        <span class="service-name-card">Transports</span>
                        <span class="service-votes-card">87 votes</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="rating-disclaimer">
            <i class="fas fa-info-circle"></i>
            Ces données sont à titre démonstratif. Les fonctionnalités complètes seront activées lorsque la base de données sera configurée.
        </div>
    `;
}

function displayEmptyRatingResults() {
    const resultsSection = document.getElementById('ratingResults');
    if (!resultsSection) return;
    
    resultsSection.innerHTML = `
        <div class="rating-placeholder">
            <i class="fas fa-star"></i>
            <p>Aucune notation pour le moment.</p>
            <p class="rating-note">Soyez le premier à noter un service public !</p>
        </div>
    `;
}

// ==========================================
// VOTES PUBLICS
// ==========================================
async function fetchAndDisplayPublicVotes() {
    if (!supabaseClient) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('votes')
            .select('promise_id, rating');
        
        if (error) {
            console.warn('⚠️ Table votes non trouvée - pas de votes disponibles');
            return;
        }
        
        const votesMap = {};
        data.forEach(vote => {
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
        
    } catch (error) {
        console.warn('⚠️ Erreur chargement votes:', error.message);
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
window.togglePressZoom = togglePressZoom;
window.goToCarouselSlide = goToCarouselSlide;
// ==========================================
// FONCTIONS MANQUANTES POUR LA VISUALISATION PHOTO
// ==========================================
function initPhotoViewer() {
    console.log('📸 Initialisation du visualiseur photo');
    // Cette fonction sera implémentée plus tard
}

function openPhotoViewer(pressId) {
    console.log('Ouvrir visualiseur pour:', pressId);
    // Implémentation basique
    const paper = CONFIG.press.find(p => p.id === pressId);
    if (paper) {
        window.open(paper.image, '_blank');
    }
}

// ==========================================
// FONCTIONS POUR LA NOTATION - STRUCTURE VERTICALE
// ==========================================
function displayRatingResults(data) {
    if (!data || data.length === 0) {
        displayEmptyRatingResults();
        return;
    }

    // 1. Calculer les statistiques globales
    const totalVotes = data.length;
    const uniqueServices = [...new Set(data.map(item => item.service))];
    const avgRating = (data.reduce((sum, item) => {
        const accessibility = parseInt(item.accessibility) || 0;
        const welcome = parseInt(item.welcome) || 0;
        const efficiency = parseInt(item.efficiency) || 0;
        const transparency = parseInt(item.transparency) || 0;
        const avg = (accessibility + welcome + efficiency + transparency) / 4;
        return sum + avg;
    }, 0) / totalVotes).toFixed(1);

    // Mettre à jour les statistiques globales
    document.getElementById('totalVotes').textContent = totalVotes;
    document.getElementById('totalServices').textContent = uniqueServices.length;
    document.getElementById('avgRating').textContent = avgRating;

    // 2. Afficher les dernières notations
    const recentRatings = document.getElementById('recentRatings');
    recentRatings.innerHTML = data.slice(0, 3).map(item => `
        <div class="recent-item">
            <div class="recent-header">
                <span class="recent-service">${item.service}</span>
                <span class="recent-date">${formatDate(new Date(item.date))}</span>
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

    // 3. Calculer et afficher les meilleurs services
    const serviceStats = {};
    data.forEach(item => {
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
    
    recentRatings.innerHTML = `
        <div class="rating-placeholder">
            <p>Aucune notation récente</p>
        </div>
    `;
    
    topServices.innerHTML = `
        <div class="rating-placeholder">
            <p>Pas encore de services notés</p>
        </div>
    `;
}

// ==========================================
// CORRECTION DE L'APPEL INITIAL
// ==========================================
// Dans la fonction d'initialisation, remplacez :
// initPhotoViewer(); // Cette ligne cause l'erreur

// Par :
setTimeout(() => {
    console.log('📸 Visualiseur photo prêt');
    // Vous pourrez ajouter la fonction initPhotoViewer() plus tard
}, 100);

// Et pour la fonction renderNewspapers(), remplacez :
// onclick="openPhotoViewer('${paper.id}')"

// Par (temporairement) :
onclick="window.open('${paper.image}', '_blank')"

// ==========================================
// AJOUT DES FONCTIONS AU WINDOW
// ==========================================
window.openPhotoViewer = openPhotoViewer;
window.initPhotoViewer = initPhotoViewer;

// ==========================================
// CORRECTION DE LA FONCTION displayDemoRatingResults
// ==========================================
function displayDemoRatingResults() {
    // Statistiques Globales
    document.getElementById('totalVotes').textContent = '310';
    document.getElementById('totalServices').textContent = '8';
    document.getElementById('avgRating').textContent = '4.3';

    // Dernières Notations
    const recentRatings = document.getElementById('recentRatings');
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

    // Meilleurs Services
    const topServices = document.getElementById('topServices');
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

// Appeler la fonction
forceButtonVisibility();

// Et aussi après chaque rendu
setTimeout(forceButtonVisibility, 2000);
// ==========================================
// EXPORTS GLOBAUX POUR LA PRESSE
// ==========================================
window.openPhotoViewer = openPhotoViewer;
window.closePhotoViewer = closePhotoViewer;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.zoomReset = zoomReset;
window.prevPhoto = prevPhoto;
window.nextPhoto = nextPhoto;
window.togglePressZoom = togglePressZoom;
window.goToSlide = goToSlide;
