  /* standalone tail: only the kill / floor hooks of the real tail that panel B uses */
  J.bus.on('kill', (v) => { killed = !!v; armText(); });
  J.bus.on('floor', armText);
  killed = !!S.killed; armText();
  if (reduce) { mode = 'static'; renderB(true, 0); updArm(); }
  else { mode = 'static'; }
});
