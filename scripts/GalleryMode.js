import {ScenePainter} from "./ScenePainter.js";
import {SceneImages} from "./SceneImages.js";

export class GalleryMode {
    #scenePainter; // ScenePainter
    #paths;
    #onEnter; // callback - fires when entering gallery mode
    #onExit; // callback - fires when exiting gallery mode

    #toggleBtn; // element with #gallery-toggle

    #index = -1;
    #sceneDisplayTime; // ms - length of time to display each scene
    #run = 0; // increments on each gallery enter / exit
    #displayTimer; // timer for next paint

    constructor(
        scenePainter,
        sceneImages,
        onEnter,
        onExit,
        sceneDisplayTime = 10000
    ) {

        if(!(scenePainter instanceof ScenePainter)){ throw new Error('scenePainter must be instance of ScenePainter') }
        if(!(sceneImages instanceof SceneImages)){ throw new Error('sceneImages must be instance of SceneImages') }

        this.#scenePainter = scenePainter;
        this.#paths = sceneImages.paths;
        this.#onEnter = onEnter;
        this.#onExit = onExit;
        this.#sceneDisplayTime = sceneDisplayTime;

        this.#toggleBtn = document.getElementById('gallery-toggle');

        if (typeof onEnter !== 'function') { throw new TypeError('GalleryMode needs an onEnter() callback.') }
        if (typeof onExit !== 'function') { throw new TypeError('GalleryMode needs an onExit() callback.') }
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
        const isGallery = document.body.classList.toggle('gallery-mode');

        if(isGallery){
            // Enter gallery mode
            this.#toggleBtn.innerHTML = '&#9729;';
            this.#toggleBtn.title = 'Show text (or press G)';
            this.#run++;
            this.#index = this.#paths.indexOf(this.#scenePainter.current);
            void this.#setTimer(this.#onEnter());
        }else{
            // Exit gallery Mode
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
            this.#index = (this.#index + 1) % this.#paths.length;
            const ready = this.#scenePainter.fadeTo(this.#paths[this.#index]);
            this.#setTimer(ready);
        }, this.#sceneDisplayTime);
    }
}