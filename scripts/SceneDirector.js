
/**
 * Displays the correct scene for user scroll position.
 */
class SceneDirector {
    doc; // document global
    view; // window global
    imagePaths; // array of scene image paths

    imageLoader; // ImageLoader
    sceneMap; // SchemeMap
    scenePainter; // ScenePainter

    #isFrameLoading; // bool, true when scroll animation frame is loading
    #activationRatio; // ratio of screen height from top of viewport that anchor must reach to display scene

    constructor(document, imagePaths, activationRatio = 0.35) {
        this.doc = document;
        this.view = this.doc.defaultView;
        this.imagePaths = imagePaths;
        this.activationRatio = activationRatio;
    }

    start() {
        this.imageLoader = new ImageLoader(this.imagePaths);
        this.sceneMap = new SceneMap(this.doc, this.imagePaths.length, this.activationRatio)
        this.scenePainter = new ScenePainter(this.doc, this.imageLoader);



        // paint the first scene
        this.sceneMap.measure()
        const [index, imgPath] = this.#currentSceneAndPath();
        this.imageLoader.preloadAll(index).then()
        this.scenePainter.paintFirst(imgPath)

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
        this.scenePainter.paintNext(this.#currentScenePath());
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