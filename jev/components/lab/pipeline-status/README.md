# lab / pipeline-status

The pipeline's progress header as one piece: a "pipeline" tag, a status pill whose lamp beats fast while a run is in flight and whose text walks through `encode`, `typed questions`, `the gate`, `code acts` and `done`, a four-colour hairline (blue - pink - orange - green) that fills as the run advances, and four step chips that light up in turn. Every decision on the bus replays the 1.3 s timeline.

## Reuse
Copy this folder + `engine.js`, `core.js`, `base.css`, call `JEV.boot()`.

## Data
Consumes bus `decision` (any record). Emits `JEV.bus 'lab-stage' {i, name}` when the pulse reaches each stage, so you can ignite your own stage cards in sync. Timeline: `TL = [0, 290, 720, 990, 1300]` ms in `component.js`.

## Markup
```html
<div class="lab-pph"><span class="lab-tag">pipeline</span><span class="lab-stat"><i class="lamp"></i><b>ready</b></span><i class="lab-prog"><u></u></i></div>
```
Add `lab-run` to the wrapper for the fast lamp; scale `.lab-prog u` from 0 to 1 for progress.

## Swap in real data
Call `start()` when your real request starts and `finish()` when it returns (drive `prog` from your own progress instead of `TL`).
