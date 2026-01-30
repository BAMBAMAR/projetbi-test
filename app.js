// ==========================================
// APP.JS - VERSION OPTIMISÉE ET CORRIGÉE
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
    isDragging: false
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
    if (!delayText || delayText.trim() === '') return 0;
    
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
    
    if (totalDays === 0) {
        const num = parseInt(delayText, 10);
        totalDays = !isNaN(num) ? num : 365;
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
    setupPhotoViewerControls();

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
// CHARGEMENT DES DONNÉES
// ==========================================
async function loadData() {
    try {
        const response = await fetch('promises.json');
        
        if (!response.ok) {
            console.warn('Fichier promises.json non trouvé - utilisation des données de test');
            CONFIG.promises = generateTestPromises();
        } else {
            const data = await response.json();
            CONFIG.START_DATE = new Date(data.start_date || '2024-04-02');
            
            CONFIG.promises = (data.promises || []).map(p => {
                let status = p.status || p.statut || 'Non lancé';
                if (status.includes('réalisé') || status.includes('realise')) status = 'Réalisé';
                else if (status.includes('retard')) status = 'En retard';
                else if (status.includes('cours') || status.includes('encours')) status = 'En cours';
                else if (status.includes('lancé') || status.includes('lance')) status = 'Non lancé';
                
                const domain = p.domaine || p.categorie || p.domain || 'Autre';
                const delayDays = parseDelayToDays(p.delai || p.delai_texte || '365');
                const deadline = calculateDeadlineFromDays(delayDays);
                const isLate = checkIfLate(status, deadline);
                
                return {
                    id: p.id || Math.random().toString(36).substr(2, 9),
                    engagement: p.engagement || p.titre || p.description || 'Engagement non spécifié',
                    domain: domain,
                    status: status,
                    delai: delayDays.toString(),
                    delai_texte: p.delai || p.delai_texte || `${delayDays} jours`,
                    resultat: p.resultat || p.objectif || p['résultats attendus'] || 'Résultats non spécifiés',
                    updates: p.updates || p.mises_a_jour || [],
                    deadline: deadline,
                    isLate: isLate,
                    publicAvg: 0,
                    publicCount: 0
                };
            });
        }
        
        CONFIG.promises.sort((a, b) => {
            if (a.isLate && !b.isLate) return -1;
            if (!a.isLate && b.isLate) return 1;
            return a.deadline - b.deadline;
        });
        
        if (supabaseClient) {
            setTimeout(() => {
                fetchAndDisplayPublicVotes().catch(error => {
                    console.warn('⚠️ Impossible de charger les votes:', error.message);
                });
            }, 1000);
        }
        
        CONFIG.news = [
            { id: '1', title: 'Lancement officiel de la plateforme', excerpt: 'La plateforme citoyenne de suivi des engagements est désormais opérationnelle.', date: '25/01/2026', source: 'Le Soleil', image: 'school' },
            { id: '2', title: 'Première école numérique inaugurée', excerpt: 'Le gouvernement a inauguré la première école entièrement numérique à Dakar.', date: '20/01/2026', source: 'Sud Quotidien', image: 'inauguration' },
            { id: '3', title: 'Budget 2026 axé sur la relance économique', excerpt: 'Le budget de l\'État pour 2026 prévoit d\'importants investissements dans les infrastructures.', date: '15/01/2026', source: 'WalFadjri', image: 'budget' }
        ];
        
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

// Générer des données de test
function generateTestPromises() {
    return [
        {
            id: '1',
            engagement: 'Supprimer le poste de Premier Ministre et instaurer un poste de Vice-Président',
            domain: 'Gouvernance',
            status: 'En retard',
            delai: '730',
            delai_texte: '2 ans',
            resultat: 'Exécutif resserré et équilibre des pouvoirs',
            updates: [
                { date: '2025-06-15', description: 'Analyse constitutionnelle en cours' },
                { date: '2025-03-10', description: 'Consultations avec les partis politiques' }
            ]
        },
        {
            id: '2',
            engagement: 'Transformer le Conseil Constitutionnel en Cour Constitutionnelle',
            domain: 'Justice',
            status: 'En retard',
            delai: '730',
            delai_texte: '2 ans',
            resultat: 'Organe au sommet de l\'organisation judiciaire',
            updates: [
                { date: '2025-05-20', description: 'Projet de loi en préparation' }
            ]
        },
        {
            id: '3',
            engagement: 'Couverture Sanitaire Universelle (CSU)',
            domain: 'Santé',
            status: 'En retard',
            delai: '730',
            delai_texte: '2 ans',
            resultat: 'Soins pour tous',
            updates: []
        }
    ].map(p => {
        const deadline = calculateDeadlineFromDays(parseInt(p.delai));
        return {
            ...p,
            deadline: deadline,
            isLate: checkIfLate(p.status, deadline),
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
                                <div class="update-date-small">${formatDateProper(update.date || update.created_at)}</div>
                                <div class="update-text-small">${update.description || update.texte || 'Mise à jour'}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="article-footer">
                <button class="btn-article-primary" onclick="sharePromise('${promise.id}')">
                    <i class="fas fa-share-alt"></i> Partager cette promesse
                </button>
                <button class="btn-article-secondary" onclick="ratePromise('${promise.id}')">
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
                                    <div class="update-date">${formatDateProper(update.date || update.created_at)}</div>
                                    <div class="update-text">${update.description || update.texte || 'Mise à jour des engagements'}</div>
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
                    <button class="btn-stars" onclick="ratePromise('${promise.id}')" title="Noter">
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
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Date non disponible';
    
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
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
        renderPressCarousel();
    });

    nextBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
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
            <img src="${currentPaper.image}" alt="${currentPaper.title}" 
                 onerror="this.onerror=null; this.src='https://picsum.photos/800/400?random=${CONFIG.currentIndex}'"
                 id="pressImage"
                 style="transform: scale(${CONFIG.zoomScale})">
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
    if (pressImage) {
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;
        
        pressImage.addEventListener('mousedown', (e) => {
            if (CONFIG.zoomScale > 1) {
                isDragging = true;
                startX = e.pageX - pressImage.offsetLeft;
                startY = e.pageY - pressImage.offsetTop;
                scrollLeft = pressImage.scrollLeft;
                scrollTop = pressImage.scrollTop;
                pressImage.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - pressImage.offsetLeft;
            const y = e.pageY - pressImage.offsetTop;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            pressImage.scrollLeft = scrollLeft - walkX;
            pressImage.scrollTop = scrollTop - walkY;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            pressImage.style.cursor = CONFIG.zoomScale > 1 ? 'grab' : 'default';
        });
        
        pressImage.addEventListener('mouseenter', () => {
            if (CONFIG.zoomScale > 1) {
                pressImage.style.cursor = 'grab';
            }
        });
        
        pressImage.addEventListener('mouseleave', () => {
            pressImage.style.cursor = 'default';
        });
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

function updateStars(stars, value) {
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
    });
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
// PHOTO VIEWER PRESSE
// ==========================================
function initPhotoViewer() {
    const modal = document.createElement('div');
    modal.id = 'photoViewerModal';
    modal.className = 'photo-viewer-modal';
    modal.innerHTML = `
        <div class="photo-viewer-content">
            <div class="photo-viewer-header">
                <h3 id="photoViewerTitle">Titre du journal</h3>
                <div class="photo-viewer-controls">
                    <button id="zoomOutBtn" title="Zoom -"><i class="fas fa-search-minus"></i></button>
                    <button id="zoomResetBtn" title="Réinitialiser"><i class="fas fa-expand"></i></button>
                    <button id="zoomInBtn" title="Zoom +"><i class="fas fa-search-plus"></i></button>
                    <button id="rotateBtn" title="Pivoter"><i class="fas fa-sync-alt"></i></button>
                    <button id="closeViewerBtn" title="Fermer">&times;</button>
                </div>
            </div>
            <div class="photo-viewer-body">
                <button id="prevPhotoBtn" class="nav-btn prev"><i class="fas fa-chevron-left"></i></button>
                <div class="photo-container" id="photoContainer">
                    <img src="" id="photoViewerImage" alt="" onerror="this.onerror=null; this.src='https://picsum.photos/600/800?random='+Math.random()">
                </div>
                <button id="nextPhotoBtn" class="nav-btn next"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="photo-viewer-footer">
                <span id="photoCounter">1 / ${CONFIG.press.length}</span>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function setupPhotoViewerControls() {
    const modal = document.getElementById('photoViewerModal');
    const closeBtn = document.getElementById('closeViewerBtn');
    const prevBtn = document.getElementById('prevPhotoBtn');
    const nextBtn = document.getElementById('nextPhotoBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomResetBtn = document.getElementById('zoomResetBtn');
    const rotateBtn = document.getElementById('rotateBtn');
    const photoContainer = document.getElementById('photoContainer');
    const photoImage = document.getElementById('photoViewerImage');
    
    let scale = 1;
    let rotate = 0;
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    
    function updatePhotoTransform() {
        photoImage.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
        if (scale > 1) {
            photoImage.style.cursor = 'grab';
        } else {
            photoImage.style.cursor = 'default';
        }
    }
    
    // Drag functionality
    photoImage.addEventListener('mousedown', (e) => {
        if (scale > 1) {
            isDragging = true;
            startX = e.pageX - photoContainer.offsetLeft;
            startY = e.pageY - photoContainer.offsetTop;
            scrollLeft = photoContainer.scrollLeft;
            scrollTop = photoContainer.scrollTop;
            photoImage.style.cursor = 'grabbing';
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - photoContainer.offsetLeft;
        const y = e.pageY - photoContainer.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        photoContainer.scrollLeft = scrollLeft - walkX;
        photoContainer.scrollTop = scrollTop - walkY;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (scale > 1) {
            photoImage.style.cursor = 'grab';
        }
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            scale = 1;
            rotate = 0;
            updatePhotoTransform();
            photoContainer.scrollLeft = 0;
            photoContainer.scrollTop = 0;
        });
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            scale = 1;
            rotate = 0;
            updatePhotoTransform();
            photoContainer.scrollLeft = 0;
            photoContainer.scrollTop = 0;
        }
    });
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            CONFIG.currentIndex = (CONFIG.currentIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
            updatePhotoViewer();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
            updatePhotoViewer();
        });
    }
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            scale = Math.min(scale + 0.2, 3);
            updatePhotoTransform();
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            scale = Math.max(scale - 0.2, 0.5);
            updatePhotoTransform();
        });
    }
    
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => {
            scale = 1;
            rotate = 0;
            updatePhotoTransform();
            photoContainer.scrollLeft = 0;
            photoContainer.scrollTop = 0;
        });
    }
    
    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            rotate = (rotate + 90) % 360;
            updatePhotoTransform();
        });
    }
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    photoContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    photoContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
            updatePhotoViewer();
        }
        if (touchEndX - touchStartX > 50) {
            CONFIG.currentIndex = (CONFIG.currentIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
            updatePhotoViewer();
        }
    });
}

function openPhotoViewer(paperId) {
    const modal = document.getElementById('photoViewerModal');
    const paper = CONFIG.press.find(p => p.id === paperId);
    
    if (paper) {
        CONFIG.currentIndex = CONFIG.press.findIndex(p => p.id === paperId);
        updatePhotoViewer();
        modal.style.display = 'flex';
    }
}

function updatePhotoViewer() {
    const currentPaper = CONFIG.press[CONFIG.currentIndex];
    const titleEl = document.getElementById('photoViewerTitle');
    const imageEl = document.getElementById('photoViewerImage');
    const counterEl = document.getElementById('photoCounter');
    
    if (titleEl) titleEl.textContent = currentPaper.title;
    if (imageEl) imageEl.src = currentPaper.image;
    if (counterEl) counterEl.textContent = `${CONFIG.currentIndex + 1} / ${CONFIG.press.length}`;
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

function ratePromise(promiseId) {
    if (!supabaseClient) {
        showNotification('Fonctionnalité de notation non disponible hors ligne', 'info');
        return;
    }
    
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const rating = prompt(`Noter l'engagement "${promise.engagement.substring(0, 50)}..." sur 5:`);
    
    if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
        saveVoteToSupabase(promiseId, parseInt(rating));
        showNotification('Merci pour votre vote !', 'success');
    }
}

async function saveVoteToSupabase(promiseId, rating) {
    if (!supabaseClient) return;
    
    try {
        const { error } = await supabaseClient
            .from('votes')
            .insert([{ promise_id: promiseId, rating }]);
        if (error) throw error;
        
        setTimeout(() => fetchAndDisplayPublicVotes(), 500);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde vote:', error);
        showNotification('Erreur lors de l\'enregistrement du vote', 'error');
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
window.ratePromise = ratePromise;
window.sharePromise = sharePromise;
window.resetFilters = resetFilters;
window.goToSlide = goToSlide;
window.openPhotoViewer = openPhotoViewer;
window.togglePressZoom = togglePressZoom;
window.goToCarouselSlide = goToCarouselSlide;
