/**
 * SERVICE LAYER — تصدير واستيراد CSV
 * مسؤوليتها الوحيدة: تحويل البيانات إلى/من صيغة CSV.
 */

import { CSV_HEADERS } from '../config/constants.js';
import { uid, toISO, todayISO, parseISO } from '../utils/helpers.js';

/** تقسيم سطر CSV مع مراعاة علامات التنصيص — دالة داخلية نقية */
function splitCSVLine(line) {
  const cells = [];
  let cur = '', inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map(c => c.trim());
}

export const CSVService = {
  /** تصدير المصفوفة إلى ملف CSV (مع BOM لدعم العربية في Excel) */
  export(items) {
    if (!items.length) return false;

    const rows = items.map(t => [
      t.date,
      t.type === 'income' ? 'دخل' : 'مصروف',
      t.category,
      Number(t.amount) || 0,
      t.note || ''
    ]);

    const body = [CSV_HEADERS, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');

    a.href = url;
    a.download = `masarifi-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  },

  /** تحليل نص CSV إلى مصفوفة عمليات صالحة */
  parse(text) {
    const clean = String(text).replace(/^\uFEFF/, '').trim();
    if (!clean) return [];

    const lines = clean.split(/\r?\n/).filter(l => l.trim() !== '');
    const out = [];

    for (let i = 0; i < lines.length; i++) {
      const cells = splitCSVLine(lines[i]);

      if (i === 0 && /التاريخ|date/i.test(cells[0] || '')) continue;
      if (cells.length < 4) continue;

      const [date, typeRaw, category, amountRaw, note = ''] = cells;
      const amount = parseFloat(String(amountRaw).replace(/[^\d.\-]/g, ''));
      if (!isFinite(amount) || amount === 0) continue;

      let iso = String(date).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        const d = new Date(iso);
        iso = isNaN(d) ? todayISO() : toISO(d);
      }

      out.push({
        id: uid(),
        date: iso,
        type: /دخل|income|إيراد|ايراد/i.test(String(typeRaw)) ? 'income' : 'expense',
        category: String(category).trim() || 'أخرى',
        amount: Math.abs(amount),
        note: String(note).trim()
      });
    }
    return out;
  },

  /** قراءة ملف مرفوع وإرجاع العمليات */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = e => resolve(this.parse(e.target.result));
      reader.onerror = () => reject(new Error('تعذّر قراءة الملف'));
      reader.readAsText(file, 'UTF-8');
    });
  }
};
