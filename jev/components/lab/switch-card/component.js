  autoB.addEventListener('click', () => {
    auto = !auto;
    autoB.classList.toggle('on', auto); autoB.setAttribute('aria-checked', String(auto));
    if (auto && dirty) commit('input');
  });
