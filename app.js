// ========== VARIABLES GLOBALES SUPABASE ==========
const SUPABASE_URL = 'https://votre-projet.supabase.co'; // Remplacer par votre URL Supabase
const SUPABASE_ANON_KEY = 'votre-clé-anon'; // Remplacer par votre clé anonyme

// Initialisation du client Supabase
const supabase = window.supabase.create({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY
});
// ========== VARIABLES GLOBALES ==========
let currentIndex = 0;
let pressCurrentIndex = 0;
let autoPlayInterval = null;
let pressAutoPlayInterval = null;
let pressScale = 1;
let pressTranslateX = 0;
let pressTranslateY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let startTranslateX = 0;
let startTranslateY = 0;
let promisesData = [];
let currentSlideIndex = 0;
let kpiIndex = 0;
const kpiItems = [
    { icon: 'fas fa-users', value: '15K+', label: 'Citoyens Engagés' },
    { icon: 'fas fa-chart-line', value: '42', label: 'Engagements Suivis' },
    { icon: 'fas fa-comments', value: '1.2K', label: 'Commentaires' },
    { icon: 'fas fa-star', value: '4.3', label: 'Note Moyenne' }
];

// ========== ÉVÉNEMENTS AU CHARGEMENT ==========
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la date
    updateCurrentDate();
    
    // Charger les données simulées (remplacer par Supabase en production)
    loadMockData();
    
    // Initialiser les carrousels
    initFeaturedCarousel();
    initPressCarousel();
    initKpiCarousel();
    
    // Gérer le scroll
    window.addEventListener('scroll', handleScroll);
    
    // Gérer le drag pour la presse
    initPressDrag();
    
    // Initialiser le visualiseur de photos
    initPhotoViewer();
    
    // Charger les résultats de notation
    loadRatingResults();
});

// ========== FONCTIONS PRINCIPALES ==========

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('fr-FR', options);
}

function loadMockData() {
    // Promesses en vedette
    const featuredPromises = [
        {
            id: 'promise_1',
            title: 'Gratuité des soins pour les enfants de moins de 5 ans et les personnes âgées de plus de 65 ans',
            domain: 'Santé Publique',
            status: 'encours',
            description: 'Mettre en œuvre la gratuité effective des soins pour les enfants de moins de 5 ans et les personnes âgées de plus de 65 ans dans tous les hôpitaux et centres de santé publics.',
            progress: 'En cours de déploiement progressif dans les régions prioritaires',
            rating: 4.2,
            votes: 156
        },
        {
            id: 'promise_2',
            title: 'Construction de 100 nouvelles écoles primaires et 20 collèges',
            domain: 'Éducation Nationale',
            status: 'realise',
            description: 'Construire 100 nouvelles écoles primaires et 20 collèges dans les zones rurales et périurbaines pour améliorer l\'accès à l\'éducation.',
            progress: '✅ Projet achevé - 120 établissements construits',
            rating: 4.8,
            votes: 234
        },
        {
            id: 'promise_3',
            title: 'Réduction de 50% des tarifs d\'électricité pour les ménages',
            domain: 'Énergie',
            status: 'encours',
            description: 'Mettre en place une politique de subvention pour réduire de 50% les tarifs d\'électricité pour les ménages à faible revenu.',
            progress: 'Phase pilote en cours dans 5 régions',
            rating: 3.9,
            votes: 189
        },
        {
            id: 'promise_4',
            title: 'Création de 100 000 emplois pour les jeunes',
            domain: 'Emploi & Jeunesse',
            status: 'encours',
            description: 'Lancer un programme national pour la création de 100 000 emplois directs pour les jeunes diplômés et non-diplômés.',
            progress: '45 000 emplois créés à ce jour',
            rating: 4.0,
            votes: 201
        },
        {
            id: 'promise_5',
            title: 'Modernisation de l\'administration fiscale',
            domain: 'Finances & Impôts',
            status: 'realise',
            description: 'Moderniser complètement l\'administration fiscale avec un système digital intégré pour simplifier les démarches des contribuables.',
            progress: '✅ Plateforme digitale opérationnelle',
            rating: 4.5,
            votes: 178
        },
        {
            id: 'promise_6',
            title: 'Doublement des routes rurales bitumées',
            domain: 'Transports & Infrastructures',
            status: 'encours',
            description: 'Doubler le réseau de routes rurales bitumées pour améliorer la connectivité des zones agricoles et faciliter l\'accès aux marchés.',
            progress: '60% des objectifs atteints',
            rating: 4.1,
            votes: 145
        }
    ];
    
    // Générer les cartes du carrousel
    generateFeaturedCards(featuredPromises);
    
    // Charger la promesse du jour
    loadDailyPromise(featuredPromises[0]);
    
    // Charger les engagements
    loadAllPromises();
    
    // Charger les actualités
    loadNews();
    
    // Charger les quotidiens
    loadNewspapers();
    
    // Mettre à jour les statistiques
    updateStats();
}

// ========== CARROUSEL PROMESSES EN VEDETTE ==========

function initFeaturedCarousel() {
    const track = document.getElementById('featuredCarouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!track || !dotsContainer) return;
    
    const cards = track.querySelectorAll('.featured-promise-card');
    const totalItems = cards.length;
    
    // Créer les dots
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalItems; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.dataset.index = i;
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
    
    // Démarrer l'autoplay
    startAutoPlay();
    
    // Écouteurs pour les boutons de contrôle
    const playPauseBtn = document.getElementById('carouselPlayPause');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    
    // Pause au survol
    track.addEventListener('mouseenter', pauseAutoPlay);
    track.addEventListener('mouseleave', resumeAutoPlay);
}

function generateFeaturedCards(promises) {
    const track = document.getElementById('featuredCarouselTrack');
    if (!track) return;
    
    track.innerHTML = '';
    
    promises.forEach(promise => {
        const card = document.createElement('div');
        card.className = `featured-promise-card status-${promise.status}`;
        card.innerHTML = createPromiseCardHTML(promise);
        track.appendChild(card);
    });
}

function createPromiseCardHTML(promise) {
    const statusLabels = {
        'realise': '✅ Réalisé',
        'encours': '🔄 En Cours',
        'non-lance': '⏳ Non Lancé',
        'late': '⚠️ En Retard'
    };
    
    const statusIcons = {
        'realise': 'fa-check-circle',
        'encours': 'fa-sync-alt',
        'non-lance': 'fa-clock',
        'late': 'fa-exclamation-triangle'
    };
    
    const stars = generateStars(promise.rating);
    
    return `
        <div class="featured-promise-badge">
            <i class="fas fa-medal"></i>
            <span>En Vedette</span>
        </div>
        
        <h3 class="featured-promise-title">${promise.title}</h3>
        
        <div class="featured-promise-domain">
            <i class="fas fa-building"></i>
            <span>${promise.domain}</span>
        </div>
        
        <div class="featured-promise-status status-${promise.status}">
            <i class="fas ${statusIcons[promise.status]}"></i>
            <span>${statusLabels[promise.status]}</span>
        </div>
        
        <div class="featured-promise-content">
            <p class="featured-promise-desc">${promise.description}</p>
            
            <div class="featured-promise-progress">
                <strong><i class="fas fa-calendar-alt"></i> Dernière mise à jour</strong>
                <p>${promise.progress}</p>
            </div>
            
            <div class="featured-promise-meta">
                <span><i class="fas fa-calendar"></i> 2 AVRIL 2024</span>
                <span><i class="fas fa-bullseye"></i> Objectif 2027</span>
            </div>
        </div>
        
        <div class="featured-promise-footer">
            <div class="featured-promise-rating">
                <span class="rating-value">${promise.rating}</span>
                <div class="rating-stars">
                    ${stars}
                </div>
                <span class="rating-count">(${promise.votes} votes)</span>
            </div>
            
            <div class="featured-promise-actions">
                <div class="featured-social-share">
                    <button class="featured-social-btn fb" onclick="shareOnFacebook('${promise.id}')" title="Partager sur Facebook">
                        <i class="fab fa-facebook-f"></i>
                    </button>
                    <button class="featured-social-btn tw" onclick="shareOnTwitter('${promise.id}')" title="Partager sur Twitter">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="featured-social-btn wa" onclick="shareOnWhatsApp('${promise.id}')" title="Partager sur WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
                
                <button class="featured-btn-stars" onclick="ratePromise('${promise.id}')" title="Noter">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                </button>
            </div>
        </div>
    `;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

function goToSlide(index) {
    const track = document.getElementById('featuredCarouselTrack');
    const dots = document.querySelectorAll('.carousel-dot');
    const cards = document.querySelectorAll('.featured-promise-card');
    
    if (!track || !cards.length) return;
    
    if (index < 0 || index >= cards.length) return;
    
    currentIndex = index;
    
    // Mettre à jour la position
    const cardWidth = 360;
    const gap = 24;
    const totalWidth = (cardWidth + gap) * index;
    track.style.transform = `translateX(-${totalWidth}px)`;
    
    // Mettre à jour les dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function nextSlide() {
    const totalItems = document.querySelectorAll('.featured-promise-card').length;
    goToSlide((currentIndex + 1) % totalItems);
}

function prevSlide() {
    const totalItems = document.querySelectorAll('.featured-promise-card').length;
    goToSlide((currentIndex - 1 + totalItems) % totalItems);
}

function startAutoPlay() {
    autoPlayInterval = setInterval(nextSlide, 5000);
}

function pauseAutoPlay() {
    clearInterval(autoPlayInterval);
    const btn = document.getElementById('carouselPlayPause');
    if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
}

function resumeAutoPlay() {
    startAutoPlay();
    const btn = document.getElementById('carouselPlayPause');
    if (btn) btn.innerHTML = '<i class="fas fa-pause"></i>';
}

function togglePlayPause() {
    if (autoPlayInterval) {
        pauseAutoPlay();
    } else {
        resumeAutoPlay();
    }
}

// ========== CARROUSEL PRESSE ==========

function initPressCarousel() {
    const newspapers = [
        {
            title: "Le Soleil - Édition du 30 Janvier 2026",
            date: "30 Janvier 2026",
            image: "placeholder-press.jpg",
            url: "#"
        },
        {
            title: "L'Observateur - Édition du 29 Janvier 2026",
            date: "29 Janvier 2026",
            image: "placeholder-press.jpg",
            url: "#"
        },
        {
            title: "WalFadjri - Édition du 28 Janvier 2026",
            date: "28 Janvier 2026",
            image: "placeholder-press.jpg",
            url: "#"
        }
    ];
    
    // Créer les indicateurs
    const indicators = document.getElementById('pressIndicators');
    if (indicators) {
        indicators.innerHTML = '';
        
        newspapers.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
            indicator.dataset.index = index;
            indicator.addEventListener('click', () => goToPressSlide(index));
            indicators.appendChild(indicator);
        });
    }
    
    // Charger la première édition
    loadPressEdition(newspapers[0]);
    
    // Démarrer l'autoplay
    startPressAutoPlay();
}

function loadPressEdition(edition) {
    const titleEl = document.getElementById('pressTitle');
    const dateEl = document.getElementById('pressDate');
    const linkEl = document.getElementById('pressLink');
    const imgEl = document.getElementById('pressMainImage');
    
    if (titleEl) titleEl.textContent = edition.title;
    if (dateEl) dateEl.textContent = edition.date;
    if (linkEl) linkEl.href = edition.url;
    if (imgEl) imgEl.src = edition.image;
}

function goToPressSlide(index) {
    const newspapers = [
        { title: "Le Soleil - Édition du 30 Janvier 2026", date: "30 Janvier 2026", image: "placeholder-press.jpg", url: "#" },
        { title: "L'Observateur - Édition du 29 Janvier 2026", date: "29 Janvier 2026", image: "placeholder-press.jpg", url: "#" },
        { title: "WalFadjri - Édition du 28 Janvier 2026", date: "28 Janvier 2026", image: "placeholder-press.jpg", url: "#" }
    ];
    
    if (index < 0 || index >= newspapers.length) return;
    
    pressCurrentIndex = index;
    loadPressEdition(newspapers[index]);
    
    // Mettre à jour les indicateurs
    document.querySelectorAll('.indicator').forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
}

function nextPress() {
    const total = 3;
    goToPressSlide((pressCurrentIndex + 1) % total);
}

function prevPress() {
    const total = 3;
    goToPressSlide((pressCurrentIndex - 1 + total) % total);
}

function startPressAutoPlay() {
    pressAutoPlayInterval = setInterval(nextPress, 8000);
}

function togglePressAutoPlay() {
    const btn = document.getElementById('pressPlayPause');
    if (!btn) return;
    
    if (pressAutoPlayInterval) {
        clearInterval(pressAutoPlayInterval);
        pressAutoPlayInterval = null;
        btn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        startPressAutoPlay();
        btn.innerHTML = '<i class="fas fa-pause"></i>';
    }
}

function togglePressZoom() {
    const img = document.getElementById('pressMainImage');
    const btn = document.getElementById('pressZoomBtn');
    const info = document.getElementById('zoomInfo');
    
    if (!img || !btn || !info) return;
    
    if (pressScale === 1) {
        pressScale = 2;
        btn.innerHTML = '<i class="fas fa-compress"></i>';
        info.textContent = '200%';
    } else {
        pressScale = 1;
        pressTranslateX = 0;
        pressTranslateY = 0;
        btn.innerHTML = '<i class="fas fa-expand"></i>';
        info.textContent = '100%';
    }
    
    img.style.transform = `scale(${pressScale}) translate(${pressTranslateX}px, ${pressTranslateY}px)`;
}

function initPressDrag() {
    const img = document.getElementById('pressMainImage');
    if (!img) return;
    
    img.addEventListener('mousedown', startDrag);
    img.addEventListener('mousemove', drag);
    img.addEventListener('mouseup', stopDrag);
    img.addEventListener('mouseleave', stopDrag);
    
    img.addEventListener('touchstart', startDrag);
    img.addEventListener('touchmove', drag);
    img.addEventListener('touchend', stopDrag);
    
    function startDrag(e) {
        if (pressScale === 1) return;
        
        e.preventDefault();
        isDragging = true;
        
        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }
        
        startTranslateX = pressTranslateX;
        startTranslateY = pressTranslateY;
        
        img.style.cursor = 'grabbing';
    }
    
    function drag(e) {
        if (!isDragging || pressScale === 1) return;
        e.preventDefault();
        
        let currentX, currentY;
        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else {
            currentX = e.clientX;
            currentY = e.clientY;
        }
        
        const diffX = currentX - startX;
        const diffY = currentY - startY;
        
        pressTranslateX = startTranslateX + diffX;
        pressTranslateY = startTranslateY + diffY;
        
        img.style.transform = `scale(${pressScale}) translate(${pressTranslateX}px, ${pressTranslateY}px)`;
    }
    
    function stopDrag() {
        isDragging = false;
        if (img) {
            img.style.cursor = 'grab';
        }
    }
}

// ========== KPI CAROUSEL ==========

function initKpiCarousel() {
    const carousel = document.getElementById('kpiCarousel');
    if (!carousel) return;
    
    updateKpiDisplay();
    
    document.querySelectorAll('.kpi-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('prev')) {
                kpiIndex = (kpiIndex - 1 + kpiItems.length) % kpiItems.length;
            } else {
                kpiIndex = (kpiIndex + 1) % kpiItems.length;
            }
            updateKpiDisplay();
        });
    });
}

function updateKpiDisplay() {
    const carousel = document.getElementById('kpiCarousel');
    if (!carousel) return;
    
    const item = kpiItems[kpiIndex];
    carousel.innerHTML = `
        <div class="kpi-item">
            <div class="kpi-icon">
                <i class="${item.icon}"></i>
            </div>
            <div class="kpi-content">
                <div class="kpi-value">${item.value}</div>
                <div class="kpi-label">${item.label}</div>
            </div>
        </div>
    `;
}

// ========== FONCTIONS DE CHARGEMENT ==========

function loadDailyPromise(promise) {
    const titleEl = document.getElementById('dailyPromiseTitle');
    const domainEl = document.getElementById('dailyDomain');
    const statusEl = document.getElementById('dailyStatus');
    const leadEl = document.getElementById('dailyLead');
    const objectiveEl = document.getElementById('dailyObjective');
    const progressEl = document.getElementById('dailyProgress');
    const deadlineEl = document.getElementById('dailyDeadline');
    const statusLabelEl = document.getElementById('dailyStatusLabel');
    const updatesEl = document.getElementById('dailyUpdates');
    
    if (titleEl) titleEl.textContent = promise.title;
    if (domainEl) domainEl.innerHTML = `<i class="fas fa-building"></i><span>${promise.domain}</span>`;
    if (statusEl) {
        statusEl.className = `article-status status-${promise.status}`;
        statusEl.innerHTML = getStatusHTML(promise.status);
    }
    if (leadEl) leadEl.innerHTML = `<i class="fas fa-quote-left"></i>${promise.description.substring(0, 100)}...`;
    if (objectiveEl) objectiveEl.textContent = promise.description;
    if (progressEl) progressEl.textContent = promise.progress;
    if (deadlineEl) deadlineEl.textContent = '2027';
    if (statusLabelEl) statusLabelEl.textContent = getStatusLabel(promise.status);
    if (updatesEl) updatesEl.innerHTML = `
        <div class="update-item-small">
            <div class="update-date-small">15 Janvier 2026</div>
            <div class="update-text-small">${promise.progress}</div>
        </div>
    `;
}

function getStatusHTML(status) {
    const icons = {
        'realise': 'fa-check-circle',
        'encours': 'fa-sync-alt',
        'non-lance': 'fa-clock',
        'late': 'fa-exclamation-triangle'
    };
    
    const labels = {
        'realise': '✅ Réalisé',
        'encours': '🔄 En Cours',
        'non-lance': '⏳ Non Lancé',
        'late': '⚠️ En Retard'
    };
    
    return `<i class="fas ${icons[status]}"></i><span>${labels[status]}</span>`;
}

function getStatusLabel(status) {
    const labels = {
        'realise': '✅ Réalisé',
        'encours': '🔄 En Cours',
        'non-lance': '⏳ Non Lancé',
        'late': '⚠️ En Retard'
    };
    return labels[status];
}

function loadAllPromises() {
    const grid = document.getElementById('promisesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const promises = [
        {
            id: 'p1',
            title: 'Gratuité des soins pour les enfants',
            domain: 'Santé',
            status: 'encours',
            result: 'En cours de déploiement dans les régions prioritaires',
            rating: 4.2,
            votes: 156
        },
        {
            id: 'p2',
            title: 'Construction de 100 écoles',
            domain: 'Éducation',
            status: 'realise',
            result: '✅ 120 établissements construits',
            rating: 4.8,
            votes: 234
        },
        {
            id: 'p3',
            title: 'Accès à l\'eau potable pour tous',
            domain: 'Eau & Assainissement',
            status: 'encours',
            result: '75% de la population couverte',
            rating: 4.3,
            votes: 167
        },
        {
            id: 'p4',
            title: 'Réforme du système judiciaire',
            domain: 'Justice',
            status: 'non-lance',
            result: 'étude d\'impact en cours',
            rating: 3.5,
            votes: 98
        }
    ];
    
    promises.forEach(promise => {
        const card = document.createElement('div');
        card.className = `promise-card status-${promise.status}`;
        card.innerHTML = `
            <div class="promise-header">
                <div class="promise-status status-${promise.status}">
                    ${getStatusHTML(promise.status)}
                </div>
                <div class="promise-domain">
                    <i class="fas fa-building"></i>
                    ${promise.domain}
                </div>
            </div>
            <h3 class="promise-title">${promise.title}</h3>
            <div class="promise-result">
                <strong><i class="fas fa-calendar-alt"></i> Dernière mise à jour</strong>
                <p>${promise.result}</p>
            </div>
            <div class="promise-meta">
                <span><i class="fas fa-calendar"></i> 2 AVRIL 2024</span>
                <span><i class="fas fa-bullseye"></i> 2027</span>
            </div>
            <div class="promise-actions">
                <div class="social-share">
                    <button class="social-btn fb" onclick="shareOnFacebook('${promise.id}')">
                        <i class="fab fa-facebook-f"></i>
                    </button>
                    <button class="social-btn tw" onclick="shareOnTwitter('${promise.id}')">
                        <i class="fab fa-twitter"></i>
                    </button>
                    <button class="social-btn wa" onclick="shareOnWhatsApp('${promise.id}')">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
                <button class="btn-stars" onclick="ratePromise('${promise.id}')">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                </button>
            </div>
            <div class="promise-rating">
                <span class="rating-value">${promise.rating}</span>
                <div class="rating-stars">
                    ${generateStars(promise.rating)}
                </div>
                <span class="rating-count">(${promise.votes} votes)</span>
            </div>
        `;
        grid.appendChild(card);
    });
    
    const infoEl = document.getElementById('resultsInfo');
    if (infoEl) infoEl.textContent = `${promises.length} engagement(s) trouvé(s)`;
}

function loadNews() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const news = [
        {
            title: 'Lancement du programme de santé gratuit',
            date: '28 Janvier 2026',
            summary: 'Le gouvernement lance officiellement le programme de gratuité des soins pour les enfants et personnes âgées.'
        },
        {
            title: 'Inauguration de 20 nouvelles écoles',
            date: '25 Janvier 2026',
            summary: 'Le président inaugure 20 nouvelles écoles dans les régions rurales du Sénégal.'
        },
        {
            title: 'Nouvelle plateforme digitale pour l\'administration',
            date: '22 Janvier 2026',
            summary: 'Lancement de la plateforme digitale pour simplifier les démarches administratives.'
        }
    ];
    
    news.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <div class="news-image">
                <i class="fas fa-newspaper fa-4x"></i>
            </div>
            <div class="news-content">
                <h3>${item.title}</h3>
                <p>${item.summary}</p>
                <div class="news-footer">
                    <span><i class="fas fa-calendar"></i> ${item.date}</span>
                    <span><i class="fas fa-eye"></i> 1.2k</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function loadNewspapers() {
    const grid = document.getElementById('newspapersGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const newspapers = [
        { name: 'Le Soleil', date: '30 Janvier 2026', image: 'placeholder-press.jpg' },
        { name: "L'Observateur", date: '29 Janvier 2026', image: 'placeholder-press.jpg' },
        { name: 'WalFadjri', date: '28 Janvier 2026', image: 'placeholder-press.jpg' },
        { name: 'Sud Quotidien', date: '27 Janvier 2026', image: 'placeholder-press.jpg' }
    ];
    
    newspapers.forEach(paper => {
        const card = document.createElement('div');
        card.className = 'newspaper-card';
        card.innerHTML = `
            <div class="newspaper-preview">
                <img src="${paper.image}" alt="${paper.name}">
            </div>
            <h4>${paper.name}</h4>
            <div class="newspaper-date">
                <i class="fas fa-calendar"></i> ${paper.date}
            </div>
        `;
        grid.appendChild(card);
    });
}

function loadRatingResults() {
    // Top services
    const topServices = document.getElementById('topServices');
    if (topServices) {
        topServices.innerHTML = `
            <div class="service-item-card">
                <div class="service-rank-badge gold">1</div>
                <div class="service-info-card">
                    <span class="service-name-card">Santé Publique</span>
                    <div class="service-stats-card">
                        <span class="service-score-card"><i class="fas fa-star"></i> 4.5</span>
                        <span class="service-count-card">234 votes</span>
                    </div>
                </div>
            </div>
            <div class="service-item-card">
                <div class="service-rank-badge silver">2</div>
                <div class="service-info-card">
                    <span class="service-name-card">Éducation Nationale</span>
                    <div class="service-stats-card">
                        <span class="service-score-card"><i class="fas fa-star"></i> 4.3</span>
                        <span class="service-count-card">198 votes</span>
                    </div>
                </div>
            </div>
            <div class="service-item-card">
                <div class="service-rank-badge bronze">3</div>
                <div class="service-info-card">
                    <span class="service-name-card">Administration Générale</span>
                    <div class="service-stats-card">
                        <span class="service-score-card"><i class="fas fa-star"></i> 4.1</span>
                        <span class="service-count-card">156 votes</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Stats
    const totalVotesEl = document.getElementById('totalVotes');
    const avgRatingEl = document.getElementById('avgRating');
    const totalServicesEl = document.getElementById('totalServices');
    
    if (totalVotesEl) totalVotesEl.textContent = '588';
    if (avgRatingEl) avgRatingEl.textContent = '4.3';
    if (totalServicesEl) totalServicesEl.textContent = '8';
    
    // Votes par service
    const votesList = document.getElementById('votesByService');
    if (votesList) {
        votesList.innerHTML = `
            <div class="service-vote-item-card">
                <span class="service-name-card">Santé Publique</span>
                <span class="service-votes-card">234 votes</span>
            </div>
            <div class="service-vote-item-card">
                <span class="service-name-card">Éducation Nationale</span>
                <span class="service-votes-card">198 votes</span>
            </div>
            <div class="service-vote-item-card">
                <span class="service-name-card">Administration Générale</span>
                <span class="service-votes-card">156 votes</span>
            </div>
        `;
    }
}

// ========== FONCTIONS UTILITAIRES ==========

function updateStats() {
    // Mettre à jour les statistiques avec des données simulées
    const statElements = [
        { selector: '.stat-total .stat-value', value: '42' },
        { selector: '.stat-success .stat-value', value: '8' },
        { selector: '.stat-success .stat-percentage', value: '19%' },
        { selector: '.stat-progress .stat-value', value: '21' },
        { selector: '.stat-progress .stat-percentage', value: '50%' },
        { selector: '.stat-pending .stat-value', value: '10' },
        { selector: '.stat-pending .stat-percentage', value: '24%' },
        { selector: '.stat-warning .stat-value', value: '3' },
        { selector: '.stat-warning .stat-percentage', value: '7%' },
        { selector: '.stat-rate .stat-value', value: '38%' },
        { selector: '.stat-rating .stat-value', value: '4.3' },
        { selector: '.stat-rating .stat-subvalue', value: '588 votes' },
        { selector: '.stat-update .stat-value', value: '29' },
        { selector: '.stat-update .stat-percentage', value: '69%' },
        { selector: '.stat-time .stat-value', value: '312j' },
        { selector: '.stat-domain .stat-value', value: 'Santé' },
        { selector: '.stat-domain .stat-subvalue', value: '12 engagements' }
    ];
    
    statElements.forEach(el => {
        const element = document.querySelector(el.selector);
        if (element) element.textContent = el.value;
    });
}

function handleScroll() {
    // Progress indicator
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
    const progressIndicator = document.querySelector('.progress-indicator');
    if (progressIndicator) progressIndicator.style.width = `${scrollPercent}%`;
    
    // Scroll to top button
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (scrollToTopBtn) {
        if (scrollTop > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    }
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ========== FONCTIONS D'INTERACTION ==========

function toggleFilters() {
    const filtersSection = document.getElementById('filtersSection');
    if (filtersSection) filtersSection.classList.toggle('active');
}

function resetFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const domainFilter = document.getElementById('domainFilter');
    const searchFilter = document.getElementById('searchFilter');
    
    if (statusFilter) statusFilter.value = 'all';
    if (domainFilter) domainFilter.value = 'all';
    if (searchFilter) searchFilter.value = '';
    
    showNotification('Filtres réinitialisés', 'info');
}

function exportData() {
    showNotification('Exportation en cours...', 'info');
    // Logique d'exportation à implémenter
}

function showMorePromises() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (showMoreBtn && showLessBtn) {
        showMoreBtn.style.display = 'none';
        showLessBtn.style.display = 'inline-flex';
    }
}

function showLessPromises() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    const showLessBtn = document.getElementById('showLessBtn');
    
    if (showMoreBtn && showLessBtn) {
        showMoreBtn.style.display = 'inline-flex';
        showLessBtn.style.display = 'none';
    }
}

function shareDailyPromise() {
    shareOnFacebook('daily');
}

function rateDailyPromise() {
    ratePromise('daily');
}

function shareOnFacebook(id) {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    showNotification('Partagé sur Facebook !', 'info');
}

function shareOnTwitter(id) {
    const url = window.location.href;
    const text = 'Découvrez cette promesse présidentielle sur LE PROJET SÉNÉGAL';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
    showNotification('Partagé sur Twitter !', 'info');
}

function shareOnWhatsApp(id) {
    const url = window.location.href;
    const text = 'Découvrez cette promesse présidentielle sur LE PROJET SÉNÉGAL';
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}%20${encodeURIComponent(url)}`, '_blank');
    showNotification('Partagé sur WhatsApp !', 'info');
}

function ratePromise(id) {
    showNotification('Cliquez sur une étoile pour noter !', 'info');
}

function setRating(container, criterion) {
    const stars = container.querySelectorAll('i');
    let selectedRating = 0;
    
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            selectedRating = index + 1;
            
            stars.forEach((s, i) => {
                s.className = i <= index ? 'fas fa-star' : 'far fa-star';
            });
            
            showNotification(`${criterion}: ${selectedRating}/5 étoiles`, 'success');
        });
        
        star.addEventListener('mouseover', function() {
            stars.forEach((s, i) => {
                if (i <= index) {
                    s.className = 'fas fa-star';
                }
            });
        });
        
        star.addEventListener('mouseout', function() {
            if (selectedRating === 0) {
                stars.forEach(s => {
                    s.className = 'far fa-star';
                });
            } else {
                stars.forEach((s, i) => {
                    if (i >= selectedRating) {
                        s.className = 'far fa-star';
                    }
                });
            }
        });
    });
}

// ========== FONCTION MANQUANTE AJOUTÉE ==========
function submitRating(event) {
    event.preventDefault();
    const service = document.getElementById('serviceSelect').value;
    if (!service) {
        showNotification('Veuillez sélectionner un service', 'error');
        return;
    }
    showNotification('Notation soumise avec succès !', 'success');
    
    // Réinitialiser le formulaire
    const form = document.getElementById('ratingForm');
    if (form) form.reset();
    
    // Réinitialiser les étoiles
    document.querySelectorAll('.stars-container i').forEach(star => {
        star.className = 'far fa-star';
    });
}
// ========== FIN DE LA FONCTION MANQUANTE ==========

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                         type === 'info' ? 'fa-info-circle' : 
                         type === 'warning' ? 'fa-exclamation-triangle' : 
                         'fa-times-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ========== PHOTO VIEWER ==========
function initPhotoViewer() {
    // Ajouter les écouteurs pour les images cliquables
    document.addEventListener('click', function(e) {
        if (e.target.closest('.newspaper-preview img')) {
            e.preventDefault();
            openPhotoViewer(e.target.src);
        }
    });
}

function openPhotoViewer(src) {
    // Créer le modal si nécessaire
    let modal = document.getElementById('photoViewerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photoViewerModal';
        modal.className = 'photo-viewer-modal';
        modal.innerHTML = `
            <div class="photo-viewer-content">
                <div class="photo-viewer-header">
                    <h3><i class="fas fa-image"></i> Visualiseur d'images</h3>
                    <div class="photo-viewer-controls">
                        <button class="nav-btn prev" onclick="changePhoto(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="nav-btn next" onclick="changePhoto(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <button id="closeViewerBtn" onclick="closePhotoViewer()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="photo-viewer-body">
                    <div class="photo-container">
                        <img id="photoViewerImage" src="${src}" alt="Image agrandie">
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.getElementById('photoViewerImage').src = src;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePhotoViewer() {
    const modal = document.getElementById('photoViewerModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function changePhoto(direction) {
    // Logique pour changer de photo (à implémenter selon les besoins)
    showNotification('Fonctionnalité de navigation entre images à venir', 'info');
}

// ========== ÉVÉNEMENTS CLAVIER ==========
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePhotoViewer();
    }
});
