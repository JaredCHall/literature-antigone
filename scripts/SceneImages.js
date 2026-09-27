export class SceneImages {
    #paths;     // one per image, document order — for loading and the slideshow

    constructor(paths) {
        if (!paths?.length) { throw new Error('No scene paths provided.'); }
        this.#paths = Object.freeze([...new Set(paths)]);
    }

    get paths() { return this.#paths; }
}