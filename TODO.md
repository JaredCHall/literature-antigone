# Antigone Exhibit — TODO

Ranked by utility, most important first.

## 1. Slideshow in gallery mode

- [ ] Gallery Mode should act as a slideshow slowly rotating through every scene illustration until exit
- [ ] Start each interval once the next image is decoded, not when it is requested,
  so a slow load never makes the slideshow skip a scene.
- [ ] On exit scroll the text to the scene the slideshow stopped on.

## 2. Reprioritize preloading after large jumps or switch to gallery mode

- [x] When the reader jumps far, move the new scene's neighbors to the front of the preload queue.
- [ ] When in gallery mode, images are loaded always sequentially, preload in the appropriate order.