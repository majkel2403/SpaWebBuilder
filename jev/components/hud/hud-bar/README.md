# HUD bar
The sticky trading HUD: live decision counter and cost (odometer reels), median latency, confidence floor, section nav, `?` shortcuts button and the kill switch. Simulated data.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` (the `.hud` styles live in base.css); inline them as `component.html/css/js` show and call `JEV.boot()`. Keep the element ids (`hud mDec mCost mMed mFloor helpBtn killBtn killTxt`): core.js binds to them. Nav links to missing sections are hidden.

**Consumes:** `JEV.S` (`count`, `cost`, `ms[]`, `floor`, `killed`), bus events `decision` (each one bumps the counters), `kill`, `floor`. Writes: `JEV.setKilled(bool)`, `JEV.setFloor(v)`.

**Real data:** emit your own events instead of the simulator: update `JEV.S.count/cost/ms.push(latency)` then call `JEV.hud()` (or `JEV.bus.emit('decision', d)`), and stop the simulator by not calling it (`JEV.start` is called by `boot`; override `JEV.makeDecision` to return your own decision records, see the decision-record fields in the main README).
