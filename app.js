// ==========================================
// APP.JS - VERSION CORRIGÉE ET FIDÈLE AUX ORIGINAUX
// ==========================================

// Configuration Supabase (inchangée)
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3c2R4dHRqamJmbm91ZmlpZGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODk0MjQsImV4cCI6MjA1MTI2NTQyNH0.Y2Jx8K5tQZ3X9y7Z8X6Y5W4V3U2T1S0R9Q8P7O6N5M4';
let supabaseClient = null;

// Initialisation Supabase
try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase initialisé');
    } else {
        console.warn('⚠️ Supabase non disponible');
    }
} catch (error) {
    console.error('❌ Erreur Supabase:', error);
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
    currentFilteredPromises: [],
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
// FONCTIONS GLOBALES (définies en premier)
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

function resetFilters() {
    const filterStatus = document.getElementById('filter-status');
    const filterDomain = document.getElementById('filter-domain');
    const filterSearch = document.getElementById('filter-search');
    
    if (filterStatus) filterStatus.value = '';
    if (filterDomain) filterDomain.value = '';
    if (filterSearch) filterSearch.value = '';
    
    CONFIG.currentFilteredPromises = [...CONFIG.promises];
    CONFIG.visibleCount = 6;
    
    renderPromises(CONFIG.promises.slice(0, CONFIG.visibleCount));
    updateResultsCount(CONFIG.promises.length);
    updateShowMoreLessButtons(CONFIG.promises.length);
    updateStats();
}

function exportData(format) {
    if (format === 'csv') {
        exportCSV();
    } else if (format === 'json') {
        exportJSON();
    } else {
        showNotification(`Export ${format.toUpperCase()} en développement`, 'info');
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
// CALCULS FIDÈLES AUX ORIGINAUX
// ==========================================
function calculateDeadline(delaiText) {
    const text = delaiText.toLowerCase();
    const result = new Date(CONFIG.START_DATE);
    
    if (text.includes('immédiat') || text.includes('3 mois')) {
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
    } else {
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

// ==========================================
// MISE À JOUR DES STATS (IDs originaux)
// ==========================================
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

function calculateStats(promises) {
    const total = promises.length;
    const realise = promises.filter(p => p.status === 'Réalisé').length;
    const encours = promises.filter(p => p.status === 'En cours').length;
    const nonLance = promises.filter(p => p.status === 'Non lancé').length;
    const retard = promises.filter(p => p.isLate).length;
    
    // Calcul EXACTEMENT comme dans l'original
    const tauxRealisation = total > 0 ? 
        (((realise * 100 + encours * 50) / (total * 100)) * 100).toFixed(1) : 0;
    
    return {
        total,
        realise,
        encours,
        nonLance,
        retard,
        tauxRealisation
    };
}

function updateStats() {
    const stats = calculateStats(CONFIG.currentFilteredPromises);
    
    // IDs EXACTS de l'original
    updateStatValue('total', stats.total);
    updateStatValue('realise', stats.realise);
    updateStatValue('encours', stats.encours);
    updateStatValue('non-lance', stats.nonLance);
    updateStatValue('retard', stats.retard);
    updateStatValue('taux-realisation', stats.tauxRealisation + '%');
    
    // Calculs additionnels
    const domains = {};
    CONFIG.currentFilteredPromises.forEach(p => {
        domains[p.domaine] = (domains[p.domaine] || 0) + 1;
    });
    const principalDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
    
    const avgDelay = CONFIG.currentFilteredPromises
        .filter(p => p.status !== 'Réalisé')
        .reduce((sum, p) => sum + (parseInt(getDaysRemaining(p.deadline).replace(' jours', '').replace('Expiré', '0')) || 0), 0) / 
        (stats.total - stats.realise || 1);
    
    const allRatings = CONFIG.currentFilteredPromises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    const totalVotes = allRatings.reduce((sum, p) => sum + p.publicCount, 0);
    
    updateStatValue('moyenne-notes', avgRating);
    updateStatValue('votes-total', `${totalVotes} votes`);
    updateStatValue('delai-moyen', Math.round(avgDelay) + 'j');
    updateStatValue('avec-maj', CONFIG.currentFilteredPromises.filter(p => p.mises_a_jour && p.mises_a_jour.length > 0).length);
    
    if (principalDomain) {
        updateStatValue('domaine-principal', principalDomain[0]);
        updateStatValue('domaine-count', `${principalDomain[1]} engagements`);
    }
    
    // Mise à jour des pourcentages
    updateStatPercentage('total-percentage', stats.total, stats.total);
    updateStatPercentage('realise-percentage', stats.realise, stats.total);
    updateStatPercentage('encours-percentage', stats.encours, stats.total);
    updateStatPercentage('non-lance-percentage', stats.nonLance, stats.total);
    updateStatPercentage('retard-percentage', stats.retard, stats.total);
    updateStatPercentage('avec-maj-percentage', CONFIG.currentFilteredPromises.filter(p => p.mises_a_jour && p.mises_a_jour.length > 0).length, stats.total);
}

function updateKPI() {
    const stats = calculateStats(CONFIG.promises);
    
    // IDs EXACTS pour les KPI
    const kpiTotal = document.getElementById('kpi-total');
    const kpiRealised = document.getElementById('kpi-realised');
    const kpiDelayed = document.getElementById('kpi-delayed');
    const kpiRate = document.getElementById('kpi-rate');
    const kpiRating = document.getElementById('kpi-rating');
    const kpiDelay = document.getElementById('kpi-delay');
    
    if (kpiTotal) kpiTotal.textContent = stats.total;
    if (kpiRealised) kpiRealised.textContent = stats.realise;
    if (kpiDelayed) kpiDelayed.textContent = stats.retard;
    if (kpiRate) kpiRate.textContent = stats.tauxRealisation + '%';
    
    // Calcul de la note moyenne
    const allRatings = CONFIG.promises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    if (kpiRating) kpiRating.textContent = avgRating;
    
    // Calcul du délai moyen (corrigé pour gérer "Expiré")
    const avgDelay = CONFIG.promises
        .filter(p => p.status !== 'Réalisé')
        .reduce((sum, p) => {
            const daysStr = getDaysRemaining(p.deadline).replace(' jours', '').replace('Expiré', '0');
            return sum + (parseInt(daysStr) || 0);
        }, 0) / (stats.total - stats.realise || 1);
    
    if (kpiDelay) kpiDelay.textContent = Math.round(avgDelay) + 'j';
}

// ==========================================
// RENDU DES PROMESSES
// ==========================================
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

function renderAll() {
    updateStats();
    renderPromises(CONFIG.currentFilteredPromises.slice(0, CONFIG.visibleCount));
    populateDomainFilter();
    updateKPI();
}

// ==========================================
// FONCTIONS D'INITIALISATION
// ==========================================
function initNavigation() { /* ... même code ... */ }
function initScrollEffects() { /* ... même code ... */ }
function initDateDisplay() { /* ... même code ... */ }

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
    
    CONFIG.currentFilteredPromises = filtered;
    CONFIG.visibleCount = 6;
    
    renderPromises(filtered.slice(0, CONFIG.visibleCount));
    updateResultsCount(filtered.length);
    updateShowMoreLessButtons(filtered.length);
    updateStats();
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

function initShowMoreLess() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            CONFIG.visibleCount = CONFIG.currentFilteredPromises.length;
            renderPromises(CONFIG.currentFilteredPromises.slice(0, CONFIG.visibleCount));
            updateShowMoreLessButtons(CONFIG.currentFilteredPromises.length);
        });
    }
    
    if (showLessBtn) {
        showLessBtn.addEventListener('click', () => {
            CONFIG.visibleCount = 6;
            renderPromises(CONFIG.currentFilteredPromises.slice(0, CONFIG.visibleCount));
            updateShowMoreLessButtons(CONFIG.currentFilteredPromises.length);
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
        
        CONFIG.currentFilteredPromises = [...CONFIG.promises];
        
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
// FONCTIONS SUPPLÉMENTAIRES
// ==========================================
function setupDailyPromise() { /* ... même code ... */ }
function renderNews(news) { /* ... même code ... */ }
function renderNewspapers() { /* ... même code ... */ }
function setupPressCarousel() { /* ... même code ... */ }
function renderPressCarousel() { /* ... même code ... */ }
function setupPromisesCarousel() { /* ... même code ... */ }
function exportCSV() { /* ... même code ... */ }
function exportJSON() { /* ... même code ... */ }
function setupServiceRatings() { /* ... même code ... */ }
function updateStars(stars, value) { /* ... même code ... */ }
async function saveRatingToSupabase(data) { /* ... même code ... */ }
function renderRatingDashboard() { /* ... même code ... */ }
async function fetchAndDisplayPublicVotes() { /* ... même code ... */ }
async function saveVoteToSupabase(promiseId, rating) { /* ... même code ... */ }
function showNotification(message, type = 'success') { /* ... même code ... */ }

// ==========================================
// INITIALISATION PRINCIPALE
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    
    initNavigation();
    initScrollEffects();
    initFilters();
    initDateDisplay();
    initShowMoreLess();
    
    await loadData();
    
    setupDailyPromise();
    setupServiceRatings();
    setupPressCarousel();
    setupPromisesCarousel();
    
    console.log('✅ Initialisation terminée');
});
