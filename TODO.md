# Antigone Exhibit — TODO

Ranked by utility, most important first.

## 1. Slideshow in gallery mode

- [ ] Gallery Mode should act as a slideshow slowly rotating through every scene illustration until exit
- [ ] Start each interval when a fade *begins*, not when it is requested, so a slow-decoding image doesn't get less screen time.
- [ ] Decide what exiting does. Leaning toward scrolling the text to the scene the slideshow stopped on.

## 2. Reprioritize preloading after large jumps

- [ ] When the reader jumps far, move the new scene's neighbors to the front of the preload queue.