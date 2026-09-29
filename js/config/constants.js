/**
 * CONFIG LAYER — الثوابت والبيانات الثابتة
 * لا تعتمد على أي طبقة أخرى.
 */

export const CATEGORIES = {
  expense: [
    { name: 'طعام وشراب', icon: '🍔', color: '#ff6b6b' },
    { name: 'مواصلات',    icon: '🚗', color: '#4dabf7' },
    { name: 'فواتير',     icon: '🧾', color: '#ffd43b' },
    { name: 'تسوّق',      icon: '🛍️', color: '#f783ac' },
    { name: 'صحة',        icon: '💊', color: '#63e6be' },
    { name: 'ترفيه',      icon: '🎬', color: '#b197fc' },
    { name: 'تعليم',      icon: '📚', color: '#74c0fc' },
    { name: 'أخرى',       icon: '📦', color: '#adb5bd' }
  ],
  income: [
    { name: 'راتب',    icon: '💰', color: '#22d38a' },
    { name: 'عمل حر',  icon: '💼', color: '#00e0b8' },
    { name: 'هدية',    icon: '🎁', color: '#ffd43b' },
    { name: 'استثمار', icon: '📈', color: '#4dabf7' },
    { name: 'أخرى',    icon: '✨', color: '#adb5bd' }
  ]
};

export const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
];

export const PERIOD_LABEL = {
  day:   'اليوم',
  month: 'هذا الشهر',
  year:  'هذه السنة',
  all:   'كل الفترات'
};

export const STORAGE_KEYS = {
  TX:    'masarifi.transactions.v1',
  PREFS: 'masarifi.prefs.v1'
};

export const DEFAULT_PREFS = {
  currency: 'ر.س',
  theme:    'dark',
  period:   'month',
  type:     'expense'
};

export const CSV_HEADERS = ['التاريخ', 'النوع', 'الفئة', 'المبلغ', 'ملاحظة'];
