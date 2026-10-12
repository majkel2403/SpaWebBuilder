/* harness (NOT part of the section): stepBuild() lights the latency-tile row of the build that answered; the hub-only page has no tile, so it gets stand-in rows */
var latRows = new Proxy([], { get: () => ({ li: document.createElement('li') }) });
