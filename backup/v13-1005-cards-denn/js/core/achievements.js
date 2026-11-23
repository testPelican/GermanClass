/*
 * Achievements: goals for learning and playing, each with its own SVG badge.
 *
 *   Brezel.achievements.list        [{ id, name (German), en (English subtitle), desc (how to earn it),
 *                                       color, icon (SVG string, viewBox 0 0 64 64),
 *                                       check(snap) -> bool, progress?(snap) -> [current, goal] }]
 *   Brezel.achievements.snapshot()  the facts check() and progress() read (see below)
 *   Brezel.achievements.evaluate({ silent })
 *                                    unlocks every achievement whose check() is now true, saves it in
 *                                    Brezel.store.state.ach = { id: timestamp } and, unless silent, celebrates it
 *                                    (Brezel.ui.celebrateAchievements, js/ui/achievements.js). Returns the new ones.
 *                                    Cheap enough to call after every answer: the answer log is read incrementally.
 *   Brezel.achievements.init()      once at start-up: unlocks silently what earlier progress already earned,
 *                                    with one toast if there was anything.
 *   Brezel.achievements.isUnlocked(id), unlockedAt(id), count() -> { unlocked, total }
 *
 * Facts come from Brezel.store.state: cards (done, lv = review step), log (ok, t, s = session, p = practice,
 * h = hints, r = review), sessions (quit, answered, wrong, total, size, level, hints, skips, fixed, bestCombo,
 * practice), games (game, correct, wrong, won, perfect), streak, bestCombo, xp. Missing fields count as 0.
 * No DOM access here: tools/validate.js loads this file in Node.
 */
(function () {
  'use strict';
  const B = window.Brezel;

  // --- badge art ----------------------------------------------------------------------------
  const FONT = `font-family="system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-weight="900" text-anchor="middle"`;
  const SHINE = 'stroke="#fff" stroke-opacity=".32" stroke-width="3" stroke-linecap="round" fill="none"';

  /** One badge frame per group: learning = medal, streaks = shield, skill = hexagon, topics = tile, games = octagon. */
  const FRAMES = {
    circle: (m, d) =>
      `<circle cx="32" cy="32" r="30" fill="${d}"/><circle cx="32" cy="32" r="25" fill="${m}"/>` +
      `<path d="M13.6 26.5A19 19 0 0 1 26.5 13.6" ${SHINE}/>`,
    shield: (m, d) =>
      `<path d="M32 3L56 11V30C56 45 45 55 32 61C19 55 8 45 8 30V11Z" fill="${d}"/>` +
      `<path d="M32 8.5L51 14.8V30C51 42 42.5 50 32 55C21.5 50 13 42 13 30V14.8Z" fill="${m}"/>` +
      `<path d="M17.5 19.5V28" ${SHINE}/>`,
    hex: (m, d) =>
      `<polygon points="32,2.5 57.5,17.2 57.5,46.8 32,61.5 6.5,46.8 6.5,17.2" fill="${d}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/>` +
      `<polygon points="32,7.5 53.2,19.75 53.2,44.25 32,56.5 10.8,44.25 10.8,19.75" fill="${m}" stroke="${m}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M15.5 21.8L25.5 16" ${SHINE}/>`,
    tile: (m, d) =>
      `<rect x="3" y="3" width="58" height="58" rx="16" fill="${d}"/><rect x="8" y="8" width="48" height="48" rx="12" fill="${m}"/>` +
      `<path d="M13.5 24V20.5A7 7 0 0 1 20.5 13.5H24" ${SHINE}/>`,
    oct: (m, d) =>
      `<polygon points="43.48,4.28 59.72,20.52 59.72,43.48 43.48,59.72 20.52,59.72 4.28,43.48 4.28,20.52 20.52,4.28" fill="${d}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/>` +
      `<polygon points="41.57,8.9 55.1,22.43 55.1,41.57 41.57,55.1 22.43,55.1 8.9,41.57 8.9,22.43 22.43,8.9" fill="${m}" stroke="${m}" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M13.6 23.4L23.4 13.6" ${SHINE}/>`,
  };

  const badge = (frame, main, dark, glyph) =>
    `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${FRAMES[frame](main, dark)}${glyph}</svg>`;

  /** Points of a five-pointed star. */
  function star(cx, cy, R, r) {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const k = i % 2 ? r : R;
      p.push(`${(cx + k * Math.cos(a)).toFixed(2)},${(cy + k * Math.sin(a)).toFixed(2)}`);
    }
    return p.join(' ');
  }

  /** A four-pointed twinkle. */
  const sparkle = (x, y, s, fill = '#fff') =>
    `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${fill}"/>`;

  const text = (x, y, size, fill, s) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${FONT}>${s}</text>`;

  // flame used by the streak badges
  const FLAME = 'M32 13C35 20 43 24 43 34C43 42 38 47 32 47C26 47 21 42 21 34C21 28.5 24.5 26 26.5 21.5C28.5 26 30 27.5 31.5 27.5C31 22.5 30.5 17.5 32 13Z';

  const ICONS = {
    first: badge('circle', '#58cc02', '#43a000',
      '<g fill="#fff"><ellipse cx="24" cy="41" rx="5.2" ry="8" transform="rotate(-14 24 41)"/>' +
      '<circle cx="17.6" cy="31.6" r="1.4"/><circle cx="20.2" cy="30" r="1.6"/><circle cx="23.2" cy="29.3" r="1.8"/><circle cx="26.6" cy="30.1" r="2.1"/>' +
      '<ellipse cx="40" cy="29" rx="5.2" ry="8" transform="rotate(14 40 29)"/>' +
      '<circle cx="37.4" cy="18.3" r="2.1"/><circle cx="40.8" cy="17.3" r="1.8"/><circle cx="43.8" cy="17.9" r="1.6"/><circle cx="46.4" cy="19.5" r="1.4"/></g>'),

    m25: badge('circle', '#00b3a1', '#00897b',
      '<rect x="19" y="17" width="22" height="29" rx="4" fill="#fff" fill-opacity=".5" transform="rotate(-12 30 31)"/>' +
      '<g transform="rotate(6 34 32)"><rect x="23" y="17.5" width="22" height="29" rx="4" fill="#fff"/>' + text(34, 37.5, 14, '#00897b', '25') + '</g>'),

    m100: badge('circle', '#1cb0f6', '#0f86c0',
      `<polygon points="${star(32, 17.5, 6.5, 2.8)}" fill="#ffd60a"/>` +
      '<rect x="14" y="25" width="36" height="16" rx="8" fill="#fff"/>' + text(32, 38, 14, '#0f86c0', '100') +
      sparkle(19, 47, 3) + sparkle(45, 47, 3)),

    m250: badge('circle', '#4f6bff', '#3348d1',
      '<rect x="21" y="15" width="22" height="28" rx="4" fill="#fff" fill-opacity=".45" transform="rotate(-16 32 40)"/>' +
      '<rect x="21" y="15" width="22" height="28" rx="4" fill="#fff" fill-opacity=".45" transform="rotate(16 32 40)"/>' +
      '<rect x="21" y="16" width="22" height="28" rx="4" fill="#fff"/>' + text(32, 34.5, 11.5, '#3348d1', '250')),

    half: badge('circle', '#ff9600', '#d47a00',
      '<circle cx="32" cy="32" r="14" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="5.5"/>' +
      '<path d="M32 18A14 14 0 0 1 32 46" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/>' +
      text(32, 37.5, 15, '#fff', '½')),

    all: badge('circle', '#ffc800', '#b45309',
      '<g fill="#fff" stroke="#b45309" stroke-width="1.6" stroke-linejoin="round">' +
      '<path d="M22 16H42V25C42 33 37.5 38 32 38C26.5 38 22 33 22 25Z"/>' +
      '<rect x="29.5" y="37.5" width="5" height="5.5"/><rect x="23" y="43" width="18" height="5.5" rx="2"/></g>' +
      '<path d="M22 19.5H17.5C17.5 26 19.8 28.8 23.6 29.8M42 19.5H46.5C46.5 26 44.2 28.8 40.4 29.8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
      `<polygon points="${star(32, 26.5, 5.6, 2.4)}" fill="#ff9600"/>` + sparkle(15, 42, 2.6) + sparkle(49, 41, 2.6)),

    streak3: badge('shield', '#ff7a1a', '#d65a00',
      `<path d="${FLAME}" fill="#fff"/>` +
      '<path d="M32 30C34 33.5 38 35.5 38 39.5C38 43 35.5 45.5 32 45.5C28.5 45.5 26 43 26 39.5C26 36 29.5 34 32 30Z" fill="#ffc800"/>' +
      text(32, 44, 10.5, '#c2410c', '3')),

    streak7: badge('shield', '#ff4b4b', '#cf2a2a',
      '<rect x="18" y="18" width="28" height="26" rx="4" fill="#fff"/>' +
      '<path d="M18 22A4 4 0 0 1 22 18H42A4 4 0 0 1 46 22V26H18Z" fill="#ffd0d0"/>' +
      '<rect x="23" y="14.5" width="3.6" height="7.5" rx="1.8" fill="#9f1d1d"/><rect x="37.4" y="14.5" width="3.6" height="7.5" rx="1.8" fill="#9f1d1d"/>' +
      text(32, 41.5, 14, '#cf2a2a', '7')),

    streak30: badge('shield', '#7c3aed', '#5520b5',
      '<path d="M22 21L20 17M27 20V15.5M32 21L34 17" stroke="#ffd60a" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M15 24H43.5C47.5 24 50.5 25.5 51.5 28C48 29 45 29 42.5 28.5C41.5 31 39 32.5 36.5 33V37.5H40.5V42.5H23.5V37.5H27.5V33C21.5 32 16 29.5 15 24Z" fill="#fff"/>' +
      text(30, 31, 8, '#5520b5', '30')),

    combo10: badge('hex', '#ff3d71', '#d0174c',
      '<path d="M19 45.5L33.5 21.5L43.5 31Z" fill="#fff" fill-opacity=".45"/>' +
      '<path d="M15.5 35.5L22.5 28.5M25 48L31 42" stroke="#fff" stroke-opacity=".75" stroke-width="2.5" stroke-linecap="round"/>' +
      '<circle cx="38" cy="26.5" r="9" fill="#fff"/>' + text(38, 30, 9.5, '#d0174c', '10')),

    combo25: badge('hex', '#1e3a8a', '#13235a',
      '<circle cx="17" cy="21" r="1.1" fill="#fff"/><circle cx="46" cy="44" r="1.3" fill="#fff"/><circle cx="20" cy="43" r="0.9" fill="#fff"/><circle cx="47.5" cy="22" r="1" fill="#fff"/>' +
      '<g transform="rotate(40 32 32)">' +
      '<path d="M27.5 40C27.5 45 30 48 32 51C34 48 36.5 45 36.5 40Z" fill="#ffc800"/>' +
      '<path d="M25 33L19.5 41L25.8 40ZM39 33L44.5 41L38.2 40Z" fill="#ff4b4b"/>' +
      '<path d="M32 11C38 16 40 24 40 31L38.5 40H25.5L24 31C24 24 26 16 32 11Z" fill="#fff"/>' +
      '<circle cx="32" cy="25" r="3.6" fill="#60a5fa" stroke="#13235a" stroke-width="1.4"/>' + text(32, 36.5, 7, '#1e3a8a', '25') + '</g>'),

    flawless: badge('hex', '#06b6d4', '#0587a0',
      '<path d="M20.5 25L26.5 17H37.5L43.5 25L32 47Z" fill="#fff"/>' +
      '<path d="M20.5 25H43.5M26.5 17L29.5 25L32 47L34.5 25L37.5 17" fill="none" stroke="#0587a0" stroke-width="1.6" stroke-linejoin="round"/>' +
      sparkle(45.5, 16.5, 3.4) + sparkle(18, 39, 2.6)),

    solo: badge('hex', '#10b981', '#06875d',
      '<circle cx="32" cy="18.5" r="5" fill="#fff"/>' +
      '<path d="M32 27V39M32 29.5L23.5 21.5M32 29.5L40.5 21.5M32 39L26.5 48.5M32 39L37.5 48.5" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      sparkle(18.5, 34, 3) + sparkle(45.5, 34, 3)),

    helped: badge('hex', '#f43f5e', '#be123c',
      '<circle cx="32" cy="32" r="18.5" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" stroke-dasharray="3 3"/>' +
      '<circle cx="32" cy="32" r="12.5" fill="none" stroke="#fff" stroke-width="7"/>' +
      '<circle cx="32" cy="32" r="12.5" fill="none" stroke="#be123c" stroke-width="7" stroke-dasharray="6.5 13.14" stroke-dashoffset="3.25"/>'),

    high: badge('hex', '#3b82f6', '#1d4ed8',
      '<path d="M14 43L27 22L34 32L39 26L50 43Z" fill="#fff"/>' +
      '<path d="M27 22L31.5 29.2L29 28.3L27 30.8L24.6 28L22.9 28.8Z" fill="#bfdbfe"/>' +
      '<path d="M27 22V12" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M27 12L36 15L27 18Z" fill="#ff4b4b"/>'),

    snack: badge('hex', '#f59e0b', '#b45309',
      // one dough rope: left arm → right loop → belly → left loop → right arm, the arms twisting in the middle
      '<path d="M24 45C28 40 30 37 33 33C37 28 41 24 41 21C41 16 47 15 49 20C51 26 50 34 45 40C40 45 24 45 19 40C14 34 13 26 15 20C17 15 23 16 23 21C23 24 27 28 31 33C34 37 36 40 40 45" fill="none" stroke="#7c2d12" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M24 45C28 40 30 37 33 33C37 28 41 24 41 21C41 16 47 15 49 20C51 26 50 34 45 40C40 45 24 45 19 40C14 34 13 26 15 20C17 15 23 16 23 21C23 24 27 28 31 33C34 37 36 40 40 45" fill="none" stroke="#c2621a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<g fill="#fff"><circle cx="17.3" cy="27" r="1.1"/><circle cx="46" cy="18.6" r="1.1"/><circle cx="31" cy="44.3" r="1.1"/><circle cx="48.6" cy="30" r="1"/><circle cx="37.5" cy="27.6" r="1"/><circle cx="21" cy="18.8" r="1"/></g>'),

    early: badge('hex', '#f472b6', '#d61f78',
      '<path d="M21 40A11 11 0 0 1 43 40Z" fill="#ffd60a"/>' +
      '<path d="M32 26V22M23 29.3L20.4 26.2M41 29.3L43.6 26.2M18.5 36.4L14.8 35.3M45.5 36.4L49.2 35.3" stroke="#ffd60a" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M14.5 40.5H49.5" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M19.5 45.5H29M34 45.5H44.5" stroke="#fff" stroke-opacity=".75" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M25 50H39" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/>'),

    owl: badge('hex', '#312e81', '#1e1b4b',
      '<path d="M20 26L18 17L25 22C29 20.5 35 20.5 39 22L46 17L44 26C46 30 46 36 44 40C41 46 36 48 32 48C28 48 23 46 20 40C18 36 18 30 20 26Z" fill="#a78bfa"/>' +
      '<circle cx="26" cy="31" r="6" fill="#fff"/><circle cx="38" cy="31" r="6" fill="#fff"/>' +
      '<circle cx="26.8" cy="31.6" r="2.7" fill="#1e1b4b"/><circle cx="37.2" cy="31.6" r="2.7" fill="#1e1b4b"/>' +
      '<circle cx="27.6" cy="30.6" r=".9" fill="#fff"/><circle cx="38" cy="30.6" r=".9" fill="#fff"/>' +
      '<path d="M30.4 36L32 40L33.6 36Z" fill="#ff9600"/>' +
      '<path d="M28 43L30 44.5L32 43L34 44.5L36 43" fill="none" stroke="#7c6bd6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      sparkle(14, 31, 2.2, '#ffd60a') + sparkle(50, 31, 2.2, '#ffd60a')),

    review50: badge('hex', '#d946ef', '#a21caf',
      '<path d="M20.5 29A12 12 0 0 1 41.5 24.5M43.5 35A12 12 0 0 1 22.5 39.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M43.7 21.5L38 26L44 27.6ZM20.3 42.5L26 38L20 36.4Z" fill="#fff"/>' + text(32, 35.6, 10, '#fff', '50')),

    elephant: badge('hex', '#6366f1', '#4338ca',
      '<ellipse cx="20.5" cy="30" rx="8.2" ry="10.5" fill="#c7d2fe"/><ellipse cx="43.5" cy="30" rx="8.2" ry="10.5" fill="#c7d2fe"/>' +
      '<circle cx="32" cy="29" r="10.5" fill="#fff"/>' +
      '<path d="M32 34C32 41 31 44.5 34.5 48" fill="none" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/>' +
      '<circle cx="28" cy="27.5" r="1.6" fill="#312e81"/><circle cx="36" cy="27.5" r="1.6" fill="#312e81"/>' +
      `<polygon points="${star(32, 14.5, 3.6, 1.6)}" fill="#ffd60a"/>`),

    fixer: badge('hex', '#dc2626', '#991b1b',
      '<path d="M37 37L46 46" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/>' +
      '<circle cx="28.5" cy="28.5" r="11" fill="#fee2e2" stroke="#fff" stroke-width="4"/>' +
      '<path d="M23.5 28.5L27.3 32.3L33.8 25" fill="none" stroke="#16a34a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'),

    topic: badge('tile', '#a855f7', '#7e22ce',
      '<path d="M16 41L17.5 22L25.5 30L32 17L38.5 30L46.5 22L48 41Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>' +
      '<rect x="16" y="41.5" width="32" height="5.5" rx="2" fill="#fff"/>' +
      '<circle cx="32" cy="34" r="2.6" fill="#ff4b4b"/><circle cx="24" cy="36" r="2" fill="#1cb0f6"/><circle cx="40" cy="36" r="2" fill="#58cc02"/>' +
      '<circle cx="17.5" cy="21" r="2.2" fill="#ffd60a"/><circle cx="32" cy="16" r="2.4" fill="#ffd60a"/><circle cx="46.5" cy="21" r="2.2" fill="#ffd60a"/>'),

    verbs: badge('tile', '#0ea5e9', '#0369a1',
      '<path d="M13 21C19 19 26 19.5 31 23V46C26 43 19 42.5 13 44Z" fill="#fff"/>' +
      '<path d="M51 21C45 19 38 19.5 33 23V46C38 43 45 42.5 51 44Z" fill="#fff"/>' +
      '<path d="M17 27.5C21 26.7 24.5 26.9 27.5 28.1M17 32.5C21 31.7 24.5 31.9 27.5 33.1M17 37.5C21 36.7 24.5 36.9 27.5 38.1M47 32.5C43 31.7 39.5 31.9 36.5 33.1M47 37.5C43 36.7 39.5 36.9 36.5 38.1" fill="none" stroke="#7dd3fc" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M40 19.6V29.5L42.5 27.5L45 29.5V19.9" fill="#ff4b4b"/>'),

    mirror: badge('tile', '#ec4899', '#be185d',
      '<g transform="rotate(-25 32 32)">' +
      '<rect x="29" y="37" width="6" height="13" rx="3" fill="#fff"/>' +
      '<ellipse cx="32" cy="25.5" rx="11" ry="13" fill="#fff"/><ellipse cx="32" cy="25.5" rx="8" ry="10" fill="#bae6fd"/>' +
      '<path d="M27 21L31 17M28.5 26.5L35 20" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>' +
      sparkle(46, 17, 3) + sparkle(18, 44, 2.4)),

    rules: badge('tile', '#0d9488', '#0b6b62',
      '<g transform="rotate(-35 32 32)"><rect x="11" y="25.5" width="42" height="13" rx="2.5" fill="#fff"/>' +
      '<path d="M16 25.5V31M21 25.5V29M26 25.5V31M31 25.5V29M36 25.5V31M41 25.5V29M46 25.5V31" stroke="#0b6b62" stroke-width="1.8" stroke-linecap="round"/></g>'),

    xp1000: badge('tile', '#2563eb', '#1e40af',
      '<path d="M35.5 11L19 35H30L26.5 53L45 27H34Z" fill="#ffd60a" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>' +
      sparkle(17, 18, 3) + sparkle(47.5, 45, 3.2) + sparkle(46, 15.5, 2)),

    game1: badge('oct', '#84cc16', '#4d7c0f',
      '<g transform="translate(32 33) scale(.88) translate(-32 -33)">' +
      '<path d="M21 23H43C49 23 52 28 52.5 34L53 39C53.5 43.5 48.5 45.5 45.5 42L41.5 37.5H22.5L18.5 42C15.5 45.5 10.5 43.5 11 39L11.5 34C12 28 15 23 21 23Z" fill="#fff"/>' +
      '<path d="M19.5 30.5H22.5V27.5H25.5V30.5H28.5V33.5H25.5V36.5H22.5V33.5H19.5Z" fill="#4d7c0f"/>' +
      '<circle cx="42" cy="29" r="2.4" fill="#ff4b4b"/><circle cx="46.5" cy="33" r="2.4" fill="#1cb0f6"/><circle cx="37.5" cy="33" r="2.4" fill="#ffc800"/></g>'),

    game5: badge('oct', '#f97316', '#c2410c',
      '<g transform="rotate(-14 24 35)"><rect x="14" y="25" width="20" height="20" rx="4.5" fill="#fff"/>' +
      '<g fill="#c2410c"><circle cx="18.8" cy="29.8" r="1.9"/><circle cx="29.2" cy="29.8" r="1.9"/><circle cx="24" cy="35" r="1.9"/><circle cx="18.8" cy="40.2" r="1.9"/><circle cx="29.2" cy="40.2" r="1.9"/></g></g>' +
      '<g transform="rotate(12 40 28)"><rect x="31" y="19" width="18" height="18" rx="4" fill="#fff" stroke="#f97316" stroke-width="1.6"/>' +
      '<g fill="#c2410c"><circle cx="35.5" cy="23.5" r="1.8"/><circle cx="40" cy="28" r="1.8"/><circle cx="44.5" cy="32.5" r="1.8"/></g></g>'),

    boss: badge('oct', '#7f1d1d', '#450a0a',
      '<path d="M17 22C24 26 31 32 35 40M21 17C28 22 35 28 40 35M26 13C33 17 39 23 44 30" fill="none" stroke="#fca5a5" stroke-width="3" stroke-linecap="round"/>' +
      '<g transform="rotate(45 32 32) translate(32 32) scale(.85) translate(-32 -32)">' +
      '<path d="M29.2 10L32 5L34.8 10V39H29.2Z" fill="#fff"/><path d="M32 8V38" stroke="#cbd5e1" stroke-width="1"/>' +
      '<rect x="22.5" y="39" width="19" height="4.2" rx="2.1" fill="#ffc800"/><rect x="30" y="43" width="4" height="8.5" rx="1.5" fill="#b45309"/>' +
      '<circle cx="32" cy="53.5" r="3" fill="#ffc800"/></g>'),

    perfect: badge('oct', '#14b8a6', '#0f766e',
      `<polygon points="${star(32, 33.5, 15.5, 6.8)}" fill="#ffd60a" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>` +
      sparkle(16.5, 18, 3) + sparkle(47.5, 45.5, 2.6) + sparkle(46.5, 17.5, 2.2)),

    hoer: badge('oct', '#8b5cf6', '#6d28d9',
      '<path d="M19 25A11 11 0 1 1 41 25C41 35 31 36 31 43A6 6 0 1 1 19 43" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M35 25A5 5 0 0 0 25 25V27A3.5 3.5 0 1 1 25 34" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>' +
      '<path d="M45 21.5C47.5 24.5 47.5 29.5 45 32.5M49 17.5C53 22.5 53 31.5 49 36.5" fill="none" stroke="#ffd60a" stroke-width="3" stroke-linecap="round"/>'),

    schere: badge('oct', '#22c55e', '#15803d',
      '<path d="M22.8 42.2L48 17M20.4 28.6L51 34" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>' +
      '<circle cx="22.8" cy="42.2" r="5" fill="#22c55e" stroke="#fff" stroke-width="4"/>' +
      '<circle cx="20.4" cy="28.6" r="5" fill="#22c55e" stroke="#fff" stroke-width="4"/>' +
      '<circle cx="34" cy="31" r="2" fill="#15803d"/>' +
      '<path d="M32 50H46" stroke="#fff" stroke-opacity=".75" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 4"/>'),
  };

  // --- facts ------------------------------------------------------------------------------------
  const n = (x) => Number(x) || 0;

  /** The answer log is append-only, so it is read incrementally (a reset or reload starts over). */
  let scan = null;
  function scanLog(log) {
    if (!scan || scan.log !== log || log.length < scan.seen) {
      scan = { log, seen: 0, reviews: new Set(), fixed: new Set(), hints: 0, early: false, owl: false, run: 0, runSession: null, bestRun: 0 };
    }
    for (let i = scan.seen; i < log.length; i++) {
      const l = log[i];
      if (!l) continue;
      const hr = new Date(l.t).getHours();
      if (hr >= 4 && hr < 8) scan.early = true;
      if (hr >= 22 || hr < 4) scan.owl = true;
      if (l.r && !l.p) scan.reviews.add(l.s + ':' + l.id);
      if (l.p && l.ok) scan.fixed.add(l.s + ':' + l.id);
      if (l.h) scan.hints += n(l.h);
      if (l.s !== scan.runSession) {
        scan.run = 0;
        scan.runSession = l.s;
      }
      scan.run = l.ok ? scan.run + 1 : 0;
      if (scan.run > scan.bestRun) scan.bestRun = scan.run;
    }
    scan.seen = log.length;
    return scan;
  }

  /** Which cards are in which topic (a collecting topic such as Rules included); kept until the deck changes. */
  let members = null;
  function membership() {
    const cards = B.deck.cards;
    if (members && members.cards === cards && members.n === cards.length && members.topics === B.deck.topics.length) return members.map;
    const map = {};
    for (const t of B.deck.topics) map[t.id] = [];
    for (const c of cards) for (const t of B.deck.topics) if (B.deck.inTopic(c, t.id)) map[t.id].push(c.id);
    members = { cards, n: cards.length, topics: B.deck.topics.length, map };
    return map;
  }

  /**
   * Everything the checks read:
   * { done, total, topStep, topics: { id: {done, total} }, bestTopic: {id, done, total}, xp, bestStreak, bestCombo,
   *   reviews, early, owl, helped, flawless, solo, high, snack, fixed,
   *   games, gameKinds, bossWon, perfectGame, hoerBest, schereBest }
   */
  function snapshot() {
    const st = (B.store && B.store.state) || {};
    const cards = st.cards || {};
    const deck = (B.deck && B.deck.cards) || [];

    let done = 0;
    let topStep = 0;
    for (const c of deck) {
      const s = cards[c.id];
      if (s && s.done) {
        done++;
        topStep = Math.max(topStep, n(s.lv));
      }
    }

    const topics = {};
    let bestTopic = null;
    const map = membership();
    for (const t of B.deck.topics) {
      const ids = map[t.id] || [];
      let d = 0;
      for (const id of ids) if (cards[id] && cards[id].done) d++;
      topics[t.id] = { done: d, total: ids.length };
      if (ids.length && (!bestTopic || d / ids.length > bestTopic.done / bestTopic.total)) bestTopic = { id: t.id, done: d, total: ids.length };
    }

    const log = scanLog(st.log || []);

    let helped = log.hints > 0;
    let bestCombo = Math.max(n(st.bestCombo), log.bestRun);
    let flawless = false;
    let solo = false;
    let high = false;
    let snack = false;
    let fixed = 0;
    for (const s of st.sessions || []) {
      if (!s) continue;
      if (n(s.hints) > 0) helped = true;
      bestCombo = Math.max(bestCombo, n(s.bestCombo));
      // finished = the summary was reached (endSession wrote quit: false); a closed tab leaves it undefined
      if (s.quit !== false || n(s.answered) === 0) continue;
      const big = (n(s.total) || n(s.answered)) >= 10;
      if (big && n(s.wrong) === 0) flawless = true;
      if (big && s.hints != null && s.skips != null && n(s.hints) === 0 && n(s.skips) === 0) solo = true;
      if (s.level === 'high' && !s.practice) high = true;
      if (n(s.size) === 5) snack = true;
      if (s.practice) fixed += n(s.fixed);
    }
    fixed = Math.max(fixed, log.fixed.size);

    const games = (st.games || []).filter(Boolean);
    const kinds = new Set();
    let bossWon = false;
    let perfectGame = false;
    let hoerBest = 0;
    let schereBest = 0;
    for (const g of games) {
      kinds.add(g.game);
      if (g.game === 'boss' && g.won === true) bossWon = true;
      if (g.perfect === true || (n(g.wrong) === 0 && n(g.correct) > 0)) perfectGame = true;
      if (g.game === 'hoer') hoerBest = Math.max(hoerBest, n(g.correct));
      if (g.game === 'schere') schereBest = Math.max(schereBest, n(g.correct));
    }

    const sk = st.streak || {};
    return {
      done,
      total: deck.length,
      topStep,
      topics,
      bestTopic,
      xp: n(st.xp),
      bestStreak: Math.max(n(sk.best), n(sk.count)),
      bestCombo,
      reviews: log.reviews.size,
      early: log.early,
      owl: log.owl,
      helped,
      flawless,
      solo,
      high,
      snack,
      fixed,
      games: games.length,
      gameKinds: kinds.size,
      bossWon,
      perfectGame,
      hoerBest,
      schereBest,
    };
  }

  // --- definitions ------------------------------------------------------------------------------
  const topicOf = (s, id) => s.topics[id] || { done: 0, total: 0 };
  /** "Master N cards of a topic" — the goal shrinks if the topic has fewer cards. */
  const topicGoal = (id, goal) => ({
    check: (s) => topicOf(s, id).total > 0 && topicOf(s, id).done >= Math.min(goal, topicOf(s, id).total),
    progress: (s) => [topicOf(s, id).done, Math.min(goal, topicOf(s, id).total) || goal],
  });
  const atLeast = (key, goal) => ({ check: (s) => s[key] >= goal, progress: (s) => [s[key], goal] });
  const flag = (key) => ({ check: (s) => !!s[key] });

  const DEFS = [
    // learning
    { id: 'first', name: 'Erster Schritt', en: 'First step', desc: 'Master your first card.', color: '#58cc02', ...atLeast('done', 1) },
    { id: 'm25', name: 'Fünfundzwanzig', en: 'A good start', desc: 'Master 25 cards.', color: '#00b3a1', ...atLeast('done', 25) },
    { id: 'm100', name: 'Hundertprozentig', en: 'A hundred cards', desc: 'Master 100 cards.', color: '#1cb0f6', ...atLeast('done', 100) },
    { id: 'm250', name: 'Vierteltausend', en: 'A quarter of a thousand', desc: 'Master 250 cards.', color: '#4f6bff', ...atLeast('done', 250) },
    {
      id: 'half', name: 'Halbzeit', en: 'Half-time', desc: 'Master half of all the cards in the app.', color: '#ff9600',
      check: (s) => s.total > 0 && s.done >= Math.ceil(s.total / 2),
      progress: (s) => [s.done, Math.max(1, Math.ceil(s.total / 2))],
    },
    {
      id: 'all', name: 'Alles fertig!', en: 'The whole deck', desc: 'Master every single card.', color: '#ffc800',
      check: (s) => s.total > 0 && s.done >= s.total,
      progress: (s) => [s.done, Math.max(1, s.total)],
    },
    // streaks
    { id: 'streak3', name: 'Dranbleiben', en: 'Keep at it', desc: 'Learn three days in a row.', color: '#ff7a1a', ...atLeast('bestStreak', 3) },
    { id: 'streak7', name: 'Eine ganze Woche', en: 'A whole week', desc: 'Learn seven days in a row.', color: '#ff4b4b', ...atLeast('bestStreak', 7) },
    { id: 'streak30', name: 'Eiserner Wille', en: 'Iron will', desc: 'Learn 30 days in a row.', color: '#7c3aed', ...atLeast('bestStreak', 30) },
    // skill
    { id: 'combo10', name: 'Heiße Serie', en: 'Hot streak', desc: 'Get 10 cards right in a row in one session.', color: '#ff3d71', ...atLeast('bestCombo', 10) },
    { id: 'combo25', name: 'Unaufhaltsam', en: 'Unstoppable', desc: 'Get 25 cards right in a row in one session.', color: '#1e3a8a', ...atLeast('bestCombo', 25) },
    { id: 'flawless', name: 'Fehlerfrei', en: 'Flawless', desc: 'Finish a session of 10 or more cards without a single mistake.', color: '#06b6d4', ...flag('flawless') },
    { id: 'solo', name: 'Ganz allein', en: 'All by myself', desc: 'Finish a session of 10 or more cards without “Help me” and without “I don’t know”.', color: '#10b981', ...flag('solo') },
    { id: 'helped', name: 'Hilfe!', en: 'A little help', desc: 'Use “Help me” for the first time. That’s what it’s there for!', color: '#f43f5e', ...flag('helped') },
    { id: 'high', name: 'Gipfelstürmer', en: 'Summit stormer', desc: 'Finish a learning session on High difficulty.', color: '#3b82f6', ...flag('high') },
    { id: 'snack', name: 'Brezel-Snack', en: 'Snack time', desc: 'Finish a quick 5-card session.', color: '#f59e0b', ...flag('snack') },
    { id: 'early', name: 'Frühaufsteher', en: 'Early riser', desc: 'Learn before 8 in the morning. Ich bin früh aufgestanden!', color: '#f472b6', ...flag('early') },
    { id: 'owl', name: 'Nachteule', en: 'Night owl', desc: 'Learn after 10 at night.', color: '#312e81', ...flag('owl') },
    { id: 'review50', name: 'Gutes Gedächtnis', en: 'Good memory', desc: 'Do 50 reviews of cards you had already mastered.', color: '#d946ef', ...atLeast('reviews', 50) },
    { id: 'elephant', name: 'Elefantengedächtnis', en: 'A memory like an elephant', desc: 'Bring a card to the top review step (6 of 6: back in three months).', color: '#6366f1', ...atLeast('topStep', 6) },
    { id: 'fixer', name: 'Fehlerjäger', en: 'Mistake hunter', desc: 'Get 10 cards right in “Practise mistakes”.', color: '#dc2626', ...atLeast('fixed', 10) },
    // topics
    {
      id: 'topic', name: 'Themenmeister', en: 'Topic master', desc: 'Master every card of one topic.', color: '#a855f7',
      check: (s) => !!s.bestTopic && s.bestTopic.done >= s.bestTopic.total,
      progress: (s) => (s.bestTopic ? [s.bestTopic.done, s.bestTopic.total] : [0, 1]),
    },
    { id: 'verbs', name: 'Kleines Wörterbuch', en: 'Little dictionary', desc: 'Master 50 cards of the Verb list.', color: '#0ea5e9', ...topicGoal('verblist', 50) },
    { id: 'mirror', name: 'Spieglein, Spieglein', en: 'Mirror, mirror', desc: 'Master 25 reflexive-verb cards (mich, dich, sich, uns, euch).', color: '#ec4899', ...topicGoal('reflexive', 25) },
    { id: 'rules', name: 'Regelkenner', en: 'Knows the rules', desc: 'Master 30 cards of the Rules topic.', color: '#0d9488', ...topicGoal('rules', 30) },
    { id: 'xp1000', name: 'Tausendsassa', en: 'A thousand XP', desc: 'Earn 1,000 XP.', color: '#2563eb', ...atLeast('xp', 1000) },
    // games
    { id: 'game1', name: 'Spielkind', en: 'Let’s play', desc: 'Play your first minigame.', color: '#84cc16', ...atLeast('games', 1) },
    { id: 'game5', name: 'Spielesammler', en: 'Game collector', desc: 'Play five different minigames.', color: '#f97316', ...atLeast('gameKinds', 5) },
    { id: 'boss', name: 'Drachentöter', en: 'Dragon slayer', desc: 'Defeat a boss in Bossfight.', color: '#7f1d1d', ...flag('bossWon') },
    { id: 'perfect', name: 'Makellos', en: 'Not a scratch', desc: 'Finish a minigame without a single mistake.', color: '#14b8a6', ...flag('perfectGame') },
    { id: 'hoer', name: 'Ganz Ohr', en: 'All ears', desc: 'Get 10 right in one round of Hör genau.', color: '#8b5cf6', ...atLeast('hoerBest', 10) },
    { id: 'schere', name: 'Scharfe Schere', en: 'Sharp scissors', desc: 'Get 10 right in one round of Die Schere.', color: '#22c55e', ...atLeast('schereBest', 10) },
  ];
  for (const d of DEFS) d.icon = ICONS[d.id];

  // --- unlocking -------------------------------------------------------------------------------
  function store() {
    const st = B.store && B.store.state;
    if (!st) return null;
    if (!st.ach || typeof st.ach !== 'object') st.ach = {};
    return st.ach;
  }

  const unlockedAt = (id) => {
    const a = B.store && B.store.state && B.store.state.ach;
    return (a && a[id]) || null;
  };

  function evaluate({ silent = false } = {}) {
    const ach = store();
    if (!ach || !B.deck || !B.deck.cards) return [];
    const open = DEFS.filter((d) => !ach[d.id]);
    if (!open.length) return [];
    const snap = snapshot();
    const now = Date.now();
    const fresh = [];
    for (const d of open) {
      let ok = false;
      try {
        ok = !!d.check(snap);
      } catch (e) {
        ok = false; // a broken check must never break a session
      }
      if (ok) {
        ach[d.id] = now;
        fresh.push(d);
      }
    }
    if (fresh.length) {
      B.store.save();
      if (!silent && B.ui && B.ui.celebrateAchievements) {
        try {
          B.ui.celebrateAchievements(fresh);
        } catch (e) {
          /* the celebration is decoration */
        }
      }
    }
    return fresh;
  }

  function init() {
    const got = evaluate({ silent: true });
    if (got.length && B.app && B.app.toast) {
      B.app.toast(got.length === 1 ? `🏅 You have already earned “${got[0].name}”!` : `🏅 You have already earned ${got.length} achievements!`, { ms: 4200 });
    }
    return got;
  }

  function count() {
    const a = (B.store && B.store.state && B.store.state.ach) || {};
    return { unlocked: DEFS.filter((d) => a[d.id]).length, total: DEFS.length };
  }

  B.achievements = {
    list: DEFS,
    snapshot,
    evaluate,
    init,
    count,
    unlockedAt,
    isUnlocked: (id) => !!unlockedAt(id),
  };
})();
