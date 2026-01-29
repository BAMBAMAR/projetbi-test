// ==========================================
// CONFIGURATION & INITIALISATION
// ==========================================

const SUPABASE_URL = 'https://jwsdxttjjbfnoufiidkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_joJuW7-vMiQG302_2Mvj5A_sVaD8Wap';
let supabaseClient = null;

try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase initialisé');
    }
} catch (error) {
    console.error('❌ Erreur Supabase:', error);
}

const CONFIG = {
    START_DATE: new Date('2024-04-02'),
    CURRENT_DATE: new Date(),
    promises: [],
    news: [],
    press: [
        { id: '1', title: 'Le Soleil', date: '29/01/2026', image: 'press-images/le-soleil.jpg' },
        { id: '2', title: 'Sud Quotidien', date: '29/01/2026', image: 'press-images/sud-quotidien.jpg' },
        { id: '3', title: 'WalFadjri', date: '29/01/2026', image: 'press-images/walfadjri.jpg' },
        { id: '4', title: 'L\'Observateur', date: '29/01/2026', image: 'press-images/lobservateur.jpg' },
        { id: '5', title: 'Le Quotidien', date: '29/01/2026', image: 'press-images/le-quotidien.jpg' }
    ],
    kpiCarouselInterval: null,
    kpiAutoPlay: true,
    kpiCurrentIndex: 0,
    promisesCarouselInterval: null,
    promisesAutoPlay: true,
    promisesCurrentPage: 0,
    pressCurrentIndex: 0,
    pressZoom: 1,
    displayedPromises: 6,
    INITIAL_DISPLAY: 6,
    INCREMENT: 6
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation...');
    
    initNavigation();
    initScrollEffects();
    initFilters();
    initDateDisplay();
    initKPICarousel();
    initPromisesCarousel();
    initPressViewer();
    initServiceRatings();
    
    await loadData();
    
    console.log('✅ Initialisation terminée');
});


// ==========================================
// NAVIGATION
// ==========================================
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    mobileMenuBtn?.addEventListener('click', () => {
        navMenu.classList.toggle('show');
        mobileMenuBtn.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            const target = document.getElementById(section);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                if (navMenu.classList.contains('show')) {
                    navMenu.classList.remove('show');
                    mobileMenuBtn.classList.remove('active');
                }
            }
        });
    });
}

function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    const scrollToTop = document.getElementById('scrollToTop');
    const progressIndicator = document.getElementById('progressIndicator');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar?.classList.add('scrolled');
        else navbar?.classList.remove('scrolled');
        
        if (window.scrollY > 400) scrollToTop?.classList.add('visible');
        else scrollToTop?.classList.remove('visible');
        
        const winScroll = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (progressIndicator) progressIndicator.style.width = scrolled + '%';
    });

    scrollToTop?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initDateDisplay() {
    const currentDateEl = document.getElementById('current-date');
    if (currentDateEl) {
        const today = new Date();
        currentDateEl.textContent = today.toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}
