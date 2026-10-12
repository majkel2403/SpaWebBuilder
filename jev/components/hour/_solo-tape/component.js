  /* standalone tail: the real tail (hour/_tail) wires every panel together */
  J.bus.on('kill', (v) => { killed = !!v; });
});
