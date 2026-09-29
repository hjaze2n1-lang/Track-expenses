/**
 * UTILS LAYER — دوال مساعدة نقية (Pure Functions)
 * لا تعتمد على أي طبقة أخرى ولا تلمس DOM أو Storage.
 */

import { CATEGORIES } from '../config/constants.js';

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const pad2 = n => String(n).padStart(2, '0');

export const uid = () =>
  (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);

/** يحوّل 'YYYY-MM-DD' إلى Date محلي (بدون انزياح المنطقة الزمنية) */
export function parseISO(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const toISO    = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const todayISO = () => toISO(new Date());

export const fmtNum = n =>
  (Math.round((Number(n) || 0) * 100) / 100)
    .toLocaleString('en-US', { maximumFractionDigits: 2 });

export const escapeHTML = s =>
  String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export const catMeta = (type, name) =>
  (CATEGORIES[type] || []).find(c => c.name === name)
  || { name: name || 'أخرى', icon: '📦', color: '#adb5bd' };
