# HUD section (full)
The complete HUD module: sticky bar (decision / cost odometers, median, floor, section nav, `?` dialog button, kill switch) over a placeholder five-section page so the nav, the scroll hairline and the tooltips can be tried. Same markup as `hud-bar`, shown with the full page rhythm.

**Reuse:** copy this folder + `engine.js`, `core.js`, `base.css`; call `JEV.boot()`. Keep the ids `hud mDec mCost mMed mFloor helpBtn killBtn killTxt`.

**Consumes:** `JEV.S`, bus `decision` / `kill` / `floor`. **Real data:** emit your own `decision` events (see `hud-bar/README.md`), `JEV.setKilled(bool)`, `JEV.setFloor(v)`.
