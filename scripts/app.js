// Configuration
const SLIDE_INTERVAL_MS = 8000;

const images = [
    'images/antigone-ismene.webp',
    'images/creon-decree.webp',
    'images/comic-guard.webp',
    'images/chorus.webp',
    'images/antigone-creon.webp',
    'images/creon-haemon.webp',
    'images/antigone-tomb.webp',
    'images/creon-teiresias.webp',
    'images/messengers-report.webp',
    'images/creon-collapse.webp',
];

function initMural() {
    const layerA = document.getElementById('scene-a');
    const layerB = document.getElementById('scene-b');

    if (!layerA || !layerB) {
        console.error('Mural: scene layers not found.');
        return;
    }

    let current = 0;
    let activeLayer = layerA;
    let inactiveLayer = layerB;

    function preloadImage(src) {
        const img = new Image();
        img.src = src;
    }

    function crossfade() {
        const next = (current + 1) % images.length;
        const afterNext = (next + 1) % images.length;

        inactiveLayer.style.backgroundImage = `url('${images[next]}')`;
        activeLayer.classList.add('hidden');
        inactiveLayer.classList.remove('hidden');

        [activeLayer, inactiveLayer] = [inactiveLayer, activeLayer];
        current = next;

        preloadImage(images[afterNext]);
    }

    // Set first image and preload the second
    activeLayer.style.backgroundImage = `url('${images[0]}')`;
    preloadImage(images[1]);

    setInterval(crossfade, SLIDE_INTERVAL_MS);

    // Gallery toggle
    const toggleBtn = document.getElementById('gallery-toggle');

    function toggleGallery() {
        const isGallery = document.body.classList.toggle('gallery-mode');
        toggleBtn.innerHTML = isGallery ? '&#9729;' : '&#9728;';
        toggleBtn.title = isGallery ? 'Show text (or press G)' : 'Hide text (or press G)';
    }

    toggleBtn.addEventListener('click', toggleGallery);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'g' || e.key === 'G') toggleGallery();
    });
}

document.addEventListener('DOMContentLoaded', initMural);