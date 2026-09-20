# Antigone — Selected Quotations

A single-page reading of Sophocles' *Antigone* in Elizabeth Wyckoff's translation. As the reader scrolls through the passages, a painted scene behind the text crossfades to match the part of the play they're reading. A gallery mode hides the text so only the painting shows.

## Layout

```
index.html          markup: scene layers, overlay, toggle, title, quotations, footer
css/app.css         palette, typography, scene layers, gallery mode
scripts/
  index.js          entry point: gallery toggle, starts the SceneDirector
  SceneDirector.js  listens to scroll/resize/fonts, decides when a scene changes
  SceneMap.js       maps scroll position to a scene
  ImageLoader.js    fetches and decodes each image once; preloads the rest
  ScenePainter.js   paints scenes onto two layers and crossfades between them
images/*.webp       one painting per scene
```

Plain JavaScript ES modules, loaded with `<script type="module">`. There is no build step and no dependencies. A TypeScript build with Deno was considered and set aside.

## How a scene is chosen

A scene is declared in the markup, not in code. Any `.quote` inside `.quotations` that carries a `data-scene` attribute is an **anchor**:

```html
<blockquote class="quote" data-scene="images/creon-decree.webp">
```

The page currently has 21 quotations and 10 anchors. A quotation without `data-scene` keeps the scene of the nearest anchor above it. Adding or moving a scene is therefore an edit to `index.html` alone.

The **activation line** sits 35% of the way down the viewport. The current scene belongs to the last anchor whose top has crossed that line. Two rules handle the ends of the page:

- **Above the first anchor**, which is the title block, the first scene shows.
- **At the bottom of the page**, the last scene shows. Without this rule, a short final passage might never reach the line before the page runs out of scroll, and the final painting would never appear.

## Components

### SceneDirector — when to change

The coordinator. It owns the other three components and wires them to browser events.

**It waits for the scroll to settle.** A new scene must stay the candidate for `settleMs` (500 ms) before a fade is requested. A reader who flings past five anchors sees one fade, to where they stopped, not five fades on the way. Each time the candidate changes, the timer restarts. If the reader returns to the candidate already waiting, the timer keeps running.

**It throttles scroll handling to one check per animation frame** with `requestAnimationFrame`. A browser can fire several scroll events per frame, and only the last position in a frame can be displayed.

**It cuts rather than fades in two cases:**

- *First paint.* On page load, the scene appears without a fade as soon as its image is decoded. Until then the page shows its background color. A fade from nothing would only delay it.
- *Webfont reflow.* Cormorant Garamond and Inter arrive after first paint and shift every anchor down the page. When `document.fonts.ready` resolves, the map re-measures. If the reader turns out to be in a different scene, the director cuts to it. A fade here would correct a layout artifact that the reader did nothing to cause.

On `resize`, the director re-measures and then checks the scene as if the page had scrolled.

### SceneMap — where the reader is

**Anchor offsets are measured once and cached**, then re-measured on resize and after font load. Each scroll check is then arithmetic against cached numbers, with no layout reads. Reading `getBoundingClientRect()` for ten anchors on every frame would force layout work on every frame.

**Rects are read before `scrollY`.** Reading a rect forces layout, and that layout can move the scroll position, for example when the browser restores scroll on reload. Reading `scrollY` last keeps the two values consistent.

**Bottom-of-page detection allows a 2 px tolerance** (`scrollY + innerHeight >= scrollHeight - 2`). Sub-pixel scroll positions can leave the reader one pixel short of an exact match at the true bottom.

**It throws when there are no anchors**, or when the activation ratio falls outside 0–1. A page with no scenes is a markup error. Surfacing it at load is better than showing a blank background silently.

### ImageLoader — getting pixels ready

**Each image is fetched and decoded once.** The loader caches an entry per path, holding the `<img>` element and a `ready` promise. Later requests for the same path return the same entry.

**`ready` never rejects.** It resolves `true` when the image decodes and `false` when it fails. Callers can `await` it without `try/catch`, and a missing painting costs a console warning, not an unhandled rejection.

**Only registered paths can load.** The path list comes from the scene map, and an unknown path throws. A request for an image the page doesn't declare is a bug, and this surfaces it where it happens.

**Preloading walks outward from the starting scene, one image at a time.** The scenes nearest the reader decode first. Loading in sequence keeps the next-needed image from sharing bandwidth with ones that won't be needed for minutes. On a tie, the later scene goes first, since a reader moves through the play forward.

### ScenePainter — putting pixels on screen

**Two stacked layers, `#scene-a` and `#scene-b`.** A crossfade loads the new image into the hidden layer, fades it in, and fades the old layer out. The two layers then trade roles. Two layers is the minimum a crossfade needs.

**Scenes are `<img>` elements, not CSS backgrounds.** `HTMLImageElement.decode()` returns a promise for "decoded and ready to paint." CSS background images have no equivalent hook. The painter waits on that promise so a fade never starts on a half-decoded image. `object-fit: cover` gives the same framing that `background-size: cover` would.

**The fade length lives in CSS only.** The painter reads `transition-duration` from the layer's computed style, so `app.css` is the single place to change it (currently 1.5 s). If no duration is set, the painter throws, because its timing would be meaningless.

**`fadeTo()` never interrupts a fade in progress.** Mid-fade, the outgoing layer is still partly visible. Starting the next fade at that moment would replace the outgoing layer's image while the reader can still see it. So the painter waits until the current fade finishes, then starts the next one. A cut is the one exception: it can change what a running fade shows, as described below.

**Only the most recent request paints.** The painter tracks two values:

- `#current`: the scene on screen, set when its fade begins or its cut paints.
- `#wanted`: the scene most recently requested.

When an image finishes decoding, for a fade or a cut, the painter checks whether it is still `#wanted`. If the reader has since moved on, the decoded image is dropped. A slow image can therefore never paint over a newer choice. A request to return to the scene already on screen cancels whatever was queued and changes nothing.

**A cut waits for decode.** `cutTo()` places its image only once `ready` resolves, so a painting on a slow connection is never drawn in partially.

**A cut during a fade redirects it; it doesn't end it.** Once its image is decoded, `cutTo()` places it in the active layer. If that layer is still fading in, the fade continues with the correct image, and the next fade waits for it as usual. Ending the fade outright (for example with `finish()`) would snap both layers' opacities in the same frame as the image change. Redirecting keeps the fade's timing, so the only discontinuity is the image swap itself, at whatever opacity the layer has reached. Outside a fade, the cut is immediate.

**The painter takes a `load(src)` function, not an `ImageLoader`.** It depends on the shape of what it receives (`{ img, ready }`), not on where images come from. The director supplies the function, which binds it to the loader.

## Styling decisions

- **The overlay** is a fixed layer at 70% of the background color, sitting between the painting and the text. It keeps the text legible against any painting. Gallery mode fades it out along with the text.
- **Scene layers use `100lvh`**, with `100vh` as a fallback for older browsers. On mobile, the large-viewport unit holds steady while browser toolbars show and hide, so the painting doesn't resize as the reader scrolls.
- **Gallery mode is one class on `<body>`.** CSS does the fading, and `pointer-events: none` keeps the hidden text from catching clicks. The toggle button appears on hover and responds to the `G` key.
- **Speakers are color-coded** by role: wine-red for Antigone, bronze for Creon, neutral for everyone else. The palette matches the paintings.
- **Stichomythia**, the rapid line-for-line exchanges, uses a two-column grid (speaker | line) that collapses to one column below 40 rem.

## Failure behavior

| Condition | Result |
|---|---|
| No `data-scene` anchors | `SceneMap` throws at load |
| `#scene-a` or `#scene-b` missing | `ScenePainter` throws at load |
| No transition duration on the layers | `ScenePainter` throws at load |
| Scene requested for an unregistered path | `ImageLoader` throws |
| An image fails to decode | Console warning; the current scene stays. On first load there is no current scene, so the background stays |

The markup, CSS, and scripts depend on one another. Configuration errors throw at load. A single missing painting degrades to "the previous scene lingers."