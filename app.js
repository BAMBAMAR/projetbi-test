// ========================================
// CONFIGURATION ET VARIABLES GLOBALES
// ========================================
const CONFIG = {
    supabaseUrl: 'https://jwsdxttjjbfnoufiidkd.supabase.co',
    supabaseKey: 'sb_publishable_joJuW7-vMiQG302_2Mvj5A_sVaD8Wap',
    apiUrl: 'https://projetbi.org/api',
    maxPromisesPerPage: 12,
    carouselAutoPlay: true,
    carouselInterval: 5000,
    kpiAutoPlay: true,
    kpiInterval: 3000
};

// État global de l'application
let appState = {
    promises: [],
    filteredPromises: [],
    currentPage: 1,
    isLoading: false,
    filters: {
        status: '',
        domain: '',
        search: ''
    },
    pressData: [],
    pressIndex: 0,
    pressZoom: 100,
    carouselIndex: 0,
    kpiIndex: 0,
    news: [],
    newspapers: [],
    ratings: {
        votes: 0,
        services: 0,
        average: 0.0,
        recent: [],
        top: []
    },
    scrollPosition: 0
};

// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadAllData();
});

function initializeApp() {
    // Initialiser Supabase
    if (typeof supabase !== 'undefined') {
        window.supabaseClient = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    }
    
    // Initialiser les étoiles de notation
    initializeStarRatings();
    
    // Initialiser le menu mobile
    setupMobileMenu();
    
    // Initialiser le scroll indicator
    setupScrollIndicator();
    
    // Initialiser le compte à rebours
    startCountdown();
}

function setupEventListeners() {
    // Filtres
    document.getElementById('filterToggleBtn')?.addEventListener('click', toggleFilters);
    document.getElementById('filter-status')?.addEventListener('change', applyFilters);
    document.getElementById('filter-domain')?.addEventListener('change', applyFilters);
    document.getElementById('filter-search')?.addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
    
    // Pagination
    document.getElementById('showMoreBtn')?.addEventListener('click', loadMorePromises);
    document.getElementById('showLessBtn')?.addEventListener('click', showLessPromises);
    
    // Menu mobile
    document.getElementById('modernHamburger')?.addEventListener('click', toggleMobileMenu);
    
    // Carousel Press
    document.getElementById('prevBtn')?.addEventListener('click', () => changePressSlide(-1));
    document.getElementById('nextBtn')?.addEventListener('click', () => changePressSlide(1));
    document.getElementById('autoPlayToggle')?.addEventListener('click', toggleAutoPlay);
    
    // Carousel Promesses
    document.getElementById('carouselPrevBtn')?.addEventListener('click', () => changeCarouselSlide(-1));
    document.getElementById('carouselNextBtn')?.addEventListener('click', () => changeCarouselSlide(1));
    document.getElementById('carouselAutoPlayToggle')?.addEventListener('click', toggleCarouselAutoPlay);
    
    // KPI Carousel
    document.getElementById('kpiPrev')?.addEventListener('click', () => changeKpiSlide(-1));
    document.getElementById('kpiNext')?.addEventListener('click', () => changeKpiSlide(1));
    document.getElementById('kpiAutoPlayToggle')?.addEventListener('click', toggleKpiAutoPlay);
    
    // Formulaire de notation
    document.getElementById('ratingForm')?.addEventListener('submit', handleRatingSubmit);
    document.getElementById('service-category')?.addEventListener('change', updateServiceOptions);
    
    // Scroll to top
    document.querySelector('.scroll-to-top')?.addEventListener('click', scrollToTop);
    
    // Navigation
    document.querySelectorAll('.modern-link').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('modernMenu')?.classList.remove('active');
            document.getElementById('modernHamburger')?.classList.remove('active');
        });
    });
    
    // Fermer menu mobile en cliquant ailleurs
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('modernMenu');
        const hamburger = document.getElementById('modernHamburger');
        if (menu?.classList.contains('active') && 
            !menu.contains(e.target) && 
            !hamburger.contains(e.target)) {
            menu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================
async function loadAllData() {
    try {
        await Promise.all([
            loadPromises(),
            loadNews(),
            loadPress(),
            loadNewspapers(),
            loadRatingsData(),
            loadDailyPromise()
        ]);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

async function loadPromises() {
    if (appState.isLoading) return;
    
    appState.isLoading = true;
    showLoadingState('promisesGrid', 'Chargement des engagements...');
    
    try {
        // Charger depuis promises.json
        const response = await fetch('promises.json');
        const data = await response.json();
        
        appState.promises = data.promises || [];
        appState.filteredPromises = [...appState.promises];
        
        // Charger les domaines uniques pour le filtre
        loadUniqueDomains();
        
        // Afficher les promesses
        displayPromises();
        
        // Mettre à jour les statistiques
        updateStats();
        
        // Charger le carousel
        loadPromisesCarousel();
        
    } catch (error) {
        console.error('Erreur lors du chargement des promesses:', error);
        showErrorState('promisesGrid', 'Impossible de charger les engagements');
    } finally {
        appState.isLoading = false;
    }
}

async function loadNews() {
    try {
        // Charger depuis news.json
        const response = await fetch('news.json');
        const data = await response.json();
        
        appState.news = data.news || [];
        displayNews();
        
    } catch (error) {
        console.error('Erreur lors du chargement des actualités:', error);
    }
}

async function loadPress() {
    try {
        // Charger depuis press.json
        const response = await fetch('press.json');
        const data = await response.json();
        
        appState.pressData = data.press || [];
        setupPressCarousel();
        
    } catch (error) {
        console.error('Erreur lors du chargement de la presse:', error);
    }
}

async function loadNewspapers() {
    try {
        // Charger depuis newspapers.json ou press.json
        const response = await fetch('press.json');
        const data = await response.json();
        
        appState.newspapers = data.press || [];
        displayNewspapers();
        
    } catch (error) {
        console.error('Erreur lors du chargement des journaux:', error);
    }
}

async function loadRatingsData() {
    try {
        // Charger depuis localStorage ou API
        const ratings = JSON.parse(localStorage.getItem('service_ratings') || '[]');
        appState.ratings = {
            votes: ratings.length,
            services: [...new Set(ratings.map(r => r.service))].length,
            average: ratings.length > 0 ? 
                (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length).toFixed(1) : 0.0,
            recent: ratings.slice(0, 5),
            top: calculateTopServices(ratings)
        };
        
        displayRatingsData();
        
    } catch (error) {
        console.error('Erreur lors du chargement des notations:', error);
    }
}

async function loadDailyPromise() {
    try {
        const today = new Date().getDate();
        const promise = appState.promises[today % appState.promises.length];
        
        if (promise) {
            displayDailyPromise(promise);
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement de la promesse du jour:', error);
    }
}

// ========================================
// AFFICHAGE DES ACTUALITÉS AMÉLIORÉES
// ========================================
function displayNews() {
    const grid = document.getElementById('newsGrid');
    if (!grid || !appState.news.length) return;
    
    grid.innerHTML = appState.news.map(news => createNewsCard(news)).join('');
    
    // Attacher les événements
    attachNewsEvents();
}

function createNewsCard(news) {
    return `
        <div class="news-card" data-id="${news.id}">
            ${news.image ? `
                <div class="news-image-container">
                    <img src="${escapeHtml(news.image)}" alt="${escapeHtml(news.title)}" class="news-image">
                </div>
            ` : ''}
            <div class="news-content">
                <div class="news-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(news.date)}</span>
                    <span class="news-category">${news.category || 'Actualité'}</span>
                </div>
                <h3>${escapeHtml(news.title)}</h3>
                <p class="news-excerpt">${escapeHtml(news.excerpt || truncateText(news.content, 100))}</p>
                <div class="news-footer">
                    <span><i class="fas fa-newspaper"></i> ${news.source || 'Source'}</span>
                    <button class="btn-read-more" data-id="${news.id}">
                        <i class="fas fa-book-open"></i> Lire l'article
                    </button>
                </div>
            </div>
        </div>
    `;
}

function attachNewsEvents() {
    document.querySelectorAll('.btn-read-more').forEach(btn => {
        btn.addEventListener('click', function() {
            const newsId = this.dataset.id;
            const news = appState.news.find(n => n.id === newsId);
            if (news) showNewsDetail(news);
        });
    });
}

function showNewsDetail(news) {
    const modal = document.createElement('div');
    modal.className = 'news-detail-modal';
    modal.innerHTML = `
        <div class="news-detail-content">
            <div class="news-detail-header">
                <h2>${escapeHtml(news.title)}</h2>
                <button class="close-news-modal" onclick="closeNewsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="news-detail-body">
                <div class="news-detail-meta">
                    <div class="news-detail-date">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(news.date)}</span>
                    </div>
                    <div class="news-detail-source">
                        <i class="fas fa-newspaper"></i>
                        <span>${news.source || 'Source non spécifiée'}</span>
                    </div>
                    <div class="news-detail-category">
                        <i class="fas fa-tag"></i>
                        <span>${news.category || 'Actualité'}</span>
                    </div>
                </div>
                
                ${news.image ? `
                    <div class="news-detail-image">
                        <img src="${escapeHtml(news.image)}" alt="${escapeHtml(news.title)}">
                    </div>
                ` : ''}
                
                <div class="news-detail-content-text">
                    ${news.content ? formatContent(news.content) : ''}
                </div>
                
                ${news.link ? `
                    <div class="news-detail-link">
                        <a href="${escapeHtml(news.link)}" target="_blank" class="btn-external-link">
                            <i class="fas fa-external-link-alt"></i> Lire l'article original
                        </a>
                    </div>
                ` : ''}
            </div>
            <div class="news-detail-footer">
                <button class="btn-share-news" onclick="shareNews('${news.id}')">
                    <i class="fas fa-share-alt"></i> Partager
                </button>
                <button class="btn-close-news" onclick="closeNewsModal()">
                    <i class="fas fa-times"></i> Fermer
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
}

function closeNewsModal() {
    const modal = document.querySelector('.news-detail-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// ========================================
// PARTAGE ENRICHI DES ACTUALITÉS
// ========================================
function shareNews(newsId) {
    const news = appState.news.find(n => n.id === newsId);
    if (!news) return;
    
    const shareText = createNewsShareText(news);
    
    // Utiliser l'API de partage native si disponible
    if (navigator.share) {
        navigator.share({
            title: news.title,
            text: shareText,
            url: window.location.href
        }).catch(error => {
            console.log('Partage annulé ou non pris en charge', error);
        });
    } else {
        // Fallback: copier dans le presse-papiers
        copyToClipboard(shareText);
        showNotification('Texte copié dans le presse-papiers !', 'success');
    }
}

function createNewsShareText(news) {
    return `📰 ${news.title}

📝 ${news.excerpt || truncateText(news.content, 150)}

📅 ${formatDate(news.date)}
📰 ${news.source || 'Source'}
🏷️ ${news.category || 'Actualité'}

Lire plus: ${window.location.href}

#Actualite #Senegal #ProjetSenegal`;
}

// ========================================
// PARTAGE ENRICHI DES PROMESSES
// ========================================
function sharePromise(promiseId, platform = 'copy') {
    const promise = appState.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const shareText = createPromiseShareText(promise);
    
    switch(platform) {
        case 'facebook':
            shareToFacebook(shareText, promise);
            break;
        case 'twitter':
            shareToTwitter(shareText, promise);
            break;
        case 'whatsapp':
            shareToWhatsApp(shareText, promise);
            break;
        case 'copy':
            copyToClipboard(shareText);
            showNotification('Texte copié !', 'success');
            break;
    }
}

function createPromiseShareText(promise) {
    return `🎯 ${promise.titre || promise.engagement}

📍 Domaine: ${promise.domaine || promise.domain || 'Non spécifié'}
📅 Délai: ${promise.delai_texte || promise.delai || 'Non spécifié'}
🔖 Statut: ${promise.status || 'Non spécifié'}
📝 Description: ${promise.description || promise.resultat || 'Aucune description'}

🔄 Dernière mise à jour: ${promise.updates && promise.updates.length > 0 ? formatDate(promise.updates[0].date) : 'Aucune'}

📊 Suivez tous les engagements sur: ${window.location.href}

#ProjetSenegal #Transparence #Redevabilite #Engagements`;
}

function shareToFacebook(text, promise) {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

function shareToTwitter(text, promise) {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
}

function shareToWhatsApp(text, promise) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Erreur copie:', err);
        // Fallback pour les anciens navigateurs
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

// ========================================
// PROMESSE DU JOUR - FORMAT JOURNAL
// ========================================
function displayDailyPromise(promise) {
    const container = document.getElementById('dailyPromise');
    if (!container || !promise) return;
    
    const hasUpdates = promise.updates && promise.updates.length > 0;
    
    container.innerHTML = `
        <div class="daily-newspaper-header">
            <div class="newspaper-badge">
                <i class="fas fa-newspaper"></i>
                LE PROJET SÉNÉGAL - PROMESSE DU JOUR
            </div>
            <div class="newspaper-date">
                <i class="fas fa-calendar"></i>
                ${formatDate(new Date())}
            </div>
        </div>
        
        <div class="daily-newspaper-article">
            <h2 class="article-title">${escapeHtml(promise.titre || promise.engagement)}</h2>
            
            <div class="article-meta">
                <div class="article-domain">
                    <i class="fas fa-building"></i>
                    ${promise.domaine || promise.domain || 'Domaine non spécifié'}
                </div>
                <span class="article-status ${getStatusClass(promise).replace('promise-card ', '')}">
                    <i class="${getStatusIcon(promise)}"></i>
                    ${promise.status || 'Non spécifié'}
                </span>
            </div>
            
            <div class="article-content">
                <p class="article-lead">
                    <i class="fas fa-quote-left"></i>
                    ${promise.description || promise.engagement || 'Aucune description disponible.'}
                </p>
                
                ${promise.resultat ? `
                    <div class="article-section">
                        <h3><i class="fas fa-check-circle"></i> Résultat Atteint</h3>
                        <p>${escapeHtml(promise.resultat)}</p>
                    </div>
                ` : ''}
                
                <div class="article-section">
                    <h3><i class="fas fa-calendar-check"></i> Informations Temporelles</h3>
                    <div class="deadline-grid">
                        <div class="deadline-item">
                            <span class="deadline-label">Date d'engagement</span>
                            <span class="deadline-value">${formatDate(promise.date_engagement || new Date())}</span>
                        </div>
                        <div class="deadline-item">
                            <span class="deadline-label">Délai prévu</span>
                            <span class="deadline-value">${promise.delai_texte || promise.delai || 'Non spécifié'}</span>
                        </div>
                        ${promise.date_realisation ? `
                            <div class="deadline-item">
                                <span class="deadline-label">Date de réalisation</span>
                                <span class="deadline-value">${formatDate(promise.date_realisation)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${hasUpdates ? `
                    <div class="article-section updates-section">
                        <h3><i class="fas fa-history"></i> Dernières Mises à Jour</h3>
                        ${promise.updates.slice(0, 3).map(update => `
                            <div class="update-item-small">
                                <div class="update-date-small">${formatDate(update.date)}</div>
                                <div class="update-text-small">${escapeHtml(update.texte || update.description || 'Mise à jour')}</div>
                            </div>
                        `).join('')}
                        ${promise.updates.length > 3 ? `
                            <div style="text-align: center; margin-top: 15px;">
                                <small style="color: var(--text-muted);">
                                    + ${promise.updates.length - 3} mise${promise.updates.length - 3 > 1 ? 's' : ''} à jour
                                </small>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
            
            <div class="article-footer">
                <button class="btn-article-secondary" onclick="sharePromise('${promise.id}', 'copy')">
                    <i class="fas fa-share-alt"></i> Partager
                </button>
                <button class="btn-article-primary" onclick="showPromiseDetail('${promise.id}')">
                    <i class="fas fa-eye"></i> Voir le détail
                </button>
            </div>
        </div>
    `;
}

function showPromiseDetail(promiseId) {
    const promise = appState.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    // Scroll vers la section des engagements
    const promisesSection = document.getElementById('promises');
    if (promisesSection) {
        const offset = 80;
        const targetPosition = promisesSection.offsetTop - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Mettre en évidence la carte
        setTimeout(() => {
            const card = document.querySelector(`.promise-card[data-id="${promiseId}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                card.style.boxShadow = '0 0 0 3px var(--primary)';
                setTimeout(() => { card.style.boxShadow = ''; }, 3000);
            }
        }, 500);
    }
}

// ========================================
// REVUE DE PRESSE CAROUSEL
// ========================================
function setupPressCarousel() {
    if (appState.pressData.length === 0) return;
    
    const carousel = document.getElementById('pressCarousel');
    const indicators = document.getElementById('carouselIndicators');
    
    // Créer les slides
    carousel.innerHTML = appState.pressData.map((item, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" id="pressImage">
        </div>
    `).join('');
    
    // Créer les indicateurs
    indicators.innerHTML = appState.pressData.map((_, index) => `
        <button class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
    `).join('');
    
    // Mettre à jour les infos
    updatePressInfo(0);
    
    // Attacher les événements
    attachPressEvents();
    
    // Démarrer l'autoplay
    if (CONFIG.carouselAutoPlay) {
        startPressAutoPlay();
    }
}

function attachPressEvents() {
    // Indicateurs
    document.querySelectorAll('.indicator').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            goToPressSlide(index);
        });
    });
    
    // Indicateurs journaux
    document.querySelectorAll('.newspaper-card').forEach(card => {
        card.addEventListener('click', () => {
            const index = parseInt(card.dataset.index);
            goToPressSlide(index);
        });
    });
}

function changePressSlide(direction) {
    const newIndex = (appState.pressIndex + direction + appState.pressData.length) % appState.pressData.length;
    goToPressSlide(newIndex);
}

function goToPressSlide(index) {
    appState.pressIndex = index;
    
    // Mettre à jour les slides
    document.querySelectorAll('.carousel-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    // Mettre à jour les indicateurs
    document.querySelectorAll('.indicator').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
    
    // Mettre à jour les infos
    updatePressInfo(index);
}

function updatePressInfo(index) {
    const item = appState.pressData[index];
    if (!item) return;
    
    document.getElementById('currentPressTitle').textContent = item.title;
    document.getElementById('currentPressDate').textContent = formatDate(item.date);
    document.getElementById('currentPressLink').href = item.link || '#';
}

function togglePressZoom(action) {
    const img = document.getElementById('pressImage');
    if (!img) return;
    
    let newZoom;
    switch(action) {
        case 'in':
            newZoom = Math.min(appState.pressZoom + 10, 200);
            break;
        case 'out':
            newZoom = Math.max(appState.pressZoom - 10, 50);
            break;
        case 'reset':
            newZoom = 100;
            break;
    }
    
    appState.pressZoom = newZoom;
    img.style.transform = `scale(${newZoom / 100})`;
    document.querySelector('.carousel-zoom-info').textContent = `${newZoom}%`;
}

let pressAutoPlayInterval;
function startPressAutoPlay() {
    pressAutoPlayInterval = setInterval(() => {
        changePressSlide(1);
    }, CONFIG.carouselInterval);
}

function stopPressAutoPlay() {
    clearInterval(pressAutoPlayInterval);
}

function toggleAutoPlay() {
    const btn = document.getElementById('autoPlayToggle');
    const isPlaying = btn.querySelector('i').classList.contains('fa-pause');
    
    if (isPlaying) {
        stopPressAutoPlay();
        btn.innerHTML = '<i class="fas fa-play"></i> Lecture';
    } else {
        startPressAutoPlay();
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
}

// ========================================
// CAROUSEL PROMESSES
// ========================================
function loadPromisesCarousel() {
    const grid = document.getElementById('promisesCarouselGrid');
    if (!grid) return;
    
    // Sélectionner 9 promesses aléatoires ou les plus récentes
    const carouselPromises = appState.promises
        .sort(() => 0.5 - Math.random())
        .slice(0, 9);
    
    grid.innerHTML = carouselPromises.map(promise => createCarouselPromiseCard(promise)).join('');
    
    // Créer les dots
    const dotsContainer = document.getElementById('carouselDots');
    if (dotsContainer) {
        const numDots = Math.ceil(carouselPromises.length / 3);
        dotsContainer.innerHTML = Array(numDots).fill(0).map((_, i) => `
            <button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>
        `).join('');
        
        // Attacher les événements
        document.querySelectorAll('.carousel-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.dataset.index);
                goToCarouselSlide(index);
            });
        });
    }
    
    // Démarrer l'autoplay
    if (CONFIG.carouselAutoPlay) {
        startCarouselAutoPlay();
    }
}

function createCarouselPromiseCard(promise) {
    const statusClass = getStatusClass(promise);
    
    return `
        <div class="carousel-promise-card ${statusClass}" data-id="${promise.id}" onclick="showPromiseDetail('${promise.id}')">
            <div class="promise-card-header">
                <h3 class="promise-card-title">${escapeHtml(truncateText(promise.titre || promise.engagement, 60))}</h3>
            </div>
            <div class="promise-card-meta">
                <span><i class="fas fa-building"></i> ${promise.domaine || promise.domain || 'Général'}</span>
                ${promise.publicCount ? `
                    <span class="promise-card-rating">
                        <i class="fas fa-star"></i> ${(promise.publicAvg || 0).toFixed(1)}
                    </span>
                ` : ''}
            </div>
        </div>
    `;
}

function changeCarouselSlide(direction) {
    const grid = document.getElementById('promisesCarouselGrid');
    const cards = grid.children;
    const numCards = cards.length;
    const cardsPerSlide = 3;
    const numSlides = Math.ceil(numCards / cardsPerSlide);
    
    let newIndex = (appState.carouselIndex + direction + numSlides) % numSlides;
    goToCarouselSlide(newIndex);
}

function goToCarouselSlide(index) {
    appState.carouselIndex = index;
    
    const grid = document.getElementById('promisesCarouselGrid');
    const cardsPerSlide = 3;
    const offset = -index * cardsPerSlide * 100;
    
    grid.style.transform = `translateX(${offset}%)`;
    
    // Mettre à jour les dots
    document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

let carouselAutoPlayInterval;
function startCarouselAutoPlay() {
    carouselAutoPlayInterval = setInterval(() => {
        changeCarouselSlide(1);
    }, CONFIG.carouselInterval);
}

function stopCarouselAutoPlay() {
    clearInterval(carouselAutoPlayInterval);
}

function toggleCarouselAutoPlay() {
    const btn = document.getElementById('carouselAutoPlayToggle');
    const isPlaying = btn.querySelector('i').classList.contains('fa-pause');
    
    if (isPlaying) {
        stopCarouselAutoPlay();
        btn.innerHTML = '<i class="fas fa-play"></i> Lecture';
    } else {
        startCarouselAutoPlay();
        btn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    }
}

// ========================================
// KPI CAROUSEL
// ========================================
const kpiItems = [
    { icon: 'fas fa-tasks', value: () => document.getElementById('total')?.textContent || '0', label: 'Engagements totaux' },
    { icon: 'fas fa-check-circle', value: () => document.getElementById('realise')?.textContent || '0', label: 'Réalisés' },
    { icon: 'fas fa-sync-alt', value: () => document.getElementById('encours')?.textContent || '0', label: 'En cours' },
    { icon: 'fas fa-clock', value: () => document.getElementById('non-lance')?.textContent || '0', label: 'Non lancés' },
    { icon: 'fas fa-exclamation-triangle', value: () => document.getElementById('retard')?.textContent || '0', label: 'En retard' },
    { icon: 'fas fa-percentage', value: () => document.getElementById('taux-realisation')?.textContent || '0%', label: 'Taux de réalisation' },
    { icon: 'fas fa-star', value: () => document.getElementById('moyenne-notes')?.textContent || '0.0', label: 'Note moyenne' },
    { icon: 'fas fa-history', value: () => document.getElementById('avec-maj')?.textContent || '0', label: 'Avec MAJ' }
];

function updateKpiCarousel() {
    const carousel = document.getElementById('kpiCarousel');
    if (!carousel) return;
    
    carousel.innerHTML = kpiItems.map(item => `
        <div class="kpi-item">
            <div class="kpi-icon">
                <i class="${item.icon}"></i>
            </div>
            <div class="kpi-content">
                <div class="kpi-value">${item.value()}</div>
                <div class="kpi-label">${item.label}</div>
            </div>
        </div>
    `).join('');
}

function changeKpiSlide(direction) {
    const carousel = document.getElementById('kpiCarousel');
    const items = carousel.children;
    const numItems = items.length;
    
    // Rotation simple
    if (direction > 0) {
        const first = items[0];
        carousel.appendChild(first);
    } else {
        const last = items[numItems - 1];
        carousel.insertBefore(last, items[0]);
    }
}

let kpiAutoPlayInterval;
function startKpiAutoPlay() {
    kpiAutoPlayInterval = setInterval(() => {
        changeKpiSlide(1);
    }, CONFIG.kpiInterval);
}

function stopKpiAutoPlay() {
    clearInterval(kpiAutoPlayInterval);
}

function toggleKpiAutoPlay() {
    const btn = document.getElementById('kpiAutoPlayToggle');
    const isPlaying = btn.querySelector('i').classList.contains('fa-play');
    
    if (isPlaying) {
        startKpiAutoPlay();
        btn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        stopKpiAutoPlay();
        btn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// ========================================
// STATISTIQUES
// ========================================
function updateStats() {
    const promises = appState.promises;
    if (promises.length === 0) return;
    
    const stats = {
        total: promises.length,
        realise: promises.filter(p => p.status === '✅ Réalisé').length,
        encours: promises.filter(p => p.status === '🔄 En cours').length,
        nonLance: promises.filter(p => p.status === '⏳ Non lancé').length,
        retard: promises.filter(p => p.status === '⚠️ En retard').length,
        avecMaj: promises.filter(p => p.updates && p.updates.length > 0).length
    };
    
    stats.tauxRealisation = stats.total > 0 ? Math.round((stats.realise / stats.total) * 100) : 0;
    
    // Mettre à jour les valeurs
    document.getElementById('total').textContent = formatNumber(stats.total);
    document.getElementById('realise').textContent = formatNumber(stats.realise);
    document.getElementById('encours').textContent = formatNumber(stats.encours);
    document.getElementById('non-lance').textContent = formatNumber(stats.nonLance);
    document.getElementById('retard').textContent = formatNumber(stats.retard);
    document.getElementById('avec-maj').textContent = formatNumber(stats.avecMaj);
    document.getElementById('taux-realisation').textContent = `${stats.tauxRealisation}%`;
    
    // Mettre à jour les pourcentages
    document.getElementById('total-percentage').textContent = '100%';
    document.getElementById('realise-percentage').textContent = `${stats.realise > 0 ? Math.round((stats.realise / stats.total) * 100) : 0}%`;
    document.getElementById('encours-percentage').textContent = `${stats.encours > 0 ? Math.round((stats.encours / stats.total) * 100) : 0}%`;
    document.getElementById('non-lance-percentage').textContent = `${stats.nonLance > 0 ? Math.round((stats.nonLance / stats.total) * 100) : 0}%`;
    document.getElementById('retard-percentage').textContent = `${stats.retard > 0 ? Math.round((stats.retard / stats.total) * 100) : 0}%`;
    document.getElementById('avec-maj-percentage').textContent = `${stats.avecMaj > 0 ? Math.round((stats.avecMaj / stats.total) * 100) : 0}%`;
    
    // Calculer le retard moyen (simulé)
    const delaiMoyen = promises
        .filter(p => p.delai && p.status !== '✅ Réalisé')
        .map(p => parseInt(p.delai) || 0)
        .reduce((a, b) => a + b, 0) / Math.max(stats.total - stats.realise, 1);
    document.getElementById('delai-moyen').textContent = `${Math.round(delaiMoyen)}j`;
    
    // Domaine principal
    const domaines = promises.map(p => p.domaine || p.domain).filter(d => d);
    const domaineCounts = domaines.reduce((acc, domaine) => {
        acc[domaine] = (acc[domaine] || 0) + 1;
        return acc;
    }, {});
    
    const domainePrincipal = Object.entries(domaineCounts)
        .sort((a, b) => b[1] - a[1])[0];
    
    if (domainePrincipal) {
        document.getElementById('domaine-principal').textContent = domainePrincipal[0];
        document.getElementById('domaine-count').textContent = `${domainePrincipal[1]} engagements`;
    }
    
    // Mettre à jour le KPI carousel
    updateKpiCarousel();
}

// ========================================
// NOTATION - FONCTION PRÊTE
// ========================================
function showRatingsModal(promiseId) {
    const promise = appState.promises.find(p => p.id === promiseId);
    if (!promise) return;
    
    const modal = document.createElement('div');
    modal.className = 'rating-modal';
    modal.innerHTML = `
        <div class="rating-modal-content">
            <div class="rating-modal-header">
                <h3>
                    <i class="fas fa-star"></i>
                    Noter cet engagement
                </h3>
                <button class="close-modal" onclick="closeRatingsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="rating-modal-body">
                <div class="promise-preview">
                    "${escapeHtml(truncateText(promise.titre || promise.engagement, 100))}"
                </div>
                
                <div class="stars-rating-container">
                    <div class="stars-large" id="ratingStars">
                        <i class="far fa-star" data-value="1"></i>
                        <i class="far fa-star" data-value="2"></i>
                        <i class="far fa-star" data-value="3"></i>
                        <i class="far fa-star" data-value="4"></i>
                        <i class="far fa-star" data-value="5"></i>
                    </div>
                    <div class="rating-label" id="ratingLabel">Sélectionnez une note</div>
                </div>
                
                <div class="rating-feedback">
                    <label for="ratingComment">
                        <i class="fas fa-comment"></i>
                        Commentaire (optionnel)
                    </label>
                    <textarea id="ratingComment" placeholder="Partagez votre expérience..."></textarea>
                </div>
            </div>
            <div class="rating-modal-footer">
                <button class="btn-cancel" onclick="closeRatingsModal()">
                    <i class="fas fa-times"></i> Annuler
                </button>
                <button class="btn-submit-rating" onclick="submitRating('${promiseId}')">
                    <i class="fas fa-paper-plane"></i> Soumettre
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Initialiser les étoiles
    initializeModalStars();
}

function initializeModalStars() {
    const stars = document.querySelectorAll('#ratingStars i');
    let selectedValue = 0;
    const label = document.getElementById('ratingLabel');
    
    const updateLabel = (value) => {
        const texts = [
            'Sélectionnez une note',
            '🙁 Très insatisfait',
            '🙁 Insatisfait',
            '😐 Moyen',
            '🙂 Satisfait',
            '😀 Très satisfait'
        ];
        label.textContent = texts[value] || texts[0];
    };
    
    stars.forEach(star => {
        star.addEventListener('mouseenter', function() {
            const value = parseInt(this.dataset.value);
            updateStars(stars, value);
            updateLabel(value);
        });
        
        star.addEventListener('click', function() {
            selectedValue = parseInt(this.dataset.value);
            updateStars(stars, selectedValue);
            updateLabel(selectedValue);
        });
    });
    
    document.getElementById('ratingStars').addEventListener('mouseleave', () => {
        updateStars(stars, selectedValue);
        updateLabel(selectedValue);
    });
}

function closeRatingsModal() {
    const modal = document.querySelector('.rating-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

function submitRating(promiseId) {
    const stars = document.querySelectorAll('#ratingStars i');
    const selectedValue = Array.from(stars).findIndex(s => s.classList.contains('fas')) + 1;
    const comment = document.getElementById('ratingComment').value;
    
    if (selectedValue === 0) {
        showNotification('Veuillez sélectionner une note', 'error');
        return;
    }
    
    // Sauvegarder le vote
    saveVote(promiseId, selectedValue, comment);
    
    // Simuler l'envoi
    setTimeout(() => {
        showNotification('Merci pour votre notation !', 'success');
        closeRatingsModal();
        loadRatingsData();
    }, 800);
}

function saveVote(promiseId, rating, comment = '') {
    const votes = JSON.parse(localStorage.getItem('promise_votes') || '[]');
    votes.push({
        id: Date.now().toString(),
        promise_id: promiseId,
        rating: rating,
        comment: comment,
        created_at: new Date().toISOString()
    });
    localStorage.setItem('promise_votes', JSON.stringify(votes));
}

// ========================================
// AFFICHAGE JOURNAUX
// ========================================
function displayNewspapers() {
    const grid = document.getElementById('newspapersGrid');
    if (!grid || !appState.newspapers.length) return;
    
    grid.innerHTML = appState.newspapers.map((paper, index) => `
        <div class="newspaper-card" data-index="${index}">
            <div class="newspaper-preview">
                <img src="${escapeHtml(paper.image)}" alt="${escapeHtml(paper.title)}">
            </div>
            <h4>${escapeHtml(paper.title)}</h4>
            <div class="newspaper-date">${formatDate(paper.date)}</div>
        </div>
    `).join('');
}

// ========================================
// MENU MOBILE
// ========================================
function setupMobileMenu() {
    const hamburger = document.getElementById('modernHamburger');
    const menu = document.getElementById('modernMenu');
    
    if (!hamburger || !menu) return;
    
    hamburger.addEventListener('click', toggleMobileMenu);
}

function toggleMobileMenu() {
    const hamburger = document.getElementById('modernHamburger');
    const menu = document.getElementById('modernMenu');
    
    hamburger.classList.toggle('active');
    menu.classList.toggle('active');
}

// ========================================
// COMPTE À REBOURS
// ========================================
function startCountdown() {
    const referenceDate = new Date('2024-04-02T00:00:00');
    const now = new Date();
    const diff = now - referenceDate;
    
    updateCountdown(diff);
    
    setInterval(() => {
        const now = new Date();
        const diff = now - referenceDate;
        updateCountdown(diff);
    }, 1000);
}

function updateCountdown(ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    document.getElementById('days').textContent = days.toString().padStart(3, '0');
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
}

// ========================================
// UTILITAIRES
// ========================================
function formatDate(dateString) {
    if (!dateString) return 'Date non spécifiée';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatContent(html) {
    // Améliorer le formatage du contenu
    return html
        .replace(/\n/g, '<br>')
        .replace(/(^|\n)(#+)(.*)/g, (match, p1, p2, p3) => {
            const level = p2.length;
            return `<h${level}>${p3.trim()}</h${level}>`;
        })
        .replace(/(^|\n)- (.*)/g, '<li>$2</li>')
        .replace(/<li>/g, '<ul><li>')
        .replace(/<\/li>/g, '</li></ul>')
        .replace(/<ul><\/ul>/g, '');
}

function getStatusClass(promise) {
    if (!promise) return '';
    const status = promise.status || '';
    if (status.includes('Réalisé')) return 'status-realise';
    if (status.includes('cours')) return 'status-encours';
    if (status.includes('lancé')) return 'status-non-lance';
    if (status.includes('retard')) return 'status-late';
    return '';
}

function getStatusIcon(promise) {
    if (!promise) return 'fas fa-circle';
    const status = promise.status || '';
    if (status.includes('Réalisé')) return 'fas fa-check-circle';
    if (status.includes('cours')) return 'fas fa-sync-alt';
    if (status.includes('lancé')) return 'fas fa-clock';
    if (status.includes('retard')) return 'fas fa-exclamation-triangle';
    return 'fas fa-circle';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container') || 
        createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    return container;
}

function showLoadingState(elementId, message = 'Chargement...') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function showErrorState(elementId, message = 'Erreur') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger); margin-bottom: 20px;"></i>
            <p>${message}</p>
        </div>
    `;
}

function setupScrollIndicator() {
    const indicator = document.getElementById('progressIndicator');
    if (!indicator) return;
    
    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
        
        indicator.style.width = `${scrolled}%`;
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// FONCTIONS DE NOTATION DES SERVICES
// ========================================
function initializeStarRatings() {
    document.querySelectorAll('.stars-rating').forEach(container => {
        const stars = container.querySelectorAll('i');
        const input = container.nextElementSibling;
        let selectedValue = parseInt(input.value);
        
        // Initialiser les étoiles
        updateStars(stars, selectedValue);
        
        // Événements hover
        stars.forEach(star => {
            star.addEventListener('mouseenter', function() {
                const value = parseInt(this.dataset.value);
                updateStars(stars, value);
            });
            
            star.addEventListener('click', function() {
                const value = parseInt(this.dataset.value);
                selectedValue = value;
                input.value = value;
                updateStars(stars, value);
            });
        });
        
        // Événement leave
        container.addEventListener('mouseleave', () => {
            updateStars(stars, selectedValue);
        });
    });
}

function updateStars(stars, value) {
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.remove('far');
            star.classList.add('fas', 'star-active');
        } else {
            star.classList.remove('fas', 'star-active');
            star.classList.add('far');
        }
    });
}

function handleRatingSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Valider
    if (!data['service-category'] || !data['service']) {
        showNotification('Veuillez sélectionner un service', 'error');
        return;
    }
    
    // Vérifier que au moins un critère est noté
    const criteria = ['accessibility', 'welcome', 'efficiency', 'transparency'];
    const allRated = criteria.every(c => parseInt(data[c]) > 0);
    
    if (!allRated) {
        showNotification('Veuillez noter tous les critères', 'error');
        return;
    }
    
    // Sauvegarder
    saveServiceRating(data);
    
    // Simuler l'envoi
    setTimeout(() => {
        showNotification('Merci pour votre notation !', 'success');
        e.target.reset();
        
        // Réinitialiser les étoiles
        document.querySelectorAll('.stars-rating i').forEach(star => {
            star.classList.remove('fas', 'star-active');
            star.classList.add('far');
        });
        
        // Mettre à jour les données
        loadRatingsData();
    }, 1000);
}

function saveServiceRating(data) {
    const ratings = JSON.parse(localStorage.getItem('service_ratings') || '[]');
    ratings.push({
        id: Date.now().toString(),
        ...data,
        created_at: new Date().toISOString()
    });
    localStorage.setItem('service_ratings', JSON.stringify(ratings));
}

function updateServiceOptions() {
    const category = document.getElementById('service-category').value;
    const serviceSelect = document.getElementById('service');
    
    serviceSelect.innerHTML = '<option value="">Sélectionnez un service</option>';
    
    if (!category) return;
    
    // Services par catégorie
    const services = {
        health: [
            'Hôpital Principal de Dakar',
            'Centre de Santé de Grand Yoff',
            'Pharmacie Nationale d\'Approvisionnement',
            'Institut d\'Hygiène Sociale',
            'Autre service de santé'
        ],
        education: [
            'Université Cheikh Anta Diop',
            'Écoles élémentaires publiques',
            'Lycées nationaux',
            'Centre de Formation Professionnelle',
            'Autre service éducatif'
        ],
        security: [
            'Police Nationale',
            'Gendarmerie Nationale',
            'Sapeurs-Pompiers',
            'Douanes',
            'Autre service de sécurité'
        ],
        justice: [
            'Tribunal de Grande Instance',
            'Cour d\'Appel',
            'Parquet',
            'Maisons d\'Arrêt',
            'Autre service judiciaire'
        ],
        administration: [
            'Mairie de Dakar',
            'Service d\'État Civil',
            'Direction des Impôts',
            'Agence Nationale de l\'Identité',
            'Autre service administratif'
        ]
    };
    
    const categoryServices = services[category] || ['Service 1', 'Service 2', 'Service 3'];
    
    categoryServices.forEach(service => {
        const option = document.createElement('option');
        option.value = service.toLowerCase().replace(/\s+/g, '-');
        option.textContent = service;
        serviceSelect.appendChild(option);
    });
}

function displayRatingsData() {
    const { votes, services, average, recent, top } = appState.ratings;
    
    // Stats overview
    document.getElementById('totalVotes').textContent = formatNumber(votes);
    document.getElementById('totalServices').textContent = formatNumber(services);
    document.getElementById('avgRating').textContent = average.toFixed(1);
    
    // Recent ratings
    const recentContainer = document.getElementById('recentRatings');
    if (recentContainer && recent.length > 0) {
        recentContainer.innerHTML = recent.map(item => `
            <div class="recent-item">
                <div class="recent-header">
                    <span class="recent-service">${item.service}</span>
                    <span class="recent-date">${formatDate(item.created_at)}</span>
                </div>
                <div class="recent-score">
                    <i class="fas fa-star"></i>
                    ${(item.accessibility + item.welcome + item.efficiency + item.transparency) / 4}
                </div>
                ${item.comment ? `
                    <div class="recent-comment">
                        "${item.comment}"
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    // Top services
    const topContainer = document.getElementById('topServices');
    if (topContainer && top.length > 0) {
        topContainer.innerHTML = top.map((item, index) => {
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            const rank = index === 0 ? '1er' : index === 1 ? '2ème' : index === 2 ? '3ème' : `${index + 1}ème`;
            
            return `
                <div class="service-item-card ${rankClass}">
                    <div class="service-rank-badge ${rankClass}">${rank}</div>
                    <div class="service-info-card">
                        <div class="service-name-card">${item.name}</div>
                        <div class="service-stats-card">
                            <div class="service-score-card">
                                <i class="fas fa-star"></i>
                                ${item.score.toFixed(1)}/5
                            </div>
                            <div class="service-count-card">
                                ${item.votes} vote${item.votes > 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function calculateTopServices(ratings) {
    const serviceStats = {};
    
    ratings.forEach(rating => {
        if (!serviceStats[rating.service]) {
            serviceStats[rating.service] = { sum: 0, count: 0 };
        }
        const avg = (rating.accessibility + rating.welcome + rating.efficiency + rating.transparency) / 4;
        serviceStats[rating.service].sum += avg;
        serviceStats[rating.service].count += 1;
    });
    
    return Object.entries(serviceStats)
        .map(([service, stats]) => ({
            name: service,
            score: stats.sum / stats.count,
            votes: stats.count
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

// ========================================
// EXPORTS POUR USAGE EXTERNE
// ========================================
window.sharePromise = sharePromise;
window.showRatingsModal = showRatingsModal;
window.togglePressZoom = togglePressZoom;
window.changePressSlide = changePressSlide;
window.goToPressSlide = goToPressSlide;
window.copyToClipboard = copyToClipboard;
window.showPromiseDetail = showPromiseDetail;
