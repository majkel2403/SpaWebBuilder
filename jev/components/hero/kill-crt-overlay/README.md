# hero / kill-crt-overlay
Everything the main hero does when the kill switch is thrown. `JEV.setKilled(true)` (button, key `k`, or the HUD kill switch) puts `body.killed` on and emits `kill`. This component then: turns new beams red; fires a red full-stage flash with a flicker (tier 2+); keeps a faint red glow breathing while halted; makes beams stutter (every beam that matches a frame-hashed mask is skipped, hard for 1.6 s, lighter afterwards); jitters the plane by up to 2 px for 1.4 s (tier 3, `translate` only); fades in the CRT overlay (scanlines plus a red vignette, with a flicker at tier 3); recolours the static mesh (`hue-rotate`) and the card and chip borders; blinks a `halted - all to review` tag over the code acts; and animates the plane with the CRT power-down (collapse to a line, a dot, gone, back as a dim line, hold) in 1.0 s, or the 0.52 s power-up when armed again. Reduced motion skips the animations and keeps the colour change.

## Reuse
Copy this folder plus `engine.js`, `core.js` and `base.css` (from `src/`), put component.html in a container (about 1100px wide), include component.css and component.js, and call `JEV.boot()`. To add it to your own canvas keep `KILL_KF`/`REV_KF`, the `kill` handler, the `.hkc-crt` CSS block and the flash / stutter lines of `draw()`.

## Data
`JEV.bus` `kill` (bool), `decision` (beams; review routes go red while halted) and `floor`. Drive it with `JEV.setKilled(true|false)`.

## Swap in real data
Call `JEV.setKilled(...)` from your own kill-switch state (or emit `kill`), and `decision` from your model service. Everything shown is simulated; no orders are placed.
