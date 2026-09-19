
/**
 * Displays the correct scene for user scroll position.
 */
class SceneDirector {
    doc; // document global
    view; // window global
    imagePaths; // array of scene image paths

    imageLoader; // ImageLoader
    sceneMap; // SceneMap
    scenePainter; // ScenePainter

    #isFrameLoading; // bool, true when scroll animation frame is loading
    #activationRatio; // ratio of screen height from top of viewport that anchor must reach to display scene

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

    start() {
        this.imageLoader = new ImageLoader(this.imagePaths);
        this.sceneMap = new SceneMap(this.doc, this.imagePaths.length, this.#activationRatio)
        this.scenePainter = new ScenePainter(this.doc, this.imageLoader);

        // paint the first scene
        this.sceneMap.measure()
        const [index, imgPath] = this.#currentSceneAndPath();
        this.imageLoader.preloadAll(index).then()
        this.scenePainter.paintFirst(imgPath)
        this.#candidate = imgPath;

        // set events
        this.view.addEventListener('resize', () => {
            this.sceneMap.measure();
            this.#onScroll()
        })
        this.view.addEventListener('scroll', () => {
            this.#onScroll()
        })

        // Webfonts land after first paint and shove every anchor down the page.
        if (this.doc.fonts && this.doc.fonts.ready) {
            this.doc.fonts.ready.then(() => {
                this.sceneMap.measure();
                this.#onScroll()
            });
        }
    }

    update() {
        this.#isFrameLoading = false;
        const path = this.#currentScenePath();
        if (path === this.#candidate) { return; }   // same scene: let the clock run
        this.#candidate = path;
        clearTimeout(this.#settleTimer);
        this.#settleTimer = setTimeout(() => this.scenePainter.paintNext(path), this.#settleMs);
    }

    #onScroll() {
        if(this.#isFrameLoading) return;
        this.#isFrameLoading = true;
        requestAnimationFrame(() => { this.update() })
    }

    #currentSceneAndPath() {
        const index = this.sceneMap.sceneForScroll();
        const imgPath = this.imagePaths[index];
        return [index, imgPath];
    }

    #currentScenePath() {
        return this.imagePaths[this.sceneMap.sceneForScroll()];
    }
}