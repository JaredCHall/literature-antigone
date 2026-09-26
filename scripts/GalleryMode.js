
export class GalleryMode {
    #onEnter; // callback - fires when entering gallery mode and returns the img.ready promise of the current scene
    #onExit; // callback - fires when exiting gallery mode
    #paintNext; // callback - fires when next scene should be painted and returns the img.ready promise

    #body; // holds reference to document.body
    #toggleBtn; // element with #gallery-toggle

    #sceneDisplayTime; // ms - length of time to display each scene

    #run = 0; // increments on each gallery enter / exit
    #displayTimer; // timer for next paint

    constructor(
        document,
        onEnter,
        onExit,
        paintNext,
        sceneDisplayTime = 10000
    ) {
        this.#onEnter = onEnter;
        this.#onExit = onExit;
        this.#paintNext = paintNext;
        this.#body = document.body;
        this.#toggleBtn = document.getElementById('gallery-toggle');
        this.#sceneDisplayTime = sceneDisplayTime;

        if (typeof onEnter !== 'function') { throw new TypeError('GalleryMode needs an onEnter function.') }
        if (typeof onExit !== 'function') { throw new TypeError('GalleryMode needs an onExit function.') }
        if (typeof paintNext !== 'function') { throw new TypeError('GalleryMode needs a paintNext() function.') }
        if (!this.#toggleBtn){ throw new Error('element with #gallery-toggle not found') }
        if (!(Number.isFinite(sceneDisplayTime) && sceneDisplayTime > 0)) {
            throw new TypeError('GalleryMode sceneDisplayTime must be a positive number.');
        }

        // upgrade toggle button
        this.#toggleBtn.addEventListener('click', () => { this.#toggleMode() });
        document.addEventListener('keydown', (e) => {
            if (!e.repeat && (e.key === 'g' || e.key === 'G') && !(e.ctrlKey || e.metaKey || e.altKey)){
                this.#toggleMode();
            }
        });
        this.#toggleBtn.innerHTML = '&#9728;';
        this.#toggleBtn.title = 'Hide text (or press G)';
    }

    #toggleMode() {
        const isGallery = this.#body.classList.toggle('gallery-mode');

        if(isGallery){
            this.#toggleBtn.innerHTML = '&#9729;';
            this.#toggleBtn.title = 'Show text (or press G)';
            this.#run++;
            void this.#setTimer(this.#onEnter());
        }else{
            this.#toggleBtn.innerHTML = '&#9728;';
            this.#toggleBtn.title = 'Hide text (or press G)';
            clearTimeout(this.#displayTimer);
            this.#run++;
            this.#onExit();
        }
    }

    async #setTimer(imgReady) {
        const run = this.#run;
        await imgReady;
        if(run !== this.#run){
            // exited or re-entered while decoding
            return;
        }

        this.#displayTimer = setTimeout(() => {
            this.#setTimer(this.#paintNext());
        }, this.#sceneDisplayTime);
    }
}