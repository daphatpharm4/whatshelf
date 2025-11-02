const STORAGE_KEY = 'whatshelf.locale';

const messages = {
  en: {
    payButton: 'Pay with M-Pesa',
    stkSent: 'STK sent. Approve on your phone.',
    errorPrefix: 'Error:',
    languageLabel: 'Language',
    offlineNotice: 'You are offline. Orders will sync once the network returns.',
    offlineQueued: 'Payment saved. We will push M-Pesa when you are back online.',
    syncingQueue: 'Syncing offline payments…',
    dashboardTitle: 'Today at a glance',
    revenueToday: 'Revenue today',
    revenueWeek: 'Revenue (7d)',
    revenueMonth: 'Revenue (30d)',
    totalOrders: 'Orders created',
    averageOrderValue: 'Average order value',
    repeatCustomers: 'Repeat customer rate',
    topProducts: 'Top products',
    qty: 'Qty',
    noData: 'No data yet',
    ordersBreakdown: 'Orders breakdown',
    paid: 'Paid',
    pending: 'Pending',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  },
  sw: {
    payButton: 'Lipa kwa M-Pesa',
    stkSent: 'Ombi la STK limetumwa. Idhinisha kwenye simu yako.',
    errorPrefix: 'Hitilafu:',
    languageLabel: 'Lugha',
    offlineNotice: 'Huna mtandao. Oda zitasawazishwa mtandao utakaporejea.',
    offlineQueued: 'Malipo yamehifadhiwa. Tutatuma M-Pesa mtandaoni utakapopatikana.',
    syncingQueue: 'Inasawazisha malipo ya nje ya mtandao…',
    dashboardTitle: 'Muhtasari wa leo',
    revenueToday: 'Mapato ya leo',
    revenueWeek: 'Mapato (siku 7)',
    revenueMonth: 'Mapato (siku 30)',
    totalOrders: 'Oda zilizoundwa',
    averageOrderValue: 'Thamani wastani ya oda',
    repeatCustomers: 'Wateja wanaorudi',
    topProducts: 'Bidhaa zinazouzwa zaidi',
    qty: 'Idadi',
    noData: 'Bado hakuna data',
    ordersBreakdown: 'Muhtasari wa oda',
    paid: 'Zilizolipwa',
    pending: 'Zinasubiri',
    cancelled: 'Zimefutwa',
    refunded: 'Zimerudishiwa',
  },
};

export type Locale = keyof typeof messages;
export type MessageKey = keyof (typeof messages)['en'];

let currentLocale: Locale = loadLocale();

export function t(key: MessageKey) {
  return messages[currentLocale][key];
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  try {
    window?.localStorage?.setItem(STORAGE_KEY, locale);
  } catch (error) {
    console.warn('Unable to persist locale', error);
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

function loadLocale(): Locale {
  try {
    const saved = window?.localStorage?.getItem(STORAGE_KEY) as Locale | null;
    if (saved && saved in messages) {
      return saved;
    }
  } catch (error) {
    console.warn('Unable to read saved locale', error);
  }
  return 'en';
}
