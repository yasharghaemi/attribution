/**
 * One person as written by AuthorBadge.dekiscript into #ab-data (fields from the
 * authors API; any may be missing). `role` is the tag prefix it came from, e.g.
 * "editor@" or the legacy "authorname:"; `key` is the tag's value after the prefix.
 */
export interface Person {
  role: string;
  /** The key in the page tag (a group's key; its members have their own `key`). */
  tagKey?: string;
  key: string;
  name: string;
  nameURL?: string;
  pictureURL?: string;
  /** "no" means a square picture; anything else a circle (as the legacy badge). */
  pictureCircle?: string;
  campusName?: string;
  campusURL?: string;
  programName?: string;
  programURL?: string;
}

/** Everything the template gave us for one badge. */
export interface BadgeData {
  people: Person[];
  /** avatar@<url> tags: extra pictures, shown with the legacy authorname: author. */
  avatars: string[];
  /** source@<value> tags. */
  sources: string[];
  /** The page's id (for the live refresh); 0 if the template didn't give it. */
  pageId: number;
}
