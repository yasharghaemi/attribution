import bundledSettings from '../authorbadge.json';

/** One badge role: page tags starting with `prefix` (e.g. "editor@") are people in it. */
export interface RoleConfig {
  prefix: string;
  label: string;
}

/**
 * What the badge shows, from authorbadge.json (see settings.ts):
 * - label: accessible name of the carousel region.
 * - roles: roles in display order, with their badge labels. Keep the prefixes in sync
 *   with ROLES in AuthorBadge.dekiscript, which decides which tags are looked up.
 * - show: which parts of a card to show.
 * - sourceLabel: text before the source@ links under the carousel.
 */
export interface Settings {
  label: string;
  roles: RoleConfig[];
  show: { picture: boolean; role: boolean; campus: boolean; program: boolean };
  sourceLabel: string;
}

// Live bindings: start as authorbadge.json at build time; applySettings() swaps in the
// runtime copy before anything is rendered.
const bundled = bundledSettings as unknown as Settings;
export let LABEL: string = bundled.label;
export let ROLES: RoleConfig[] = bundled.roles;
export let SHOW: Settings['show'] = bundled.show;
export let SOURCE_LABEL: string = bundled.sourceLabel;

export function currentSettings(): Settings {
  return { label: LABEL, roles: ROLES, show: SHOW, sourceLabel: SOURCE_LABEL };
}

export function applySettings(s: Settings): void {
  LABEL = s.label;
  ROLES = s.roles;
  SHOW = s.show;
  SOURCE_LABEL = s.sourceLabel;
}
