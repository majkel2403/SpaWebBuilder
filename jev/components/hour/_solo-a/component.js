  /* standalone tail: panel B does not exist here, so armText is inert */
  const armText = () => {};
  J.bus.on('kill', (v) => showKill(v));
  J.bus.on('tier', () => { buildStaticA(); });
  showKill(S.killed);
});
