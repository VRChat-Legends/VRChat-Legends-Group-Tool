/** Map short FA names (e.g. fa-book, book) to full class list. Pass through if already "fas ..." / "fab ...". */
export function faIconClass(icon) {
  if (!icon) return 'fas fa-circle';
  const s = String(icon).trim();
  if (/\b(fas|far|fab|fal|fad)\b/.test(s)) return s;
  if (s.startsWith('fa-')) return `fas ${s}`;
  return `fas fa-${s}`;
}
