import { applySettings, currentSettings, type Settings } from './config';

/**
 * authorbadge.json is also loaded at runtime from next to the script (jsDelivr commit,
 * dev server, or the demo's dist/), so editing it changes the badge without a rebuild.
 * A missing or invalid key keeps the built-in value, and the problems are logged.
 */
export async function loadSettings(url: string, timeoutMs = 4000): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { settings, problems } = validateSettings(await res.json(), currentSettings());
    problems.forEach((p) => console.warn(`[author-badge] ${url}: ${p}; using the built-in value`));
    applySettings(settings);
  } catch (err) {
    console.warn(`[author-badge] could not load ${url}; using the built-in settings`, err);
  } finally {
    clearTimeout(timer);
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';

export function validateSettings(raw: unknown, base: Settings): { settings: Settings; problems: string[] } {
  const problems: string[] = [];
  const settings: Settings = { ...base };
  if (!isObject(raw)) return { settings, problems: ['not a JSON object'] };
  const take = <K extends keyof Settings>(key: K, ok: boolean, problem: string) => {
    if (raw[key] === undefined) return;
    if (ok) settings[key] = raw[key] as Settings[K]; else problems.push(`"${key}" ${problem}`);
  };
  take('label', isString(raw.label) && !!raw.label, 'must be non-empty text');
  take('roles', Array.isArray(raw.roles) && raw.roles.every((r) => isObject(r) && isString(r.prefix) && !!r.prefix && isString(r.label)),
    'must be a list of { "prefix", "label" }');
  take('show', isObject(raw.show) && ['picture', 'role', 'campus', 'program'].every((k) => typeof (raw.show as Record<string, unknown>)[k] === 'boolean'),
    'must have true/false "picture", "role", "campus" and "program"');
  take('sourceLabel', isString(raw.sourceLabel), 'must be text');
  return { settings, problems };
}
