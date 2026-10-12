# hour / armed-banner

The ARMED banner. While fewer than six cells are lit it reads "waiting on N switches" (six small coloured cells fill one by one); when the sixth lights the slab flips to a glowing pink ARMED with a white-pink flash, a travelling shine, a burst of sparks, tumbling confetti and streaks, and an expanding shockwave ring on a canvas over the card. With the kill switch thrown it reads HALTED in red and no burst fires. It rests 4.5 s and starts over; tap or press Enter to run it again.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`; add the html and call `JEV.boot()`. Standalone page: `node jev/build-components.mjs --only hour/armed-banner`.

- the burst canvas (`canvas.hr-burst`) must be a direct child of the `.hr-p` card (it is positioned over it); the banner is any `.hr-arm` element with `data-s="wait|armed"`.
- call `set(k)` with 0..6 to light cells; when it reaches 6 call `arrive()` for the effect. Tune counts in `arrive()` and the particle pool `PP`.
- colours: `BCOL`; cell colours are the `:nth-child` rules in `component.css`.

## Data it consumes
`J.S.killed` + bus `kill`, `J.S.floor` + bus `floor` (printed in the subtitle), optional `J.pulse` (fx module).

## Swapping in real data
Replace the timer in `J.task` with your own readiness checks: call `set(count)` whenever a precondition passes.

Everything shown is a simulation.
