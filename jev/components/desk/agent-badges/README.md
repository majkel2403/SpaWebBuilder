# desk / agent-badges

The small agent identity atoms used all over the desk, in the six agent colours (spotter green, prior amber, edge pink, kelly violet, taker blue, closer orange): the glowing status dot, the uppercase row tag, the filter chip and a pill that adds the agent's role. Special variants for JEV (pink gradient), the kill switch (red) and a muted chip. The badges of the agent that just acted flash. Simulated.

## Reuse
Copy this folder plus `engine.js`, `core.js`, `base.css`. Every badge reads two CSS variables set inline: `--a` (hex colour) and `--ar` (the same as `r,g,b`, for translucent fills). Markup: `<i class="dkb-d">` dot, `<b class="dkb-ag">NAME</b>` tag, `<span class="dkb-ch"><i></i><b>NAME</b></span>` chip (`.off` = muted), `<span class="dkab-pill"><i class="dkb-d"></i><b>NAME</b><span>role</span></span>` pill; wrap a tag in `.dkb-tagw.dkb-j` for JEV and add `.dkb-rk` for the kill state. Add class `dkb-flash` to play the flash.

## Data consumed
Bus `agentstep` (`{agent}` = agent key); plays its own simulated steps when none arrives.

## Swap in real data
Replace `J.AGENTS` entries (`key`, `name`, `role`, `col`) with your own agents or build the badges from your agent list, and call `flash(key)` when an agent acts.
