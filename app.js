// ==========================================
// APP.JS - VERSION PROPRE ET CORRIGÉE
// ==========================================

// Configuration Supabase
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3c2R4dHRqamJmbm91ZmlpZGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODk0MjQsImV4cCI6MjA1MTI2NTQyNH0.Y2Jx8K5tQZ3X9y7Z8X6Y5W4V3U2T1S0R9Q8P7O6N5M4';
let supabaseClient = null;

// Initialisation Supabase
try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.create(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase initialisé');
    }
} catch (error) {
    console.warn('⚠️ Supabase non disponible:', error);
}

// Configuration globale
const CONFIG = {
    START_DATE: new Date('2024-04-02'),
    CURRENT_DATE: new Date(),
    promises: [],
    news: [],
    press: [
        { id: '1', title: 'Le Soleil', date: '28/01/2026', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/6d/Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg/800px-Le_Soleil_%28S%C3%A9n%C3%A9gal%29_logo.svg.png' },
        { id: '2', title: 'Sud Quotidien', date: '28/01/2026', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5b/Sud_Quotidien_logo.svg/800px-Sud_Quotidien_logo.svg.png' },
        { id: '3', title: 'Libération', date: '28/01/2026', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/L%27Observateur_logo.svg/800px-L%27Observateur_logo.svg.png' },
        { id: '4', title: "L'Observateur", date: '28/01/2026', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/7/7b/L%27Observateur_logo.svg/800px-L%27Observateur_logo.svg.png' },
        { id: '5', title: 'Le Quotidien', date: '28/01/2026', logo: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3c/Le_Quotidien_logo.svg/800px-Le_Quotidien_logo.svg.png' }
    ],
    currentIndex: 0,
    visibleCount: 6,
    carouselIndex: 0,
    carouselAutoPlay: true,
    carouselInterval: null
};

// Personnes pour "Promesse du Jour"
const DAILY_PEOPLE = [
    {
        name: "M. Aliou SALL",
        role: "Ministre de l'Économie",
        avatar: "AS",
        article: "Spécialiste des politiques économiques, M. Aliou SALL porte 15 engagements majeurs pour la relance économique.",
        promises: 15,
        realised: 8,
        ongoing: 5,
        delay: 2,
        promise: "Moderniser l'administration fiscale et douanière",
        expectedResults: "Augmentation de 20% des recettes fiscales",
        deadline: "12 mois pour les mesures clés"
    }
];

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    
    initNavigation();
    initScrollEffects();
    initFilters();
    initDateDisplay();
    initShowMoreLess();
    initPromisesCarousel();
    initExportDropdown();
    
    await loadData();
    
    setupDailyPromise();
    setupServiceRatings();
    setupPressCarousel();
    
    console.log('✅ Initialisation terminée');
});

// ==========================================
// NAVIGATION
// ==========================================
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (mobileMenuBtn) {
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
            if (window.pageYOffset >= (sectionTop - 80 - 50)) {
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
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
        
        if (window.scrollY > 400) {
            scrollToTop?.classList.add('visible');
        } else {
            scrollToTop?.classList.remove('visible');
        }
        
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (progressIndicator) {
            progressIndicator.style.width = scrolled + '%';
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
        const data = await response.json();
        
        CONFIG.START_DATE = new Date(data.start_date);
        
        CONFIG.promises = data.promises.map(p => {
            const deadline = calculateDeadline(p.delai);
            const isLate = checkIfLate(p.status, deadline);
            const progress = p.status === 'Réalisé' ? 100 : 
                           p.status === 'En cours' ? 50 : 0;
            
            return {
                ...p,
                deadline: deadline,
                isLate: isLate,
                publicAvg: 0,
                publicCount: 0,
                progress: progress
            };
        });
        
        // Trier: retard en premier
        CONFIG.promises.sort((a, b) => {
            if (a.isLate && !b.isLate) return -1;
            if (!a.isLate && b.isLate) return 1;
            return 0;
        });
        
        CONFIG.news = [
            { id: '1', title: 'Lancement officiel', excerpt: 'La plateforme citoyenne est désormais opérationnelle.', date: '25/01/2026', source: 'Le Soleil', image: 'school' },
            { id: '2', title: 'Première école numérique', excerpt: 'Le gouvernement a inauguré la première école numérique.', date: '20/01/2026', source: 'Sud Quotidien', image: 'inauguration' }
        ];
        
        renderAll();
        renderNews(CONFIG.news);
        renderNewspapers();
        
        setTimeout(fetchAndDisplayPublicVotes, 1000);
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showNotification('Erreur de chargement des données', 'error');
    }
}

// ==========================================
// CALCULS
// ==========================================
function calculateDeadline(delaiText) {
    const text = delaiText.toLowerCase();
    const result = new Date(CONFIG.START_DATE);
    
    if (text.includes('3 mois')) {
        result.setMonth(result.getMonth() + 3);
    } else if (text.includes('6 mois')) {
        result.setMonth(result.getMonth() + 6);
    } else if (text.includes('1 an') || text.includes('12 mois')) {
        result.setFullYear(result.getFullYear() + 1);
    } else if (text.includes('2 ans')) {
        result.setFullYear(result.getFullYear() + 2);
    } else if (text.includes('3 ans')) {
        result.setFullYear(result.getFullYear() + 3);
    } else if (text.includes('5 ans') || text.includes('quinquennat')) {
        result.setFullYear(result.getFullYear() + 5);
    }
    
    return result;
}

function checkIfLate(status, deadline) {
    if (status === 'Réalisé') return false;
    return CONFIG.CURRENT_DATE > deadline;
}

function getDaysRemaining(deadline) {
    const diff = deadline - CONFIG.CURRENT_DATE;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} jours` : 'Expiré';
}

// ==========================================
// PROMESSE DU JOUR
// ==========================================
function setupDailyPromise() {
    const person = DAILY_PEOPLE[0];
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
            
            <div class="promise-details">
                <h4>La promesse</h4>
                <p>${person.promise}</p>
                
                <h4>Résultats attendus</h4>
                <p>${person.expectedResults}</p>
                
                <h4>Délai de réalisation</h4>
                <p>${person.deadline}</p>
            </div>
        </div>
    `;
}

// ==========================================
// RENDER ALL
// ==========================================
function renderAll() {
    updateStats();
    renderPromises(CONFIG.promises.slice(0, CONFIG.visibleCount));
    populateDomainFilter();
    updateKPI();
}

// ==========================================
// UPDATE STATS - CORRIGÉ
// ==========================================
function updateStats() {
    const total = CONFIG.promises.length;
    const realise = CONFIG.promises.filter(p => p.status === 'Réalisé').length;
    const encours = CONFIG.promises.filter(p => p.status === 'En cours').length;
    const nonLance = CONFIG.promises.filter(p => p.status === 'Non lancé').length;
    const retard = CONFIG.promises.filter(p => p.isLate).length;
    const withUpdates = CONFIG.promises.filter(p => p.mises_a_jour && p.mises_a_jour.length > 0).length;
    
    const tauxRealisation = total > 0 ? Math.round((realise / total) * 100) : 0;
    
    // Calculs additionnels
    const domains = {};
    CONFIG.promises.forEach(p => {
        domains[p.domaine] = (domains[p.domaine] || 0) + 1;
    });
    const principalDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
    
    const avgDelay = CONFIG.promises
        .filter(p => p.status !== 'Réalisé')
        .reduce((sum, p) => sum + (parseInt(getDaysRemaining(p.deadline).replace(' jours', '')) || 0), 0) / 
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
    updateStatValue('votes-total', `${totalVotes} votes`);
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
    if (el) el.textContent = value;
}

function updateStatPercentage(id, value, total) {
    const el = document.getElementById(id);
    if (el && total > 0) {
        const percentage = Math.round((value / total) * 100);
        el.textContent = percentage + '%';
    }
}

// ==========================================
// KPI SCROLLER - CORRIGÉ
// ==========================================
function updateKPI() {
    const total = CONFIG.promises.length;
    const realise = CONFIG.promises.filter(p => p.status === 'Réalisé').length;
    const retard = CONFIG.promises.filter(p => p.isLate).length;
    const tauxRealisation = total > 0 ? ((realise / total) * 100).toFixed(1) : 0;
    
    const allRatings = CONFIG.promises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    
    const avgDelay = CONFIG.promises
        .filter(p => p.status !== 'Réalisé')
        .reduce((sum, p) => sum + (parseInt(getDaysRemaining(p.deadline).replace(' jours', '')) || 0), 0) / 
        (total - realise || 1);
    
    updateStatValue('kpi-total', total);
    updateStatValue('kpi-realised', realise);
    updateStatValue('kpi-delayed', retard);
    updateStatValue('kpi-rate', tauxRealisation + '%');
    updateStatValue('kpi-rating', avgRating);
    updateStatValue('kpi-delay', Math.round(avgDelay) + 'j');
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
            if (filterStatus === '⚠️ En retard') {
                match = match && promise.isLate;
            } else {
                match = match && promise.status === filterStatus.replace('✅ ', '').replace('🔄 ', '').replace('⏳ ', '');
            }
        }
        
        if (filterDomain) {
            match = match && promise.domaine === filterDomain;
        }
        
        if (filterSearch) {
            match = match && (
                promise.engagement.toLowerCase().includes(filterSearch) ||
                promise.domaine.toLowerCase().includes(filterSearch) ||
                promise.resultat.toLowerCase().includes(filterSearch)
            );
        }
        
        return match;
    });
    
    CONFIG.visibleCount = 6;
    renderPromises(filtered.slice(0, CONFIG.visibleCount));
    updateResultsCount(filtered.length);
    updateShowMoreLessButtons(filtered.length);
}

function resetFilters() {
    const filterStatus = document.getElementById('filter-status');
    const filterDomain = document.getElementById('filter-domain');
    const filterSearch = document.getElementById('filter-search');
    
    if (filterStatus) filterStatus.value = '';
    if (filterDomain) filterDomain.value = '';
    if (filterSearch) filterSearch.value = '';
    
    CONFIG.visibleCount = 6;
    renderPromises(CONFIG.promises.slice(0, CONFIG.visibleCount));
    updateResultsCount(CONFIG.promises.length);
    updateShowMoreLessButtons(CONFIG.promises.length);
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
    
    const domains = [...new Set(CONFIG.promises.map(p => p.domaine))];
    domains.sort();
    
    filterDomain.innerHTML = '<option value="">Tous les domaines</option>' +
        domains.map(domain => `<option value="${domain}">${domain}</option>`).join('');
}

// ==========================================
// SHOW MORE / SHOW LESS - CORRIGÉ
// ==========================================
function initShowMoreLess() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            CONFIG.visibleCount = CONFIG.promises.length;
            applyFilters();
        });
    }
    
    if (showLessBtn) {
        showLessBtn.addEventListener('click', () => {
            CONFIG.visibleCount = 6;
            applyFilters();
        });
    }
}

function updateShowMoreLessButtons(totalCount) {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (showMoreBtn && showLessBtn) {
        if (CONFIG.visibleCount >= totalCount || totalCount <= 6) {
            showMoreBtn.style.display = 'none';
            showLessBtn.style.display = CONFIG.visibleCount > 6 ? 'inline-flex' : 'none';
        } else {
            showMoreBtn.style.display = 'inline-flex';
            showLessBtn.style.display = 'none';
        }
    }
}

// ==========================================
// RENDER PROMISES - CORRIGÉ
// ==========================================
function renderPromises(promises) {
    const grid = document.getElementById('promisesGrid');
    if (!grid) return;
    
    if (promises.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-search fa-3x"></i>
                <p>Aucun engagement trouvé avec ces critères.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = promises.map(promise => {
        const statusClass = getStatusClass(promise);
        const statusText = getStatusText(promise);
        const progress = promise.progress || 0;
        
        return createPromiseCard(promise, statusClass, statusText, progress);
    }).join('');
}

function createPromiseCard(promise, statusClass, statusText, progress) {
    return `
        <div class="promise-card ${statusClass}" data-id="${promise.id}">
            <div class="promise-header">
                <div class="promise-status">${statusText}</div>
                <div class="promise-domain">${promise.domaine}</div>
            </div>
            
            <h3 class="promise-title">${promise.engagement}</h3>
            
            <div class="result-box">
                <i class="fas fa-bullseye"></i>
                <strong>Résultat attendu:</strong> ${promise.resultat}
            </div>
            
            <div class="promise-meta">
                <div class="status-badge ${statusClass}">${statusText}</div>
                <div class="delay-badge">
                    <i class="fas fa-clock"></i>
                    ${promise.delai}
                </div>
            </div>
            
            <div class="progress-container">
                <div class="progress-label">
                    <span>Progression</span>
                    <span>${progress}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            
            ${promise.mises_a_jour && promise.mises_a_jour.length > 0 ? `
                <button class="details-btn" onclick="toggleDetails('${promise.id}')">
                    <i class="fas fa-history"></i>
                    Voir les mises à jour (${promise.mises_a_jour.length})
                </button>
                <div class="updates-list" id="updates-${promise.id}" style="display: none;">
                    ${promise.mises_a_jour.map(update => `
                        <div class="update-item">
                            <div class="update-date">${formatDate(new Date(update.date))}</div>
                            <div class="update-text">${update.description}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="promise-actions">
                <button class="btn-share" onclick="sharePromise('${promise.id}')">
                    <i class="fas fa-share-alt"></i> Partager
                </button>
                <button class="btn-rate" onclick="ratePromise('${promise.id}')">
                    <i class="fas fa-star"></i> Noter
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
}

function getStatusClass(promise) {
    if (promise.isLate) return 'status-late';
    if (promise.status === 'Réalisé') return 'status-realise';
    if (promise.status === 'En cours') return 'status-encours';
    return 'status-non-lance';
}

function getStatusText(promise) {
    if (promise.isLate) return '⚠️ En retard';
    if (promise.status === 'Réalisé') return '✅ Réalisé';
    if (promise.status === 'En cours') return '🔄 En cours';
    return '⏳ Non lancé';
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
    
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalfStar) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
    
    return stars;
}

// ==========================================
// PROMISES CAROUSEL - CORRIGÉ
// ==========================================
function initPromisesCarousel() {
    const carouselContainer = document.getElementById('carouselItems');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const toggleBtn = document.getElementById('carouselToggle');
    const carouselIndicators = document.getElementById('carouselIndicators');
    
    if (!carouselContainer || !prevBtn || !nextBtn || !toggleBtn || !carouselIndicators) return;
    
    let currentIndex = 0;
    let autoPlay = true;
    let carouselInterval;
    
    const totalItems = Math.ceil(CONFIG.promises.length / 6);
    
    carouselIndicators.innerHTML = '';
    for (let i = 0; i < totalItems; i++) {
        const indicator = document.createElement('button');
        indicator.className = `indicator ${i === currentIndex ? 'active' : ''}`;
        indicator.addEventListener('click', () => goToSlide(i));
        carouselIndicators.appendChild(indicator);
    }
    
    toggleBtn.addEventListener('click', () => {
        autoPlay = !autoPlay;
        toggleBtn.innerHTML = autoPlay ? 
            '<i class="fas fa-pause"></i> Désactiver défilement' : 
            '<i class="fas fa-play"></i> Activer défilement';
        
        if (autoPlay) startCarousel();
        else stopCarousel();
    });
    
    prevBtn.addEventListener('click', goToPrevSlide);
    nextBtn.addEventListener('click', goToNextSlide);
    
    function goToNextSlide() {
        currentIndex = (currentIndex + 1) % totalItems;
        updateCarousel();
    }
    
    function goToPrevSlide() {
        currentIndex = (currentIndex - 1 + totalItems) % totalItems;
        updateCarousel();
    }
    
    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }
    
    function updateCarousel() {
        const indicators = carouselIndicators.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
        
        const start = currentIndex * 6;
        const end = Math.min(start + 6, CONFIG.promises.length);
        const carouselPromises = CONFIG.promises.slice(start, end);
        
        carouselContainer.innerHTML = carouselPromises.map(promise => {
            const statusClass = getStatusClass(promise);
            const statusText = getStatusText(promise);
            return `
                <div class="carousel-promise-card ${statusClass}">
                    <div class="carousel-promise-header">
                        <span class="carousel-promise-status">${statusText}</span>
                        <span class="carousel-promise-domain">${promise.domaine}</span>
                    </div>
                    <h4 class="carousel-promise-title">${promise.engagement.substring(0, 80)}...</h4>
                    <div class="carousel-promise-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${promise.progress}%"></div>
                        </div>
                        <span class="progress-label">${promise.progress}%</span>
                    </div>
                </div>
            `;
        }).join('');
        
        if (autoPlay) startCarousel();
    }
    
    function startCarousel() {
        stopCarousel();
        carouselInterval = setInterval(goToNextSlide, 10000);
    }
    
    function stopCarousel() {
        if (carouselInterval) {
            clearInterval(carouselInterval);
            carouselInterval = null;
        }
    }
    
    startCarousel();
    updateCarousel();
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
                <i class="fas fa-${item.image === 'school' ? 'school' : 'flag'} fa-3x"></i>
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
// RENDER NEWSPAPERS - CORRIGÉ FORMAT
// ==========================================
function renderNewspapers() {
    const grid = document.getElementById('newspapersGrid');
    if (!grid) return;
    
    grid.innerHTML = CONFIG.press.map(paper => `
        <div class="newspaper-card">
            <div class="newspaper-logo">
                <img src="${paper.logo}" alt="${paper.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-newspaper fa-3x\'></i>'">
            </div>
            <h4>${paper.title}</h4>
            <p class="newspaper-date">${paper.date}</p>
            <a href="https://projetbi.org/presse" target="_blank" class="newspaper-link">
                Lire <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `).join('');
}

// ==========================================
// PRESS CAROUSEL - CORRIGÉ
// ==========================================
function setupPressCarousel() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const indicatorsContainer = document.getElementById('pressIndicators');
    
    if (!prevBtn || !nextBtn) return;
    
    prevBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
        renderPressCarousel();
    });
    
    nextBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
        renderPressCarousel();
    });
    
    renderPressCarousel();
}

function renderPressCarousel() {
    const carousel = document.getElementById('pressCarousel');
    const indicatorsContainer = document.getElementById('pressIndicators');
    
    if (!carousel) return;
    
    const currentPaper = CONFIG.press[CONFIG.currentIndex];
    
    carousel.innerHTML = `
        <div class="carousel-item active">
            <div class="carousel-image-container">
                <img src="${currentPaper.logo}" alt="${currentPaper.title}" class="carousel-image">
                <div class="carousel-zoom-controls">
                    <button class="zoom-btn zoom-in" onclick="zoomImage(this, 1.2)">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="zoom-btn zoom-out" onclick="zoomImage(this, 0.8)">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <button class="zoom-btn reset-zoom" onclick="resetZoom(this)">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
            </div>
            <div class="carousel-info">
                <h3 class="carousel-title">${currentPaper.title}</h3>
                <p class="carousel-date">${currentPaper.date}</p>
            </div>
        </div>
    `;
    
    if (indicatorsContainer) {
        indicatorsContainer.innerHTML = CONFIG.press.map((_, index) => 
            `<button class="indicator ${index === CONFIG.currentIndex ? 'active' : ''}" 
                    onclick="goToSlide(${index})"></button>`
        ).join('');
    }
}

function goToSlide(index) {
    CONFIG.currentIndex = index;
    renderPressCarousel();
}

function zoomImage(btn, factor) {
    const container = btn.closest('.carousel-image-container');
    const img = container.querySelector('.carousel-image');
    let currentScale = parseFloat(img.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || 1);
    let newScale = Math.max(0.5, Math.min(currentScale * factor, 3));
    img.style.transform = `scale(${newScale})`;
}

function resetZoom(btn) {
    const container = btn.closest('.carousel-image-container');
    const img = container.querySelector('.carousel-image');
    img.style.transform = 'scale(1)';
}

// ==========================================
// EXPORT DROPDOWN
// ==========================================
function initExportDropdown() {
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdown = document.getElementById('exportDropdown');
    
    if (exportBtn && exportDropdown) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportDropdown.style.display = exportDropdown.style.display === 'flex' ? 'none' : 'flex';
        });
        
        document.addEventListener('click', (e) => {
            if (!exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
                exportDropdown.style.display = 'none';
            }
        });
    }
}

// ==========================================
// EXPORT DATA - CORRIGÉ
// ==========================================
function exportData(format) {
    try {
        if (format === 'csv') {
            exportCSV();
        } else if (format === 'excel') {
            exportExcel();
        } else if (format === 'pdf') {
            exportPDF();
        } else if (format === 'json') {
            exportJSON();
        }
        
        const dropdown = document.getElementById('exportDropdown');
        if (dropdown) dropdown.style.display = 'none';
        
    } catch (error) {
        console.error('Erreur export:', error);
        showNotification(`Erreur lors de l'export ${format.toUpperCase()}: ${error.message}`, 'error');
    }
}

function exportCSV() {
    const headers = ['ID', 'Domaine', 'Engagement', 'Statut', 'Délai', 'Résultat attendu', 'En retard', 'Progression (%)'];
    const rows = CONFIG.promises.map(p => [
        p.id,
        p.domaine,
        `"${p.engagement.replace(/"/g, '""')}"`,
        p.isLate ? '⚠️ En retard' : p.status,
        p.delai,
        `"${p.resultat.replace(/"/g, '""')}"`,
        p.isLate ? 'Oui' : 'Non',
        p.progress
    ]);
    
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');
    
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `engagements_senegal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Export CSV terminé !', 'success');
}

function exportExcel() {
    showNotification('⚠️ Export Excel non disponible. Utilisez CSV.', 'info');
    exportCSV();
}

function exportPDF() {
    showNotification('⚠️ Export PDF non disponible. Utilisez CSV.', 'info');
    exportCSV();
}

function exportJSON() {
    const data = {
        meta: {
            generated_at: new Date().toISOString(),
            total_promises: CONFIG.promises.length
        },
        promises: CONFIG.promises.map(p => ({
            id: p.id,
            domaine: p.domaine,
            engagement: p.engagement,
            status: p.status,
            is_late: p.isLate,
            delai: p.delai,
            resultat_attendu: p.resultat,
            progression: p.progress
        }))
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `engagements_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
    
    showNotification('✅ Export JSON terminé !', 'success');
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
        
        const initialValue = parseInt(input.value) || 3;
        updateStars(stars, initialValue);
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            service: document.getElementById('service').value,
            accessibility: parseInt(document.getElementById('accessibility').value),
            welcome: parseInt(document.getElementById('welcome').value),
            efficiency: parseInt(document.getElementById('efficiency').value),
            transparency: parseInt(document.getElementById('transparency').value),
            comment: document.getElementById('comment').value,
            date: new Date().toISOString()
        };
        
        if (!formData.service) {
            showNotification('Veuillez sélectionner un service', 'error');
            return;
        }
        
        if (supabaseClient) {
            await saveRatingToSupabase(formData);
        }
        
        showNotification('Merci pour votre notation !', 'success');
        form.reset();
        
        starsContainers.forEach(container => {
            const field = container.getAttribute('data-field');
            const input = document.getElementById(field);
            const stars = container.querySelectorAll('i');
            input.value = 3;
            updateStars(stars, 3);
        });
        
        setTimeout(renderRatingDashboard, 500);
    });
    
    renderRatingDashboard();
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
        if (supabaseClient) {
            const { error } = await supabaseClient
                .from('service_ratings')
                .insert([data]);
            
            if (error) throw error;
            console.log('✅ Notation sauvegardée');
        }
    } catch (error) {
        console.error('❌ Erreur sauvegarde notation:', error);
    }
}

function renderRatingDashboard() {
    const dashboard = document.getElementById('ratingDashboard');
    if (!dashboard) return;
    
    dashboard.innerHTML = `
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>Total des votes</h3>
                <div class="dashboard-value">0</div>
                <div class="dashboard-description">Votes enregistrés</div>
            </div>
            <div class="dashboard-card">
                <h3>Service le mieux noté</h3>
                <div class="dashboard-value">-</div>
                <div class="dashboard-description">Moyenne: 0.0/5</div>
            </div>
            <div class="dashboard-card">
                <h3>Dernier vote</h3>
                <div class="dashboard-value">-</div>
                <div class="dashboard-description">-</div>
            </div>
            <div class="dashboard-card">
                <h3>Votes par service</h3>
                <div class="votes-chart">
                    <div class="chart-item">
                        <span class="chart-label">Tous les services</span>
                        <div class="chart-bar">
                            <div class="chart-fill" style="width: 0%"></div>
                            <span class="chart-value">0</span>
                        </div>
                    </div>
                </div>
            </div>
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
        
        renderPromises(CONFIG.promises.slice(0, CONFIG.visibleCount));
        updateStats();
        
    } catch (error) {
        console.error('❌ Erreur chargement votes:', error);
    }
}

// ==========================================
// ACTIONS
// ==========================================
function toggleDetails(promiseId) {
    const updatesList = document.getElementById(`updates-${promiseId}`);
    if (updatesList) {
        updatesList.style.display = updatesList.style.display === 'none' ? 'block' : 'none';
    }
}

function ratePromise(promiseId) {
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const rating = prompt(`Noter "${promise.engagement.substring(0, 50)}..." sur 5:`);
    
    if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
        if (supabaseClient) {
            saveVoteToSupabase(promiseId, parseInt(rating));
        }
        showNotification('Merci pour votre vote !', 'success');
    }
}

async function saveVoteToSupabase(promiseId, rating) {
    try {
        if (supabaseClient) {
            const { error } = await supabaseClient
                .from('public_votes')
                .insert([{ promise_id: promiseId, rating }]);
            
            if (error) throw error;
            
            setTimeout(fetchAndDisplayPublicVotes, 500);
        }
    } catch (error) {
        console.error('❌ Erreur sauvegarde vote:', error);
    }
}

function sharePromise(promiseId) {
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const text = `📊 "${promise.engagement.substring(0, 100)}..." - Suivi des engagements du Projet Sénégal`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({ title: 'Engagement du Projet Sénégal', text: text, url: url });
    } else {
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    }
}

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
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
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==========================================
// EXPORTS GLOBAUX
// ==========================================
window.toggleDetails = toggleDetails;
window.ratePromise = ratePromise;
window.sharePromise = sharePromise;
window.resetFilters = resetFilters;
window.exportData = exportData;
window.goToSlide = goToSlide;
window.zoomImage = zoomImage;
window.resetZoom = resetZoom;
