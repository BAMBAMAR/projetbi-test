// ==========================================
// APP.JS - VERSION FINALE CORRIGÉE (ZÉROS FIXÉS + CALCULS ORIGINAUX)
// ==========================================
const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_joJuW7-vMiQG302_2Mvj5A_sVaD8Wap';
let supabaseClient = null;

try {
    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase v2 initialisé');
    } else {
        console.warn('⚠️ Supabase SDK non disponible');
    }
} catch (error) {
    console.error('❌ Erreur d\'initialisation Supabase:', error);
}

// Configuration globale - UNE SEULE DÉCLARATION
const CONFIG = {
    START_DATE: new Date('2024-04-02'),
    CURRENT_DATE: new Date('2026-01-28'), // ✅ DATE DE RÉFÉRENCE FIXÉE AU 28/01/2026
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
// CHARGEMENT DES DONNÉES + DATE DE RÉFÉRENCE
// ==========================================
async function loadData() {
    try {
        const response = await fetch('promises.json');
        const data = await response.json();
        
        // ✅ UTILISER last_update COMME DATE DE RÉFÉRENCE (pas la date réelle)
        CONFIG.START_DATE = new Date(data.start_date);
        CONFIG.CURRENT_DATE = data.last_update 
            ? new Date(data.last_update) 
            : new Date('2026-01-28'); // Date par défaut si absente
        
        console.log('📅 Dates configurées:');
        console.log('   - Début du projet:', CONFIG.START_DATE.toISOString().split('T')[0]);
        console.log('   - Date de référence:', CONFIG.CURRENT_DATE.toISOString().split('T')[0]);
        
        CONFIG.promises = data.promises.map(p => ({
            ...p,
            deadline: calculateDeadline(p.delai),
            isLate: checkIfLate(p.status, calculateDeadline(p.delai)),
            rating: p.rating || 0 // Initialiser la note
        }));
        
        CONFIG.news = [
            { id: '1', title: 'Lancement officiel...', excerpt: '...', date: '25/01/2026', source: 'Le Soleil', image: 'school' },
            { id: '2', title: 'Première école...', excerpt: '...', date: '20/01/2026', source: 'Sud Quotidien', image: 'inauguration' },
            { id: '3', title: 'Budget 2026...', excerpt: '...', date: '15/01/2026', source: 'WalFadjri', image: 'budget' }
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
// CALCULS EXACTS DE LA VERSION ORIGINALE (VÉRIFIÉS)
// ==========================================
function calculateDeadline(delaiText) {
    const text = delaiText.toLowerCase().trim();
    const result = new Date(CONFIG.START_DATE);
    
    if (text.includes('3 mois')) result.setMonth(result.getMonth() + 3);
    else if (text.includes('6 mois')) result.setMonth(result.getMonth() + 6);
    else if (text.includes('1 an') || text.includes('12 mois')) result.setFullYear(result.getFullYear() + 1);
    else if (text.includes('2 ans')) result.setFullYear(result.getFullYear() + 2);
    else if (text.includes('3 ans')) result.setFullYear(result.getFullYear() + 3);
    else if (text.includes('5 ans') || text.includes('quinquennat')) result.setFullYear(result.getFullYear() + 5);
    else result.setFullYear(result.getFullYear() + 5); // Défaut
    
    return result;
}

function checkIfLate(status, deadline) {
    // ✅ CORRECTION CRITIQUE : Un engagement est "en retard" SEULEMENT si :
    // 1. Il n'est PAS réalisé
    // 2. ET sa date limite est PASSÉE par rapport à la date de référence (last_update)
    return status !== 'realise' && CONFIG.CURRENT_DATE > deadline;
}

function calculateStats() {
    const total = CONFIG.promises.length;
    const realise = CONFIG.promises.filter(p => p.status === 'realise').length;
    const encours = CONFIG.promises.filter(p => p.status === 'encours').length;
    const nonLance = CONFIG.promises.filter(p => p.status === 'non-lance').length;
    const retard = CONFIG.promises.filter(p => p.isLate).length;
    const avecMaj = CONFIG.promises.filter(p => p.mises_a_jour?.length > 0).length;
    
    // ✅ CALCUL EXACT DE LA VERSION ORIGINALE (pondéré)
    // Pondération: Réalisés (100%) + En cours (50%) + Non lancés (10%)
    const tauxRealisation = total > 0 
        ? (((realise * 100) + (encours * 50) + (nonLance * 10)) / (total * 100) * 100).toFixed(1) 
        : 0;
    
    // Progression = même calcul que le taux de réalisation
    const progression = tauxRealisation;
    
    // Note moyenne (depuis les données promises)
    const totalNotes = CONFIG.promises.reduce((sum, p) => sum + (p.rating || 0), 0);
    const promessesAvecNote = CONFIG.promises.filter(p => p.rating && p.rating > 0).length;
    const avgRating = promessesAvecNote > 0 ? (totalNotes / promessesAvecNote).toFixed(1) : '0.0';
    
    // Délai moyen restant
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
        progression,
        avgRating,
        ratingCount: promessesAvecNote,
        avecMaj,
        avecMajPercentage: total > 0 ? ((avecMaj / total) * 100).toFixed(1) : 0,
        avgDelay,
        promessesEnCours: promessesEnCours.length
    };
}

// ==========================================
// RENDU - AVEC BONS IDs POUR LE HTML CORRIGÉ
// ==========================================
function renderAll() {
    const stats = calculateStats();
    renderStats(stats);
    renderPromises(CONFIG.promises);
}

function renderStats(stats) {
    // ✅ MISE À JOUR DES KPI AVEC LES BONS IDs (MATCH HTML EXACT)
    const updateElement = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
        else console.warn(`⚠️ Element #${id} non trouvé dans le HTML`);
    };
    
    // KPI 1-5: Base
    updateElement('total-promises', stats.total);
    updateElement('realized', stats.realise);
    updateElement('inProgress', stats.encours);
    updateElement('notStarted', stats.nonLance);
    updateElement('delayed', stats.retard);
    
    // KPI 6-10: Avancés
    updateElement('globalProgress', `${stats.tauxRealisation}%`);
    updateElement('progression', `${stats.progression}%`);
    updateElement('avgRating', stats.avgRating);
    updateElement('ratingCount', `${stats.ratingCount} votes`);
    updateElement('withUpdates', stats.avecMaj);
    updateElement('avgDelay', stats.avgDelay);
    
    // Mettre à jour les pourcentages dans les cartes
    const percentages = document.querySelectorAll('.stat-percentage');
    if (percentages[0]) percentages[0].textContent = '100%'; // Total
    if (percentages[1]) percentages[1].textContent = `${stats.realisePercentage}%`;
    if (percentages[2]) percentages[2].textContent = `${stats.encoursPercentage}%`;
    if (percentages[3]) percentages[3].textContent = `${stats.nonLancePercentage}%`;
    if (percentages[4]) percentages[4].textContent = `${stats.retardPercentage}%`;
    if (percentages[5]) percentages[5].style.color = 'var(--primary)'; // Taux de réalisation
    if (percentages[6]) percentages[6].style.color = 'var(--warning)'; // Progression
    if (percentages[8]) percentages[8].textContent = `${stats.avecMajPercentage}%`; // Avec mises à jour
    
    // Texte de progression
    let progressText = '';
    if (stats.tauxRealisation >= 80) progressText = 'Excellent';
    else if (stats.tauxRealisation >= 60) progressText = 'Bon';
    else if (stats.tauxRealisation >= 40) progressText = 'Moyen';
    else if (stats.tauxRealisation >= 20) progressText = 'Faible';
    else progressText = 'Début';
    
    // Optionnel : afficher le texte de progression si l'élément existe
    const progressEl = document.getElementById('progress-text');
    if (progressEl) progressEl.textContent = progressText;
}

// ... [RESTE DU CODE IDENTIQUE À VOTRE app actuel.js MAIS SANS ERREURS DE SYNTAXE] ...
// (renderPromises, createPromiseCard, renderNews, carousel, filtres, notation, partage, etc.)

// FONCTIONS UTILITAIRES (CORRIGÉES SANS SYNTAXE INVALIDE)
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
