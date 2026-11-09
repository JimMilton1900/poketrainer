export const pretty = (s = '') =>
  String(s).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const dexNo = (id) => `#${String(id).padStart(3, '0')}`;

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '-';