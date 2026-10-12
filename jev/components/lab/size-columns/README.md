# lab / size-columns

The "how much?" score question: four columns (0.5%, 1%, 2%, 4% of capital) whose height is the model's probability for that bucket. The chosen bucket (`sizeIdx`) turns pink with a glow and a light streak runs up it. On a hold decision the whole card dims and says "no order".

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data
Bus `decision`: `d.action`, `d.size`, `d.sizes[4]` (probabilities for `JEV.SIZES` = 0.5, 1, 2, 4), `d.sizeIdx`.

## Markup
```html
<div class="lab-szc on"><em>48%</em><i class="lab-col"><u style="transform:scaleY(.48)"></u></i><span>1%</span></div>
```
Column height is set by `.lab-sz { height }` (default 116px).

## Swap in real data
Emit `sizes` / `sizeIdx` from your sizing model (probabilities that sum to 1), or call `show(record, true)`. Change the buckets in `JEV.SIZES` (engine.js) and the labels follow.
