// ==========================================
// CONFIGURATION GLOBALE AVEC FONCTIONNALITÉS AVANCÉES
// ==========================================
const CONFIG = {
  // ... configuration existante ...
  visibleCount: 6,
  currentVisible: 6,
  carouselIndex: 0,
  carouselAutoPlay: true,
  pressViewerIndex: 0,
  zoomLevel: 1,
  ratings: [],
  kpiInterval: null,
  promisesCarouselInterval: null
};

// ==========================================
// INITIALISATION AMÉLIORÉE
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initialisation de la plateforme moderne...');
  await loadData();
  setupEventListeners();
  setupCarousel();
  setupServiceRatings();
  setupDailyPromise();
  setupPromisesCarousel();
  setupKpiCarousel();
  setupPressViewer();
  setupRatingDashboard();
  setupVisibilityControls();
  console.log('✅ Plateforme initialisée avec toutes les fonctionnalités');
});

// ==========================================
// CAROUSEL DES KPI
// ==========================================
function setupKpiCarousel() {
  const carousel = document.getElementById('kpiCarousel');
  const prevBtn = document.getElementById('kpiPrev');
  const nextBtn = document.getElementById('kpiNext');
  const dotsContainer = document.getElementById('kpiDots');
  
  if (!carousel) return;
  
  // KPI à afficher dans le carousel
  const kpis = [
    { id: 'total', label: 'Total Engagements', value: '0', trend: null },
    { id: 'realise', label: 'Réalisés', value: '0', trend: 'positive' },
    { id: 'retard', label: 'En Retard', value: '0', trend: 'negative' },
    { id: 'encours', label: 'En Cours', value: '0', trend: null },
    { id: 'taux-realisation', label: 'Taux Réalisation', value: '0%', trend: 'positive' },
    { id: 'delai-moyen', label: 'Délai Moyen Restant', value: '0j', trend: null },
    { id: 'moyenne-notes', label: 'Note Moyenne', value: '0.0', trend: null },
    { id: 'avec-maj', label: 'Avec Mises à Jour', value: '0', trend: 'positive' }
  ];
  
  // Rendu des KPI
  carousel.innerHTML = kpis.map(kpi => `
    <div class="kpi-slide" data-kpi="${kpi.id}">
      <div class="kpi-value">${kpi.value}</div>
      <div class="kpi-label">${kpi.label}</div>
      ${kpi.trend ? `
        <div class="kpi-trend ${kpi.trend}">
          <i class="fas fa-arrow-${kpi.trend === 'positive' ? 'up' : 'down'}"></i>
          <span>${kpi.trend === 'positive' ? 'En hausse' : 'En baisse'}</span>
        </div>
      ` : ''}
    </div>
  `).join('');
  
  // Création des points de navigation
  const slideCount = kpis.length;
  dotsContainer.innerHTML = '';
  for (let i = 0; i < slideCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => scrollToKpiSlide(i));
    dotsContainer.appendChild(dot);
  }
  
  // Navigation
  prevBtn.addEventListener('click', () => scrollKpi(-1));
  nextBtn.addEventListener('click', () => scrollKpi(1));
  
  // Défilement automatique
  startKpiAutoScroll();
}

function scrollKpi(direction) {
  const carousel = document.getElementById('kpiCarousel');
  const dots = document.querySelectorAll('#kpiDots .carousel-dot');
  const slideWidth = document.querySelector('.kpi-slide').offsetWidth + 16; // 16px pour le gap
  
  CONFIG.kpiIndex = (CONFIG.kpiIndex || 0) + direction;
  const slides = Math.floor(carousel.offsetWidth / slideWidth);
  const maxIndex = Math.ceil(carousel.scrollWidth / slideWidth) - slides;
  
  if (CONFIG.kpiIndex < 0) CONFIG.kpiIndex = maxIndex;
  if (CONFIG.kpiIndex > maxIndex) CONFIG.kpiIndex = 0;
  
  carousel.scrollTo({
    left: CONFIG.kpiIndex * slideWidth,
    behavior: 'smooth'
  });
  
  // Mettre à jour les points actifs
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === CONFIG.kpiIndex % dots.length);
  });
}

function scrollToKpiSlide(index) {
  const carousel = document.getElementById('kpiCarousel');
  const slideWidth = document.querySelector('.kpi-slide').offsetWidth + 16;
  
  CONFIG.kpiIndex = index;
  carousel.scrollTo({
    left: index * slideWidth,
    behavior: 'smooth'
  });
  
  // Mettre à jour les points actifs
  document.querySelectorAll('#kpiDots .carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

function startKpiAutoScroll() {
  stopKpiAutoScroll();
  CONFIG.kpiInterval = setInterval(() => scrollKpi(1), 5000);
}

function stopKpiAutoScroll() {
  if (CONFIG.kpiInterval) {
    clearInterval(CONFIG.kpiInterval);
    CONFIG.kpiInterval = null;
  }
}

// ==========================================
// PROMESSES EN CAROUSEL (6 premières en retard)
// ==========================================
function setupPromisesCarousel() {
  const carousel = document.getElementById('promisesCarousel');
  const dotsContainer = document.getElementById('promisesCarouselDots');
  const toggleBtn = document.getElementById('autoPlayToggle');
  const toggleSwitch = toggleBtn.querySelector('.toggle-switch');
  
  if (!carousel || CONFIG.promises.length === 0) return;
  
  // Trier pour avoir les retards en premier, limité à 6
  const delayedPromises = CONFIG.promises
    .filter(p => p.isLate)
    .slice(0, 6);
  
  // Si moins de 6 retards, compléter avec d'autres promesses
  const carouselPromises = delayedPromises.length >= 6 
    ? delayedPromises 
    : [...delayedPromises, ...CONFIG.promises
        .filter(p => !p.isLate)
        .slice(0, 6 - delayedPromises.length)];
  
  // Rendu du carousel
  carousel.innerHTML = carouselPromises.map(promise => `
    <div class="promise-slide">
      ${createPromiseCard(promise, true)}
    </div>
  `).join('');
  
  // Points de navigation
  dotsContainer.innerHTML = '';
  for (let i = 0; i < carouselPromises.length; i++) {
    const dot = document.createElement('div');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => scrollToPromiseSlide(i));
    dotsContainer.appendChild(dot);
  }
  
  // Toggle auto-play
  toggleBtn.addEventListener('click', () => {
    toggleSwitch.classList.toggle('active');
    CONFIG.carouselAutoPlay = !CONFIG.carouselAutoPlay;
    if (CONFIG.carouselAutoPlay) {
      startPromisesCarouselAutoPlay();
    } else {
      stopPromisesCarouselAutoPlay();
    }
  });
  
  // Défilement automatique
  startPromisesCarouselAutoPlay();
}

function scrollToPromiseSlide(index) {
  const carousel = document.getElementById('promisesCarousel');
  const slideWidth = document.querySelector('.promise-slide').offsetWidth + 16;
  
  carousel.scrollTo({
    left: index * slideWidth,
    behavior: 'smooth'
  });
  
  // Mettre à jour les points actifs
  document.querySelectorAll('#promisesCarouselDots .carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

function startPromisesCarouselAutoPlay() {
  stopPromisesCarouselAutoPlay();
  CONFIG.promisesCarouselInterval = setInterval(() => {
    const carousel = document.getElementById('promisesCarousel');
    const dots = document.querySelectorAll('#promisesCarouselDots .carousel-dot');
    const slideWidth = document.querySelector('.promise-slide').offsetWidth + 16;
    
    CONFIG.carouselIndex = (CONFIG.carouselIndex + 1) % dots.length;
    
    carousel.scrollTo({
      left: CONFIG.carouselIndex * slideWidth,
      behavior: 'smooth'
    });
    
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === CONFIG.carouselIndex);
    });
  }, 10000); // 10 secondes
}

function stopPromisesCarouselAutoPlay() {
  if (CONFIG.promisesCarouselInterval) {
    clearInterval(CONFIG.promisesCarouselInterval);
    CONFIG.promisesCarouselInterval = null;
  }
}

// ==========================================
// GESTION DE LA VISIBILITÉ DES PROMESSES
// ==========================================
function setupVisibilityControls() {
  const showMoreBtn = document.getElementById('showMoreBtn');
  const showLessBtn = document.getElementById('showLessBtn');
  const visibleCountEl = document.getElementById('visible-count');
  const totalCountEl = document.getElementById('total-count');
  
  if (!showMoreBtn || !showLessBtn) return;
  
  // Initialiser les compteurs
  totalCountEl.textContent = CONFIG.promises.length;
  updateVisibleCount();
  
  // Événements
  showMoreBtn.addEventListener('click', () => {
    CONFIG.currentVisible = Math.min(CONFIG.currentVisible + CONFIG.visibleCount, CONFIG.promises.length);
    applyVisibility();
    updateVisibleCount();
    
    if (CONFIG.currentVisible >= CONFIG.promises.length) {
      showMoreBtn.style.display = 'none';
      showLessBtn.style.display = 'inline-flex';
    }
  });
  
  showLessBtn.addEventListener('click', () => {
    CONFIG.currentVisible = CONFIG.visibleCount;
    applyVisibility();
    updateVisibleCount();
    
    showMoreBtn.style.display = 'inline-flex';
    showLessBtn.style.display = 'none';
  });
  
  // Initialiser l'affichage
  applyVisibility();
}

function applyVisibility() {
  const cards = document.querySelectorAll('#promisesContainer .promise-card');
  cards.forEach((card, index) => {
    if (index < CONFIG.currentVisible) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
}

function updateVisibleCount() {
  const visibleCountEl = document.getElementById('visible-count');
  if (visibleCountEl) {
    visibleCountEl.textContent = Math.min(CONFIG.currentVisible, CONFIG.promises.length);
  }
}

// ==========================================
// PROMESSE DU JOUR FORMAT ARTICLE
// ==========================================
function setupDailyPromise() {
  const today = new Date();
  const dayIndex = today.getDate() % CONFIG.promises.length;
  const promise = CONFIG.promises[dayIndex];
  
  if (!promise) return;
  
  // Trouver une personne pour l'article
  const personIndex = dayIndex % DAILY_PEOPLE.length;
  const person = DAILY_PEOPLE[personIndex];
  
  const articleHTML = `
    <div class="daily-article">
      <div class="article-header">
        <div class="article-date">
          <i class="fas fa-calendar-alt"></i>
          ${today.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        <h2 class="article-title">${promise.engagement}</h2>
        <p class="article-subtitle">Analyse et perspectives par ${person.name}</p>
      </div>
      
      <div class="article-content">
        <div class="article-section">
          <h3><i class="fas fa-user-tie"></i> Expert du jour</h3>
          <div class="expert-info">
            <div class="expert-avatar">${person.avatar}</div>
            <div class="expert-details">
              <h4>${person.name}</h4>
              <p>${person.role}</p>
            </div>
          </div>
          <p>${person.article}</p>
        </div>
        
        <div class="article-section">
          <h3><i class="fas fa-bullseye"></i> Engagement analysé</h3>
          <p><strong>${promise.engagement}</strong></p>
        </div>
        
        <div class="article-section">
          <h3><i class="fas fa-chart-line"></i> Résultats attendus</h3>
          <p>${promise.resultat}</p>
        </div>
        
        <div class="article-highlights">
          <div class="highlight-item">
            <div class="highlight-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="highlight-content">
              <h4>Délai de réalisation</h4>
              <p>${promise.delai}</p>
            </div>
          </div>
          
          <div class="highlight-item">
            <div class="highlight-icon">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="highlight-content">
              <h4>Domaine</h4>
              <p>${promise.domaine}</p>
            </div>
          </div>
          
          <div class="highlight-item">
            <div class="highlight-icon">
              <i class="fas fa-flag"></i>
            </div>
            <div class="highlight-content">
              <h4>État actuel</h4>
              <p>${promise.status === 'realise' ? '✅ Réalisé' : 
                   promise.status === 'encours' ? '🔄 En cours' : 
                   '⏳ Non lancé'}</p>
            </div>
          </div>
        </div>
        
        <div class="article-section">
          <h3><i class="fas fa-calendar-check"></i> Calendrier des mesures clés</h3>
          <p>${generateTimeline(promise)}</p>
        </div>
      </div>
      
      <div class="article-footer">
        <div class="article-source">
          Source: Programme du Projet Sénégal Souverain, Juste et Prospère
        </div>
        <div class="article-share">
          <button class="share-btn share-twitter" onclick="shareArticle()">
            <i class="fab fa-twitter"></i>
          </button>
          <button class="share-btn share-facebook" onclick="shareArticle()">
            <i class="fab fa-facebook-f"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('dailyPromise').innerHTML = articleHTML;
}

function generateTimeline(promise) {
  const deadline = calculateDeadline(promise.delai);
  const now = new Date();
  const months = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24 * 30));
  
  if (months <= 3) {
    return "• Mesures immédiates (0-3 mois)<br>• Évaluation à mi-parcours (1-2 mois)<br>• Suivi régulier hebdomadaire";
  } else if (months <= 12) {
    return "• Phase préparatoire (1-3 mois)<br>• Mise en œuvre (4-9 mois)<br>• Évaluation finale (10-12 mois)";
  } else {
    return "• Phase de planification (1-6 mois)<br>• Déploiement progressif (7-18 mois)<br>• Consolidation et évaluation (19-24 mois)";
  }
}

// ==========================================
// TABLEAU DE BORD DES NOTATIONS
// ==========================================
async function setupRatingDashboard() {
  // Charger les notations depuis Supabase
  await loadServiceRatings();
  
  // Mettre à jour les statistiques
  updateRatingStats();
  
  // Afficher le top des services
  displayTopServices();
  
  // Créer le graphique
  createRatingsChart();
}

async function loadServiceRatings() {
  if (!supabaseClient) return;
  
  try {
    const { data, error } = await supabaseClient
      .from('service_ratings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    CONFIG.ratings = data || [];
  } catch (error) {
    console.error('Erreur chargement notations:', error);
    // Charger depuis localStorage en fallback
    const saved = localStorage.getItem('serviceRatings');
    if (saved) {
      CONFIG.ratings = JSON.parse(saved);
    }
  }
}

function updateRatingStats() {
  const totalRatings = CONFIG.ratings.length;
  const servicesRated = [...new Set(CONFIG.ratings.map(r => r.service))].length;
  
  // Calculer la moyenne générale
  let totalScore = 0;
  CONFIG.ratings.forEach(rating => {
    totalScore += (parseInt(rating.accessibility) + parseInt(rating.welcome) + 
                   parseInt(rating.efficiency) + parseInt(rating.transparency)) / 4;
  });
  
  const avgRating = totalRatings > 0 ? (totalScore / totalRatings).toFixed(1) : '0.0';
  
  // Dernière notation
  const lastRating = CONFIG.ratings.length > 0 
    ? new Date(CONFIG.ratings[0].created_at || new Date()).toLocaleDateString('fr-FR')
    : '-';
  
  // Mettre à jour l'interface
  document.getElementById('totalRatings').textContent = totalRatings;
  document.getElementById('avgRating').textContent = avgRating;
  document.getElementById('servicesRated').textContent = servicesRated;
  document.getElementById('lastRating').textContent = lastRating;
}

function displayTopServices() {
  const services = {};
  
  // Calculer les moyennes par service
  CONFIG.ratings.forEach(rating => {
    if (!services[rating.service]) {
      services[rating.service] = { total: 0, count: 0, ratings: [] };
    }
    
    const avg = (parseInt(rating.accessibility) + parseInt(rating.welcome) + 
                 parseInt(rating.efficiency) + parseInt(rating.transparency)) / 4;
    
    services[rating.service].total += avg;
    services[rating.service].count++;
    services[rating.service].ratings.push(avg);
  });
  
  // Convertir en tableau et trier
  const servicesArray = Object.entries(services).map(([name, data]) => ({
    name: name,
    average: (data.total / data.count).toFixed(1),
    count: data.count,
    ratings: data.ratings
  })).sort((a, b) => b.average - a.average).slice(0, 5);
  
  // Afficher
  const container = document.getElementById('topServicesList');
  container.innerHTML = servicesArray.map((service, index) => `
    <div class="rating-item">
      <div class="rating-rank">#${index + 1}</div>
      <div class="rating-service">
        <h4>${getServiceName(service.name)}</h4>
      </div>
      <div class="rating-score">
        <div class="rating-stars-small">
          ${generateStars(service.average, true)}
        </div>
        <span class="rating-average">${service.average}/5</span>
        <span class="rating-count">(${service.count} votes)</span>
      </div>
    </div>
  `).join('');
}

function getServiceName(key) {
  const names = {
    'administration': 'Administration Générale',
    'sante': 'Santé Publique',
    'education': 'Éducation Nationale',
    'justice': 'Justice',
    'interieur': 'Intérieur & Sécurité',
    'finance': 'Finances & Impôts',
    'transport': 'Transports',
    'autre': 'Autre'
  };
  return names[key] || key;
}

function createRatingsChart() {
  const ctx = document.getElementById('ratingsChart');
  if (!ctx || CONFIG.ratings.length === 0) return;
  
  // Compter les notes par étoile
  const starsCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  CONFIG.ratings.forEach(rating => {
    const avg = (parseInt(rating.accessibility) + parseInt(rating.welcome) + 
                 parseInt(rating.efficiency) + parseInt(rating.transparency)) / 4;
    const rounded = Math.round(avg);
    starsCount[rounded] = (starsCount[rounded] || 0) + 1;
  });
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
      datasets: [{
        label: 'Nombre de notes',
        data: [starsCount[1], starsCount[2], starsCount[3], starsCount[4], starsCount[5]],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 205, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)'
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Nombre: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// ==========================================
// VISIONNEUSE DE PRESSE
// ==========================================
function setupPressViewer() {
  const viewer = document.getElementById('pressViewer');
  const closeBtn = document.getElementById('closeViewer');
  const prevBtn = document.getElementById('viewerPrev');
  const nextBtn = document.getElementById('viewerNext');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const resetZoomBtn = document.getElementById('resetZoom');
  const zoomInToolbar = document.getElementById('zoomIn');
  const zoomOutToolbar = document.getElementById('zoomOut');
  const counter = document.getElementById('pressCounter');
  
  let currentSlide = 0;
  const totalSlides = 5;
  let isDragging = false;
  let startX, startY, scrollLeft, scrollTop;
  
  // Ouvrir la visionneuse
  document.querySelectorAll('.newspaper-card, .press-carousel .carousel-item').forEach((item, index) => {
    item.addEventListener('click', () => {
      currentSlide = index % totalSlides;
      openViewer();
    });
  });
  
  // Fermer
  closeBtn.addEventListener('click', closeViewer);
  viewer.addEventListener('click', (e) => {
    if (e.target === viewer) closeViewer();
  });
  
  // Navigation
  prevBtn.addEventListener('click', () => navigateViewer(-1));
  nextBtn.addEventListener('click', () => navigateViewer(1));
  
  // Zoom
  zoomInBtn.addEventListener('click', () => zoomViewer(0.2));
  zoomOutBtn.addEventListener('click', () => zoomViewer(-0.2));
  zoomInToolbar.addEventListener('click', () => zoomViewer(0.2));
  zoomOutToolbar.addEventListener('click', () => zoomViewer(-0.2));
  resetZoomBtn.addEventListener('click', resetZoomViewer);
  
  // Navigation clavier
  document.addEventListener('keydown', (e) => {
    if (!viewer.classList.contains('active')) return;
    
    switch(e.key) {
      case 'Escape':
        closeViewer();
        break;
      case 'ArrowLeft':
        navigateViewer(-1);
        break;
      case 'ArrowRight':
        navigateViewer(1);
        break;
      case '+':
      case '=':
        zoomViewer(0.2);
        break;
      case '-':
        zoomViewer(-0.2);
        break;
      case '0':
        resetZoomViewer();
        break;
    }
  });
  
  // Navigation tactile
  function setupTouchNavigation() {
    const images = viewer.querySelectorAll('.press-viewer-image');
    
    images.forEach(img => {
      // Zoom tactile (double tap/pinch)
      let lastTap = 0;
      img.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
          // Double tap
          img.dataset.zoom = img.dataset.zoom === '2' ? '1' : '2';
          updateZoom(img);
          e.preventDefault();
        }
        lastTap = currentTime;
      });
      
      // Drag pour déplacer l'image zoomée
      img.addEventListener('touchstart', (e) => {
        if (parseFloat(img.dataset.zoom) > 1) {
          isDragging = true;
          startX = e.touches[0].pageX - img.offsetLeft;
          startY = e.touches[0].pageY - img.offsetTop;
          scrollLeft = img.scrollLeft;
          scrollTop = img.scrollTop;
        }
      });
      
      img.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX - img.offsetLeft;
        const y = e.touches[0].pageY - img.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        img.scrollLeft = scrollLeft - walkX;
        img.scrollTop = scrollTop - walkY;
      });
      
      img.addEventListener('touchend', () => {
        isDragging = false;
      });
    });
  }
  
  // Drag souris
  function setupMouseDrag() {
    const images = viewer.querySelectorAll('.press-viewer-image');
    
    images.forEach(img => {
      img.addEventListener('mousedown', (e) => {
        if (parseFloat(img.dataset.zoom) > 1) {
          isDragging = true;
          startX = e.pageX - img.offsetLeft;
          startY = e.pageY - img.offsetTop;
          scrollLeft = img.scrollLeft;
          scrollTop = img.scrollTop;
        }
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - img.offsetLeft;
        const y = e.pageY - img.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        img.scrollLeft = scrollLeft - walkX;
        img.scrollTop = scrollTop - walkY;
      });
      
      document.addEventListener('mouseup', () => {
        isDragging = false;
      });
    });
  }
  
  // Fonctions d'aide
  function openViewer() {
    viewer.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateViewer();
    setupTouchNavigation();
    setupMouseDrag();
  }
  
  function closeViewer() {
    viewer.classList.remove('active');
    document.body.style.overflow = '';
    resetZoomViewer();
  }
  
  function navigateViewer(direction) {
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    updateViewer();
  }
  
  function updateViewer() {
    // Mettre à jour les slides
    document.querySelectorAll('.press-viewer-slide').forEach((slide, index) => {
      slide.classList.toggle('active', index === currentSlide);
    });
    
    // Mettre à jour le compteur
    counter.textContent = `${currentSlide + 1} / ${totalSlides}`;
    
    // Mettre à jour les miniatures
    updateThumbnails();
    
    // Réinitialiser le zoom
    resetZoomViewer();
  }
  
  function updateThumbnails() {
    const thumbnails = viewer.querySelectorAll('.press-thumbnail');
    thumbnails.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === currentSlide);
    });
  }
  
  function zoomViewer(amount) {
    const img = viewer.querySelector('.press-viewer-slide.active .press-viewer-image');
    if (!img) return;
    
    let zoom = parseFloat(img.dataset.zoom) || 1;
    zoom = Math.max(0.5, Math.min(3, zoom + amount));
    img.dataset.zoom = zoom;
    
    updateZoom(img);
  }
  
  function updateZoom(img) {
    const zoom = parseFloat(img.dataset.zoom);
    img.style.transform = `scale(${zoom})`;
    img.style.cursor = zoom > 1 ? 'grab' : 'default';
  }
  
  function resetZoomViewer() {
    const img = viewer.querySelector('.press-viewer-slide.active .press-viewer-image');
    if (!img) return;
    
    img.dataset.zoom = 1;
    img.style.transform = 'scale(1)';
    img.style.cursor = 'default';
    img.scrollLeft = 0;
    img.scrollTop = 0;
  }
  
  // Créer les miniatures
  createThumbnails();
}

function createThumbnails() {
  const thumbnailsContainer = document.getElementById('viewerThumbnails');
  const newspapers = [
    'Le Soleil',
    'Sud Quotidien', 
    'WalFadjri',
    'L\'Observateur',
    'Le Quotidien'
  ];
  
  thumbnailsContainer.innerHTML = newspapers.map((paper, index) => `
    <img src="press/thumbnails/${paper.toLowerCase().replace(/\s+/g, '-')}.jpg" 
         alt="${paper}"
         class="press-thumbnail ${index === 0 ? 'active' : ''}"
         data-index="${index}"
         onclick="document.dispatchEvent(new CustomEvent('viewerNavigate', { detail: ${index} }))">
  `).join('');
  
  // Écouter les événements de navigation depuis les miniatures
  document.addEventListener('viewerNavigate', (e) => {
    const viewer = document.getElementById('pressViewer');
    if (viewer.classList.contains('active')) {
      currentSlide = e.detail;
      updateViewer();
    }
  });
}

// ==========================================
// NOTATION DES SERVICES (connectée à Supabase)
// ==========================================
async function submitServiceRating(ratingData) {
  if (!supabaseClient) {
    // Fallback: stocker localement
    ratingData.id = Date.now().toString();
    ratingData.created_at = new Date().toISOString();
    CONFIG.ratings.unshift(ratingData);
    localStorage.setItem('serviceRatings', JSON.stringify(CONFIG.ratings));
    return { success: true, local: true };
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('service_ratings')
      .insert([ratingData])
      .select();
    
    if (error) throw error;
    
    // Ajouter aux données locales
    CONFIG.ratings.unshift(data[0]);
    localStorage.setItem('serviceRatings', JSON.stringify(CONFIG.ratings));
    
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Erreur envoi notation:', error);
    // Fallback local
    ratingData.id = Date.now().toString();
    ratingData.created_at = new Date().toISOString();
    CONFIG.ratings.unshift(ratingData);
    localStorage.setItem('serviceRatings', JSON.stringify(CONFIG.ratings));
    return { success: true, local: true, error: error.message };
  }
}

// ==========================================
// MISE À JOUR DES CARTES PROMESSES
// ==========================================
function createPromiseCard(promise, isCarousel = false) {
  // ... Utiliser la structure de carte complète de votre code original
  // S'assurer d'inclure toutes les informations:
  // - Badge du domaine
  // - Titre de la promesse
  // - Résultat attendu
  // - Délai
  // - Statut avec badge coloré
  // - Bouton pour afficher/masquer les mises à jour
  // - Section de notation (étoiles)
  // - Boutons de partage
  // - Indicateur de retard si applicable
}

// ==========================================
// MISE À JOUR DU HEADER AVEC PDF
// ==========================================
function updateHeaderWithPDF() {
  const headerActions = document.querySelector('.header-actions');
  if (headerActions) {
    // Ajouter le lien PDF à côté de la date de référence
    const pdfLink = document.createElement('a');
    pdfLink.href = 'Livre-Programme-Bassirou-Diomaye-Faye.pdf';
    pdfLink.className = 'pdf-link';
    pdfLink.target = '_blank';
    pdfLink.innerHTML = '<i class="fas fa-file-pdf"></i> Programme Complet (PDF)';
    
    headerActions.appendChild(pdfLink);
  }
}

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================
function generateStars(rating, small = false) {
  const stars = Math.round(rating);
  const fullStars = '★'.repeat(stars);
  const emptyStars = '☆'.repeat(5 - stars);
  return small ? 
    `<i class="fas fa-star"></i>`.repeat(stars) + `<i class="far fa-star"></i>`.repeat(5 - stars) :
    fullStars + emptyStars;
}

// Appeler cette fonction après le chargement
updateHeaderWithPDF();

// Exporter les fonctions nécessaires
window.shareArticle = function() {
  const url = window.location.href.split('#')[0] + '#daily';
  const text = `📰 Promesse du jour: "${CONFIG.promises[new Date().getDate() % CONFIG.promises.length]?.engagement.substring(0, 100)}..."`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Promesse du Jour - Le Projet Sénégal',
      text: text,
      url: url
    });
  } else {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  }
};

// Mettre à jour la configuration globale
window.CONFIG = CONFIG;
