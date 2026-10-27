/* =====================
   NAV — highlight the tab for the section on screen
   ===================== */
const navLinks = document.querySelectorAll('nav a[href^="#"]');
const sections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
  });
}, { rootMargin: '-50% 0px -50% 0px' });

sections.forEach(s => sectionObserver.observe(s));

// on narrow screens the tab row scrolls sideways — bring the current page's tab into view
const currentTab = document.querySelector('nav a.active:not([href^="#"])');
if (currentTab) currentTab.scrollIntoView({ block: 'nearest', inline: 'center' });

/* =====================
   SCROLL REVEAL
   ===================== */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    revealObserver.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px -10% 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* =====================
   LUNA CAROUSEL
   ===================== */
const lunaTrack = document.querySelector('.Luna-track');
if (lunaTrack) {
  const lunaCards = document.querySelectorAll('.Luna-card');
  const descs     = document.querySelectorAll('.Luna-desc');
  let current     = 0;

  function goTo(index) {
    descs[current].classList.remove('active');
    current = (index + lunaCards.length) % lunaCards.length;
    lunaTrack.style.transform = `translateX(-${current * 100}%)`;
    descs[current].classList.add('active');
  }

  document.querySelector('.Luna-prev').addEventListener('click', () => goTo(current - 1));
  document.querySelector('.Luna-next').addEventListener('click', () => goTo(current + 1));

  let startX = 0;
  lunaTrack.addEventListener('touchstart', e => startX = e.touches[0].clientX, { passive: true });
  lunaTrack.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
  });
}

/* =====================
   PAC-MAN — retro desktop windows
   ===================== */
const desktop = document.querySelector('.desktop');
if (desktop) {
  const wins  = [...desktop.querySelectorAll('.win')];
  const tabs  = [...document.querySelectorAll('.task-tab')];
  const clock = document.querySelector('.taskbar-clock');
  let topZ    = 10;

  function syncTabs() {
    tabs.forEach(t => t.classList.toggle('open', !document.getElementById(t.dataset.win).classList.contains('closed')));
  }

  function focusWin(win) {
    wins.forEach(w => w.classList.toggle('focused', w === win));
    win.style.zIndex = ++topZ;
  }

  function openWin(win) {
    win.classList.remove('closed');
    focusWin(win);
    syncTabs();
  }

  wins.forEach(win => {
    win.addEventListener('pointerdown', () => focusWin(win));
    win.querySelectorAll('[data-close]').forEach(btn =>
      btn.addEventListener('click', e => {
        e.stopPropagation();
        win.classList.add('closed');
        syncTabs();
      })
    );
  });

  tabs.forEach(tab => tab.addEventListener('click', () => {
    const win = document.getElementById(tab.dataset.win);
    if (win.classList.contains('closed')) openWin(win);
    else focusWin(win);
  }));

  document.querySelector('[data-open-all]').addEventListener('click', () => wins.forEach(openWin));

  // drag windows by their title bar (desktop layout only)
  const canDrag = window.matchMedia('(min-width: 901px) and (pointer: fine)');
  wins.forEach(win => {
    const bar = win.querySelector('.win-title');
    let startX, startY, baseX = 0, baseY = 0;

    bar.addEventListener('pointerdown', e => {
      if (!canDrag.matches || e.target.closest('button')) return;
      startX = e.clientX - baseX;
      startY = e.clientY - baseY;
      win.classList.add('dragging');
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener('pointermove', e => {
      if (!win.classList.contains('dragging')) return;
      baseX = e.clientX - startX;
      baseY = e.clientY - startY;
      win.style.translate = `${baseX}px ${baseY}px`;
    });
    const stop = () => win.classList.remove('dragging');
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
  });

  function tick() {
    clock.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  tick();
  setInterval(tick, 15000);

  // initial stacking: the results pop-up sits on top
  ['win-notes', 'win-main', 'win-video', 'win-dialog'].forEach(id => focusWin(document.getElementById(id)));
  syncTabs();
}

/* =====================
   COPY EMAIL
   ===================== */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const label = btn.textContent;
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copied';
    } catch {
      btn.textContent = 'Press ⌘C';
    }
    setTimeout(() => btn.textContent = label, 1800);
  });
});

/* =====================
   BLOG — filter tabs, series counts, empty state
   ===================== */
const postList = document.querySelector('.post-list');
if (postList) {
  const rows    = [...postList.querySelectorAll('.post-row')];
  const filters = document.querySelectorAll('.filter');
  const empty   = document.querySelector('.empty-state');

  document.querySelectorAll('[data-count]').forEach(el => {
    const n = rows.filter(r => r.dataset.category === el.dataset.count).length;
    el.textContent = n === 0 ? 'Coming soon' : `${n} post${n === 1 ? '' : 's'}`;
  });

  function applyFilter(cat) {
    let shown = 0;
    rows.forEach(r => {
      const match = cat === 'all' || r.dataset.category === cat;
      r.hidden = !match;
      if (match) shown++;
    });
    empty.hidden = shown > 0;
    filters.forEach(f => {
      const on = f.dataset.filter === cat;
      f.classList.toggle('active', on);
      f.setAttribute('aria-selected', on);
    });
  }

  filters.forEach(f => f.addEventListener('click', () => {
    applyFilter(f.dataset.filter);
    history.replaceState(null, '', f.dataset.filter === 'all' ? location.pathname : '#' + f.dataset.filter);
  }));

  // blog.html#lab etc. opens straight to that series (also used by the series cards)
  const filterFromHash = () => {
    const h = location.hash.slice(1);
    applyFilter(['cert', 'paper', 'lab', 'luna'].includes(h) ? h : 'all');
  };
  window.addEventListener('hashchange', filterFromHash);
  filterFromHash();
}
