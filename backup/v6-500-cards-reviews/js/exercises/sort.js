/*
 * Sort words into groups (der / die / das, haben / sein, present / past …).
 *   { type: 'sort', prompt, buckets: [{ label: 'der', sub: 'masculine', items: ['Zug', 'Bus'] }, …] }
 * Tap a word, then tap a group — or drag the word onto the group.
 */
(function () {
  'use strict';
  const B = window.Brezel;
  const { h, md, show, flip, shuffle } = B.util;

  B.ex.register('sort', {
    label: 'Sort into groups',

    validate(c) {
      const e = [];
      if (!B.ex.need(e, Array.isArray(c.buckets) && c.buckets.length >= 2 && c.buckets.length <= 4, 'sort needs 2–4 "buckets"')) return e;
      B.ex.need(e, c.buckets.every((b) => b.label && Array.isArray(b.items) && b.items.length), 'each bucket needs a label and items');
      const items = c.buckets.flatMap((b) => b.items || []);
      B.ex.need(e, new Set(items).size === items.length, 'an item appears twice');
      B.ex.need(e, items.length <= 12, 'at most 12 items');
      return e;
    },

    describe: (c) => ({ q: c.prompt || 'Sort into groups', a: c.buckets.map((b) => `${show(b.label)}: ${b.items.map(show).join(', ')}`).join(' | ') }),

    render(card, root, api) {
      let locked = false;
      let sel = null;
      const pool = h('div', { class: 'sort-pool', 'aria-label': 'Words to sort', onClick: () => dropInto(-1) });
      const zones = card.buckets.map((b, bi) => {
        const items = h('div', { class: 'bucket-items' });
        const el = h('div', { class: 'bucket', role: 'button', tabindex: '0', 'aria-label': `Group ${show(b.label)}`, onClick: () => dropInto(bi) },
          h('div', { class: 'bucket-head' }, h('span', { class: 'bucket-label', html: md(show(b.label)) }), b.sub ? h('span', { class: 'bucket-sub' }, show(b.sub)) : null),
          items);
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            dropInto(bi);
          }
        });
        return { el, items };
      });

      const chips = shuffle(card.buckets.flatMap((b, bi) => b.items.map((text) => ({ text, correct: bi, where: -1 }))));
      chips.forEach((c) => {
        c.el = h('button', { type: 'button', class: 'chip sort-chip' }, show(c.text));
        c.el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (locked) return;
          api.sfx('tap');
          sel = sel === c ? null : c;
          paint();
        });
        B.drag.attach(c.el, {
          enabled: () => !locked,
          onStart: () => {
            sel = null;
            paint();
          },
          onMove(ctx) {
            const z = zoneAt(ctx.over);
            zones.forEach((zz, i) => zz.el.classList.toggle('hover', z === i));
            pool.classList.toggle('hover', z === -1 && c.where !== -1);
          },
          onEnd(ctx) {
            const z = zoneAt(ctx.over);
            zones.forEach((zz) => zz.el.classList.remove('hover'));
            pool.classList.remove('hover');
            if (z !== null) place(c, z);
            api.sfx('drop');
            return c.el;
          },
        });
        pool.append(c.el);
      });

      function zoneAt(node) {
        if (!node || !node.closest) return null;
        const b = node.closest('.bucket');
        if (b) return zones.findIndex((z) => z.el === b);
        if (node.closest('.sort-pool')) return -1;
        return null;
      }

      function place(c, where) {
        if (c.where === where) return;
        flip(chips.map((x) => x.el), () => {
          (where === -1 ? pool : zones[where].items).append(c.el);
          c.where = where;
        });
      }

      function dropInto(where) {
        if (locked || !sel) return;
        api.sfx('drop');
        place(sel, where);
        sel = null;
        paint();
      }

      function paint() {
        chips.forEach((c) => {
          c.el.classList.toggle('sel', sel === c);
          c.el.setAttribute('aria-pressed', String(sel === c));
        });
        zones.forEach((z) => z.el.classList.toggle('target', !!sel));
        pool.classList.toggle('empty', chips.every((c) => c.where !== -1));
        api.changed(chips.every((c) => c.where !== -1));
      }

      // keep the "ready" state in sync after drags too
      const obs = new MutationObserver(paint);
      obs.observe(pool, { childList: true });

      root.append(
        B.ex.header(card, 'Sort the words into the right group'),
        pool,
        h('div', { class: 'buckets buckets-' + zones.length }, zones.map((z) => z.el))
      );
      paint();

      return {
        check() {
          const wrong = chips.filter((c) => c.where !== c.correct);
          return {
            ok: wrong.length === 0,
            given: wrong.length ? wrong.map((c) => `${show(c.text)} → ${show(card.buckets[c.where] ? card.buckets[c.where].label : '?')}`).join(', ') : 'all correct',
          };
        },
        solution: () => ({
          html: `<div class="sol-buckets">${card.buckets.map((b) => `<div><strong>${md(show(b.label))}:</strong> ${b.items.map((x) => md(show(x))).join(', ')}</div>`).join('')}</div>`,
        }),
        lock() {
          locked = true;
          sel = null;
          obs.disconnect();
          paint();
          zones.forEach((z) => z.el.classList.remove('target'));
          chips.forEach((c) => {
            c.el.disabled = true;
            const ok = c.where === c.correct;
            c.el.classList.add(ok ? 'good' : 'bad');
            if (!ok) c.el.append(h('span', { class: 'chip-fix' }, '→ ' + show(card.buckets[c.correct].label)));
          });
        },
      };
    },
  });
})();
