/**
 * CORE LAYER — منطق الحسابات (Business Logic)
 * دوال نقية بالكامل — لا DOM، لا Storage، لا Side Effects.
 */

import { MONTHS_AR, PERIOD_LABEL } from '../config/constants.js';
import { parseISO, catMeta } from '../utils/helpers.js';

export const Calculator = {

  /** تصفية العمليات حسب الفترة */
  inPeriod(items, period, ref = new Date()) {
    if (period === 'all') return [...items];

    return items.filter(t => {
      const d = parseISO(t.date);
      if (period === 'day')
        return d.getFullYear() === ref.getFullYear()
            && d.getMonth()    === ref.getMonth()
            && d.getDate()     === ref.getDate();
      if (period === 'month')
        return d.getFullYear() === ref.getFullYear()
            && d.getMonth()    === ref.getMonth();
      if (period === 'year')
        return d.getFullYear() === ref.getFullYear();
      return true;
    });
  },

  /** المجاميع الأساسية */
  totals(items) {
    let income = 0, expense = 0;
    for (const t of items) {
      const v = Number(t.amount) || 0;
      if (t.type === 'income') income += v;
      else                     expense += v;
    }
    return {
      income,
      expense,
      balance: income - expense,
      count: items.length,
      rate: income > 0 ? (expense / income) * 100
          : expense > 0 ? 100
          : 0
    };
  },

  /** توزيع المبالغ على الفئات (مرتّب تنازلياً) */
  byCategory(items, type = 'expense') {
    const map = new Map();

    for (const t of items) {
      if (t.type !== type) continue;
      const key = t.category || 'أخرى';
      map.set(key, (map.get(key) || 0) + (Number(t.amount) || 0));
    }

    const total = [...map.values()].reduce((a, b) => a + b, 0);

    return [...map.entries()]
      .map(([name, value]) => {
        const meta = catMeta(type, name);
        return {
          label: name,
          value,
          color: meta.color,
          icon:  meta.icon,
          pct:   total > 0 ? (value / total) * 100 : 0
        };
      })
      .sort((a, b) => b.value - a.value);
  },

  /** تجميع شهري لآخر N أشهر */
  byMonth(items, count = 6) {
    const now = new Date();
    const buckets = [];

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        year:    d.getFullYear(),
        month:   d.getMonth(),
        label:   MONTHS_AR[d.getMonth()],
        income:  0,
        expense: 0
      });
    }

    const index = new Map(buckets.map((b, i) => [`${b.year}-${b.month}`, i]));

    for (const t of items) {
      const d = parseISO(t.date);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (!index.has(k)) continue;
      const b = buckets[index.get(k)];
      b[t.type] += Number(t.amount) || 0;
    }

    return buckets;
  },

  /** وصف نصي للفترة الحالية */
  rangeLabel(period) {
    const now = new Date();
    if (period === 'day')
      return `اليوم · ${now.getDate()} ${MONTHS_AR[now.getMonth()]} ${now.getFullYear()}`;
    if (period === 'month')
      return `${MONTHS_AR[now.getMonth()]} ${now.getFullYear()}`;
    if (period === 'year')
      return `سنة ${now.getFullYear()}`;
    return 'جميع العمليات المسجّلة';
  }
};
