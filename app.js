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
        
        // Charger les votes depuis Supabase
        await fetchAndDisplayPublicVotes();
        
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
    
    // Mises à jour
    let updatesHTML = '';
    if (promise.mises_a_jour && promise.mises_a_jour.length > 0) {
        const updates = promise.mises_a_jour.map(update => `
            <div class="update-item">
                <span class="update-date"><i class="fas fa-calendar-alt"></i> ${update.date}</span>
                <span class="update-text">${update.text}</span>
            </div>
        `).join('');
        
        updatesHTML = `
            <button class="details-btn" onclick="toggleUpdates('${promise.id}')" aria-expanded="false">
                <i class="fas fa-history
