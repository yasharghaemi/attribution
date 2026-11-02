import { AUTHORS_API_HOST } from './config';
import type { Person } from './types';

/** The page's current tags (same-origin MindTouch API; the session cookie applies). */
export async function getPageTags(pageId: number): Promise<string[]> {
  const res = await fetch(`/@api/deki/pages/${pageId}/tags?dream.out.format=json`, {
    credentials: 'same-origin',
    headers: { 'X-Deki-Client': 'mindtouch-martian' },
  });
  if (!res.ok) throw new Error(`GET tags: HTTP ${res.status}`);
  const data = await res.json();
  // MindTouch JSON gives a single object instead of a one-item array.
  const list = data == null || data.tag == null ? [] : Array.isArray(data.tag) ? data.tag : [data.tag];
  return list.map((t: { '@value'?: string }) => t['@value'] || '').filter(Boolean);
}

type Raw = Partial<Person> & { nameKey?: string; members?: unknown };
type Answer = { err?: boolean; author?: unknown; authors?: unknown };
const isObject = (v: unknown): v is Raw & Answer => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * The people for one tag key, the way the template reads them: a group is
 * { author: { members: [...] } } (one person per member), a single person is
 * { author: {...} }; { authors: [...] } or a plain list are accepted too. A failed or
 * empty answer gives one person named by the key.
 */
export async function lookupPeople(role: string, tagKey: string): Promise<Person[]> {
  const asPerson = (p: Raw): Person => ({
    role,
    tagKey,
    key: String(p.nameKey || tagKey),
    name: String(p.name || p.nameKey || tagKey),
    nameURL: p.nameURL || '',
    pictureURL: p.pictureURL || '',
    pictureCircle: p.pictureCircle || '',
    campusName: p.campusName || '',
    campusURL: p.campusURL || '',
    programName: p.programName || '',
    programURL: p.programURL || '',
  });
  try {
    const res = await fetch(`${AUTHORS_API_HOST}/api/v1/authors/key/${encodeURIComponent(tagKey)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const author = isObject(data) && data.err === false && isObject(data.author) ? data.author as Raw : null;
    const raw: unknown[] = Array.isArray(data) ? data
      : isObject(data) && data.err === false && Array.isArray(data.authors) ? data.authors
      : author ? (Array.isArray(author.members) ? author.members : [author])
      : [];
    const people = raw.filter(isObject).map(asPerson);
    if (people.length) return people;
  } catch (err) {
    console.warn(`[author-badge] could not look up ${tagKey}`, err);
  }
  return [asPerson({})];
}
