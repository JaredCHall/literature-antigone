/**
 * Loads and caches scene images so each is fetched and decoded only once.
 *
 * load() returns a src's cache entry, creating it on first call: an Image
 * element and a `ready` promise that resolves true when decoded, false on
 * failure. The promise never rejects, so callers can await it without
 * try/catch. Only registered paths can be loaded; an unknown src throws.
 *
 * preloadFrom() walks the registered paths outward from a starting image,
 * nearest first, one at a time, so the scenes a reader will reach next
 * are decoded first.
 */
export class ImageLoader {

    paths;              // registered image paths, deduplicated, in document order
    loads = new Map();  // src → { img, ready }

    constructor(paths) {
        this.paths = [...new Set(paths ?? [])]; // One entry per image, even if several passages share it.
        if (!this.paths.length) { throw new Error('No images provided in paths array'); }
    }

    /**
     * Returns the cache entry for src, starting its load if needed.
     * @param {string} src
     * @returns {{ img: HTMLImageElement, ready: Promise<boolean> }}
     */
    load(src) {
        let entry = this.loads.get(src);
        if (!entry) {
            if (!this.paths.includes(src)) { throw new Error(`Image not registered with ImageLoader: ${src}`); }
            const img = new Image();
            img.src = src;
            entry = { img, ready: img.decode().then(() => true, () => false) };
            this.loads.set(src, entry);
        }
        return entry;
    }

    /**
     * Loads every registered image one at a time, nearest to src first;
     * on a tie, the later scene goes first.
     */
    async preloadFrom(src) {
        const start = this.paths.indexOf(src);
        if (start < 0) { throw new Error(`Unknown image ${src}`); }

        const order = this.paths.map((_, i) => i)
            .sort((a, b) => Math.abs(a - start) - Math.abs(b - start) || b - a);

        for (const i of order) {
            await this.load(this.paths[i]).ready;
        }
    }
}