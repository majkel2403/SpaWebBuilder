/* code — the "jev-starter" editor window under the hero (bottom of the JEV DECIDES reference).
 * desk.py (light) · state.json (hot pink, re-types itself with the latest real decision) · questions.py (light) · zsh (dark, streams real decisions)
 * own tiny highlighter · per-line typing reveal · moving current-line band · minimaps · audio-bars glyph · live queue status bar.
 * Everything is simulated: the decisions come from the shared JEV bus. */
JEV.mod('code', () => {
  const J = JEV, $ = J.$, clamp = J.clamp, reduce = J.reduce, T = () => J.tier || 2;
  const root = $('#code'), win = root && $('#code-win', root);
  if (!win) return;
  const doc = document;

