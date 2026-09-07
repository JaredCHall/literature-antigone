// Configuration
const SLIDE_INTERVAL_MS = 8000; // minimum 2500 @see .scene-layer.transition in app.css

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

/**
 * Load and decode an image. Resolves true when the bitmap is ready to paint,
 * false if the file failed to load or decode.
 */
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img.decode().then(() => true, () => false);
}

/**
 * Initializes the gallery mode toggle which activates when
 * GUI icon clicked or letter 'G' is pressed on keyboard.
 */
function initGalleryModeToggle() {
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

function initMural() {
    const layerA = document.getElementById('scene-a');
    const layerB = document.getElementById('scene-b');

    let current = 0;
    let activeLayer = layerA;
    let inactiveLayer = layerB;

    // The next scene starts loading the moment the first one is on screen,
    // so by the time the interval elapses it is almost always already decoded.
    let nextScene = loadImage(images[1]);

    async function advance() {
        const ready = await nextScene;
        const next = (current + 1) % images.length;

        if (ready) {
            inactiveLayer.style.backgroundImage = `url('${images[next]}')`;
            activeLayer.classList.add('hidden');
            inactiveLayer.classList.remove('hidden');
            [activeLayer, inactiveLayer] = [inactiveLayer, activeLayer];
        } else {
            console.warn(`Mural: skipping unavailable scene ${images[next]}`);
        }

        current = next;
        nextScene = loadImage(images[(current + 1) % images.length]);
        setTimeout(advance, SLIDE_INTERVAL_MS);
    }

    activeLayer.style.backgroundImage = `url('${images[0]}')`;
    setTimeout(advance, SLIDE_INTERVAL_MS);
}

document.addEventListener('DOMContentLoaded', () => {
    initMural();
    initGalleryModeToggle();
});