/**
 * WhatsApp-style people search.
 * - case-insensitive, ignores accents
 * - every word you type must match (so "sr ro" finds "S Rohan")
 * - also matches initials: "sr" finds "S Rohan" and "Sneha Rao"
 * - best matches first: name starts with it, then username / a word in the name / initials, then anywhere
 */

/** Lower-case + strip accents, but keep the SAME length as the input so highlight positions stay correct. */
export function fold(text: string): string {
  let out = '';
  for (const ch of text) {
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    // keep length 1 per UTF-16 unit so indexes line up with the original string
    out += base.length === ch.length ? base : ch.toLowerCase().length === ch.length ? ch.toLowerCase() : ch;
  }
  return out;
}

export function tokenize(query: string): string[] {
  return fold(query).split(/\s+/).map((t) => t.replace(/^@/, '')).filter(Boolean);
}

export interface Searchable { full_name?: string | null; username?: string | null }

/** Lower = better. Returns null when the person does not match every word. */
export function matchRank(person: Searchable, tokens: string[]): number | null {
  if (tokens.length === 0) return 0;
  const name = fold(person.full_name ?? '');
  const user = fold(person.username ?? '');
  const nameWords = name.split(/[\s._-]+/).filter(Boolean);
  const initials = nameWords.map((w) => w[0]).join('');
  let total = 0;
  for (const t of tokens) {
    let best = 9;
    if (name.startsWith(t)) best = 0;
    else if (user.startsWith(t)) best = 1;
    else if (nameWords.some((w) => w.startsWith(t))) best = 2;
    else if (t.length >= 2 && initials.startsWith(t)) best = 2;
    else if (name.includes(t)) best = 3;
    else if (user.includes(t)) best = 4;
    if (best === 9) return null;
    total += best;
  }
  return total;
}

/** Filter + sort a list by a typed query. An empty query returns the list unchanged. */
export function searchPeople<T>(rows: T[], query: string, pick: (row: T) => Searchable | null | undefined): T[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return rows;
  const scored: Array<{ row: T; rank: number; name: string; i: number }> = [];
  rows.forEach((row, i) => {
    const p = pick(row);
    if (!p) return;
    const rank = matchRank(p, tokens);
    if (rank !== null) scored.push({ row, rank, name: fold(p.full_name ?? ''), i });
  });
  scored.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name) || a.i - b.i);
  return scored.map((s) => s.row);
}

/** Split text into pieces so the matching letters can be shown in bold. */
export function highlightParts(text: string, tokens: string[]): Array<{ text: string; hit: boolean }> {
  if (!text) return [];
  if (tokens.length === 0) return [{ text, hit: false }];
  const f = fold(text);
  const mark = new Array<boolean>(text.length).fill(false);
  for (const t of tokens) {
    let from = 0;
    for (;;) {
      const at = f.indexOf(t, from);
      if (at === -1) break;
      for (let k = at; k < at + t.length && k < mark.length; k++) mark[k] = true;
      from = at + t.length;
    }
  }
  const parts: Array<{ text: string; hit: boolean }> = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.hit === mark[i]) last.text += text[i];
    else parts.push({ text: text[i], hit: mark[i] });
  }
  return parts;
}

/**
 * Search any list by text fields (event titles, group names, ride places, ...).
 * Every word typed must appear somewhere in the fields. Rows whose FIRST field starts with the word come first.
 * An empty query returns the list unchanged.
 */
export function searchText<T>(rows: T[], query: string, pick: (row: T) => Array<string | number | null | undefined | string[]>): T[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return rows;
  const scored: Array<{ row: T; rank: number; i: number }> = [];
  rows.forEach((row, i) => {
    const fields = pick(row).flatMap((f) => (Array.isArray(f) ? f : [f])).map((f) => fold(String(f ?? '')));
    const all = fields.join(' \n ');
    let rank = 0;
    for (const t of tokens) {
      if (!all.includes(t)) return; // this row does not match
      const first = fields[0] ?? '';
      rank += first.startsWith(t) ? 0 : first.split(/[\s._-]+/).some((w) => w.startsWith(t)) ? 1 : 2;
    }
    scored.push({ row, rank, i });
  });
  scored.sort((a, b) => a.rank - b.rank || a.i - b.i);
  return scored.map((s) => s.row);
}
