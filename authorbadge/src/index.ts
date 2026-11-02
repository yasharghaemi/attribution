/**
 * Author badge: turns what AuthorBadge.dekiscript writes into each `.ab-root` into a
 * horizontal carousel of person cards, and keeps it current.
 *
 * The template does the API lookups on the server (cached) and writes, per badge:
 * - `.ab-fallback`: a plain list, shown when this script doesn't run; each item has a
 *   hidden `.ab-person` element with that person's JSON;
 * - `.ab-data` (hidden): `.ab-avatar` / `.ab-source` (avatar@ / source@ values) and
 *   `.ab-page` (the page id).
 * The server's copy can be stale (cached render), so after drawing it the badge reads
 * the page's live tags and redraws if they differ, looking up only new keys. Page
 * settings also announces saved tags ("cps:tags-saved") so the badge updates at once.
 * Labels, role order and the API host come from authorbadge.json (settings.ts).
 */
import { getPageTags, lookupPeople } from './api';
import { personCard } from './card';
import { carousel } from './carousel';
import { LABEL, ROLES, SOURCE_LABEL } from './config';
import { el, newTabLink } from './dom';
import { loadSettings } from './settings';
import type { BadgeData, Person } from './types';

const LEGACY_ROLE = 'authorname:';
const SKIP_KEYS = ['ck12']; // as the legacy badge

// authorbadge.json sits next to this script; start loading it straight away.
const scriptBase = ((document.currentScript as HTMLScriptElement | null)?.src || '').replace(/[^/]*$/, '');
const settingsReady = scriptBase ? loadSettings(`${scriptBase}authorbadge.json`) : Promise.resolve();

/** What each mounted badge currently shows, so a refresh can reuse known people. */
const shown = new Map<HTMLElement, BadgeData>();

const mountAll = () => {
  document.querySelectorAll<HTMLElement>('.ab-root:not([data-ab-mounted])').forEach((root) => {
    root.dataset.abMounted = 'true';
    settingsReady.then(() => mount(root));
  });
};
// Pages may render the badge late (or several times); mount each one once.
new MutationObserver(mountAll).observe(document.documentElement, { childList: true, subtree: true });
mountAll();

// Page settings saved this page's tags: redraw its badges right away.
document.addEventListener('cps:tags-saved', (e) => {
  const detail = (e as CustomEvent<{ pageId: number; tags: string[] }>).detail;
  if (!detail || !Array.isArray(detail.tags)) return;
  shown.forEach((data, root) => {
    if (data.pageId && data.pageId === Number(detail.pageId)) refresh(root, detail.tags);
  });
});

function mount(root: HTMLElement) {
  const data = readData(root);
  if (data.people.length) render(root, data);
  shown.set(root, data);
  // The server's render may be stale: compare with the page's live tags.
  if (data.pageId) {
    getPageTags(data.pageId).then((tags) => refresh(root, tags), (err) => {
      console.warn('[author-badge] could not read the page tags', err);
    });
  }
}

/** Redraws a badge for these tags, if they differ from what it shows. */
async function refresh(root: HTMLElement, tags: string[]) {
  const current = shown.get(root);
  if (!current) return;
  const wanted = roleTags(tags);
  const avatars = valuesOf(tags, 'avatar@');
  const sources = valuesOf(tags, 'source@');

  const id = (role: string, tagKey: string) => `${role}|${tagKey}`.toLowerCase();
  const known = new Map<string, Person[]>();
  current.people.forEach((p) => {
    const k = id(p.role, p.tagKey || p.key);
    known.set(k, [...(known.get(k) || []), p]);
  });
  const wantedIds = wanted.map((w) => id(w.role, w.tagKey));
  const unchanged = wantedIds.length === known.size && wantedIds.every((k) => known.has(k))
    && same(avatars, current.avatars) && same(sources, current.sources);
  if (unchanged) return;

  // Keep people we already have; look up only the new keys.
  const groups = await Promise.all(wanted.map((w) => known.get(id(w.role, w.tagKey)) || lookupPeople(w.role, w.tagKey)));
  const next: BadgeData = { people: groups.flat(), avatars, sources, pageId: current.pageId };
  shown.set(root, next);
  render(root, next);
}

/** Draws (or redraws) the carousel; with nobody left, the badge disappears. */
function render(root: HTMLElement, data: BadgeData) {
  root.querySelector('.ab-fallback')?.remove();
  root.querySelector(':scope > .ab')?.remove();
  if (!data.people.length) return;

  const order = new Map(ROLES.map((r, i) => [r.prefix.toLowerCase(), i]));
  const labelOf = (role: string) => ROLES.find((r) => r.prefix.toLowerCase() === role.toLowerCase())?.label || '';
  const rank = (p: Person) => order.get(p.role.toLowerCase()) ?? ROLES.length;

  // Same person listed twice (same role, key and name) shows once; then role order.
  const seen = new Set<string>();
  const people = data.people
    .filter((p) => {
      const key = `${p.role}|${p.key}|${p.name}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
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
  root.append(badge);
}

/**
 * The page tags that make badges, as { role, tagKey }, in tag order. The longest
 * matching prefix wins, so "bookauthor@x" is a Book Author, never an "author@".
 */
function roleTags(tags: string[]) {
  const byLength = [...ROLES].sort((a, b) => b.prefix.length - a.prefix.length);
  const out: Array<{ role: string; tagKey: string }> = [];
  tags.forEach((tag) => {
    const role = byLength.find((r) => tag.toLowerCase().startsWith(r.prefix.toLowerCase()));
    if (!role) return;
    const tagKey = tag.slice(role.prefix.length).trim();
    if (tagKey && !SKIP_KEYS.includes(tagKey.toLowerCase())) out.push({ role: role.prefix, tagKey });
  });
  return out;
}

function valuesOf(tags: string[], prefix: string): string[] {
  return tags.filter((t) => t.toLowerCase().startsWith(prefix)).map((t) => t.slice(prefix.length).trim()).filter(Boolean);
}

const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

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
  return {
    people,
    avatars: texts('.ab-data .ab-avatar'),
    sources: texts('.ab-data .ab-source'),
    pageId: Number(texts('.ab-data .ab-page')[0]) || 0,
  };
}
