// ==========================================
// APP.JS - VERSION FIDÈLE AUX ORIGINAUX
// ==========================================

// Configuration Supabase (inchangée)
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3c2R4dHRqamJmbm91ZmlpZGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODk0MjQsImV4cCI6MjA1MTI2NTQyNH0.Y2Jx8K5tQZ3X9y7Z8X6Y5W4V3U2T1S0R9Q8P7O6N5M4';
let supabaseClient = null;

// Initialisation Supabase (inchangée)
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

// Configuration globale (inchangée)
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
    currentFilteredPromises: [], // <-- AJOUT POUR LE BOUTON AFFICHER PLUS
    carouselIndex: 0,
    carouselAutoPlay: true,
    carouselInterval: null
};

// Personnes pour "Promesse du Jour" (inchangée)
const DAILY_PEOPLE = [/* ... même contenu que précédemment ... */];

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
    
    await loadData();
    
    setupDailyPromise();
    setupServiceRatings();
    setupPressCarousel();
    setupPromisesCarousel();
    
    console.log('✅ Initialisation terminée');
});

// ... [fonctions initNavigation, initScrollEffects, initDateDisplay inchangées] ...

// ==========================================
// CHARGEMENT DES DONNÉES (INCHANGÉ)
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
        
        // Initialiser currentFilteredPromises
        CONFIG.currentFilteredPromises = [...CONFIG.promises];
        
        CONFIG.news = [/* ... même contenu ... */];
        
        renderAll();
        renderNews(CONFIG.news);
        renderNewspapers();
        
        setTimeout(fetchAndDisplayPublicVotes, 1000);
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showNotification('Erreur de chargement des données', 'error');
    }
}

// ... [fonctions calculateDeadline, checkIfLate, getDaysRemaining inchangées] ...

// ==========================================
// CALCULS STATS - FIDÈLE AUX ORIGINAUX
// ==========================================
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
        tauxRealisation,
        realisePercentage: total > 0 ? ((realise / total) * 100).toFixed(1) : 0,
        encoursPercentage: total > 0 ? ((encours / total) * 100).toFixed(1) : 0
    };
}

// ==========================================
// UPDATE STATS - FIDÈLE AUX ORIGINAUX
// ==========================================
function updateStats() {
    const stats = calculateStats(CONFIG.currentFilteredPromises);
    
    // Mise à jour des stats avec les IDs EXACTS de l'original
    updateStatValue('total', stats.total);
    updateStatValue('realise', stats.realise);
    updateStatValue('encours', stats.encours);
    updateStatValue('non-lance', stats.nonLance);
    updateStatValue('retard', stats.retard);
    updateStatValue('taux-realisation', stats.tauxRealisation + '%');
    
    // Calculs additionnels (inchangés)
    const domains = {};
    CONFIG.currentFilteredPromises.forEach(p => {
        domains[p.domaine] = (domains[p.domaine] || 0) + 1;
    });
    const principalDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0];
    
    const avgDelay = CONFIG.currentFilteredPromises
        .filter(p => p.status !== 'Réalisé')
        .reduce((sum, p) => sum + (parseInt(getDaysRemaining(p.deadline).replace(' jours', '')) || 0), 0) / 
        (stats.total - stats.realise || 1);
    
    // Calcul de la moyenne des notes
    const allRatings = CONFIG.currentFilteredPromises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    const totalVotes = allRatings.reduce((sum, p) => sum + p.publicCount, 0);
    
    // Mise à jour des autres stats
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

// ... [fonctions updateStatValue, updateStatPercentage inchangées] ...

// ==========================================
// KPI SCROLLER - FIDÈLE AUX ORIGINAUX
// ==========================================
function updateKPI() {
    const stats = calculateStats(CONFIG.promises);
    
    // Mise à jour des KPI avec les IDs EXACTS
    document.getElementById('kpi-total').textContent = stats.total;
    document.getElementById('kpi-realised').textContent = stats.realise;
    document.getElementById('kpi-delayed').textContent = stats.retard;
    document.getElementById('kpi-rate').textContent = stats.tauxRealisation + '%';
    
    // Calcul de la note moyenne
    const allRatings = CONFIG.promises.filter(p => p.publicCount > 0);
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, p) => sum + p.publicAvg, 0) / allRatings.length).toFixed(1)
        : '0.0';
    document.getElementById('kpi-rating').textContent = avgRating;
    
    // Calcul du délai moyen
    const avgDelay = CONFIG.promises
        .filter(p => p.status !== 'Réalisé')
        .reduce((sum, p) => sum + (parseInt(getDaysRemaining(p.deadline).replace(' jours', '')) || 0), 0) / 
        (stats.total - stats.realise || 1);
    document.getElementById('kpi-delay').textContent = Math.round(avgDelay) + 'j';
}

// ==========================================
// FILTRES - CORRIGÉ POUR AFFICHER PLUS
// ==========================================
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
    
    // CRUCIAL: Mettre à jour currentFilteredPromises et réinitialiser visibleCount
    CONFIG.currentFilteredPromises = filtered;
    CONFIG.visibleCount = 6; // Toujours réinitialiser à 6 quand on filtre
    
    renderPromises(filtered.slice(0, CONFIG.visibleCount));
    updateResultsCount(filtered.length);
    updateShowMoreLessButtons(filtered.length);
    updateStats(); // Mettre à jour les stats avec les filtres
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

// ==========================================
// SHOW MORE / SHOW LESS - CORRIGÉ
// ==========================================
function initShowMoreLess() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
            // Afficher TOUTES les promesses filtrées
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
// RENDER PROMISES - FIDÈLE AUX ORIGINAUX
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
    // STRUCTURE EXACTEMENT COMME DANS L'ORIGINAL
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

// ... [autres fonctions inchangées: getStatusClass, getStatusText, formatDate, generateStars] ...

// ==========================================
// RENDER ALL - CORRIGÉ
// ==========================================
function renderAll() {
    updateStats(); // Utilise currentFilteredPromises
    renderPromises(CONFIG.currentFilteredPromises.slice(0, CONFIG.visibleCount));
    populateDomainFilter();
    updateKPI();
}

// ... [reste des fonctions inchangées: setupDailyPromise, renderNews, renderNewspapers, 
//      setupPressCarousel, setupPromisesCarousel, exportData, setupServiceRatings, 
//      saveRatingToSupabase, renderRatingDashboard, fetchAndDisplayPublicVotes, 
//      toggleDetails, ratePromise, saveVoteToSupabase, sharePromise, showNotification] ...

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
