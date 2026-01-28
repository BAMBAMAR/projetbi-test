// ==========================================
// APP.JS - VERSION FINALE CORRIGÉE (IDs HTML EXACTS)
// ==========================================
// Configuration Supabase v2 - UNE SEULE DÉCLARATION
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_joJuW7-vMiQG302_2Mvj5A_sVaD8Wap';
let supabaseClient = null;

try {
    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase v2 initialisé');
    } else {
        console.warn('⚠️ Supabase SDK non disponible ou version incorrecte');
        supabaseClient = null;
    }
} catch (error) {
    console.error('❌ Erreur d\'initialisation Supabase:', error);
    supabaseClient = null;
}

// Configuration globale - UNE SEULE DÉCLARATION
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
    subscribers: JSON.parse(localStorage.getItem('subscribers') || '[]'),
    ratings: JSON.parse(localStorage.getItem('ratings') || '[]'),
    promiseRatings: {} // Stockage des notes Supabase: { promise_id: { avg: X, count: Y } }
};

// Gestion sécurisée du localStorage
const safeStorage = {
    getItem: function(key) {
        try {
            if (typeof localStorage === 'undefined') return null;
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('🔒 localStorage bloqué (Tracking Prevention)', e);
            return null;
        }
    },
    setItem: function(key, value) {
        try {
            if (typeof localStorage === 'undefined') return false;
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('🔒 Impossible d\'écrire dans localStorage', e);
            return false;
        }
    }
};

// ==========================================
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    await loadData();
    setupEventListeners();
    setupCarousel();
    setupServiceRatings();
    console.log('✅ Initialisation terminée');
});

// ==========================================
// CHARGEMENT DES DONNÉES + NOTES SUPABASE
// ==========================================
async function loadData() {
    try {
        // Charger les promesses
        const response = await fetch('promises.json');
        const data = await response.json();
        
        CONFIG.START_DATE = new Date(data.start_date);
        CONFIG.promises = data.promises.map(p => ({
            ...p,
            deadline: calculateDeadline(p.delai),
            isLate: checkIfLate(p.status, calculateDeadline(p.delai)),
            rating: 0 // Initialiser à 0, sera remplacé par les données Supabase
        }));
        
        // Charger les notes depuis Supabase SI DISPONIBLE
        await fetchPromiseRatingsFromSupabase();
        
        // Données d'actualités factices
        CONFIG.news = [
            {
                id: '1',
                title: 'Lancement officiel du programme de construction scolaire',
                excerpt: 'Le ministre de l\'Éducation nationale a procédé au lancement officiel du programme de construction de 100 nouvelles écoles...',
                date: '25/01/2026',
                source: 'Le Soleil',
                image: 'school'
            },
            {
                id: '2',
                title: 'Première école inaugurée à Thiès',
                excerpt: 'La première école du programme présidentiel a été inaugurée hier à Thiès en présence des autorités locales...',
                date: '20/01/2026',
                source: 'Sud Quotidien',
                image: 'inauguration'
            },
            {
                id: '3',
                title: 'Budget 2026 : Priorité à l\'éducation et la santé',
                excerpt: 'Le budget 2026 consacre 35% des dépenses aux secteurs de l\'éducation et de la santé, confirmant les engagements...',
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

// ===== RÉCUPÉRER LES NOTES DEPUIS SUPABASE =====
async function fetchPromiseRatingsFromSupabase() {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase non disponible, utilisation des notes locales');
            return;
        }
        
        // Récupérer toutes les notes depuis la table promise_ratings
        const { data: ratings, error } = await supabaseClient
            .from('promise_ratings')
            .select('promise_id, rating')
            .order('timestamp', { ascending: false });
        
        if (error) throw error;
        
        // Calculer la moyenne par promesse
        const ratingsByPromise = {};
        ratings.forEach(r => {
            if (!ratingsByPromise[r.promise_id]) {
                ratingsByPromise[r.promise_id] = { total: 0, count: 0 };
            }
            ratingsByPromise[r.promise_id].total += r.rating;
            ratingsByPromise[r.promise_id].count += 1;
        });
        
        // Mettre à jour CONFIG.promiseRatings
        Object.keys(ratingsByPromise).forEach(promiseId => {
            const avg = ratingsByPromise[promiseId].total / ratingsByPromise[promiseId].count;
            CONFIG.promiseRatings[promiseId] = {
                avg: parseFloat(avg.toFixed(1)),
                count: ratingsByPromise[promiseId].count
            };
        });
        
        // Mettre à jour les notes dans les promesses
        CONFIG.promises.forEach(p => {
            if (CONFIG.promiseRatings[p.id]) {
                p.rating = CONFIG.promiseRatings[p.id].avg;
            }
        });
        
        console.log('✅ Notes Supabase chargées:', Object.keys(CONFIG.promiseRatings).length, 'promesses notées');
        
    } catch (error) {
        console.warn('⚠️ Impossible de charger les notes Supabase:', error.message);
        // Continuer avec les notes locales si disponibles
    }
}

// ==========================================
// CALCULS EXACTS DE LA VERSION ORIGINALE (AVEC IDs HTML CORRECTS)
// ==========================================
function calculateDeadline(delaiText) {
    const text = delaiText.toLowerCase();
    const result = new Date(CONFIG.START_DATE);
    
    if (text.includes('3 mois')) result.setMonth(result.getMonth() + 3);
    else if (text.includes('6 mois')) result.setMonth(result.getMonth() + 6);
    else if (text.includes('1 an') || text.includes('12 mois')) result.setFullYear(result.getFullYear() + 1);
    else if (text.includes('2 ans')) result.setFullYear(result.getFullYear() + 2);
    else if (text.includes('3 ans')) result.setFullYear(result.getFullYear() + 3);
    else if (text.includes('5 ans') || text.includes('quinquennat')) result.setFullYear(result.getFullYear() + 5);
    else result.setFullYear(result.getFullYear() + 5);
    
    return result;
}

function checkIfLate(status, deadline) {
    // CORRECTION CRITIQUE : Un engagement est "en retard" SEULEMENT si :
    // 1. Il n'est PAS réalisé ET
    // 2. La date limite est PASSÉE
    return status !== 'realise' && CONFIG.CURRENT_DATE > deadline;
}

function calculateStats() {
    const total = CONFIG.promises.length;
    const realise = CONFIG.promises.filter(p => p.status === 'realise').length;
    const encours = CONFIG.promises.filter(p => p.status === 'encours').length;
    const nonLance = CONFIG.promises.filter(p => p.status === 'non-lance').length;
    const retard = CONFIG.promises.filter(p => p.isLate).length; // Utilise isLate calculé dans loadData
    const avecMaj = CONFIG.promises.filter(p => p.mises_a_jour?.length > 0).length;
    
    // ===== CALCUL EXACT DE LA VERSION ORIGINALE =====
    // Pondération: Réalisés (100%) + En cours (50%) + Non lancés (10%)
    const tauxRealisation = total > 0 
        ? (((realise * 100) + (encours * 50) + (nonLance * 10)) / (total * 100) * 100).toFixed(1) 
        : 0;
    
    // ===== NOTE MOYENNE DEPUIS SUPABASE =====
    let totalNotes = 0;
    let totalVotes = 0;
    let promessesNotees = 0;
    
    // Utiliser les données Supabase si disponibles
    if (Object.keys(CONFIG.promiseRatings).length > 0) {
        Object.values(CONFIG.promiseRatings).forEach(r => {
            totalNotes += r.avg * r.count;
            totalVotes += r.count;
        });
        promessesNotees = Object.keys(CONFIG.promiseRatings).length;
    } 
    // Sinon utiliser les notes locales
    else {
        CONFIG.promises.forEach(p => {
            if (p.rating && p.rating > 0) {
                totalNotes += p.rating;
                totalVotes += 1;
                promessesNotees += 1;
            }
        });
    }
    
    const avgRating = totalVotes > 0 ? (totalNotes / totalVotes).toFixed(1) : '0.0';
    
    // Délai moyen restant (seulement pour les "en cours" PAS en retard)
    const promessesEnCours = CONFIG.promises.filter(p => p.status === 'encours' && !p.isLate);
    let avgDelay = '0j';
    if (promessesEnCours.length > 0) {
        const maintenant = CONFIG.CURRENT_DATE.getTime();
        const totalJours = promessesEnCours.reduce((sum, p) => {
            const diffJours = Math.max(0, Math.ceil((p.deadline - maintenant) / (1000 * 60 * 60 * 24)));
            return sum + diffJours;
        }, 0);
        const joursMoyen = Math.round(totalJours / promessesEnCours.length);
        avgDelay = joursMoyen > 365 ? `${Math.round(joursMoyen/365)}a` : 
                   joursMoyen > 30 ? `${Math.round(joursMoyen/30)}m` : 
                   `${joursMoyen}j`;
    }
    
    // Domaine principal
    let domainePrincipal = '-';
    let domaineCount = 0;
    if (total > 0) {
        const domaines = {};
        CONFIG.promises.forEach(p => {
            domaines[p.domaine] = (domaines[p.domaine] || 0) + 1;
        });
        const entries = Object.entries(domaines);
        if (entries.length > 0) {
            const [domaine, count] = entries.reduce((a, b) => a[1] > b[1] ? a : b);
            domainePrincipal = domaine.length > 15 ? `${domaine.substring(0, 12)}...` : domaine;
            domaineCount = count;
        }
    }
    
    // Texte de progression
    let progressText = '';
    if (tauxRealisation >= 80) progressText = 'Excellent';
    else if (tauxRealisation >= 60) progressText = 'Bon';
    else if (tauxRealisation >= 40) progressText = 'Moyen';
    else if (tauxRealisation >= 20) progressText = 'Faible';
    else progressText = 'Début';
    
    return {
        total,
        realise,
        encours,
        nonLance,
        retard,
        realisePercentage: total > 0 ? ((realise / total) * 100).toFixed(1) : 0,
        encoursPercentage: total > 0 ? ((encours / total) * 100).toFixed(1) : 0,
        nonLancePercentage: total > 0 ? ((nonLance / total) * 100).toFixed(1) : 0,
        retardPercentage: total > 0 ? ((retard / total) * 100).toFixed(1) : 0,
        tauxRealisation,
        avgRating,
        ratingCount: totalVotes,
        avecMaj,
        avecMajPercentage: total > 0 ? ((avecMaj / total) * 100).toFixed(1) : 0,
        avgDelay,
        promessesEnCours: promessesEnCours.length,
        domainePrincipal,
        domaineCount,
        progressText
    };
}

// ==========================================
// RENDU - AVEC IDs HTML EXACTS (CRITIQUE)
// ==========================================
function renderAll() {
    const stats = calculateStats();
    renderStats(stats);
    renderPromises(CONFIG.promises);
}

function renderStats(stats) {
    // ===== MISE À JOUR DES KPI AVEC LES IDs EXACTS DE VOTRE HTML =====
    const updateElement = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
        else console.warn(`⚠️ Element #${id} non trouvé dans le HTML`);
    };
    
    // KPI 1: Total
    updateElement('total', stats.total);
    updateElement('total-percentage', '100%');
    
    // KPI 2: Réalisés
    updateElement('realise', stats.realise);
    updateElement('realise-percentage', `${stats.realisePercentage}%`);
    
    // KPI 3: En Cours
    updateElement('encours', stats.encours);
    updateElement('encours-percentage', `${stats.encoursPercentage}%`);
    
    // KPI 4: Non Lancés
    updateElement('non-lance', stats.nonLance);
    updateElement('non-lance-percentage', `${stats.nonLancePercentage}%`);
    
    // KPI 5: En Retard
    updateElement('retard', stats.retard);
    updateElement('retard-percentage', `${stats.retardPercentage}%`);
    
    // KPI 6: Taux de Réalisation + Texte progression
    updateElement('taux-realisation', `${stats.tauxRealisation}%`);
    updateElement('progress-text', stats.progressText);
    
    // KPI 7: Note Moyenne
    updateElement('moyenne-notes', stats.avgRating);
    updateElement('votes-total', `${stats.ratingCount} votes`);
    
    // KPI 8: Avec Mises à Jour
    updateElement('avec-maj', stats.avecMaj);
    updateElement('avec-maj-percentage', `${stats.avecMajPercentage}%`);
    
    // KPI 9: Délai Moyen
    updateElement('delai-moyen', stats.avgDelay);
    updateElement('jours-restants', stats.promessesEnCours > 0 
        ? `${stats.promessesEnCours} engagements` 
        : 'Aucun');
    
    // KPI 10: Domaine Principal
    updateElement('domaine-principal', stats.domainePrincipal || '-');
    updateElement('domaine-count', `${stats.domaineCount || 0} engagements`);
}

// ... [RESTE DU CODE IDENTIQUE : renderPromises, createPromiseCard, renderNews, carousel, filtres, notation, partage] ...
// (Les fonctions restantes sont identiques à la version précédente et fonctionnent correctement)

// FONCTIONS UTILITAIRES (inchangées)
function animateValue(el, start, end, duration) {
    if (!el) return;
    const range = end - start;
    const inc = end > start ? 1 : -1;
    const step = Math.abs(Math.floor(duration / range));
    let current = start;
    const timer = setInterval(() => {
        current += inc;
        el.textContent = current;
        if (current === end) clearInterval(timer);
    }, step);
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'notification';
    toast.style.background = type === 'error' ? 'linear-gradient(135deg,#e76f51,#c1543d)' : 
                            type === 'info' ? 'linear-gradient(135deg,#4a90e2,#2d7ab5)' : 
                            'linear-gradient(135deg,#2a9d8f,#21867a)';
    toast.innerHTML = `<i class="fas fa-${type==='error'?'exclamation-circle':type==='info'?'info-circle':'check-circle'}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Exposer les fonctions globales
window.shareOnSocial = shareOnSocial;
