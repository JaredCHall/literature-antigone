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
 * (its duration sets the fade length), and a .hidden class that sets
 * opacity: 0.
 *
 * @typedef {import('./ImageLoader.js').ImageLoader} ImageLoader
 */
export class ScenePainter {

    fadeDuration; // duration of crossfade in milliseconds

    #loader;        // ImageLoader
    #activeLayer;   // scene div currently displayed (fades into)
    #inactiveLayer; // hidden div / previous scene (fades from)

    #current;   // src of loaded image (set when fade starts)
    #wanted;    // most recently requested src — the only one allowed to paint

    #lastSwapMs = 0;    // ms time the last crossfade began
    #nextFadeTimer;             // timer for next fade after current load

    /**
     * @param {Document} document
     * @param {ImageLoader} imageLoader source of decoded scene images
     */
    constructor(document, imageLoader) {
        this.#activeLayer =  document.getElementById('scene-a');
        if(!this.#activeLayer){ throw new Error('No element #scene-a found. Cannot paint scenes.') }

        this.#inactiveLayer =  document.getElementById('scene-b');
        if(!this.#inactiveLayer){ throw new Error('No element #scene-b found. Cannot paint scenes.') }

        this.fadeDuration = this.#fadeDuration(this.#activeLayer);
        if(!this.fadeDuration){ throw new Error('Expected scene layers to have transition duration > 0. (Ex. `transition: opacity 1.5s ease-in-out;`)')}

        this.#loader = imageLoader;
    }

    /** Paints scene immediately */
    cutTo(src){
        this.#clearPending();
        this.#activeLayer.replaceChildren(this.#loader.loadImage(src));
        this.#lastSwapMs = Math.max(this.#lastSwapMs, performance.now() - this.fadeDuration);
        this.#current = src;
        this.#wanted = src;
    }

    /**
     * Schedules the next crossfade. If an image is already fading in,
     * it waits until the fade completes, before changing the scene.
     * Subsequent calls always replace the currently pending next scene.
     */
    fadeTo(src){
        if(src === this.#wanted){ return; }   // already painted, loading, or scheduled
        this.#wanted = src;
        this.#clearPending();                  // any queued fade is now stale
        if(src === this.#current){ return; }   // scrolled back; stay put

        this.#loader.whenReady(src).then((ok) => {
            if (src !== this.#wanted || src === this.#current) { return; } // superseded while loading
            if(!ok){ console.warn(`Mural: failed to decode ${src}`); return; }
            this.#schedule(src);
        });
    }

    #schedule(src){
        this.#clearPending();
        const ms = this.#msUntilFree();
        if(ms <= 0){ return this.#swapLayers(src); }
        this.#nextFadeTimer = setTimeout(() => this.#swapLayers(src), ms);
    }

    #swapLayers(src){
        this.#inactiveLayer.replaceChildren(this.#loader.loadImage(src));
        this.#activeLayer.classList.add('hidden');
        this.#inactiveLayer.classList.remove('hidden');

        [this.#activeLayer, this.#inactiveLayer] = [this.#inactiveLayer, this.#activeLayer];
        this.#current = src;
        this.#lastSwapMs = performance.now();
        this.#clearPending();
    }

    #msUntilFree() {
        const since = performance.now() - this.#lastSwapMs;
        if(since < this.fadeDuration){
            return this.fadeDuration - since;
        }
        return 0;
    }

    #fadeDuration(el){
        const raw = getComputedStyle(el).transitionDuration.split(',')[0].trim();
        const ms = raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000;
        return Number.isFinite(ms) && ms > 0 ? ms : null;
    }

    #clearPending(){
        clearTimeout(this.#nextFadeTimer);
        this.#nextFadeTimer = null;
    }
}