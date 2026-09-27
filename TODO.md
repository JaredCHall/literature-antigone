# Antigone Exhibit — TODO

Ranked by utility, most important first.

## 1. Slideshow in gallery mode

- [ ] Gallery Mode should act as a slideshow slowly rotating through every scene illustration until exit
- [ ] Start each interval once the next image is decoded, not when it is requested,
  so a slow load never makes the slideshow skip a scene.
- [ ] On exit scroll the text to the scene the slideshow stopped on.
- [ ] On exit, cancel any fade the slideshow left pending (fadeTo(painter.current)),
    so a late decode can't paint over the text's scene.

## 2. Reprioritize preloading after large jumps or switch to gallery mode

- [x] When the reader jumps far, move the new scene's neighbors to the front of the preload queue.
- [ ] When in gallery mode, images are loaded always sequentially, preload in the appropriate order.

## 3. Add handling to allow ImageLoader to retry failed decodes