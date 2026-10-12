# highlighter

The tiny regex tokenizer that colours every editor pane of the jev-starter window, as an interactive page: type python or json into the textarea and the coloured copy follows. Three skins (dark, light, hot pink) switch by swapping one class.

## Reuse
Copy this folder (`component.html`, `component.css`, `component.js`, `component.json`) next to the shared runtime files `engine.js`, `core.js` and `base.css`, inline them in that order (css, html, then `engine.js` -> `core.js` -> `component.js`) and call `JEV.boot()` once. `build-components.mjs` does exactly this and writes `index.html` next to this README.

## Markup / classes / CSS variables
`hl(src, isJson)` returns `[{c, t}]` tokens; render each as `<span class="code-<c>">`. Classes: `code-k` keyword, `-s` string, `-n` number, `-c` comment, `-f` call, `-fd` def name, `-b` Class, `-ct` CONSTANT, `-a` attribute, `-o` operator, `-v` name, `-jk` json key. Colours come from the CSS variables `--t-k --t-s --t-n --t-c --t-f --t-b --t-ct --t-a --t-o --t-v --t-p --t-jk`, set per skin on `.code-light`, `.code-dark`, `.code-hot`. Add a skin by defining those variables on a new class.

## Data it consumes
Only the optional `decision` bus event (the "latest decision" button turns the newest simulated decision into json). The highlighter itself needs no data.

## Swap in real data
Paste any source into the textarea or call `setLang`/`paint` with your own text; the highlighter is pure string-in, tokens-out. To add a language, extend the `KW` set.
