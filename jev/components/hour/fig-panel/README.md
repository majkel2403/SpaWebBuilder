# hour / fig-panel

The glass panel shell shared by every card of "the hour": accent hairline on top (`.hr-edge`), tag + subtitle + badge head, serif-less headline, note chips, free content area, dashed footer and the huge ghost `FIG.n` watermark in the corner. Four accents are shown (orange, blue, violet, red). CSS only, no script.

## Reuse
Copy this folder plus `base.css` (tokens, `.card`, `data-c` accents) and the fonts the page loads. No `engine.js` / `core.js` is needed unless you add live parts; the builder includes them anyway. Standalone page: `node jev/build-components.mjs --only hour/fig-panel`.

```html
<article class="card hr-p" data-c="orange">
  <i class="hr-edge"></i>
  <div class="hr-ph"><span class="hr-tag">tag</span><span class="hr-ps">subtitle</span><span class="hr-badge" data-c="yellow">badge</span></div>
  <h3 class="hr-t">Headline</h3>
  <p class="hr-note"><span data-c="yellow">note chip</span></p>
  ... your content ...
  <p class="hr-foot">footer</p>
  <span class="hr-fig" aria-hidden="true">FIG.1</span>
</article>
```
Accent: `data-c` on the article (border, edge, tag) and on each badge / note chip. The article is a size container (`container-type: inline-size`) so inner pieces can use `@container hrp (...)` queries. Wrap the cards in a `.hr` element (it holds the colour variables).

## Data it consumes
None.

## Swapping in real data
Replace the texts; the panel has no data of its own.
