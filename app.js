// ==========================================
// APP.JS - VERSION OPTIMISÉE
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
            image: '🇸🇱',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6d/Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg/800px-Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg.png'
        },
        { 
            id: '2', 
            title: 'Sud Quotidien', 
            date: '28/01/2026', 
            image: '🇸🇶',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5b/Sud_Quotidien_logo.svg/800px-Sud_Quotidien_logo.svg.png'
        },
        { 
            id: '3', 
            title: 'WalFadjri', 
            date: '28/01/2026', 
            image: '🇼🇫',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/0/0b/Walfadjri_logo.svg/800px-Walfadjri_logo.svg.png'
        },
        { 
            id: '4', 
            title: 'L\'Observateur', 
            date: '28/01/2026', 
            image: '🇱🇴',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/L%27Observateur_logo.svg/800px-L%27Observateur_logo.svg.png'
        },
        { 
            id: '5', 
            title: 'Le Quotidien', 
            date: '28/01/2026', 
            image: '🇱🇶',
            logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3c/Le_Quotidien_logo.svg/800px-Le_Quotidien_logo.svg.png'
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
    scrollOffset: 80
};

// Personnes pour "Promesse du Jour"
const DAILY_PEOPLE = [
    {
        name: "M. Aliou SALL",
        role: "Ministre de l'Économie",
        avatar: "AS",
        article: "Spécialiste des politiques économiques, M. Aliou SALL porte 15 engagements majeurs pour la relance économique. Son plan d'action comprend la réforme du système fiscal, la promotion des investissements privés et le développement des infrastructures numériques.",
        promises: 15,
        realised: 8,
        ongoing: 5,
        delay: 2
    },
    {
        name: "Mme Aminata DIALLO",
        role: "Ministre de la Santé",
        avatar: "AD",
        article: "Pionnière de la réforme du système de santé, Mme Diallo supervise 12 engagements visant à améliorer l'accès aux soins de qualité. Ses priorités incluent la construction de nouveaux centres de santé, la formation du personnel médical et la numérisation des dossiers patients.",
        promises: 12,
        realised: 6,
        ongoing: 4,
        delay: 2
    },
    {
        name: "Dr Ibrahima CISSE",
        role: "Ministre de l'Éducation",
        avatar: "IC",
        article: "Expert en éducation, Dr Cisse est responsable de 18 engagements pour la modernisation du système éducatif. Ses projets phares incluent la construction d'écoles numériques, la formation des enseignants et la révision des programmes scolaires.",
        promises: 18,
        realised: 10,
        ongoing: 6,
        delay: 2
    },
    {
        name: "M. Ousmane NDIAYE",
        role: "Ministre des Infrastructures",
        avatar: "ON",
        article: "Ingénieur de formation, M. Ndiaye gère 22 engagements pour le développement des infrastructures nationales. Son portefeuille comprend des projets routiers, la construction de ponts et le développement des réseaux d'eau et d'électricité.",
        promises: 22,
        realised: 12,
        ongoing: 8,
        delay: 2
    },
    {
        name: "Mme Fatou KANE",
        role: "Ministre de l'Environnement",
        avatar: "FK",
        article: "Militante écologiste, Mme Kane défend 14 engagements pour la protection de l'environnement. Ses initiatives incluent la lutte contre la déforestation, la promotion des énergies renouvelables et la gestion des déchets.",
        promises: 14,
        realised: 7,
        ongoing: 5,
        delay: 2
    }
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
    
    // Charger les données
    await loadData();
    
    // Configurer les composants
    setupEventListeners();
    setupCarousel();
    setupServiceRatings();
    setupDailyPromise();
    setupPromisesCarousel();
    
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
        renderPressCarousel();
        
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
    const today = new Date().getDay();
    const personIndex = today % DAILY_PEOPLE.length;
    const person = DAILY_PEOPLE[personIndex];
    
    const dailyPromiseCard = document.getElementById('dailyPromise');
    if (!dailyPromiseCard) return;
    
    dailyPromiseCard.innerHTML = `
        <div class="daily-person">
            <div class="daily-avatar">
                <span>${person.avatar}</span>
            </div>
            <div class="daily-info">
                <h3 class="daily-name">${person.name}</h3>
                <p class="daily-role">${person.role}</p>
            </div>
        </div>
        <div class="daily-article">
            <p>${person.article}</p>
        </div>
        <div class="daily-stats">
            <div class="daily-stat">
                <div class="stat-value">${person.promises}</div>
                <div class="stat-label">Engagements</div>
            </div>
            <div class="daily-stat success">
                <div class="stat-value">${person.realised}</div>
                <div class="stat-label">✅ Réalisés</div>
            </div>
            <div class="daily-stat progress">
                <div class="stat-value">${person.ongoing}</div>
                <div class="stat-label">🔄 En cours</div>
            </div>
            <div class="daily-stat warning">
                <div class="stat-value">${person.delay}</div>
                <div class="stat-label">⚠️ En retard</div>
            </div>
        </div>
    `;
}

// ==========================================
// RENDER ALL
// ==========================================
function renderAll() {
    updateStats();
    renderPromises(CONFIG.promises);
    populateDomainFilter();
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
    
    // Calculs additionnels
    const domains = {};
    CONFIG.promises.forEach(p => {
        domains[p.domain] = (domains[p.domain] || 0) + 1;
    });
    const principalDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
    
    const avgDelay = CONFIG.promises
        .filter(p => p.status !== 'Réalisé')
        .reduce((sum, p) => sum + getDaysRemaining(p.deadline), 0) / 
        (total - realise || 1);
    
    // Calcul de la moyenne des notes
    const allRatings = CONFIG.promises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    const totalVotes = allRatings.reduce((sum, p) => sum + p.publicCount, 0);
    
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
    
    if (principalDomain) {
        updateStatValue('domaine-principal', principalDomain[0]);
        updateStatValue('domaine-count', `${principalDomain[1]} engagements`);
    }
    
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
                promise.domain.toLowerCase().includes(filterSearch)
            );
        }
        
        return match;
    });
    
    renderPromises(filtered);
    updateResultsCount(filtered.length);
}

function resetFilters() {
    const filterStatus = document.getElementById('filter-status');
    const filterDomain = document.getElementById('filter-domain');
    const filterSearch = document.getElementById('filter-search');
    
    if (filterStatus) filterStatus.value = '';
    if (filterDomain) filterDomain.value = '';
    if (filterSearch) filterSearch.value = '';
    
    renderPromises(CONFIG.promises);
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
                
                <div class="promise-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(promise.deadline)}</span>
                    <span><i class="fas fa-clock"></i> ${daysRemaining} jours</span>
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
        <div class="newspaper-card">
            <div class="newspaper-icon">${paper.image}</div>
            <h4>${paper.title}</h4>
            <p class="newspaper-date">${paper.date}</p>
            <a href="https://projetbi.org/presse" target="_blank" class="newspaper-link">
                Lire <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `).join('');
}

// ==========================================
// CAROUSEL
// ==========================================
function setupCarousel() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
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
    
    indicators.innerHTML = CONFIG.press.map((_, index) => 
        `<button class="indicator ${index === CONFIG.currentIndex ? 'active' : ''}" 
                onclick="goToSlide(${index})"></button>`
    ).join('');
}

function renderPressCarousel() {
    const carousel = document.getElementById('pressCarousel');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!carousel || !indicators) return;
    
    const currentPaper = CONFIG.press[CONFIG.currentIndex];
    
    carousel.innerHTML = `
        <div class="carousel-item active" style="background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${currentPaper.logo}'); background-size: cover; background-position: center;">
            <div class="carousel-info">
                <div class="carousel-title">${currentPaper.title}</div>
                <div class="carousel-date">${currentPaper.date}</div>
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

function setupPromisesCarousel() {
    // Implémentation du carousel des promesses si nécessaire
}

// ==========================================
// SERVICE RATINGS
// ==========================================
function setupServiceRatings() {
    const form = document.getElementById('ratingForm');
    if (!form) return;
    
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
    });
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
        
        renderPromises(CONFIG.promises);
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

function exportData(format) {
    console.log('Export format:', format);
    showNotification(`Export ${format.toUpperCase()} en cours...`, 'info');
    // Implémenter la logique d'export
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
window.exportData = exportData;
window.goToSlide = goToSlide;
