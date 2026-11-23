(() => {
  const overlay = document.getElementById('menuOverlay');
  const title = document.getElementById('dialogTitle');
  const description = document.getElementById('dialogDescription');
  const options = document.getElementById('dialogOptions');
  const back = document.getElementById('backMenu');
  const close = document.getElementById('closeMenu');
  let current = 'games';
  let lastTrigger = null;
  const pages = {
    games: { title: 'Hry', description: 'Jak chcete hrát?', items: [
      { title: 'Singleplayer', info: 'Hrajte sami vlastním tempem.', next: 'single' },
      { title: 'Multiplayer', info: 'Připravujeme – zatím nedostupné.', disabled: true }
    ]},
    single: { title: 'Singleplayer', description: 'Vyberte si logickou hru.', back: 'games', items: [
      { title: 'Sudoku', info: 'Klasická číselná logika 9 × 9.', href: 'sudoku.html' },
      { title: 'Nonogram', info: 'Odhalte obrázek pomocí čísel.', href: 'nonogram.html' }
    ]},
    create: { title: 'Vytvořit', description: 'Jakou hádanku chcete vytvořit?', items: [
      { title: 'Vytvořit nonogram', info: 'Nakreslete vlastní obrázkovou hádanku.', href: 'create_nonogram.html' },
      { title: 'Vytvořit sudoku', info: 'Zadejte vlastní číselnou mřížku.', href: 'create_sudoku.html' }
    ]},
    more: { title: 'Další', description: 'Statistiky a informace o hrách.', items: [
      { title: 'Žebříčky', info: 'Nejlepší časy hráčů.', href: 'top10.html' },
      { title: 'O Sudoku', info: 'Pravidla a historie hry.', href: 'about.html' }
    ]}
  };
  function show(page) {
    current = page;
    const data = pages[page];
    title.textContent = data.title;
    description.textContent = data.description;
    back.hidden = !data.back;
    options.replaceChildren();
    data.items.forEach(item => {
      const el = document.createElement(item.href ? 'a' : 'button');
      el.className = 'dialog-option';
      if (item.href) el.href = item.href;
      else { el.type = 'button'; el.disabled = !!item.disabled; if (item.next) el.addEventListener('click', () => show(item.next)); }
      const heading = document.createElement('strong'); heading.textContent = item.title;
      const info = document.createElement('span'); info.textContent = item.info;
      el.append(heading, info); options.append(el);
    });
  }
  function hide() {
    overlay.hidden = true; document.body.classList.remove('menu-is-open');
    if (lastTrigger) lastTrigger.focus();
  }
  document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
    lastTrigger = button; show(button.dataset.open);
    overlay.hidden = false; document.body.classList.add('menu-is-open'); close.focus();
  }));
  close.addEventListener('click', hide);
  back.addEventListener('click', () => show(pages[current].back));
  overlay.addEventListener('click', e => { if (e.target === overlay) hide(); });
  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'Tab') {
      const focusable = [...overlay.querySelectorAll('button:not([disabled]):not([hidden]),a[href]')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length-1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
