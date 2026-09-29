/**
 * SERVICE LAYER — رسم المخططات بـ SVG/HTML خالص
 * مسؤوليتها الوحيدة: توليد SVG داخل حاوية معطاة.
 * لا تعرف شيئاً عن البيانات أو الحالة — تستقبل بيانات جاهزة.
 */

import { escapeHTML, fmtNum } from '../utils/helpers.js';

export const ChartService = {

  /** مخطط دائري مجوّف */
  donut(container, data, centerLabel = 'مصروف') {
    if (!data.length) {
      container.innerHTML = `<div class="empty"><span>🍩</span>لا توجد مصاريف في هذه الفترة</div>`;
      return;
    }

    const SIZE = 210, THICK = 26;
    const r  = (SIZE - THICK) / 2 - 4;
    const cx = SIZE / 2, cy = SIZE / 2;
    const C  = 2 * Math.PI * r;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;

    let offset = 0;
    const segments = data.map(d => {
      const len = (d.value / total) * C;
      const seg = `
        <circle class="donut-seg"
          cx="${cx}" cy="${cy}" r="${r}" fill="none"
          stroke="${d.color}" stroke-width="${THICK}"
          stroke-linecap="butt"
          stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}"
          stroke-dashoffset="${(-offset).toFixed(2)}"
          transform="rotate(-90 ${cx} ${cy})">
          <title>${escapeHTML(d.label)}: ${fmtNum(d.value)} (${d.pct.toFixed(1)}%)</title>
        </circle>`;
      offset += len;
      return seg;
    }).join('');

    container.innerHTML = `
      <svg class="donut-svg" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="توزيع المصاريف">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
                stroke="var(--surface-3)" stroke-width="${THICK}"/>
        ${segments}
        <text class="donut-center-value" x="${cx}" y="${cy - 2}" text-anchor="middle"
              dominant-baseline="middle">${fmtNum(total)}</text>
        <text class="donut-center-label" x="${cx}" y="${cy + 20}" text-anchor="middle"
              dominant-baseline="middle">${escapeHTML(centerLabel)}</text>
      </svg>`;
  },

  /** حلقة تقدّم دائرية */
  ring(container, percent) {
    const SIZE = 200, THICK = 17;
    const r  = (SIZE - THICK) / 2 - 2;
    const cx = SIZE / 2, cy = SIZE / 2;
    const C  = 2 * Math.PI * r;

    const p    = Math.max(0, Math.min(percent, 100));
    const dash = (p / 100) * C;

    const color = percent >= 90 ? '#ff5c7c'
                : percent >= 70 ? '#ffc44d'
                : '#22d38a';

    const msg = percent >= 100 ? 'تجاوزت دخلك! ⚠️'
              : percent >= 90  ? 'إنفاق مرتفع جداً'
              : percent >= 70  ? 'إنفاق مرتفع نسبياً'
              : percent > 0    ? 'وضعك المالي جيد'
              : 'لا توجد بيانات';

    container.innerHTML = `
      <svg class="ring-svg" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="نسبة الإنفاق">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
                stroke="var(--surface-3)" stroke-width="${THICK}"/>
        <circle class="ring-progress"
                cx="${cx}" cy="${cy}" r="${r}" fill="none"
                stroke="${color}" stroke-width="${THICK}" stroke-linecap="round"
                stroke-dasharray="${C.toFixed(2)}"
                stroke-dashoffset="${(C - dash).toFixed(2)}"
                transform="rotate(-90 ${cx} ${cy})"/>
        <text class="ring-value" x="${cx}" y="${cy - 4}" text-anchor="middle"
              dominant-baseline="middle">${percent.toFixed(0)}%</text>
        <text class="ring-label" x="${cx}" y="${cy + 22}" text-anchor="middle"
              dominant-baseline="middle">${msg}</text>
      </svg>`;
  },

  /** أعمدة الدخل مقابل المصاريف */
  bars(container, buckets) {
    const max = Math.max(1, ...buckets.flatMap(b => [b.income, b.expense]));

    const h = v => {
      if (v <= 0) return 0;
      return Math.max((v / max) * 100, 2.5);
    };

    container.innerHTML = buckets.map(b => `
      <div class="bar-group">
        <div class="bar-pair">
          <div class="bar in"  style="height:${h(b.income)}%"
               title="دخل ${escapeHTML(b.label)}: ${fmtNum(b.income)}"></div>
          <div class="bar out" style="height:${h(b.expense)}%"
               title="مصاريف ${escapeHTML(b.label)}: ${fmtNum(b.expense)}"></div>
        </div>
        <div class="bar-label">${escapeHTML(b.label)}</div>
      </div>`).join('');
  }
};
