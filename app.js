// ========== VARIABLES GLOBALES SUPABASE ==========
const SUPABASE_URL = 'https://votre-projet.supabase.co'; // Remplacer par votre URL Supabase
const SUPABASE_ANON_KEY = 'votre-clé-anon'; // Remplacer par votre clé anonyme

// Initialisation du client Supabase
const supabase = window.supabase.create({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY
});

// Variables pour le fonctionnement de l'interface
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

// ========== ÉVÉNEMENTS AU CHARGEMENT ==========
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la date
    updateCurrentDate();
    
    // Charger les données depuis Supabase
    loadDataFromSupabase();
    
    // Initialiser les carrousels
    initFeaturedCarousel();
    initPressCarousel();
    
    // Gérer le scroll
    window.addEventListener('scroll', handleScroll);
    
    // Gérer le drag pour la presse
    initPressDrag();
});

// ========== FONCTIONS SUPABASE ==========

async function loadDataFromSupabase() {
    try {
        // Charger les engagements
        const { data: promises, error: promisesError } = await supabase
            .from('promises')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (promisesError) throw promisesError;
        displayPromises(promises);
        
        // Charger les actualités
        const { data: news, error: newsError } = await supabase
            .from('news')
            .select('*')
            .order('date', { ascending: false })
            .limit(6);
        
        if (newsError) throw newsError;
        displayNews(news);
        
        // Charger les quotidiens
        const { data: newspapers, error: newspapersError } = await supabase
            .from('newspapers')
            .select('*')
            .order('date', { ascending: false })
            .limit(8);
        
        if (newspapersError) throw newspapersError;
        displayNewspapers(newspapers);
        
        // Charger la promesse du jour (aléatoire ou la plus récente)
        if (promises && promises.length > 0) {
            const randomIndex = Math.floor(Math.random() * promises.length);
            loadDailyPromise(promises[randomIndex]);
        }
        
        // Charger les promesses en vedette (top 6)
        const featuredPromises = promises.slice(0, 6);
        generateFeaturedCards(featuredPromises);
        
        // Mettre à jour les statistiques
        updateStatsFromData(promises);
        
    } catch (error) {
        console.error('Erreur lors du chargement des données Supabase:', error);
        showNotification('Erreur lors du chargement des données', 'error');
        
        // Charger les données simulées en cas d'erreur
        loadMockData();
    }
}

function displayPromises(promises) {
    const grid = document.getElementById('promisesGrid');
    grid.innerHTML = '';
    
    if (!promises || promises.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <p>Aucun engagement trouvé pour le moment.</p>
            </div>
        `;
        document.getElementById('resultsInfo').textContent = '0 engagement(s) trouvé(s)';
        return;
    }
    
    promises.forEach(promise => {
        const card = document.createElement('div');
        card.className = `promise-card status-${promise.status || 'encours'}`;
        card.innerHTML = createPromiseCardHTML(promise);
        grid.appendChild(card);
    });
    
    document.getElementById('resultsInfo').textContent = `${promises.length} engagement(s) trouvé(s)`;
}

function displayNews(news) {
    const grid = document.getElementById('newsGrid');
    grid.innerHTML = '';
    
    if (!news || news.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <p>Aucune actualité disponible pour le moment.</p>
            </div>
        `;
        return;
    }
    
    news.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <div class="news-image">
                <i class="fas fa-newspaper fa-4x"></i>
            </div>
            <div class="news-content">
                <h3>${item.title || 'Titre non disponible'}</h3>
                <p>${item.summary || 'Résumé non disponible'}</p>
                <div class="news-footer">
                    <span><i class="fas fa-calendar"></i> ${new Date(item.date).toLocaleDateString('fr-FR')}</span>
                    <span><i class="fas fa-eye"></i> ${item.views || 0}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function displayNewspapers(newspapers) {
    const grid = document.getElementById('newspapersGrid');
    grid.innerHTML = '';
    
    if (!newspapers || newspapers.length === 0) {
        grid.innerHTML = `
            <div class="loading-state">
                <p>Aucun quotidien disponible pour le moment.</p>
            </div>
        `;
        return;
    }
    
    newspapers.forEach(paper => {
        const card = document.createElement('div');
        card.className = 'newspaper-card';
        card.innerHTML = `
            <div class="newspaper-preview">
                <img src="${paper.image_url || 'placeholder-press.jpg'}" alt="${paper.name || 'Quotidien'}">
            </div>
            <h4>${paper.name || 'Nom non disponible'}</h4>
            <div class="newspaper-date">
                <i class="fas fa-calendar"></i> ${new Date(paper.date).toLocaleDateString('fr-FR')}
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateStatsFromData(promises) {
    if (!promises || promises.length === 0) return;
    
    // Calculer les statistiques
    const total = promises.length;
    const realise = promises.filter(p => p.status === 'realise').length;
    const encours = promises.filter(p => p.status === 'encours').length;
    const nonLance = promises.filter(p => p.status === 'non-lance').length;
    const late = promises.filter(p => p.status === 'late').length;
    const tauxRealisation = Math.round((realise / total) * 100);
    const avecMaj = promises.filter(p => p.updates && p.updates.length > 0).length;
    
    // Mettre à jour l'UI
    document.querySelector('.stat-total .stat-value').textContent = total;
    document.querySelector('.stat-success .stat-value').textContent = realise;
    document.querySelector('.stat-success .stat-percentage').textContent = `${Math.round((realise / total) * 100)}%`;
    document.querySelector('.stat-progress .stat-value').textContent = encours;
    document.querySelector('.stat-progress .stat-percentage').textContent = `${Math.round((encours / total) * 100)}%`;
    document.querySelector('.stat-pending .stat-value').textContent = nonLance;
    document.querySelector('.stat-pending .stat-percentage').textContent = `${Math.round((nonLance / total) * 100)}%`;
    document.querySelector('.stat-warning .stat-value').textContent = late;
    document.querySelector('.stat-warning .stat-percentage').textContent = `${Math.round((late / total) * 100)}%`;
    document.querySelector('.stat-rate .stat-value').textContent = `${tauxRealisation}%`;
    document.querySelector('.stat-update .stat-value').textContent = avecMaj;
    document.querySelector('.stat-update .stat-percentage').textContent = `${Math.round((avecMaj / total) * 100)}%`;
    
    // Note moyenne (simulée ou depuis les données)
    const avgRating = promises.reduce((sum, p) => sum + (p.rating || 0), 0) / total;
    document.querySelector('.stat-rating .stat-value').textContent = avgRating.toFixed(1);
    document.querySelector('.stat-rating .stat-subvalue').textContent = `${promises.reduce((sum, p) => sum + (p.votes || 0), 0)} votes`;
}

// ========== DONNÉES SIMULÉES (fallback) ==========

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
    
    // Charger les engagements (sans progression)
    loadAllPromises();
    
    // Charger les actualités
    loadNews();
    
    // Charger les quotidiens (taille agrandie)
    loadNewspapers();
    
    // Charger les résultats de notation (optimisés)
    loadRatingResults();
}

// ========== CARROUSEL PROMESSES EN VEDETTE ==========

function initFeaturedCarousel() {
    const track = document.getElementById('featuredCarouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    const totalItems = document.querySelectorAll('.featured-promise-card').length;
    
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
    document.getElementById('carouselPlayPause').addEventListener('click', togglePlayPause);
    document.getElementById('carouselPrev').addEventListener('click', prevSlide);
    document.getElementById('carouselNext').addEventListener('click', nextSlide);
    
    // Pause au survol
    track.addEventListener('mouseenter', pauseAutoPlay);
    track.addEventListener('mouseleave', resumeAutoPlay);
}

function generateFeaturedCards(promises) {
    const track = document.getElementById('featuredCarouselTrack');
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
    document.getElementById('carouselPlayPause').innerHTML = '<i class="fas fa-play"></i>';
}

function resumeAutoPlay() {
    startAutoPlay();
    document.getElementById('carouselPlayPause').innerHTML = '<i class="fas fa-pause"></i>';
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
    indicators.innerHTML = '';
    
    newspapers.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
        indicator.dataset.index = index;
        indicator.addEventListener('click', () => goToPressSlide(index));
        indicators.appendChild(indicator);
    });
    
    // Charger la première édition
    loadPressEdition(newspapers[0]);
    
    // Démarrer l'autoplay
    startPressAutoPlay();
}

function loadPressEdition(edition) {
    document.getElementById('pressTitle').textContent = edition.title;
    document.getElementById('pressDate').textContent = edition.date;
    document.getElementById('pressLink').href = edition.url;
    document.getElementById('pressMainImage').src = edition.image;
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
    if (pressAutoPlayInterval) {
        clearInterval(pressAutoPlayInterval);
        pressAutoPlayInterval = null;
        document.getElementById('pressPlayPause').innerHTML = '<i class="fas fa-play"></i>';
    } else {
        startPressAutoPlay();
        document.getElementById('pressPlayPause').innerHTML = '<i class="fas fa-pause"></i>';
    }
}

function togglePressZoom() {
    const img = document.getElementById('pressMainImage');
    const btn = document.getElementById('pressZoomBtn');
    const info = document.getElementById('zoomInfo');
    
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

// ========== FONCTIONS DE CHARGEMENT ==========

function loadDailyPromise(promise) {
    document.getElementById('dailyPromiseTitle').textContent = promise.title;
    document.getElementById('dailyDomain').innerHTML = `<i class="fas fa-building"></i><span>${promise.domain}</span>`;
    document.getElementById('dailyStatus').className = `article-status status-${promise.status}`;
    document.getElementById('dailyStatus').innerHTML = getStatusHTML(promise.status);
    document.getElementById('dailyLead').innerHTML = `<i class="fas fa-quote-left"></i>${promise.description.substring(0, 100)}...`;
    document.getElementById('dailyObjective').textContent = promise.description;
    document.getElementById('dailyProgress').textContent = promise.progress;
    document.getElementById('dailyDeadline').textContent = '2027';
    document.getElementById('dailyStatusLabel').textContent = getStatusLabel(promise.status);
    document.getElementById('dailyUpdates').innerHTML = `
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
    
    document.getElementById('resultsInfo').textContent = `${promises.length} engagement(s) trouvé(s)`;
}

function loadNews() {
    const grid = document.getElementById('newsGrid');
    grid.innerHTML = '';
    
    const news = [
        {
            title: 'Lancement du programme de santé gratuit',
            date: '28 Janvier 2026',
            summary: 'Le gouvernement lance officiellement le programme de gratuité des soins...'
        },
        {
            title: 'Inauguration de 20 nouvelles écoles',
            date: '25 Janvier 2026',
            summary: 'Le président inaugure 20 nouvelles écoles dans les régions rurales...'
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
    grid.innerHTML = '';
    
    const newspapers = [
        { name: 'Le Soleil', date: '30 Janvier 2026' },
        { name: "L'Observateur", date: '29 Janvier 2026' },
        { name: 'WalFadjri', date: '28 Janvier 2026' },
        { name: 'Sud Quotidien', date: '27 Janvier 2026' }
    ];
    
    newspapers.forEach(paper => {
        const card = document.createElement('div');
        card.className = 'newspaper-card';
        card.innerHTML = `
            <div class="newspaper-preview">
                <i class="fas fa-newspaper fa-5x"></i>
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
    
    // Stats
    document.getElementById('totalVotes').textContent = '588';
    document.getElementById('avgRating').textContent = '4.3';
    document.getElementById('totalServices').textContent = '8';
    
    // Votes par service
    const votesList = document.getElementById('votesByService');
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

// ========== FONCTIONS UTILITAIRES ==========

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

function handleScroll() {
    // Progress indicator
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
    document.querySelector('.progress-indicator').style.width = `${scrollPercent}%`;
    
    // Scroll to top button
    const scrollToTopBtn = document.getElementById('scrollToTop');
    if (scrollTop > 300) {
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (scrollTop > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
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
    filtersSection.classList.toggle('active');
}

function resetFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('domainFilter').value = 'all';
    document.getElementById('searchFilter').value = '';
    showNotification('Filtres réinitialisés', 'info');
}

function exportData() {
    showNotification('Exportation en cours...', 'info');
}

function showMorePromises() {
    document.getElementById('showMoreBtn').style.display = 'none';
    document.getElementById('showLessBtn').style.display = 'inline-flex';
}

function showLessPromises()
