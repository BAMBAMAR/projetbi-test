// ==========================================
// RENDER.JS - Fonctions de rendu
// ==========================================

// ── Sécurité : échappement XSS ──
function escH(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
}
function escId(str) {
    if (!str) return '';
    return String(str).replace(/[^a-zA-Z0-9_\-]/g, '');
}

function renderStats() {
    const promises = CONFIG.promises;
    const total = promises.length;
    const realise = promises.filter(p => p.status === 'realise').length;
    const encours = promises.filter(p => p.status === 'encours').length;
    const retard = promises.filter(p => p.isLate).length;
    
    document.getElementById('total-promises').textContent = total;
    document.getElementById('realized').textContent = realise;
    document.getElementById('inProgress').textContent = encours;
    document.getElementById('delayed').textContent = retard;
}

function renderFilters() {
    const domainFilter = document.getElementById('sectorFilter');
    if (!domainFilter) return;
    
    while (domainFilter.options.length > 1) {
        domainFilter.remove(1);
    }
    
    const domains = [...new Set(CONFIG.promises.map(p => p.domaine))].sort();
    
    domains.forEach(domain => {
        const option = document.createElement('option');
        option.value = domain;
        option.textContent = domain;
        domainFilter.appendChild(option);
    });
}

function renderPromises(promises) {
    const container = document.getElementById('promisesContainer');
    if (!container) return;
    
    if (promises.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-search fa-3x" style="color: var(--text-secondary);"></i>
                <h3 style="margin: 1rem 0; color: var(--text-primary);">Aucun résultat trouvé</h3>
                <p style="color: var(--text-secondary);">Essayez de modifier vos critères de recherche</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = promises.map(p => createPromiseCard(p)).join('');
}

function createPromiseCard(promise) {
    const statusClass = promise.status === 'realise' ? 'status-realise' :
        promise.status === 'encours' ? 'status-encours' : 'status-nonlance';
    
    const statusText = promise.status === 'realise' ? '✅ Réalisé' :
        promise.status === 'encours' ? '🔄 En cours' : '⏳ Non lancé';
    
    const progress = promise.status === 'realise' ? 100 :
        promise.status === 'encours' ? 50 : 10;

    // FIX: All data fields escaped before DOM insertion
    const safeId       = escId(promise.id);
    const safeDomaine  = escH(promise.domaine);
    const safeTitle    = escH(promise.engagement);
    const safeResultat = escH(promise.resultat);
    const safeDelai    = escH(promise.delai);
    
    return `
        <div class="promise-card" data-id="${safeId}">
            <span class="domain-badge">${safeDomaine}</span>
            <h3 class="promise-title">${safeTitle}</h3>
            
            <div class="result-box">
                <i class="fas fa-bullseye"></i>
                <strong>Résultat attendu :</strong> ${safeResultat}
            </div>
            
            <div class="promise-meta">
                <div class="status-badge ${statusClass}">${statusText}</div>
                <div class="delay-badge">
                    <i class="fas fa-clock"></i>
                    ${safeDelai}
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
                <button class="details-btn" onclick="toggleDetails('${safeId}')">
                    <i class="fas fa-history"></i>
                    Voir les mises à jour (${promise.mises_a_jour.length})
                </button>
            ` : ''}
        </div>
    `;
}

// Exporter les fonctions
window.renderStats = renderStats;
window.renderFilters = renderFilters;
window.renderPromises = renderPromises;
window.createPromiseCard = createPromiseCard;