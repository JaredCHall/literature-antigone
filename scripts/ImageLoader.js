class ImageLoader {

    paths = []
    loads = new Map;

    constructor(paths) {
        this.paths = paths || [];
        if(!this.paths.length) { throw Error('No images provided in paths array') }
    }

    loadImage(src) {
        return this.#entry(src).img;
    }

    whenReady(src) {
        return this.#entry(src).ready;
    }

    async preloadAll(startIndex) {
        const order = this.paths.map((_, i) => i)
            .sort((a, b) => Math.abs(a - startIndex) - Math.abs(b - startIndex) || b-a);
        for (const i of order) {
            await this.#entry(this.#imageSrc(i)).ready;
        }
    }

    #entry(src) {
        let entry = this.loads.get(src);
        if (!entry) {
            const img = new Image();
            img.src = src;
            entry = { img, ready: img.decode().then(() => true, () => false) };
            this.loads.set(src, entry);
        }
        return entry;
    }

    #imageSrc(index){
        const src = this.paths[index] ?? false;
        if (!src) { throw Error(`Requested Scene ${index} not registered with ImageLoader`) }
        return src
    }
}


