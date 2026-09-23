/**
 * Maps scroll position to scene.
 *
 * Scene anchors are `.scene-marker` elements carrying a
 * `data-scene` attribute. No anchors at all, throws.
 */
export class SceneMap {

    anchors = [];   // anchor elements in document order
    offsets = [];   // document-top offsets, parallel to anchors
    paths = [];     // scene image paths

    doc = null;
    view = null;
    activationRatio = null;

    constructor(
        document, // document global
        activationRatio = 0.35 // ratio of screen height from top of viewport that anchor must reach to display scene
    ) {
        this.doc = document;
        this.view = this.doc.defaultView;
        this.activationRatio = activationRatio;

        if(!this.view){ throw new Error('No scene view found at document.defaultView'); }
        if(!this.#validateActivationRatio(this.activationRatio)){
            throw new Error(`Invalid activation ratio: ${this.activationRatio}`);
        }

        // final scene-data anchors
        this.doc.querySelectorAll('h2.scene-marker[data-scene]').forEach((el) => {
            this.anchors.push(el);
            this.paths.push(el.dataset.scene);
        });
        if(!this.anchors.length){
            throw new Error('No scene anchors found in document.');
        }
    }

    /**
     * Records each anchor's offset from the top of the document.
     *
     * Call before the first sceneForScroll(), and again whenever layout
     * may have moved the anchors (resize, webfont load). Rects are read
     * before scrollY because the layout they force can move the scroll
     * position, e.g. when the browser restores it on reload.
     */
    measure(){
        const tops = this.anchors.map((el) => el.getBoundingClientRect().top);
        const scroll = this.view.scrollY;
        this.offsets = tops.map((t) => t + scroll);
    }

    /**
     * Returns the image src of the scene for the current scroll position.
     *
     * Above the first anchor (the title block), this returns the first anchor's scene.
     * At the bottom of the page, it returns the last anchor's scene,
     * even if that anchor never reaches the activation line.
     * Uses offsets from the last measure(); throws if never measured.
     */
    sceneForScroll(){
        if(this.offsets.length !== this.anchors.length){
            throw Error('Anchors and offsets have different lengths. Must call .measure() before .sceneForScroll()');
        }

        const doc = this.doc.documentElement;
        const bottom = this.view.scrollY + this.view.innerHeight >= doc.scrollHeight - 2;
        if (bottom) return this.paths[this.anchors.length - 1];

        const line = this.view.scrollY + this.view.innerHeight * this.activationRatio;

        // The last anchor that has crossed the line; above them all, the first scene.
        const index = Math.max(0, this.offsets.findLastIndex((top) => top <= line));
        return this.paths[index];
    }

    #validateActivationRatio(n){
        return Number.isFinite(n) &&  n >= 0 && n <= 1;
    }
}