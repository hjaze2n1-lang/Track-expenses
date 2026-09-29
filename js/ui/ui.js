/**
 * UI LAYER — طبقة العرض
 * مسؤوليتها الوحيدة: تحويل البيانات إلى HTML داخل الـ DOM.
 * لا تحتوي على منطق أعمال ولا تلمس التخزين.
 */

import { CATEGORIES, PERIOD_LABEL } from '../config/constants.js';
import { ChartService } from '../services/chart.service.js';
import { Calculator } from '../core/calculator.js';
import { $, $$, fmtNum, escapeHTML, catMeta, parseISO } from '../utils/helpers.js';

export const UI = {

  els: {},

  init() {
    this.els = {
      currencySel: $('#currencySel'),
      themeBtn:    $('#themeBtn'),
      exportBtn:   $('#exportBtn'),
      importInput: $('#importInput'),
      clearBtn:    $('#clearBtn'),
      periodTabs:  $('#periodTabs'),
      rangeLabel:  $('#rangeLabel'),

      statIncome:     $('#statIncome'),
      statExpense:    $('#statExpense'),
      statBalance:    $('#statBalance'),
      statRate:       $('#statRate'),
      statIncomeSub:  $('#statIncomeSub'),
      statExpenseSub: $('#statExpenseSub'),
      statBalanceSub: $('#statBalanceSub'),
      statRateSub:    $('#statRateSub'),

      typeSeg:  $('#typeSeg'),
      form:     $('#txForm'),
      amount:   $('#amount'),
      category: $('#category'),
      date:     $('#date'),
      note:     $('#note'),

      donut:       $('#donut'),
      legend:      $('#legend'),
      donutPeriod: $('#donutPeriod'),

      ring:     $('#ring'),
      snapshot: $('#snapshot'),

      bars: $('#bars'),

      txList:    $('#txList'),
      listCount: $('#listCount'),
      toast:     $('#toast')
    };
  },

  /* ---------- Helpers ---------- */
  money(n, currency) {
    return `${fmtNum(n)} ${currency}`;
  },

  fillCategoryOptions(type) {
    const list = CATEGORIES[type] || [];
    this.els.category.innerHTML = list
      .map(c => `<option value="${escapeHTML(c.name)}">${c.icon} ${escapeHTML(c.name)}</option>`)
      .join('');
  },

  setActivePeriod(period) {
    $$('#periodTabs button').forEach(b =>
      b.classList.toggle('active', b.dataset.period === period));
  },

  setActiveType(type) {
    $$('#typeSeg .seg-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.type === type));
  },

  setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    this.els.themeBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
  },

  /* ---------- Stats ---------- */
  renderStats(t, currency, period) {
    const label = PERIOD_LABEL[period] || '';

    this.els.statIncome.textContent  = this.money(t.income,  currency);
    this.els.statExpense.textContent = this.money(t.expense, currency);
    this.els.statBalance.textContent = this.money(t.balance, currency);
    this.els.statRate.textContent    = `${t.rate.toFixed(0)}%`;

    this.els.statIncomeSub.textContent  = `${t.count} عملية في ${label}`;
    this.els.statExpenseSub.textContent = t.income > 0
      ? `تم صرف ${t.rate.toFixed(1)}% من الدخل`
      : 'لا يوجد دخل مسجّل';
    this.els.statBalanceSub.textContent = t.balance >= 0
      ? '✅ أنت ضمن الميزانية'
      : '⚠️ تجاوزت ميزانيتك';
    this.els.statRateSub.textContent =
        t.rate >= 90 ? 'إنفاق مرتفع جداً'
      : t.rate >= 70 ? 'إنفاق مرتفع نسبياً'
      : t.rate > 0   ? 'إنفاق متوازن'
      : '—';
  },

  /* ---------- Donut + Legend ---------- */
  renderDonut(byCat, currency, period) {
    ChartService.donut(this.els.donut, byCat, 'إجمالي المصاريف');
    this.els.donutPeriod.textContent = `· ${PERIOD_LABEL[period]}`;

    if (!byCat.length) { this.els.legend.innerHTML = ''; return; }

    this.els.legend.innerHTML = byCat.map(d => `
      <div class="legend-row">
        <span class="legend-dot" style="background:${d.color}"></span>
        <span class="legend-name">${d.icon} ${escapeHTML(d.label)}</span>
        <span class="legend-val">${this.money(d.value, currency)}</span>
        <span class="legend-pct" style="color:${d.color}">${d.pct.toFixed(1)}%</span>
      </div>`).join('');
  },

  /* ---------- Ring ---------- */
  renderRing(t) {
    ChartService.ring(this.els.ring, t.rate);
  },

  /* ---------- Snapshot ---------- */
  renderSnapshot(all, currency) {
    const rows = [
      { label: 'اليوم',     items: Calculator.inPeriod(all, 'day')   },
      { label: 'هذا الشهر', items: Calculator.inPeriod(all, 'month') },
      { label: 'هذه السنة', items: Calculator.inPeriod(all, 'year')  }
    ];

    this.els.snapshot.innerHTML = rows.map(r => {
      const t = Calculator.totals(r.items);
      const cls = t.balance >= 0 ? 'in' : 'out';
      return `<div class="snap-row">
        <span class="snap-label">${r.label}</span>
        <span class="snap-val ${cls}">${this.money(t.balance, currency)}</span>
      </div>`;
    }).join('');
  },

  /* ---------- Bars ---------- */
  renderBars(buckets) {
    ChartService.bars(this.els.bars, buckets);
  },

  /* ---------- Transaction List ---------- */
  renderList(items, currency) {
    this.els.listCount.textContent = `· ${items.length} عملية`;

    if (!items.length) {
      this.els.txList.innerHTML =
        `<div class="empty"><span>📭</span>لا توجد عمليات في هذه الفترة<br>ابدأ بإضافة أول عملية من النموذج</div>`;
      return;
    }

    const sorted = [...items].sort((a, b) => {
      const d = parseISO(b.date) - parseISO(a.date);
      return d !== 0 ? d : String(b.id).localeCompare(String(a.id));
    });

    this.els.txList.innerHTML = sorted.map(t => {
      const meta = catMeta(t.type, t.category);
      const isIncome = t.type === 'income';
      const sign = isIncome ? '+' : '−';

      return `<div class="tx" data-id="${escapeHTML(t.id)}">
        <div class="tx-icon" style="background:${meta.color}22; color:${meta.color}">
          ${meta.icon}
        </div>
        <div class="tx-main">
          <div class="tx-title">${escapeHTML(t.category)}</div>
          <div class="tx-sub">${t.note ? escapeHTML(t.note) + ' · ' : ''}${escapeHTML(t.date)}</div>
        </div>
        <div class="tx-amount ${isIncome ? 'in' : 'out'}">
          ${sign}${fmtNum(t.amount)} ${currency}
        </div>
        <button class="tx-del" data-del="${escapeHTML(t.id)}" title="حذف">✕</button>
      </div>`;
    }).join('');
  },

  /* ---------- Toast ---------- */
  toast(msg, type = 'ok') {
    const el = this.els.toast;
    el.textContent = msg;
    el.className = `toast show ${type}`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { el.className = 'toast'; }, 2600);
  }
};
