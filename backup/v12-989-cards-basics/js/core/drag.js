/*
 * Minimal pointer-based drag helper (mouse, touch and pen share one code path).
 * A tap stays a normal click; the drag only starts after the pointer moves a
 * few pixels. While dragging, a floating clone follows the finger.
 *
 *   B.drag.attach(el, {
 *     onStart(ctx), onMove(ctx), onEnd(ctx)  // ctx: {el, ghost, x, y, over}
 *   })
 * onEnd may return a target element: the clone then glides into it before
 * disappearing; otherwise it glides back to el.
 */
(function () {
  'use strict';
  const B = window.Brezel;

  let suppressClickUntil = 0;
  window.addEventListener(
    'click',
    (e) => {
      if (Date.now() < suppressClickUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true
  );

  function attach(el, opts = {}) {
    const threshold = opts.threshold || 6;
    let start = null;
    let ctx = null;

    function under(x, y) {
      return document.elementFromPoint(x, y);
    }

    function down(e) {
      if (e.button !== undefined && e.button !== 0) return;
      if (opts.enabled && !opts.enabled()) return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      // Listen on window: the element may be moved around the DOM mid-drag
      // (live re-ordering), which can drop pointer capture in some browsers.
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
    }

    function begin(e) {
      const r = el.getBoundingClientRect();
      const ghost = el.cloneNode(true);
      ghost.classList.add('drag-ghost');
      ghost.removeAttribute('id');
      Object.assign(ghost.style, {
        position: 'fixed',
        left: r.left + 'px',
        top: r.top + 'px',
        width: r.width + 'px',
        height: r.height + 'px',
        margin: '0',
        pointerEvents: 'none',
        zIndex: 1000,
      });
      document.body.appendChild(ghost);
      ctx = { el, ghost, dx: start.x - r.left, dy: start.y - r.top, x: e.clientX, y: e.clientY, over: null };
      el.classList.add('drag-src');
      document.body.classList.add('is-dragging');
      opts.onStart && opts.onStart(ctx);
    }

    function move(e) {
      if (!start || e.pointerId !== start.id) return;
      if (!ctx) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < threshold) return;
        begin(e);
      }
      e.preventDefault();
      ctx.x = e.clientX;
      ctx.y = e.clientY;
      ctx.ghost.style.left = e.clientX - ctx.dx + 'px';
      ctx.ghost.style.top = e.clientY - ctx.dy + 'px';
      ctx.over = under(e.clientX, e.clientY);
      opts.onMove && opts.onMove(ctx);
    }

    function finish(cancelled) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      start = null;
      if (!ctx) return;
      const c = ctx;
      ctx = null;
      suppressClickUntil = Date.now() + 350;
      document.body.classList.remove('is-dragging');
      const dest = opts.onEnd ? opts.onEnd(Object.assign(c, { cancelled })) : null;
      settle(c, dest || el);
    }

    function up(e) {
      if (start && e.pointerId === start.id) finish(false);
    }
    function cancel(e) {
      if (start && e.pointerId === start.id) finish(true);
    }

    /** Glide the clone to where the real element ended up, then remove it. */
    function settle(c, target) {
      const done = () => {
        c.ghost.remove();
        c.el.classList.remove('drag-src');
      };
      // Let layout update (FLIP moves etc.) before measuring the destination.
      requestAnimationFrame(() => {
        const to = (target.isConnected ? target : c.el).getBoundingClientRect();
        if (B.util.reducedMotion() || typeof c.ghost.animate !== 'function') return done();
        const from = c.ghost.getBoundingClientRect();
        const anim = c.ghost.animate(
          [
            { transform: 'translate(0,0) scale(1.06)' },
            { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(1)` },
          ],
          { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
        );
        anim.onfinish = done;
        anim.oncancel = done;
      });
    }

    el.addEventListener('pointerdown', down);
    return () => el.removeEventListener('pointerdown', down);
  }

  /**
   * Index at which to insert a dragged item into a wrapping row of items,
   * based on the pointer position. `exclude` is the item being dragged.
   */
  function insertIndex(container, x, y, exclude, selector) {
    const kids = Array.from(container.children).filter(
      (k) => k !== exclude && !k.classList.contains('drag-ghost') && (!selector || k.matches(selector))
    );
    for (let i = 0; i < kids.length; i++) {
      const r = kids[i].getBoundingClientRect();
      if (y < r.top - 4) return i;
      if (y <= r.bottom + 4 && x < r.left + r.width / 2) return i;
    }
    return kids.length;
  }

  B.drag = { attach, insertIndex };
})();
