/**
 * SERVICE LAYER — التخزين المحلي
 * مسؤوليتها الوحيدة: التعامل مع localStorage بشكل آمن.
 */

export const StorageService = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
};
