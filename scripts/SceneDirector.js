
/**
 * Displays the correct scene for user scroll position.
 *
 * On scroll / resize, a scene must hold for settleMs before it's painted,
 * so fast scrolling doesn't crossfade through every scene it passes.
 */
class SceneDirector {
    doc;        // document global
    view;       // window global
    imagePaths; // array of scene image paths

    imageLoader;    // ImageLoader
    sceneMap;       // SceneMap
    scenePainter;   // ScenePainter

    #isFrameLoading;    // bool, true when scroll animation frame is loading
    #activationRatio;   // ratio of screen height from top of viewport that anchor must reach to display scene

    #settleMs;       // ms a scene must hold before it's painted
    #candidate;      // scene path currently waiting out the settle
    #settleTimer;

    constructor(document, imagePaths, activationRatio = 0.35, settleMs= 500) {
        this.doc = document;
        this.view = this.doc.defaultView;
        this.imagePaths = imagePaths;

        this.#activationRatio = activationRatio;
        this.#settleMs = settleMs;
    }

    /**
     * Paints first scene and sets up event listeners for future scene loads.
     * Preloads additional images in the background.
     * Handles page reflow on webfonts load.
     */
    start() {
        this.imageLoader = new ImageLoader(this.imagePaths);
        this.sceneMap = new SceneMap(this.doc, this.imagePaths.length, this.#activationRatio)
        this.scenePainter = new ScenePainter(this.doc, this.imageLoader);

        // paint the first scene
        this.sceneMap.measure();
        const imgPath = this.#currentScenePath();
        this.scenePainter.cutTo(imgPath);
        this.#candidate = imgPath;

        // preload the rest, nearest first; if fonts reflow into a different scene,
        // the order is off by a little, which costs nothing but order
        void this.imageLoader.preloadFrom(imgPath);

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
                const path = this.#currentScenePath();
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
        const path = this.#currentScenePath();
        if (path === this.#candidate) { return; }   // same scene: let the clock run
        this.#candidate = path;
        clearTimeout(this.#settleTimer);
        this.#settleTimer = setTimeout(() => this.scenePainter.fadeTo(path), this.#settleMs);
    }

    #onScroll() {
        if(this.#isFrameLoading) return;
        this.#isFrameLoading = true;
        requestAnimationFrame(() => { this.#update(); })
    }

    #currentScenePath() {
        return this.imagePaths[this.sceneMap.sceneForScroll()];
    }
}