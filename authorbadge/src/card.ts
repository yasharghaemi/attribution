import { SHOW } from './config';
import { el, newTabLink, safeUrl } from './dom';
import type { Person } from './types';

/**
 * One person card: picture(s), role badge, name, campus and "via" program. Links open
 * in a new tab. Pictures have alt="" because the name is right next to them.
 */
export function personCard(person: Person, roleLabel: string, extraPictures: string[] = []): HTMLLIElement {
  const card = el('li', 'ab-card');

  const pictures = [safeUrl(person.pictureURL), ...extraPictures.map(safeUrl)].filter(Boolean);
  if (SHOW.picture && pictures.length) {
    const pics = el('div', 'ab-pics');
    pictures.forEach((src) => {
      const img = el('img', person.pictureCircle === 'no' ? 'ab-pic' : 'ab-pic ab-pic-circle');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      pics.append(img);
    });
    card.append(pics);
  }

  const info = el('div', 'ab-info');
  if (SHOW.role && roleLabel) info.append(el('span', 'ab-role', roleLabel));
  info.append(newTabLink(person.nameURL, person.name || person.key, 'ab-name'));

  const campus = SHOW.campus && person.campusName;
  const program = SHOW.program && person.programName;
  if (campus || program) {
    const line = el('span', 'ab-org');
    if (campus) line.append(newTabLink(person.campusURL, person.campusName!));
    if (campus && program) line.append(el('span', 'ab-via', ' via '));
    if (program) line.append(newTabLink(person.programURL, person.programName!));
    info.append(line);
  }
  card.append(info);
  return card;
}
