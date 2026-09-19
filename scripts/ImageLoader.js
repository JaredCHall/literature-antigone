/**
 * Loads and caches scene images so each is fetched and decoded only once.
 *
 * Every src gets one cache entry: an Image element and a `ready` promise
 * that resolves true when decoded, false on failure. The promise never rejects,
 * so callers can await it without try/catch.
 *
 * loadImage() and whenReady() create entries on demand for
 * registered paths only; an unknown src throws.
 *
 * preloadFrom() walks the registered paths outward from a starting image,
 * nearest first, one at a time, so the scenes a reader will reach next
 * are decoded first.
 */
export class ImageLoader {

    paths = [];
    loads = new Map;

    constructor(paths) {
        this.paths = [...new Set(paths ?? [])]; // One entry per image, even if several passages share it.
        if (!this.paths.length) { throw new Error('No images provided in paths array'); }
    }

    /** Returns the Image for src, starting load if needed. */
    loadImage(src) {
        return this.#entry(src).img;
    }

    /** Returns Promise that is true once image src is decoded and ready */
    whenReady(src) {
        return this.#entry(src).ready;
    }

    /**
     * Preloads images sequentially ordering based on the
     * nearest scenes to the current src
     */
    async preloadFrom(src) {
        const start = this.paths.indexOf(src);
        if (start < 0) { throw Error(`Unknown image ${src}`); }

        const order = this.paths.map((_, i) => i)
            .sort((a, b) => Math.abs(a - start) - Math.abs(b - start) || b - a);

        for (const i of order) {
            await this.#entry(this.paths[i]).ready;
        }
    }

    /** Create new entry or return existing for src */
    #entry(src) {
        let entry = this.loads.get(src);
        if (!entry) {
            if (!this.paths.includes(src)) { throw Error(`Image not registered with ImageLoader: ${src}`); }
            const img = new Image();
            img.src = src;
            entry = { img, ready: img.decode().then(() => true, () => false) };
            this.loads.set(src, entry);
        }
        return entry;
    }
}


