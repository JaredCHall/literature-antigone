
import { ImageLoader } from './ImageLoader.js';
import { SceneMap } from './SceneMap.js';
import { ScenePainter } from './ScenePainter.js';
/**
 * Displays the correct scene for user scroll position.
 *
 * On scroll / resize, a scene must hold for settleMs before it's painted,
 * so fast scrolling doesn't crossfade through every scene it passes.
 */
export class SceneDirector {
    doc;        // document global
    view;       // window global

    imageLoader;    // ImageLoader
    sceneMap;       // SceneMap
    scenePainter;   // ScenePainter

    #isFrameLoading;    // bool, true when scroll animation frame is loading
    #activationRatio;   // ratio of screen height from top of viewport that anchor must reach to display scene

    #settleMs;       // ms a scene must hold before it's painted
    #candidate;      // scene path currently waiting out the settle
    #settleTimer;

    constructor(document, activationRatio = 0.35, settleMs= 500) {
        this.doc = document;
        this.view = this.doc.defaultView;

        this.#activationRatio = activationRatio;
        this.#settleMs = settleMs;
    }

    /**
     * Paints first scene and sets up event listeners for future scene loads.
     * Preloads additional images in the background.
     * Handles page reflow on webfonts load.
     */
    start() {
        this.sceneMap = new SceneMap(this.doc, this.#activationRatio)
        this.imageLoader = new ImageLoader(this.sceneMap.paths);
        this.scenePainter = new ScenePainter(this.doc, (src) => this.imageLoader.load(src));

        // paint the first scene
        this.sceneMap.measure();
        const src = this.sceneMap.sceneForScroll();
        this.scenePainter.cutTo(src);
        this.#candidate = src;

        // preload the rest, nearest first; if fonts reflow into a different scene,
        // the order is off by a little, which costs nothing but order
        void this.imageLoader.preloadFrom(src);

        // setup events
        this.view.addEventListener('resize', () => {
            this.sceneMap.measure();
            this.#onScroll();
        })
        this.view.addEventListener('scroll', () => {
            this.#onScroll();
        })
        // Webfonts land after first paint and shove every anchor down the page.
        if (this.doc.fonts && this.doc.fonts.ready) {
            this.doc.fonts.ready.then(() => {
                this.sceneMap.measure();
                const path = this.sceneMap.sceneForScroll();
                if (path === this.#candidate) { return; }   // reflow didn't change the scene
                clearTimeout(this.#settleTimer);
                this.#candidate = path;
                this.scenePainter.cutTo(path);
            });
        }
    }

    /**
     * Requests fadeTo for current scene once settleMs
     * have been reached for the same candidate scene.
     */
    #update() {
        this.#isFrameLoading = false;
        const src = this.sceneMap.sceneForScroll();
        if (src === this.#candidate) { return; }   // same scene: let the clock run
        this.#candidate = src;
        clearTimeout(this.#settleTimer);
        this.#settleTimer = setTimeout(() => this.scenePainter.fadeTo(src), this.#settleMs);
    }

    #onScroll() {
        if(this.#isFrameLoading) return;
        this.#isFrameLoading = true;
        requestAnimationFrame(() => { this.#update(); })
    }
}