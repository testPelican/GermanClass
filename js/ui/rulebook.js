/*
 * 📖 Rule book: every grammar rule of data/rules.js, grouped by topic, with a search box.
 * Opened from the home screen, or from a topic's 📖 Rule tip with { topic } to open that topic.
 * The search ignores case, umlauts and accents of the question: "dativ" finds Dativ, "madchen" Mädchen.
 * Keys: / = search, Esc = clear the search, then back home.
 * Animations: the book in the header turns its pages, sections rise in as they scroll into view (their
 * topic picture says hello), a rule unfolds like paper when opened, the magnifier wiggles while typing.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, norm, pulse, reducedMotion } = B.util;

  const LENS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15 15l5.5 5.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M7 8.2a3.4 3.4 0 0 1 2.6-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".5"/></svg>';
  // a magnifier that finds nothing: shown when no rule matches
  const NOTHING = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="27" cy="27" r="17" fill="#ddf4ff" stroke="#1cb0f6" stroke-width="5"/><path d="M40 40l14 14" stroke="#1cb0f6" stroke-width="7" stroke-linecap="round"/><path d="M22 22.5a5 5 0 1 1 6.5 4.8c-1.3.5-1.5 1.4-1.5 2.7" fill="none" stroke="#1899d6" stroke-width="3.2" stroke-linecap="round"/><circle cx="27" cy="35" r="2" fill="#1899d6"/></svg>';

  /** Everything a rule says, in one searchable string (umlauts also as plain vowels). */
  function haystack(r, topic) {
    const table = r.table ? [...(r.table.head || []), ...r.table.rows.flat()] : [];
    const text = norm([r.title, r.text, ...(r.points || []), ...table, topic.name, topic.de].join(' ').replace(/\*+/g, ''));
    return ` ${text} ${text.replace(/([aou])e/g, '$1')} `;
  }

  B.ui.rulebook = function (root, opts) {
    const back = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back to home' }, '←');
    back.addEventListener('click', () => B.app.go('home'));
    const search = h('input', {
      class: 'rb-search',
      type: 'search',
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      enterkeyhint: 'search',
      'aria-label': 'Search the rules',
      placeholder: 'Search, e.g. Dativ, seit, Partizip',
    });
    const count = h('p', { class: 'muted small rb-count', 'aria-live': 'polite' });
    const emptyText = h('span', {});
    const empty = h('div', { class: 'card rb-empty', hidden: true }, h('span', { class: 'rb-empty-pic', html: NOTHING }), emptyText);
    const lens = h('span', { class: 'rb-lens', html: LENS });

    const sections = B.deck.topics.filter((t) => !t.collects).map((t) => {
      const rules = B.deck.rules.filter((r) => r.topic === t.id);
      if (!rules.length) return null;
      const items = rules.map((r) => {
        const body = B.glossary.rule(r, { title: false });
        const el = h('details', { class: 'rb-rule' }, h('summary', { class: 'rb-summary', html: md(r.title) }), body);
        el.addEventListener('toggle', () => {
          if (el.open && !quiet) B.glossary.unfold(body);
        });
        return { el, text: haystack(r, t) };
      });
      const el = h('section', { class: 'card rb-topic art-host', 'aria-label': t.name },
        h('h2', { class: 'section-title rb-head' },
          h('span', { class: 'rb-icon', 'aria-hidden': 'true', html: B.art.topic(t.id) }),
          h('span', {}, t.name, h('small', { class: 'rb-de' }, t.de)),
          h('span', { class: 'rb-n' }, String(rules.length))),
        h('div', { class: 'rb-list' }, items.map((i) => i.el)));
      el.style.setProperty('--t', B.art.color(t.id));
      return { id: t.id, el, items };
    }).filter(Boolean);
    const total = sections.reduce((n, s) => n + s.items.length, 0);
    let quiet = false; // opening rules by searching or jumping: no unfold animation for each

    function filter() {
      const words = norm(search.value).split(' ').filter(Boolean);
      let shown = 0;
      for (const s of sections) {
        let any = false;
        for (const i of s.items) {
          const hit = words.every((w) => i.text.includes(w));
          i.el.hidden = !hit;
          if (words.length) i.el.open = hit;
          if (hit) shown++;
          any = any || hit;
        }
        s.el.hidden = !any;
      }
      count.textContent = words.length
        ? `${shown} of ${total} rules match`
        : `${total} rules in ${sections.length} topics. Tap a rule to open it.`;
      if (empty.hidden && !shown) pulse(empty, 'rb-pop');
      empty.hidden = shown > 0;
      emptyText.textContent = `No rule mentions “${search.value.trim()}”.`;
    }
    search.addEventListener('input', () => {
      quiet = true;
      if (!search.value) sections.forEach((s) => s.items.forEach((i) => (i.el.open = false)));
      filter();
      pulse(lens, 'rb-wiggle');
      setTimeout(() => (quiet = false));
    });

    // the header: a book turning its pages
    const hero = h('section', { class: 'card rb-hero' },
      h('span', { class: 'rb-book', html: B.glossary.ICON.book }),
      h('div', {},
        h('h2', { class: 'rb-hero-title' }, 'Every rule in one place'),
        h('p', { class: 'muted' }, `${total} rules from ${sections.length} topics, with their tables. Open one to unfold it.`)));

    root.append(
      h('header', { class: 'page-top' }, back, h('h1', { class: 'page-title' }, 'Rule book')),
      h('main', { class: 'rulebook' },
        hero,
        h('div', { class: 'rb-tools' }, h('div', { class: 'rb-search-wrap' }, lens, search), count),
        empty,
        sections.map((s) => s.el)));
    filter();

    // sections rise in as they come into view, and their topic picture says hello
    let io = null;
    if (!reducedMotion() && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('rb-in');
          B.art.burst(e.target);
          io.unobserve(e.target);
        }
      }, { rootMargin: '0px 0px -8% 0px' });
      sections.forEach((s) => {
        s.el.classList.add('rb-wait');
        io.observe(s.el);
      });
    }

    const jump = opts.topic && sections.find((s) => s.id === opts.topic);
    if (jump) {
      quiet = true;
      jump.items.forEach((i) => (i.el.open = true));
      setTimeout(() => (quiet = false));
      requestAnimationFrame(() => jump.el.scrollIntoView({ block: 'start' }));
    }

    return {
      onKey(e) {
        if (e.key === '/' && e.target !== search) {
          e.preventDefault();
          search.focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          if (search.value) {
            search.value = '';
            search.dispatchEvent(new Event('input'));
          } else B.app.go('home');
        }
      },
      destroy() {
        if (io) io.disconnect();
      },
    };
  };
})();
