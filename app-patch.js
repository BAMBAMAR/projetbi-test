// ==========================================
// PATCH POUR CORRIGER LES ERREURS
// À ajouter APRÈS le chargement de app.js
// ==========================================

// Correction de la fonction updateStatPercentage
window.updateStatPercentage = function(id, value, total) {
    const el = document.getElementById(id);
    if (el) {
        if (total > 0) {
            const percentage = Math.round((value / total) * 100);
            el.textContent = `${percentage}%`;
        } else {
            el.textContent = '0%';
        }
    } else {
        console.warn(`⚠️ Élément avec id "${id}" non trouvé dans le DOM`);
    }
};

// Correction de la fonction updateStatValue
window.updateStatValue = function(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value || '0';
    } else {
        console.warn(`⚠️ Élément avec id "${id}" non trouvé dans le DOM`);
    }
};

// Vérifier les éléments requis au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Vérification des éléments du DOM...');
    
    const requiredElements = [
        'total', 'realise', 'encours', 'non-lance', 'retard',
        'total-percentage', 'realise-percentage', 'encours-percentage', 
        'non-lance-percentage', 'retard-percentage'
    ];
    
    const missingElements = [];
    
    requiredElements.forEach(id => {
        const el = document.getElementById(id);
        if (!el) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length > 0) {
        console.warn('⚠️ Éléments manquants dans le DOM:', missingElements);
        console.info('💡 Ces éléments seront ignorés lors de la mise à jour des stats');
    } else {
        console.log('✅ Tous les éléments requis sont présents');
    }
    
    // Vérifier les éléments du carousel
    const carouselElements = ['prevBtn', 'nextBtn', 'carouselIndicators', 'pressCarousel'];
    const missingCarousel = carouselElements.filter(id => !document.getElementById(id));
    
    if (missingCarousel.length === 0) {
        console.log('✅ Tous les éléments du carousel sont présents');
    } else {
        console.warn('⚠️ Éléments carousel manquants:', missingCarousel);
    }
});

console.log('✅ Patch app.js chargé avec succès');
