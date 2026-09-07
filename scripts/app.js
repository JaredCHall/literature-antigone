// Scenes are driven by scroll position. Each blockquote carrying a
// `sceneN-start` class marks the point where scene N takes the background;
// the scene holds until the next anchor crosses the activation line.

// Where in the viewport an anchor has to reach to take over, as a fraction
// of viewport height. Lower = scenes change earlier.
const ACTIVATION_LINE = 0.35;

// How long the scroll has to rest on a scene before that scene is worth
// showing. Short enough to feel immediate, long enough that scenes skimmed
// past on the way somewhere else never get painted at all.
const SETTLE_MS = 240;

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

const loads = new Map();

/**
 * Load and decode an image, once per source. Resolves true when the bitmap is
 * ready to paint, false if the file failed to load or decode.
 */
function loadImage(src) {
    let entry = loads.get(src);
    if (!entry) {
        const img = new Image();
        img.src = src;
        // Keep the element, not just its promise. Dropping it lets the browser
        // evict the bitmap, and the scroll back up pays for the file again.
        entry = { img, ready: img.decode().then(() => true, () => false) };
        loads.set(src, entry);
    }
    return entry.ready;
}

/**
 * Reads the `sceneN-start` markers out of the document, in document order.
 * Returns [{ el, index }], where index is the zero-based image it selects.
 */
function collectAnchors() {
    const anchors = [];

    document.querySelectorAll('.quotations .quote').forEach((el) => {
        const match = el.className.match(/\bscene(\d+)-start\b/);
        if (!match) return;

        const index = Number(match[1]) - 1;
        if (index < 0 || index >= images.length) {
            console.warn(`Mural: scene ${match[1]} has no matching image`);
            return;
        }

        anchors.push({ el, index });
    });

    return anchors;
}

/**
 * The layer's crossfade length, read from the stylesheet so the two can't
 * drift apart. Falls back to 2.5s if the transition can't be parsed.
 */
function fadeDuration(el) {
    const raw = getComputedStyle(el).transitionDuration.split(',')[0].trim();
    const ms = raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000;
    return Number.isFinite(ms) && ms > 0 ? ms : 2500;
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

    const anchors = collectAnchors();
    if (!anchors.length) {
        console.warn('Mural: no scene anchors found; background will stay empty');
        return;
    }

    const FADE_MS = fadeDuration(layerA);

    let activeLayer = layerA;
    let inactiveLayer = layerB;

    let offsets = [];
    let painted = -1;   // what is on screen
    let wanted = -1;    // what the scroll position calls for
    let lastSwap = 0;   // when the current fade began
    let timer = null;
    let queued = false;

    /** Cache each anchor's distance from the top of the document. */
    function measure() {
        const top = window.scrollY;
        offsets = anchors.map((a) => a.el.getBoundingClientRect().top + top);
    }

    /** The scene the current scroll position calls for. */
    function sceneForScroll() {
        const doc = document.documentElement;
        const bottom = window.scrollY + window.innerHeight >= doc.scrollHeight - 2;
        if (bottom) return anchors[anchors.length - 1].index;

        const line = window.scrollY + window.innerHeight * ACTIVATION_LINE;

        let index = anchors[0].index; // the title block belongs to the first scene
        for (let i = 0; i < offsets.length; i++) {
            if (offsets[i] > line) break;
            index = anchors[i].index;
        }
        return index;
    }

    /**
     * Names the scene the reader is currently over. Nothing paints yet: the
     * change has to hold still for SETTLE_MS first, and a fade already running
     * has to finish before the next one starts.
     */
    function requestScene(index) {
        if (index === wanted) return;

        wanted = index;

        if (wanted === painted) {
            clearTimeout(timer);
            timer = null;
            return;
        }

        arm(SETTLE_MS);
    }

    function arm(delay) {
        clearTimeout(timer);
        timer = setTimeout(fire, delay);
    }

    function fire() {
        timer = null;
        if (wanted === painted) return;

        // Reusing a layer that is still fading is what makes a cut look like a
        // stumble. Wait out the fade, then go straight to wherever the reader
        // has landed by now.
        const since = performance.now() - lastSwap;
        if (since < FADE_MS) {
            arm(FADE_MS - since);
            return;
        }

        paint(wanted).catch((err) => console.error('Mural: scene paint failed', err));
    }

    /** Crossfade to a scene, once its bitmap is ready. */
    async function paint(index) {
        const ready = await loadImage(images[index]);

        // The reader kept moving while we decoded; a later scene wins.
        if (wanted !== index) {
            arm(SETTLE_MS);
            return;
        }

        if (!ready) {
            console.warn(`Mural: skipping unavailable scene ${images[index]}`);
            return;
        }

        inactiveLayer.style.backgroundImage = `url('${images[index]}')`;
        activeLayer.classList.add('hidden');
        inactiveLayer.classList.remove('hidden');
        [activeLayer, inactiveLayer] = [inactiveLayer, activeLayer];

        painted = index;
        lastSwap = performance.now();
        preloadNeighbors(index);
    }

    /** Scroll runs both ways, so warm the scene on either side. */
    function preloadNeighbors(index) {
        if (index > 0) loadImage(images[index - 1]);
        if (index < images.length - 1) loadImage(images[index + 1]);
    }

    function update() {
        queued = false;
        requestScene(sceneForScroll());
    }

    function onScroll() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
    }

    // First scene goes up without a fade — there is nothing to fade from,
    // and a restored scroll position should open on the right image.
    measure();
    painted = sceneForScroll();
    wanted = painted;
    lastSwap = performance.now() - FADE_MS; // the first real change need not wait
    activeLayer.style.backgroundImage = `url('${images[painted]}')`;
    preloadNeighbors(painted);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        measure();
        onScroll();
    });

    // Webfonts land after first paint and shove every anchor down the page.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            measure();
            onScroll();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMural();
    initGalleryModeToggle();
});