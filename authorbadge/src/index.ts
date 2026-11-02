/**
 * Author badge: turns what AuthorBadge.dekiscript writes into each `.ab-root` into a
 * horizontal carousel of person cards.
 *
 * The template does the API lookups on the server (cached) and writes, per badge:
 * - `.ab-fallback`: a plain list, shown when this script doesn't run; each item has a
 *   hidden `.ab-person` element with that person's JSON;
 * - `.ab-data` (hidden): `.ab-avatar` and `.ab-source` elements with the avatar@ /
 *   source@ values.
 * Labels, role order and which card parts show come from authorbadge.json - bundled as
 * the default and re-read at runtime next to this script (settings.ts).
 */
import { personCard } from './card';
import { carousel } from './carousel';
import { LABEL, ROLES, SOURCE_LABEL } from './config';
import { el, newTabLink } from './dom';
import { loadSettings } from './settings';
import type { BadgeData, Person } from './types';

const LEGACY_ROLE = 'authorname:';

// authorbadge.json sits next to this script; start loading it straight away.
const scriptBase = ((document.currentScript as HTMLScriptElement | null)?.src || '').replace(/[^/]*$/, '');
const settingsReady = scriptBase ? loadSettings(`${scriptBase}authorbadge.json`) : Promise.resolve();

const mountAll = () => {
  document.querySelectorAll<HTMLElement>('.ab-root:not([data-ab-mounted])').forEach((root) => {
    root.dataset.abMounted = 'true';
    settingsReady.then(() => mount(root));
  });
};
// Pages may render the badge late (or several times); mount each one once.
new MutationObserver(mountAll).observe(document.documentElement, { childList: true, subtree: true });
mountAll();

function mount(root: HTMLElement) {
  const data = readData(root);
  if (!data.people.length) return; // nothing to show; keep whatever the template printed

  const order = new Map(ROLES.map((r, i) => [r.prefix.toLowerCase(), i]));
  const labelOf = (role: string) => ROLES.find((r) => r.prefix.toLowerCase() === role.toLowerCase())?.label || '';
  const rank = (p: Person) => order.get(p.role.toLowerCase()) ?? ROLES.length;

  // Same person listed twice (same role, key and name) shows once; then role order.
  const seen = new Set<string>();
  const people = data.people
    .filter((p) => {
      const id = `${p.role}|${p.key}|${p.name}`.toLowerCase();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map(({ p }) => p);

  // avatar@ pictures belong to the legacy authorname: author (as in the old badge).
  const legacy = people.find((p) => p.role.toLowerCase() === LEGACY_ROLE);
  const cards = people.map((p) => personCard(p, labelOf(p.role), p === legacy ? data.avatars : []));

  const badge = carousel(LABEL, cards);
  if (data.sources.length) {
    const sources = el('p', 'ab-sources');
    sources.append(el('span', 'ab-sources-label', `${SOURCE_LABEL}: `));
    data.sources.forEach((s, i) => {
      if (i) sources.append(', ');
      sources.append(newTabLink(s, s));
    });
    badge.append(sources);
  }

  root.querySelector('.ab-fallback')?.remove();
  root.append(badge);
}

function readData(root: HTMLElement): BadgeData {
  const texts = (selector: string) =>
    Array.from(root.querySelectorAll(selector), (n) => (n.textContent || '').trim()).filter(Boolean);
  const people: Person[] = [];
  texts('.ab-person').forEach((json) => {
    try {
      const p = JSON.parse(json);
      if (p && typeof p === 'object' && typeof p.role === 'string') {
        people.push({ ...p, key: String(p.key || ''), name: String(p.name || p.key || '') });
      }
    } catch (err) {
      console.warn('[author-badge] could not read a person', err);
    }
  });
  return { people, avatars: texts('.ab-data .ab-avatar'), sources: texts('.ab-data .ab-source') };
}
