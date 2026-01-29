// ==========================================
// APP.JS - VERSION OPTIMISÉE & MODERNISÉE
// ==========================================
// Configuration Supabase
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_joJuW7-vMiQG302_2Mvj5A_sVaD8Wap';
let supabaseClient = null;

// Initialisation Supabase
try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase v2 initialisé');
    } else {
        console.warn('⚠️ Supabase SDK non disponible');
    }
} catch (error) {
    console.error('❌ Erreur d\'initialisation Supabase:', error);
}

// Configuration globale
const CONFIG = {
    START_DATE: new Date('2024-04-02'),
    CURRENT_DATE: new Date(),
    promises: [],
    news: [],
    press: [
        {
            id: '1',
            title: 'Le Soleil',
            date: '28/01/2026',
            image: 'images/presse/soleil.jpg',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6d/Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg/800px-Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg.png'
        },
        {
            id: '2',
            title: 'Sud Quotidien',
            date: '28/01/2026',
            image: 'images/presse/sud-quotidien.jpg',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5b/Sud_Quotidien_logo.svg/800px-Sud_Quotidien_logo.svg.png'
        },
        {
            id: '3',
            title: 'Libération',
            date: '28/01/2026',
            image: 'images/presse/liberation.jpg',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/8d/Libération_Logo.svg/800px-Libération_Logo.svg.png'
        },
        {
            id: '4',
            title: 'L\'Observateur',
            date: '28/01/2026',
            image: 'images/presse/observateur.jpg',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/L%27Observateur_logo.svg/800px-L%27Observateur_logo.svg.png'
        },
        {
            id: '5',
            title: 'Le Quotidien',
            date: '28/01/2026',
            image: 'images/presse/quotidien.jpg',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3c/Le_Quotidien_logo.svg/800px-Le_Quotidien_logo.svg.png'
        },
        {
            id: '6',
            title: 'WalFadjri',
            date: '28/01/2026',
            image: 'images/presse/walfadjri.jpg',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7c/Walf_fadjri_logo.svg/800px-Walf_fadjri_logo.svg.png'
        }
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
    kpiAutoPlay: true
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
    setupEventListeners();
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

    // Toggle mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('show');
            mobileMenuBtn.classList.toggle('active');
        });
    }

    // Navigation active state
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
                    mobileMenuBtn.classList.remove('active');
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
        // Navbar scroll effect
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }

        // Scroll to top button
        if (window.scrollY > 400) {
            scrollToTop?.classList.add('visible');
        } else {
            scrollToTop?.classList.remove('visible');
        }

        // Progress indicator
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (progressIndicator) {
            progressIndicator.style.width = scrolled + '%';
        }
    });

    // Scroll to top functionality
    if (scrollToTop) {
        scrollToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
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
        const data = await response.json();
        
        CONFIG.START_DATE = new Date(data.start_date);
        
        CONFIG.promises = data.promises.map(p => ({
            ...p,
            deadline: calculateDeadline(p.delai),
            isLate: checkIfLate(p.status, calculateDeadline(p.delai)),
            publicAvg: 0,
            publicCount: 0
        }));
        
        // Trier par défaut pour afficher les promesses en retard en premier
        CONFIG.promises.sort((a, b) => {
            if (a.isLate && !b.isLate) return -1;
            if (!a.isLate && b.isLate) return 1;
            return 0;
        });
        
        // Charger les votes après un délai
        setTimeout(() => {
            fetchAndDisplayPublicVotes().catch(error => {
                console.warn('Impossible de charger les votes:', error);
            });
        }, 1000);
        
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
                image: 'inauguration' 
            },
            { 
                id: '3', 
                title: 'Budget 2026 axé sur la relance économique', 
                excerpt: 'Le budget de l\'État pour 2026 prévoit d\'importants investissements dans les infrastructures.', 
                date: '15/01/2026', 
                source: 'WalFadjri', 
                image: 'budget' 
            }
        ];
        
        renderAll();
        renderNews(CONFIG.news);
        renderNewspapers();
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showNotification('Erreur de chargement des données', 'error');
    }
}

// ==========================================
// CALCULS
// ==========================================
function calculateDeadline(delay) {
    const deadline = new Date(CONFIG.START_DATE);
    deadline.setDate(deadline.getDate() + parseInt(delay));
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
// PROMESSE DU JOUR
// ==========================================
function setupDailyPromise() {
    const promisesWithDetails = CONFIG.promises.filter(p => 
        p.engagement && p.resultat && p.delai
    );
    
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
        <div class="daily-header">
            <h3 class="daily-title">Promesse du Jour</h3>
            <div class="daily-date-badge">
                <i class="fas fa-calendar"></i>
                ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
        </div>
        
        <div class="daily-content">
            <div class="daily-promise-section">
                <h4><i class="fas fa-bullseye"></i> L'Engagement</h4>
                <p class="daily-promise-text">${promise.engagement}</p>
            </div>
            
            <div class="daily-domain-badge ${statusClass}">
                <span>${statusIcon} ${promise.isLate ? 'En retard' : promise.status}</span>
                <span class="domain-tag">${promise.domain}</span>
            </div>
            
            <div class="daily-results-section">
                <h4><i class="fas fa-trophy"></i> Résultats Attendus</h4>
                <p class="daily-results-text">${promise.resultat || 'Aucun résultat spécifié'}</p>
            </div>
            
            <div class="daily-deadline-section">
                <h4><i class="fas fa-clock"></i> Délai de Réalisation</h4>
                <div class="deadline-info">
                    <span class="deadline-label">Délai initial :</span>
                    <span class="deadline-value">${promise.delai}</span>
                </div>
                <div class="deadline-info">
                    <span class="deadline-label">Date limite :</span>
                    <span class="deadline-value">${formatDate(promise.deadline)}</span>
                </div>
                <div class="deadline-info">
                    <span class="deadline-label">Temps restant :</span>
                    <span class="deadline-value ${daysRemaining < 0 ? 'late' : ''}">
                        ${daysRemaining > 0 ? `${daysRemaining} jours` : daysRemaining < 0 ? `${Math.abs(daysRemaining)} jours de retard` : 'Aujourd\'hui'}
                    </span>
                </div>
            </div>
            
            <div class="daily-actions">
                <button class="btn-primary" onclick="sharePromise('${promise.id}')">
                    <i class="fas fa-share-alt"></i> Partager cette promesse
                </button>
                <button class="btn-secondary" onclick="ratePromise('${promise.id}')">
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
    
    // Mettre à jour les KPIs
    KPI_ITEMS[0].value = total;
    KPI_ITEMS[1].value = realise;
    KPI_ITEMS[2].value = encours;
    KPI_ITEMS[3].value = retard;
    KPI_ITEMS[4].value = tauxRealisation + '%';
    
    // Calcul du délai moyen
    const avgDelay = CONFIG.promises
        .filter(p => p.status !== 'Réalisé')
        .reduce((sum, p) => sum + getDaysRemaining(p.deadline), 0) / 
        (total - realise || 1);
    
    KPI_ITEMS[5].value = Math.round(avgDelay) + 'j';
    
    // Calcul de la moyenne des notes
    const allRatings = CONFIG.promises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    const totalVotes = allRatings.reduce((sum, p) => sum + p.publicCount, 0);
    
    KPI_ITEMS[6].value = avgRating;
    KPI_ITEMS[7].value = withUpdates;
    
    // Mettre à jour le DOM
    updateStatValue('total', total);
    updateStatValue('realise', realise);
    updateStatValue('encours', encours);
    updateStatValue('non-lance', nonLance);
    updateStatValue('retard', retard);
    updateStatValue('avec-maj', withUpdates);
    updateStatValue('taux-realisation', tauxRealisation + '%');
    updateStatValue('moyenne-notes', avgRating);
    updateStatValue('votes-total', `${totalVotes.toLocaleString('fr-FR')} votes`);
    updateStatValue('delai-moyen', Math.round(avgDelay) + 'j');
    
    // Mettre à jour les pourcentages
    updateStatPercentage('total-percentage', total, total);
    updateStatPercentage('realise-percentage', realise, total);
    updateStatPercentage('encours-percentage', encours, total);
    updateStatPercentage('non-lance-percentage', nonLance, total);
    updateStatPercentage('retard-percentage', retard, total);
    updateStatPercentage('avec-maj-percentage', withUpdates, total);
}

function updateStatValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

function updateStatPercentage(id, value, total) {
    const el = document.getElementById(id);
    if (el && total > 0) {
        const percentage = Math.round((value / total) * 100);
        el.textContent = percentage + '%';
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
    const viewBtns = document.querySelectorAll('.view-btn');
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

    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const grid = document.getElementById('promisesGrid');
            if (grid) {
                grid.className = view === 'list' ? 'promises-list' : 'promises-grid';
            }
        });
    });
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
                match = match && promise.status === filterStatus;
            }
        }
        
        if (filterDomain) {
            match = match && promise.domain === filterDomain;
        }
        
        if (filterSearch) {
            match = match && (
                promise.engagement.toLowerCase().includes(filterSearch) ||
                promise.domain.toLowerCase().includes(filterSearch) ||
                (promise.resultat && promise.resultat.toLowerCase().includes(filterSearch))
            );
        }
        
        return match;
    });

    // Réinitialiser la visibilité
    CONFIG.currentVisible = Math.min(CONFIG.visibleCount, filtered.length);
    renderPromises(filtered.slice(0, CONFIG.currentVisible));
    updateResultsCount(filtered.length);
    
    // Gérer les boutons show more/less
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
    
    const domains = [...new Set(CONFIG.promises.map(p => p.domain))];
    domains.sort();

    filterDomain.innerHTML = '<option value="">Tous les domaines</option>' +
        domains.map(domain => `<option value="${domain}">${domain}</option>`).join('');
}

// ==========================================
// RENDER PROMISES
// ==========================================
function renderPromises(promises) {
    const grid = document.getElementById('promisesGrid');
    if (!grid) return;
    
    if (promises.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <p>Aucun engagement trouvé avec ces critères.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = promises.map(promise => {
        const statusClass = getStatusClass(promise);
        const statusIcon = getStatusIcon(promise);
        const daysRemaining = getDaysRemaining(promise.deadline);
        const progress = promise.progress || 0;
        
        return `
            <div class="promise-card ${statusClass}" data-id="${promise.id}">
                <div class="promise-header">
                    <span class="promise-status">
                        ${statusIcon} ${promise.isLate ? 'En retard' : promise.status}
                    </span>
                    <span class="promise-domain">${promise.domain}</span>
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
               
                <div class="promise-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-label">${progress}%</span>
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
                                    <div class="update-date">${formatDate(new Date(update.date))}</div>
                                    <div class="update-text">${update.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
               
                <div class="promise-actions">
                    <button class="btn-rate" onclick="ratePromise('${promise.id}')">
                        <i class="fas fa-star"></i>
                        Noter
                    </button>
                    <button class="btn-share" onclick="sharePromise('${promise.id}')">
                        <i class="fas fa-share-alt"></i>
                        Partager
                    </button>
                </div>
               
                ${promise.publicCount > 0 ? `
                    <div class="promise-rating">
                        <span class="rating-value">${promise.publicAvg.toFixed(1)}</span>
                        <div class="rating-stars">
                            ${generateStars(promise.publicAvg)}
                        </div>
                        <span class="rating-count">(${promise.publicCount} votes)</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getStatusClass(promise) {
    if (promise.isLate) return 'status-late';
    if (promise.status === 'Réalisé') return 'status-realise';
    if (promise.status === 'En cours') return 'status-encours';
    return 'status-non-lance';
}

function getStatusIcon(promise) {
    if (promise.isLate) return '⚠️';
    if (promise.status === 'Réalisé') return '✅';
    if (promise.status === 'En cours') return '🔄';
    return '⏳';
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
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
                <img src="${paper.image}" alt="${paper.title}" onerror="this.src='https://via.placeholder.com/300x400?text=${encodeURIComponent(paper.title)}'">
            </div>
            <h4>${paper.title}</h4>
            <p class="newspaper-date">${paper.date}</p>
        </div>
    `).join('');
}

// ==========================================
// CAROUSEL PRESSE
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
            
            if (CONFIG.carouselAutoPlay) {
                startCarouselAutoPlay();
            } else {
                stopCarouselAutoPlay();
            }
        });
    }

    indicators.innerHTML = CONFIG.press.map((_, index) => 
        `<button class="indicator ${index === CONFIG.currentIndex ? 'active' : ''}" 
                onclick="goToSlide(${index})"></button>`
    ).join('');
    
    // Démarrer le défilement automatique
    startCarouselAutoPlay();
}

function startCarouselAutoPlay() {
    stopCarouselAutoPlay();
    CONFIG.carouselInterval = setInterval(() => {
        if (CONFIG.carouselAutoPlay) {
            CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
            renderPressCarousel();
        }
    }, 10000); // 10 secondes
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
                 onerror="this.src='https://via.placeholder.com/800x400?text=${encodeURIComponent(currentPaper.title)}'">
            <div class="carousel-overlay">
                <div class="carousel-info">
                    <div class="carousel-title">${currentPaper.title}</div>
                    <div class="carousel-date">${currentPaper.date}</div>
                    <a href="https://projetbi.org/presse" target="_blank" class="carousel-link">
                        Lire l'article <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        </div>
    `;

    const indicatorBtns = indicators.querySelectorAll('.indicator');
    indicatorBtns.forEach((btn, index) => {
        btn.classList.toggle('active', index === CONFIG.currentIndex);
    });
}

function goToSlide(index) {
    CONFIG.currentIndex = index;
    renderPressCarousel();
}

// ==========================================
// CAROUSEL PROMESSES
// ==========================================
function setupPromisesCarousel() {
    const carouselGrid = document.getElementById('promisesCarouselGrid');
    if (!carouselGrid) return;
    
    // Prendre les 6 premières promesses
    const carouselPromises = CONFIG.promises.slice(0, 6);
    
    carouselGrid.innerHTML = carouselPromises.map((promise, index) => {
        const statusClass = getStatusClass(promise);
        const statusIcon = getStatusIcon(promise);
        const daysRemaining = getDaysRemaining(promise.deadline);
        
        return `
            <div class="carousel-promise-card ${statusClass}" onclick="goToPromiseSection('${promise.id}')">
                <div class="promise-card-header">
                    <span class="promise-status">${statusIcon} ${promise.isLate ? 'En retard' : promise.status}</span>
                    <span class="promise-domain">${promise.domain}</span>
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
    
    // Ajouter l'autoplay
    setupCarouselAutoPlay();
}

function setupCarouselAutoPlay() {
    const autoPlayToggle = document.getElementById('carouselAutoPlayToggle');
    if (autoPlayToggle) {
        autoPlayToggle.addEventListener('click', () => {
            CONFIG.carouselAutoPlay = !CONFIG.carouselAutoPlay;
            autoPlayToggle.innerHTML = CONFIG.carouselAutoPlay ? 
                '<i class="fas fa-pause"></i>' : 
                '<i class="fas fa-play"></i>';
        });
    }
    
    // Démarrer automatiquement
    setInterval(() => {
        if (CONFIG.carouselAutoPlay) {
            CONFIG.carouselIndex = (CONFIG.carouselIndex + 1) % 6;
            // Animation de transition si nécessaire
        }
    }, 10000);
}

function goToPromiseSection(promiseId) {
    // Faire défiler vers la section des engagements
    const promisesSection = document.getElementById('promises');
    if (promisesSection) {
        const offset = CONFIG.scrollOffset;
        const targetPosition = promisesSection.offsetTop - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Mettre en évidence la promesse spécifique
        setTimeout(() => {
            const card = document.querySelector(`.promise-card[data-id="${promiseId}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.style.boxShadow = '0 0 0 3px var(--primary)';
                setTimeout(() => {
                    card.style.boxShadow = '';
                }, 3000);
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
    
    // Rendre le premier KPI
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
    
    // Démarrer l'autoplay
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
    }, 3000); // 3 secondes
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
        
        // Set initial state
        const initialValue = parseInt(input.value) || 3;
        updateStars(stars, initialValue);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            service: document.getElementById('service').value,
            accessibility: document.getElementById('accessibility').value,
            welcome: document.getElementById('welcome').value,
            efficiency: document.getElementById('efficiency').value,
            transparency: document.getElementById('transparency').value,
            comment: document.getElementById('comment').value,
            date: new Date().toISOString()
        };
        
        if (!formData.service) {
            showNotification('Veuillez sélectionner un service', 'error');
            return;
        }
        
        // Sauvegarder dans Supabase si disponible
        if (supabaseClient) {
            saveRatingToSupabase(formData);
        }
        
        showNotification('Merci pour votre notation !', 'success');
        form.reset();
        
        // Reset stars to default
        starsContainers.forEach(container => {
            const field = container.getAttribute('data-field');
            const input = document.getElementById(field);
            const stars = container.querySelectorAll('i');
            input.value = 3;
            updateStars(stars, 3);
        });
        
        // Mettre à jour les résultats
        setTimeout(() => fetchAndDisplayServiceRatings(), 1000);
    });
    
    // Charger les résultats initiaux
    fetchAndDisplayServiceRatings();
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

async function saveRatingToSupabase(data) {
    try {
        const { error } = await supabaseClient
            .from('service_ratings')
            .insert([data]);
        if (error) throw error;
        console.log('✅ Notation sauvegardée');
    } catch (error) {
        console.error('❌ Erreur sauvegarde notation:', error);
    }
}

async function fetchAndDisplayServiceRatings() {
    if (!supabaseClient) return;
    
    try {
        // Récupérer toutes les notations
        const { data: ratings, error } = await supabaseClient
            .from('service_ratings')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        if (ratings && ratings.length > 0) {
            displayRatingResults(ratings);
        }
    } catch (error) {
        console.error('❌ Erreur chargement notations:', error);
    }
}

function displayRatingResults(ratings) {
    const resultsSection = document.getElementById('ratingResults');
    if (!resultsSection) return;
    
    // Calculer les statistiques
    const serviceStats = {};
    ratings.forEach(rating => {
        if (!serviceStats[rating.service]) {
            serviceStats[rating.service] = {
                count: 0,
                totalScore: 0,
                avgScore: 0,
                recent: []
            };
        }
        
        const score = (parseInt(rating.accessibility) + 
                      parseInt(rating.welcome) + 
                      parseInt(rating.efficiency) + 
                      parseInt(rating.transparency)) / 4;
        
        serviceStats[rating.service].count++;
        serviceStats[rating.service].totalScore += score;
        serviceStats[rating.service].avgScore = serviceStats[rating.service].totalScore / serviceStats[rating.service].count;
        
        if (serviceStats[rating.service].recent.length < 5) {
            serviceStats[rating.service].recent.push({
                date: new Date(rating.date).toLocaleDateString('fr-FR'),
                comment: rating.comment || 'Aucun commentaire',
                score: score.toFixed(1)
            });
        }
    });
    
    // Trier par note moyenne
    const sortedServices = Object.entries(serviceStats)
        .sort((a, b) => b[1].avgScore - a[1].avgScore);
    
    // Meilleures notes
    const topServices = sortedServices.slice(0, 3);
    
    // Dernières notations
    const recentRatings = ratings.slice(0, 5).map(r => ({
        service: r.service,
        date: new Date(r.date).toLocaleDateString('fr-FR'),
        comment: r.comment || 'Aucun commentaire',
        score: ((parseInt(r.accessibility) + parseInt(r.welcome) + 
                parseInt(r.efficiency) + parseInt(r.transparency)) / 4).toFixed(1)
    }));
    
    // Nombre total de votes
    const totalVotes = ratings.length;
    
    resultsSection.innerHTML = `
        <div class="rating-results-grid">
            <div class="rating-results-card">
                <h4><i class="fas fa-chart-bar"></i> Meilleurs Services</h4>
                <div class="top-services">
                    ${topServices.map(([service, stats], index) => `
                        <div class="service-item ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}">
                            <div class="service-rank">${index + 1}</div>
                            <div class="service-info">
                                <div class="service-name">${service}</div>
                                <div class="service-stats">
                                    <span class="service-score">
                                        <i class="fas fa-star"></i> ${stats.avgScore.toFixed(1)}/5
                                    </span>
                                    <span class="service-count">${stats.count} vote(s)</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="rating-results-card">
                <h4><i class="fas fa-clock"></i> Dernières Notations</h4>
                <div class="recent-ratings">
                    ${recentRatings.map(rating => `
                        <div class="recent-item">
                            <div class="recent-header">
                                <span class="recent-service">${rating.service}</span>
                                <span class="recent-date">${rating.date}</span>
                            </div>
                            <div class="recent-score">
                                <i class="fas fa-star"></i> ${rating.score}/5
                            </div>
                            <div class="recent-comment">${rating.comment}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="rating-results-card">
                <h4><i class="fas fa-poll"></i> Statistiques Globales</h4>
                <div class="stats-overview">
                    <div class="stat-item">
                        <div class="stat-value">${totalVotes}</div>
                        <div class="stat-label">Votes totaux</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${Object.keys(serviceStats).length}</div>
                        <div class="stat-label">Services évalués</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${ratings.filter(r => r.comment).length}</div>
                        <div class="stat-label">Avec commentaires</div>
                    </div>
                </div>
                
                <h5 style="margin-top: 20px; margin-bottom: 10px;"><i class="fas fa-th-list"></i> Votes par Service</h5>
                <div class="votes-by-service">
                    ${Object.entries(serviceStats).map(([service, stats]) => `
                        <div class="service-vote-item">
                            <span class="service-name">${service}</span>
                            <span class="service-votes">${stats.count} vote(s)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// PHOTO VIEWER PRESSE
// ==========================================
function initPhotoViewer() {
    // Créer le modal de visualisation photo
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
                    <img src="" id="photoViewerImage" alt="">
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
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            scale = 1;
            rotate = 0;
            photoImage.style.transform = '';
        });
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            scale = 1;
            rotate = 0;
            photoImage.style.transform = '';
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
        });
    }
    
    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            rotate = (rotate + 90) % 360;
            updatePhotoTransform();
        });
    }
    
    // Touch events pour swipe
    let touchStartX = 0;
    let touchEndX = 0;
    
    photoContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    photoContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        if (touchStartX - touchEndX > 50) {
            // Swipe gauche - suivant
            CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
            updatePhotoViewer();
        }
        if (touchEndX - touchStartX > 50) {
            // Swipe droit - précédent
            CONFIG.currentIndex = (CONFIG.currentIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
            updatePhotoViewer();
        }
    }
    
    function updatePhotoTransform() {
        photoImage.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
    }
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
            .from('public_votes')
            .select('promise_id, rating');
        
        if (error) throw error;
        
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
        console.error('❌ Erreur chargement votes:', error);
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
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const rating = prompt(`Noter l'engagement "${promise.engagement.substring(0, 50)}..." sur 5:`);
    
    if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
        if (supabaseClient) {
            saveVoteToSupabase(promiseId, parseInt(rating));
        }
        showNotification('Merci pour votre vote !', 'success');
    }
}

async function saveVoteToSupabase(promiseId, rating) {
    try {
        const { error } = await supabaseClient
            .from('public_votes')
            .insert([{ promise_id: promiseId, rating }]);
        if (error) throw error;
        
        setTimeout(() => fetchAndDisplayPublicVotes(), 500);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde vote:', error);
    }
}

function sharePromise(promiseId) {
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const text = `📊 "${promise.engagement.substring(0, 100)}..." - Suivi des engagements du Projet pour un Sénégal Souverain, Juste et Prospère`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'Engagement du Projet Sénégal',
            text: text,
            url: url
        }).catch(err => console.log('Erreur partage:', err));
    } else {
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Déjà configuré dans les autres fonctions
}

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type] || icons.success}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// EXPORTS GLOBAUX
// ==========================================
window.CONFIG = CONFIG;
window.toggleUpdates = toggleUpdates;
window.ratePromise = ratePromise;
window.sharePromise = sharePromise;
window.resetFilters = resetFilters;
window.goToSlide = goToSlide;
window.openPhotoViewer = openPhotoViewer;
