# Toggle switch kit
The glowing .tg toggle switch in every accent colour, keyboard and touch accessible, with two live switches bound to the kill switch and the confidence floor.

**What it is:** A pure-CSS pill switch (`.tg`) driven by a parent `.sw.on`. The knob slides with the page easing and the track glows in the accent colour (`data-c`). component.js adds `role="switch"`, click, Space/Enter handling and `aria-checked` sync.

**Reuse:** copy this folder plus `engine.js`, `core.js`, `base.css` and call `JEV.boot()`. Use `<div class="sw on" role="switch" tabindex="0" aria-checked="true" data-c="orange"><i class="tg"></i></div>`; read the state with `el.classList.contains("on")` or listen for the bubbling `switch` CustomEvent (`detail.on`). Add `data-bind="kill"` or `data-bind="floor"` to wire it to the runtime.

**Markup / classes / variables:** `.sw` (hit area, 40px min) > `i.tg`. State class `.on`. Accent: `data-c` or `--cc` / `--cc-rgb`. Size: change width/height on `.tg` and `left` of `.tg::after` (knob = height - 8px).

**Consumes:** Bus `kill` and `floor`; writes `JEV.setKilled(bool)` and `JEV.setFloor(.9 | .85)` for the bound switches.

**Real data:** Bind your own state: listen to the `switch` event on the element.
