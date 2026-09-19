/**
 * Finds 'sceneN-start' anchors, tracks offsets, and determines correct scene for current viewport scroll position
 *
 * SceneDirector is expected to call .measure() and .sceneForScroll()
 */
class SceneMap {

    anchors = []; // {index, el} in document order — index is the scene number
    offsets = []; // document-top offsets, parallel to anchors

    doc = null;
    view = null;
    activationRatio = null;

    constructor(
        document, // document global
        imgCount, // number of available scene images
        activationRatio = 0.35 // ratio of screen height from top of viewport that anchor must reach to display scene
    ) {
        this.doc = document;
        this.view = this.doc.defaultView;
        this.activationRatio = activationRatio;

        if(!this.view){ throw new Error('No scene view found at document.defaultView'); }
        if(!this.#validateActivationRatio(this.activationRatio)){
            throw new Error(`Invalid activation ratio: ${this.activationRatio}`);
        }

        const seen = [];
        this.doc.querySelectorAll('.quotations .quote').forEach((el) => {
            const match = el.className.match(/\bscene(\d+)-start\b/);
            if (!match) return;

            const sceneNumber = Number(match[1])
            const index = sceneNumber - 1;
            if (index < 0 || index >= imgCount) {
                console.warn(`Mural: scene ${match[1]} has no matching image`);
                return;
            }
            if(seen.includes(index)) { throw Error(`Mural: multiple .scene${sceneNumber}-start anchors found.`); }

            seen.push(index);
            this.anchors.push({index, el});
        });

        if(!this.anchors.length){
            throw new Error('No scene anchors found in document.');
        }
    }

    measure(){
        const top = this.view.scrollY;
        this.offsets = this.anchors.map((a) => a.el.getBoundingClientRect().top + top);
    }

    sceneForScroll(){
        if(this.offsets.length !== this.anchors.length){
            throw Error('Anchors and offsets have different lengths. Must call .measureOffsets() before .sceneForScroll()');
        }

        const doc = this.doc.documentElement;
        const bottom = this.view.scrollY + this.view.innerHeight >= doc.scrollHeight - 2;
        if (bottom) return this.anchors[this.anchors.length - 1].index;

        const line = this.view.scrollY + this.view.innerHeight * this.activationRatio;

        let index = this.anchors[0].index; // the title block belongs to the first scene
        for (let i = 0; i < this.offsets.length; i++) {
            if (this.offsets[i] > line) break;
            index = this.anchors[i].index;
        }
        return index;
    }

    #validateActivationRatio(n){
        return Number.isFinite(n) &&  n >= 0 && n <= 1
    }
}