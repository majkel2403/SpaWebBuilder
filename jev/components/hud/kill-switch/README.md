# Kill switch
The ARMED / HALTED pill button. Halting is global: `body.killed` gives the page a pulsing red vignette and recolours the button; the decision engine routes every ticket to human review (holds still skip). The panel around it is a demo with a live execute / review / skip tally and the last decisions.

**Reuse:** copy this folder + `engine.js`, `core.js`, `base.css`; call `JEV.boot()`. Only the button (`#killBtn` > `<i>` + `#killTxt`) matters; the panel is optional. Press `k` to toggle.

**Consumes:** `JEV.S.killed`, `JEV.S.dest`, bus `kill` (bool) and `decision` (`d.dest`, `d.action`, `d.symbol`, `d.size`, `d.conf`, `d.reason`).

**Real data:** call `JEV.setKilled(true)` from your risk system; listen to `JEV.bus.on('kill', halted => ...)` to stop order submission in your own code.
