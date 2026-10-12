  /* ---- static panes ---- */
  const lineModels = (P) => $('.code-src', P.doc).textContent.replace(/\n$/, '').split('\n').map(hl);
  build(D, lineModels(D)); build(Q, lineModels(Q));

