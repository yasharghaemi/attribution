import { el } from './dom';

/**
 * A horizontal carousel: the cards sit in one scrollable row (scroll-snap) that grows
 * sideways, with Previous / Next buttons. The buttons are disabled at either end and
 * hidden when everything fits. The row can also be scrolled by keyboard (it's
 * focusable), touch, trackpad or mouse wheel with Shift.
 */
export function carousel(label: string, cards: HTMLElement[]): HTMLElement {
  const root = el('section', 'ab');
  root.setAttribute('aria-label', label);

  const track = el('ul', 'ab-track');
  track.id = `ab-track-${Math.random().toString(36).slice(2, 8)}`;
  track.tabIndex = 0; // keyboard users can scroll it with the arrow keys
  track.setAttribute('aria-label', label);
  track.append(...cards);

  const button = (cls: string, text: string, name: string) => {
    const b = el('button', `ab-nav ${cls}`);
    b.type = 'button';
    b.setAttribute('aria-label', name);
    b.setAttribute('aria-controls', track.id);
    const icon = el('span', null, text);
    icon.setAttribute('aria-hidden', 'true');
    b.append(icon);
    return b;
  };
  const prev = button('ab-prev', '‹', 'Previous people');
  const next = button('ab-next', '›', 'Next people');

  const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scroll = (dir: 1 | -1) => {
    const behavior: ScrollBehavior = reduceMotion() ? 'auto' : 'smooth';
    track.scrollBy({ left: dir * Math.max(track.clientWidth * 0.85, 160), behavior });
  };
  prev.addEventListener('click', () => scroll(-1));
  next.addEventListener('click', () => scroll(1));

  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const scrollable = max > 1;
    root.classList.toggle('ab-scrollable', scrollable);
    prev.hidden = next.hidden = !scrollable;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max - 1;
  };
  let frame = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  });
  if (typeof ResizeObserver === 'function') new ResizeObserver(update).observe(track);
  else window.addEventListener('resize', update);

  root.append(prev, track, next);
  requestAnimationFrame(update);
  return root;
}
