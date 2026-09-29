/**
 * APP LAYER — المتحكم (Controller)
 * مسؤوليته الوحيدة: ربط الأحداث وتنسيق التحديثات بين الطبقات.
 * لا يحوي منطق أعمال ولا يعرض HTML بنفسه.
 */

import { STORAGE_KEYS, DEFAULT_PREFS } from './config/constants.js';
import { Store } from './core/store.js';
import { Calculator } from './core/calculator.js';
import { StorageService } from './services/storage.service.js';
import { CSVService } from './services/csv.service.js';
import { UI } from './ui/ui.js';
import { todayISO } from './utils/helpers.js';

class App {
  #store;
  #state;

  constructor() {
    this.#store = new Store();
    this.#state = this.#loadPrefs();
  }

  /* ---------- Preferences ---------- */
  #loadPrefs() {
    const saved = StorageService.get(STORAGE_KEYS.PREFS, {});
    return { ...DEFAULT_PREFS, ...saved };
  }

  #savePrefs() {
    StorageService.set(STORAGE_KEYS.PREFS, this.#state);
  }

  /* ---------- Rendering pipeline ---------- */
  #render() {
    const all     = this.#store.all();
    const scoped  = Calculator.inPeriod(all, this.#state.period);
    const totals  = Calculator.totals(scoped);
    const byCat   = Calculator.byCategory(scoped, 'expense');
    const buckets = Calculator.byMonth(all, 6);

    UI.renderStats(totals, this.#state.currency, this.#state.period);
    UI.renderDonut(byCat, this.#state.currency, this.#state.period);
    UI.renderRing(totals);
    UI.renderSnapshot(all, this.#state.currency);
    UI.renderBars(buckets);
    UI.renderList(scoped, this.#state.currency);

    UI.els.rangeLabel.textContent = Calculator.rangeLabel(this.#state.period);
  }

  /* ---------- Event bindings ---------- */
  #bind() {
    const E = UI.els;

    // إضافة عملية
    E.form.addEventListener('submit', ev => {
      ev.preventDefault();

      const amount = parseFloat(E.amount.value);
      if (!isFinite(amount) || amount <= 0) {
        UI.toast('⚠️ أدخل مبلغاً صحيحاً أكبر من صفر', 'err');
        E.amount.focus();
        return;
      }

      this.#store.add({
        type:     this.#state.type,
        amount,
        category: E.category.value,
        date:     E.date.value || todayISO(),
        note:     E.note.value
      });

      E.amount.value = '';
      E.note.value   = '';
      E.amount.focus();

      UI.toast(this.#state.type === 'income' ? '✅ تم تسجيل الدخل' : '✅ تم تسجيل المصروف');
    });

    // تبديل النوع (دخل/مصروف)
    E.typeSeg.addEventListener('click', ev => {
      const btn = ev.target.closest('.seg-btn');
      if (!btn) return;
      this.#state.type = btn.dataset.type;
      UI.setActiveType(this.#state.type);
      UI.fillCategoryOptions(this.#state.type);
      this.#savePrefs();
    });

    // تبديل الفترة
    E.periodTabs.addEventListener('click', ev => {
      const btn = ev.target.closest('button');
      if (!btn) return;
      this.#state.period = btn.dataset.period;
      UI.setActivePeriod(this.#state.period);
      this.#savePrefs();
      this.#render();
    });

    // حذف عملية (Event Delegation)
    E.txList.addEventListener('click', ev => {
      const btn = ev.target.closest('[data-del]');
      if (!btn) return;
      const id  = btn.dataset.del;
      const row = btn.closest('.tx');

      if (row) {
        row.style.transition = 'opacity .25s, transform .25s';
        row.style.opacity = '0';
        row.style.transform = 'translateX(40px)';
      }

      setTimeout(() => {
        this.#store.remove(id);
        UI.toast('🗑 تم حذف العملية');
      }, 200);
    });

    // حذف الكل
    E.clearBtn.addEventListener('click', () => {
      if (!this.#store.all().length) {
        UI.toast('لا توجد بيانات لحذفها', 'err');
        return;
      }
      if (confirm('هل أنت متأكد من حذف جميع العمليات؟ لا يمكن التراجع.')) {
        this.#store.clear();
        UI.toast('🗑 تم حذف جميع العمليات');
      }
    });

    // تصدير CSV
    E.exportBtn.addEventListener('click', () => {
      const ok = CSVService.export(this.#store.all());
      UI.toast(ok ? '⬇ تم تصدير ملف CSV بنجاح' : '⚠️ لا توجد بيانات للتصدير',
               ok ? 'ok' : 'err');
    });

    // استيراد CSV
    E.importInput.addEventListener('change', async ev => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        const items = await CSVService.readFile(file);
        if (!items.length) {
          UI.toast('⚠️ لم يتم العثور على بيانات صالحة في الملف', 'err');
        } else {
          this.#store.appendAll(items);
          UI.toast(`⬆ تم استيراد ${items.length} عملية بنجاح`);
        }
      } catch {
        UI.toast('❌ تعذّر قراءة الملف', 'err');
      } finally {
        ev.target.value = '';
      }
    });

    // العملة
    E.currencySel.addEventListener('change', ev => {
      this.#state.currency = ev.target.value;
      this.#savePrefs();
      this.#render();
      UI.toast(`💱 تم تغيير العملة إلى ${this.#state.currency}`);
    });

    // المظهر
    E.themeBtn.addEventListener('click', () => {
      this.#state.theme = this.#state.theme === 'dark' ? 'light' : 'dark';
      UI.setTheme(this.#state.theme);
      this.#savePrefs();
    });

    // اشتراك في تغييرات المخزن
    this.#store.subscribe(() => this.#render());
  }

  /* ---------- Bootstrap ---------- */
  init() {
    UI.init();

    UI.setTheme(this.#state.theme);
    UI.setActiveType(this.#state.type);
    UI.setActivePeriod(this.#state.period);
    UI.fillCategoryOptions(this.#state.type);

    UI.els.currencySel.value = this.#state.currency;
    UI.els.date.value = todayISO();
    UI.els.amount.focus();

    this.#bind();
    this.#render();
  }
}

/* ---------- نقطة الانطلاق ---------- */
document.addEventListener('DOMContentLoaded', () => {
  new App().init();
});
