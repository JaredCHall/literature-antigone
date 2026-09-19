/**
 * Supplies the image for a scene: the element to display, and a promise
 * that resolves true once it is decoded, false if it cannot be.
 * The promise must not reject.
 *
 * @callback LoadScene
 * @param {string} src
 * @returns {{ img: HTMLImageElement, ready: Promise<boolean> }}
 */

/**
 * Paints scenes onto two stacked layers, #scene-a and #scene-b,
 * crossfading between them.
 *
 * fadeTo() crossfades once the image is decoded and any fade in progress
 * has finished; a fade is never interrupted.
 *
 * cutTo() paints a scene immediately, with no fade, and cancels anything pending.
 *
 * Requires both layers in the DOM, an opacity transition on them
 * (its duration sets the fade length), a .hidden class that sets
 * opacity: 0, and a load function that supplies each scene's image.
 */
export class ScenePainter {

    fadeDuration;   // duration of crossfade in milliseconds

    #load;          // LoadScene
    #activeLayer;   // scene div currently displayed (fades into)
    #inactiveLayer; // hidden div / previous scene (fades from)

    #current;       // src on screen (set when its fade starts)
    #wanted;        // most recently requested src — the only one allowed to paint

    #lastSwapMs = 0;    // when the last crossfade began
    #nextFadeTimer = null;  // pending swap, waiting for the current fade to finish

    /**
     * @param {Document} document  holds the #scene-a and #scene-b layers
     * @param {LoadScene} load     source of decoded scene images
     */
    constructor(document, load) {
        if (typeof load !== 'function') {
            throw new TypeError('ScenePainter needs a load(src) function.');
        }
        this.#load = load;

        this.#activeLayer = document.getElementById('scene-a');
        if (!this.#activeLayer) { throw new Error('No element #scene-a found. Cannot paint scenes.'); }

        this.#inactiveLayer = document.getElementById('scene-b');
        if (!this.#inactiveLayer) { throw new Error('No element #scene-b found. Cannot paint scenes.'); }

        this.fadeDuration = this.#fadeDuration(this.#activeLayer);
        if (!this.fadeDuration) {
            throw new Error('Expected scene layers to have transition duration > 0. (Ex. `transition: opacity 1.5s ease-in-out;`)');
        }
    }

    /** Paints a scene immediately, with no fade. */
    cutTo(src) {
        this.#clearPending();
        this.#activeLayer.replaceChildren(this.#load(src).img);
        this.#lastSwapMs = Math.max(this.#lastSwapMs, performance.now() - this.fadeDuration);
        this.#current = src;
        this.#wanted = src;
    }

    /**
     * Schedules the next crossfade. If an image is already fading in,
     * waits until that fade completes before changing the scene.
     * Each call replaces whatever scene was pending.
     */
    fadeTo(src) {
        if (src === this.#wanted) { return; }   // already painted, loading, or scheduled
        this.#wanted = src;
        this.#clearPending();                   // any queued fade is now stale
        if (src === this.#current) { return; }  // scrolled back; stay put

        const { img, ready } = this.#load(src);
        ready.then((ok) => {
            if (src !== this.#wanted || src === this.#current) { return; } // superseded while loading
            if (!ok) { console.warn(`Mural: failed to decode ${src}`); return; }
            this.#schedule(src, img);
        });
    }

    #schedule(src, img) {
        this.#clearPending();
        const ms = this.#msUntilFree();
        if (ms <= 0) {
            this.#swapLayers(src, img);
            return;
        }
        this.#nextFadeTimer = setTimeout(() => this.#swapLayers(src, img), ms);
    }

    #swapLayers(src, img) {
        this.#inactiveLayer.replaceChildren(img);
        this.#activeLayer.classList.add('hidden');
        this.#inactiveLayer.classList.remove('hidden');

        [this.#activeLayer, this.#inactiveLayer] = [this.#inactiveLayer, this.#activeLayer];
        this.#current = src;
        this.#lastSwapMs = performance.now();
        this.#clearPending();
    }

    #msUntilFree() {
        const since = performance.now() - this.#lastSwapMs;
        return Math.max(0, this.fadeDuration - since);
    }

    #fadeDuration(el) {
        const raw = getComputedStyle(el).transitionDuration.split(',')[0].trim();
        const ms = raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000;
        return Number.isFinite(ms) && ms > 0 ? ms : null;
    }

    #clearPending() {
        clearTimeout(this.#nextFadeTimer);
        this.#nextFadeTimer = null;
    }
}