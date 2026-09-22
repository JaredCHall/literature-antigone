# Antigone Exhibit — TODO

Ranked by utility, most important first.

## 1. Mobile entry to gallery mode

- [ ] Make `#gallery-toggle` visible on touch devices. It stays at `opacity: 0` until `body:hover`, and touch browsers handle hover inconsistently, so on phones it is effectively hidden.
- [ ] Add a `@media (hover: none)` rule that keeps the button visible, possibly dimmed.
- [ ] Design the slideshow control (item 4) alongside it, so phones get both.

## 2. Scene IDs and visible scene markers

- [ ] Give each `data-scene` blockquote an `id` (e.g. `#creon-decree`) so scenes can be linked without JavaScript.
- [ ] Add `scroll-margin-top` so a linked anchor doesn't sit flush against the top of the viewport.
- [ ] Add a visible marker where each scene begins.
- [ ] Test a deep link on a cold load, including after the webfont reflow.

Items 5 and 6 depend on this one.

## 3. Mobile-sized images

- [ ] Check the actual image file sizes to see how much bandwidth there is to save.
- [ ] Check how each painting crops under `object-fit: cover` on a portrait phone. Some scenes may need their own crop, not just a smaller file.
- [ ] Set `srcset`/`sizes` in `ImageLoader.load()`, or read a `data-scene-mobile` attribute there. `decode()` works unchanged either way.

## 4. Slideshow in gallery mode

- [ ] Add a key (`S` or `R`) plus a visible control that cycles through the scenes in order on an interval.
- [ ] Suspend scroll-driven scene changes in `SceneDirector` while the slideshow runs.
- [ ] Start each interval when a fade *begins*, not when it is requested, so a slow-decoding image doesn't get less screen time.
- [ ] Decide what exiting does. Leaning toward scrolling the text to the scene the slideshow stopped on.

## 5. Scene navigator

- [ ] Build a sidebar or menu of scenes that links to the item 2 anchors.
- [ ] Test smooth-scrolling past several anchors. The settle timer should produce a single fade, but a stretch between two anchors that takes longer than 500 ms would produce an intermediate one.

## 6. Reprioritize preloading after large jumps

- [ ] When the reader jumps far, move the new scene's neighbors to the front of the preload queue.
- [ ] Revisit this after items 2 and 5 ship, since they make long jumps common. Until then the gain is small: `fadeTo` already starts loading the target image immediately, so it competes with at most one preload in flight.

## Done

- [x] Start the preload only after `document.fonts.ready`, from the post-reflow scene (`this.#candidate`), and fall back to preloading immediately when the Font Loading API is absent.