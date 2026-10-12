# Metric chip strip
The HUD metric chips on their own: model, agent, decisions and cost odometers, live median latency and a confidence-floor chip with plus/minus steppers.

**What it is:** A horizontal strip of `.m` chips (small caps label over a bold tabular value). core.js binds the ids `mDec mCost mMed mFloor`, so the strip is live without a HUD around it: decisions and cost roll as odometers, median and floor flash when they change.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Drop `.mets` with the same ids anywhere (a card header, a toolbar). Remove chips you do not need, core.js skips missing ids. The stepper buttons call `JEV.setFloor`.

**Markup / classes / variables:** `.mets > .m > label + b#mDec.hot.num`. `.hide-s` / `.hide-xs` hide chips on narrow screens. Value colours: `.hot`, `.up`, `.dn`.

**Consumes:** `JEV.S` (`count cost ms[] floor`), bus `decision` and `floor`; written: `JEV.setFloor(v)`.

**Real data:** Update `JEV.S.count/cost/ms.push(latency)` then call `JEV.hud()`, or emit `decision` records.
