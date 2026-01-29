// ==========================================
// APP.JS - VERSION COMPLÈTE CORRIGÉE
// ==========================================
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_joJuW7-vMiQG302_2Mvj5A_sVaD8Wap';
let supabaseClient = null;

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

const CONFIG = {
    START_DATE: new Date('2024-04-02'),
    CURRENT_DATE: new Date(),
    promises: [],
    news: [],
    press: [
        { id: '1', title: 'Le Soleil', date: '28/01/2026', image: '🇸🇱' },
        { id: '2', title: 'Sud Quotidien', date: '28/01/2026', image: '🇸🇶' },
        { id: '3', title: 'WalFadjri', date: '28/01/2026', image: '🇼🇫' },
        { id: '4', title: 'L\'Observateur', date: '28/01/2026', image: '🇱🇴' },
        { id: '5', title: 'Le Quotidien', date: '28/01/2026', image: '🇱🇶' }
    ],
    currentIndex: 0,
    ratings: []
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    await loadData();
    setupEventListeners();
    setupCarousel();
    setupServiceRatings();
    console.log('✅ Initialisation terminée');
});

// ==========================================
// CHARGEMENT DES DONNÉES
// ==========================================
async function loadData() {
    try {
        const response = await fetch('promises.json');
        const data = await response.json();
        
        CONFIG.START_DATE = new Date(data.start_date);
        
        // Charger d'abord les données de base
        CONFIG.promises = data.promises.map(p => ({
            ...p,
            deadline: calculateDeadline(p.delai),
            isLate: checkIfLate(p.status, calculateDeadline(p.delai)),
            publicAvg: 0,
            publicCount: 0
        }));
        
        // Charger les votes depuis Supabase (sans bloquer le reste)
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
        renderPressCarousel();
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        showNotification('Erreur de chargement des données', 'error');
    }
}

// ==========================================
// CALCUL DES DÉLAIS
// ==========================================
function calculateDeadline(delaiText) {
    if (!CONFIG.START_DATE) return new Date();
    const text = delaiText.toLowerCase();
    const result = new Date(CONFIG.START_DATE);
    
    if (text.includes("immédiat") || text.includes("3 mois") || text.includes("court terme")) {
        result.setMonth(result.getMonth() + 3);
    } else if (text.includes("6 premiers mois") || text.includes("6 mois")) {
        result.setMonth(result.getMonth() + 6);
    } else if (text.includes("12 premiers mois") || text.includes("1ère année") || text.includes("1 an")) {
        result.setFullYear(result.getFullYear() + 1);
    } else if (text.includes("2 premières années") || text.includes("2 ans") || text.includes("1 à 2 ans")) {
        result.setFullYear(result.getFullYear() + 2);
    } else if (text.includes("3 ans") || text.includes("2 à 3 ans")) {
        result.setFullYear(result.getFullYear() + 3);
    } else if (text.includes("4 ans") || text.includes("3 à 4 ans")) {
        result.setFullYear(result.getFullYear() + 4);
    } else if (text.includes("5 ans") || text.includes("quinquennat") || text.includes("mandat") || text.includes("3 à 5 ans")) {
        result.setFullYear(result.getFullYear() + 5);
    } else if (text.includes("2027")) {
        return new Date('2027-01-01');
    } else if (text.includes("2029")) {
        return new Date('2029-01-01');
    } else if (text.includes("2030")) {
        return new Date('2030-01-01');
    } else {
        result.setFullYear(result.getFullYear() + 5);
    }
    
    return result;
}

function checkIfLate(status, deadline) {
    return status !== 'realise' && CONFIG.CURRENT_DATE > deadline;
}

// ==========================================
// CALCUL COMPLET DES STATISTIQUES
// ==========================================
function calculateStats() {
    const total = CONFIG.promises.length;
    const realise = CONFIG.promises.filter(p => p.status === 'realise').length;
    const encours = CONFIG.promises.filter(p => p.status === 'encours').length;
    const nonLance = CONFIG.promises.filter(p => p.status === 'non-lance').length;
    const retard = CONFIG.promises.filter(p => p.isLate).length;
    const avecMaj = CONFIG.promises.filter(p => p.mises_a_jour && p.mises_a_jour.length > 0).length;
    
    // Pourcentages
    const realisePercentage = total > 0 ? ((realise / total) * 100).toFixed(1) : 0;
    const encoursPercentage = total > 0 ? ((encours / total) * 100).toFixed(1) : 0;
    const nonLancePercentage = total > 0 ? ((nonLance / total) * 100).toFixed(1) : 0;
    const retardPercentage = total > 0 ? ((retard / total) * 100).toFixed(1) : 0;
    const avecMajPercentage = total > 0 ? ((avecMaj / total) * 100).toFixed(1) : 0;
    
    // Taux de réalisation pondéré
    let tauxRealisation = 0;
    let progression = '';
    if (total > 0) {
        const poidsRealise = realise * 100;
        const poidsEncours = encours * 50;
        const poidsNonLance = nonLance * 10;
        tauxRealisation = ((poidsRealise + poidsEncours + poidsNonLance) / (total * 100) * 100).toFixed(1);
        
        if (tauxRealisation >= 80) progression = 'Excellent';
        else if (tauxRealisation >= 60) progression = 'Bon';
        else if (tauxRealisation >= 40) progression = 'Moyen';
        else if (tauxRealisation >= 20) progression = 'Faible';
        else progression = 'Début';
    }
    
    // Note moyenne
    let moyenneNotes = 0;
    let totalVotes = 0;
    let totalNotes = 0;
    let promessesNotees = 0;
    
    CONFIG.promises.forEach(p => {
        if (p.publicCount && p.publicCount > 0) {
            totalVotes += p.publicCount;
            totalNotes += p.publicAvg * p.publicCount;
            promessesNotees++;
        }
    });
    
    if (totalVotes > 0) {
        moyenneNotes = (totalNotes / totalVotes).toFixed(1);
    }
    
    // Délai moyen restant
    let delaiMoyenJours = 0;
    let delaiMoyenText = '0j';
    const promessesEnCours = CONFIG.promises.filter(p => p.status !== 'realise' && !p.isLate);
    if (promessesEnCours.length > 0) {
        const maintenant = CONFIG.CURRENT_DATE.getTime();
        const totalJours = promessesEnCours.reduce((sum, p) => {
            const diffJours = Math.max(0, Math.ceil((p.deadline - maintenant) / (1000 * 60 * 60 * 24)));
            return sum + diffJours;
        }, 0);
        delaiMoyenJours = Math.round(totalJours / promessesEnCours.length);
        delaiMoyenText = delaiMoyenJours > 365 ? `${Math.round(delaiMoyenJours/365)}a` : 
                        delaiMoyenJours > 30 ? `${Math.round(delaiMoyenJours/30)}m` : 
                        `${delaiMoyenJours}j`;
    }
    
    // Domaine principal
    let domainePrincipal = '-';
    let domaineCount = 0;
    if (CONFIG.promises.length > 0) {
        const domaines = {};
        CONFIG.promises.forEach(p => {
            domaines[p.domaine] = (domaines[p.domaine] || 0) + 1;
        });
        const entries = Object.entries(domaines);
        if (entries.length > 0) {
            const [domaine, count] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
            domainePrincipal = domaine.substring(0, 12) + (domaine.length > 12 ? '...' : '');
            domaineCount = count;
        }
    }
    
    return {
        total, realise, encours, nonLance, retard, avecMaj,
        realisePercentage, encoursPercentage, nonLancePercentage, retardPercentage, avecMajPercentage,
        tauxRealisation,
        progression,
        moyenneNotes,
        totalVotes,
        promessesNotees,
        delaiMoyen: delaiMoyenText,
        promessesEnCours: promessesEnCours.length,
        domainePrincipal,
        domaineCount
    };
}

// ==========================================
// RENDU DES STATISTIQUES
// ==========================================
function renderStats(stats) {
    document.getElementById('total').textContent = stats.total;
    document.getElementById('realise').textContent = stats.realise;
    document.getElementById('encours').textContent = stats.encours;
    document.getElementById('non-lance').textContent = stats.nonLance;
    document.getElementById('retard').textContent = stats.retard;
    document.getElementById('taux-realisation').textContent = `${stats.tauxRealisation}%`;
    document.getElementById('moyenne-notes').textContent = stats.moyenneNotes;
    document.getElementById('avec-maj').textContent = stats.avecMaj;
    document.getElementById('delai-moyen').textContent = stats.delaiMoyen;
    document.getElementById('domaine-principal').textContent = stats.domainePrincipal;
    
    // Pourcentages
    document.getElementById('total-percentage').textContent = '100%';
    document.getElementById('realise-percentage').textContent = `${stats.realisePercentage}%`;
    document.getElementById('encours-percentage').textContent = `${stats.encoursPercentage}%`;
    document.getElementById('non-lance-percentage').textContent = `${stats.nonLancePercentage}%`;
    document.getElementById('retard-percentage').textContent = `${stats.retardPercentage}%`;
    document.getElementById('avec-maj-percentage').textContent = `${stats.avecMajPercentage}%`;
    
    // Texte de progression
    document.getElementById('progress-text').textContent = stats.progression;
    
    // Votes
    document.getElementById('votes-total').textContent = stats.promessesNotees > 0 ? 
        `${stats.promessesNotees}/${stats.total} promesses notées` : 
        'Aucun vote';
    
    // Jours restants
    document.getElementById('jours-restants').textContent = stats.promessesEnCours > 0 ? 
        `${stats.promessesEnCours} engagements` : 
        'Aucun';
    
    // Domaine count
    document.getElementById('domaine-count').textContent = `${stats.domaineCount} engagements`;
}

// ==========================================
// RENDU COMPLET
// ==========================================
function renderAll() {
    const stats = calculateStats();
    renderStats(stats);
    renderPromises(CONFIG.promises);
    renderFilters();
}

// ==========================================
// RENDU DES ENGAGEMENTS
// ==========================================
function renderPromises(promises) {
    const container = document.getElementById('promisesContainer');
    if (!container) return;
    
    if (promises.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x"></i>
                <h3>Aucun résultat trouvé</h3>
                <p>Essayez de modifier vos critères de recherche</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = promises.map(promise => createPromiseCard(promise)).join('');
}

function createPromiseCard(promise) {
    const statusClass = promise.status === 'realise' ? 'status-realise' :
                       promise.status === 'encours' ? 'status-encours' : 'status-nonlance';
    const statusText = promise.status === 'realise' ? '✅ Réalisé' :
                      promise.status === 'encours' ? '🔄 En cours' : '⏳ Non lancé';
    
    const progress = promise.status === 'realise' ? 100 :
                    promise.status === 'encours' ? 50 : 10;
    
    // Badge retard
    const retardBadge = promise.isLate ? 
        '<div class="retard-badge"><i class="fas fa-exclamation-triangle"></i> En Retard</div>' : '';
    
    // Note moyenne
    let ratingHTML = '';
    if (promise.publicAvg > 0) {
        ratingHTML = `
            <div class="promise-rating">
                <div class="rating-stars">
                    ${generateStars(promise.publicAvg)}
                </div>
                <span class="rating-text">${promise.publicAvg}/5 (${promise.publicCount} votes)</span>
            </div>
        `;
    }
    
    // Mises à jour
    let updatesHTML = '';
    if (promise.mises_a_jour && promise.mises_a_jour.length > 0) {
        updatesHTML = `
            <button class="details-btn" onclick="toggleUpdates('${promise.id}')" aria-expanded="false">
                <i class="fas fa-history"></i> Voir les mises à jour (${promise.mises_a_jour.length})
            </button>
            <div id="updates-${promise.id}" class="updates-container">
                ${promise.mises_a_jour.map(update => `
                    <div class="update-item">
                        <span class="update-date"><i class="fas fa-calendar-alt"></i> ${update.date}</span>
                        <span class="update-text">${update.text}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div class="promise-card" data-id="${promise.id}">
            <div class="domain-badge">${promise.domaine}</div>
            <h3 class="promise-title">${promise.engagement}</h3>
            
            <div class="result-box">
                <i class="fas fa-bullseye"></i>
                <strong>Résultat attendu :</strong> ${promise.resultat}
            </div>
            
            <div class="promise-meta">
                <div class="status-badge ${statusClass}">${statusText}</div>
                <div class="delay-badge">
                    <i class="fas fa-clock"></i>
                    ${promise.delai}
                </div>
                ${retardBadge}
            </div>
            
            ${ratingHTML}
            
            <div class="progress-container">
                <div class="progress-label">
                    <span>Progression</span>
                    <span>${progress}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                </div>
            </div>
            
            ${updatesHTML}
            
            <div class="promise-actions">
                <div class="rating-section">
                    <div class="stars">
                        <i class="far fa-star" data-value="1" onclick="ratePromise('${promise.id}', 1)"></i>
                        <i class="far fa-star" data-value="2" onclick="ratePromise('${promise.id}', 2)"></i>
                        <i class="far fa-star" data-value="3" onclick="ratePromise('${promise.id}', 3)"></i>
                        <i class="far fa-star" data-value="4" onclick="ratePromise('${promise.id}', 4)"></i>
                        <i class="far fa-star" data-value="5" onclick="ratePromise('${promise.id}', 5)"></i>
                    </div>
                    <span class="rating-label" id="rating-label-${promise.id}">
                        Noter cet engagement
                    </span>
                </div>
                <button class="share-btn" onclick="sharePromise('${promise.id}')">
                    <i class="fas fa-share-alt"></i> Partager
                </button>
            </div>
        </div>
    `;
}

// Fonction pour générer les étoiles
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// ==========================================
// FONCTIONS POUR LES MISES À JOUR
// ==========================================
window.toggleUpdates = function(promiseId) {
    const updatesEl = document.getElementById(`updates-${promiseId}`);
    if (!updatesEl) return;
    
    const btn = updatesEl.previousElementSibling;
    
    if (updatesEl.classList.contains('show')) {
        updatesEl.classList.remove('show');
        btn.innerHTML = '<i class="fas fa-history"></i> Voir les mises à jour';
        btn.setAttribute('aria-expanded', 'false');
    } else {
        updatesEl.classList.add('show');
        btn.innerHTML = '<i class="fas fa-times-circle"></i> Masquer les mises à jour';
        btn.setAttribute('aria-expanded', 'true');
    }
};

// ==========================================
// GESTION DES VOTES
// ==========================================
window.ratePromise = async function(promiseId, rating) {
    if (!supabaseClient) {
        showNotification('Erreur de connexion au serveur', 'error');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('votes')
            .insert([{ promise_id: promiseId, rating: rating }]);
        
        if (error) throw error;
        
        showNotification(`Merci ! Vote de ${rating}/5 enregistré.`);
        
        // Mettre à jour localement
        const promise = CONFIG.promises.find(p => p.id === promiseId);
        if (promise) {
            if (!promise.publicCount) promise.publicCount = 0;
            if (!promise.publicAvg) promise.publicAvg = 0;
            
            const newTotal = promise.publicAvg * promise.publicCount + rating;
            promise.publicCount += 1;
            promise.publicAvg = (newTotal / promise.publicCount).toFixed(1);
            
            // Recalculer les stats
            const stats = calculateStats();
            renderStats(stats);
            
            // Mettre à jour cette carte spécifique
            const card = document.querySelector(`[data-id="${promiseId}"]`);
            if (card) {
                const ratingSection = card.querySelector('.promise-rating');
                if (ratingSection) {
                    ratingSection.innerHTML = `
                        <div class="rating-stars">
                            ${generateStars(promise.publicAvg)}
                        </div>
                        <span class="rating-text">${promise.publicAvg}/5 (${promise.publicCount} votes)</span>
                    `;
                }
            }
        }
        
    } catch (error) {
        console.error('Erreur lors du vote:', error);
        showNotification('Erreur lors de l\'enregistrement du vote', 'error');
    }
};

// ==========================================
// CHARGEMENT DES VOTES PUBLICS
// ==========================================
async function fetchAndDisplayPublicVotes() {
    if (!supabaseClient) return;
    
    try {
        const { data: votes, error } = await supabaseClient
            .from('votes')
            .select('promise_id, rating');
        
        if (error) throw error;
        
        if (!votes) return;
        
        // Calculer les statistiques par promesse
        const stats = {};
        votes.forEach(v => {
            if (!stats[v.promise_id]) {
                stats[v.promise_id] = { sum: 0, count: 0 };
            }
            stats[v.promise_id].sum += v.rating;
            stats[v.promise_id].count += 1;
        });
        
        // Mettre à jour les promesses avec les données publiques
        CONFIG.promises.forEach(p => {
            if (stats[p.id]) {
                p.publicAvg = (stats[p.id].sum / stats[p.id].count).toFixed(1);
                p.publicCount = stats[p.id].count;
            }
        });
        
        // Recalculer les statistiques
        const statsCalculated = calculateStats();
        renderStats(statsCalculated);
        renderPromises(CONFIG.promises);
        
    } catch (error) {
        console.error('Erreur chargement des votes:', error);
        // Ne pas bloquer l'application si Supabase échoue
    }
}

// ==========================================
// FILTRES
// ==========================================
function renderFilters() {
    const sectorFilter = document.getElementById('sectorFilter');
    if (!sectorFilter) return;
    
    const domains = [...new Set(CONFIG.promises.map(p => p.domaine))].sort();
    
    sectorFilter.innerHTML = '<option value="">Tous les secteurs</option>';
    
    domains.forEach(domain => {
        const option = document.createElement('option');
        option.value = domain;
        option.textContent = domain;
        sectorFilter.appendChild(option);
    });
}

function setupEventListeners() {
    // Filtres
    const searchInput = document.getElementById('searchInput');
    const sectorFilter = document.getElementById('sectorFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (sectorFilter) sectorFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (sortFilter) sortFilter.addEventListener('change', applyFilters);
    
    // Filtres rapides
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            if (filter === 'reset') {
                resetFilters();
                return;
            }
            
            // Mettre à jour l'état actif
            document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            applyQuickFilter(filter);
        });
    });
    
    // Export
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = this.querySelector('.export-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('show');
            }
        });
        
        // Options d'export
        document.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', function() {
                const format = this.dataset.format;
                exportData(format);
            });
        });
        
        // Fermer le dropdown en cliquant ailleurs
        document.addEventListener('click', function() {
            const dropdowns = document.querySelectorAll('.export-dropdown');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        });
    }
}

function applyQuickFilter(filterType) {
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    switch(filterType) {
        case 'all':
            statusFilter.value = '';
            sortFilter.value = 'recent';
            break;
        case 'realise':
            statusFilter.value = 'realise';
            sortFilter.value = 'recent';
            break;
        case 'encours':
            statusFilter.value = 'encours';
            sortFilter.value = 'recent';
            break;
        case 'retard':
            statusFilter.value = '';
            sortFilter.value = 'retard';
            break;
        case 'updates':
            // Filtre spécial pour engagements avec mises à jour
            const filtered = CONFIG.promises.filter(p => p.mises_a_jour && p.mises_a_jour.length > 0);
            renderPromises(filtered);
            return;
    }
    
    applyFilters();
}

function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const sector = document.getElementById('sectorFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const sort = document.getElementById('sortFilter')?.value || 'recent';
    
    let filtered = CONFIG.promises.filter(p => {
        const matchSearch = p.engagement.toLowerCase().includes(search) ||
                           p.resultat.toLowerCase().includes(search) ||
                           p.domaine.toLowerCase().includes(search);
        const matchSector = !sector || p.domaine === sector;
        const matchStatus = !status || p.status === status;
        
        return matchSearch && matchSector && matchStatus;
    });
    
    // Trier
    switch(sort) {
        case 'recent':
            filtered.sort((a, b) => b.deadline - a.deadline);
            break;
        case 'ancient':
            filtered.sort((a, b) => a.deadline - b.deadline);
            break;
        case 'rating':
            filtered.sort((a, b) => (b.publicAvg || 0) - (a.publicAvg || 0));
            break;
        case 'retard':
            filtered.sort((a, b) => {
                if (a.isLate && !b.isLate) return -1;
                if (!a.isLate && b.isLate) return 1;
                return 0;
            });
            break;
    }
    
    renderPromises(filtered);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('sectorFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('sortFilter').value = 'recent';
    
    document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    
    renderPromises(CONFIG.promises);
    showNotification('Filtres réinitialisés');
}

// ==========================================
// EXPORT DES DONNÉES
// ==========================================
function exportData(format) {
    const promises = CONFIG.promises;
    const date = new Date().toISOString().split('T')[0];
    
    let content, mimeType, filename;
    
    function sanitizeForExport(text) {
        if (!text) return '';
        return text
            .replace(/"/g, '""')
            .replace(/\r?\n/g, ' ')
            .replace(/\t/g, ' ')
            .trim();
    }
    
    switch(format) {
        case 'csv':
            const bom = '\uFEFF';
            const headers = ['ID', 'Domaine', 'Engagement', 'Résultat attendu', 'Délai', 'Statut', 'En retard', 'Mises à jour', 'Note moyenne', 'Nombre de votes'];
            const rows = promises.map(p => [
                p.id,
                `"${sanitizeForExport(p.domaine)}"`,
                `"${sanitizeForExport(p.engagement)}"`,
                `"${sanitizeForExport(p.resultat)}"`,
                `"${sanitizeForExport(p.delai)}"`,
                p.status,
                p.isLate ? 'Oui' : 'Non',
                p.mises_a_jour?.length || 0,
                p.publicAvg || 0,
                p.publicCount || 0
            ]);
            
            content = bom + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            mimeType = 'text/csv;charset=utf-8;';
            filename = `promesses-projet-bi-${date}.csv`;
            break;
            
        case 'json':
            content = JSON.stringify(promises, null, 2);
            mimeType = 'application/json;charset=utf-8;';
            filename = `promesses-projet-bi-${date}.json`;
            break;
            
        case 'pdf':
            showNotification('Export PDF - Fonctionnalité à venir', 'info');
            return;
            
        default:
            return;
    }
    
    // Téléchargement
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    showNotification(`Données exportées en ${format.toUpperCase()} avec succès !`);
}

// ==========================================
// ACTUALITÉS
// ==========================================
function renderNews(news) {
    const container = document.getElementById('news-grid');
    if (!container) return;
    
    container.innerHTML = news.map(item => `
        <div class="news-card">
            <div class="news-image">
                <i class="fas fa-newspaper"></i>
            </div>
            <div class="news-content">
                <h3>${item.title}</h3>
                <p>${item.excerpt}</p>
                <div class="news-meta">
                    <span><i class="fas fa-calendar"></i> ${item.date}</span>
                    <span><i class="fas fa-newspaper"></i> ${item.source}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ==========================================
// CAROUSEL DE PRESSE
// ==========================================
function setupCarousel() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const carousel = document.getElementById('pressCarousel');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!prevBtn || !nextBtn || !carousel || !indicators) return;
    
    prevBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex - 1 + CONFIG.press.length) % CONFIG.press.length;
        renderPressCarousel();
    });
    
    nextBtn.addEventListener('click', () => {
        CONFIG.currentIndex = (CONFIG.currentIndex + 1) % CONFIG.press.length;
        renderPressCarousel();
    });
    
    // Indicateurs
    indicators.innerHTML = '';
    CONFIG.press.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = `indicator ${index === CONFIG.currentIndex ? 'active' : ''}`;
        indicator.addEventListener('click', () => {
            CONFIG.currentIndex = index;
            renderPressCarousel();
        });
        indicators.appendChild(indicator);
    });
}

function renderPressCarousel() {
    const carousel = document.getElementById('pressCarousel');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!carousel || !indicators) return;
    
    carousel.innerHTML = `
        <div class="press-item active">
            <div class="press-emoji">${CONFIG.press[CONFIG.currentIndex].image}</div>
            <h3>${CONFIG.press[CONFIG.currentIndex].title}</h3>
            <p>${CONFIG.press[CONFIG.currentIndex].date}</p>
        </div>
    `;
    
    // Mettre à jour les indicateurs
    const indicatorElements = indicators.querySelectorAll('.indicator');
    indicatorElements.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === CONFIG.currentIndex);
    });
}

// ==========================================
// NOTATION DES SERVICES
// ==========================================
function setupServiceRatings() {
    const form = document.getElementById('rating-form');
    if (!form) return;
    
    // Initialiser les étoiles
    setupStars('accessibility-stars', 'accessibility');
    setupStars('welcome-stars', 'welcome');
    setupStars('efficiency-stars', 'efficiency');
    setupStars('transparency-stars', 'transparency');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const service = document.getElementById('service').value;
        const accessibility = document.getElementById('accessibility').value;
        const welcome = document.getElementById('welcome').value;
        const efficiency = document.getElementById('efficiency').value;
        const transparency = document.getElementById('transparency').value;
        const comment = document.getElementById('comment').value;
        
        if (!service) {
            showNotification('Veuillez sélectionner un service', 'error');
            return;
        }
        
        const rating = {
            service,
            accessibility: parseInt(accessibility),
            welcome: parseInt(welcome),
            efficiency: parseInt(efficiency),
            transparency: parseInt(transparency),
            comment,
            date: new Date().toLocaleDateString('fr-FR')
        };
        
        CONFIG.ratings.push(rating);
        
        // Sauvegarder localement
        localStorage.setItem('serviceRatings', JSON.stringify(CONFIG.ratings));
        
        showNotification('Merci pour votre notation ! Votre feedback a été enregistré.');
        form.reset();
        
        // Réinitialiser les étoiles
        resetStars('accessibility-stars', 'accessibility');
        resetStars('welcome-stars', 'welcome');
        resetStars('efficiency-stars', 'efficiency');
        resetStars('transparency-stars', 'transparency');
    });
}

function setupStars(containerId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    if (!container || !hiddenInput) return;
    
    const stars = container.querySelectorAll('.star');
    
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const value = parseInt(this.dataset.value);
            highlightStars(containerId, value);
        });
        
        star.addEventListener('click', function() {
            const value = parseInt(this.dataset.value);
            hiddenInput.value = value;
            highlightStars(containerId, value);
        });
    });
    
    container.addEventListener('mouseleave', function() {
        const value = parseInt(hiddenInput.value);
        highlightStars(containerId, value);
    });
}

function highlightStars(containerId, value) {
    const container = document.getElementById(containerId);
    const stars = container.querySelectorAll('.star');
    
    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        if (starValue <= value) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

function resetStars(containerId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    if (!container || !hiddenInput) return;
    
    hiddenInput.value = 3;
    highlightStars(containerId, 3);
}

// ==========================================
// PARTAGE
// ==========================================
window.sharePromise = function(promiseId) {
    const promise = CONFIG.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const text = `📊 "${promise.engagement.substring(0, 100)}..." - Suivi des engagements du Projet pour un Sénégal Souverain, Juste et Prospère`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'Engagement du Projet Sénégal',
            text: text,
            url: url
        });
    } else {
        // Fallback pour navigateurs sans Web Share API
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank');
    }
};

// ==========================================
// NOTIFICATIONS
// ==========================================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? 'linear-gradient(135deg, #e76f51, #c1543d)' : 
                                   type === 'info' ? 'linear-gradient(135deg, #4a90e2, #2d7ab5)' : 
                                   'linear-gradient(135deg, #2a9d8f, #21867a)';
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'info' ? 'info-circle' : 'check-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ==========================================
// CHARGEMENT INITIAL DES NOTATIONS
// ==========================================
function loadSavedRatings() {
    try {
        const saved = localStorage.getItem('serviceRatings');
        if (saved) {
            CONFIG.ratings = JSON.parse(saved);
        }
    } catch (error) {
        console.warn('Impossible de charger les notations sauvegardées:', error);
    }
}

// Appeler au chargement
loadSavedRatings();

// ==========================================
// AJOUTER AU WINDOW POUR ACCÈS GLOBAL
// ==========================================
window.CONFIG = CONFIG;
window.toggleUpdates = toggleUpdates;
window.ratePromise = ratePromise;
window.sharePromise = sharePromise;
window.resetFilters = resetFilters;
window.exportData = exportData;
