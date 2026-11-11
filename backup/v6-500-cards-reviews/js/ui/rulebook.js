/*
 * 📖 Rule book: every grammar rule of data/rules.js, grouped by topic, with a search box.
 * Opened from the home screen, or from a topic's 📖 Rule tip with { topic } to open that topic.
 * The search ignores case, umlauts and accents of the question: "dativ" finds Dativ, "madchen" Mädchen.
 * Keys: / = search, Esc = clear the search, then back home.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, norm } = B.util;

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
    const empty = h('p', { class: 'card rb-empty', hidden: true });

    const sections = B.deck.topics.filter((t) => !t.collects).map((t) => {
      const rules = B.deck.rules.filter((r) => r.topic === t.id);
      if (!rules.length) return null;
      const items = rules.map((r) => ({
        el: h('details', { class: 'rb-rule' },
          h('summary', { class: 'rb-summary', html: md(r.title) }),
          B.glossary.rule(r, { title: false })),
        text: haystack(r, t),
      }));
      const el = h('section', { class: 'card rb-topic', 'aria-label': t.name },
        h('h2', { class: 'section-title rb-head' },
          h('span', { class: 'rb-icon', 'aria-hidden': 'true' }, t.icon),
          h('span', {}, t.name, h('small', { class: 'rb-de' }, t.de))),
        h('div', { class: 'rb-list' }, items.map((i) => i.el)));
      return { id: t.id, el, items };
    }).filter(Boolean);
    const total = sections.reduce((n, s) => n + s.items.length, 0);

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
      empty.hidden = shown > 0;
      empty.textContent = `No rule mentions “${search.value.trim()}”.`;
    }
    search.addEventListener('input', () => {
      if (!search.value) sections.forEach((s) => s.items.forEach((i) => (i.el.open = false)));
      filter();
    });

    root.append(
      h('header', { class: 'page-top' }, back, h('h1', { class: 'page-title' }, 'Rule book')),
      h('main', { class: 'rulebook' },
        h('div', { class: 'rb-tools' }, search, count),
        empty,
        sections.map((s) => s.el)));
    filter();

    const jump = opts.topic && sections.find((s) => s.id === opts.topic);
    if (jump) {
      jump.items.forEach((i) => (i.el.open = true));
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
    };
  };
})();
