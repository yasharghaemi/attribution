export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string | null,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/** Only http(s) addresses become links (no javascript:, data:, …). */
export function safeUrl(url: string | undefined): string {
  return url && /^https?:\/\//i.test(url.trim()) ? url.trim() : '';
}

/**
 * A link that opens in a new tab (rel=noopener); screen readers are told so. With no
 * usable URL it's plain text instead.
 */
export function newTabLink(href: string | undefined, text: string, className?: string): HTMLElement {
  const url = safeUrl(href);
  if (!url) return el('span', className, text);
  const a = el('a', className, text);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.append(el('span', 'ab-sr-only', ' (opens in a new tab)'));
  return a;
}
