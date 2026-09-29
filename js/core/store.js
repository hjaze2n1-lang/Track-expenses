/**
 * CORE LAYER — نموذج البيانات (Model)
 * مسؤوليتها الوحيدة: إدارة مصفوفة العمليات + إشعار المستمعين.
 * لا تعرف شيئاً عن DOM ولا عن الحسابات.
 */

import { StorageService } from '../services/storage.service.js';
import { STORAGE_KEYS } from '../config/constants.js';
import { uid, todayISO } from '../utils/helpers.js';

export class Store {
  #items = [];
  #listeners = new Set();

  constructor() {
    this.#items = StorageService.get(STORAGE_KEYS.TX, []);
    if (!Array.isArray(this.#items)) this.#items = [];
  }

  #persist() {
    StorageService.set(STORAGE_KEYS.TX, this.#items);
    this.#emit();
  }

  #emit() {
    this.#listeners.forEach(fn => fn(this.all()));
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  all() {
    return [...this.#items];
  }

  add({ type, amount, category, note, date }) {
    this.#items.push({
      id: uid(),
      type: type === 'income' ? 'income' : 'expense',
      amount: Math.abs(Number(amount)) || 0,
      category: category || 'أخرى',
      note: String(note || '').trim(),
      date: date || todayISO()
    });
    this.#persist();
  }

  remove(id) {
    this.#items = this.#items.filter(t => t.id !== id);
    this.#persist();
  }

  clear() {
    this.#items = [];
    this.#persist();
  }

  appendAll(items) {
    this.#items.push(...items);
    this.#persist();
  }
}
