/**
 * Renders scenes with crossfade.
 *
 * Sets timeout to ensure fade is not interrupted before it completes.
 * Allows replacing the next pending fade with subsequent calls to crossfadeTo().
 */
class ScenePainter {

    fadeDuration; // duration of crossfade in milliseconds

    #loader; // ImageLoader
    #activeLayer; // scene div currently displayed (fades into)
    #inactiveLayer; // hidden div / previous scene (fades from)

    #current; // src of loaded image (set when fade starts)
    #wanted; // most recently requested src — the only one allowed to paint

    #lastSwap = 0; // milliseconds, time of last completed swap
    #nextFadeTimer;  // timer for next fade after current load


    constructor(document, imageLoader) {
        this.#activeLayer =  document.getElementById('scene-a');
        if(!this.#activeLayer){ throw new Error('No element #scene-a found. Cannot paint scenes.') }

        this.#inactiveLayer =  document.getElementById('scene-b');
        if(!this.#inactiveLayer){ throw new Error('No element #scene-b found. Cannot paint scenes.') }

        this.fadeDuration = this.#fadeDuration(this.#activeLayer);
        if(!this.fadeDuration){ throw new Error('Expected scene layers to have transition duration > 0. (Ex. `transition: opacity 1.5s ease-in-out;`)')}

        this.#loader = imageLoader;
    }

    // Paints the first scene immediately
    paintFirst(src){
        this.#activeLayer.replaceChildren(this.#loader.loadImage(src));
        this.#lastSwap = performance.now() - this.fadeDuration;
        this.#current = src;
        this.#wanted = src;
    }

    // Schedules the next crossfade. If an image is already fading in,
    // it waits until the fade completes, before changing the scene.
    // Subsequent calls always replace the currently pending next scene.
    paintNext(src){
        if(src === this.#wanted){ return; }   // already painted, loading, or scheduled
        this.#wanted = src;
        this.#clearPending();                  // any queued fade is now stale
        if(src === this.#current){ return; }   // scrolled back; stay put

        this.#loader.whenReady(src).then((ok) => {
            if(src !== this.#wanted){ return; } // superseded while loading
            if(!ok){ console.warn(`Mural: failed to decode ${src}`); return; }
            this.#schedule(src);
        });
    }

    #schedule(src){
        const ms = this.#msUntilFree();
        if(ms <= 0){ return this.#crossfadeTo(src); }
        this.#nextFadeTimer = setTimeout(() => this.#crossfadeTo(src), ms);
    }

    #crossfadeTo(src){
        this.#inactiveLayer.replaceChildren(this.#loader.loadImage(src));
        this.#activeLayer.classList.add('hidden');
        this.#inactiveLayer.classList.remove('hidden');

        [this.#activeLayer, this.#inactiveLayer] = [this.#inactiveLayer, this.#activeLayer];
        this.#current = src;
        this.#lastSwap = performance.now();
        this.#clearPending();
    }

    #msUntilFree() {
        const since = performance.now() - this.#lastSwap;
        if(since < this.fadeDuration){
            return this.fadeDuration - since;
        }
        return 0
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